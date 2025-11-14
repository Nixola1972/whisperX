# 📘 Guida Setup Completa - Step by Step

Guida dettagliata per configurare tutto il sistema da zero.

## 🎯 Obiettivo

Avere un sistema funzionante con:
- ✅ Web app Next.js su Vercel
- ✅ Database e Auth su Supabase
- ✅ Trascrizioni WhisperX su Modal.com
- ✅ MCP Server su Hostinger VPS
- ✅ Dati demo per testing

Tempo stimato: **30-45 minuti**

---

## 📝 Checklist Prerequisiti

Prima di iniziare, assicurati di avere:

- [ ] Node.js 18+ installato
- [ ] Git installato
- [ ] Account GitHub
- [ ] Editor di codice (VS Code consigliato)
- [ ] Terminal/Command Line

Account da creare (tutti con tier gratuito):
- [ ] [Supabase](https://supabase.com/dashboard)
- [ ] [Modal.com](https://modal.com)
- [ ] [Stripe](https://dashboard.stripe.com/register)
- [ ] [Upstash](https://console.upstash.com)
- [ ] [Google AI Studio](https://aistudio.google.com)
- [ ] [Vercel](https://vercel.com) (opzionale per deploy)

---

## 🚀 PARTE 1: Setup Locale

### Step 1: Clone e Install

```bash
# Clone repository
git clone <your-repo-url>
cd transcribe-app

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local
```

✅ **Checkpoint**: Dovresti vedere `node_modules/` creato.

---

### Step 2: Supabase Setup

#### 2.1 Crea Progetto

1. Vai su https://supabase.com/dashboard
2. Click **"New Project"**
3. Compila:
   - **Name**: `transcribe-ai` (o quello che preferisci)
   - **Database Password**: Scegli una password forte e **salvala**!
   - **Region**: Europe West (London)
4. Click **"Create new project"**
5. ⏳ Attendi 2-3 minuti per il provisioning

#### 2.2 Ottieni Credenziali

1. Nel tuo progetto, vai su **Settings** → **API**
2. Copia queste chiavi nel tuo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...  # ⚠️ SEGRETA!
```

3. Vai su **Settings** → **Database** → **Connection string** → **URI**
4. Copia e sostituisci `[YOUR-PASSWORD]` con la password scelta:

```env
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

#### 2.3 Push Database Schema

```bash
npx prisma db push
```

Output atteso:
```
Your database is now in sync with your Prisma schema. Done in 5.23s
```

```bash
npx prisma generate
```

#### 2.4 Crea Storage Buckets

1. Nel dashboard Supabase, vai su **Storage**
2. Click **"New bucket"**
3. Crea bucket `audio-temp`:
   - Name: `audio-temp`
   - Public: **No** (leave unchecked)
   - Click **"Create bucket"**
4. Ripeti per bucket `transcripts`

✅ **Checkpoint**: Dovresti vedere 2 buckets in Storage.

---

### Step 3: Modal.com Setup (WhisperX)

#### 3.1 Install Modal CLI

```bash
pip install modal
```

Se non hai Python/pip:
- **Mac**: `brew install python`
- **Windows**: Scarica da https://python.org
- **Linux**: `sudo apt install python3-pip`

#### 3.2 Login Modal

```bash
modal setup
```

Segui il prompt:
1. Si aprirà il browser
2. Login con GitHub/Google
3. Autorizza l'app
4. Torna al terminal → dovrebbe dire "Authenticated"

#### 3.3 Get HuggingFace Token

1. Vai su https://huggingface.co
2. Sign up se non hai account
3. Vai su https://huggingface.co/settings/tokens
4. Click **"New token"**
   - Name: `modal-whisperx`
   - Type: **Read**
5. Copia il token (es. `hf_xxxxx`)

#### 3.4 Add Secret to Modal

```bash
modal secret create huggingface-token HF_TOKEN=hf_xxxxx
```

(Sostituisci `hf_xxxxx` con il tuo token)

#### 3.5 Deploy WhisperX Function

```bash
cd ../modal-worker
modal deploy transcribe.py
```

⏳ Questo può richiedere 2-3 minuti la prima volta (build container).

Output atteso:
```
✓ Created objects.
├── 🔨 Created function transcribe.
└── 🔗 Web endpoint => https://your-user--whisperx-transcription-transcribe.modal.run
```

**COPIA L'URL** e aggiungilo a `.env.local`:

```env
MODAL_API_URL=https://your-user--whisperx-transcription-transcribe.modal.run
```

#### 3.6 Test (Opzionale)

Se hai un file audio di test:

```bash
modal run transcribe.py test.mp3
```

✅ **Checkpoint**: Dovresti vedere la trascrizione nel terminal.

---

### Step 4: Stripe Setup

#### 4.1 Crea Account

1. Vai su https://dashboard.stripe.com/register
2. Sign up
3. Completa il form
4. **Importante**: Resta in **Test mode** (toggle in alto)

#### 4.2 Ottieni API Keys

1. Dashboard → **Developers** → **API keys**
2. Copia:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

#### 4.3 Crea Products

1. Dashboard → **Products** → **Add product**

**Prodotto 1: Starter**
- Name: `Starter`
- Description: `100 ore/mese + MCP access`
- Click **Add pricing**:
  - Model: `Recurring`
  - Price: `9` EUR
  - Billing period: `Monthly`
  - **Save** → Copia Price ID → `STRIPE_PRICE_STARTER_MONTHLY`
- Click **Add another price**:
  - Price: `6` EUR
  - Billing period: `Monthly`
  - **Save** → `STRIPE_PRICE_STARTER_ANNUAL`

**Prodotto 2: Pro**
- Name: `Pro`
- Description: `250 ore + AI features`
- Prices:
  - Monthly: `22` EUR → `STRIPE_PRICE_PRO_MONTHLY`
  - Annual: `18` EUR → `STRIPE_PRICE_PRO_ANNUAL`

**Prodotto 3: Business**
- Name: `Business`
- Description: `500 ore + Team features`
- Prices:
  - Monthly: `49` EUR → `STRIPE_PRICE_BUSINESS_MONTHLY`
  - Annual: `39` EUR → `STRIPE_PRICE_BUSINESS_ANNUAL`

Aggiungi tutti i Price IDs a `.env.local`.

#### 4.4 Setup Webhook (faremo dopo deploy)

Per ora salta, lo faremo in Parte 2.

✅ **Checkpoint**: Dovresti avere 3 products con 6 prices totali.

---

### Step 5: Upstash Redis

#### 5.1 Crea Database

1. Vai su https://console.upstash.com
2. Sign up (con GitHub)
3. Click **"Create database"**
4. Type: **Global**
5. Name: `transcribe-queue`
6. Click **"Create"**

#### 5.2 Get Credentials

1. Nel database creato, tab **"Details"**
2. Sezione **"REST API"**:
3. Copia:

```env
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

✅ **Checkpoint**: Test connection con:

```bash
curl $UPSTASH_REDIS_REST_URL/ping -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

Dovresti vedere: `{"result":"PONG"}`

---

### Step 6: Gemini API

1. Vai su https://aistudio.google.com/app/apikey
2. Click **"Create API key"**
3. Copia:

```env
GEMINI_API_KEY=xxxxx
```

✅ **Checkpoint**: Test:

```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"
```

Dovresti vedere lista di modelli.

---

### Step 7: Configurazione Finale

Aggiungi al `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

✅ **Verifica** che il tuo `.env.local` abbia **tutte** queste variabili:

- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] DATABASE_URL
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PRICE_STARTER_MONTHLY
- [ ] STRIPE_PRICE_STARTER_ANNUAL
- [ ] STRIPE_PRICE_PRO_MONTHLY
- [ ] STRIPE_PRICE_PRO_ANNUAL
- [ ] STRIPE_PRICE_BUSINESS_MONTHLY
- [ ] STRIPE_PRICE_BUSINESS_ANNUAL
- [ ] GEMINI_API_KEY
- [ ] MODAL_API_URL
- [ ] UPSTASH_REDIS_REST_URL
- [ ] UPSTASH_REDIS_REST_TOKEN
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NODE_ENV

---

### Step 8: Seed Demo Data

```bash
cd transcribe-app
npx ts-node --esm scripts/seed-demo.ts
```

Questo crea:
- 1 utente demo
- 1 subscription Pro attiva
- 3 trascrizioni complete
- 1 API key per MCP

Output:
```
🎉 SEED COMPLETATO!

Credenziali Demo:
  Email: demo@example.com
  Password: demo123456
```

✅ **Checkpoint**: Login nella app dovrebbe funzionare.

---

### Step 9: Run Dev Server

```bash
npm run dev
```

Apri http://localhost:3000

Dovresti vedere:
- [ ] Landing page
- [ ] Login funzionante con demo@example.com
- [ ] Dashboard con 3 trascrizioni
- [ ] Export funzionanti
- [ ] AI summary sul primo transcript

🎉 **PARTE 1 COMPLETATA!**

---

## 🌍 PARTE 2: Deploy Produzione

### Step 10: Deploy su Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Segui il prompt:
1. Setup and deploy? **Y**
2. Scope: **your-account**
3. Link to existing project? **N**
4. Project name: **transcribe-ai** (o altro)
5. Directory: **./** (current)
6. Override settings? **N**

⏳ Attendi ~2 minuti per il deploy.

Output:
```
✅ Production: https://transcribe-ai.vercel.app
```

#### 10.1 Add Environment Variables

1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto
3. Settings → **Environment Variables**
4. Aggiungi **tutte** le variabili da `.env.local` (tranne `NODE_ENV`)
5. **Important**: Per `NEXT_PUBLIC_APP_URL` usa il tuo URL Vercel

```
NEXT_PUBLIC_APP_URL=https://transcribe-ai.vercel.app
```

6. Click **"Redeploy"** dopo aver aggiunto le variabili

---

### Step 11: Setup Stripe Webhook

1. Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Endpoint URL: `https://transcribe-ai.vercel.app/api/webhooks/stripe`
4. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copia **Signing secret** (es. `whsec_xxxxx`)
7. Aggiungi a Vercel env variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
8. Redeploy

✅ **Test webhook**: Stripe dashboard → Webhooks → Send test webhook

---

## 🔌 PARTE 3: MCP Server (Opzionale)

### Step 12: Deploy MCP su Hostinger VPS

#### 12.1 SSH nel VPS

```bash
ssh root@your-vps-ip
```

#### 12.2 Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

#### 12.3 Clone e Setup

```bash
git clone <your-repo-url>
cd whisperX/mcp-server

# Create .env
nano .env
```

Aggiungi:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.yourproject.supabase.co:5432/postgres
```

(Usa la stessa DATABASE_URL di Supabase)

#### 12.4 Deploy

```bash
docker-compose up -d
```

#### 12.5 Verifica

```bash
curl http://localhost/health
```

Output: `{"status":"healthy"}`

---

### Step 13: Configura Claude Desktop

1. Ottieni API key dalla web app (Dashboard → Settings → API Keys)
2. Edit config:

**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "transcriptions": {
      "url": "http://your-vps-ip",
      "headers": {
        "Authorization": "Bearer usr_xxxxx"
      }
    }
  }
}
```

3. Restart Claude Desktop

4. Test:
```
Cerca "budget" nelle mie trascrizioni
```

✅ Claude dovrebbe usare l'MCP!

---

## 🎉 COMPLETATO!

Hai ora un sistema completo funzionante con:

- ✅ Web app su Vercel
- ✅ Database Supabase
- ✅ Trascrizioni WhisperX su Modal
- ✅ Stripe payments
- ✅ MCP Server su VPS
- ✅ Dati demo per testing

---

## 🆘 Troubleshooting

### Problema: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problema: Prisma errors
```bash
npx prisma generate
npx prisma db push --force-reset
```

### Problema: Modal timeout
- Aumenta timeout in `transcribe.py`: `timeout=1200`
- O usa GPU più piccola: `gpu=modal.gpu.T4()`

### Problema: Stripe webhook failing
- Verifica URL: deve finire con `/api/webhooks/stripe`
- Check signing secret in env variables
- Test con "Send test webhook" in Stripe dashboard

---

## 📚 Next Steps

1. Customizza UI (colori, logo, testi)
2. Setup dominio custom
3. Aggiungi Google Analytics
4. Setup email notifications (Resend/SendGrid)
5. Add more demo data
6. Write tests (Jest/Playwright)
7. Setup monitoring (Sentry)

---

**Buon coding! 🚀**
