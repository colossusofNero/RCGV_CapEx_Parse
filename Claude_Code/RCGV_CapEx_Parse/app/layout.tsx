import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RCGV CapEx PDF Parser',
  description: 'Extract payment information from PDF files',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
