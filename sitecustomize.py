"""
sitecustomize.py - Executed automatically by Python at startup

This file is installed in site-packages and runs before any user code.
We use it to monkey-patch torchaudio for pyannote.audio compatibility.
"""

import sys

def patch_torchaudio():
    """Add set_audio_backend() to torchaudio if missing."""
    try:
        import torchaudio

        if not hasattr(torchaudio, 'set_audio_backend'):
            # torchaudio 2.0+ removed this method, add it back as no-op
            def set_audio_backend(backend):
                """No-op for backward compatibility with pyannote.audio."""
                pass

            torchaudio.set_audio_backend = set_audio_backend
            print("[sitecustomize] ✅ Patched torchaudio.set_audio_backend()", file=sys.stderr)
    except ImportError:
        # torchaudio not installed yet, skip
        pass

# Apply patch immediately when Python starts
patch_torchaudio()
