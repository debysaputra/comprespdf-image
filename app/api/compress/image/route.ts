import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const quality = Math.min(100, Math.max(1, parseInt(formData.get('quality') as string || '80')))
    const format = (formData.get('format') as string || 'keep').toLowerCase()

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const originalSize = buffer.length

    const sharpImg = sharp(buffer)
    const metadata = await sharpImg.metadata()

    // Determine output format
    let outputFormat = format === 'keep' ? (metadata.format || 'jpeg') : format
    if (outputFormat === 'jpg') outputFormat = 'jpeg'
    if (!['jpeg', 'png', 'webp'].includes(outputFormat)) outputFormat = 'jpeg'

    let compressedBuffer: Buffer

    switch (outputFormat) {
      case 'jpeg':
        compressedBuffer = await sharpImg
          .jpeg({ quality, progressive: true })
          .toBuffer()
        break
      case 'png':
        const compressionLevel = Math.round(9 - (quality / 100) * 9)
        compressedBuffer = await sharpImg
          .png({ compressionLevel, adaptiveFiltering: true })
          .toBuffer()
        break
      case 'webp':
        compressedBuffer = await sharpImg
          .webp({ quality })
          .toBuffer()
        break
      default:
        compressedBuffer = await sharpImg.jpeg({ quality }).toBuffer()
    }

    const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat
    const originalName = file.name.replace(/\.[^.]+$/, '')

    return new NextResponse(new Uint8Array(compressedBuffer), {
      headers: {
        'Content-Type': `image/${outputFormat === 'jpeg' ? 'jpeg' : outputFormat}`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedBuffer.length.toString(),
        'X-Output-Format': outputFormat,
        'Content-Disposition': `attachment; filename="${originalName}-compressed.${ext}"`,
      },
    })
  } catch (err) {
    console.error('Image compression error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Image compression failed' },
      { status: 500 }
    )
  }
}
