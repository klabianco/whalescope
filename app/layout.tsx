import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ClientProviders } from './providers/ClientProviders'

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
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Script 
          data-goatcounter="https://whalescope.goatcounter.com/count"
          async
          src="//gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
