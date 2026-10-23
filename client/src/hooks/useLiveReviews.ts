/**
 * Score, aantal en medewerkerreviews van Google, via /api/reviews.
 *
 * Geeft direct de vaste stand uit shared/reviews.ts terug en vervangt die zodra
 * het antwoord binnen is. Daardoor zien bezoekers en de prerender nooit een
 * leeg veld, ook niet als de server of Google even niet reageert.
 */
import { useQuery } from "@tanstack/react-query";
import { REVIEW_AANTAL, REVIEW_SCORE } from "@shared/reviews";
import { scoreTekst, type PubliekeReview } from "@shared/googleReviews";

interface Antwoord {
  score: number;
  aantal: number;
  bron: "google" | "vast";
  medewerkers: PubliekeReview[];
}

export function useLiveReviews(taal: "nl" | "en" = "nl") {
  const { data } = useQuery<Antwoord>({
    queryKey: ["/api/reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const score = typeof data?.score === "number" ? data.score : REVIEW_SCORE;
  const aantal = typeof data?.aantal === "number" ? data.aantal : REVIEW_AANTAL;
  return {
    score,
    aantal,
    scoreTekst: scoreTekst(score, taal),
    aantalTekst: `${aantal} Google reviews`,
    bron: data?.bron ?? "vast",
    medewerkers: Array.isArray(data?.medewerkers) ? data!.medewerkers : [],
  };
}
