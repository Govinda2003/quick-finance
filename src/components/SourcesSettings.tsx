import React, { useState } from "react";

export default function SourcesSettings() {
  const [sources, setSources] = useState<string[]>([
    "Reuters",
    "Bloomberg",
    "Financial Times",
    "The Economic Times",
    "Moneycontrol",
    "LiveMint",
    "CNBC",
    "TechCrunch",
    "The Ken",
    "McKinsey Insights",
    "BCG Insights",
    "Bain Insights",
    "Harvard Business Review"
  ]);

  const [customUrls, setCustomUrls] = useState<string[]>([
    "https://ir.nvidia.com/rss",
    "https://www.sec.gov/news/pressreleases.rss"
  ]);
  const [newUrl, setNewUrl] = useState("");

  const handleToggleSource = (sourceName: string) => {
    if (sources.includes(sourceName)) {
      setSources(sources.filter((s) => s !== sourceName));
    } else {
      setSources([...sources, sourceName]);
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim() && !customUrls.includes(newUrl.trim())) {
      setCustomUrls([...customUrls, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    setCustomUrls(customUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {/* Editorial Sources List */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-2 mb-4 font-serif">
          Preferred Trusted Sources
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Enable or disable publisher sources. Only news originating from these channels will be crawled and aggregated in the 12-hour edition cycle.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            "Reuters",
            "Bloomberg",
            "Financial Times",
            "The Economic Times",
            "Moneycontrol",
            "LiveMint",
            "CNBC",
            "TechCrunch",
            "The Ken",
            "McKinsey Insights",
            "BCG Insights",
            "Bain Insights",
            "Harvard Business Review"
          ].map((source, index) => {
            const isChecked = sources.includes(source);
            return (
              <label
                key={index}
                className={`flex items-center gap-2.5 p-3 rounded border text-xs cursor-pointer select-none transition-all ${
                  isChecked
                    ? "bg-slate-800 border-blue-500 text-slate-100"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleSource(source)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-semibold">{source}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Custom RSS Feeds */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-2 mb-4 font-serif">
          Custom RSS / XML News Feeds
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          In addition to our curated databases, add custom feed endpoints (e.g. corporate IR feeds, regulatory announcements) for the scraper to scan.
        </p>
        <div className="space-y-2 mb-4">
          {customUrls.map((url, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs"
            >
              <span className="font-mono text-slate-300 truncate mr-4">{url}</span>
              <button
                type="button"
                onClick={() => handleRemoveUrl(idx)}
                className="text-slate-500 hover:text-rose-400 font-bold text-sm focus:outline-none"
              >
                ✖
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddUrl} className="flex gap-2 max-w-md">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Add RSS Feed URL (e.g. https://domain.com/feed)"
            className="flex-grow bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded transition-all focus:outline-none"
          >
            Add Feed
          </button>
        </form>
      </div>
    </div>
  );
}
