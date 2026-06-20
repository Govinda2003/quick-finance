import React, { useState } from "react";

export default function WatchlistSettings() {
  const [industries, setIndustries] = useState<string[]>([
    "Artificial Intelligence",
    "FinTech",
    "Investment Banking",
    "Private Equity & VC",
    "Macroeconomics",
    "Corporate Strategy"
  ]);

  const [newIndustry, setNewIndustry] = useState("");

  const [companies, setCompanies] = useState<string[]>([
    "NVIDIA",
    "Tesla",
    "Microsoft",
    "Blackstone",
    "JP Morgan",
    "Bank of America",
    "McKinsey",
    "BCG",
    "Bain"
  ]);

  const [newCompany, setNewCompany] = useState("");

  const handleAddIndustry = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIndustry.trim() && !industries.includes(newIndustry.trim())) {
      setIndustries([...industries, newIndustry.trim()]);
      setNewIndustry("");
    }
  };

  const handleRemoveIndustry = (index: number) => {
    setIndustries(industries.filter((_, i) => i !== index));
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompany.trim() && !companies.includes(newCompany.trim())) {
      setCompanies([...companies, newCompany.trim()]);
      setNewCompany("");
    }
  };

  const handleRemoveCompany = (index: number) => {
    setCompanies(companies.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {/* Industries Settings */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-2 mb-4 font-serif">
          Preferred Industries & Domains
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Filter incoming stories based on relevance to these specific sectors. Only articles matching these terms will be summarized.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {industries.map((ind, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-slate-800 text-slate-200 text-xs py-1.5 px-3 rounded-full border border-slate-700 hover:border-slate-500 transition-all"
            >
              <span>{ind}</span>
              <button
                type="button"
                onClick={() => handleRemoveIndustry(idx)}
                className="text-slate-400 hover:text-rose-400 font-bold ml-1 text-sm focus:outline-none"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddIndustry} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newIndustry}
            onChange={(e) => setNewIndustry(e.target.value)}
            placeholder="Add new industry (e.g. Wealth Creation)"
            className="flex-grow bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded transition-all focus:outline-none"
          >
            Add
          </button>
        </form>
      </div>

      {/* Companies Watchlist Settings */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-2 mb-4 font-serif">
          Tracked Companies & Stocks
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Specify exact companies and tickers you want to highlight. Stories about these entities will automatically elevate to the front page watchlist.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {companies.map((comp, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-slate-800 text-slate-200 text-xs py-1.5 px-3 rounded-full border border-slate-700 hover:border-slate-500 transition-all"
            >
              <span>{comp}</span>
              <button
                type="button"
                onClick={() => handleRemoveCompany(idx)}
                className="text-slate-400 hover:text-rose-400 font-bold ml-1 text-sm focus:outline-none"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddCompany} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="Add company / stock symbol (e.g. GOOGL)"
            className="flex-grow bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded transition-all focus:outline-none"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
