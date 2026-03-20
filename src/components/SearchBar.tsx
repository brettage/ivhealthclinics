'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const quickFilters = [
    { label: 'NAD+ Therapy', href: '/services/nad-plus' },
    { label: 'Mobile IV', href: '/mobile-iv' },
    { label: 'Hydration', href: '/services/hydration' },
    { label: 'Vitamin Drips', href: '/services/vitamin-drips' },
    { label: 'Hangover Relief', href: '/services/hangover-relief' },
  ]

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city, state, or clinic name..."
            className="w-full pl-12 pr-4 py-4 text-base text-gray-900 bg-white rounded-l-xl border-2 border-r-0 border-white/50 focus:border-emerald-300 focus:outline-none placeholder:text-gray-400 shadow-lg"
          />
        </div>
        <button
          type="submit"
          className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-r-xl hover:from-emerald-700 hover:to-cyan-700 transition-all shadow-lg whitespace-nowrap"
        >
          Search
        </button>
      </form>

      {/* Quick Filters */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {quickFilters.map((filter) => (
          <a
            key={filter.label}
            href={filter.href}
            className="px-3 py-1.5 text-sm font-medium text-white/90 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/25 transition-colors"
          >
            {filter.label}
          </a>
        ))}
      </div>
    </div>
  )
}
