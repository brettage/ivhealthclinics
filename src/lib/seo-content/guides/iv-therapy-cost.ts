/**
 * Guide article schema and content for /guides/iv-therapy-cost.
 *
 * Long-form guide articles are structured as a typed object so they render
 * identically across the directory and can be regenerated, refreshed, or
 * AI-tuned without touching layout code.
 *
 * Each `Section` is rendered as an H2 with its body underneath. Body content
 * supports an array of "blocks" — paragraphs, lists, callouts, and link
 * refs to other parts of the directory. The renderer (GuideArticle) handles
 * actual JSX.
 */

export type GuideLink = {
  href: string
  text: string
}

export type GuideBlock =
  | { type: 'p'; text: (string | GuideLink)[] }
  | { type: 'ul'; items: (string | GuideLink)[][] }
  | { type: 'callout'; title: string; text: string }

export type GuideSection = {
  id: string // anchor id for table of contents
  heading: string
  blocks: GuideBlock[]
}

export type Guide = {
  slug: string
  title: string
  description: string // meta description, also used as page subtitle
  publishedAt: string // ISO date
  updatedAt: string // ISO date
  readingMinutes: number
  lead: string // one-paragraph intro before the first H2
  sections: GuideSection[]
}

export const ivTherapyCostGuide: Guide = {
  slug: 'iv-therapy-cost',
  title: 'How Much Does IV Therapy Cost?',
  description:
    'A complete 2026 breakdown of IV therapy pricing in the US — typical drip costs, what drives the range, mobile vs in-clinic differences, and how to compare quotes.',
  publishedAt: '2026-04-27',
  updatedAt: '2026-04-27',
  readingMinutes: 9,
  lead: "IV therapy pricing in the US typically ranges from about $100 for a basic hydration drip to $700 or more for specialty therapies like NAD+ or high-dose vitamin C. The range is wide because IV \"therapy\" is really a category — it covers everything from a 30-minute electrolyte drip at a medspa to a multi-hour clinical infusion overseen by an MD. This guide walks through what you can expect to pay in 2026, what actually drives the price, and how to compare quotes across providers.",
  sections: [
    {
      id: 'typical-cost',
      heading: 'Typical IV Therapy Cost in 2026',
      blocks: [
        {
          type: 'p',
          text: [
            'Across the IV therapy clinics in our directory that disclose pricing, most standard wellness drips fall in the $150 to $300 range per session. Basic hydration drips often start lower — around $100 to $140 — and specialty therapies push significantly higher. A rough breakdown:',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Basic hydration drip (saline + electrolytes): $100–$150'],
            ['Standard vitamin and immune blends (Myers\' cocktail, immunity boosts): $150–$275'],
            ['Beauty and anti-aging infusions (glutathione, biotin, NAD+ low-dose): $200–$400'],
            ['Athletic recovery drips (amino acids, B-complex, electrolytes): $200–$350'],
            ['NAD+ at therapeutic doses (250–1000mg): $400–$900+ per session'],
            ['High-dose vitamin C (25g+) and integrative oncology protocols: $200–$500+'],
          ],
        },
        {
          type: 'p',
          text: [
            'These ranges reflect the directory\'s observed pricing in early 2026. ',
            { href: '/clinics?pricing=1', text: 'Filter the directory to clinics that disclose pricing' },
            ' to see actual published rates near you.',
          ],
        },
      ],
    },

    {
      id: 'what-drives-price',
      heading: 'What Drives the Price of IV Therapy',
      blocks: [
        {
          type: 'p',
          text: [
            'Most of the price variation in IV therapy comes down to four factors: the ingredients in the drip, the medical oversight involved, where the service is delivered, and the local market.',
          ],
        },
        {
          type: 'p',
          text: [
            'Ingredient cost is the biggest single driver. A liter of saline costs the clinic just a few dollars; the markup is in what goes into it. NAD+, glutathione, high-dose vitamin C, and amino acid blends are meaningfully more expensive at the wholesale level than basic B-complex or electrolytes. A drip menu priced from $150 to $700 across a single clinic usually reflects exactly this — the more potent or specialty the ingredients, the higher the cost.',
          ],
        },
        {
          type: 'p',
          text: [
            'Medical oversight is the second factor. Clinics with an on-site medical director, RN administration, and adverse-event protocols typically price higher than clinics where a nurse practitioner or RN signs off remotely. This isn\'t inherently a quality difference — both models can be safe — but the cost structure of having an MD on payroll or on call shows up in the per-drip price.',
          ],
        },
        {
          type: 'p',
          text: [
            'Delivery model matters too. ',
            { href: '/mobile-iv', text: 'Mobile IV providers' },
            ' generally charge a premium of $25–$75 over their in-clinic equivalents to cover travel, the nurse\'s time, and supply transport. Some mobile providers fold this into the base price; others tack it on as a service fee.',
          ],
        },
        {
          type: 'p',
          text: [
            'Finally, geography. IV therapy in major coastal metros — Manhattan, Los Angeles, San Francisco, Miami concierge — runs noticeably higher than equivalent services in the Midwest or Mountain West. ',
            { href: '/locations/utah', text: 'Utah' },
            ' is among the most affordable markets in the directory, with basic drips often under $75; ',
            { href: '/locations/new-york', text: 'New York' },
            ' and Connecticut concierge providers price meaningfully higher.',
          ],
        },
      ],
    },

    {
      id: 'mobile-vs-clinic',
      heading: 'Mobile IV vs. In-Clinic Pricing',
      blocks: [
        {
          type: 'p',
          text: [
            'Mobile IV typically costs more than in-clinic IV for the same drip — usually $25 to $75 more per session, sometimes substantially more for hotel calls in tourist markets like Las Vegas, Miami, or New Orleans.',
          ],
        },
        {
          type: 'p',
          text: [
            'The premium covers a few real costs: a registered nurse\'s travel time, the supply kit transport, and the "exclusive" window of service (a mobile nurse can do roughly 4–6 calls a day vs. 8–12 patients in a clinic). Some mobile providers also charge minimum order amounts, especially for groups.',
          ],
        },
        {
          type: 'p',
          text: [
            'Whether the premium is worth it depends on your situation. For a one-off hangover or recovery drip on a busy weekend, mobile usually wins on time savings alone. For routine weekly or monthly wellness drips, in-clinic membership pricing often comes out 30–40% cheaper per session.',
          ],
        },
        {
          type: 'callout',
          title: 'Tip — same provider, both options',
          text: 'About a third of clinics in our directory offer both in-clinic and mobile service. If a clinic does both, the in-clinic version is almost always the cheaper option for the same drip — useful if you can drive to them.',
        },
      ],
    },

    {
      id: 'membership-pricing',
      heading: 'Memberships, Packages, and Bulk Pricing',
      blocks: [
        {
          type: 'p',
          text: [
            'Most established IV clinics offer some form of membership or package pricing, and the discounts are real. A typical pattern:',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Monthly membership: 1 drip per month plus discounted add-ons, often $99–$199/month'],
            ['10-pack package: 10 drips of your choice, often 25–35% off the per-session rate'],
            ['Unlimited monthly: rare and usually capped, but available at some high-volume clinics'],
            ['Annual prepay: typically the deepest discount, often 30–45% off per session'],
          ],
        },
        {
          type: 'p',
          text: [
            'If you\'re planning to do more than two or three drips a year, pricing out the membership is almost always worth it. The rough rule: if the monthly fee is less than 60% of the per-session rate, the membership pays for itself even at a single drip per month.',
          ],
        },
      ],
    },

    {
      id: 'insurance',
      heading: 'Does Insurance Cover IV Therapy?',
      blocks: [
        {
          type: 'p',
          text: [
            'For most wellness IV therapy — vitamin drips, hydration, beauty infusions, NAD+ — the answer is no. Wellness IV is considered elective, and US health insurance virtually never covers it. Some clinics will provide a superbill on request, but reimbursement is unlikely.',
          ],
        },
        {
          type: 'p',
          text: [
            'There are a few specific exceptions where IV therapy may be covered:',
          ],
        },
        {
          type: 'ul',
          items: [
            ['IV iron infusions for diagnosed iron-deficiency anemia (often covered with prior authorization)'],
            ['IV hydration ordered as part of a documented medical condition (severe dehydration, hyperemesis gravidarum, etc.)'],
            ['Therapeutic IV protocols ordered by a physician for a covered diagnosis'],
            ['HSA and FSA accounts can sometimes be used for IV therapy with a Letter of Medical Necessity from a doctor, even when insurance won\'t directly reimburse'],
          ],
        },
        {
          type: 'p',
          text: [
            'If you\'re considering IV therapy for a specific medical reason, talk to your primary care doctor first. They can sometimes order infusions that your insurance will cover, often at a hospital infusion center rather than a wellness clinic.',
          ],
        },
      ],
    },

    {
      id: 'cost-by-service',
      heading: 'Cost by Type of IV Drip',
      blocks: [
        {
          type: 'p',
          text: [
            'Different drip types have meaningfully different price points. Here\'s what to expect for the most common categories:',
          ],
        },
        {
          type: 'p',
          text: [
            { href: '/services/hydration', text: 'Hydration drips' },
            ' (basic saline plus electrolytes) are the entry-level offering and typically the cheapest, $100–$150. Good for hangovers, dehydration, post-event recovery.',
          ],
        },
        {
          type: 'p',
          text: [
            { href: '/services/vitamin-drips', text: 'Vitamin drips' },
            ' (Myers\' cocktail, B-complex, immunity blends) are the most common offering across the directory and typically run $150–$275. Most clinics list at least 3–5 variants in this category.',
          ],
        },
        {
          type: 'p',
          text: [
            { href: '/services/beauty-anti-aging', text: 'Beauty and anti-aging drips' },
            ' (glutathione, biotin, vitamin C) generally run $200–$400. Glutathione push protocols are sometimes priced separately as add-ons rather than standalone drips.',
          ],
        },
        {
          type: 'p',
          text: [
            { href: '/services/nad-plus', text: 'NAD+ infusions' },
            ' are the priciest mainstream offering. Low-dose (100–250mg) sessions can be in the $200–$400 range, but full therapeutic doses (500–1000mg) run $500–$900 per session and require multi-hour appointments. NAD+ protocols are often sold as 5- or 10-session packages.',
          ],
        },
        {
          type: 'p',
          text: [
            { href: '/services/athletic-recovery', text: 'Athletic recovery drips' },
            ' (amino acids, B-complex, electrolytes, sometimes glutathione) typically run $200–$350. Common add-ons include taurine, magnesium, and L-carnitine.',
          ],
        },
      ],
    },

    {
      id: 'hidden-costs',
      heading: 'Common Hidden Costs and Add-Ons',
      blocks: [
        {
          type: 'p',
          text: [
            'The list price of a drip isn\'t always what you pay. A few common add-ons to watch for:',
          ],
        },
        {
          type: 'ul',
          items: [
            ['New patient consult fee — $50–$150 at some clinics, often waived with first drip purchase'],
            ['Add-on push injections — glutathione, B12, vitamin D, $25–$75 each'],
            ['Anti-nausea (Zofran) push — $20–$40, sometimes auto-included for hangover drips'],
            ['Mobile travel/service fee — $25–$100 depending on distance and time of day'],
            ['Hotel/concierge surcharge — $25–$200 in tourist markets, especially for after-hours calls'],
            ['Lab work — if a clinic requires baseline labs before high-dose vitamin C or NAD+, this can run $100–$300 separately'],
          ],
        },
        {
          type: 'p',
          text: [
            'When comparing quotes, ask for the all-in price including any required add-ons. Reputable clinics will give you a clear quote upfront; if a clinic is cagey about pricing, that\'s itself useful information.',
          ],
        },
      ],
    },

    {
      id: 'how-to-compare',
      heading: 'How to Compare Pricing Across Clinics',
      blocks: [
        {
          type: 'p',
          text: [
            'A few practical tips for getting accurate price comparisons:',
          ],
        },
        {
          type: 'p',
          text: [
            'Compare the same drip across providers, not different drips. A "Myers\' cocktail" at one clinic and a "Wellness Drip" at another may have meaningfully different ingredients. Ask each clinic for the specific ingredient list.',
          ],
        },
        {
          type: 'p',
          text: [
            'Ask about membership pricing if you\'re considering more than one or two visits a year. Sticker price comparisons can mislead; the real cost-per-drip with membership pricing is often very different.',
          ],
        },
        {
          type: 'p',
          text: [
            'Factor in the visit experience. A $200 drip that includes a comfortable chair, blanket, complimentary beverage, and a 60-minute window without rushing is different from a $150 drip in a shared room with a 30-minute slot. Both can be appropriate; just be clear about what you\'re paying for.',
          ],
        },
        {
          type: 'p',
          text: [
            { href: '/clinics?pricing=1', text: 'The directory\'s pricing filter' },
            ' surfaces only clinics that publish their rates, which makes the initial comparison much faster.',
          ],
        },
      ],
    },

    {
      id: 'is-it-worth-it',
      heading: 'Is IV Therapy Worth the Cost?',
      blocks: [
        {
          type: 'p',
          text: [
            'IV therapy isn\'t cheap, and the evidence base for routine wellness drips is mixed. For most people, the honest answer is "it depends on what you\'re trying to achieve and whether you have specific deficiencies."',
          ],
        },
        {
          type: 'p',
          text: [
            'The strongest cases for IV therapy: documented vitamin or mineral deficiencies that don\'t respond well to oral supplementation, acute dehydration that needs fast correction, post-illness recovery where you can\'t keep food and fluids down, and certain clinical protocols (high-dose vitamin C for specific applications, NAD+ for documented metabolic conditions).',
          ],
        },
        {
          type: 'p',
          text: [
            'Weaker cases: routine "feel better" wellness drips with no underlying deficiency, hangover prevention that could be handled with rest and oral hydration, weight loss support without an underlying medical reason. None of these are wrong, but the bang-for-buck is often lower than the marketing suggests.',
          ],
        },
        {
          type: 'p',
          text: [
            'If you\'re interested in IV therapy for a specific reason, talking to a clinic\'s medical director (not just the front desk) is usually worth the consult. ',
            { href: '/clinics', text: 'Browse the directory' },
            ' or ',
            { href: '/locations', text: 'find clinics near you by state' },
            '.',
          ],
        },
      ],
    },

    {
      id: 'find-a-clinic',
      heading: 'Find an IV Therapy Clinic Near You',
      blocks: [
        {
          type: 'p',
          text: [
            'IVHealthClinics lists nearly 3,000 verified IV therapy clinics across the US. You can ',
            { href: '/clinics', text: 'browse all clinics' },
            ', ',
            { href: '/locations', text: 'find clinics by state' },
            ', or filter to ',
            { href: '/clinics?mobile=1', text: 'mobile IV providers' },
            ' or ',
            { href: '/clinics?pricing=1', text: 'clinics with disclosed pricing' },
            '. For specific drip types, the ',
            { href: '/services', text: 'services index' },
            ' is the fastest way to find clinics offering exactly what you need.',
          ],
        },
      ],
    },
  ],
}
