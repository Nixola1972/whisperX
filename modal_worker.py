"""
WhisperX Transcription Worker on Modal.com

This worker processes audio transcriptions using WhisperX with GPU acceleration.
Features:
- WhisperX large-v3 model for transcription
- Speaker diarization with pyannote.audio
- Auto-upload results to Supabase
- Handles multiple languages
- Error handling and retry logic
"""

import modal
import os
from pathlib import Path

# Define Modal app
app = modal.App("whisperx-transcription")

# Create Modal image with all dependencies
# BASATO SU ESEMPIO UFFICIALE MODAL: https://modal.com/docs/examples/whisperx
cuda_version = "12.4.0"  # should be no greater than host CUDA version
flavor = "devel"  # includes full CUDA toolkit
operating_sys = "ubuntu22.04"
tag = f"{cuda_version}-{flavor}-{operating_sys}"

whisperx_image = (
    modal.Image.from_registry(f"nvidia/cuda:{tag}", add_python="3.11")
    .apt_install(
        "git",
        "pkg-config",           # Required for building PyAV
        "build-essential",      # Compiler and build tools
        "gcc",                  # C compiler
        "ffmpeg",               # FFmpeg runtime
        "libavcodec-dev",       # FFmpeg development libraries
        "libavformat-dev",      # Required for compiling PyAV from source
        "libavutil-dev",        # (PyAV is a dependency of ffmpeg-python)
        "libavdevice-dev",      # Required for PyAV
        "libavfilter-dev",      # Required for PyAV
        "libswscale-dev",
        "libswresample-dev"
    )
    # Installa wheel e setuptools PRIMA (dal PyPI standard)
    .pip_install("wheel", "setuptools")
    # Installa PyAV PRIMA di tutto (pre-compilato o compilato con tutte le deps)
    .pip_install("av==10.0.0")
    # Installa PyTorch 2.0.0 (versione testata da Modal)
    .pip_install(
        "torch==2.0.0",
        "torchaudio==2.0.0",
        "numpy<2.0",
        index_url="https://download.pytorch.org/whl/cu118",
    )
    # Installa WhisperX 3.2.0 + ctranslate2 4.4.0 (stack testato)
    .pip_install(
        "git+https://github.com/m-bain/whisperx.git@v3.2.0",
        "ffmpeg-python",
        "ctranslate2==4.4.0",
        "supabase",
        "fastapi",
        "pydantic",
    )
)

# Supabase secrets (configured via: modal secret create supabase-credentials)
supabase_secret = modal.Secret.from_name("supabase-credentials")


@app.function(
    image=whisperx_image,
    gpu="any",  # Try to get any available GPU, fallback to CPU if none available
    timeout=3600,  # 1 hour max
    secrets=[supabase_secret],
    memory=16384,  # 16GB RAM
    env={
        "LD_LIBRARY_PATH": "/usr/local/cuda/lib64:/usr/local/lib/python3.11/site-packages/torch/lib"
    }
)
def transcribe_audio(
    transcript_id: str,
    file_path: str,
    user_id: str,
    language: str = None,
    enable_diarization: bool = True,
):
    """
    Transcribe audio file using WhisperX with GPU acceleration.

    Args:
        transcript_id: Database transcript record ID
        file_path: Path to audio file in Supabase Storage (e.g., "user_id/file.mp3")
        user_id: User ID for tracking
        language: Optional language code (auto-detect if None)
        enable_diarization: Enable speaker diarization (default: True)

    Returns:
        dict: Transcription results with segments and speakers
    """
    import whisperx
    import torch
    from supabase import create_client
    import tempfile
    import json
    from datetime import datetime

    print(f"[INFO] Starting transcription for transcript_id: {transcript_id}")
    print(f"[INFO] File path: {file_path}")
    print(f"[INFO] Enable diarization: {enable_diarization}")

    # Initialize Supabase client
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    try:
        # Update status to processing
        supabase.table("transcripts").update({
            "status": "processing",
            "processedAt": datetime.utcnow().isoformat()
        }).eq("id", transcript_id).execute()

        # Download audio file from Supabase Storage
        print("[INFO] Downloading audio file from Supabase...")
        bucket_name = "audio-temp"
        response = supabase.storage.from_(bucket_name).download(file_path)

        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as tmp_file:
            tmp_file.write(response)
            audio_path = tmp_file.name

        print(f"[INFO] Audio downloaded to: {audio_path}")

        # Detect device (GPU should be available on Modal A10G)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        print(f"[INFO] Using device: {device}, compute_type: {compute_type}")

        # Load WhisperX model
        print("[INFO] Loading WhisperX model (large-v3)...")
        model = whisperx.load_model(
            "large-v3",
            device=device,
            compute_type=compute_type,
            language=language
        )

        # Transcribe audio
        print("[INFO] Running transcription...")
        audio = whisperx.load_audio(audio_path)
        result = model.transcribe(
            audio,
            batch_size=16,  # Larger batch for A10G
            language=language
        )

        detected_language = result.get("language", language or "unknown")
        print(f"[INFO] Detected language: {detected_language}")

        # Align whisper output
        print("[INFO] Aligning transcription...")
        model_a, metadata = whisperx.load_align_model(
            language_code=detected_language,
            device=device
        )
        result_aligned = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            device
        )

        segments = result_aligned["segments"]
        full_text = " ".join([seg.get("text", "") for seg in segments])

        # Speaker diarization (if enabled)
        speakers_data = None
        if enable_diarization:
            try:
                print("[INFO] Running speaker diarization...")
                diarize_model = whisperx.DiarizationPipeline(
                    use_auth_token=None,  # No HuggingFace token needed for pyannote 3.0+
                    device=device
                )
                diarize_segments = diarize_model(audio)
                result_diarized = whisperx.assign_word_speakers(
                    diarize_segments,
                    result_aligned
                )
                segments = result_diarized["segments"]

                # Extract unique speakers
                speakers = set()
                for seg in segments:
                    if "speaker" in seg:
                        speakers.add(seg["speaker"])

                speakers_data = {
                    "count": len(speakers),
                    "labels": sorted(list(speakers))
                }
                print(f"[INFO] Detected {len(speakers)} speakers: {speakers}")

            except Exception as e:
                print(f"[WARNING] Diarization failed: {e}")
                print("[INFO] Continuing without speaker labels...")

        # Calculate duration
        duration_seconds = segments[-1]["end"] if segments else 0

        # Prepare segments for database (JSON serializable)
        segments_json = []
        for seg in segments:
            segments_json.append({
                "start": seg.get("start"),
                "end": seg.get("end"),
                "text": seg.get("text", ""),
                "speaker": seg.get("speaker", None),
                "words": seg.get("words", [])
            })

        # Upload full transcript text to Supabase Storage
        print("[INFO] Uploading transcript to Storage...")
        transcript_filename = f"{user_id}/{transcript_id}.json"
        transcript_data = {
            "text": full_text,
            "segments": segments_json,
            "language": detected_language,
            "duration": duration_seconds,
            "speakers": speakers_data
        }

        supabase.storage.from_("transcripts").upload(
            transcript_filename,
            json.dumps(transcript_data, indent=2).encode(),
            {
                "content-type": "application/json",
                "upsert": "true"
            }
        )

        # Update database record
        print("[INFO] Updating database...")
        supabase.table("transcripts").update({
            "status": "completed",
            "language": detected_language,
            "durationSeconds": int(duration_seconds),
            "processedAt": datetime.utcnow().isoformat(),
            "transcriptText": full_text[:5000],  # Store first 5000 chars in DB
            "segments": segments_json,
            "speakers": speakers_data
        }).eq("id", transcript_id).execute()

        # Cleanup temporary file
        os.remove(audio_path)

        print(f"[SUCCESS] Transcription completed for {transcript_id}")

        return {
            "success": True,
            "transcript_id": transcript_id,
            "language": detected_language,
            "duration": duration_seconds,
            "speakers": speakers_data,
            "segments_count": len(segments_json)
        }

    except Exception as e:
        error_msg = str(e)
        print(f"[ERROR] Transcription failed: {error_msg}")

        # Update status to failed
        try:
            supabase.table("transcripts").update({
                "status": "failed",
                "errorMessage": error_msg[:500],
                "processedAt": datetime.utcnow().isoformat()
            }).eq("id", transcript_id).execute()
        except:
            pass

        return {
            "success": False,
            "transcript_id": transcript_id,
            "error": error_msg
        }


@app.function(
    image=whisperx_image,
    secrets=[supabase_secret]
)
@modal.asgi_app()
def transcribe_webhook():
    """
    Webhook endpoint to trigger transcription.

    Call this from your Next.js app after file upload:
    POST https://your-modal-app.modal.run
    {
        "transcript_id": "abc123",
        "file_path": "user_id/audio.mp3",
        "user_id": "user_id",
        "language": "it",  // optional
        "enable_diarization": true  // optional
    }
    """
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    web_app = FastAPI()

    # Configure CORS to allow requests from your Next.js app
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, replace with your domain
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class TranscribeRequest(BaseModel):
        transcript_id: str
        file_path: str
        user_id: str
        language: str | None = None
        enable_diarization: bool = True

    @web_app.post("/")
    async def webhook(request: TranscribeRequest):
        print(f"[WEBHOOK] Received request for transcript: {request.transcript_id}")
        print(f"[WEBHOOK] File path: {request.file_path}")
        print(f"[WEBHOOK] User ID: {request.user_id}")

        if not request.transcript_id or not request.file_path or not request.user_id:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: transcript_id, file_path, user_id"
            )

        try:
            # Spawn async transcription job
            print(f"[WEBHOOK] Spawning transcription job...")
            call = transcribe_audio.spawn(
                request.transcript_id,
                request.file_path,
                request.user_id,
                request.language,
                request.enable_diarization
            )
            print(f"[WEBHOOK] ✓ Transcription job spawned successfully: {call}")

            return {
                "status": "queued",
                "transcript_id": request.transcript_id,
                "message": "Transcription job started",
                "call_id": str(call.object_id) if hasattr(call, 'object_id') else None
            }
        except Exception as e:
            print(f"[WEBHOOK ERROR] Failed to spawn job: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to start transcription: {str(e)}"
            )

    return web_app


# Local testing
@app.local_entrypoint()
def test_transcription(
    transcript_id: str = "test-123",
    file_path: str = "test/sample.mp3"
):
    """
    Test transcription locally:
    modal run modal_worker.py --transcript-id test-123 --file-path test/sample.mp3
    """
    result = transcribe_audio.remote(
        transcript_id=transcript_id,
        file_path=file_path,
        user_id="test-user",
        language=None,
        enable_diarization=True
    )
    print(f"\n[RESULT] {result}")
