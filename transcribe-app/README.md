# 🎙️ Transcribe AI - Sistema Completo di Trascrizione

Sistema completo di trascrizione audio/video con AI, speaker diarization, MCP server e export multipli formati.

## 📋 Indice

1. [Features](#features)
2. [Architettura](#architettura)
3. [Setup Rapido](#setup-rapido)
4. [Configurazione Dettagliata](#configurazione-dettagliata)
5. [Deploy Produzione](#deploy-produzione)
6. [Testing con Dati Demo](#testing-con-dati-demo)
7. [MCP Setup](#mcp-setup)

---

## ✨ Features

### Core
- ✅ **Trascrizione WhisperX** con GPU (70x realtime)
- ✅ **Speaker Diarization** automatica
- ✅ **Word-level timestamps** precisi
- ✅ **98+ lingue** supportate

### Export Formati
- ✅ TXT, Markdown, PDF, DOCX, SRT, VTT, JSON

### AI Features (Gemini 2.0 Flash-Lite)
- ✅ Riassunti intelligenti
- ✅ Q&A con citazioni
- ✅ Estrazione insights
- ✅ Ricerca semantica

### MCP Server
- ✅ Integrazione Claude Desktop
- ✅ API per ricerca trascrizioni
- ✅ UNICO sul mercato!

---

## 🚀 Setup Rapido (10 minuti)

### 1. Install dependencies

```bash
npm install
```

### 2. Configura environment

```bash
cp .env.example .env.local
```

Modifica `.env.local` con le tue credenziali (vedi sotto).

### 3. Push database schema

```bash
npx prisma db push
npx prisma generate
```

### 4. Run development

```bash
npm run dev
```

Apri http://localhost:3000

---

## ⚙️ Configurazione

### Supabase
1. Crea progetto su https://supabase.com
2. Ottieni: URL, anon key, service role key
3. Crea buckets: `audio-temp`, `transcripts`
4. Push schema: `npx prisma db push`

### Modal.com
```bash
pip install modal
modal setup
modal secret create huggingface-token HF_TOKEN=your-token
cd ../modal-worker
modal deploy transcribe.py
```

### Stripe
1. Crea products (Starter €9, Pro €22, Business €49)
2. Setup webhook → `/api/webhooks/stripe`

### Redis
1. Crea database su https://console.upstash.com
2. Copia REST URL e token

---

## 🚢 Deploy

### Vercel (Web App)
```bash
vercel
```

### Hostinger VPS (MCP Server)
```bash
cd mcp-server
docker-compose up -d
```

---

## 🧪 Demo Data

```bash
npx ts-node scripts/seed-demo.ts
```

Login demo:
- Email: `demo@example.com`
- Password: `demo123456`

---

## 📖 Documentazione Completa

Vedi file `SETUP.md` nella root del progetto per istruzioni dettagliate step-by-step.

---

**Fatto! 🎉**
