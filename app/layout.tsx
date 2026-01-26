import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WhaleScope - Track Smart Money on Solana',
  description: 'See what profitable wallets are buying before it pumps',
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
