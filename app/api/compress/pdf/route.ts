import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const level = (formData.get('level') as string || 'medium').toLowerCase()

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const originalSize = buffer.length

    const pdfDoc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
    })

    // Strip metadata to reduce file size
    pdfDoc.setTitle('')
    pdfDoc.setAuthor('')
    pdfDoc.setSubject('')
    pdfDoc.setKeywords([])
    pdfDoc.setProducer('')
    pdfDoc.setCreator('')

    const saveOptions = {
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: level === 'high' ? 20 : level === 'medium' ? 50 : 100,
    }

    const compressedBytes = await pdfDoc.save(saveOptions)
    const compressedBuffer = Buffer.from(compressedBytes)

    const originalName = file.name.replace(/\.pdf$/i, '')

    return new NextResponse(new Uint8Array(compressedBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedBuffer.length.toString(),
        'X-Output-Format': 'pdf',
        'Content-Disposition': `attachment; filename="${originalName}-compressed.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF compression error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF compression failed' },
      { status: 500 }
    )
  }
}
