/**
 * De drie bedrijvenpagina's in design 3.0 (bron: mock-ups hotels-, events- en
 * logistiek-bedrijven.html). De inhoud staat in design3/content/bedrijven.ts.
 */
import Shell, { type CssSet } from "@/design3/Shell";
import { Secties, type PaginaContent } from "@/design3/secties";
import { events, hotels, logistiek } from "@/design3/content/bedrijven";

function Bedrijvenpagina({ content, css }: { content: PaginaContent; css: CssSet[] }) {
  return (
    <Shell sector={content.sector} css={css} knopHref="#aanvragen">
      <Secties content={content} />
    </Shell>
  );
}

export function HotelsBedrijven() {
  return <Bedrijvenpagina content={hotels} css={["events", "hotels", "werk", "bedrijf"]} />;
}

export function EventsBedrijven() {
  return <Bedrijvenpagina content={events} css={["events", "hotels", "logistiek", "eventsland", "werk", "bedrijf"]} />;
}

export function LogistiekBedrijven() {
  return <Bedrijvenpagina content={logistiek} css={["events", "hotels", "logistiek", "werk", "bedrijf"]} />;
}
