import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'

export type ExportFormat = 'txt' | 'md' | 'pdf' | 'docx' | 'srt' | 'vtt' | 'json'

interface Segment {
  start: number
  end: number
  text: string
  speaker?: string
}

interface TranscriptData {
  fileName: string
  text: string
  segments: Segment[]
  language?: string
  duration?: number
  createdAt: string
  summary?: string
}

// Format timestamp helpers
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatSrtTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(',', '.')
}

// TXT Export
export function exportTxt(data: TranscriptData): string {
  let output = `${data.fileName}\n`
  output += `Data: ${new Date(data.createdAt).toLocaleString('it-IT')}\n`
  if (data.duration) {
    output += `Durata: ${formatTimestamp(data.duration)}\n`
  }
  output += '\n---\n\n'

  data.segments.forEach(segment => {
    const timestamp = `[${formatTimestamp(segment.start)}]`
    const speaker = segment.speaker ? `${segment.speaker}: ` : ''
    output += `${timestamp} ${speaker}${segment.text}\n\n`
  })

  return output
}

// Markdown Export
export function exportMarkdown(data: TranscriptData): string {
  let output = `# ${data.fileName}\n\n`
  output += `**Data**: ${new Date(data.createdAt).toLocaleString('it-IT')}  \n`
  if (data.duration) {
    output += `**Durata**: ${formatTimestamp(data.duration)}  \n`
  }
  if (data.language) {
    output += `**Lingua**: ${data.language}  \n`
  }
  output += '\n---\n\n'

  output += '## Trascrizione\n\n'
  data.segments.forEach(segment => {
    const timestamp = `**[${formatTimestamp(segment.start)}]**`
    const speaker = segment.speaker ? `*${segment.speaker}*: ` : ''
    output += `${timestamp} ${speaker}${segment.text}\n\n`
  })

  if (data.summary) {
    output += '\n---\n\n## Riassunto\n\n'
    output += data.summary
  }

  return output
}

// PDF Export
export async function exportPdf(data: TranscriptData): Promise<Blob> {
  const doc = new jsPDF()
  let y = 20

  // Helper to add text with auto-pagination
  const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
    doc.setFontSize(fontSize)
    if (isBold) {
      doc.setFont('helvetica', 'bold')
    } else {
      doc.setFont('helvetica', 'normal')
    }

    const lines = doc.splitTextToSize(text, 170)
    lines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(line, 20, y)
      y += fontSize * 0.5
    })
    y += 2
  }

  // Header
  addText(data.fileName, 16, true)
  addText(`Data: ${new Date(data.createdAt).toLocaleString('it-IT')}`, 10)
  if (data.duration) {
    addText(`Durata: ${formatTimestamp(data.duration)}`, 10)
  }
  y += 5

  // Transcript
  data.segments.forEach(segment => {
    const timestamp = `[${formatTimestamp(segment.start)}]`
    const speaker = segment.speaker ? `${segment.speaker}: ` : ''
    const text = `${timestamp} ${speaker}${segment.text}`
    addText(text)
  })

  return doc.output('blob')
}

// DOCX Export
export async function exportDocx(data: TranscriptData): Promise<Blob> {
  const children: Paragraph[] = []

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.fileName,
          bold: true,
          size: 28
        })
      ]
    })
  )

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Data: ${new Date(data.createdAt).toLocaleString('it-IT')}`,
          size: 20
        })
      ]
    })
  )

  if (data.duration) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Durata: ${formatTimestamp(data.duration)}`,
            size: 20
          })
        ]
      })
    )
  }

  // Empty line
  children.push(new Paragraph({ text: '' }))

  // Segments
  data.segments.forEach(segment => {
    const timestamp = `[${formatTimestamp(segment.start)}]`
    const speaker = segment.speaker ? `${segment.speaker}: ` : ''

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${timestamp} `,
            bold: true
          }),
          new TextRun({
            text: speaker + segment.text
          })
        ]
      })
    )
  })

  const doc = new Document({
    sections: [{
      children
    }]
  })

  return await Packer.toBlob(doc)
}

// SRT Export (SubRip)
export function exportSrt(data: TranscriptData): string {
  return data.segments
    .map((segment, index) => {
      return `${index + 1}\n${formatSrtTimestamp(segment.start)} --> ${formatSrtTimestamp(segment.end)}\n${segment.text}\n`
    })
    .join('\n')
}

// VTT Export (WebVTT)
export function exportVtt(data: TranscriptData): string {
  let output = 'WEBVTT\n\n'
  data.segments.forEach(segment => {
    output += `${formatVttTimestamp(segment.start)} --> ${formatVttTimestamp(segment.end)}\n`
    output += `${segment.text}\n\n`
  })
  return output
}

// JSON Export
export function exportJson(data: TranscriptData): string {
  return JSON.stringify({
    metadata: {
      fileName: data.fileName,
      duration: data.duration,
      language: data.language,
      createdAt: data.createdAt
    },
    segments: data.segments,
    fullText: data.text,
    summary: data.summary
  }, null, 2)
}

// Main export function
export async function exportTranscript(
  format: ExportFormat,
  data: TranscriptData
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const baseFilename = data.fileName.replace(/\.[^/.]+$/, '')

  switch (format) {
    case 'txt':
      return {
        blob: new Blob([exportTxt(data)], { type: 'text/plain' }),
        filename: `${baseFilename}.txt`,
        mimeType: 'text/plain'
      }

    case 'md':
      return {
        blob: new Blob([exportMarkdown(data)], { type: 'text/markdown' }),
        filename: `${baseFilename}.md`,
        mimeType: 'text/markdown'
      }

    case 'pdf':
      return {
        blob: await exportPdf(data),
        filename: `${baseFilename}.pdf`,
        mimeType: 'application/pdf'
      }

    case 'docx':
      return {
        blob: await exportDocx(data),
        filename: `${baseFilename}.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }

    case 'srt':
      return {
        blob: new Blob([exportSrt(data)], { type: 'text/srt' }),
        filename: `${baseFilename}.srt`,
        mimeType: 'text/srt'
      }

    case 'vtt':
      return {
        blob: new Blob([exportVtt(data)], { type: 'text/vtt' }),
        filename: `${baseFilename}.vtt`,
        mimeType: 'text/vtt'
      }

    case 'json':
      return {
        blob: new Blob([exportJson(data)], { type: 'application/json' }),
        filename: `${baseFilename}.json`,
        mimeType: 'application/json'
      }

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}
