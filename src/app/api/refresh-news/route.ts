import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { MOCK_EDITIONS, NewspaperEdition, Article, SmartRead, WatchItem } from "../../../data/mockData";
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
        else if (host.includes("bloomberg.com")) source = "Bloomberg";
        else if (host.includes("wsj.com")) source = "Wall Street Journal";
        else if (host.includes("ft.com")) source = "Financial Times";
      } catch (e) { }
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

  

  if (/\b(fed|rates?|inflation|yields?|bonds?|banks?|banking|central bank)\b/i.test(titleLower + " " + descLower)) {
    return "Translation: this could move money. Changes in interest rates and bond yields affect borrowing costs, bank profitability, stock valuations, and overall market liquidity.";
  }

  if (/venture|startup|funding|valuation|vc/i.test(titleLower + " " + descLower)) {
    return "Translation: this could move money. Venture funding conditions influence startup valuations, fundraising activity, and exit opportunities across the innovation ecosystem.";
  }

  if (/cyber|security|hack|breach|ransomware/i.test(titleLower + " " + descLower)) {
    return "Translation: this could move money. Increased cybersecurity spending benefits security vendors while raising compliance and protection costs for enterprises.";
  }

  if (/private equity|buyout|lbo|leverage/i.test(titleLower + " " + descLower)) {
    return "Translation: this could move money. Buyout activity and leverage conditions directly impact private equity returns, financing costs, and acquisition opportunities.";
  }

  if (/ai|openai|nvidia|llm|gpu|model/i.test(titleLower + " " + descLower)) {
    return "Translation: this could move money. AI adoption drives demand for compute infrastructure, cloud services, semiconductors, and enterprise software.";
  }

  if (/payment|fintech|upi|transaction/i.test(titleLower + " " + descLower)) {
    return "Translation: this could move money. Payment innovation affects transaction costs, merchant economics, and the competitive landscape of digital finance.";
  }

  return "Translation: this development may influence market sentiment, competitive positioning, and future capital allocation decisions.";
}

function generateWhyThisMatters(title: string, description: string, category: string): string {
  const text = (title + " " + description).toLowerCase();

  

  if (/\b(fed|rates?|inflation|yields?|bonds?|banks?|banking|central bank)\b/i.test(text)) {
    return "This matters because interest-rate expectations shape equity valuations, bond pricing, loan demand, and the cost of capital for companies and investors.";
  }

  if (/venture|startup|funding|valuation|vc/i.test(text)) {
    return "This matters because VC funding trends signal investor risk appetite, startup runway strength, and the pricing environment for future exits.";
  }

  if (/cyber|security|hack|breach|ransomware/i.test(text)) {
    return "This matters because cybersecurity demand is becoming a board-level spending priority as companies face higher regulatory, operational, and reputational risk.";
  }

  if (/private equity|buyout|lbo|leverage/i.test(text)) {
    return "This matters because private equity returns depend heavily on financing costs, operational improvements, exit multiples, and debt-market conditions.";
  }

  if (/ai|openai|nvidia|llm|gpu|model/i.test(text)) {
    return "This matters because AI adoption is reshaping enterprise software budgets, cloud infrastructure spending, semiconductor demand, and automation strategy.";
  }

  if (/payment|fintech|upi|transaction/i.test(text)) {
    return "This matters because fintech infrastructure can reduce friction, lower transaction costs, and shift revenue away from legacy financial intermediaries.";
  }

  return "This matters because the development may affect investor sentiment, company strategy, competitive positioning, or sector-level capital allocation.";
}

function generateWhatToWatch(title: string, description: string, category: string): string {
  const text = (title + " " + description).toLowerCase();

  

  if (/\b(fed|rates?|inflation|yields?|bonds?|banks?|banking|central bank)\b/i.test(text)) {
    return "Watch upcoming inflation data, bond yields, central bank commentary, and bank stock reactions.";
  }

  if (/venture|startup|funding|valuation|vc/i.test(text)) {
    return "Watch follow-on funding rounds, valuation marks, startup exits, and investor commentary on risk appetite.";
  }

  if (/cyber|security|hack|breach|ransomware/i.test(text)) {
    return "Watch enterprise cybersecurity budgets, customer adoption, breach disclosures, and regulatory compliance updates.";
  }

  if (/private equity|buyout|lbo|leverage/i.test(text)) {
    return "Watch debt financing costs, deal activity, portfolio exits, and private credit market conditions.";
  }

  if (/ai|openai|nvidia|llm|gpu|model/i.test(text)) {
    return "Watch cloud capex, GPU demand, enterprise AI adoption, and product monetization updates.";
  }

  if (/payment|fintech|upi|transaction/i.test(text)) {
    return "Watch payment volumes, merchant adoption, transaction costs, and regulatory updates around digital finance.";
  }

  return "Watch follow-up announcements, market reaction, competitor responses, and regulatory developments.";
}


function generateTakeawaysFromTitle(title: string): string[] {
  const t = title.toLowerCase();
  const clean = title.replace(/ - [^-]+$/, "").trim();

  if (/ipo|listing|public offering|debut/i.test(t)) return [`${clean.split(" ").slice(0,6).join(" ")} is preparing to go public.`, "IPO activity signals investor appetite for new equity in this sector.", "Watch the pricing, valuation multiple, and first-day trading performance closely."];
  if (/acqui|merger|takeover|buyout|deal/i.test(t)) return [`${clean.split(" ").slice(0,6).join(" ")} signals consolidation in this space.`, "M&A activity often reshapes competitive dynamics and pricing power.", "Watch integration timelines, synergy targets, and regulatory approval."];
  if (/raises?|funding|series [a-e]|million|billion/i.test(t)) return [`${clean.split(" ").slice(0,6).join(" ")} secured fresh capital.`, "Funding rounds signal investor conviction in the business model and growth trajectory.", "Watch how the capital is deployed and whether follow-on rounds follow."];
  if (/fed|rate|inflation|yield|central bank|monetary/i.test(t)) return ["Central bank policy signals are shifting market expectations.", "Rate decisions affect borrowing costs, equity valuations, and currency strength.", "Watch the next inflation print and forward guidance from policymakers."];
  if (/ai|openai|nvidia|llm|gpu|model|chatgpt|gemini/i.test(t)) return ["AI infrastructure and model development continues to accelerate.", "Compute demand, model capabilities, and enterprise adoption are key value drivers.", "Watch GPU supply, cloud capex commitments, and enterprise contract wins."];
  if (/layoff|cut|restructur|workforce|job/i.test(t)) return ["Workforce restructuring signals a shift in cost or strategic priorities.", "Layoffs often precede margin expansion but can signal demand weakness.", "Watch guidance revisions, headcount trends, and morale indicators."];
  if (/private equity|pe fund|carried interest|lbo/i.test(t)) return ["Private equity activity reflects the state of leveraged finance markets.", "PE returns depend on entry multiples, debt costs, and exit conditions.", "Watch credit spreads, deal flow volume, and LP commitment trends."];
  if (/crypto|bitcoin|blockchain|token|defi/i.test(t)) return ["Digital asset markets are reacting to macro and regulatory signals.", "Crypto valuations are sensitive to liquidity conditions and regulatory clarity.", "Watch on-chain activity, institutional flows, and regulatory developments."];
  if (/bank|lending|credit|loan|deposit/i.test(t)) return ["Banking sector developments reflect the health of the credit cycle.", "Loan growth, deposit costs, and credit quality drive bank profitability.", "Watch net interest margins, non-performing loans, and capital ratios."];
  if (/strategy|consulting|transformation|restructur/i.test(t)) return ["Strategic shifts at the corporate level signal new capital allocation priorities.", "Management consulting engagements often precede large operational changes.", "Watch execution timelines, cost targets, and shareholder response."];

  return [`${clean.split(" ").slice(0,7).join(" ")} is a development worth tracking.`, "Monitor how this affects competitive positioning and capital flows in the sector.", "Watch for follow-up announcements, analyst reactions, and market movement."];
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
  const generatedTakeaways = generateTakeawaysFromTitle(normalizedTitle); while (takeaways.length < 3) { takeaways.push(generatedTakeaways[takeaways.length] || generatedTakeaways[0]); }

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
  const text = (title + " " + description).toLowerCase();

  const fallbackMessage = "";

  const takeaways: string[] = [];
  const cleanDesc = description.trim();
  const normalizedTitle = title.trim();

  const sentences =
    cleanDesc
      .match(/[^.!?]+[.!?]+/g)
      ?.map((s) => s.trim())
      .map((s) => removeSourceNames(s))
      .filter(
        (s) =>
          s.length > 15 &&
          !/read more|full coverage|click here|photo|copyright/i.test(s) &&
          getSentenceSimilarity(s, normalizedTitle) < 0.8
      ) || [];

  for (const s of sentences) {
    if (takeaways.length >= 3) break;
    if (!takeaways.some((added) => getSentenceSimilarity(s, added) >= 0.8)) {
      takeaways.push(s);
    }
  }

  while (takeaways.length < 3) {
    const gt = generateTakeawaysFromTitle(normalizedTitle); takeaways.push(gt[takeaways.length] || gt[0]);
  }

  let hook = "Not gonna lie, this matters.";
  let brainUpgrade =
    "What second-order effect could this create for markets, companies, or investors over the next 6–12 months?";

  if (/\b(fed|rates?|inflation|yields?|bonds?|banks?|banking|central bank|capital markets)\b/i.test(text)) {
    hook = "This macro update can quietly move capital flows.";
    brainUpgrade =
      "How would delayed rate cuts or tighter capital markets change discount rates, bank lending, and equity valuations?";
  } else if (/\b(venture|vc|startup|funding|valuation|exit|ipo)\b/i.test(text)) {
    hook = "This funding signal matters for startup and private-market valuations.";
    brainUpgrade =
      "Are investors rewarding real profitability now, or is growth still enough to justify premium startup valuations?";
  } else if (/\b(private equity|buyout|lbo|leverage|private credit)\b/i.test(text)) {
    hook = "This is a private-capital signal hiding in plain sight.";
    brainUpgrade =
      "Can operational value creation offset higher debt costs, or will buyout returns compress further?";
  } else if (/\b(ai|openai|nvidia|llm|gpu|model|models|data strategy)\b/i.test(text)) {
    hook = "This is the kind of AI update that quietly changes the game.";
    brainUpgrade =
      "If AI adoption scales here, who captures the economics: model providers, cloud platforms, data owners, or end-user companies?";
  } else if (/\b(payment|fintech|upi|transaction|checkout)\b/i.test(text)) {
    hook = "This fintech shift can affect transaction economics.";
    brainUpgrade =
      "Can payment networks defend margins if real-time settlement and lower-cost rails keep expanding?";
  } else if (/\b(consulting|strategy|transformation|mckinsey|bain|bcg)\b/i.test(text)) {
    hook = "This strategy piece points to a boardroom priority shift.";
    brainUpgrade =
      "Will companies spend more on advisory work, or will automation force consulting firms to prove measurable implementation ROI?";
  } else if (/\b(oil|brent|energy|crude|commodity|shipping)\b/i.test(text)) {
    hook = "This energy update can feed directly into margins and inflation.";
    brainUpgrade =
      "How would higher energy or shipping costs flow through corporate margins, inflation expectations, and consumer demand?";
  }

  return {
    hook,
    takeaways,
    brainUpgrade,
  };
}

// ─── FRESHNESS GATES ────────────────────────────────────────────────────────
// Daily news sources: strict 36-hour window
// Evergreen consulting/strategy sources: 7-day window (they don't publish daily)
const EVERGREEN_SOURCES = ["mckinsey insights", "bain insights", "bcg insights", "harvard business review"];

function isFreshArticle(pubDate: string, source: string): boolean {
  if (!pubDate) return false;

  const pubTime = new Date(pubDate).getTime();
  if (isNaN(pubTime)) return false;

  const ageMs = Date.now() - pubTime;
  if (ageMs < 0) return false; // future-dated articles rejected

  const isEvergreen = EVERGREEN_SOURCES.some(s => source.toLowerCase().includes(s));
  const maxAgeMs = isEvergreen
    ? 7 * 24 * 60 * 60 * 1000   // 7 days for consulting/HBR
    : 36 * 60 * 60 * 1000;       // 36 hours for daily news

  return ageMs <= maxAgeMs;
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

    // 2. Fetch and Parse RSS Feeds
    const rawArticles: Array<{ title: string; link: string; description: string; pubDate: string; source: string }> = [];

    const ts = Date.now();
    const feeds = [
      { name: "Reuters Business", url: `https://news.google.com/rss/search?q=site:reuters.com/business+OR+site:reuters.com/markets&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "The Economic Times", url: `https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms?t=${ts}` },
      // { name: "Moneycontrol", url: `https://www.moneycontrol.com/rss/latestnews.xml?t=${ts}` },  // REMOVED: returned April 2024 stale data
      { name: "LiveMint", url: `https://www.livemint.com/rss/markets?t=${ts}` },
      { name: "CNBC Business", url: `https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147&t=${ts}` },
      { name: "TechCrunch AI", url: `https://techcrunch.com/category/artificial-intelligence/feed/?t=${ts}` },
      { name: "Fortune Business", url: `https://fortune.com/feed/fortune-feeds/?id=3230629&t=${ts}` },
      { name: "Harvard Law Corp Gov", url: `https://corpgov.law.harvard.edu/feed/?t=${ts}` },
      { name: "PE Strategy News", url: `https://news.google.com/rss/search?q=private+equity+OR+merger+acquisition+OR+consulting+strategy+deal&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "MBA Strategy Desk", url: `https://news.google.com/rss/search?q=strategy+OR+restructuring+OR+buyout+OR+divestiture+OR+management+consulting&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "Bloomberg", url: `https://news.google.com/rss/search?q=site:bloomberg.com&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "Wall Street Journal", url: `https://news.google.com/rss/search?q=site:wsj.com&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "Financial Times", url: `https://news.google.com/rss/search?q=site:ft.com&hl=en-US&gl=US&ceid=US:en&t=${ts}` }
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

    // ── LOG 1: Raw feed sample (one log only) ────────────────────────────────
    console.log(
      "RSS SAMPLE (raw, pre-filter):",
      rawArticles.slice(0, 10).map((a) => ({
        title: a.title,
        source: a.source,
        pubDate: a.pubDate,
        parsedDate: new Date(a.pubDate).toISOString?.() ?? "invalid",
      }))
    );
    console.log(`RSS TOTAL RAW: ${rawArticles.length} articles from ${feeds.length} feeds`);

    // 3. Filter, Deduplicate and Rank Articles
    const filterKeywords = [
      "finance", "fintech", "pay", "bank", "venture", "equity", "funding", "investment", "capital",
      "crypto", "blockchain", "startup", "nvidia", "openai", "ai", "llm", "gpt", "model", "consulting",
      "mckinsey", "bcg", "bain", "mba", "strategy", "macro", "fed", "inflation", "rate", "yield",
      "dxy", "market", "stocks", "sec", "treasury", "acquisition", "merger", "pe", "vc", "banking-tech"
    ];

    const uniqueArticles: typeof rawArticles = [];
    const seenTitles = new Set<string>();
    const seenUrls = new Set<string>();

    // Track rejection reasons for observability
    let rejectedStale = 0;
    let rejectedKeyword = 0;
    let rejectedDuplicate = 0;

    for (const art of rawArticles) {
      // Hard freshness gate (source-aware window)
      if (!isFreshArticle(art.pubDate, art.source)) {
        rejectedStale++;
        continue;
      }

      const titleLower = art.title.toLowerCase();
      const descLower = art.description.toLowerCase();

      // Keyword filter
      const matchesKeyword = filterKeywords.some(
        (kw) => titleLower.includes(kw) || descLower.includes(kw)
      );
      if (!matchesKeyword) {
        rejectedKeyword++;
        continue;
      }

      // Deduplication
      const normTitle = titleLower.replace(/[^a-z0-9]/g, "").substring(0, 30);
      if (seenTitles.has(normTitle) || seenUrls.has(art.link)) {
        rejectedDuplicate++;
        continue;
      }

      seenTitles.add(normTitle);
      seenUrls.add(art.link);
      uniqueArticles.push(art);
    }

    // ── LOG 2: UNIQUE FRESH ARTICLES — the critical post-filter checkpoint ───
    console.log(
      `UNIQUE FRESH ARTICLES: ${uniqueArticles.length} survived (rejected: ${rejectedStale} stale, ${rejectedKeyword} no-keyword, ${rejectedDuplicate} duplicate)`
    );
    console.log(
      "UNIQUE FRESH SAMPLE:",
      uniqueArticles.slice(0, 10).map((a) => ({
        title: a.title,
        source: a.source,
        pubDate: a.pubDate,
      }))
    );

    // ── Source diversity check ───────────────────────────────────────────────
    const sourceCounts: Record<string, number> = {};
    uniqueArticles.forEach(a => {
      sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1;
    });
    console.log("SOURCE DISTRIBUTION:", sourceCounts);

    // 4. Rank by relevance
    const scoredArticles = uniqueArticles.map((art) => {
      let score = 0;
      const titleLower = art.title.toLowerCase();
      const descLower = art.description.toLowerCase();

      // Count keyword occurrences
      filterKeywords.forEach((kw) => {
        if (titleLower.includes(kw)) score += 10;
        if (descLower.includes(kw)) score += 3;
      });

      // Category scoring
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

      // Source quality boost
      const sourceLower = art.source.toLowerCase();
      if (
        sourceLower.includes("reuters") ||
        sourceLower.includes("bloomberg") ||
        sourceLower.includes("financial times") ||
        sourceLower.includes("wall street journal") ||
        sourceLower.includes("mckinsey") ||
        sourceLower.includes("bcg") ||
        sourceLower.includes("bain") ||
        sourceLower.includes("harvard business")
      ) {
        score += 25;
      } else if (
        sourceLower.includes("economic times") ||
        sourceLower.includes("livemint") ||
        sourceLower.includes("cnbc") ||
        sourceLower.includes("techcrunch")
      ) {
        score += 15;
      }

      // Recency boost (last 12 hours = strong signal, 12-24 hours = moderate)
      if (art.pubDate) {
        try {
          const pubTime = new Date(art.pubDate).getTime();
          const ageHours = (Date.now() - pubTime) / (60 * 60 * 1000);
          if (ageHours < 12) score += 20;
          else if (ageHours < 24) score += 10;
        } catch (_) { }
      }

      return { art, score };
    });

    // Sort descending by score
    scoredArticles.sort((a, b) => b.score - a.score);
    const sorted = scoredArticles.map((s) => s.art);

    // ── LOG 3: Top scored articles going into section selection ──────────────
    console.log(
      "TOP SCORED ARTICLES:",
      scoredArticles.slice(0, 8).map((s) => ({
        title: s.art.title,
        source: s.art.source,
        score: s.score,
      }))
    );

    // ── FALLBACK: not enough articles — do NOT email demo content silently ───
    if (sorted.length < 8) {
      console.warn(
        `[FALLBACK TRIGGERED] Only ${sorted.length} fresh articles survived filtering. ` +
        `Minimum required: 8. No email sent. Returning error to client.`
      );

      const res = NextResponse.json(
        {
          success: false,
          error: `Live article pool too small (${sorted.length} articles). No email sent. Check Vercel logs for RSS health.`,
          debug: {
            rawTotal: rawArticles.length,
            uniqueFresh: uniqueArticles.length,
            rejectedStale,
            rejectedKeyword,
            rejectedDuplicate,
            sourceCounts,
          },
        },
        { status: 200 }
      );
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.headers.set("Pragma", "no-cache");
      res.headers.set("Expires", "0");
      return res;
    }

    // 5. Generate Structured Newspaper Edition
    const usedUrls = new Set<string>();
    const usedSources = new Map<string, number>(); // source → count used in this edition

    // Source cap: no single source dominates the edition
    const SOURCE_CAP = 2;

    const canUseSource = (source: string) => {
      return (usedSources.get(source) || 0) < SOURCE_CAP;
    };

    const markSourceUsed = (source: string) => {
      usedSources.set(source, (usedSources.get(source) || 0) + 1);
    };

    // Featured Story — pick from top 5 scored, rotate deterministically by hour
    // Avoids same story appearing in consecutive morning/evening editions
    const rotationPoolSize = Math.min(sorted.length, 5);
    const rotationIndex = hour % rotationPoolSize; // hour-based, not pure random
    const topStory = sorted[rotationIndex];
    usedUrls.add(topStory.link);
    markSourceUsed(topStory.source);

    const featFields = generateArticleFields(topStory.title, topStory.description, "watchlist");
    const featuredStory: Article = {
      id: "live-feat",
      headline: topStory.title,
      sourceName: topStory.source,
      sourceTitle: topStory.title,
      sourceUrl: topStory.link,
      ...featFields
    };

    // Helper: find next unused article matching an optional filter, with source cap
    const findUnusedArticle = (
      filterFn?: (art: typeof sorted[0]) => boolean,
      respectSourceCap = true
    ) => {
      // Pass 1: filter + source cap
      for (const art of sorted) {
        if (usedUrls.has(art.link)) continue;
        if (respectSourceCap && !canUseSource(art.source)) continue;
        if (!filterFn || filterFn(art)) {
          usedUrls.add(art.link);
          markSourceUsed(art.source);
          return art;
        }
      }
      // Pass 2: relax source cap if no match found with filter
      if (filterFn) {
        for (const art of sorted) {
          if (usedUrls.has(art.link)) continue;
          if (filterFn(art)) {
            usedUrls.add(art.link);
            markSourceUsed(art.source);
            return art;
          }
        }
      }
      // Pass 3: any unused article (last resort, no filter, no cap)
      for (const art of sorted) {
        if (usedUrls.has(art.link)) continue;
        usedUrls.add(art.link);
        markSourceUsed(art.source);
        return art;
      }
      return null;
    };

    // AI & Fintech Radar (2 articles)
    const aiFintechList: Article[] = [];
    for (let i = 0; i < 2; i++) {
      const art = findUnusedArticle((a) =>
        /ai|fintech|payment|tech|openai|nvidia|gpu|model|llm|banking-tech/i.test(a.title + " " + a.description)
      );
      if (art) {
        const fields = generateArticleFields(art.title, art.description, "ai");
        aiFintechList.push({
          id: `live-ai-${i}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
    }

    // Strategy & MBA Desk (2 articles)
    // Priority 1: articles FROM consulting sources directly
    // Priority 2: articles that mention consulting/strategy topics
    const consultingList: Article[] = [];
    for (let i = 0; i < 2; i++) {
      // First try: articles from consulting/HBR sources
      let art = findUnusedArticle((a) =>
        /fortune|harvard law|pe strategy|mba strategy/i.test(a.source)
      );
      // Second try: articles mentioning consulting/strategy topics from any source
      if (!art) {
        art = findUnusedArticle((a) =>
          /\b(consulting|advisory|mckinsey|bcg|bain|hbr|harvard business|mba|strategy|transformation|restructur|divestiture|spin.?off|merger|acquisition|private equity|buyout|lbo)\b/i.test(a.title + " " + a.description)
        );
      }
      if (art) {
        const fields = generateArticleFields(art.title, art.description, "consulting");
        consultingList.push({
          id: `live-con-${i}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
    }

    // Company Watchlist (2 articles)
    // Focus on specific company news — earnings, deals, leadership, products
    const watchlistList: Article[] = [];
    for (let i = 0; i < 2; i++) {
      const art = findUnusedArticle((a) => {
        const text = a.title + " " + a.description;
        // Must mention a specific company AND a company event
        const hasCompany = /nvidia|apple|google|alphabet|meta|amazon|microsoft|tesla|openai|anthropic|blackstone|blackrock|jpmorgan|goldman|morgan stanley|softbank|sequoia|andreessen|berkshire|reliance|tata|infosys|wipro|hdfc|icici|sbi/i.test(text);
        const hasEvent = /earnings|revenue|profit|loss|ceo|founder|laid off|layoff|acqui|merger|deal|raises|funding|ipo|shares|stock|valuation|invest|partner|launch|product|quarter/i.test(text);
        return hasCompany && hasEvent;
      });
      if (art) {
        const fields = generateArticleFields(art.title, art.description, "watchlist");
        watchlistList.push({
          id: `live-watch-${i}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
    }

    // Smart Reads (2 articles — prefer long-form insight/research pieces)
    // Priority: HBR/McKinsey/BCG/Bain source, then research/insight keywords
    const smartReads: SmartRead[] = [];
    for (let i = 0; i < 2; i++) {
      // First try: from insight/research sources
      let art = findUnusedArticle((a) =>
        /fortune|harvard law|pe strategy|mba strategy/i.test(a.source)
      );
      // Second try: articles with research/insight/analysis language
      if (!art) {
        art = findUnusedArticle((a) =>
          /\b(research|insight|report|study|analysis|survey|framework|whitepaper|playbook|guide|how to|what leaders|why companies|the future of)\b/i.test(a.title)
        );
      }
      if (art) {
        const fields = generateSmartReadFields(art.title, art.description);
        smartReads.push({
          id: `live-smart-${i}`,
          headline: art.title,
          sourceName: art.source,
          sourceTitle: art.title,
          sourceUrl: art.link,
          ...fields
        });
      }
    }

    // Market Commentary — prefer macro article, fall back to top story
    const macroArticle =
      sorted.find(
        (art) =>
          !usedUrls.has(art.link) &&
          /fed|inflation|interest|rate|yield|dxy|macro|imf|world bank/i.test(art.title + " " + art.description)
      ) || topStory;

    // What to Watch Next (3 agenda items)
    const whatToWatchNext: WatchItem[] = [];
    for (let i = 0; i < 3; i++) {
      const art = findUnusedArticle();
      if (art) {
        const category = /ai|openai|nvidia|llm/i.test(art.title + " " + art.description) ? "ai" :
          (/fintech|pay|upi/i.test(art.title + " " + art.description) ? "fintech" : "watchlist");
        const event = art.title.length > 55 ? art.title.substring(0, 55) + "..." : art.title;
        const actionable = generateWhatToWatch(art.title, art.description, category);
        whatToWatchNext.push({ event, actionable });
      }
    }

    // ── LOG 4: Final edition summary ─────────────────────────────────────────
    console.log("EDITION SUMMARY:", {
      featuredStory: featuredStory.headline,
      featuredSource: featuredStory.sourceName,
      aiFintechCount: aiFintechList.length,
      consultingCount: consultingList.length,
      watchlistCount: watchlistList.length,
      smartReadsCount: smartReads.length,
      watchNextCount: whatToWatchNext.length,
      sourcesUsed: Object.fromEntries(usedSources),
    });

    // 6. Construct live Edition object
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
        translation: generateTranslation(macroArticle.title, macroArticle.description, "macro"),
        whatToWatchNext: generateWhatToWatch(macroArticle.title, macroArticle.description, "macro")
      },
      tickerData,
      featuredStory,
      aiFintechRadar: aiFintechList,
      consultingMbaDesk: consultingList,
      companyWatchlist: watchlistList,
      smartReads,
      whatToWatchNext
    };

    // 7. Send email
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

    console.log(`EMAIL SENT: edition ${liveEdition.id} → ${recipientEmail} | top story: "${featuredStory.headline}"`);

    const res = NextResponse.json({
      success: true,
      message: "Latest Quick Finance edition generated and emailed successfully.",
      edition: liveEdition,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;

  } catch (error: any) {
    console.error("RSS manual refresh error:", error);
    const res = NextResponse.json(
      {
        error: error?.message || "Internal server error occurred during RSS news refresh.",
      },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  }
}





