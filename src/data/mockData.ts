export interface Article {
  id: string;
  headline: string;
  hook: string;
  takeaways: string[];
  translation: string;
  whyThisMatters: string;
  whatToWatch: string;
  sourceName: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface SmartRead {
  id: string;
  headline: string;
  hook: string;
  takeaways: string[];
  brainUpgrade: string;
  sourceName: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface MarketIndex {
  symbol: string;
  value: string;
  change: string;
  isUp: boolean;
  type: "index" | "stock" | "macro";
}

export interface MarketSummary {
  headline: string;
  driver: string;
  sentiment: string;
  translation: string;
  whatToWatchNext: string;
}

export interface WatchItem {
  event: string;
  actionable: string;
}

export interface NewspaperEdition {
  id: string;
  editionName: "Morning Edition" | "Evening Edition";
  date: string;
  number: number;
  price: string;
  marketSummary: MarketSummary;
  tickerData: MarketIndex[];
  featuredStory: Article;
  aiFintechRadar: Article[];
  consultingMbaDesk: Article[];
  companyWatchlist: Article[];
  smartReads: SmartRead[];
  whatToWatchNext: WatchItem[];
}

export const MOCK_EDITIONS: NewspaperEdition[] = [
  {
    id: "2026-06-20-morning",
    editionName: "Morning Edition",
    date: "Saturday, June 20, 2026",
    number: 128,
    price: "₹15.00",
    marketSummary: {
      headline: "Markets Waver as Warsh Pivot Sinks Rate-Cut Hopes",
      driver: "The Federal Reserve's sudden elimination of rate-cut guidance under new Chair Kevin Warsh.",
      sentiment: "Tense risk-off. Investors were not vibing with the prospect of another rate hike before year-end.",
      translation: "Translation: this could move money. Tech and high-growth assets are feeling the pressure as capital costs stay elevated.",
      whatToWatchNext: "Watch the Dollar Index (DXY) strength and Bank Nifty support levels at the Monday market open."
    },
    tickerData: [
      { symbol: "NIFTY 50", value: "24,013", change: "-1.21%", isUp: false, type: "index" },
      { symbol: "BANK NIFTY", value: "57,964", change: "+0.08%", isUp: true, type: "index" },
      { symbol: "SENSEX", value: "76,652", change: "-0.97%", isUp: false, type: "index" },
      { symbol: "NVIDIA (NVDA)", value: "$127.40", change: "+8.00%", isUp: true, type: "stock" },
      { symbol: "TESLA (TSLA)", value: "$174.50", change: "-4.20%", isUp: false, type: "stock" },
      { symbol: "MICROSOFT (MSFT)", value: "$415.20", change: "-1.10%", isUp: false, type: "stock" },
      { symbol: "BRENT CRUDE", value: "$80.38", change: "+2.40%", isUp: true, type: "macro" },
      { symbol: "GOLD (24K)", value: "₹14,585", change: "+0.50%", isUp: true, type: "macro" }
    ],
    featuredStory: {
      id: "feat-1",
      headline: "Warsh's Fed Drops the Dovish Mask, Wall Street Scrambles",
      hook: "Damn, that's a big move.",
      takeaways: [
        "Fed held rates at 3.50-3.75% but stripped out all promises of near-term rate cuts.",
        "Nine of eighteen FOMC members now project a rate hike before year-end, pointing to October.",
        "CME FedWatch odds of an October rate hike surged to 60.7% post-meeting."
      ],
      translation: "Translation: this could move money. The era of loose cash is officially on hold.",
      whyThisMatters: "If you're modeling corporate valuations or structuring venture debt, higher rates change the discount math. Your PE hurdle rates just went up, bhai.",
      whatToWatch: "Watch the upcoming bond yields and treasury auctions to see where long-term capital is pricing itself.",
      sourceName: "Bloomberg",
      sourceTitle: "Fed Hawkish Pivot Shakes Global Markets Under Warsh",
      sourceUrl: "https://www.bloomberg.com"
    },
    aiFintechRadar: [
      {
        id: "ai-1",
        headline: "Vetic Bags $40M for Tech-Driven Pet Care Expansion",
        hook: "This company really said, let's cook.",
        takeaways: [
          "Pet clinic startup Vetic raised $40 million in a round led by Bessemer Venture Partners.",
          "Funds will expand digital-first veterinary clinics across Tier 1 and Tier 2 cities in India.",
          "India's pet care market TAM is growing at a 20% CAGR, driven by nuclear family demographics."
        ],
        translation: "Translation: this could move money. Specialized offline-to-online retail models are still highly fundable.",
        whyThisMatters: "Consumer tech startups are pivoting to physical infrastructure. Bessemer's backing proves that vertical healthcare platforms in emerging markets can command premium multiples.",
        whatToWatch: "Watch Vetic's unit economics as they enter smaller cities, where pet spending power is less tested.",
        sourceName: "TechCrunch",
        sourceTitle: "Vetic Raises $40 Million to Build India's Digital Pet Clinic Network",
        sourceUrl: "https://techcrunch.com"
      },
      {
        id: "ai-2",
        headline: "Stripe Integrates Local UPI for Global Cross-Border Flows",
        hook: "Okay, this is actually important.",
        takeaways: [
          "Stripe partnered with NPCI to let global merchants accept real-time UPI payments from India.",
          "Eliminates complex card settlement fees, reducing checkout friction for Indian buyers.",
          "Allows small merchants globally to tap into India's consumer base without setting up local entities."
        ],
        translation: "Translation: this could move money. The barrier to global software sales is dissolving.",
        whyThisMatters: "For fintech builders, cross-border payments are becoming native. If you're designing SaaS checkout pages, local payment options are no longer optional.",
        whatToWatch: "Watch Stripe's take-rate and transaction success rates compared to local payment aggregators.",
        sourceName: "Economic Times",
        sourceTitle: "Stripe Enables UPI Support for International Merchants",
        sourceUrl: "https://economictimes.indiatimes.com"
      }
    ],
    consultingMbaDesk: [
      {
        id: "con-1",
        headline: "McKinsey Reframes AI Spend: ROI Focus Over PoC",
        hook: "Consulting-core move right here.",
        takeaways: [
          "New McKinsey framework urges enterprises to stop funding isolated AI Proof-of-Concepts (PoCs).",
          "Recommends consolidating budget into 2-3 scale projects integrated directly with core business lines.",
          "Estimates 70% of enterprise AI spend is wasted on sandbox tools that never reach production."
        ],
        translation: "Translation: this could move money. The AI hype phase is shifting to strict balance sheet accountability.",
        whyThisMatters: "MBA folks, pay attention. The next wave of strategy consulting is cleaning up AI waste. Knowing how to measure generative AI ROI is a major resume differentiator.",
        whatToWatch: "Watch how enterprise software procurement processes tighten in the next two quarters.",
        sourceName: "McKinsey Insights",
        sourceTitle: "From Pilot to Value: How to Break Through Enterprise AI Inertia",
        sourceUrl: "https://www.mckinsey.com"
      },
      {
        id: "con-2",
        headline: "Somany Ceramics Bathware Merger Wins Shareholder Nod",
        hook: "Corporate drama? Yes. Relevant? Also yes.",
        takeaways: [
          "Somany Ceramics approved the merger of its bathware and vitrified subsidiaries into the parent entity.",
          "Consolidation aims to eliminate overlapping supply chains and trim overhead costs by 12%.",
          "The clean-up is a defensive play against rising competition and raw material gas prices."
        ],
        translation: "Translation: this could move money. Corporate consolidation is the default playbook when margin pressure strikes.",
        whyThisMatters: "This is a classic corporate strategy case study. Streamlining multiple operating brands under a single balance sheet reduces tax friction and boosts overall capital efficiency.",
        whatToWatch: "Watch the post-merger EBITDA margins in Q3 to verify if the 12% cost-cutting target is achieved.",
        sourceName: "Business Standard",
        sourceTitle: "Somany Ceramics Shareholders Approve Corporate Consolidation Merger",
        sourceUrl: "https://www.business-standard.com"
      }
    ],
    companyWatchlist: [
      {
        id: "comp-1",
        headline: "NVIDIA Dominance Intact as Blackwell Production Accelerates",
        hook: "Not gonna lie, this matters.",
        takeaways: [
          "Co-packaged optics and Blackwell chip yield bottlenecks have been resolved by TSMC.",
          "Hyperscalers (Microsoft, AWS, Google) committed to capital expenditures exceeding $150B combined.",
          "Premarket trading pushed NVIDIA shares up 8% as demand continues to outstrip supply."
        ],
        translation: "Translation: this could move money. AI hardware demand is showing zero signs of plateauing.",
        whyThisMatters: "If you are coding deep learning models or managing local cluster compute, GPU costs will stay high. Finance brothers are probably watching these hardware valuations closely, yaar.",
        whatToWatch: "Watch Blackwell shipping volumes in the second half of the year.",
        sourceName: "Reuters",
        sourceTitle: "TSMC Solves NVIDIA Blackwell Manufacturing Bottlenecks",
        sourceUrl: "https://www.reuters.com"
      },
      {
        id: "comp-2",
        headline: "Blackstone Raises $22B for Landmark Asia Private Equity Fund",
        hook: "The boring headline hides a very spicy detail.",
        takeaways: [
          "Blackstone closed its third Asian flagship private equity fund, targeting corporate carve-outs.",
          "Priority sectors: advanced manufacturing in India, logistics in Japan, and data centers in Australia.",
          "Over 30% of the capital is pre-allocated to Indian digital infrastructure assets."
        ],
        translation: "Translation: this could move money. Private capital is heavily backing APAC infrastructure over Western equities.",
        whyThisMatters: "Venture debt and buyout valuations in India are set to rise with this cash influx. If you're building in the finance-tech space, corporate advisory pipelines look promising.",
        whatToWatch: "Watch Blackstone's first major acquisition announcement from this fund to trace asset pricing trends.",
        sourceName: "Financial Times",
        sourceTitle: "Blackstone Closes $22 Billion Asia Buyout Fund with India Push",
        sourceUrl: "https://www.ft.com"
      }
    ],
    smartReads: [
      {
        id: "smart-1",
        headline: "Why LIME and SHAP Are Failing the Model Risk Test",
        hook: "This is the kind of update that quietly changes the game.",
        takeaways: [
          "Traditional explainability tools (LIME, SHAP) are proving mathematically unstable for high-dimensional LLMs.",
          "Minor input perturbations cause drastically different feature importances, failing compliance audits.",
          "Regulators are shifting expectations toward intrinsic interpretability rather than post-hoc approximations."
        ],
        brainUpgrade: "What happens if this business model scales without increasing marginal cost? Can post-hoc explanation models be trusted at all for trading systems?",
        sourceName: "ArXiv / MIT Review",
        sourceTitle: "The Fragility of Local Feature Attribution in Deep Networks",
        sourceUrl: "https://arxiv.org"
      },
      {
        id: "smart-2",
        headline: "The Gradient Flow Problem in Long-Sequence State Space Models",
        hook: "Not gonna lie, this matters.",
        takeaways: [
          "SSMs like Mamba are replacing Transformers for long-context tasks but face training bottlenecks.",
          "Discretization parameters can trigger gradient explosions during backpropagation through time.",
          "Proposed initialization strategies resolve flow issues, allowing stable 1M+ token context lengths."
        ],
        brainUpgrade: "How would LSTM handle this time-series pattern? Could we use SSM gradient flow solutions to stabilize LSTM recurrent training?",
        sourceName: "DeepMind Research",
        sourceTitle: "Stabilizing Gradient Dynamics in Continuous-Time State Space Models",
        sourceUrl: "https://arxiv.org"
      }
    ],
    whatToWatchNext: [
      {
        event: "US Core Inflation (CPI) Release",
        actionable: "Track the July 12 index update. If CPI is higher than 3.2%, Warsh's Fed is highly likely to hike rates in October."
      },
      {
        event: "NVIDIA Q2 Earnings Report",
        actionable: "Check Blackwell gross margins and hyperscale compute demand guidance on August 24."
      },
      {
        event: "RBI Monetary Policy Meeting",
        actionable: "Monitor Governor's commentary on current account deficit changes driven by the Strait of Hormuz oil prices."
      }
    ]
  },
  {
    id: "2026-06-19-evening",
    editionName: "Evening Edition",
    date: "Friday, June 19, 2026",
    number: 127,
    price: "₹15.00",
    marketSummary: {
      headline: "Oil Spike Eases but Geopolitical Anxiety Remains High",
      driver: "Partial de-escalation of maritime security alerts in the Persian Gulf.",
      sentiment: "Cautious consolidation. Markets stabilized but capital remains defensive.",
      translation: "Translation: this could move money. Oil-sensitive industries like aviation and chemicals are seeing short-term cover.",
      whatToWatchNext: "Monitor shipping insurance premiums and container shipping rates over the weekend."
    },
    tickerData: [
      { symbol: "NIFTY 50", value: "24,310", change: "+0.45%", isUp: true, type: "index" },
      { symbol: "BANK NIFTY", value: "57,910", change: "-0.12%", isUp: false, type: "index" },
      { symbol: "SENSEX", value: "77,410", change: "+0.38%", isUp: true, type: "index" },
      { symbol: "BRENT CRUDE", value: "$80.38", change: "-2.10%", isUp: false, type: "macro" }
    ],
    featuredStory: {
      id: "feat-2",
      headline: "Strait of Hormuz Standoff: Oil Back Under $81 as Tensions De-escalate",
      hook: "No fluff, just signal.",
      takeaways: [
        "Brent crude fell back to $80.38 per barrel after brief mid-week surges toward $90.",
        "Diplomatic channels opened via back-channels, tempering immediate fears of complete maritime closure.",
        "Indian oil refiners secured alternative supply lanes, though shipping insurance remains elevated."
      ],
      translation: "Translation: this could move money. Energy stock volatility will remain high but panic buying has subsided.",
      whyThisMatters: "India imports ~85% of its crude. Refiner margins are highly exposed to this corridor. If oil drops, the Rupee (₹94.37/USD) gets room to breathe, yaar.",
      whatToWatch: "Watch next Monday's shipping route data to verify if freight flows are resuming standard schedules.",
      sourceName: "Reuters",
      sourceTitle: "Oil Prices Ease as Strait of Hormuz Supply Pressures Subside",
      sourceUrl: "https://www.reuters.com"
    },
    aiFintechRadar: [
      {
        id: "ai-3",
        headline: "GPS Renewables Raises ₹635 Crore for Compressed Biogas",
        hook: "Okay, this is actually important.",
        takeaways: [
          "GPS Renewables secured ₹635 crore from multiple climate funds to expand CBG projects in India.",
          "Biogas production will target municipal waste processing and crop residues.",
          "Aligns with the government's mandate to blend biogas into domestic natural gas supplies."
        ],
        translation: "Translation: this could move money. Green energy transition funding is picking up massive momentum.",
        whyThisMatters: "Biogas infrastructure is a high-yield ESG asset. If you are analyzing green energy equities or infrastructure debt, this space is expanding rapidly.",
        whatToWatch: "Watch GPS Renewables' timeline for commission of their upcoming 10 projects.",
        sourceName: "LiveMint",
        sourceTitle: "GPS Renewables Secures Debt and Equity Funding for CBG Expansion",
        sourceUrl: "https://www.livemint.com"
      }
    ],
    consultingMbaDesk: [
      {
        id: "con-3",
        headline: "Bain Study Shows Private Equity Pivoting to Operational Value",
        hook: "MBA folks, pay attention.",
        takeaways: [
          "Bain's 2026 PE Report reveals multiple buyout firms are generating 70% of returns from operational improvements.",
          "Arbitrage and simple financial leverage multiples are yielding less than 10% on average.",
          "Firms are embedding dedicated tech teams directly within portfolio companies to drive automation."
        ],
        translation: "Translation: this could move money. Buyout firms are now software implementation firms in disguise.",
        whyThisMatters: "If you're interviewing for PE roles, shift your story from pure leverage math to operational automation frameworks. The classic LBO model is no longer enough.",
        whatToWatch: "Watch changes in PE hiring patterns, showing preference for candidates with technical engineering backgrounds.",
        sourceName: "Bain Insights",
        sourceTitle: "Global Private Equity Report: Operational Value Creation Takes Center Stage",
        sourceUrl: "https://www.bain.com"
      }
    ],
    companyWatchlist: [
      {
        id: "comp-3",
        headline: "Tesla Shares Drop 4.2% After Q2 Delivery Decline",
        hook: "This stock did not pass the vibe test.",
        takeaways: [
          "Tesla delivered 410,000 vehicles in Q2, down 5% year-over-year.",
          "Increased competition in China and factory retooling delays in Berlin crimped margins.",
          "Average selling price dropped to $41,500, indicating intense discounting pressure."
        ],
        translation: "Translation: this could move money. Premium margins are compressing into standard automotive levels.",
        whyThisMatters: "If you're tracking automotive hardware or battery tech supply chains, Tesla's slowing growth signals a broader plateau in EV adoption velocity.",
        whatToWatch: "Watch the upcoming Autonomy Day announcements in August to see if the valuation shifts to robotaxi software.",
        sourceName: "CNBC",
        sourceTitle: "Tesla Deliveries Fall Short of Estimates as Global EV Competition Intensifies",
        sourceUrl: "https://www.cnbc.com"
      }
    ],
    smartReads: [
      {
        id: "smart-3",
        headline: "Scaling Laws vs Algorithmic Efficiency in Large Models",
        hook: "Not gonna lie, this matters.",
        takeaways: [
          "Brute-force data scaling is hitting physical power and data-scarcity limits.",
          "Recent architectures achieve 10x compute reduction via sparse attention and routing.",
          "The focus of frontier labs is shifting to post-training optimizations and synthetic generation."
        ],
        brainUpgrade: "What happens if this business model scales without increasing marginal cost? Can synthetic data bypass raw internet data constraints?",
        sourceName: "HBR Technology",
        sourceTitle: "The Economic Shifts in Generative AI Frontiers",
        sourceUrl: "https://hbr.org"
      }
    ],
    whatToWatchNext: [
      {
        event: "Tesla Q2 Financial Call",
        actionable: "Listen for margin details and updates on their next-generation $25k vehicle platform."
      }
    ]
  }
];
