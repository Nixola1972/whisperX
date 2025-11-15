# 🚀 Guida Configurazione Modal.com per WhisperX

Questa guida ti aiuterà a configurare Modal.com per processare le trascrizioni con WhisperX su GPU.

## 📋 Cosa è Modal.com?

Modal.com è una piattaforma serverless che ti permette di eseguire codice Python su GPU potenti **pagando solo per i secondi effettivi di utilizzo**.

**Vantaggi:**
- ✅ Nessun server da gestire
- ✅ GPU on-demand (A10G, A100, H100)
- ✅ Pay-per-second (circa $0.50/ora GPU A10G)
- ✅ Auto-scaling (gestisce automaticamente più trascrizioni in parallelo)
- ✅ WhisperX gira 10-20x più veloce rispetto a CPU

**Costi stimati:**
- 1 ora di audio = ~3-5 minuti di GPU = **€0.02-0.04**
- 100 ore audio/mese = **€2-4** invece di €3000+ per un server GPU dedicato

---

## 🔧 Parte 1: Registrazione e Setup Modal.com

### 1. Crea Account Modal

1. Vai su: https://modal.com
2. Clicca **"Sign Up"**
3. Registrati con GitHub o Google (consigliato)
4. Verifica la tua email

### 2. Installa Modal CLI

Apri PowerShell nella cartella del progetto:

```powershell
cd C:\Users\nicol\whisperx
pip install modal
```

### 3. Autentica Modal

```powershell
modal setup
```

Si aprirà il browser - fai login e autorizza il CLI.

### 4. Crea Token API

1. Vai su: https://modal.com/settings/tokens
2. Clicca **"Create New Token"**
3. Nome: `whisperx-transcription`
4. **Copia il Token ID e Token Secret** - li useremo dopo

---

## 🎯 Parte 2: Deploy Worker WhisperX

### 1. Verifica File Worker

Il file `modal_worker.py` è già pronto nella root del progetto. Contiene:
- WhisperX con modello large-v3
- Speaker diarization con pyannote.audio
- Upload automatico a Supabase
- Gestione errori e retry

### 2. Configura Secrets Modal

Modal usa "Secrets" per gestire variabili d'ambiente in modo sicuro.

**Crea il Secret Supabase:**
```powershell
modal secret create supabase-credentials `
  SUPABASE_URL="https://wfpaylknaguvtxfzmmrz.supabase.co" `
  SUPABASE_SERVICE_ROLE_KEY="la-tua-service-role-key-qui"
```

⚠️ **Sostituisci** `la-tua-service-role-key-qui` con la tua vera Service Role Key (quella che hai messo in `.env.local`)

### 3. Deploy Worker

```powershell
cd C:\Users\nicol\whisperx
modal deploy modal_worker.py
```

Vedrai:
```
✓ Created objects
├── 🔨 Downloading model...
├── 🏗️ Building image...
└── ✅ App deployed!

View app: https://modal.com/nixola1972/whisperx-transcription
```

### 4. Testa Worker (Opzionale)

```powershell
# Test con file audio locale
modal run modal_worker.py --file-path "path/to/audio.mp3"
```

---

## 🔌 Parte 3: Collega Modal all'App Next.js

### 1. Trova Modal Webhook URL

Dopo il deploy, Modal ti dà un **Webhook URL** per invocare il worker.

```powershell
modal webhook list
```

Output:
```
whisperx-transcription.transcribe_webhook
https://nixola1972--whisperx-transcription-transcribe-webhook.modal.run
```

**Copia questo URL!**

### 2. Aggiungi URL al `.env.local`

Apri `transcribe-app\.env.local` e aggiungi:

```env
MODAL_WEBHOOK_URL=https://tuo-username--whisperx-transcription-transcribe-webhook.modal.run
MODAL_TOKEN_ID=il-token-id-che-hai-creato
MODAL_TOKEN_SECRET=il-token-secret-che-hai-creato
```

### 3. Aggiorna Codice Next.js

Apri `transcribe-app/app/api/upload/route.ts` e decommentare la sezione Modal:

Cerca questa riga:
```typescript
// TODO: Enqueue transcription job to Modal/Redis when configured
```

E sostituiscila con:
```typescript
// Trigger Modal transcription
const modalUrl = process.env.MODAL_WEBHOOK_URL
if (modalUrl) {
  await fetch(modalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MODAL_TOKEN_SECRET}`
    },
    body: JSON.stringify({
      transcript_id: transcript.id,
      file_path: filePath,
      user_id: userId,
      file_name: file.name
    })
  })
}
```

### 4. Riavvia App

```powershell
cd transcribe-app
# Ctrl+C per fermare
npm run dev
```

---

## ✅ Parte 4: Test End-to-End

### 1. Carica File

1. Vai su http://localhost:3000/login
2. Fai login con il tuo account
3. Carica un file audio (es. 30 secondi per test rapido)

### 2. Verifica Processing

**Dashboard:**
- Il file dovrebbe apparire con status `pending`
- Dopo ~1-2 minuti dovrebbe diventare `processing`
- Infine `completed`

**Log Modal:**
```powershell
modal logs whisperx-transcription
```

Vedrai in tempo reale:
```
[INFO] Processing transcript abc123...
[INFO] Downloading file from Supabase...
[INFO] Running WhisperX transcription...
[INFO] Detected language: it
[INFO] Running speaker diarization...
[INFO] Upload completed!
```

### 3. Visualizza Trascrizione

1. Nella dashboard, clicca **"View"** sul file completato
2. Dovresti vedere:
   - Testo completo trascritto
   - Speaker separati (SPEAKER_00, SPEAKER_01, etc.)
   - Timestamps
   - Possibilità di export (TXT, PDF, SRT, etc.)

---

## 🐛 Troubleshooting

### Errore: "Modal not authenticated"
```powershell
modal setup
```

### Errore: "Secrets not found"
Ricrea i secrets:
```powershell
modal secret create supabase-credentials `
  SUPABASE_URL="..." `
  SUPABASE_SERVICE_ROLE_KEY="..."
```

### Worker in Timeout
- Controlla che il file audio non sia troppo grande (>100MB)
- Aumenta timeout nel codice Modal (vedi `modal_worker.py`, parametro `timeout`)

### File non scaricato da Supabase
- Verifica che `SUPABASE_SERVICE_ROLE_KEY` sia corretta nei secrets Modal
- Controlla i permessi del bucket `audio-temp` in Supabase Storage

### Trascrizione vuota
- Verifica che l'audio contenga effettivamente parlato
- Controlla log Modal per vedere errori WhisperX

---

## 💰 Costi e Limiti

### Free Tier Modal
- **$30/mese gratis** per i primi 3 mesi
- Poi **$30/mese credito** sempre incluso
- Sufficienti per **~60 ore di trascrizioni al mese**

### Prezzi GPU
- **A10G**: $0.50/ora (~$0.04 per ora di audio)
- **A100**: $3/ora (per carichi molto grandi)

### Come Ottimizzare
1. Usa WhisperX large-v2 invece di large-v3 (più veloce, stesso risultato)
2. Disabilita diarization per audio con 1 speaker
3. Batch multiple trascrizioni insieme (se possibile)

---

## 🎉 Prossimi Passi

Una volta che Modal funziona:

1. **✅ Configura Gemini AI** (opzionale)
   - Per summaries e Q&A
   - File: `transcribe-app/.env.local` → Aggiungi `GEMINI_API_KEY`

2. **✅ Configura Stripe** (opzionale)
   - Per gestire abbonamenti e pagamenti
   - Segui guida: `STRIPE_SETUP.md` (da creare)

3. **✅ Deploy Production**
   - Vercel per Next.js app
   - Modal in production mode
   - Supabase production database

---

## 📚 Risorse

- **Modal Docs**: https://modal.com/docs
- **WhisperX GitHub**: https://github.com/m-bain/whisperX
- **Supabase Docs**: https://supabase.com/docs

---

## 🆘 Hai Bisogno di Aiuto?

Se incontri problemi:

1. Controlla i log: `modal logs whisperx-transcription`
2. Verifica variabili d'ambiente in `.env.local`
3. Testa worker isolato: `modal run modal_worker.py`
4. Contattami per assistenza!

---

**Buona trascrizione! 🎙️✨**
