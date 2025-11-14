"""
Modal.com Worker for WhisperX Transcription
Deployment: modal deploy transcribe.py
"""

import modal
import os
import tempfile
import json
from pathlib import Path

# Create Modal app
app = modal.App("whisperx-transcription")

# Container image with WhisperX and dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "whisperx @ git+https://github.com/m-bain/whisperx.git",
        "torch==2.1.0",
        "torchaudio==2.1.0",
        "faster-whisper==1.0.0",
        "pyannote.audio==3.1.1",
    )
)

# Hugging Face token secret (for diarization)
huggingface_secret = modal.Secret.from_name("huggingface-token")


@app.function(
    image=image,
    gpu=modal.gpu.A100(size="40GB"),  # A100 40GB for WhisperX
    timeout=600,  # 10 minutes max
    secrets=[huggingface_secret],
    concurrency_limit=10,  # Max 10 concurrent transcriptions
)
def transcribe(
    audio_bytes: bytes,
    language: str | None = None,
    compute_type: str = "float16",
    batch_size: int = 16,
) -> dict:
    """
    Transcribe audio using WhisperX with diarization

    Args:
        audio_bytes: Audio file as bytes
        language: Language code (e.g., 'it', 'en') or None for auto-detect
        compute_type: 'float16' or 'int8'
        batch_size: Batch size for processing (higher = faster but more VRAM)

    Returns:
        {
            "text": "full transcript text",
            "language": "detected language",
            "segments": [...],
            "duration": seconds
        }
    """
    import whisperx
    import gc

    # Save audio to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as f:
        f.write(audio_bytes)
        audio_path = f.name

    try:
        device = "cuda"

        print(f"Loading audio from temp file...")
        audio = whisperx.load_audio(audio_path)

        # 1. Transcribe with Whisper
        print(f"Loading Whisper model (large-v2)...")
        model = whisperx.load_model(
            "large-v2",
            device=device,
            compute_type=compute_type,
        )

        print(f"Transcribing audio (batch_size={batch_size})...")
        result = model.transcribe(
            audio,
            batch_size=batch_size,
            language=language,
        )

        detected_language = result["language"]
        print(f"Detected language: {detected_language}")

        # Clear GPU memory
        del model
        gc.collect()

        # 2. Align whisper output for word-level timestamps
        print(f"Loading alignment model for {detected_language}...")
        try:
            model_a, metadata = whisperx.load_align_model(
                language_code=detected_language,
                device=device
            )

            print("Aligning transcript for word-level timestamps...")
            result = whisperx.align(
                result["segments"],
                model_a,
                metadata,
                audio,
                device=device,
                return_char_alignments=False,
            )

            del model_a
            gc.collect()
        except Exception as e:
            print(f"Alignment failed (not critical): {e}")
            # Continue without alignment

        # 3. Speaker Diarization
        print("Loading diarization model...")
        try:
            diarize_model = whisperx.DiarizationPipeline(
                use_auth_token=os.environ.get("HF_TOKEN"),
                device=device
            )

            print("Performing speaker diarization...")
            diarize_segments = diarize_model(audio)

            print("Assigning speakers to words...")
            result = whisperx.assign_word_speakers(diarize_segments, result)

            del diarize_model
            gc.collect()
        except Exception as e:
            print(f"Diarization failed (not critical): {e}")
            # Continue without diarization

        # 4. Format output
        full_text = " ".join([seg["text"].strip() for seg in result["segments"]])

        # Calculate duration
        duration = len(audio) / 16000  # WhisperX uses 16kHz sample rate

        # Clean up segments for JSON serialization
        segments = []
        for seg in result["segments"]:
            segment = {
                "start": round(seg["start"], 2),
                "end": round(seg["end"], 2),
                "text": seg["text"].strip(),
            }

            # Add speaker if available
            if "speaker" in seg:
                segment["speaker"] = seg["speaker"]

            # Add word-level timestamps if available
            if "words" in seg:
                segment["words"] = [
                    {
                        "word": w["word"],
                        "start": round(w["start"], 2),
                        "end": round(w["end"], 2),
                    }
                    for w in seg["words"]
                ]

            segments.append(segment)

        return {
            "text": full_text,
            "language": detected_language,
            "segments": segments,
            "duration": round(duration, 2),
        }

    finally:
        # Cleanup temp file
        try:
            os.unlink(audio_path)
        except:
            pass


@app.local_entrypoint()
def main():
    """Test transcription locally"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: modal run transcribe.py <audio_file>")
        return

    audio_file = sys.argv[1]

    if not Path(audio_file).exists():
        print(f"File not found: {audio_file}")
        return

    print(f"Transcribing {audio_file}...")

    with open(audio_file, "rb") as f:
        audio_bytes = f.read()

    result = transcribe.remote(audio_bytes)

    print("\n" + "="*80)
    print("TRANSCRIPTION RESULT")
    print("="*80)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # Save to JSON
    output_file = Path(audio_file).with_suffix('.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to: {output_file}")


# Web endpoint (optional - for HTTP access)
@app.function(image=image)
@modal.web_endpoint(method="POST")
def transcribe_web(audio_bytes: bytes):
    """
    HTTP endpoint for transcription
    POST with audio file in body
    """
    return transcribe.remote(audio_bytes)
