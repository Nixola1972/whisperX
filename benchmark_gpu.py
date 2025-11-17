"""
GPU Benchmark Script for WhisperX on Modal
Tests different GPU types to find the best cost/performance ratio
"""

import modal
import json
from datetime import datetime
import os

app = modal.App("whisperx-gpu-benchmark")

# Same image as production
whisperx_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "git",
        "build-essential",
        "clang",
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
    .env({"TORCH_VERSION_FIX": "v3"})  # Cache invalidation
    .pip_install("numpy==1.26.4")
    # Install whisperx FIRST (it will install torch/torchaudio as dependencies)
    .pip_install(
        "git+https://github.com/m-bain/whisperx.git@v3.2.0",
        "ffmpeg-python",
        "ctranslate2==4.4.0",
        "supabase",
        "matplotlib",
    )
    # Then DOWNGRADE torch/torchaudio to compatible versions
    .pip_install(
        "torch==1.13.1",
        "torchaudio==0.13.1",
        index_url="https://download.pytorch.org/whl/cu117",
        force_build=True
    )
    .pip_install("numpy==1.26.4", force_build=True)
)


def run_benchmark(gpu_name: str, cost_per_hour: float, file_path: str, language: str):
    """Core benchmark logic (runs on GPU)"""
    import whisperx
    import torch
    from supabase import create_client
    import tempfile
    import time

    start_time = time.time()

    print(f"\n{'='*60}")
    print(f"BENCHMARK: {gpu_name} (${cost_per_hour}/hr)")
    print(f"{'='*60}\n")

    # Initialize Supabase
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    # Download test audio
    print(f"[{gpu_name}] Downloading test audio...")
    download_start = time.time()
    response = supabase.storage.from_("audio-temp").download(file_path)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as tmp_file:
        tmp_file.write(response)
        audio_path = tmp_file.name
    download_time = time.time() - download_start
    print(f"[{gpu_name}] Download: {download_time:.2f}s")

    # Check GPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

    if device == "cuda":
        gpu_info = torch.cuda.get_device_name(0)
        print(f"[{gpu_name}] GPU Detected: {gpu_info}")

    # Load model
    print(f"[{gpu_name}] Loading WhisperX model (medium)...")
    model_start = time.time()
    model = whisperx.load_model(
        "medium",
        device=device,
        compute_type=compute_type,
        language=language
    )
    model_time = time.time() - model_start
    print(f"[{gpu_name}] Model load: {model_time:.2f}s")

    # Transcription
    print(f"[{gpu_name}] Running transcription...")
    transcribe_start = time.time()
    result = model.transcribe(audio_path, batch_size=16, language=language)
    transcribe_time = time.time() - transcribe_start
    print(f"[{gpu_name}] Transcription: {transcribe_time:.2f}s")

    # Alignment
    print(f"[{gpu_name}] Aligning transcription...")
    align_start = time.time()
    model_a, metadata = whisperx.load_align_model(
        language_code=language,
        device=device
    )
    result_aligned = whisperx.align(
        result["segments"],
        model_a,
        metadata,
        audio_path,
        device,
        return_char_alignments=False
    )
    align_time = time.time() - align_start
    print(f"[{gpu_name}] Alignment: {align_time:.2f}s")

    # Skip diarization to speed up benchmark
    diarization_time = 0
    print(f"[{gpu_name}] Skipping diarization for benchmark speed")

    # Cleanup
    os.remove(audio_path)

    # Calculate metrics
    total_time = time.time() - start_time
    processing_time = transcribe_time + align_time + diarization_time
    cost = (total_time / 3600) * cost_per_hour

    # Get audio duration
    segments = result_aligned.get("segments", [])
    audio_duration = segments[-1]["end"] if segments else 0
    speed_ratio = audio_duration / processing_time if processing_time > 0 else 0

    results = {
        "gpu_name": gpu_name,
        "cost_per_hour": cost_per_hour,
        "audio_duration_seconds": audio_duration,
        "audio_duration_minutes": audio_duration / 60,
        "timings": {
            "download": round(download_time, 2),
            "model_load": round(model_time, 2),
            "transcription": round(transcribe_time, 2),
            "alignment": round(align_time, 2),
            "diarization": round(diarization_time, 2),
            "processing_total": round(processing_time, 2),
            "total_time": round(total_time, 2),
        },
        "cost": round(cost, 4),
        "speed_ratio": round(speed_ratio, 2),
        "cost_per_minute_audio": round(cost / (audio_duration / 60), 4) if audio_duration > 0 else 0,
    }

    print(f"\n{'='*60}")
    print(f"RESULTS: {gpu_name}")
    print(f"{'='*60}")
    print(f"Audio Duration: {audio_duration/60:.1f} minutes")
    print(f"Processing Time: {processing_time:.1f}s")
    print(f"Speed Ratio: {speed_ratio:.1f}x realtime")
    print(f"Total Cost: ${cost:.4f}")
    print(f"Cost per Minute: ${results['cost_per_minute_audio']:.4f}/min")
    print(f"{'='*60}\n")

    return results


# Define separate functions for each GPU type
@app.function(
    image=whisperx_image,
    gpu="T4",
    timeout=600,
    secrets=[modal.Secret.from_name("supabase-credentials")],
    memory=8192,
)
def benchmark_t4(file_path: str, language: str):
    return run_benchmark("T4", 0.59, file_path, language)


@app.function(
    image=whisperx_image,
    gpu="L4",
    timeout=600,
    secrets=[modal.Secret.from_name("supabase-credentials")],
    memory=8192,
)
def benchmark_l4(file_path: str, language: str):
    return run_benchmark("L4", 0.80, file_path, language)


@app.function(
    image=whisperx_image,
    gpu="A10G",
    timeout=600,
    secrets=[modal.Secret.from_name("supabase-credentials")],
    memory=8192,
)
def benchmark_a10g(file_path: str, language: str):
    return run_benchmark("A10G", 1.10, file_path, language)


@app.function(
    image=whisperx_image,
    gpu="L40S",
    timeout=600,
    secrets=[modal.Secret.from_name("supabase-credentials")],
    memory=8192,
)
def benchmark_l40s(file_path: str, language: str):
    return run_benchmark("L40S", 1.95, file_path, language)


@app.function(
    image=whisperx_image,
    gpu="A100",
    timeout=600,
    secrets=[modal.Secret.from_name("supabase-credentials")],
    memory=8192,
)
def benchmark_a100(file_path: str, language: str):
    return run_benchmark("A100-40GB", 2.10, file_path, language)


@app.local_entrypoint()
def main(
    file_path: str = "public/1763398454761-Marven_magazzino.m4a",
    language: str = "it",
    output_file: str = "benchmark_results.json"
):
    """
    Run benchmark across all GPU types

    Args:
        file_path: Path to audio file in Supabase Storage
        language: Language code (default: it)
        output_file: Output JSON file for results
    """
    print("\n" + "="*60)
    print("WhisperX GPU Benchmark Suite")
    print("="*60)
    print(f"Test file: {file_path}")
    print(f"Language: {language}")
    print(f"Testing 5 GPU configurations...")
    print("="*60 + "\n")

    # GPU benchmarks with their functions
    benchmarks = [
        ("T4", benchmark_t4),
        ("L4", benchmark_l4),
        ("A10G", benchmark_a10g),
        ("L40S", benchmark_l40s),
        ("A100-40GB", benchmark_a100),
    ]

    all_results = []

    for i, (gpu_name, benchmark_func) in enumerate(benchmarks):
        print("\n" + "="*80)
        print(f"📊 TEST {i+1}/5: {gpu_name}")
        print("="*80)

        # Get GPU config info
        gpu_costs = {
            "T4": 0.59, "L4": 0.80, "A10G": 1.10,
            "L40S": 1.95, "A100-40GB": 2.10
        }
        cost_per_hour = gpu_costs.get(gpu_name, 0)

        print(f"\n💰 GPU: {gpu_name}")
        print(f"💵 Costo: ${cost_per_hour}/ora")
        print(f"📍 Dashboard Modal: https://modal.com/nicola-marcocchio")
        print(f"\n⏳ Il test partirà tra 3 secondi...")
        print("   Dopo il test, controlla il costo reale nella dashboard Modal")

        # Wait 3 seconds to give user time to read
        import time as time_module
        time_module.sleep(3)

        print(f"\n🚀 Avvio test {gpu_name}...\n")

        try:
            result = benchmark_func.remote(file_path, language)
            all_results.append(result)

            print(f"\n✅ {gpu_name} completato!")
            print(f"⏱️  Tempo totale: {result['timings']['total_time']}s")
            print(f"⚡ Velocità: {result['speed_ratio']}x realtime")
            print(f"💰 Costo teorico: ${result['cost']:.4f}")
            print(f"\n🔍 CONTROLLA ORA IL COSTO REALE SU:")
            print(f"   https://modal.com/nicola-marcocchio/usage")

        except Exception as e:
            print(f"\n❌ {gpu_name} fallito: {e}")
            all_results.append({
                "gpu_name": gpu_name,
                "error": str(e)
            })

        # Ask to continue (except for last one)
        if i < len(benchmarks) - 1:
            print("\n" + "="*80)
            response = input(f"\n▶️  Premi INVIO per testare {benchmarks[i+1][0]} (o 'q' per uscire): ")
            if response.lower() == 'q':
                print("\n⏹️  Benchmark interrotto dall'utente")
                break
        else:
            print("\n✅ Tutti i test completati!")

    # Sort by cost per minute (best value first)
    valid_results = [r for r in all_results if "error" not in r]
    valid_results.sort(key=lambda x: x.get("cost_per_minute_audio", float('inf')))

    # Print summary
    print("\n" + "="*80)
    print("BENCHMARK SUMMARY - Sorted by Best Value (Cost per Minute)")
    print("="*80)
    print(f"{'GPU':<15} {'Speed':<10} {'Cost':<10} {'$/min':<10} {'Total Time':<12} {'Winner'}")
    print("-"*80)

    for i, result in enumerate(valid_results):
        winner = "🏆" if i == 0 else ""
        print(
            f"{result['gpu_name']:<15} "
            f"{result['speed_ratio']:<10.1f}x "
            f"${result['cost']:<9.4f} "
            f"${result['cost_per_minute_audio']:<9.4f} "
            f"{result['timings']['total_time']:<12.1f}s "
            f"{winner}"
        )

    print("="*80 + "\n")

    # Save results to JSON
    output_data = {
        "benchmark_date": datetime.utcnow().isoformat(),
        "test_file": file_path,
        "language": language,
        "results": all_results,
        "winner": valid_results[0] if valid_results else None
    }

    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)

    print(f"📊 Results saved to: {output_file}")

    if valid_results:
        winner = valid_results[0]
        print(f"\n🏆 WINNER: {winner['gpu_name']}")
        print(f"   - Speed: {winner['speed_ratio']:.1f}x realtime")
        print(f"   - Cost: ${winner['cost']:.4f}")
        print(f"   - Cost per minute: ${winner['cost_per_minute_audio']:.4f}/min")
