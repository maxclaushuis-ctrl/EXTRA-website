/**
 * Getekende blogomslagen (akkoord Max 24-11-2026, mock-up mockup-blogomslagen.html).
 * Voor artikelen waarvan de foto te veel op AI-beeld leek. Zelfde stijl als de
 * typografische omslagen (Wtta, €38): effen kleur, het EXTRA-logo flauw op de
 * achtergrond, één beeld dat het onderwerp vertelt. In SVG getekend, dus geen
 * download en op elk scherm scherp. De foto in de database blijft staan (die
 * gebruiken de deelvoorbeelden op sociale media nog).
 *
 * Gebruikt door de blogkaarten op de homepage (pages/d3/Home.tsx) en op /blog
 * (pages/d3/Blog.tsx). Opmaak in d3-extra.css (.bc-piek, .bc-kok, .bc-kosten).
 */
import type { ReactNode } from "react";

export interface GetekendeOmslag {
  klasse: string;
  label: string;
  beeld: () => ReactNode;
}

const SERIF = { fontFamily: '"Schreef", serif', fontStyle: "italic", fontWeight: 600 } as const;

function Bon({ x, y, rot, tafel, tijd, regels, h }: { x: number; y: number; rot: number; tafel: string; tijd: string; regels: number[]; h: number }) {
  return (
    <g transform={`rotate(${rot} ${x + 41} ${y})`}>
      <rect x={x} y={y} width="82" height={h} rx="3" fill="#F8F7F4" />
      <rect x={x} y={y} width="82" height="9" fill="#e6e3dc" />
      <text x={x + 12} y={y + 26} fontWeight="800" fontSize="13" fill="#37352C" letterSpacing="0">{tafel}</text>
      <text x={x + 70} y={y + 26} fontWeight="600" fontSize="10" fill="#5F5D54" textAnchor="end" letterSpacing="0">{tijd}</text>
      {regels.map((w, i) => <rect key={i} x={x + 12} y={y + 44 + i * 13} width={w} height="4" rx="2" fill="#37352C" opacity=".28" />)}
    </g>
  );
}

function Piek() {
  return (
    <svg className="bc-teken" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g transform="translate(0 26)">
        <rect x="18" y="44" width="364" height="10" rx="5" fill="#8a877d" />
        <rect x="18" y="44" width="364" height="4" rx="2" fill="#b3b0a6" />
        <Bon x={34} y={52} rot={-2} tafel="T4" tijd="19:02" regels={[52, 40, 58, 30]} h={116} />
        <Bon x={124} y={52} rot={1.5} tafel="T12" tijd="19:04" regels={[46, 58, 36]} h={100} />
        <Bon x={214} y={52} rot={-1} tafel="T7" tijd="19:05" regels={[58, 44, 50, 38, 26]} h={128} />
        <Bon x={304} y={52} rot={2} tafel="T2" tijd="19:07" regels={[40, 52]} h={86} />
      </g>
      <text x="34" y="268" fontWeight="800" fontSize="58" letterSpacing="-4" fill="#F8F7F4">Piek</text>
      <text x="176" y="268" fontSize="30" fill="#CEDBBC" letterSpacing="0" style={SERIF}>opvangen</text>
    </svg>
  );
}

const NIVEAUS = ["Commis", "Demi chef", "Chef de partie", "Sous-chef"];
function Kok() {
  return (
    <svg className="bc-teken" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {NIVEAUS.map((n, i) => {
        const top = i === NIVEAUS.length - 1;
        return (
          <g key={n}>
            <rect x="40" y={218 - i * 44} width={150 + i * 52} height="34" rx="17" fill={top ? "#37352C" : "#F8F7F4"} />
            <text x="58" y={240 - i * 44} fontWeight="700" fontSize="15" fill={top ? "#F8F7F4" : "#37352C"} letterSpacing="0">{n}</text>
          </g>
        );
      })}
      <text x="362" y="78" fontSize="34" fill="#37352C" textAnchor="end" letterSpacing="0" style={SERIF}>welke kok?</text>
    </svg>
  );
}

function Kosten() {
  return (
    <svg className="bc-teken" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <text x="200" y="104" fontWeight="650" fontSize="17" fill="#37352C" textAnchor="middle" letterSpacing="1.5">VANAF</text>
      <text x="200" y="196" fontWeight="800" fontSize="104" letterSpacing="-7" fill="#37352C" textAnchor="middle">€30</text>
      <text x="200" y="236" fontSize="28" fill="#37352C" textAnchor="middle" letterSpacing="0" style={SERIF}>per uur, excl. btw</text>
    </svg>
  );
}

export const GETEKEND: Record<string, GetekendeOmslag> = {
  "restaurant-opschalen-piekdrukte": { klasse: "bc-piek", label: "Bonnenrail met bestelbonnen tijdens een drukke avondservice", beeld: Piek },
  "kok-inhuren": { klasse: "bc-kok", label: "Trap met de vier niveaus in de keuken, van commis tot sous-chef", beeld: Kok },
  "kosten-horecapersoneel-inhuren": { klasse: "bc-kosten", label: "Uurtarief vanaf 30 euro per uur, exclusief btw", beeld: Kosten },
};

/** De omslag zelf, met het categorielabel erin zoals bij de andere omslagen. */
export function Getekend({ g, cat, extra = "" }: { g: GetekendeOmslag; cat: ReactNode; extra?: string }) {
  return (
    <div className={`img bcover ${g.klasse}${extra}`} role="img" aria-label={g.label}>
      {g.beeld()}
      <span className="bc-letters" aria-hidden="true" />
      {cat}
    </div>
  );
}
