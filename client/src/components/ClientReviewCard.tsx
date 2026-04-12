import { useState } from "react";
import { Quote, Star, Building2 } from "lucide-react";
import type { ClientReview } from "@/data/reviews";
import logoAmrath from "../assets/pitch/amrath-logo.webp";
import logoMarriott from "../assets/pitch/marriott-logo.webp";
import logoRadisson from "../assets/pitch/logo-radisson.webp";
import logoHart from "../assets/pitch/logo-hart-museum.webp";
import logoWestweelde from "../assets/pitch/logo-westweelde-clean.webp";

const LOGOS: Record<string, string> = {
  amrath: logoAmrath,
  marriott: logoMarriott,
  radisson: logoRadisson,
  hart: logoHart,
  westweelde: logoWestweelde,
};

interface ClientReviewCardProps {
  review: ClientReview;
  variant?: "light" | "dark";
}

export function ClientReviewCard({ review, variant = "light" }: ClientReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const logo = review.logoKey ? LOGOS[review.logoKey] : null;
  const isDark = variant === "dark";

  return (
    <div
      className={`flex flex-col h-full rounded-2xl p-7 sm:p-8 transition-all duration-300 ${
        isDark
          ? "bg-white/[0.06] border border-white/10 hover:border-purple-400/30 hover:bg-white/[0.09]"
          : "bg-white border border-gray-100 shadow-sm hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
      }`}
    >
      <div className="flex items-start justify-between mb-5 gap-4">
        <Quote
          className={`w-8 h-8 flex-shrink-0 mt-0.5 ${isDark ? "text-purple-400/50" : "text-purple-200"}`}
          aria-hidden="true"
        />
        {logo && (
          <img
            src={logo}
            alt={review.company}
            className={`h-8 object-contain flex-shrink-0 ${isDark ? "brightness-0 invert opacity-60" : "opacity-70"}`}
          />
        )}
      </div>

      <div className="flex-grow mb-2">
        <p
          className={`text-sm sm:text-base leading-relaxed ${expanded ? "" : "line-clamp-6"} ${
            isDark ? "text-white/75 italic" : "text-gray-600 italic"
          }`}
        >
          "{review.quote}"
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`mt-2 mb-4 text-xs font-semibold underline underline-offset-2 cursor-pointer ${
            isDark ? "text-purple-300 hover:text-purple-100" : "text-purple-600 hover:text-purple-800"
          }`}
        >
          {expanded ? "Lees minder" : "Lees meer"}
        </button>
      </div>

      <div className={`pt-5 border-t ${isDark ? "border-white/10" : "border-gray-100"}`}>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ))}
        </div>
        <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
          {review.author}
        </p>
        <p className={`text-xs mt-0.5 ${isDark ? "text-white/50" : "text-gray-400"}`}>
          {review.role}
        </p>
        <div className={`flex items-center gap-1.5 mt-2 ${isDark ? "text-purple-300" : "text-purple-600"}`}>
          <Building2 className="w-3 h-3 flex-shrink-0" />
          <p className="text-xs font-semibold">{review.company}</p>
        </div>
        <p className={`text-[10px] mt-0.5 pl-4 ${isDark ? "text-white/35" : "text-gray-300"}`}>
          {review.companyType}
        </p>
      </div>
    </div>
  );
}
