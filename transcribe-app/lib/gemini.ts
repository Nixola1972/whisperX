import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiClient = genAI

// Models
export const GEMINI_MODELS = {
  FLASH_LITE: 'gemini-2.0-flash-lite',
  FLASH: 'gemini-2.5-flash'
} as const

// Create or get user's File Search Store
export async function getOrCreateUserFileSearchStore(userId: string) {
  const { db } = await import('./db')

  // Check if exists
  let store = await db.fileSearchStore.findUnique({
    where: { userId }
  })

  if (store) {
    return store.geminiStoreName
  }

  // Create new store
  const model = geminiClient.getGenerativeModel({ model: GEMINI_MODELS.FLASH_LITE })

  // Note: This is pseudocode - actual Gemini File Search API might differ
  // You'll need to adapt based on the actual SDK
  const geminiStore = await model.fileSearchStores?.create({
    displayName: `user_${userId}_transcripts`
  })

  if (!geminiStore) {
    throw new Error('Failed to create Gemini File Search store')
  }

  // Save to DB
  store = await db.fileSearchStore.create({
    data: {
      userId,
      geminiStoreName: geminiStore.name
    }
  })

  return store.geminiStoreName
}

// Import transcript to File Search
export async function importTranscriptToFileSearch(
  userId: string,
  transcriptId: string,
  text: string,
  metadata: {
    fileName: string
    duration: number
    language: string
    createdAt: string
  }
) {
  const storeName = await getOrCreateUserFileSearchStore(userId)

  const model = geminiClient.getGenerativeModel({ model: GEMINI_MODELS.FLASH_LITE })

  // Upload temp file
  const tempFile = await model.uploadFile?.({
    file: Buffer.from(text),
    config: { name: `transcript_${transcriptId}.txt` }
  })

  if (!tempFile) {
    throw new Error('Failed to upload file to Gemini')
  }

  // Import to store with metadata
  const operation = await model.fileSearchStores?.importFile?.({
    fileSearchStoreName: storeName,
    fileName: tempFile.name,
    customMetadata: [
      { key: 'transcript_id', stringValue: transcriptId },
      { key: 'file_name', stringValue: metadata.fileName },
      { key: 'duration_minutes', numericValue: Math.round(metadata.duration / 60) },
      { key: 'language', stringValue: metadata.language },
      { key: 'created_at', stringValue: metadata.createdAt }
    ]
  })

  // Wait for completion (with timeout)
  let retries = 0
  while (operation && !operation.done && retries < 30) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    // operation = await model.operations.get(operation)
    retries++
  }

  return operation
}

// Generate summary
export async function generateSummary(text: string): Promise<string> {
  const model = geminiClient.getGenerativeModel({
    model: GEMINI_MODELS.FLASH_LITE
  })

  const prompt = `Genera un riassunto intelligente di questa trascrizione audio.

Includi:
- 📌 Punti principali (3-5 bullet points)
- ✅ Decisioni prese (se presenti)
- 📋 Task o azioni menzionate (se presenti)
- 🔢 Numeri o dati importanti (se presenti)

Trascrizione:
${text}

Formato: Usa emoji e formattazione Markdown per rendere il riassunto leggibile.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// Q&A with File Search
export async function askQuestion(
  userId: string,
  transcriptId: string | null,
  question: string
): Promise<{ answer: string; citations?: any[] }> {
  const storeName = await getOrCreateUserFileSearchStore(userId)
  const model = geminiClient.getGenerativeModel({ model: GEMINI_MODELS.FLASH_LITE })

  const config: any = {
    tools: [{
      fileSearch: {
        fileSearchStoreNames: [storeName]
      }
    }]
  }

  // If specific transcript, add metadata filter
  if (transcriptId) {
    config.tools[0].fileSearch.metadataFilter = `transcript_id="${transcriptId}"`
  }

  const result = await model.generateContent({
    contents: question,
    ...config
  })

  const citations = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(
    (chunk: any) => ({
      text: chunk.retrievedContext?.text,
      source: chunk.retrievedContext?.title
    })
  )

  return {
    answer: result.response.text(),
    citations
  }
}
