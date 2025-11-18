#!/usr/bin/env python3
"""
Simple GPU test script using the WORKING whisperx-transcription container

Usage:
    modal run test_gpu_simple.py --audio-file audio.mp3 --gpu T4
    modal run test_gpu_simple.py --audio-file audio.mp3 --gpu A10G --language it
"""

import modal
import sys
from pathlib import Path

# GPU configurations
GPU_CONFIGS = {
    "T4": {"gpu": "T4", "cost_per_hour": 0.59},
    "L4": {"gpu": "L4", "cost_per_hour": 0.80},
    "A10G": {"gpu": "A10G", "cost_per_hour": 1.10},
    "L40S": {"gpu": "L40S", "cost_per_hour": 1.95},
    "A100": {"gpu": "A100-40GB", "cost_per_hour": 2.10},
}

app = modal.App("gpu-test-simple")

# Use EXACT SAME image as working whisperx-transcription
cuda_version = "12.4.0"
flavor = "devel"
operating_sys = "ubuntu22.04"
tag = f"{cuda_version}-{flavor}-{operating_sys}"

whisperx_image = (
    modal.Image.from_registry(f"nvidia/cuda:{tag}", add_python="3.11")
    .apt_install(
        "git",
        "build-essential",  # Required to compile PyAV
        "clang",            # Required by PyAV
        "pkg-config",
        "ffmpeg",
        "libavcodec-dev",
        "libavformat-dev",
        "libavutil-dev",
        "libavdevice-dev",
        "libavfilter-dev",
        "libswscale-dev",
        "libswresample-dev"
    )
    .pip_install("wheel", "setuptools")
    .pip_install(
        "torch==2.0.0",
        "torchaudio==2.0.0",
        "numpy<2.0",
        index_url="https://download.pytorch.org/whl/cu118",
    )
    .pip_install(
        "git+https://github.com/m-bain/whisperx.git@v3.2.0",
        "ffmpeg-python",
        "ctranslate2==4.4.0",
        "matplotlib",
    )
    .pip_install("numpy<2.0", force_build=True)
)


def create_test_function(gpu_name: str):
    """Create test function with specific GPU"""
    @app.function(
        image=whisperx_image,
        gpu=gpu_name,
        timeout=3600,
    )
    def test_gpu(gpu_type: str, audio_bytes: bytes, filename: str, language: str = None):
    """Test transcription on specific GPU"""
    import whisperx
    import torch
    import time
    import tempfile
    import os

    start_time = time.time()

    print(f"\n{'='*70}")
    print(f"GPU TEST: {gpu_type}")
    print(f"File: {filename}")
    print(f"Language: {language or 'auto-detect'}")
    print(f"{'='*70}\n")

    # Save audio to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as tmp:
        tmp.write(audio_bytes)
        audio_path = tmp.name

    try:
        # Check GPU
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if device == "cuda":
            gpu_name = torch.cuda.get_device_name(0)
            print(f"✅ GPU detected: {gpu_name}")
            print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB\n")
        else:
            print("❌ No GPU detected!\n")
            return {"error": "No GPU available"}

        # Load model
        print("📥 Loading WhisperX model (medium)...")
        load_start = time.time()
        model = whisperx.load_model(
            "medium",
            device=device,
            compute_type="float16",
            language=language
        )
        load_time = time.time() - load_start
        print(f"   Model loaded in {load_time:.2f}s\n")

        # Transcribe
        print("🎤 Transcribing audio...")
        transcribe_start = time.time()
        audio = whisperx.load_audio(audio_path)
        result = model.transcribe(audio, batch_size=16, language=language)
        transcribe_time = time.time() - transcribe_start

        detected_language = result.get("language", language or "unknown")
        print(f"   Language: {detected_language}")
        print(f"   Transcription: {transcribe_time:.2f}s\n")

        # Align
        print("🔄 Aligning transcription...")
        align_start = time.time()
        model_a, metadata = whisperx.load_align_model(
            language_code=detected_language,
            device=device
        )
        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            device,
            return_char_alignments=False
        )
        align_time = time.time() - align_start
        print(f"   Alignment: {align_time:.2f}s\n")

        # Calculate stats
        total_time = time.time() - start_time
        audio_duration = len(audio) / 16000  # 16kHz sample rate
        speed_ratio = audio_duration / transcribe_time

        # Calculate cost (rough estimate)
        cost = GPU_CONFIGS.get(gpu_type, {}).get("cost_per_hour", 0)
        estimated_cost = (total_time / 3600) * cost

        print(f"{'='*70}")
        print(f"RESULTS:")
        print(f"  Audio duration: {audio_duration:.1f}s ({audio_duration/60:.1f} min)")
        print(f"  Total time: {total_time:.1f}s")
        print(f"  Speed: {speed_ratio:.1f}x realtime")
        print(f"  Estimated cost: ${estimated_cost:.4f}")
        print(f"  Cost per minute: ${estimated_cost / (audio_duration/60):.4f}")
        print(f"{'='*70}\n")

        return {
            "gpu": gpu_type,
            "audio_duration": audio_duration,
            "load_time": load_time,
            "transcribe_time": transcribe_time,
            "align_time": align_time,
            "total_time": total_time,
            "speed_ratio": speed_ratio,
            "estimated_cost": estimated_cost,
            "cost_per_minute": estimated_cost / (audio_duration/60),
            "language": detected_language,
            "segments_count": len(result["segments"])
        }
    finally:
        # Cleanup temp file
        if os.path.exists(audio_path):
            os.remove(audio_path)

    return test_gpu


@app.local_entrypoint()
def main(audio_file: str, gpu: str = "A10G", language: str = None):
    """
    Test GPU transcription with local audio file

    Args:
        audio_file: Path to local audio file
        gpu: GPU type (T4, L4, A10G, L40S, A100)
        language: Language code (it, en, etc.) or None for auto-detect
    """
    import os

    if not os.path.exists(audio_file):
        print(f"❌ Error: File not found: {audio_file}")
        sys.exit(1)

    if gpu not in GPU_CONFIGS:
        print(f"❌ Error: Invalid GPU type: {gpu}")
        print(f"   Valid options: {', '.join(GPU_CONFIGS.keys())}")
        sys.exit(1)

    print(f"\n🚀 Testing {gpu} with {Path(audio_file).name}")
    print(f"   Cost: ${GPU_CONFIGS[gpu]['cost_per_hour']:.2f}/hour\n")

    # Read file
    print(f"📤 Reading audio file...")
    with open(audio_file, "rb") as f:
        audio_bytes = f.read()
    print(f"   ✅ Read {len(audio_bytes) / 1024 / 1024:.1f} MB\n")

    # Create function with specific GPU
    test_func = create_test_function(GPU_CONFIGS[gpu]["gpu"])

    # Run test
    result = test_func.remote(gpu, audio_bytes, Path(audio_file).name, language)

    if "error" in result:
        print(f"❌ Test failed: {result['error']}")
    else:
        print(f"\n✅ Test completed successfully!")
        print(f"   Check Modal dashboard for detailed logs")
        print(f"   https://modal.com/apps")
