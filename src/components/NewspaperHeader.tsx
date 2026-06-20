import React from "react";

interface NewspaperHeaderProps {
  title: string;
  subtitle: string;
  date: string;
  issueNumber: number;
  price: string;
  editionName: "Morning Edition" | "Evening Edition";
}

export default function NewspaperHeader({
  title,
  subtitle,
  date,
  issueNumber,
  price,
  editionName,
}: NewspaperHeaderProps) {
  return (
    <header className="w-full text-center select-none">
      {/* Small Banner */}
      <div className="text-[10px] uppercase font-bold tracking-widest text-[#7f1d1d] mb-1 font-serif">
        ★ {editionName} ★
      </div>

      {/* Main Title Masthead */}
      <h1 className="font-masthead font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none border-b border-black pb-2 text-[#1a1a1a]">
        {title}
      </h1>

      {/* Slogan */}
      <p className="font-serif italic text-sm sm:text-base text-stone-600 mt-2">
        {subtitle}
      </p>

      {/* Publication Date bar with double border */}
      <div className="newspaper-double-border py-1 px-4 my-4 flex flex-col sm:flex-row justify-between items-center text-xs font-serif uppercase tracking-widest font-semibold text-stone-700">
        <span>Vol. CCXLVI No. {issueNumber}</span>
        <span className="font-bold my-1 sm:my-0">{date}</span>
        <span>Retail Price: {price}</span>
      </div>
    </header>
  );
}
