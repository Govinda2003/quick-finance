"use client";

import React, { useState } from "react";
import Link from "next/link";
import WatchlistSettings from "../../components/WatchlistSettings";
import SourcesSettings from "../../components/SourcesSettings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"watchlist" | "sources" | "preferences">("watchlist");
  const [emailAddress, setEmailAddress] = useState("govindatapdia123@gmail.com");
  const [morningSchedule, setMorningSchedule] = useState("07:00");
  const [eveningSchedule, setEveningSchedule] = useState("19:00");
  const [sarcasmFactor, setSarcasmFactor] = useState(20);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("pref_emailAddress");
      if (savedEmail) setEmailAddress(savedEmail);
      const savedMorning = localStorage.getItem("pref_morningSchedule");
      if (savedMorning) setMorningSchedule(savedMorning);
      const savedEvening = localStorage.getItem("pref_eveningSchedule");
      if (savedEvening) setEveningSchedule(savedEvening);
      const savedSarcasm = localStorage.getItem("pref_sarcasmFactor");
      if (savedSarcasm) setSarcasmFactor(parseInt(savedSarcasm, 10));
    }
  }, []);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("pref_emailAddress", emailAddress);
      localStorage.setItem("pref_morningSchedule", morningSchedule);
      localStorage.setItem("pref_eveningSchedule", eveningSchedule);
      localStorage.setItem("pref_sarcasmFactor", sarcasmFactor.toString());
    }
    setSaveMessage("Preferences updated successfully (saved to local preferences store).");
    setTimeout(() => setSaveMessage(null), 3000);
  };

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
            <Link href="/archive" className="text-slate-400 hover:text-slate-200 transition-all">
              Archive
            </Link>
            <Link href="/settings" className="text-blue-400 hover:text-blue-300 transition-all border-b-2 border-blue-400 pb-0.5">
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-4 md:p-8 flex-grow">
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          
          {/* Top Info Bar */}
          <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-950/20">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-2 text-slate-100">
              Intelligence Settings & Filters
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Configure scraping categories, watchlist companies, email alerts, and the editorial tone model.
            </p>
          </div>

          {/* Settings Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/30 text-sm font-medium">
            <button
              onClick={() => setActiveTab("watchlist")}
              className={`flex-1 sm:flex-none py-4 px-6 border-b-2 font-semibold text-center transition-all ${
                activeTab === "watchlist"
                  ? "border-blue-500 text-blue-400 bg-slate-900/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10"
              }`}
            >
              📊 Watchlist & Industries
            </button>
            <button
              onClick={() => setActiveTab("sources")}
              className={`flex-1 sm:flex-none py-4 px-6 border-b-2 font-semibold text-center transition-all ${
                activeTab === "sources"
                  ? "border-blue-500 text-blue-400 bg-slate-900/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10"
              }`}
            >
              📡 News Feeds & Sources
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`flex-1 sm:flex-none py-4 px-6 border-b-2 font-semibold text-center transition-all ${
                activeTab === "preferences"
                  ? "border-blue-500 text-blue-400 bg-slate-900/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10"
              }`}
            >
              ⚙️ Tone & Automation
            </button>
          </div>

          {/* Form Content Area */}
          <div className="p-6 md:p-8 bg-slate-900/10">
            {activeTab === "watchlist" && <WatchlistSettings />}

            {activeTab === "sources" && <SourcesSettings />}

            {activeTab === "preferences" && (
              <form onSubmit={handleSavePreferences} className="space-y-6">
                
                {/* Save Feedback banner */}
                {saveMessage && (
                  <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs py-3 px-4 rounded font-semibold transition-all">
                    {saveMessage}
                  </div>
                )}

                {/* Email Target Input */}
                <div className="flex flex-col gap-1.5 max-w-md">
                  <label htmlFor="prefEmail" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    id="prefEmail"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                    className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    Editions summary report will be dispatched here using Nodemailer credentials.
                  </span>
                </div>

                {/* Delivery schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="prefMorning" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Morning Edition Schedule
                    </label>
                    <input
                      type="time"
                      id="prefMorning"
                      value={morningSchedule}
                      onChange={(e) => setMorningSchedule(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="prefEvening" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Evening Edition Schedule
                    </label>
                    <input
                      type="time"
                      id="prefEvening"
                      value={eveningSchedule}
                      onChange={(e) => setEveningSchedule(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Sarcasm Factor */}
                <div className="flex flex-col gap-1.5 max-w-md">
                  <div className="flex justify-between items-center">
                    <label htmlFor="prefSarcasm" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Sarcasm / Gen-Z Flavor Factor
                    </label>
                    <span className="text-xs font-mono font-bold text-blue-400">{sarcasmFactor}%</span>
                  </div>
                  <input
                    type="range"
                    id="prefSarcasm"
                    min="0"
                    max="100"
                    step="5"
                    value={sarcasmFactor}
                    onChange={(e) => setSarcasmFactor(parseInt(e.target.value))}
                    className="h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0% (Wall Street Report)</span>
                    <span>20% (Recommended Vibe)</span>
                    <span>100% (Full Meme Page)</span>
                  </div>
                </div>

                {/* Sarcasm / Slang filters */}
                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-lg text-xs space-y-2">
                  <h4 className="font-bold text-slate-300 font-serif">Active Editorial Rules Compliance</h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                    <li>
                      <strong className="text-slate-300 font-semibold">Forbidden Slangs:</strong> "gyat", "rizz", "no cap", "pookie", and "slay" are dynamically filtered out.
                    </li>
                    <li>
                      <strong className="text-slate-300 font-semibold">Indian Localization:</strong> Swaps "finance bros" to "finance brothers", "vibe check" to "vibe test", and enables occasional "yaar"/"bhai" flags.
                    </li>
                    <li>
                      <strong className="text-slate-300 font-semibold">Ethical Sarcasm:</strong> Sarcasm is restricted to corporate hypocrisy, never allowed for layoffs or tragedies.
                    </li>
                  </ul>
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-2.5 rounded transition-all focus:outline-none"
                >
                  Save Settings
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
