import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      {
        userAgent: [
          'CCBot',
          'ChatGPT-User',
          'Claude-User',
          'ClaudeBot',
          'GPTBot',
          'Google-Extended',
          'PerplexityBot',
        ],
        allow: '/',
      },
    ],
    sitemap: 'https://ivhealthclinics.com/sitemap.xml',
  }
}
