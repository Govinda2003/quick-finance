import React from "react";
import { MarketIndex } from "../data/mockData";

interface MarketTickerProps {
  tickerData: MarketIndex[];
}

export default function MarketTicker({ tickerData }: MarketTickerProps) {
  return (
    <div className="w-full bg-[#1a1a1a] text-stone-200 border-b border-black py-2 px-4 no-print overflow-x-auto shadow-inner">
      <div className="flex gap-8 whitespace-nowrap text-xs font-mono tracking-wider min-w-max justify-center">
        {tickerData.map((ticker, index) => {
          const changeColor = ticker.isUp ? "text-emerald-400" : "text-rose-400";
          return (
            <div key={index} className="flex items-center gap-1.5 border-r border-stone-700 pr-8 last:border-0 last:pr-0">
              <span className="font-semibold text-stone-400">{ticker.symbol}:</span>
              <span className="font-bold">{ticker.value}</span>
              <span className={`font-bold ${changeColor}`}>
                {ticker.change}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
