'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 1.232-.046 2.453-.138 3.662a4.006 4.006 0 0 1-3.7 3.7 48.678 48.678 0 0 1-7.324 0 4.006 4.006 0 0 1-3.7-3.7c-.017-.22-.032-.441-.046-.662M19.5 12l-4.5 4.5m4.5-4.5l-4.5-4.5M19.5 12H4.5m0 0l4.5 4.5M4.5 12l4.5-4.5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
              IV<span className="text-emerald-600">Health</span>Clinics
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/locations">Locations</NavLink>
            <NavLink href="/services">Services</NavLink>
            <NavLink href="/mobile-iv">Mobile IV</NavLink>
            <NavLink href="/compare">Compare</NavLink>
            <NavLink href="/guides">Guides</NavLink>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <Link
              href="/search"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-sm hover:shadow-md"
            >
              Find a Clinic
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            <MobileNavLink href="/locations" onClick={() => setMobileOpen(false)}>Locations</MobileNavLink>
            <MobileNavLink href="/services" onClick={() => setMobileOpen(false)}>Services</MobileNavLink>
            <MobileNavLink href="/mobile-iv" onClick={() => setMobileOpen(false)}>Mobile IV</MobileNavLink>
            <MobileNavLink href="/compare" onClick={() => setMobileOpen(false)}>Compare</MobileNavLink>
            <MobileNavLink href="/guides" onClick={() => setMobileOpen(false)}>Guides</MobileNavLink>
            <div className="pt-2">
              <Link
                href="/search"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg"
              >
                Find a Clinic
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 rounded-lg hover:bg-emerald-50/50 transition-colors"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-lg"
    >
      {children}
    </Link>
  )
}
