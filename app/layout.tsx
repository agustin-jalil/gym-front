import type { Metadata, Viewport } from 'next'
import { DM_Sans, Outfit } from 'next/font/google'
import { AppShell } from '@/components/app-shell'
import { THEME_INIT_SCRIPT, ThemeProvider } from '@/components/theme'
import { APP_DESCRIPTION, APP_NAME } from '@/lib/app'
import './globals.css'

// Outfit (títulos y cifras: geométrica, redondeada, deportiva) + DM Sans (texto: cálida y muy legible en pantallas chicas)
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e13' },
  ],
}

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  // App personal: no se indexa.
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`dark ${outfit.variable} ${dmSans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
