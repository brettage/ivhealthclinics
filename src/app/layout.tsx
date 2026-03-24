import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GoogleAnalytics from '@/components/GoogleAnalytics'
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
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'IVHealthClinics — Find IV Therapy & Hydration Clinics Near You',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IVHealthClinics — Find IV Therapy & Hydration Clinics Near You',
    description:
      'The most comprehensive directory for IV hydration, vitamin drips, NAD+ therapy, and infusion wellness clinics.',
    images: ['/og-default.png'],
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
        <GoogleAnalytics />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
