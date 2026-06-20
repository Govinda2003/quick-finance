"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MOCK_EDITIONS, NewspaperEdition } from "../data/mockData";
import MarketTicker from "../components/MarketTicker";
import NewspaperHeader from "../components/NewspaperHeader";
import ArticleCard from "../components/ArticleCard";

export default function NewspaperPage() {
  const [currentEdition, setCurrentEdition] = useState<NewspaperEdition>(MOCK_EDITIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = "Quick Finance";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const edId = params.get("edition");
      if (edId) {
        const match = MOCK_EDITIONS.find(e => e.id === edId);
        if (match) {
          setCurrentEdition(match);
        }
      }
    }
  }, []);

  const handleGenerateEdition = async () => {
    setIsGenerating(true);
    setMessage(null);

    let recipientEmail = "govindatapdia123@gmail.com";
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("pref_emailAddress");
      if (savedEmail) {
        recipientEmail = savedEmail;
      }
    }

    try {
      const response = await fetch("/api/refresh-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recipientEmail,
        }),
      });

      const data = await response.json();

      if (data.edition) {
        setCurrentEdition(data.edition);
      }

      if (response.ok && data.success) {
        setMessage("Latest Quick Finance edition generated and emailed successfully.");
      } else {
        setMessage(`Error: ${data.error || "Live news API not configured yet. Showing demo edition."}`);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Error: ${error.message || "A network error occurred while generating the edition."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setMessage(null);

    // Retrieve email from localStorage if available
    let recipientEmail = "govindatapdia123@gmail.com";
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("pref_emailAddress");
      if (savedEmail) {
        recipientEmail = savedEmail;
      }
    }

    try {
      const response = await fetch("/api/send-test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipientEmail,
          edition: currentEdition,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(`Success: Newspaper edition successfully sent to ${recipientEmail} via Gmail.`);
      } else {
        setMessage(`Error: ${data.error || "Failed to send email."}`);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Error: ${error.message || "A network error occurred while sending the email."}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans antialiased pb-24">
      {/* Navigation Header */}
      <nav className="no-print bg-slate-950 border-b border-slate-800 py-3.5 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xl">🗞️</span>
            <span className="font-masthead font-bold tracking-widest text-slate-100 text-sm md:text-base">
              NO-NONSENSE SIGNAL
            </span>
          </div>
          <div className="flex gap-6 text-sm font-semibold">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition-all border-b-2 border-blue-400 pb-0.5">
              Newspaper
            </Link>
            <Link href="/archive" className="text-slate-400 hover:text-slate-200 transition-all">
              Archive
            </Link>
            <Link href="/settings" className="text-slate-400 hover:text-slate-200 transition-all">
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Stock Ticker Strip */}
      <MarketTicker tickerData={currentEdition.tickerData} />

      {/* Main Content Area */}
      <main className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-8 flex justify-center items-start">
        {/* Newspaper Printed Sheet */}
        <div className="print-page w-full max-w-[850px] bg-[#fcf9f2] text-stone-900 shadow-2xl p-6 md:p-12 border border-stone-300 relative select-text transition-all leading-relaxed">
          
          {/* Header */}
          <NewspaperHeader
            title="Quick Finance"
            subtitle="Smart Money, Simply Explained"
            date={currentEdition.date}
            issueNumber={currentEdition.number}
            price={currentEdition.price}
            editionName={currentEdition.editionName}
          />

          {/* Newspaper Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            
            {/* Left/Middle Column - Main News */}
            <div className="md:col-span-2 md:border-r md:border-stone-400 md:pr-8 space-y-8">
              {/* Featured Story */}
              <section>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#7f1d1d] font-bold mb-2">
                  ★ FEATURE STORY
                </div>
                <ArticleCard article={currentEdition.featuredStory} isLead={true} />
              </section>

              <hr className="border-stone-400" />

              {/* AI + FinTech Radar */}
              <section className="space-y-6">
                <h2 className="font-serif font-black text-xl uppercase border-b-2 border-black pb-1 mb-4 text-[#1a1a1a]">
                  AI & FinTech Radar
                </h2>
                {currentEdition.aiFintechRadar.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </section>

              <hr className="border-stone-400" />

              {/* Consulting & MBA Desk */}
              <section className="space-y-6">
                <h2 className="font-serif font-black text-xl uppercase border-b-2 border-black pb-1 mb-4 text-[#1a1a1a]">
                  Strategy & MBA Desk
                </h2>
                {currentEdition.consultingMbaDesk.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </section>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              
              {/* Market Summary */}
              <aside className="border border-black p-4 bg-stone-50/70">
                <h2 className="font-serif font-black text-base uppercase border-b-2 border-black pb-1.5 mb-3 text-center text-[#1a1a1a]">
                  Market Commentary
                </h2>
                <h3 className="font-serif font-bold text-sm text-stone-900 leading-snug mb-3">
                  {currentEdition.marketSummary.headline}
                </h3>
                <div className="space-y-3 font-sans text-xs text-stone-700">
                  <div>
                    <strong className="text-stone-950 font-bold block mb-0.5">Driver:</strong>
                    {currentEdition.marketSummary.driver}
                  </div>
                  <div>
                    <strong className="text-stone-950 font-bold block mb-0.5">Sentiment:</strong>
                    {currentEdition.marketSummary.sentiment}
                  </div>
                  <div className="border-l-2 border-[#7f1d1d] pl-2 font-serif text-stone-900 font-semibold py-0.5 bg-stone-100/50">
                    {currentEdition.marketSummary.translation}
                  </div>
                  <div>
                    <strong className="text-stone-950 font-bold block mb-0.5">What to Watch Next:</strong>
                    {currentEdition.marketSummary.whatToWatchNext}
                  </div>
                </div>
              </aside>

              {/* Company Watchlist */}
              <aside className="border border-black p-4">
                <h2 className="font-serif font-black text-base uppercase border-b-2 border-black pb-1.5 mb-4 text-center text-[#1a1a1a]">
                  Watchlist Activity
                </h2>
                <div className="space-y-6">
                  {currentEdition.companyWatchlist.map((article) => (
                    <div key={article.id} className="border-b border-dashed border-stone-300 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-serif font-bold text-sm uppercase text-[#1a1a1a] mb-1.5 leading-snug">
                        {article.headline}
                      </h4>
                      <p className="font-serif italic text-stone-600 text-xs mb-2">
                        {article.hook}
                      </p>
                      <ul className="text-[11px] list-none text-stone-700 space-y-1 mb-2">
                        {article.takeaways.map((takeaway, idx) => (
                          <li key={idx} className="relative pl-3">
                            <span className="absolute left-0 top-1 text-[6px] text-[#7f1d1d]">■</span>
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                      <div className="text-[9px] font-mono text-stone-500 uppercase flex justify-between items-center mt-2">
                        <span>Source: {article.sourceName}</span>
                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-serif font-bold text-[#7f1d1d] hover:text-black hover:underline"
                        >
                          Read full article →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              {/* What to Watch Next Agenda */}
              <aside className="border border-black p-4 bg-stone-50/50">
                <h2 className="font-serif font-black text-base uppercase border-b-2 border-black pb-1.5 mb-4 text-center text-[#1a1a1a]">
                  Agenda: What to Watch
                </h2>
                <div className="space-y-4 text-xs">
                  {currentEdition.whatToWatchNext.map((item, idx) => (
                    <div key={idx} className="border-b border-stone-200 pb-3 last:border-b-0 last:pb-0">
                      <div className="font-serif font-black uppercase text-[#7f1d1d] tracking-wide mb-0.5">
                        {item.event}
                      </div>
                      <div className="text-stone-700 leading-relaxed">
                        {item.actionable}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>

          {/* Bottom Section - Smart Reads */}
          <div className="border-t border-black mt-8 pt-8">
            <h2 className="font-serif font-black text-2xl uppercase border-b border-black pb-2 mb-6 text-center text-[#1a1a1a]">
              Smart Reads & Cognitive Upgrades
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentEdition.smartReads.map((read) => (
                <div key={read.id} className="flex flex-col">
                  <h3 className="font-serif font-bold text-lg uppercase text-stone-900 leading-snug mb-1">
                    {read.headline}
                  </h3>
                  <p className="font-serif italic text-stone-600 text-xs mb-3">
                    {read.hook}
                  </p>
                  <ul className="text-xs list-none text-stone-700 space-y-1 mb-4 text-justify">
                    {read.takeaways.map((takeaway, idx) => (
                      <li key={idx} className="relative pl-3.5">
                        <span className="absolute left-0 top-1.5 text-[6px] text-[#7f1d1d]">■</span>
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-[#7f1d1d]/5 border-l-2 border-[#7f1d1d] p-3 text-xs text-stone-900 italic font-serif leading-relaxed mb-4">
                    <strong className="block text-[#7f1d1d] font-sans font-bold text-[10px] uppercase tracking-wider not-italic mb-1">
                      🧠 Brain Upgrade Question:
                    </strong>
                    "{read.brainUpgrade}"
                  </div>
                  <div className="mt-auto pt-2 flex justify-between items-center border-t border-stone-200 text-[10px] font-mono text-stone-500 uppercase">
                    <span>Source: {read.sourceName}</span>
                    <a
                      href={read.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif font-bold text-[#7f1d1d] hover:text-black hover:underline"
                    >
                      Read full article →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newspaper Footer */}
          <footer className="border-t-4 border-double border-black mt-8 pt-2 flex justify-between items-center text-[10px] font-serif uppercase tracking-widest font-semibold text-stone-600">
            <span>NO-NONSENSE BRIEFING © 2026</span>
            <span>Front Page Edition</span>
            <span>ESTABLISHED 2026</span>
          </footer>

        </div>
      </main>

      {/* Floating Bottom Control Panel */}
      <div className="no-print fixed bottom-0 left-0 w-full bg-slate-950/95 backdrop-blur-md border-t border-slate-800 py-4 px-6 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Toast / Message banner */}
          <div className="text-xs text-slate-300 text-center sm:text-left flex-grow">
            {message ? (
              <span className={`font-semibold block sm:inline ${message.startsWith("Error:") ? "text-rose-400" : "text-emerald-400"}`}>
                {message}
              </span>
            ) : (
              <span>MVP Action Panel: Trigger manual generation, Gmail dispatches, or print exports in real-time.</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleGenerateEdition}
              disabled={isGenerating}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 text-xs font-semibold px-4 py-2.5 rounded transition-all focus:outline-none flex items-center justify-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-slate-300" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Fetching latest signal...</span>
                </>
              ) : (
                <span>🔄 Refresh Latest News</span>
              )}
            </button>

            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 text-xs font-semibold px-4 py-2.5 rounded transition-all focus:outline-none flex items-center justify-center gap-1.5"
            >
              {isSendingEmail ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-slate-300" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <span>✉️ Send Test Email</span>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded transition-all focus:outline-none"
            >
              📄 Export PDF
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
