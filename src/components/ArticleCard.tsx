import React from "react";
import { Article } from "../data/mockData";

interface ArticleCardProps {
  article: Article;
  isLead?: boolean;
}

export default function ArticleCard({ article, isLead = false }: ArticleCardProps) {
  return (
    <article className={`flex flex-col mb-8 ${isLead ? "border-b border-black pb-8 last:border-0 last:pb-0" : ""}`}>
      {/* Headline */}
      <h3 className={`font-serif font-black uppercase text-[#1a1a1a] tracking-tight leading-tight mb-2 ${
        isLead ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
      }`}>
        {article.headline}
      </h3>

      {/* Hook / Sub-headline */}
      <h4 className="font-serif italic text-stone-600 text-sm sm:text-base leading-snug mb-4 font-normal">
        {article.hook}
      </h4>

      {/* Bullet Points */}
      <ul className="list-none pl-0 mb-4 font-serif text-sm text-stone-800 space-y-1.5 text-justify">
        {article.takeaways.slice(0, 3).map((takeaway, idx) => (
          <li key={idx} className="relative pl-4">
            <span className="absolute left-0 top-1.5 text-[8px] text-[#7f1d1d]">■</span>
            {takeaway}
          </li>
        ))}
      </ul>

      {/* Translation */}
      <div className="font-serif text-sm font-bold text-stone-900 border-l-2 border-[#7f1d1d] pl-3 py-1 mb-4 bg-stone-50/50">
        {article.translation}
      </div>

      {/* Why This Matters */}
      <div className="font-sans text-xs text-stone-700 leading-relaxed mb-4 text-justify">
        <strong className="text-stone-950 font-bold block mb-0.5">Why This Matters:</strong>
        {article.whyThisMatters}
      </div>

      {/* What to Watch */}
      <div className="font-sans text-xs text-stone-700 leading-relaxed mb-4 text-justify">
        <strong className="text-stone-950 font-bold block mb-0.5">What to Watch:</strong>
        {article.whatToWatch}
      </div>

      {/* Link and Source Section */}
      <div className="mt-auto pt-3 border-t border-dashed border-stone-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="text-[10px] font-mono uppercase text-stone-500">
          Source: <span className="font-bold text-stone-700">{article.sourceName}</span> — <span className="italic">{article.sourceTitle}</span>
        </div>
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-serif font-bold text-[#7f1d1d] hover:text-black border-b-2 border-transparent hover:border-black transition-all pb-0.5 inline-block uppercase tracking-wider"
        >
          Read Full Article &rarr;
        </a>
      </div>
    </article>
  );
}
