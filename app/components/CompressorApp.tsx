'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'

type Tab = 'image' | 'pdf'
type ImageFormat = 'keep' | 'jpeg' | 'png' | 'webp'
type PdfLevel = 'low' | 'medium' | 'high'

interface FileResult {
  blob: Blob
  filename: string
  originalSize: number
  compressedSize: number
  format: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getReduction(original: number, compressed: number): number {
  return Math.round((1 - compressed / original) * 100)
}

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.bmp'
const PDF_ACCEPT = '.pdf'

// --- Icons ---
function UploadIcon() {
  return (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function ImageIcon({ size = 7 }: { size?: number }) {
  return (
    <svg className={`w-${size} h-${size}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function PdfIcon({ size = 7 }: { size?: number }) {
  return (
    <svg className={`w-${size} h-${size}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// --- Main Component ---
export default function CompressorApp() {
  const [tab, setTab] = useState<Tab>('image')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [quality, setQuality] = useState(80)
  const [imageFormat, setImageFormat] = useState<ImageFormat>('keep')
  const [pdfLevel, setPdfLevel] = useState<PdfLevel>('medium')
  const [isCompressing, setIsCompressing] = useState(false)
  const [result, setResult] = useState<FileResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setFile(null)
    setResult(null)
    setError(null)
  }

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    resetState()
  }

  const validateAndSetFile = (selected: File) => {
    setError(null)
    setResult(null)

    if (tab === 'image') {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
      if (!validTypes.includes(selected.type)) {
        setError('Please upload a valid image file (JPG, PNG, WebP, GIF, BMP)')
        return
      }
    } else {
      if (selected.type !== 'application/pdf') {
        setError('Please upload a valid PDF file')
        return
      }
    }

    if (selected.size > 4 * 1024 * 1024) {
      setError('File size must be less than 4MB')
      return
    }

    setFile(selected)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSetFile(dropped)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) validateAndSetFile(selected)
    e.target.value = ''
  }

  const handleCompress = async () => {
    if (!file) return

    setIsCompressing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      let endpoint: string

      if (tab === 'image') {
        formData.append('quality', quality.toString())
        formData.append('format', imageFormat)
        endpoint = '/api/compress/image'
      } else {
        formData.append('level', pdfLevel)
        endpoint = '/api/compress/pdf'
      }

      const response = await fetch(endpoint, { method: 'POST', body: formData })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Compression failed' }))
        throw new Error(errData.error || 'Compression failed')
      }

      const originalSize = parseInt(response.headers.get('X-Original-Size') || '0')
      const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0')
      const outputFormat = response.headers.get('X-Output-Format') || (tab === 'pdf' ? 'pdf' : 'jpeg')

      const blob = await response.blob()
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat
      const filename = `${baseName}-compressed.${ext}`

      setResult({
        blob,
        filename,
        originalSize: originalSize || file.size,
        compressedSize: compressedSize || blob.size,
        format: outputFormat,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed. Please try again.')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reduction = result ? getReduction(result.originalSize, result.compressedSize) : 0
  const qualityLabel = quality >= 80 ? 'High Quality' : quality >= 50 ? 'Balanced' : 'Max Compression'

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-600/30">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-5 h-16 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-900/40">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-zinc-100 leading-none">FileCompressor</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-none">Images & PDFs</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
              Free & Local
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 pb-20">
        {/* ---- Hero ---- */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-950/50 border border-violet-800/40 rounded-full px-4 py-1.5 text-xs text-violet-300 font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Processed on your machine — no cloud uploads
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-100 tracking-tight mb-4 leading-tight">
            Compress Files
            <span className="block bg-gradient-to-r from-violet-400 via-purple-400 to-violet-300 bg-clip-text text-transparent">
              Without Losing Quality
            </span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Shrink your images and PDFs instantly. Fast, private, and completely free.
          </p>
        </div>

        {/* ---- Tabs ---- */}
        <div className="flex gap-1.5 mb-8 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl w-fit mx-auto">
          <button
            onClick={() => handleTabChange('image')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === 'image'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ImageIcon size={4} />
            Images
          </button>
          <button
            onClick={() => handleTabChange('pdf')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === 'pdf'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <PdfIcon size={4} />
            PDF
          </button>
        </div>

        {/* ---- Drop Zone ---- */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-14 text-center cursor-pointer transition-all duration-200 group mb-5 ${
            isDragging
              ? 'border-violet-500 bg-violet-950/30 scale-[1.01]'
              : file
              ? 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-600'
              : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={tab === 'image' ? IMAGE_ACCEPT : PDF_ACCEPT}
            onChange={handleInputChange}
          />

          {/* Glow effect when dragging */}
          {isDragging && (
            <div className="absolute inset-0 rounded-3xl bg-violet-500/5 pointer-events-none" />
          )}

          {file ? (
            <div className="flex flex-col items-center gap-4">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border ${
                tab === 'image'
                  ? 'bg-blue-950/60 border-blue-800/50 text-blue-400'
                  : 'bg-red-950/60 border-red-800/50 text-red-400'
              }`}>
                {tab === 'image' ? <ImageIcon size={9} /> : <PdfIcon size={9} />}
              </div>
              <div>
                <p className="text-zinc-200 font-semibold text-lg">{file.name}</p>
                <p className="text-zinc-500 text-sm mt-1">{formatBytes(file.size)}</p>
              </div>
              <p className="text-zinc-600 text-xs border border-zinc-800 rounded-full px-3 py-1 group-hover:border-zinc-700 transition-colors">
                Click or drop to change file
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-500 group-hover:border-zinc-600 group-hover:text-zinc-400 transition-all">
                <UploadIcon />
              </div>
              <div>
                <p className="text-zinc-300 font-semibold text-lg mb-1.5">
                  Drop your {tab === 'image' ? 'image' : 'PDF'} here
                </p>
                <p className="text-zinc-500 text-sm">or click to browse files</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {tab === 'image'
                  ? ['JPG', 'PNG', 'WebP', 'GIF', 'BMP'].map((f) => (
                      <span key={f} className="text-[11px] font-medium text-zinc-600 bg-zinc-800/80 border border-zinc-700/50 rounded-full px-2.5 py-0.5">
                        {f}
                      </span>
                    ))
                  : (
                    <span className="text-[11px] font-medium text-zinc-600 bg-zinc-800/80 border border-zinc-700/50 rounded-full px-2.5 py-0.5">
                      PDF
                    </span>
                  )
                }
                <span className="text-[11px] font-medium text-zinc-600 bg-zinc-800/80 border border-zinc-700/50 rounded-full px-2.5 py-0.5">
                  Max 4MB
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ---- Error ---- */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 text-red-400 rounded-2xl px-4 py-3.5 mb-5 text-sm">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ---- Settings ---- */}
        {file && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-5">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-5">
              Compression Settings
            </p>

            {tab === 'image' ? (
              <div className="space-y-6">
                {/* Quality Slider */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-zinc-400 text-sm">Quality</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-violet-400/70 bg-violet-950/60 border border-violet-800/40 rounded-full px-2 py-0.5">
                        {qualityLabel}
                      </span>
                      <span className="text-violet-400 font-mono text-sm font-bold w-10 text-right">{quality}%</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-violet-600 bg-zinc-800"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-600 mt-2">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="text-zinc-400 text-sm block mb-3">Output Format</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['keep', 'jpeg', 'png', 'webp'] as ImageFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setImageFormat(fmt)}
                        className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                          imageFormat === fmt
                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30'
                            : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        {fmt === 'keep' ? 'Original' : fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {imageFormat !== 'keep' && (
                    <p className="text-zinc-600 text-xs mt-2">
                      File will be converted to <span className="text-zinc-400 font-medium">.{imageFormat === 'jpeg' ? 'jpg' : imageFormat}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-zinc-400 text-sm block mb-3">Compression Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as PdfLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setPdfLevel(level)}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                        pdfLevel === level
                          ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30'
                          : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {level === 'low' ? 'Fast' : level === 'medium' ? 'Balanced' : 'Maximum'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <p className="text-[11px] text-zinc-600 text-center">Faster · Less compression</p>
                  <p className="text-[11px] text-zinc-600 text-center">Recommended</p>
                  <p className="text-[11px] text-zinc-600 text-center">Slower · More compression</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Compress Button ---- */}
        {file && (
          <button
            onClick={handleCompress}
            disabled={isCompressing}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-violet-900/30 hover:shadow-violet-900/50 text-base tracking-wide mb-6 flex items-center justify-center gap-3"
          >
            {isCompressing ? (
              <>
                <SpinnerIcon />
                Compressing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
                Compress Now
              </>
            )}
          </button>
        )}

        {/* ---- Result Card ---- */}
        {result && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            {/* Success header */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-emerald-900/30 border-b border-emerald-800/30 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckIcon />
              </div>
              <div>
                <p className="text-emerald-400 font-semibold text-sm">Compression Complete!</p>
                <p className="text-emerald-600 text-xs">{result.filename}</p>
              </div>
            </div>

            <div className="p-6">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-700/30">
                  <p className="text-zinc-500 text-xs mb-1.5 font-medium">Original</p>
                  <p className="text-zinc-200 font-bold text-lg">{formatBytes(result.originalSize)}</p>
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-black tracking-tighter ${
                      reduction > 0 ? 'text-emerald-400' : reduction < 0 ? 'text-amber-400' : 'text-zinc-400'
                    }`}>
                      {reduction > 0 ? `-${reduction}%` : reduction < 0 ? `+${Math.abs(reduction)}%` : '0%'}
                    </div>
                    <div className="text-[11px] text-zinc-600 font-medium mt-0.5">
                      {reduction > 0 ? 'smaller' : reduction < 0 ? 'larger' : 'no change'}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-700/30">
                  <p className="text-zinc-500 text-xs mb-1.5 font-medium">Compressed</p>
                  <p className={`font-bold text-lg ${reduction > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatBytes(result.compressedSize)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-zinc-600 mb-2">
                  <span>Size reduction</span>
                  <span className="font-medium text-zinc-500">
                    {reduction > 0
                      ? `${formatBytes(result.originalSize - result.compressedSize)} saved`
                      : 'File already optimized'}
                  </span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      reduction > 0
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        : 'bg-zinc-600'
                    }`}
                    style={{
                      width: `${Math.max(2, 100 - (result.compressedSize / result.originalSize) * 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-700 mt-1.5">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2.5 text-base"
              >
                <DownloadIcon />
                Download {result.filename}
              </button>

              {/* Compress another */}
              <button
                onClick={resetState}
                className="w-full mt-3 py-3 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
              >
                Compress another file
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-zinc-800/60 py-6 mt-4">
        <div className="mx-auto max-w-3xl px-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-600">
          <span>FileCompressor — All processing done locally on your machine</span>
          <span>Images &amp; PDFs · Up to 50MB</span>
        </div>
      </footer>
    </div>
  )
}
