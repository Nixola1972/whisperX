# 🎙️ WhisperX Transcription Service

Un servizio di trascrizione audio completo con **autenticazione**, **upload file**, e **trascrizione GPU** tramite WhisperX su Modal.com.

---

## ✨ Funzionalità

- ✅ **Autenticazione Completa** - Login/Signup con Supabase Auth
- ✅ **Upload File** - Drag & drop audio/video (MP3, WAV, M4A, MP4, WebM)
- ✅ **Database PostgreSQL** - Gestione utenti e trascrizioni con Prisma
- ✅ **Storage Supabase** - Upload sicuro dei file
- ⏳ **Trascrizione WhisperX** - Con GPU su Modal.com (da configurare)
- ⏳ **Speaker Diarization** - Identifica automaticamente gli speaker
- ⏳ **AI Summaries** - Con Gemini 2.0 Flash (opzionale)
- ⏳ **Export Multipli** - TXT, MD, PDF, DOCX, SRT, VTT, JSON
- ⏳ **Stripe Payments** - Abbonamenti mensili (opzionale)

---

## 🚀 Quick Start

### 1. Prerequisiti

- **Node.js** 18+
- **Python** 3.11+ (per Modal.com)
- **Account Supabase** (gratis: https://supabase.com)
- **Account Modal.com** (gratis: https://modal.com)

### 2. Installa Dipendenze

```powershell
cd transcribe-app
npm install
```

### 3. Configura Environment Variables

Crea `.env.local` in `transcribe-app/`:

```env
# Supabase (trova su: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database (trova su: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database)
DATABASE_URL=postgresql://...@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...@aws-0-eu-north-1.pooler.supabase.com:5432/postgres

# Modal.com (da configurare - vedi MODAL_SETUP.md)
MODAL_WEBHOOK_URL=https://your-username--whisperx-transcription-transcribe-webhook.modal.run
MODAL_TOKEN_ID=your-modal-token-id
MODAL_TOKEN_SECRET=your-modal-token-secret

# Opzionali
GEMINI_API_KEY=your-gemini-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### 4. Setup Database

```powershell
cd transcribe-app
npx prisma generate
npx prisma db push
```

### 5. Avvia App

```powershell
npm run dev
```

Vai su: **http://localhost:3000**

---

## 📂 Struttura Progetto

```
whisperX/
├── transcribe-app/          # Next.js App
│   ├── app/                 # Pages e API routes
│   │   ├── page.tsx        # Homepage
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   ├── dashboard/      # Dashboard (upload + lista)
│   │   ├── transcripts/    # Dettaglio trascrizioni
│   │   └── api/            # API endpoints
│   │       ├── auth/       # Auth (signup, logout)
│   │       ├── upload/     # Upload file
│   │       └── transcripts/ # CRUD trascrizioni
│   ├── components/         # React components
│   │   ├── FileUpload.tsx  # Drag & drop upload
│   │   ├── TranscriptsList.tsx
│   │   └── Navbar.tsx
│   ├── lib/                # Utility libraries
│   │   ├── auth.ts         # Server-side auth helpers
│   │   ├── supabase.ts     # Supabase clients
│   │   ├── db.ts           # Prisma client
│   │   ├── export.ts       # Export functions (PDF, DOCX, etc)
│   │   ├── gemini.ts       # Gemini AI integration
│   │   ├── stripe.ts       # Stripe integration
│   │   └── redis.ts        # Upstash Redis queue
│   ├── prisma/
│   │   └── schema.prisma   # Database schema (9 tables)
│   ├── middleware.ts       # Route protection
│   ├── .env.local          # Environment variables
│   └── package.json
├── modal_worker.py         # WhisperX worker per Modal.com
├── MODAL_SETUP.md          # 📖 Guida setup Modal.com
├── PROJECT_README.md       # 📖 Questo file
└── README.md               # WhisperX original README

```

---

## 🗄️ Database Schema

**9 Tabelle Prisma:**

1. **User** - Utenti autenticati
2. **Transcript** - Record trascrizioni
3. **Subscription** - Abbonamenti Stripe
4. **UsageLog** - Tracking utilizzo
5. **AiSummary** - Summari Gemini
6. **ExportHistory** - Cronologia export
7. **ApiKey** - Chiavi API (per MCP)
8. **McpConnection** - Connessioni Claude Desktop
9. **SystemMetric** - Metriche sistema

Vedi dettagli in `transcribe-app/prisma/schema.prisma`

---

## 🔐 Autenticazione

### Come Funziona

1. **Supabase Auth** - Gestisce sessioni utente
2. **SSR Cookies** - Session management con `@supabase/ssr`
3. **Middleware Protection** - Blocca `/dashboard` e `/transcripts` per utenti non loggati
4. **Prisma DB Sync** - Ogni signup crea record in `User` table

### File Chiave

- `transcribe-app/lib/auth.ts` - Server-side auth helpers
- `transcribe-app/middleware.ts` - Route protection
- `transcribe-app/app/login/page.tsx` - Login page
- `transcribe-app/app/signup/page.tsx` - Signup page

---

## 📤 Upload File

### Flow

1. **Utente trascina file** → `components/FileUpload.tsx`
2. **Validazione** → tipo + dimensione (max 100MB)
3. **POST /api/upload** → Crea FormData
4. **Salva in Supabase Storage** → bucket `audio-temp`
5. **Crea record DB** → tabella `Transcript` con status `pending`
6. **Trigger Modal.com** → (quando configurato) webhook per trascrizione

### File Supportati

- Audio: MP3, WAV, M4A, OGG
- Video: MP4, MOV, WebM

---

## 🎯 Prossimi Passi (Configurazione Modal.com)

### ⚙️ Setup Modal per Trascrizione

**👉 Segui la guida completa: [`MODAL_SETUP.md`](./MODAL_SETUP.md)**

**Sommario:**
1. Registrati su Modal.com
2. Installa CLI: `pip install modal`
3. Autentica: `modal setup`
4. Configura secrets Supabase
5. Deploy worker: `modal deploy modal_worker.py`
6. Aggiungi webhook URL al `.env.local`
7. Testa upload → trascrizione completa!

**Tempo stimato:** 15-20 minuti
**Costi:** ~€0.02-0.04 per ora di audio

---

## 💡 Funzionalità Opzionali

### 1. AI Summaries (Gemini)

Aggiungi al `.env.local`:
```env
GEMINI_API_KEY=your-api-key-here
```

Ottieni chiave: https://makersuite.google.com/app/apikey

### 2. Stripe Payments

Configura Stripe per abbonamenti mensili:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Redis Queue (Upstash)

Per job queue avanzato:
```env
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
```

---

## 🧪 Testing

### Test Locali

1. **Avvia dev server:**
   ```powershell
   cd transcribe-app
   npm run dev
   ```

2. **Test autenticazione:**
   - Vai su http://localhost:3000
   - Clicca "Sign Up"
   - Crea account
   - Dovresti essere reindirizzato alla dashboard

3. **Test upload:**
   - Dashboard → Upload file audio (es. 30 sec per test veloce)
   - File dovrebbe apparire in "Your Transcriptions" con status `pending`
   - Verifica in Supabase Storage: bucket `audio-temp` deve contenere il file

4. **Test Modal (dopo setup):**
   - Carica file
   - Status dovrebbe cambiare: `pending` → `processing` → `completed`
   - Clicca "View" per vedere trascrizione

### Troubleshooting

**Login non funziona?**
- Verifica che `.env.local` contenga tutte le chiavi Supabase
- Controlla console browser (F12) per errori
- Verifica che "Email confirmations" sia disabilitato in Supabase

**Upload fallisce?**
- Aggiungi `SUPABASE_SERVICE_ROLE_KEY` al `.env.local`
- Verifica permessi bucket `audio-temp` in Supabase Storage
- Controlla dimensione file (<100MB)

**Trascrizione non parte?**
- Modal.com non è ancora configurato
- Segui guida `MODAL_SETUP.md`

---

## 🚢 Deploy Production

### 1. Deploy Next.js su Vercel

```powershell
npm install -g vercel
vercel
```

Aggiungi Environment Variables su Vercel dashboard.

### 2. Deploy Modal Worker

```powershell
modal deploy modal_worker.py
```

### 3. Supabase Production

- Usa production database
- Configura Supabase Edge Functions (opzionale)
- Setup Row Level Security (RLS)

---

## 📊 Costi Stimati

### Gratuito:
- ✅ Supabase Free Tier (2GB database, 1GB storage)
- ✅ Vercel Hobby (100GB bandwidth/mese)
- ✅ Modal.com ($30 credito mensile)

### A Pagamento (dopo free tier):
- **Modal.com**: ~€0.02-0.04 per ora audio trascritta
- **Supabase**: €25/mese (dopo 2GB database)
- **Vercel**: €20/mese (dopo 100GB bandwidth)

**Esempio:** 100 ore trascrizioni/mese = ~€2-4 + €25 Supabase = **€27-29/mese**

---

## 🛠️ Stack Tecnologico

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Auth:** Supabase Auth (SSR)
- **Storage:** Supabase Storage
- **Transcription:** WhisperX + Modal.com (GPU A10G)
- **AI:** Gemini 2.0 Flash-Lite
- **Payments:** Stripe
- **Queue:** Upstash Redis (opzionale)

---

## 📚 Risorse

- [Documentazione Next.js](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Modal.com Docs](https://modal.com/docs)
- [WhisperX GitHub](https://github.com/m-bain/whisperX)
- [Prisma Docs](https://www.prisma.io/docs)

---

## 🆘 Supporto

Per problemi o domande:

1. Controlla log applicazione (`npm run dev`)
2. Verifica environment variables in `.env.local`
3. Consulta `MODAL_SETUP.md` per problemi con trascrizione
4. Apri issue su GitHub repository

---

## 📝 Licenza

Questo progetto usa WhisperX che è rilasciato sotto licenza BSD-4-Clause.
Vedi [WhisperX LICENSE](https://github.com/m-bain/whisperX/blob/main/LICENSE) per dettagli.

---

## 🎉 Credits

- **WhisperX**: Max Bain @ VGG Oxford
- **OpenAI Whisper**: OpenAI
- **Pyannote Audio**: Herve Bredin
- **Supabase**: Supabase Team
- **Modal.com**: Modal Labs

---

**Buona trascrizione! 🎙️✨**
