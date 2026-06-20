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

// Smart context-aware content generator for mock fields
function generateArticleFields(title: string, description: string, category: string) {
  const cleanDesc = description.trim();
  let takeaways = [
    `${title.trim()}.`,
    cleanDesc.length > 50 ? `${cleanDesc.substring(0, 100)}...` : "Key industry metrics indicate shifting demand patterns.",
    "Market participants are monitoring execution milestones closely."
  ];

  const sentences = cleanDesc
    .match(/[^.!?]+[.!?]+/g)
    ?.map(s => s.trim())
    .filter(s => s.length > 15 && !/read more|full coverage|click here|photo/i.test(s)) || [];

  if (sentences.length >= 2) {
    takeaways = [
      sentences[0],
      sentences[1],
      "Strategic alignment and operational efficiency remain key success drivers."
    ];
  } else if (sentences.length === 1) {
    takeaways = [
      sentences[0],
      "Firms are pivoting towards high-margin segments in response.",
      "Regulatory and macro tailwinds are expected to shape the near-term trajectory."
    ];
  }

  let hook = "Not gonna lie, this matters.";
  if (category === "ai") {
    hook = "This company really said, let's cook.";
  } else if (category === "fintech") {
    hook = "Okay, this is actually important.";
  } else if (category === "consulting") {
    hook = "Consulting-core move right here.";
  } else if (category === "watchlist") {
    hook = "The boring headline hides a very spicy detail.";
  }

  let translation = "Translation: this could move money. Markets are reacting to shifting capital structures.";
  if (category === "ai") {
    translation = "Translation: this could move money. AI infrastructure and chip demand show no signs of plateauing.";
  } else if (category === "fintech") {
    translation = "Translation: this could move money. Real-time settlement rails are rapidly scaling.";
  } else if (category === "consulting") {
    translation = "Translation: this could move money. Operational value creation is taking precedence over raw financial leverage.";
  } else if (category === "watchlist") {
    translation = "Translation: this could move money. Private capital allocation is aggressively chasing digital asset infrastructure.";
  }

  let whyThisMatters = "Corporate margins are highly exposed to this trend. Valuation models need adjusting, bhai.";
  if (category === "ai") {
    whyThisMatters = "If you're modeling tech valuations, compute costs are the main hurdle. Strategists are focusing on cash-flow positive AI, yaar.";
  } else if (category === "fintech") {
    whyThisMatters = "For fintech builders, payment orchestration is a major differentiator. Optimize for interchange fees and success rates, bhai.";
  } else if (category === "consulting") {
    whyThisMatters = "MBA folks, pay attention. The next wave of strategy consulting is cleaning up enterprise AI waste. ROI is the keyword here.";
  } else if (category === "watchlist") {
    whyThisMatters = "Venture debt and buyout valuations are rising with this cash influx. Advise pipelines look strong.";
  }

  let whatToWatch = "Watch the upcoming earnings guidance to trace demand curves.";
  if (category === "ai") {
    whatToWatch = "Watch Blackwell shipping volumes and hyperscaler cloud capex in Q3.";
  } else if (category === "fintech") {
    whatToWatch = "Watch how legacy payment networks defend their market share.";
  } else if (category === "consulting") {
    whatToWatch = "Watch how enterprise software procurement processes tighten in the coming quarters.";
  }

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
  const sentences = cleanDesc
    .match(/[^.!?]+[.!?]+/g)
    ?.map(s => s.trim())
    .filter(s => s.length > 15 && !/read more|full coverage|click here/i.test(s)) || [];

  let takeaways = [
    title,
    "Traditional algorithmic methods are reaching limits, forcing a shift to novel architectures.",
    "Proposed optimizations claim up to 10x compute reduction in early evaluations."
  ];
  if (sentences.length >= 2) {
    takeaways = [
      sentences[0],
      sentences[1],
      "Early metrics show promising improvements in long-context scaling stability."
    ];
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
