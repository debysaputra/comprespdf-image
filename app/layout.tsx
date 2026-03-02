import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FileCompressor — Compress Images & PDFs',
  description: 'Compress your images (JPG, PNG, WebP, GIF) and PDF files instantly. Free, fast, and processed locally on your machine.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
