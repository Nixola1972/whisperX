# Test GPU Semplice per WhisperX

Script semplice per testare diverse GPU con WhisperX.

## Uso

```bash
# Test con GPU A10G (default)
python test_gpu_simple.py mio_audio.mp3

# Test con GPU T4
python test_gpu_simple.py mio_audio.mp3 --gpu T4

# Test con GPU A10G e lingua italiana
python test_gpu_simple.py mio_audio.mp3 --gpu A10G --language it

# Test con GPU A100
python test_gpu_simple.py mio_audio.mp3 --gpu A100 --language it
```

## GPU Disponibili

| GPU | Costo/ora | VRAM | Note |
|-----|-----------|------|------|
| T4 | $0.59 | 16GB | Economico, lento |
| L4 | $0.80 | 24GB | Mid-range |
| A10G | $1.10 | 24GB | ⭐ Miglior rapporto qualità/prezzo |
| L40S | $1.95 | 48GB | High-end |
| A100 | $2.10 | 40GB | Ultra veloce, costoso |

## Output

Lo script mostra:
- Tempo di caricamento modello
- Tempo di trascrizione
- Tempo di allineamento
- Velocità (es. 11x realtime)
- **Costo stimato**
- **Costo per minuto di audio**

## Verifica Costo Reale

1. Esegui il test
2. Vai su https://modal.com/nicola-marcocchio
3. Controlla "Usage" → cerca l'esecuzione
4. Vedi il costo REALE (più accurato della stima)

## Esempio Output

```
🚀 Testing A10G with audio.mp3
   Cost: $1.10/hour

📤 Uploading audio.mp3 to Modal volume...
   ✅ Uploaded to /data/audio.mp3

======================================================================
GPU TEST: A10G
File: /data/audio.mp3
Language: it
======================================================================

✅ GPU detected: NVIDIA A10G
   VRAM: 23.7 GB

📥 Loading WhisperX model (medium)...
   Model loaded in 8.2s

🎤 Transcribing audio...
   Language: it
   Transcription: 15.3s

🔄 Aligning transcription...
   Alignment: 3.1s

======================================================================
RESULTS:
  Audio duration: 180.0s (3.0 min)
  Total time: 28.1s
  Speed: 11.8x realtime
  Estimated cost: $0.0086
  Cost per minute: $0.0029
======================================================================

✅ Test completed successfully!
```

## Note

- Usa la stessa configurazione del container `whisperx-transcription` funzionante
- File audio caricato dal tuo PC locale
- Non richiede Supabase
- Puoi testare tutte le GPU una alla volta
- Risultati immediati nella console
