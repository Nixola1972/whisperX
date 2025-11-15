/**
 * Seed database with demo data for testing
 *
 * Run: npx ts-node --esm scripts/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const DEMO_USER_EMAIL = 'demo@example.com'
const DEMO_USER_PASSWORD = 'demo123456'

// Demo transcription data
const DEMO_TRANSCRIPTS = [
  {
    fileName: 'meeting-q1-2024.mp3',
    text: `Buongiorno a tutti. Benvenuti al meeting di review del Q1 2024.

Abbiamo raggiunto ottimi risultati questo trimestre. Le vendite sono cresciute del 25% rispetto al Q4 2023.

Il nuovo prodotto lanciato a gennaio ha superato le aspettative con 10,000 unità vendute nel primo mese.

DECISIONI PRESE:
1. Aumentare il budget marketing di €50,000 per il Q2
2. Assumere 3 nuovi sviluppatori entro fine aprile
3. Lanciare la campagna estiva a giugno

TASK ASSEGNATI:
- Marco: preparare il piano di assunzioni entro venerdì
- Laura: analisi competitor per la campagna estiva
- Team tecnico: implementare le nuove feature richieste dai clienti

Prossimo meeting: 15 aprile alle 10:00. Grazie a tutti!`,
    language: 'it',
    duration: 420, // 7 minutes
    segments: [
      { start: 0, end: 5, text: 'Buongiorno a tutti. Benvenuti al meeting di review del Q1 2024.', speaker: 'SPEAKER_00' },
      { start: 6, end: 12, text: 'Abbiamo raggiunto ottimi risultati questo trimestre. Le vendite sono cresciute del 25% rispetto al Q4 2023.', speaker: 'SPEAKER_00' },
      { start: 13, end: 20, text: 'Il nuovo prodotto lanciato a gennaio ha superato le aspettative con 10,000 unità vendute nel primo mese.', speaker: 'SPEAKER_00' },
      { start: 25, end: 30, text: 'Aumentare il budget marketing di €50,000 per il Q2', speaker: 'SPEAKER_00' },
      { start: 31, end: 35, text: 'Assumere 3 nuovi sviluppatori entro fine aprile', speaker: 'SPEAKER_00' },
      { start: 36, end: 40, text: 'Lanciare la campagna estiva a giugno', speaker: 'SPEAKER_00' }
    ]
  },
  {
    fileName: 'podcast-interview-ai.mp3',
    text: `Benvenuti al podcast Tech Talks. Oggi parliamo di intelligenza artificiale con il professor Giovanni Rossi.

Professor Rossi, ci può spiegare cosa sono i Large Language Models?

Certo. I Large Language Models sono modelli di AI addestrati su enormi quantità di testo. Possono generare testo, tradurre, rispondere a domande e molto altro.

Quali sono le applicazioni pratiche?

Le applicazioni sono infinite: assistenti virtuali, generazione di codice, analisi di documenti, customer support automatizzato, e molto altro.

Grazie professore per questa interessante intervista!`,
    language: 'it',
    duration: 180, // 3 minutes
    segments: [
      { start: 0, end: 5, text: 'Benvenuti al podcast Tech Talks. Oggi parliamo di intelligenza artificiale con il professor Giovanni Rossi.', speaker: 'SPEAKER_00' },
      { start: 6, end: 10, text: 'Professor Rossi, ci può spiegare cosa sono i Large Language Models?', speaker: 'SPEAKER_00' },
      { start: 11, end: 18, text: 'Certo. I Large Language Models sono modelli di AI addestrati su enormi quantità di testo.', speaker: 'SPEAKER_01' },
      { start: 19, end: 25, text: 'Possono generare testo, tradurre, rispondere a domande e molto altro.', speaker: 'SPEAKER_01' },
      { start: 26, end: 30, text: 'Quali sono le applicazioni pratiche?', speaker: 'SPEAKER_00' },
      { start: 31, end: 40, text: 'Le applicazioni sono infinite: assistenti virtuali, generazione di codice, analisi di documenti...', speaker: 'SPEAKER_01' }
    ]
  },
  {
    fileName: 'lezione-storia-roma.mp3',
    text: `Lezione di storia: La fondazione di Roma.

Secondo la leggenda, Roma fu fondata nel 753 a.C. da Romolo e Remo, due fratelli gemelli allattati da una lupa.

La storia di Roma può essere divisa in tre periodi principali:
1. Monarchia (753-509 a.C.)
2. Repubblica (509-27 a.C.)
3. Impero (27 a.C. - 476 d.C.)

Durante il periodo imperiale, Roma controllava tutto il Mediterraneo e gran parte dell'Europa.

L'impero cadde nel 476 d.C. con la deposizione dell'ultimo imperatore Romolo Augustolo.

Domande? Ricordatevi di studiare per l'esame della prossima settimana!`,
    language: 'it',
    duration: 240, // 4 minutes
    segments: [
      { start: 0, end: 5, text: 'Lezione di storia: La fondazione di Roma.', speaker: 'SPEAKER_00' },
      { start: 6, end: 12, text: 'Secondo la leggenda, Roma fu fondata nel 753 a.C. da Romolo e Remo.', speaker: 'SPEAKER_00' },
      { start: 13, end: 18, text: 'La storia di Roma può essere divisa in tre periodi principali...', speaker: 'SPEAKER_00' },
      { start: 25, end: 32, text: 'Durante il periodo imperiale, Roma controllava tutto il Mediterraneo.', speaker: 'SPEAKER_00' }
    ]
  }
]

async function main() {
  console.log('🌱 Seeding database with demo data...\n')

  try {
    // 1. Create demo user in Supabase Auth
    console.log('1️⃣ Creating demo user in Supabase...')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
      email_confirm: true
    })

    if (authError && !authError.message.includes('already registered')) {
      throw authError
    }

    const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(
      u => u.email === DEMO_USER_EMAIL
    )?.id

    if (!userId) {
      throw new Error('Failed to create or find demo user')
    }

    console.log(`   ✅ Demo user created: ${DEMO_USER_EMAIL}`)
    console.log(`   📧 Password: ${DEMO_USER_PASSWORD}\n`)

    // 2. Create user record in database
    console.log('2️⃣ Creating user record in database...')

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: DEMO_USER_EMAIL,
        fullName: 'Demo User'
      },
      update: {
        email: DEMO_USER_EMAIL,
        fullName: 'Demo User'
      }
    })

    console.log('   ✅ User record created\n')

    // 3. Create active subscription
    console.log('3️⃣ Creating active Pro subscription...')

    const now = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: `cus_demo_${userId.slice(0, 8)}`,
        stripeSubscriptionId: `sub_demo_${userId.slice(0, 8)}`,
        stripePriceId: 'price_demo_pro_monthly',
        status: 'active',
        plan: 'pro',
        billingCycle: 'monthly',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      },
      update: {
        status: 'active',
        plan: 'pro',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      }
    })

    console.log('   ✅ Pro subscription created\n')

    // 4. Create usage record
    console.log('4️⃣ Initializing usage tracking...')

    await prisma.usage.upsert({
      where: { userId },
      create: {
        userId,
        periodStart: now,
        periodEnd: periodEnd,
        transcriptionHoursMonth: 0.2,
        aiSummariesMonth: 2,
        aiQuestionsMonth: 5
      },
      update: {
        periodStart: now,
        periodEnd: periodEnd
      }
    })

    console.log('   ✅ Usage tracking initialized\n')

    // 5. Create demo transcripts
    console.log('5️⃣ Creating demo transcripts...\n')

    for (const [index, demo] of DEMO_TRANSCRIPTS.entries()) {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - (DEMO_TRANSCRIPTS.length - index))

      const transcript = await prisma.transcript.create({
        data: {
          userId,
          fileName: demo.fileName,
          filePath: `demo/${userId}/${demo.fileName}`,
          fileSize: BigInt(Math.floor(Math.random() * 10000000) + 1000000),
          mimeType: 'audio/mpeg',
          status: 'completed',
          transcriptText: demo.text,
          language: demo.language,
          durationSeconds: demo.duration,
          segments: demo.segments as any,
          speakers: {
            SPEAKER_00: { name: 'Speaker 1' },
            SPEAKER_01: { name: 'Speaker 2' }
          },
          createdAt,
          processedAt: createdAt
        }
      })

      console.log(`   ✅ Created: ${demo.fileName}`)

      // Create AI summary for first transcript
      if (index === 0) {
        await prisma.aiSummary.create({
          data: {
            transcriptId: transcript.id,
            type: 'summary',
            content: `## 📌 Punti Principali

- Vendite cresciute del 25% nel Q1 2024
- Nuovo prodotto: 10,000 unità vendute nel primo mese
- Piano di espansione per Q2

## ✅ Decisioni

- Budget marketing: +€50,000
- Assunzioni: 3 sviluppatori entro aprile
- Lancio campagna estiva a giugno

## 📋 Task

- Marco: piano assunzioni (deadline: venerdì)
- Laura: analisi competitor
- Team tecnico: nuove feature clienti

## 🔢 Numeri Chiave

- 25% crescita vendite
- 10,000 unità vendute
- €50,000 budget marketing
- 3 nuove assunzioni`,
            metadata: {
              keywords: ['vendite', 'budget', 'assunzioni', 'prodotto']
            }
          }
        })
        console.log(`      ✨ AI summary generated`)
      }
    }

    console.log('\n6️⃣ Creating API key for MCP...')

    const apiKey = `usr_demo_${Math.random().toString(36).substring(2, 15)}`

    await prisma.apiKey.create({
      data: {
        userId,
        key: apiKey,
        name: 'Demo MCP Key',
        scopes: ['read:transcripts']
      }
    })

    console.log(`   ✅ API Key: ${apiKey}\n`)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 SEED COMPLETATO CON SUCCESSO!\n')
    console.log('📝 Credenziali Demo:')
    console.log(`   Email:    ${DEMO_USER_EMAIL}`)
    console.log(`   Password: ${DEMO_USER_PASSWORD}`)
    console.log(`\n🔑 MCP API Key:`)
    console.log(`   ${apiKey}`)
    console.log('\n📊 Dati creati:')
    console.log(`   • 1 utente con subscription Pro attiva`)
    console.log(`   • ${DEMO_TRANSCRIPTS.length} trascrizioni completate`)
    console.log(`   • 1 riassunto AI`)
    console.log(`   • 1 API key per MCP`)
    console.log('\n🚀 Puoi ora:')
    console.log(`   1. Fare login con le credenziali demo`)
    console.log(`   2. Vedere le trascrizioni nella dashboard`)
    console.log(`   3. Testare export, AI features, MCP`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('❌ Errore durante il seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
