import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { MOCK_EDITIONS, NewspaperEdition, Article, SmartRead } from "../../../data/mockData";
import { buildEmailHtml } from "../../../utils/emailTemplate";

export const dynamic = "force-dynamic";

function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  let prev;
  let decoded = str;
  do {
    prev = decoded;
    decoded = decoded
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&ndash;/g, "–")
      .replace(/&mdash;/g, "—")
      .replace(/&nbsp;/g, " ");
  } while (decoded !== prev);
  return decoded;
}

function cleanTextContent(htmlStr: string): string {
  if (!htmlStr) return "";
  
  let decoded = decodeHtmlEntities(htmlStr);
  
  decoded = decoded.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "");
  decoded = decoded.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "");
  
  decoded = decoded.replace(/<\/p>/gi, "\n");
  decoded = decoded.replace(/<br\s*\/?>/gi, "\n");
  decoded = decoded.replace(/<\/h[1-6]>/gi, "\n");
  decoded = decoded.replace(/<\/div>/gi, "\n");
  decoded = decoded.replace(/<li>/gi, "\n• ");
  
  let stripped = decoded.replace(/<[^>]*>?/gm, "");
  
  stripped = decodeHtmlEntities(stripped);
  
  stripped = stripped
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
    
  return stripped;
}

function sanitizeUrl(url: string): string {
  if (!url) return "";
  const decoded = decodeHtmlEntities(url).trim();
  if (/^(https?:)/i.test(decoded)) {
    return decoded;
  }
  return "#";
}

// Zero-dependency XML parsing function for RSS feeds
function parseRss(xmlText: string, defaultSourceName: string): Array<{ title: string; link: string; description: string; pubDate: string; source: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string; source: string }> = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?>[\s\S]*?<\/item>/g) || [];
  
  for (const itemXml of itemMatches) {
    const extractTag = (tag: string) => {
      const regex = new RegExp(`<${tag}[^>]*?>([\\s\\S]*?)<\/${tag}>`, 'i');
      const match = itemXml.match(regex);
      if (!match) return "";
      let val = match[1].trim();
      // Remove CDATA wrapper if present
      if (val.startsWith("<![CDATA[")) {
        val = val.substring(9, val.length - 3);
      }
      return val;
    };
    
    const title = cleanTextContent(extractTag("title"));
    const link = sanitizeUrl(extractTag("link"));
    const description = cleanTextContent(extractTag("description"));
    const pubDate = cleanTextContent(extractTag("pubDate"));
    
    let source = defaultSourceName;
    if (link && link !== "#") {
      try {
        const urlObj = new URL(link);
        const host = urlObj.hostname.replace("www.", "");
        if (host.includes("reuters.com")) source = "Reuters";
        else if (host.includes("economictimes")) source = "The Economic Times";
        else if (host.includes("moneycontrol")) source = "Moneycontrol";
        else if (host.includes("livemint")) source = "LiveMint";
        else if (host.includes("cnbc")) source = "CNBC";
        else if (host.includes("techcrunch")) source = "TechCrunch";
        else if (host.includes("mckinsey")) source = "McKinsey Insights";
        else if (host.includes("bain")) source = "Bain Insights";
        else if (host.includes("bcg")) source = "BCG Insights";
        else if (host.includes("hbr.org")) source = "Harvard Business Review";
      } catch (e) {}
    }
    
    if (title && link && link !== "#") {
      items.push({ title, link, description, pubDate, source });
    }
  }
  return items;
}

function getSentenceSimilarity(s1: string, s2: string): number {
  const words1 = new Set(s1.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean));
  const words2 = new Set(s2.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  words1.forEach(word => {
    if (words2.has(word)) intersection++;
  });
  
  const union = words1.size + words2.size - intersection;
  return intersection / union;
}

function removeSourceNames(sentence: string): string {
  return sentence
    .replace(/\s*[-–|—(]?\s*(reuters|bloomberg|cnbc|moneycontrol|livemint|techcrunch|mckinsey|bain|bcg|hbr|economic times|et)\s*[)]?\s*$/i, "")
    .trim();
}

function generateTranslation(title: string, description: string, category: string): string {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  let whoBenefits = "well-capitalized market leaders";
  let whoLoses = "inefficient legacy players";
  let sectorsImpacted = "broad enterprise sectors";
  let segmentMatters = "macro and public markets";

  if (category === "ai" || titleLower.includes("ai") || titleLower.includes("nvidia") || descLower.includes("gpu")) {
    whoBenefits = "hyperscalers, chip design firms (like NVIDIA), and specialized infrastructure operators";
    whoLoses = "legacy SaaS platforms and firms slower to automate operational overheads";
    sectorsImpacted = "technology hardware, enterprise software, and digital infrastructure";
    segmentMatters = "venture capital, public markets, and strategy consulting teams advising on tech audits";
  } else if (category === "fintech" || titleLower.includes("payment") || titleLower.includes("bank") || descLower.includes("upi")) {
    whoBenefits = "payment aggregators, merchant services, and agile banking partners";
    whoLoses = "traditional credit card networks and legacy merchant acquirers relying on high take-rates";
    sectorsImpacted = "fintech checkout services, cross-border remittance, and retail banking";
    segmentMatters = "banking-tech, venture capital, and digital commerce startups";
  } else if (category === "consulting" || titleLower.includes("mckinsey") || titleLower.includes("bcg") || descLower.includes("bain")) {
    whoBenefits = "specialized strategic consultancies and business transformation execution firms";
    whoLoses = "mid-tier firms with vanilla advisory offerings that fail to demonstrate high implementation ROI";
    sectorsImpacted = "corporate strategy, enterprise management consulting, and MBA advisory pipelines";
    segmentMatters = "private equity (operational value creation), corporate strategy, and talent sourcing";
  } else if (titleLower.includes("oil") || titleLower.includes("brent") || titleLower.includes("energy")) {
    whoBenefits = "oil producers, green energy ESG infrastructure assets, and alternative energy corridors";
    whoLoses = "aviation, paint manufacturers, logistics networks, and oil-import dependent countries";
    sectorsImpacted = "crude oil logistics, maritime shipping routes, and retail energy prices";
    segmentMatters = "macroeconomics, commodities trading, and public equities";
  } else if (titleLower.includes("fed") || titleLower.includes("inflation") || titleLower.includes("rate") || descLower.includes("yield")) {
    whoBenefits = "yield-chasing bondholders and cash-rich corporate balance sheets";
    whoLoses = "highly leveraged venture-backed startups and interest-sensitive real estate funds";
    sectorsImpacted = "fixed income markets, corporate debt origination, and banking credit channels";
    segmentMatters = "macro risk modeling, venture capital hurdles, and private equity cost of debt";
  }

  return `Translation: this could move money. ${whoBenefits.charAt(0).toUpperCase() + whoBenefits.slice(1)} stand to benefit, while ${whoLoses} face headwinds. The key impacted sectors are ${sectorsImpacted}. This carries structural significance for ${segmentMatters}.`;
}

function generateWhyThisMatters(title: string, description: string, category: string): string {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  if (category === "ai" || titleLower.includes("ai") || titleLower.includes("nvidia")) {
    return "AI hardware deployment commands high capex, raising hurdle rates for standard SaaS valuation multiples. If you are modeling corporate finance in tech, tracking GPU shipping volumes and chip yields is a non-negotiable metric.";
  }
  if (category === "fintech" || titleLower.includes("payment") || descLower.includes("bank")) {
    return "Cross-border payment automation reduces settlement friction and interchange leakages. For fintech builders, payment orchestration is a major margins driver—knowing how to optimize take-rates is crucial.";
  }
  if (category === "consulting" || titleLower.includes("mckinsey") || titleLower.includes("bcg") || descLower.includes("bain")) {
    return "Management consultants are shifting from isolated proof-of-concepts to concrete business transformations. Knowing how to map operational optimization directly to balance-sheet metrics is a major career differentiator.";
  }
  if (titleLower.includes("oil") || titleLower.includes("brent") || titleLower.includes("energy")) {
    return "Geopolitical energy corridors dictate manufacturing margins and shipping insurance costs. High oil prices pressure refining margins and weaken local currencies in import-dependent countries.";
  }
  if (titleLower.includes("fed") || titleLower.includes("rate") || titleLower.includes("inflation")) {
    return "Discount rate calculations govern overall buyout modeling and venture debt interest expenses. A hawkish central bank pivot raises PE hurdle rates and changes the valuation floor for high-growth assets.";
  }

  return "Market structures are consolidating as operational cost pressures rise. Valuations must adapt to changing interest rate dynamics and supply-chain efficiency milestones.";
}

function generateWhatToWatch(title: string, description: string, category: string): string {
  const titleLower = title.toLowerCase();
  
  if (category === "ai" || titleLower.includes("ai")) {
    return "Monitor Blackwell shipping volumes, hyperscaler cloud capex budgets, and GPU rental pricing charts.";
  }
  if (category === "fintech" || titleLower.includes("payment")) {
    return "Watch transaction success rates and changes in cross-border checkout interchange laws next quarter.";
  }
  if (category === "consulting") {
    return "Watch how enterprise software procurement processes tighten and monitor MBA consulting recruitment hiring numbers.";
  }
  return "Watch central bank rate guidance, Dollar Index (DXY) stability, and index support levels at the Monday market open.";
}

// Smart context-aware content generator for mock fields
function generateArticleFields(title: string, description: string, category: string) {
  const cleanDesc = description.trim();
  const normalizedTitle = title.trim();

  const sentences = cleanDesc
    .match(/[^.!?]+[.!?]+/g)
    ?.map(s => s.trim())
    .map(s => removeSourceNames(s))
    .filter(s => s.length > 15 && !/read more|full coverage|click here|photo|copyright/i.test(s)) || [];

  const takeaways: string[] = [];

  for (const s of sentences) {
    if (takeaways.length >= 3) break;

    // Check similarity with headline/title
    if (getSentenceSimilarity(s, normalizedTitle) >= 0.8) continue;

    // Check similarity with already added takeaways
    let isDuplicate = false;
    for (const added of takeaways) {
      if (getSentenceSimilarity(s, added) >= 0.8) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    takeaways.push(s);
  }

  // Fallbacks if we don't have exactly 3 unique takeaways
  const fallbacks: Record<string, string[]> = {
    ai: [
      "The integration of advanced model capabilities is driving enterprise workflow automation at scale.",
      "Hyperscalers continue to command the bulk of GPU infrastructure spend, elevating valuation floors.",
      "Deployment focus is rapidly shifting from sandbox proof-of-concepts to production-grade ROI."
    ],
    fintech: [
      "Cross-border payment corridors are becoming increasingly native and frictionless.",
      "Fintech platforms are leveraging real-time settlement APIs to disintermediate traditional card networks.",
      "Regulatory compliance costs are rising, favoring well-capitalized market leaders."
    ],
    consulting: [
      "New frameworks urge enterprise buyers to stop isolated pilots and consolidate spend.",
      "Firms are pivoting towards high-margin segments in response to margin compression.",
      "Operational value creation is taking precedence over raw financial leverage in buyouts."
    ],
    watchlist: [
      "Blackwell and optics bottlenecks have resolved, accelerating shipping volumes.",
      "Private capital allocation is aggressively chasing digital asset infrastructure.",
      "Supply chain consolidation aims to eliminate overheads and overlapping margins."
    ]
  };

  const categoryFallbacks = fallbacks[category] || fallbacks.watchlist;
  let fallbackIdx = 0;
  while (takeaways.length < 3) {
    const fb = categoryFallbacks[fallbackIdx % categoryFallbacks.length];
    let isDuplicate = false;
    for (const added of takeaways) {
      if (getSentenceSimilarity(fb, added) >= 0.8) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      takeaways.push(fb);
    }
    fallbackIdx++;
  }

  const hook = "Not gonna lie, this matters.";
  const translation = generateTranslation(title, description, category);
  const whyThisMatters = generateWhyThisMatters(title, description, category);
  const whatToWatch = generateWhatToWatch(title, description, category);

  return {
    hook,
    takeaways,
    translation,
    whyThisMatters,
    whatToWatch
  };
}

function generateSmartReadFields(title: string, description: string) {
  const cleanDesc = description.trim();
  const normalizedTitle = title.trim();
  const sentences = cleanDesc
    .match(/[^.!?]+[.!?]+/g)
    ?.map(s => s.trim())
    .map(s => removeSourceNames(s))
    .filter(s => s.length > 15 && !/read more|full coverage|click here|photo|copyright/i.test(s)) || [];

  const takeaways: string[] = [];

  for (const s of sentences) {
    if (takeaways.length >= 3) break;

    // Check similarity with headline/title
    if (getSentenceSimilarity(s, normalizedTitle) >= 0.8) continue;

    let isDuplicate = false;
    for (const added of takeaways) {
      if (getSentenceSimilarity(s, added) >= 0.8) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    takeaways.push(s);
  }

  const smartFallbacks = [
    "Traditional explainability tools are proving mathematically unstable for high-dimensional models.",
    "Proposed algorithmic initializations claims up to 10x compute reduction in early evaluations.",
    "SSMs like Mamba are replacing Transformers for long-context tasks but face training bottlenecks."
  ];

  let fallbackIdx = 0;
  while (takeaways.length < 3) {
    const fb = smartFallbacks[fallbackIdx % smartFallbacks.length];
    let isDuplicate = false;
    for (const added of takeaways) {
      if (getSentenceSimilarity(fb, added) >= 0.8) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      takeaways.push(fb);
    }
    fallbackIdx++;
  }

  let hook = "Not gonna lie, this matters.";
  if (title.toLowerCase().includes("model") || title.toLowerCase().includes("llm") || title.toLowerCase().includes("ai")) {
    hook = "This is the kind of update that quietly changes the game.";
  }

  let brainUpgrade = "What happens if this scales without increasing marginal cost? Can synthetic data bypass raw internet data constraints?";
  if (title.toLowerCase().includes("model") || title.toLowerCase().includes("llm")) {
    brainUpgrade = "Can local model explanation algorithms be trusted for high-frequency trading decision compliance?";
  }

  return {
    hook,
    takeaways,
    brainUpgrade
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const recipientEmail = body.email || "govindatapdia123@gmail.com";

    // 1. Determine current edition parameters
    const now = new Date();
    const hour = now.getHours();
    const isMorning = hour >= 4 && hour < 16;
    const editionName = isMorning ? "Morning Edition" : "Evening Edition";

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = now.toLocaleDateString("en-US", dateOptions);

    const refDate = new Date("2026-06-20");
    const msDiff = now.getTime() - refDate.getTime();
    const daysDiff = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
    const number = 128 + daysDiff * 2 + (isMorning ? 0 : 1);

    // Get Base Edition to update tickers
    const baseEdition = isMorning
      ? MOCK_EDITIONS[0]
      : MOCK_EDITIONS.find((e) => e.editionName === "Evening Edition") || MOCK_EDITIONS[0];

    // Dynamic price updates for tickers (-1.5% to +1.5%)
    const tickerData = baseEdition.tickerData.map((ticker) => {
      const cleanValue = ticker.value.replace(/[^0-9.-]/g, "");
      const valueNum = parseFloat(cleanValue);
      if (isNaN(valueNum)) return ticker;

      const pct = (Math.random() * 3 - 1.5) / 100;
      const newValue = valueNum * (1 + pct);
      const diff = newValue - valueNum;
      const isUp = diff >= 0;
      const sign = isUp ? "+" : "";
      const change = `${sign}${(pct * 100).toFixed(2)}%`;

      let valueStr = newValue.toFixed(2);
      if (ticker.value.startsWith("$")) {
        valueStr = `$${newValue.toFixed(2)}`;
      } else if (ticker.value.startsWith("₹")) {
        valueStr = `₹${Math.round(newValue).toLocaleString("en-IN")}`;
      } else {
        valueStr = Math.round(newValue).toLocaleString("en-US");
      }

      return {
        ...ticker,
        value: valueStr,
        change,
        isUp,
      };
    });

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      return NextResponse.json(
        {
          error: "Gmail credentials not configured on server.",
        },
        { status: 500 }
      );
    }

    // 2. Fetch and Parse 10 RSS Feeds
    const rawArticles: Array<{ title: string; link: string; description: string; pubDate: string; source: string }> = [];

    const feeds = [
      { name: "Reuters Business", url: "https://news.google.com/rss/search?q=site:reuters.com/business+OR+site:reuters.com/markets&hl=en-US&gl=US&ceid=US:en" },
      { name: "The Economic Times", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
      { name: "Moneycontrol", url: "https://www.moneycontrol.com/rss/latestnews.xml" },
      { name: "LiveMint", url: "https://www.livemint.com/rss/markets" },
      { name: "CNBC Business", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147" },
      { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
      { name: "McKinsey Insights", url: "https://news.google.com/rss/search?q=site:mckinsey.com/featured-insights+OR+site:mckinsey.com/capabilities&hl=en-US&gl=US&ceid=US:en" },
      { name: "Bain Insights", url: "https://news.google.com/rss/search?q=site:bain.com/insights&hl=en-US&gl=US&ceid=US:en" },
      { name: "BCG Insights", url: "https://news.google.com/rss/search?q=site:bcg.com/featured-insights&hl=en-US&gl=US&ceid=US:en" },
      { name: "Harvard Business Review", url: "https://news.google.com/rss/search?q=site:hbr.org&hl=en-US&gl=US&ceid=US:en" }
    ];

    // Fetch from all RSS feeds concurrently with timeout protection
    await Promise.all(
      feeds.map(async (feed) => {
        try {
          const res = await fetch(feed.url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(6000)
          });
          if (res.ok) {
            const xml = await res.text();
            const parsed = parseRss(xml, feed.name);
            rawArticles.push(...parsed);
          }
        } catch (err) {
          console.error(`Skipping feed ${feed.name} due to fetch error:`, err);
        }
      })
    );

    // Filter, Deduplicate and Rank Articles
    const filterKeywords = [
      "finance", "fintech", "pay", "bank", "venture", "equity", "funding", "investment", "capital",
      "crypto", "blockchain", "startup", "nvidia", "openai", "ai", "llm", "gpt", "model", "consulting",
      "mckinsey", "bcg", "bain", "mba", "strategy", "macro", "fed", "inflation", "rate", "yield",
      "dxy", "market", "stocks", "sec", "treasury", "acquisition", "merger", "pe", "vc", "banking-tech"
    ];

    const uniqueArticles: typeof rawArticles = [];
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();

    for (const art of rawArticles) {
      const titleLower = art.title.toLowerCase();
      const descLower = art.description.toLowerCase();

      // 1. Filter: Check for keywords
      const matchesKeyword = filterKeywords.some(
        (kw) => titleLower.includes(kw) || descLower.includes(kw)
      );
      if (!matchesKeyword) continue;

      // 2. Remove duplicates
      const normTitle = titleLower.replace(/[^a-z0-9]/g, "").substring(0, 30);
      if (seenTitles.has(normTitle) || seenUrls.has(art.link)) continue;

      seenTitles.add(normTitle);
      seenUrls.add(art.link);
      uniqueArticles.push(art);
    }

    // 3. Rank by relevance
    const scoredArticles = uniqueArticles.map((art) => {
      let score = 0;
      const titleLower = art.title.toLowerCase();
      const descLower = art.description.toLowerCase();

      // Count keyword occurrences
      filterKeywords.forEach((kw) => {
        if (titleLower.includes(kw)) score += 10;
        if (descLower.includes(kw)) score += 3;
      });

      // Priority scoring: Market-moving > Macro > AI > Fintech > Consulting > MBA
      const combinedText = (art.title + " " + art.description).toLowerCase();
      const isMarketMoving = /market-moving|earnings|acquisition|merger|buyout|deal|funding|ipo|shares|venture capital|equity/i.test(combinedText);
      const isMacro = /fed|inflation|interest|rate|yield|dxy|macro|central bank|imf/i.test(combinedText);
      const isAi = /ai|openai|nvidia|llm|gpu|model|intelligence|deep learning/i.test(combinedText);
      const isFintech = /fintech|pay|upi|stripe|banking-tech|crypto|blockchain|settlement/i.test(combinedText);
      const isConsulting = /consulting|mckinsey|bcg|bain|advisory/i.test(combinedText);
      const isMba = /mba|hbr|harvard business|strategy/i.test(combinedText);

      if (isMarketMoving) score += 60;
      else if (isMacro) score += 50;
      else if (isAi) score += 40;
      else if (isFintech) score += 30;
      else if (isConsulting) score += 20;
      else if (isMba) score += 10;

      // Boost specific high-quality sources
      const sourceLower = art.source.toLowerCase();
      if (
        sourceLower.includes("reuters") ||
        sourceLower.includes("bloomberg") ||
        sourceLower.includes("financial times") ||
        sourceLower.includes("mckinsey") ||
        sourceLower.includes("bcg") ||
        sourceLower.includes("bain") ||
        sourceLower.includes("harvard business")
      ) {
        score += 25;
      } else if (
        sourceLower.includes("economic times") ||
        sourceLower.includes("moneycontrol") ||
        sourceLower.includes("livemint") ||
        sourceLower.includes("cnbc") ||
        sourceLower.includes("techcrunch")
      ) {
        score += 15;
      }

      // Recency boost (last 24 hours)
      if (art.pubDate) {
        try {
          const pubTime = new Date(art.pubDate).getTime();
          if (Date.now() - pubTime < 24 * 60 * 60 * 1000) {
            score += 15;
          }
        } catch (_) {}
      }

      return { art, score };
    });

    // Sort descending by score
    scoredArticles.sort((a, b) => b.score - a.score);
    const sorted = scoredArticles.map((s) => s.art);

    // Fall back to dynamic demo edition if not enough articles were aggregated
    if (sorted.length < 5) {
      console.warn(`Only found ${sorted.length} RSS articles. Falling back to demo edition.`);
      const demoEdition: NewspaperEdition = {
        ...baseEdition,
        id: `demo-${now.getTime()}`,
        editionName,
        date: formattedDate,
        number,
        tickerData,
      };

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const emailSubject = `🗞️ ${demoEdition.editionName} - ${demoEdition.date} | Quick Finance (Demo Edition)`;
      const emailHtml = buildEmailHtml(demoEdition);

      await transporter.sendMail({
        from: `"Quick Finance" <${gmailUser}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to aggregate live RSS feeds. Showing demo edition.",
          edition: demoEdition,
        },
        { status: 200 }
      );
    }

    // 4. Generate Structured Newspaper Edition
    // Featured Story (top article)
    const topStory = sorted[0];
    const featFields = generateArticleFields(topStory.title, topStory.description, "watchlist");
    const featuredStory: Article = {
      id: "live-feat",
      headline: topStory.title,
      sourceName: topStory.source,
      sourceTitle: topStory.title,
      sourceUrl: topStory.link,
      ...featFields
    };

    // AI & Fintech Radar (next 2 articles containing AI or Fintech keywords)
    const aiFintechList: Article[] = [];
    let idx = 1;
    while (aiFintechList.length < 2 && idx < sorted.length) {
      const art = sorted[idx];
      const isAiFin = /ai|fintech|payment|tech|openai|nvidia|gpu|model|llm|banking-tech/i.test(art.title + " " + art.description);
      if (isAiFin) {
        const fields = generateArticleFields(art.title, art.description, "ai");
        aiFintechList.push({
          id: `live-ai-${idx}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
      idx++;
    }

    // Fill AI fallback
    idx = 1;
    while (aiFintechList.length < 2 && idx < sorted.length) {
      const art = sorted[idx];
      if (!aiFintechList.some((a) => a.sourceUrl === art.link) && art.link !== topStory.link) {
        const fields = generateArticleFields(art.title, art.description, "ai");
        aiFintechList.push({
          id: `live-ai-fallback-${idx}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
      idx++;
    }

    // Strategy & MBA Desk (next 2 articles containing consulting or strategy keywords)
    const consultingList: Article[] = [];
    idx = 1;
    while (consultingList.length < 2 && idx < sorted.length) {
      const art = sorted[idx];
      const isCons = /consulting|mckinsey|bcg|bain|mba|strategy|merger|acquisition|corp/i.test(art.title + " " + art.description);
      if (isCons && art.link !== topStory.link && !aiFintechList.some((a) => a.sourceUrl === art.link)) {
        const fields = generateArticleFields(art.title, art.description, "consulting");
        consultingList.push({
          id: `live-con-${idx}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
      idx++;
    }

    // Fill consulting fallback
    idx = 1;
    while (consultingList.length < 2 && idx < sorted.length) {
      const art = sorted[idx];
      if (
        art.link !== topStory.link &&
        !aiFintechList.some((a) => a.sourceUrl === art.link) &&
        !consultingList.some((c) => c.sourceUrl === art.link)
      ) {
        const fields = generateArticleFields(art.title, art.description, "consulting");
        consultingList.push({
          id: `live-con-fallback-${idx}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
      idx++;
    }

    // Company Watchlist (next 2 articles matching tracked companies)
    const watchlistList: Article[] = [];
    idx = 1;
    while (watchlistList.length < 2 && idx < sorted.length) {
      const art = sorted[idx];
      const isWatch = /nvidia|tesla|microsoft|blackstone|jpmorgan|morgan|chase|bank|mckinsey|bcg|bain/i.test(art.title + " " + art.description);
      if (
        isWatch &&
        art.link !== topStory.link &&
        !aiFintechList.some((a) => a.sourceUrl === art.link) &&
        !consultingList.some((c) => c.sourceUrl === art.link)
      ) {
        const fields = generateArticleFields(art.title, art.description, "watchlist");
        watchlistList.push({
          id: `live-watch-${idx}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
      idx++;
    }

    // Fill watchlist fallback
    idx = 1;
    while (watchlistList.length < 2 && idx < sorted.length) {
      const art = sorted[idx];
      if (
        art.link !== topStory.link &&
        !aiFintechList.some((a) => a.sourceUrl === art.link) &&
        !consultingList.some((c) => c.sourceUrl === art.link) &&
        !watchlistList.some((w) => w.sourceUrl === art.link)
      ) {
        const fields = generateArticleFields(art.title, art.description, "watchlist");
        watchlistList.push({
          id: `live-watch-fallback-${idx}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
      idx++;
    }

    // Smart Reads (next 2 academic/research papers)
    const smartReads: SmartRead[] = [];
    idx = 1;
    while (smartReads.length < 2 && idx < sorted.length) {
      const art = sorted[idx];
      if (
        art.link !== topStory.link &&
        !aiFintechList.some((a) => a.sourceUrl === art.link) &&
        !consultingList.some((c) => c.sourceUrl === art.link) &&
        !watchlistList.some((w) => w.sourceUrl === art.link)
      ) {
        const fields = generateSmartReadFields(art.title, art.description);
        smartReads.push({
          id: `live-smart-${idx}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
      idx++;
    }

    // Fill smart reads fallback
    if (smartReads.length < 2) {
      const needed = 2 - smartReads.length;
      for (let i = 0; i < needed; i++) {
        smartReads.push(baseEdition.smartReads[i]);
      }
    }

    // Market Commentary Headline
    const macroArticle = sorted.find((art) => /fed|inflation|interest|rate|yield|dxy|macro|imf|world bank/i.test(art.title + " " + art.description)) || topStory;

    // Construct live RSS-based Newspaper Edition
    const liveEdition: NewspaperEdition = {
      id: `live-${now.getTime()}`,
      editionName,
      date: formattedDate,
      number,
      price: "₹15.00",
      marketSummary: {
        headline: macroArticle.title,
        driver: macroArticle.description.substring(0, 150) + "...",
        sentiment: isMorning ? "Tense risk-off consolidation" : "Cautious macro sentiment pricing",
        translation: "Translation: this could move money. Yield fluctuations are restructuring leverage models.",
        whatToWatchNext: "Watch the opening indexes and central bank press alerts next week."
      },
      tickerData,
      featuredStory,
      aiFintechRadar: aiFintechList,
      consultingMbaDesk: consultingList,
      companyWatchlist: watchlistList,
      smartReads,
      whatToWatchNext: baseEdition.whatToWatchNext
    };

    // Send the compiled newsletter immediately
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const emailSubject = `🗞️ ${liveEdition.editionName} - ${liveEdition.date} | Quick Finance`;
    const emailHtml = buildEmailHtml(liveEdition);

    await transporter.sendMail({
      from: `"Quick Finance" <${gmailUser}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Latest Quick Finance edition generated and emailed successfully.",
      edition: liveEdition,
    });
  } catch (error: any) {
    console.error("RSS manual refresh error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Internal server error occurred during RSS news refresh.",
      },
      { status: 500 }
    );
  }
}
