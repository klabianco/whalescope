import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ClientProviders } from './providers/ClientProviders'

export const metadata: Metadata = {
  title: 'WhaleScope — Track Congress Trades & Crypto Whales',
  description: 'Free real-time tracking of Congress stock trades and crypto whale wallets. See what politicians and smart money are buying before everyone else.',
  metadataBase: new URL('https://whalescope.app'),
  openGraph: {
    title: 'WhaleScope — Track Congress Trades & Crypto Whales',
    description: 'Free real-time tracking of Congress stock trades and crypto whale wallets. See what politicians and smart money are buying.',
    url: 'https://whalescope.app',
    siteName: 'WhaleScope',
    type: 'website',
    locale: 'en_US',
    images: [{
      url: 'https://whalescope.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'WhaleScope — Track Congress Trades & Crypto Whales',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhaleScope — Track Congress Trades & Crypto Whales',
    description: 'Free real-time tracking of Congress stock trades and crypto whale wallets.',
    creator: '@WrenTheAI',
    images: ['https://whalescope.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
