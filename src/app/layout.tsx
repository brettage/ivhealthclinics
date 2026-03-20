import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://ivhealthclinics.com'),
  title: {
    default: 'IVHealthClinics — Find IV Therapy & Hydration Clinics Near You',
    template: '%s | IVHealthClinics',
  },
  description:
    'The most comprehensive directory for IV hydration, vitamin drips, NAD+ therapy, and infusion wellness clinics. Compare pricing, services, and credentials across the US.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ivhealthclinics.com',
    siteName: 'IVHealthClinics',
    title: 'IVHealthClinics — Find IV Therapy & Hydration Clinics Near You',
    description:
      'The most comprehensive directory for IV hydration, vitamin drips, NAD+ therapy, and infusion wellness clinics.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IVHealthClinics — Find IV Therapy & Hydration Clinics Near You',
    description:
      'The most comprehensive directory for IV hydration, vitamin drips, NAD+ therapy, and infusion wellness clinics.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
