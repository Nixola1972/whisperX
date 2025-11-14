# ✅ CHECKLIST SETUP - Stampa e Segna

Usa questa checklist per non perdere nessuno step durante il setup.

---

## 🎯 PREREQUISITI

- [ ] Node.js 18+ installato
- [ ] Python 3.11+ installato (per Modal)
- [ ] Git installato
- [ ] Editor di codice (VS Code)
- [ ] Terminal aperto

---

## 📝 ACCOUNT DA CREARE (tutti free tier)

- [ ] Account Supabase → https://supabase.com
- [ ] Account Modal.com → https://modal.com
- [ ] Account Stripe → https://dashboard.stripe.com/register
- [ ] Account Upstash → https://console.upstash.com
- [ ] Account Google AI Studio → https://aistudio.google.com
- [ ] Account HuggingFace → https://huggingface.co
- [ ] (Opzionale) Account Vercel → https://vercel.com

---

## 🚀 SETUP LOCALE

### 1. Progetto Base
- [ ] Clone repository
- [ ] `cd transcribe-app`
- [ ] `npm install`
- [ ] `cp .env.example .env.local`

### 2. Supabase
- [ ] Crea nuovo progetto
- [ ] Copia URL → `.env.local`
- [ ] Copia anon key → `.env.local`
- [ ] Copia service role key → `.env.local`
- [ ] Copia database URL → `.env.local`
- [ ] Crea bucket `audio-temp`
- [ ] Crea bucket `transcripts`
- [ ] `npx prisma db push`
- [ ] `npx prisma generate`

### 3. Modal.com
- [ ] `pip install modal`
- [ ] `modal setup` (login)
- [ ] Ottieni HuggingFace token
- [ ] `modal secret create huggingface-token HF_TOKEN=xxx`
- [ ] `cd ../modal-worker`
- [ ] `modal deploy transcribe.py`
- [ ] Copia URL → `.env.local` (MODAL_API_URL)

### 4. Stripe
- [ ] Crea account (test mode)
- [ ] Copia publishable key → `.env.local`
- [ ] Copia secret key → `.env.local`
- [ ] Crea product "Starter"
  - [ ] Price €9 monthly → Copia ID → `.env.local`
  - [ ] Price €6 annual → Copia ID → `.env.local`
- [ ] Crea product "Pro"
  - [ ] Price €22 monthly → Copia ID → `.env.local`
  - [ ] Price €18 annual → Copia ID → `.env.local`
- [ ] Crea product "Business"
  - [ ] Price €49 monthly → Copia ID → `.env.local`
  - [ ] Price €39 annual → Copia ID → `.env.local`

### 5. Upstash Redis
- [ ] Crea database
- [ ] Copia REST URL → `.env.local`
- [ ] Copia REST token → `.env.local`

### 6. Gemini API
- [ ] Vai su Google AI Studio
- [ ] Crea API key
- [ ] Copia key → `.env.local`

### 7. Test Locale
- [ ] Verifica tutte le variabili in `.env.local`
- [ ] `npm run dev`
- [ ] Apri http://localhost:3000
- [ ] ✅ Sito carica senza errori

### 8. Seed Demo Data
- [ ] `npx ts-node --esm scripts/seed-demo.ts`
- [ ] Annota credenziali demo
- [ ] Annota API key MCP
- [ ] Login funziona con demo@example.com
- [ ] Vedi 3 trascrizioni in dashboard
- [ ] Test export (download PDF, DOCX, etc)

---

## 🌍 DEPLOY PRODUZIONE (quando pronto)

### 1. Vercel
- [ ] `npm i -g vercel`
- [ ] `vercel login`
- [ ] `vercel`
- [ ] Aggiungi tutte le env variables in dashboard
- [ ] Modifica `NEXT_PUBLIC_APP_URL` con URL Vercel
- [ ] Redeploy

### 2. Stripe Webhook
- [ ] Stripe → Developers → Webhooks
- [ ] Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
- [ ] Seleziona 6 eventi (checkout, subscription, invoice)
- [ ] Copia signing secret
- [ ] Aggiungi a Vercel env: `STRIPE_WEBHOOK_SECRET`
- [ ] Redeploy
- [ ] Test webhook in Stripe dashboard

---

## 🔌 MCP SERVER (opzionale)

### 1. Setup VPS
- [ ] SSH in Hostinger VPS
- [ ] Install Docker: `curl -fsSL https://get.docker.com | sh`
- [ ] Clone repo
- [ ] `cd whisperX/mcp-server`
- [ ] Crea `.env` con DATABASE_URL
- [ ] `docker-compose up -d`
- [ ] Test: `curl http://localhost/health`

### 2. Claude Desktop
- [ ] Ottieni API key da web app
- [ ] Edit `claude_desktop_config.json`
- [ ] Aggiungi config MCP
- [ ] Restart Claude Desktop
- [ ] Test: "Cerca nelle mie trascrizioni"

---

## ✅ VERIFICA FINALE

- [ ] Web app funziona locale
- [ ] Login funziona
- [ ] Upload file test funziona
- [ ] Export funzionano (tutti i formati)
- [ ] AI summary si genera
- [ ] Stripe test checkout funziona
- [ ] (Se deployed) Produzione raggiungibile
- [ ] (Se deployed) Webhook Stripe funziona
- [ ] (Se deployed) MCP server risponde

---

## 📞 CREDENZIALI DA SALVARE

```
DEMO USER:
Email: demo@example.com
Password: demo123456

SUPABASE:
URL: ___________________________
Anon Key: _____________________
Service Key: __________________
DB Password: __________________

STRIPE:
Secret Key: ___________________
Webhook Secret: _______________

MODAL:
URL: __________________________

GEMINI:
API Key: ______________________

MCP API KEY:
Key: __________________________

VERCEL (se deployed):
URL: __________________________
```

---

## 🆘 SE QUALCOSA NON FUNZIONA

1. Controlla `.env.local` (tutte le variabili?)
2. Check terminal per errori
3. Leggi SETUP_GUIDE.md sezione Troubleshooting
4. Check logs:
   - Vercel: Dashboard → Logs
   - Modal: `modal app logs`
   - MCP: `docker logs transcription-mcp`

---

**Stampa questa pagina e segna ogni ✅ man mano che completi!**

_Tempo stimato totale: 30-45 minuti_
