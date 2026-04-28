import type { Guide } from './iv-therapy-cost'

export const typesOfIvDripsGuide: Guide = {
  slug: 'types-of-iv-drips',
  title: 'Types of IV Drips: A Complete Guide to IV Therapy Options',
  description:
    'A practical 2026 guide to every major type of IV drip — hydration, vitamin blends, NAD+, glutathione, B12 shots, hangover relief, athletic recovery, and immune support — including what each contains, who it\'s for, and how to compare providers.',
  publishedAt: '2026-04-27',
  updatedAt: '2026-04-27',
  readingMinutes: 10,
  lead: "\"IV therapy\" is a broad label that covers dozens of distinct formulations with very different purposes, ingredients, and price points. A basic saline drip for dehydration and a NAD+ infusion for cognitive support are both IV therapy — but they have almost nothing else in common. This guide breaks down the major types of IV drips you'll encounter at wellness clinics, explains what each actually contains, and helps you figure out which option makes sense for your situation.",
  sections: [
    {
      id: 'what-are-iv-drips',
      heading: 'What Are IV Drips?',
      blocks: [
        {
          type: 'p',
          text: [
            'An IV drip delivers fluids, vitamins, minerals, or other compounds directly into the bloodstream through a catheter placed in a vein — typically in the arm or hand. Because the digestive system is bypassed, absorption is near-complete and onset is fast compared to oral supplements, which must survive the digestive process before reaching the bloodstream.',
          ],
        },
        {
          type: 'p',
          text: [
            'In a wellness context, IV drips are administered by registered nurses, nurse practitioners, or paramedics under physician oversight. The session typically takes 30–90 minutes depending on the volume and infusion rate, though high-dose therapies like NAD+ can run 2–4 hours.',
          ],
        },
        {
          type: 'callout',
          title: 'Important',
          text: 'IV therapy at wellness clinics is not a substitute for medical care. If you have a specific health condition, talk to your doctor before booking an IV session. A clinic\'s medical director can also advise on whether a given drip is appropriate for your circumstances.',
        },
      ],
    },

    {
      id: 'hydration-drips',
      heading: 'Hydration IVs',
      blocks: [
        {
          type: 'p',
          text: [
            { href: '/services/hydration', text: 'Hydration drips' },
            ' are the entry-level offering at most IV clinics and typically the most affordable, ranging from $100 to $150. The base is usually 1 liter of normal saline (0.9% sodium chloride) or lactated Ringer\'s solution, sometimes with added electrolytes like magnesium, potassium, or calcium.',
          ],
        },
        {
          type: 'p',
          text: [
            'Hydration IVs are most useful for acute dehydration — after intense exercise, illness, or travel — when you need rapid fluid replacement and can\'t keep pace with oral intake. They\'re also the most common "base" that clinics add other ingredients to for more specialized drips.',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Typical contents: normal saline or Ringer\'s lactate, electrolytes'],
            ['Session time: 30–45 minutes'],
            ['Typical price: $100–$150'],
            ['Best for: dehydration, post-workout recovery, travel fatigue, mild illness'],
          ],
        },
      ],
    },

    {
      id: 'vitamin-drips',
      heading: 'Vitamin Drips and Myers\' Cocktail',
      blocks: [
        {
          type: 'p',
          text: [
            { href: '/services/vitamin-drips', text: 'Vitamin drips' },
            ' are the most common offering across the directory and cover a wide range of formulations. The classic benchmark is the Myers\' Cocktail — a formulation developed by physician John Myers in the 1970s and adapted by wellness clinics worldwide. A modern Myers\' typically includes magnesium, calcium, B vitamins (B1, B2, B3, B5, B6), vitamin B12, and vitamin C, all in a saline or sterile water base.',
          ],
        },
        {
          type: 'p',
          text: [
            'Beyond the Myers\', clinics offer branded variations under names like "Wellness Drip," "Immunity Boost," or "Energy Infusion" — often with higher doses of specific nutrients or additional add-ins. When comparing clinics, ask for the actual ingredient list rather than relying on the name; two clinics\' "immunity drips" can be quite different.',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Typical contents: B vitamins, vitamin C, magnesium, calcium, zinc (varies)'],
            ['Session time: 45–60 minutes'],
            ['Typical price: $150–$275'],
            ['Best for: general wellness, energy, immune support, stress recovery'],
          ],
        },
      ],
    },

    {
      id: 'nad-plus',
      heading: 'NAD+ IV Therapy',
      blocks: [
        {
          type: 'p',
          text: [
            { href: '/services/nad-plus', text: 'NAD+ (nicotinamide adenine dinucleotide)' },
            ' is a coenzyme involved in cellular energy production and DNA repair. It declines naturally with age. IV NAD+ has attracted significant interest for cognitive support, addiction recovery, metabolic health, and anti-aging — though the evidence base is still developing.',
          ],
        },
        {
          type: 'p',
          text: [
            'NAD+ infusions are among the priciest offerings in the directory. Low-dose sessions (100–250mg) can run $200–$400, while therapeutic protocols (500–1000mg) cost $500–$900 per session and take 2–4 hours due to infusion rate requirements. Most providers recommend a loading series of 3–10 sessions followed by monthly maintenance.',
          ],
        },
        {
          type: 'p',
          text: [
            'Common side effects during infusion include nausea, chest pressure, and muscle cramping — typically managed by slowing the infusion rate. Reputable NAD+ providers have clinical oversight in place for this reason. If a clinic offers NAD+ in a 30-minute session, ask questions.',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Typical contents: NAD+ in saline, sometimes with B vitamins or amino acids'],
            ['Session time: 2–4 hours'],
            ['Typical price: $400–$900+ per session'],
            ['Best for: cognitive support, energy, cellular health, addiction recovery (as adjunct)'],
          ],
        },
      ],
    },

    {
      id: 'glutathione',
      heading: 'Glutathione IV and Push',
      blocks: [
        {
          type: 'p',
          text: [
            { href: '/services/glutathione', text: 'Glutathione' },
            ' is the body\'s primary antioxidant and plays a central role in liver detoxification, immune function, and cellular protection. Because oral glutathione has limited bioavailability, IV delivery is the preferred route when therapeutic levels are the goal.',
          ],
        },
        {
          type: 'p',
          text: [
            'At wellness clinics, glutathione is most commonly offered as an IV push — a direct syringe injection into the IV line that takes 5–10 minutes — rather than as a full drip. It\'s often sold as an add-on to a hydration or vitamin drip rather than a standalone session.',
          ],
        },
        {
          type: 'p',
          text: [
            'Standalone glutathione sessions and high-dose skin brightening protocols do exist and typically run $150–$350. Add-on pushes are usually $40–$75.',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Typical contents: reduced glutathione (600mg–2000mg) in saline'],
            ['Session time: 5–10 minutes as push, 30–60 minutes as full drip'],
            ['Typical price: $40–$75 as add-on, $150–$350 standalone'],
            ['Best for: liver support, antioxidant therapy, skin health, immune function'],
          ],
        },
      ],
    },

    {
      id: 'b12-shots',
      heading: 'B12 Shots and Injections',
      blocks: [
        {
          type: 'p',
          text: [
            { href: '/services/b12-shots', text: 'B12 injections' },
            ' are technically not IV drips — they\'re intramuscular injections, typically into the deltoid or gluteal muscle. But they\'re offered alongside IV services at most wellness clinics and often included as add-ons to IV sessions.',
          ],
        },
        {
          type: 'p',
          text: [
            'Vitamin B12 (cobalamin) supports neurological function, red blood cell formation, and energy metabolism. Deficiency is surprisingly common, especially in older adults, people following plant-based diets, and those on metformin or proton pump inhibitors. For documented deficiency, B12 injections can produce a meaningful difference in energy and cognitive clarity.',
          ],
        },
        {
          type: 'p',
          text: [
            'Most clinics use methylcobalamin (the active form) or cyanocobalamin (the synthetic form). Methylcobalamin is considered more bioavailable; ask which form a clinic uses if this matters to you.',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Typical contents: methylcobalamin or cyanocobalamin (1000–5000mcg)'],
            ['Session time: 5 minutes'],
            ['Typical price: $25–$50 standalone, often included in drip packages'],
            ['Best for: B12 deficiency, energy, neurological support'],
          ],
        },
      ],
    },

    {
      id: 'hangover-relief',
      heading: 'Hangover Relief IVs',
      blocks: [
        {
          type: 'p',
          text: [
            { href: '/services/hangover-relief', text: 'Hangover drips' },
            ' are specifically formulated for post-alcohol recovery and are among the most in-demand offerings, especially at mobile IV providers in major cities. A typical hangover drip combines a liter of hydration fluid, B vitamins to replenish what alcohol depletes, electrolytes, magnesium, and often an anti-nausea medication like ondansetron (Zofran) or promethazine.',
          ],
        },
        {
          type: 'p',
          text: [
            'The combination works because a hangover involves multiple simultaneous issues: dehydration, electrolyte imbalance, B vitamin depletion, and nausea. IV delivery addresses all of them faster than oral rehydration can. Most people report significant symptom relief within 30–60 minutes of completing a session.',
          ],
        },
        {
          type: 'p',
          text: [
            'The anti-nausea medications included in hangover drips are prescription compounds, which is one reason this category requires actual physician oversight. Verify that a clinic has a licensed provider in the prescribing chain before booking hangover IVs, especially for ',
            { href: '/clinics?mobile=1', text: 'mobile hangover IV services' },
            '.',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Typical contents: saline, B vitamins, electrolytes, magnesium, anti-nausea medication'],
            ['Session time: 45–60 minutes'],
            ['Typical price: $150–$275'],
            ['Best for: acute hangover, post-alcohol dehydration and nausea'],
          ],
        },
      ],
    },

    {
      id: 'athletic-recovery',
      heading: 'Athletic Recovery Drips',
      blocks: [
        {
          type: 'p',
          text: [
            { href: '/services/athletic-recovery', text: 'Athletic recovery IVs' },
            ' target muscle repair, inflammation reduction, and rapid rehydration after intense exercise or competition. A typical athletic recovery drip goes beyond basic hydration to include amino acids (often a branch-chain amino acid blend), high-dose B vitamins, magnesium, and sometimes glutathione or taurine.',
          ],
        },
        {
          type: 'p',
          text: [
            'These drips are popular with endurance athletes (marathon runners, triathletes, cyclists) and CrossFit communities. Some sports medicine clinics and physical therapy practices have integrated IV therapy for post-event recovery protocols.',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Typical contents: saline, amino acids, B vitamins, magnesium, electrolytes, sometimes glutathione'],
            ['Session time: 60–90 minutes'],
            ['Typical price: $200–$350'],
            ['Best for: post-race recovery, muscle repair, reducing DOMS'],
          ],
        },
      ],
    },

    {
      id: 'immune-support',
      heading: 'Immune Support Drips',
      blocks: [
        {
          type: 'p',
          text: [
            { href: '/services/immune-support', text: 'Immune support drips' },
            ' are built around high-dose vitamin C, zinc, and B vitamins — nutrients with established roles in immune function. Most clinics offer a version of this around cold and flu season, and demand spikes significantly during illness surges.',
          ],
        },
        {
          type: 'p',
          text: [
            'Vitamin C is the anchor ingredient. At oral doses, absorption is limited; IV delivery allows much higher plasma concentrations. High-dose IV vitamin C (10g–25g+) has been studied for specific clinical applications, though most wellness clinic immune drips use lower doses (2g–7.5g) for general immune support rather than therapeutic protocols.',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Typical contents: high-dose vitamin C, zinc, B vitamins, magnesium'],
            ['Session time: 45–60 minutes'],
            ['Typical price: $175–$300'],
            ['Best for: immune support, cold and flu recovery, general wellness'],
          ],
        },
      ],
    },

    {
      id: 'how-to-choose',
      heading: 'How to Choose the Right IV Drip and Compare Clinics Safely',
      blocks: [
        {
          type: 'p',
          text: [
            'With dozens of formulations available, narrowing to the right drip starts with knowing what you\'re actually trying to address. General fatigue and wellness is very different from post-race recovery, which is different from NAD+ for cognitive support. Being specific with a clinic\'s medical staff about your goals leads to better recommendations than picking from a menu by name.',
          ],
        },
        {
          type: 'p',
          text: [
            'A few things to verify before booking any IV session:',
          ],
        },
        {
          type: 'ul',
          items: [
            ['Medical oversight: Is there a licensed physician, NP, or PA in the prescribing chain? Ask specifically.'],
            ['Credential of the person placing the IV: Should be a registered nurse, NP, PA, or paramedic in most states.'],
            ['Ingredient sourcing: Sterile compounded drips from a licensed 503B pharmacy are preferable to ingredients sourced from unclear suppliers.'],
            ['Adverse event protocol: What happens if you have a reaction during the infusion?'],
          ],
        },
        {
          type: 'p',
          text: [
            'To find and compare clinics offering specific drip types, use the ',
            { href: '/services', text: 'services directory' },
            '. For clinics near you, ',
            { href: '/clinics?services=1', text: 'filter the directory to clinics with published service menus' },
            ' — these tend to be more established operations with more transparent practices. If you prefer at-home service, ',
            { href: '/mobile-iv', text: 'browse mobile IV providers' },
            ' separately.',
          ],
        },
      ],
    },
  ],
}
