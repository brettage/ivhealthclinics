/**
 * SEO intro content for state pages (/locations/[state]).
 *
 * Why this exists: state pages without unique copy tend to look like
 * thin/duplicate content to Google, which suppresses rankings. Each entry
 * here is hand-tuned (with AI assistance) using actual stats from the DB
 * so the copy contains real, state-specific information rather than
 * generic filler.
 *
 * Keyed by canonical state slug (the same form used in URLs:
 * 'florida', 'new-york', 'california'). States not in this map fall
 * through to the default templated description on the state page.
 *
 * Tuning notes:
 * - Each intro is ~180–220 words across 4 sections (lead + 3 H2s)
 * - Stats are pulled from snapshots of the DB; refresh them quarterly
 * - H2s target high-intent queries: cost, mobile, services
 * - Numbers are kept as broad ranges to avoid false precision
 *
 * Last refreshed: 2026-04-27 from production data
 */

export type StateIntroSection = {
  heading: string
  body: string
}

export type StateIntro = {
  lead: string
  sections: StateIntroSection[]
}

export const STATE_INTROS: Record<string, StateIntro> = {
  california: {
    lead: 'California is the largest IV therapy market in the US, with nearly 400 verified clinics serving the state from Los Angeles to San Francisco. Wellness-driven demand and a competitive provider landscape have produced one of the country\'s deepest selections of mobile drips, NAD+ infusions, and concierge IV services.',
    sections: [
      {
        heading: 'IV Therapy Cost in California',
        body: 'Among California clinics that disclose pricing, basic hydration drips typically start in the $100–$150 range, with most standard wellness drips landing between $150 and $250. Specialty therapies like NAD+ and high-dose vitamin C run higher — often $400 to $800 or more per session, depending on dose and provider.',
      },
      {
        heading: 'Mobile IV Services in California',
        body: 'About 27% of California IV providers offer mobile or in-home service, one of the highest rates in the country. Coverage is densest in the Los Angeles, San Diego, and San Francisco Bay Area markets, with same-day appointments commonly available. Service radius and minimum order pricing vary by provider.',
      },
      {
        heading: 'Popular Services in California',
        body: 'The most-listed services across California clinics are general vitamin drips, beauty and anti-aging infusions, immune support blends, and hydration therapy. NAD+ availability is unusually strong here — California has the largest NAD+ provider network in the directory, reflecting the state\'s longevity and biohacking scene.',
      },
    ],
  },

  texas: {
    lead: 'Texas hosts the second-largest network of IV therapy providers in the US, with nearly 300 verified clinics across Houston, Dallas, Austin, San Antonio, and El Paso. The Texas market skews toward established storefront clinics, athletic-recovery drips, and a growing mobile-IV scene driven by the state\'s major metros.',
    sections: [
      {
        heading: 'IV Therapy Cost in Texas',
        body: 'Texas clinics that publish pricing typically start basic hydration drips around $130–$160, with full vitamin and immune blends ranging $200–$350. NAD+ and athletic-performance protocols are usually priced separately and often run $400–$700 per session. Membership and package pricing is common at higher-volume clinics.',
      },
      {
        heading: 'Mobile IV Services in Texas',
        body: 'Roughly 16% of Texas IV clinics offer mobile delivery, with the strongest coverage in Houston, Dallas, and Austin metros. Same-day in-home appointments are widely available in those markets; smaller cities tend to be in-clinic only.',
      },
      {
        heading: 'Popular Services in Texas',
        body: 'Vitamin drips, immune support, beauty and anti-aging infusions, and hydration are the four most commonly listed services across Texas. Athletic recovery drips are a notable Texas specialty — the state ranks among the top markets for performance-focused IV therapy, especially in Austin and Dallas.',
      },
    ],
  },

  florida: {
    lead: 'Florida\'s IV therapy market is one of the most active in the country, with nearly 280 verified clinics concentrated in Miami, Naples, Tampa, Orlando, and Sarasota. The state\'s warm-weather lifestyle, large retiree population, and strong wellness culture have made it a particularly mature market for mobile IV and concierge wellness services.',
    sections: [
      {
        heading: 'IV Therapy Cost in Florida',
        body: 'Among Florida clinics with disclosed pricing, hydration and basic vitamin drips generally start in the $120–$175 range. More comprehensive wellness blends typically run $200–$300, and premium therapies like NAD+ and high-dose vitamin C frequently exceed $400 per session. Membership pricing can reduce per-session costs significantly.',
      },
      {
        heading: 'Mobile IV Services in Florida',
        body: 'About 27% of Florida\'s IV providers offer mobile service — among the highest mobile coverage rates in the US. Miami, Naples, Tampa, and Orlando have particularly mature mobile IV networks, with same-day in-home and hotel-room appointments widely available. Service radius and travel fees vary by clinic.',
      },
      {
        heading: 'Popular Services in Florida',
        body: 'The five most-offered services in Florida are vitamin drips, immune support, beauty and anti-aging infusions, hydration therapy, and weight-loss-supportive drips. Hangover and recovery-focused IV is also a notable Florida specialty in the Miami and Orlando tourist markets.',
      },
    ],
  },

  'new-york': {
    lead: 'New York\'s IV therapy market is dense and competitive, with over 150 verified clinics concentrated in Manhattan, Rochester, Buffalo, and the surrounding metros. NYC alone accounts for the largest single-city cluster in the directory, with concierge providers, in-office boutique clinics, and on-demand mobile services serving the city\'s wellness-focused clientele.',
    sections: [
      {
        heading: 'IV Therapy Cost in New York',
        body: 'New York is one of the higher-priced IV markets in the US. Basic hydration drips typically start $175–$225, with full vitamin and immune blends commonly $250–$400. Specialty therapies including NAD+, high-dose vitamin C, and beauty-focused infusions frequently exceed $500 per session, particularly at Manhattan concierge providers.',
      },
      {
        heading: 'Mobile IV Services in New York',
        body: 'About 28% of New York IV providers offer mobile or concierge service — among the highest in the country. Manhattan, Brooklyn, and parts of Westchester have particularly strong on-demand IV networks, with hotel-room and apartment-call appointments widely available, often the same day.',
      },
      {
        heading: 'Popular Services in New York',
        body: 'The most-listed services across New York clinics are vitamin drips, immune support, beauty and anti-aging infusions, hydration, and NAD+ therapy. The NAD+ market is particularly strong in NYC, reflecting the city\'s biohacking and longevity-medicine scene.',
      },
    ],
  },

  'north-carolina': {
    lead: 'North Carolina\'s IV therapy network has grown rapidly, with over 100 verified clinics across Charlotte, Greensboro, Asheville, Raleigh, and Winston-Salem. The market spans wellness-focused storefront clinics in the Research Triangle to integrative health practices in the mountains around Asheville.',
    sections: [
      {
        heading: 'IV Therapy Cost in North Carolina',
        body: 'North Carolina pricing trends slightly above the national median. Basic hydration drips typically start $130–$165, with vitamin and immune blends usually in the $200–$300 range. Specialty therapies and NAD+ infusions can range from $400 to over $500 per session depending on dose.',
      },
      {
        heading: 'Mobile IV Services in North Carolina',
        body: 'Around 17% of North Carolina IV providers offer mobile service, with the densest coverage in Charlotte and Raleigh. Asheville also has a notable mobile IV scene catering to wellness travelers and concierge clients.',
      },
      {
        heading: 'Popular Services in North Carolina',
        body: 'Top services across the state are vitamin drips, immune support, hydration therapy, beauty and anti-aging infusions, and weight-loss-supportive drips. North Carolina also has a strong functional-medicine and integrative-health presence, particularly in the Asheville and Triangle regions.',
      },
    ],
  },

  ohio: {
    lead: 'Ohio has one of the larger Midwest IV therapy networks, with over 100 verified clinics across Cincinnati, Columbus, Cleveland, Dayton, and Toledo. The market leans toward established in-clinic providers, with growing presence from medspas and integrative wellness practices across the state\'s major metros.',
    sections: [
      {
        heading: 'IV Therapy Cost in Ohio',
        body: 'Ohio is among the more affordable IV therapy markets in the US. Basic hydration drips often start under $125, with most standard vitamin and immune blends in the $150–$250 range. Specialty therapies are priced more in line with national averages, but baseline pricing trends meaningfully lower than coastal markets.',
      },
      {
        heading: 'Popular Services in Ohio',
        body: 'The five most-offered services across Ohio are vitamin drips, hydration therapy, beauty and anti-aging infusions, immune support, and weight-loss-supportive drips. Several Ohio clinics also specialize in athletic recovery and B12 injections as standalone offerings.',
      },
    ],
  },

  pennsylvania: {
    lead: 'Pennsylvania\'s IV therapy market spans Pittsburgh, Philadelphia, Allentown, Scranton, and the Camp Hill area, with over 100 verified clinics statewide. The market is a mix of urban concierge providers in Pittsburgh and Philly and integrative wellness clinics throughout the state\'s smaller metros.',
    sections: [
      {
        heading: 'IV Therapy Cost in Pennsylvania',
        body: 'Pennsylvania pricing is broadly in line with the national average. Basic hydration drips typically start $130–$160, with most full vitamin and immune blends $200–$300. Premium therapies including NAD+ commonly exceed $400 per session.',
      },
      {
        heading: 'Popular Services in Pennsylvania',
        body: 'The top five services across Pennsylvania clinics are vitamin drips, immune support, beauty and anti-aging infusions, hydration therapy, and B12 shots. B12 injection availability is unusually strong in Pennsylvania compared with other states.',
      },
    ],
  },

  tennessee: {
    lead: 'Tennessee has nearly 100 verified IV therapy clinics, with strong concentrations in Nashville, Knoxville, Chattanooga, and Memphis. Nashville in particular has emerged as a notable wellness market, with a heavy presence of mobile IV providers serving the city\'s tourism, music industry, and bachelorette scenes.',
    sections: [
      {
        heading: 'IV Therapy Cost in Tennessee',
        body: 'Tennessee is one of the more affordable IV therapy markets in the US. Basic hydration drips frequently start $80–$120, with vitamin and immune blends commonly $150–$225. Specialty and concierge services are priced higher, but the entry-level pricing is meaningfully below coastal markets.',
      },
      {
        heading: 'Mobile IV Services in Tennessee',
        body: 'Around 21% of Tennessee IV clinics offer mobile or in-home service. Nashville has a particularly mature mobile IV network, with same-day hangover, hydration, and wellness drips widely available for hotels and short-term rentals.',
      },
      {
        heading: 'Popular Services in Tennessee',
        body: 'Top services across Tennessee are vitamin drips, immune support, beauty and anti-aging infusions, hydration, and athletic recovery. Hangover-focused drips are a particular Nashville specialty given the city\'s tourism and event-driven demand.',
      },
    ],
  },

  illinois: {
    lead: 'Illinois has 90 verified IV therapy clinics, with the largest concentration in Chicago and surrounding suburbs including Naperville and Schaumburg. Chicago anchors the state\'s IV market with a mix of luxury concierge providers, established storefront clinics, and integrative medicine practices.',
    sections: [
      {
        heading: 'IV Therapy Cost in Illinois',
        body: 'Illinois pricing lands near national averages. Hydration drips typically start $130–$165, with vitamin and immune blends commonly $200–$325. Premium therapies including NAD+ frequently exceed $475 per session, especially at downtown Chicago providers.',
      },
      {
        heading: 'Popular Services in Illinois',
        body: 'The most-offered services across Illinois are vitamin drips, immune support, beauty and anti-aging infusions, hydration, and NAD+ therapy. Chicago\'s NAD+ market is particularly active, reflecting the city\'s growing wellness and longevity scene.',
      },
    ],
  },

  georgia: {
    lead: 'Georgia\'s IV therapy market is anchored by Atlanta and its surrounding metros — Augusta, Marietta, Alpharetta — with nearly 90 verified clinics statewide. The Atlanta area in particular has emerged as a strong wellness market with a mix of mobile providers, concierge clinics, and integrative health practices.',
    sections: [
      {
        heading: 'IV Therapy Cost in Georgia',
        body: 'Georgia is among the more affordable IV therapy markets. Basic hydration drips often start under $100, with vitamin and immune blends typically $150–$225. NAD+ and other specialty therapies follow national pricing patterns, generally $400 or more per session.',
      },
      {
        heading: 'Mobile IV Services in Georgia',
        body: 'About 18% of Georgia IV providers offer mobile service. Coverage is densest in Atlanta and the surrounding suburbs, with same-day appointments common in the metro area.',
      },
      {
        heading: 'Popular Services in Georgia',
        body: 'Top services across Georgia clinics are vitamin drips, immune support, beauty and anti-aging infusions, hydration therapy, and NAD+ infusions. Atlanta\'s NAD+ provider network is particularly strong relative to other Southern markets.',
      },
    ],
  },

  'south-carolina': {
    lead: 'South Carolina has 74 verified IV therapy clinics, anchored by Greenville, Charleston, Columbia, and Mount Pleasant. The Charleston market in particular has become a notable wellness destination with a strong concentration of boutique and concierge IV providers serving residents and visitors alike.',
    sections: [
      {
        heading: 'IV Therapy Cost in South Carolina',
        body: 'South Carolina pricing trends moderately above national averages. Basic hydration drips typically start $150–$200, with vitamin and immune blends $200–$300. Boutique and concierge providers in Charleston often price higher, particularly for specialty and beauty-focused therapies.',
      },
      {
        heading: 'Popular Services in South Carolina',
        body: 'The most-listed services across South Carolina clinics are vitamin drips, beauty and anti-aging infusions, immune support, hydration therapy, and athletic recovery. Charleston\'s wellness scene also includes a strong contingent of integrative-health and concierge providers.',
      },
    ],
  },

  washington: {
    lead: 'Washington State\'s IV therapy market is concentrated in the Seattle metro — Spokane, Seattle, Bellevue, Vancouver, and Kirkland account for the majority of providers, with 67 verified clinics statewide. The market includes a strong contingent of integrative medicine and naturopathic providers reflecting the Pacific Northwest\'s wellness culture.',
    sections: [
      {
        heading: 'IV Therapy Cost in Washington',
        body: 'Washington State pricing is broadly in line with West Coast averages on the entry level — basic hydration drips typically start $100–$140 — but premium and concierge therapies in Seattle and Bellevue can run substantially higher, with specialty NAD+ and high-dose protocols sometimes exceeding $700 per session.',
      },
      {
        heading: 'Popular Services in Washington',
        body: 'The five most-offered services across Washington clinics are vitamin drips, immune support, beauty and anti-aging infusions, hydration, and athletic recovery. The state also has a strong naturopathic IV scene, with many providers offering high-dose vitamin C and integrative cancer-support protocols.',
      },
    ],
  },

  colorado: {
    lead: 'Colorado has a mature IV therapy market with 64 verified clinics anchored by Colorado Springs, Denver, Boulder, and Lakewood. The state\'s active outdoor lifestyle and altitude-recovery demand have made it a particularly strong market for athletic-recovery and hydration-focused IV therapy.',
    sections: [
      {
        heading: 'IV Therapy Cost in Colorado',
        body: 'Colorado pricing is moderate by national standards. Basic hydration drips typically start $115–$150, with vitamin and immune blends $175–$275. Athletic recovery and altitude-focused drips often have specific protocol pricing, generally in the $200–$350 range.',
      },
      {
        heading: 'Mobile IV Services in Colorado',
        body: 'About 23% of Colorado IV providers offer mobile service. Denver, Boulder, and Colorado Springs have the densest mobile coverage. Mobile altitude-recovery and hangover drips are a particular Denver specialty.',
      },
      {
        heading: 'Popular Services in Colorado',
        body: 'The top services across Colorado clinics are vitamin drips, immune support, beauty and anti-aging infusions, hydration therapy, and athletic recovery. Colorado has one of the highest per-capita rates of athletic-recovery IV providers in the directory.',
      },
    ],
  },

  virginia: {
    lead: 'Virginia\'s IV therapy market spans 63 verified clinics across Virginia Beach, Richmond, Vienna, Alexandria, and Chesapeake. The Northern Virginia and Tidewater markets are the largest, with a mix of medspas, integrative health practices, and concierge IV providers.',
    sections: [
      {
        heading: 'IV Therapy Cost in Virginia',
        body: 'Virginia pricing varies notably by region — Northern Virginia clinics tend to price higher, in line with the DC metro, while Tidewater and Richmond clinics are typically more moderate. Basic hydration drips generally start $130–$170, with vitamin and immune blends $175–$250.',
      },
      {
        heading: 'Popular Services in Virginia',
        body: 'The most-listed services across Virginia clinics are vitamin drips, immune support, beauty and anti-aging infusions, hydration, and athletic recovery. Northern Virginia clinics often emphasize concierge and executive wellness offerings.',
      },
    ],
  },

  arizona: {
    lead: 'Arizona has 62 verified IV therapy clinics, anchored by Tucson, Phoenix, Scottsdale, Gilbert, and Mesa. Scottsdale in particular has emerged as one of the country\'s most concentrated wellness and concierge IV markets, with a heavy presence of luxury providers and same-day mobile services.',
    sections: [
      {
        heading: 'IV Therapy Cost in Arizona',
        body: 'Arizona has a wide pricing range. Entry-level drips typically start $130–$170, but Scottsdale\'s concierge scene drives the high end — premium NAD+, ketamine-adjacent, and longevity-focused protocols can run well over $700 per session, sometimes substantially more.',
      },
      {
        heading: 'Mobile IV Services in Arizona',
        body: 'About 27% of Arizona IV providers offer mobile service — one of the highest rates in the country. Scottsdale and the broader Phoenix metro have particularly mature mobile IV networks, with same-day in-home, hotel, and resort-call appointments widely available.',
      },
      {
        heading: 'Popular Services in Arizona',
        body: 'Top services across Arizona clinics are vitamin drips, immune support, hydration, beauty and anti-aging infusions, and athletic recovery. Hangover and altitude-recovery drips are also notable specialties given the state\'s tourism markets.',
      },
    ],
  },

  utah: {
    lead: 'Utah has 61 verified IV therapy clinics across Salt Lake City, Provo, South Jordan, Orem, and American Fork. The Wasatch Front anchors the state\'s IV market, with a particularly strong wellness and biohacking scene reflecting the region\'s outdoor and longevity-focused culture.',
    sections: [
      {
        heading: 'IV Therapy Cost in Utah',
        body: 'Utah is the most affordable IV therapy market among the top 25 states. Entry-level hydration drips often start under $75, with vitamin and immune blends commonly $125–$200. Even specialty therapies tend to be priced meaningfully below coastal markets.',
      },
      {
        heading: 'Mobile IV Services in Utah',
        body: 'About 20% of Utah IV providers offer mobile service. Coverage is densest in Salt Lake City and the Utah Valley, with same-day appointments common in the urban core.',
      },
      {
        heading: 'Popular Services in Utah',
        body: 'Top services across Utah clinics are vitamin drips, immune support, hydration, beauty and anti-aging infusions, and NAD+ therapy. Utah\'s NAD+ market is particularly active for its size, reflecting the state\'s strong longevity and biohacking community.',
      },
    ],
  },

  massachusetts: {
    lead: 'Massachusetts has 59 verified IV therapy clinics, with the largest concentrations in Boston, Worcester, and Newton. The Boston market includes a notable share of clinics affiliated with academic medicine and integrative health practices, alongside a growing medspa and concierge IV scene.',
    sections: [
      {
        heading: 'IV Therapy Cost in Massachusetts',
        body: 'Massachusetts pricing is bimodal — entry-level drips often start under $100, but the state has some of the highest premium pricing in the directory, with concierge and academic-affiliated providers sometimes pricing specialty protocols at $1,000 or more per session.',
      },
      {
        heading: 'Popular Services in Massachusetts',
        body: 'Top services across Massachusetts clinics are vitamin drips, beauty and anti-aging infusions, weight-loss-supportive drips, hydration, and immune support. Weight-loss-supportive IV protocols are particularly common in the Boston metro.',
      },
    ],
  },

  louisiana: {
    lead: 'Louisiana has 56 verified IV therapy clinics, anchored by New Orleans, Baton Rouge, Metairie, Mandeville, and Hammond. New Orleans in particular has a mature IV market driven by the city\'s tourism and event economy, with a strong contingent of mobile providers serving hotels and short-term rentals.',
    sections: [
      {
        heading: 'IV Therapy Cost in Louisiana',
        body: 'Louisiana pricing trends moderate to lower than national averages. Basic hydration drips typically start $100–$140, with vitamin and immune blends $150–$225. Specialty therapies are priced in line with national norms.',
      },
      {
        heading: 'Popular Services in Louisiana',
        body: 'Top services across Louisiana clinics are vitamin drips, hydration therapy, beauty and anti-aging infusions, immune support, and weight-loss-supportive drips. Hangover and recovery-focused IV is a particular New Orleans specialty given the city\'s event-driven demand.',
      },
    ],
  },

  nevada: {
    lead: 'Nevada has 55 verified IV therapy clinics, with Las Vegas accounting for the majority. The Las Vegas IV market is one of the most distinctive in the country — high tourism volume, hotel-based demand, and a heavy concentration of mobile providers serving the Strip and Henderson markets around the clock.',
    sections: [
      {
        heading: 'IV Therapy Cost in Nevada',
        body: 'Nevada pricing has a wide range. Standard hydration and vitamin drips typically run $130–$225, but Las Vegas concierge and resort-oriented providers can price specialty packages substantially higher, with premium NAD+ and longevity protocols sometimes exceeding $900 per session.',
      },
      {
        heading: 'Mobile IV Services in Nevada',
        body: 'About 35% of Nevada IV providers offer mobile service — the highest rate in the directory. Las Vegas has a particularly mature 24/7 mobile IV network, with same-day hotel-room hangover, hydration, and wellness drips widely available across the Strip and Henderson.',
      },
      {
        heading: 'Popular Services in Nevada',
        body: 'Top services across Nevada clinics are vitamin drips, immune support, hydration, beauty and anti-aging infusions, and athletic recovery. Hangover and recovery drips are an outsized share of the Las Vegas market relative to other states.',
      },
    ],
  },

  connecticut: {
    lead: 'Connecticut has 54 verified IV therapy clinics, with concentrations in West Hartford, Greenwich, Fairfield, Stamford, and Milford. The Fairfield County market in particular benefits from spillover demand from the New York metro, with a strong concentration of boutique and concierge IV providers.',
    sections: [
      {
        heading: 'IV Therapy Cost in Connecticut',
        body: 'Connecticut pricing trends slightly above national averages, particularly in Fairfield County. Basic hydration drips typically start $140–$175, with vitamin and immune blends $175–$275. Greenwich-area concierge providers often price higher for boutique and beauty-focused offerings.',
      },
      {
        heading: 'Popular Services in Connecticut',
        body: 'Top services across Connecticut clinics are beauty and anti-aging infusions, vitamin drips, immune support, hydration, and athletic recovery. Beauty-focused IV is unusually prominent in Connecticut compared with other Northeast markets.',
      },
    ],
  },

  michigan: {
    lead: 'Michigan has 53 verified IV therapy clinics, with concentrations in Grand Rapids, Troy, Dearborn, Ann Arbor, and Monroe. The Detroit and Grand Rapids metros anchor the state\'s IV market, with a mix of medspas, integrative health practices, and a growing mobile IV scene.',
    sections: [
      {
        heading: 'IV Therapy Cost in Michigan',
        body: 'Michigan pricing is broadly in line with national averages. Basic hydration drips typically start $115–$150, with vitamin and immune blends $175–$275. Specialty therapies follow national pricing patterns.',
      },
      {
        heading: 'Mobile IV Services in Michigan',
        body: 'About 19% of Michigan IV providers offer mobile service. Coverage is strongest in the Detroit metro and Grand Rapids, with same-day appointments available in those markets.',
      },
      {
        heading: 'Popular Services in Michigan',
        body: 'Top services across Michigan clinics are vitamin drips, beauty and anti-aging infusions, immune support, B12 shots, and hydration therapy. B12 injection availability is unusually strong in Michigan compared with other Midwest states.',
      },
    ],
  },

  maryland: {
    lead: 'Maryland has 51 verified IV therapy clinics, anchored by Baltimore, Columbia, Rockville, Annapolis, and Crofton. The state\'s IV market is heavily shaped by the DC metro, with a strong concierge presence in Montgomery County and a mature mainstream wellness scene around Baltimore.',
    sections: [
      {
        heading: 'IV Therapy Cost in Maryland',
        body: 'Maryland pricing varies by region but is generally moderate. Basic hydration drips often start $85–$125, with vitamin and immune blends $150–$250. Premium and concierge providers in Montgomery County price meaningfully higher, in line with the DC metro.',
      },
      {
        heading: 'Mobile IV Services in Maryland',
        body: 'About 22% of Maryland IV providers offer mobile service. Coverage is strongest in the Baltimore metro and the DC suburbs, with same-day appointments common in those markets.',
      },
      {
        heading: 'Popular Services in Maryland',
        body: 'Top services across Maryland clinics are vitamin drips, beauty and anti-aging infusions, immune support, hydration therapy, and weight-loss-supportive drips. Maryland has a strong weight-loss IV market relative to other Mid-Atlantic states.',
      },
    ],
  },

  wisconsin: {
    lead: 'Wisconsin has 48 verified IV therapy clinics across Milwaukee, Madison, Brookfield, Middleton, and Monona. The Milwaukee and Madison metros anchor the state\'s IV market, with a mix of medspas, integrative wellness practices, and weight-loss-focused clinics.',
    sections: [
      {
        heading: 'IV Therapy Cost in Wisconsin',
        body: 'Wisconsin pricing trends moderate by national standards. Basic hydration drips typically start $95–$130, with vitamin and immune blends $150–$250. Specialty therapies follow national pricing patterns.',
      },
      {
        heading: 'Popular Services in Wisconsin',
        body: 'Top services across Wisconsin clinics are vitamin drips, beauty and anti-aging infusions, immune support, weight-loss-supportive drips, and hydration therapy. Weight-loss IV protocols are notably common across Wisconsin clinics.',
      },
    ],
  },

  arkansas: {
    lead: 'Arkansas has 47 verified IV therapy clinics anchored by Little Rock, Fayetteville, Rogers, Bentonville, and Bryant. The Northwest Arkansas corridor — Fayetteville, Rogers, Bentonville — accounts for a significant share of the state\'s IV market, with growing demand from the region\'s wellness scene.',
    sections: [
      {
        heading: 'IV Therapy Cost in Arkansas',
        body: 'Arkansas pricing is moderate by national standards. Basic hydration drips typically start $100–$140, with vitamin and immune blends $150–$220. Specialty therapies are priced in line with regional norms.',
      },
      {
        heading: 'Popular Services in Arkansas',
        body: 'Top services across Arkansas clinics are vitamin drips, beauty and anti-aging infusions, immune support, hydration therapy, and weight-loss-supportive drips. The state has a growing weight-loss IV market reflecting regional demand.',
      },
    ],
  },

  oklahoma: {
    lead: 'Oklahoma has 43 verified IV therapy clinics, concentrated in Oklahoma City, Tulsa, Norman, Edmond, and Broken Arrow. The Oklahoma City and Tulsa metros account for the majority of the state\'s IV providers, with a mix of established storefront clinics and growing mobile IV services.',
    sections: [
      {
        heading: 'IV Therapy Cost in Oklahoma',
        body: 'Oklahoma pricing trends slightly above the regional median for entry-level services. Basic hydration drips typically start $160–$200, with vitamin and immune blends $175–$275. Specialty therapies follow national pricing norms.',
      },
      {
        heading: 'Mobile IV Services in Oklahoma',
        body: 'About 19% of Oklahoma IV providers offer mobile service. Coverage is densest in Oklahoma City and Tulsa, with same-day in-home appointments available in those metros.',
      },
      {
        heading: 'Popular Services in Oklahoma',
        body: 'Top services across Oklahoma clinics are hydration therapy, vitamin drips, immune support, beauty and anti-aging infusions, and weight-loss-supportive drips. Hydration is unusually prominent as the leading service in Oklahoma, reflecting the state\'s climate and outdoor culture.',
      },
    ],
  },
}

/**
 * Returns the intro for a given state slug, or null if not in the map.
 * The state page uses this to decide whether to render the structured intro
 * or fall through to the generic templated description.
 */
export function getStateIntro(slug: string): StateIntro | null {
  return STATE_INTROS[slug] ?? null
}
