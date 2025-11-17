#!/usr/bin/env python3
"""
Monkey-patch for torchaudio to fix pyannote.audio compatibility.

torchaudio 2.0+ removed set_audio_backend() method, but pyannote.audio
(used by whisperx) still tries to call it during import.

This script adds a no-op set_audio_backend() function to torchaudio.
"""

import importlib.util
import sys

# Find torchaudio __init__.py
spec = importlib.util.find_spec('torchaudio')
if spec is None or spec.origin is None:
    print("ERROR: torchaudio not found!")
    sys.exit(1)

torchaudio_init = spec.origin
print(f"Found torchaudio at: {torchaudio_init}")

# Add set_audio_backend() function
patch_code = '''

# Monkey-patch for pyannote.audio compatibility
# Added by patch_torchaudio.py during Docker build
def set_audio_backend(backend):
    """
    No-op function for backward compatibility.

    In torchaudio 2.0+, backend selection is automatic.
    This function exists only to prevent AttributeError when
    older code (like pyannote.audio) tries to call it.
    """
    pass
'''

with open(torchaudio_init, 'a') as f:
    f.write(patch_code)

print(f"✅ Successfully patched {torchaudio_init}")
print("   Added set_audio_backend() for pyannote.audio compatibility")
