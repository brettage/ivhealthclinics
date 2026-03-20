import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 1.232-.046 2.453-.138 3.662a4.006 4.006 0 0 1-3.7 3.7 48.678 48.678 0 0 1-7.324 0 4.006 4.006 0 0 1-3.7-3.7c-.017-.22-.032-.441-.046-.662M19.5 12l-4.5 4.5m4.5-4.5l-4.5-4.5M19.5 12H4.5m0 0l4.5 4.5M4.5 12l4.5-4.5" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">
                IV<span className="text-emerald-400">Health</span>Clinics
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              The most comprehensive directory for IV hydration, vitamin drips, and infusion therapy clinics across the United States.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Directory</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/locations">Browse by Location</FooterLink>
              <FooterLink href="/services">Browse by Service</FooterLink>
              <FooterLink href="/mobile-iv">Mobile IV Services</FooterLink>
              <FooterLink href="/compare">Compare Clinics</FooterLink>
              <FooterLink href="/search">Search</FooterLink>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/guides">Guides</FooterLink>
              <FooterLink href="/guides/iv-therapy-cost">IV Therapy Cost</FooterLink>
              <FooterLink href="/guides/types-of-iv-drips">Types of IV Drips</FooterLink>
              <FooterLink href="/guides/mobile-vs-clinic-iv">Mobile vs In-Clinic</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Ten After Ten Group LLC. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            IVHealthClinics is for informational purposes only and does not provide medical advice.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
        {children}
      </Link>
    </li>
  )
}
