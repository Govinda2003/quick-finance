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

  if (description.trim().length < 40 || description.trim() === title.trim()) {
    return "Additional context was not available from the source feed.";
  }

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

  if (description.trim().length < 40 || description.trim() === title.trim()) {
    return "Additional context was not available from the source feed.";
  }

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

  if (description.trim().length < 40 || description.trim() === title.trim()) {
    return "Additional context was not available from the source feed.";
  }

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
  const fallbackMessage = "Additional context was not available from the source feed.";
  while (takeaways.length < 3) {
    takeaways.push(fallbackMessage);
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
  const text = (title + " " + description).toLowerCase();

  const fallbackMessage = "Additional context was not available from the source feed.";

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
    takeaways.push(fallbackMessage);
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

    // 2. Fetch and Parse 13 RSS Feeds
    const rawArticles: Array<{ title: string; link: string; description: string; pubDate: string; source: string }> = [];

    const ts = Date.now();
    const feeds = [
      { name: "Reuters Business", url: `https://news.google.com/rss/search?q=site:reuters.com/business+OR+site:reuters.com/markets&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "The Economic Times", url: `https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms?t=${ts}` },
      { name: "Moneycontrol", url: `https://www.moneycontrol.com/rss/latestnews.xml?t=${ts}` },
      { name: "LiveMint", url: `https://www.livemint.com/rss/markets?t=${ts}` },
      { name: "CNBC Business", url: `https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147&t=${ts}` },
      { name: "TechCrunch AI", url: `https://techcrunch.com/category/artificial-intelligence/feed/?t=${ts}` },
      { name: "McKinsey Insights", url: `https://news.google.com/rss/search?q=site:mckinsey.com/featured-insights+OR+site:mckinsey.com/capabilities&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "Bain Insights", url: `https://news.google.com/rss/search?q=site:bain.com/insights&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "BCG Insights", url: `https://news.google.com/rss/search?q=site:bcg.com/featured-insights&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
      { name: "Harvard Business Review", url: `https://news.google.com/rss/search?q=site:hbr.org&hl=en-US&gl=US&ceid=US:en&t=${ts}` },
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
        sourceLower.includes("wall street journal") ||
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
        } catch (_) { }
      }

      return { art, score };
    });

    // Sort descending by score
    scoredArticles.sort((a, b) => b.score - a.score);
    const sorted = scoredArticles.map((s) => s.art);

    // Fall back to dynamic demo edition if not enough articles were aggregated
    if (sorted.length < 12) {
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

      const res = NextResponse.json(
        {
          success: false,
          error: "Failed to aggregate live RSS feeds. Showing demo edition.",
          edition: demoEdition,
        },
        { status: 200 }
      );
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.headers.set("Pragma", "no-cache");
      res.headers.set("Expires", "0");
      return res;
    }

    // 4. Generate Structured Newspaper Edition
    const usedUrls = new Set<string>();

    // Featured Story (top article)
    const topStory = sorted[0];
    usedUrls.add(topStory.link);
    const featFields = generateArticleFields(topStory.title, topStory.description, "watchlist");
    const featuredStory: Article = {
      id: "live-feat",
      headline: topStory.title,
      sourceName: topStory.source,
      sourceTitle: topStory.title,
      sourceUrl: topStory.link,
      ...featFields
    };

    // Helper to find next matching unused article
    const findUnusedArticle = (filterFn?: (art: typeof sorted[0]) => boolean) => {
      for (const art of sorted) {
        if (usedUrls.has(art.link)) continue;
        if (!filterFn || filterFn(art)) {
          usedUrls.add(art.link);
          return art;
        }
      }
      // If no match found with filter, grab first unused article
      for (const art of sorted) {
        if (usedUrls.has(art.link)) continue;
        usedUrls.add(art.link);
        return art;
      }
      return null;
    };

    // AI & Fintech Radar (next 2 articles matching keywords)
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

    // Strategy & MBA Desk (next 2 articles matching keywords)
    const consultingList: Article[] = [];
    for (let i = 0; i < 2; i++) {
      const art = findUnusedArticle((a) =>
        /consulting|mckinsey|bcg|bain|mba|strategy|merger|acquisition|corp/i.test(a.title + " " + a.description)
      );
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

    // Company Watchlist (next 2 articles matching keywords)
    const watchlistList: Article[] = [];
    for (let i = 0; i < 2; i++) {
      const art = findUnusedArticle((a) =>
        /nvidia|tesla|microsoft|blackstone|jpmorgan|morgan|chase|bank|mckinsey|bcg|bain/i.test(a.title + " " + a.description)
      );
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

    // Smart Reads (next 2 academic/research papers)
    const smartReads: SmartRead[] = [];
    for (let i = 0; i < 2; i++) {
      const art = findUnusedArticle();
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

    // Market Commentary Headline
    const macroArticle = sorted.find((art) => /fed|inflation|interest|rate|yield|dxy|macro|imf|world bank/i.test(art.title + " " + art.description)) || topStory;

    // What to Watch Next Agenda (next 3 agenda items mapped dynamically from the RSS array)
    const whatToWatchNext: WatchItem[] = [];
    for (let i = 0; i < 3; i++) {
      const art = findUnusedArticle();
      if (art) {
        const category = /ai|openai|nvidia|llm/i.test(art.title + " " + art.description) ? "ai" :
          (/fintech|pay|upi/i.test(art.title + " " + art.description) ? "fintech" : "watchlist");
        const event = art.title.length > 55 ? art.title.substring(0, 55) + "..." : art.title;
        const actionable = generateWhatToWatch(art.title, art.description, category);
        whatToWatchNext.push({
          event,
          actionable
        });
      }
    }

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
