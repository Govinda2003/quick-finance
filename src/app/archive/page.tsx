"use client";

import React from "react";
import Link from "next/link";
import { MOCK_EDITIONS } from "../../data/mockData";

export default function ArchivePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans antialiased pb-12">
      {/* Navigation Header */}
      <nav className="bg-slate-950 border-b border-slate-800 py-3.5 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xl">🗞️</span>
            <span className="font-masthead font-bold tracking-widest text-slate-100 text-sm md:text-base">
              NO-NONSENSE SIGNAL
            </span>
          </div>
          <div className="flex gap-6 text-sm font-semibold">
            <Link href="/" className="text-slate-400 hover:text-slate-200 transition-all">
              Newspaper
            </Link>
            <Link href="/archive" className="text-blue-400 hover:text-blue-300 transition-all border-b-2 border-blue-400 pb-0.5">
              Archive
            </Link>
            <Link href="/settings" className="text-slate-400 hover:text-slate-200 transition-all">
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Archive List Wrapper */}
      <main className="max-w-4xl w-full mx-auto p-4 md:p-8 flex-grow">
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold font-serif mb-2 text-slate-100">
            Historical Editions Archive
          </h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Browse through previous morning and evening briefings. Selecting any edition will load its historical news stories and market snapshots.
          </p>

          <div className="space-y-4">
            {MOCK_EDITIONS.map((edition) => {
              const isMorning = edition.editionName === "Morning Edition";
              return (
                <div
                  key={edition.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase bg-slate-800 text-stone-300 py-0.5 px-2 rounded">
                        Vol. CCXLVI No. {edition.number}
                      </span>
                      <span className={`text-[10px] font-mono uppercase py-0.5 px-2 rounded font-bold ${
                        isMorning ? "bg-[#7f1d1d]/20 text-[#fb7185]" : "bg-blue-900/20 text-blue-300"
                      }`}>
                        {edition.editionName}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-200">
                      {edition.date}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 italic">
                      Headline: {edition.marketSummary.headline}
                    </p>
                  </div>

                  <Link
                    href={`/?edition=${edition.id}`}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs py-2 px-4 rounded text-center border border-slate-700 hover:border-slate-600 transition-all uppercase tracking-wider"
                  >
                    View Edition &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
