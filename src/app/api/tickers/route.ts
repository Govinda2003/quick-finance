import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function fetchYahooPrice(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    return { price, change, changePercent };
  } catch {
    return null;
  }
}

export async function GET() {
  const tickers = [
    { symbol: "^NSEI", label: "NIFTY 50", format: "IN_INDEX" },
    { symbol: "^NSEBANK", label: "BANK NIFTY", format: "IN_INDEX" },
    { symbol: "^BSESN", label: "SENSEX", format: "IN_INDEX" },
    { symbol: "NVDA", label: "NVIDIA (NVDA)", format: "USD_STOCK" },
    { symbol: "TSLA", label: "TESLA (TSLA)", format: "USD_STOCK" },
    { symbol: "MSFT", label: "MICROSOFT (MSFT)", format: "USD_STOCK" },
    { symbol: "BZ=F", label: "BRENT CRUDE", format: "USD_COMMODITY" },
    { symbol: "GC=F", label: "GOLD (24K)", format: "GOLD_INR" },
  ];

  const results = await Promise.all(
    tickers.map(async (t) => {
      const data = await fetchYahooPrice(t.symbol);
      if (!data) return null;

      const sign = data.changePercent >= 0 ? "+" : "";
      const change = `${sign}${data.changePercent.toFixed(2)}%`;
      const isUp = data.changePercent >= 0;

      let value = "";
      if (t.format === "IN_INDEX") {
        value = Math.round(data.price).toLocaleString("en-IN");
      } else if (t.format === "USD_STOCK" || t.format === "USD_COMMODITY") {
        value = `$${data.price.toFixed(2)}`;
      } else if (t.format === "GOLD_INR") {
        const inr = data.price * 83;
        value = "\u20B9" + Math.round(inr / 10).toLocaleString("en-IN");
      }

      return { symbol: t.label, value, change, isUp, type: t.format.includes("INDEX") ? "index" : t.format === "GOLD_INR" || t.format === "USD_COMMODITY" ? "macro" : "stock" };
    })
  );

  const tickerData = results.filter(Boolean);
  return NextResponse.json({ success: true, tickerData });
}




