/**
 * Homepage in design 3.0 (bron: mock-up index.html).
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import Shell from "@/design3/Shell";
import { Ic, Pijl, Woorden, initialen } from "@/design3/basis";
import { useCarrousel, useConfetti, useDekking, useReus, useStapelTop } from "@/design3/gedrag";
import { BeloningenBand, Faq, ReviewScore } from "@/design3/secties";
import { useLiveReviews } from "@/hooks/useLiveReviews";
import { useAnalytics } from "@/hooks/use-analytics";

const v = (o: Record<string, string>) => o as CSSProperties;

const LOGOS: [string, number, string][] = [
  ["/d3/logo-mercure.webp", 40, "Mercure"], ["/d3/Logo_Pulitzer_1773389329669.webp", 43, "Pulitzer"], ["/d3/Logo_FcUtrecht_1771267205959.webp", 66, "FC Utrecht"],
  ["/d3/Logo_funda_1771267205959.webp", 45, "Funda"], ["/d3/logo-hart.webp", 47, "H'ART Museum"], ["/d3/Logo_hetepeper_1771267205959.webp", 18, "Hete Peper"],
  ["/d3/Logo_Hilton_1771267205959.webp", 60, "Hilton"], ["/d3/Logo_Marriott_1771267205959.webp", 66, "Marriott"],
];

const KLANTEN = [
  { quote: "Wij werken samen met EXTRA sinds eind oktober 2025 voor de levering van kamermeisjes, AD-, turndown- en minibarmedewerkers aan Grand Hotel Amrâth Amsterdam. EXTRA heeft professionaliteit, betrouwbaarheid en een sterke toewijding aan kwaliteit getoond.", naam: "D. Koops", rol: "Hotelmanager, Grand Hotel Amrâth Amsterdam" },
  { quote: "Vanaf het begin hebben wij prettig en direct contact gehad met het team van EXTRA. Wij zijn zeer tevreden over de kwaliteit van de medewerkers die via Extra bij ons werken.", naam: "D. Sarda", rol: "Eventmanager, Westweelde" },
  { quote: "Vanuit het H'ART Museum werken wij met enige regelmaat met personeel van Extra omdat we weten dat we goed gekwalificeerd personeel krijgen dat altijd verzorgd en goed op tijd is.", naam: "T. Bakkenes", rol: "Hospitality Manager, H'ART Museum" },
];
const MEDEWERKERS = [
  { quote: "Ontzettend leuk uitzendbureau! Open en flexibel team, leuke klussen", naam: "Sophie Sybrandy", rol: "★★★★★ · Review van Google" },
  { quote: "Extra is nice platform for from entry level to become a pro at hospitality industry.", naam: "Oliur Rahman", rol: "★★★★★ · Review van Google" },
  { quote: "Geweldig uitzendbureau met goede en leerzame opdrachten. Werkt met mooie locaties waar altijd een fijne sfeer hangt en goed personeel rondloopt. De communicatie in het bedrijf zelf verloopt goed waardoor je zonder problemen en miscommunicaties aan het werk kan.", naam: "Nathalie Siegerma", rol: "★★★★★ · Review van Google" },
];

const FAQ: [string, string][] = [
  ["Voor welke branches levert EXTRA personeel?", "EXTRA is een uitzendbureau in Amsterdam voor hotels, events en logistiek. We leveren hotelpersoneel aan hotels, eventpersoneel aan eventlocaties, cateraars en restaurants, en logistiek personeel voor magazijnen. Iedereen werkt bij ons in loondienst."],
  ["Voor welke functies kan ik personeel inhuren?", "In hotels: housekeeping, front office, F&B, banqueting, chefs en afwassers. Bij events: bediening, barpersoneel, runners, hosts en event supervisors. In de logistiek: orderpickers, heftruck- en reachtruckchauffeurs, inpakkers, expeditie en magazijnmedewerkers. Heftruckchauffeurs plaatsen we alleen met een gecontroleerd, geldig certificaat."],
  ["Hoe snel kunnen jullie personeel leveren?", "Drukte ontstaat vaak onverwacht. Dankzij onze grote poule met ervaren medewerkers kunnen we in veel gevallen binnen 48 uur geschikte mensen voorstellen, voor een hotel, een event of je magazijn. Bij uitval kijken we direct wie er beschikbaar is."],
  ["Kunnen jullie opschalen bij piekdrukte?", "Ja. Of het nu gaat om een groot evenement, een volgeboekt hotelweekend of een seizoenspiek in je magazijn: we schalen snel op en weer af. Medewerkers die het bij jou goed doen, zetten we in je vaste poule."],
  ["Werken jullie ook in ploegendienst en in het weekend?", "Ja. Vroege, late en nachtdiensten zijn mogelijk, net als avonden en weekenden in de horeca en bij events. Toeslagen lopen volgens de inlenersbeloning van jouw cao."],
  ["Werken jullie met zzp'ers?", "Nee. Iedereen die via EXTRA werkt is in loondienst en EXTRA is NEN 4400-1 gecertificeerd. Loonheffing, cao-beloning en verzekeringen liggen bij ons. Zo loop je geen risico op schijnzelfstandigheid."],
  ["Wat kost personeel via een uitzendbureau?", "Je betaalt een all-in uurtarief dat afhangt van de functie en de ervaring. Daarin zitten loon, premies en verzekeringen, zonder verborgen kosten. Of het nu om horecapersoneel, eventpersoneel of logistiek personeel gaat: vraag een offerte aan voor jouw situatie."],
  ["Hoe kan ik personeel aanvragen bij EXTRA?", "Je kunt eenvoudig personeel aanvragen via het aanvraagformulier op onze website. Nadat we de aanvraag hebben ontvangen nemen we contact op om de wensen en planning te bespreken."],
];

/** De drie artikelen uit de mock-up; zolang de blog-API niets geeft (prerender) staan deze er. */
const VASTE_ARTIKELEN: Artikel[] = [
  { slug: "betrouwbaar-horeca-uitzendbureau-kiezen", cat: "Branche", titel: "Betrouwbaar horeca-uitzendbureau kiezen: dit verandert er", samenvatting: "Het hof noemde Temper een uitzendbureau en de Wtta maakt een toelating verplicht. Voor wie horecapersoneel inleent verschuift daarmee de vraag: niet alleen 'is er iemand beschikbaar', maar ook 'mag ik straks nog met deze partij werken'.", datum: "17 augustus 2026", lees: "9 min leestijd" },
  { slug: "zzp-inhuren-horeca", cat: "Branche", titel: "Zzp'ers inhuren in de horeca: dit verandert er in 2026", samenvatting: "Er komt géén minimumtarief van €36 voor zzp'ers. Dat misverstand houdt hardnekkig stand. Wat er wél komt is een rechtsvermoeden per 31 december 2026, en dat verschuift de bewijslast naar jou als opdrachtgever.", datum: "16 augustus 2026", lees: "8 min leestijd" },
  { slug: "housekeeping-personeel-inhuren", cat: "Housekeeping", titel: "Housekeeping personeel inhuren: uitzendbureau, schoonmaakbedrijf of eigen team?", samenvatting: "Zelf in dienst nemen, uitbesteden per kamer of inlenen per uur? De drie modellen naast elkaar op leiding, cao, kosten, opzegbaarheid en aansprakelijkheid. Met een checklist voor je leverancier.", datum: "13 augustus 2026", lees: "7 min leestijd", beeld: "/images/housekeeping-hotelkamer-amsterdam.webp", alt: "Opgemaakt hotelbed met verse linnengoed en een nachtkastje in een hotelkamer" },
];

interface Artikel { slug: string; cat: string; titel: string; samenvatting: string; datum: string; lees: string; beeld?: string | null; alt?: string | null }

/** Typografische omslagen uit de mock-up voor artikelen zonder foto. */
const OMSLAG: Record<string, { klasse: string; woord: string; sub: string; label: string }> = {
  "betrouwbaar-horeca-uitzendbureau-kiezen": { klasse: "bc-wtta", woord: "Wtta", sub: "1 januari 2027", label: "Keurmerkschild met vinkje, symbool voor een uitzendbureau dat onafhankelijk is gecontroleerd" },
  "zzp-inhuren-horeca": { klasse: "bc-zzp", woord: "€38", sub: "per uur", label: "Kalenderblad van 31 december 2026, de datum waarop het rechtsvermoeden op basis van uurtarief ingaat" },
};

function useArtikelen(): Artikel[] {
  const { data } = useQuery<{ posts: any[] }>({ queryKey: ["/api/blog"], staleTime: 60000 });
  const posts = data?.posts ?? [];
  if (!posts.length) return VASTE_ARTIKELEN;
  return posts.slice(0, 3).map((p) => ({
    slug: p.slug,
    cat: p.category || "Blog",
    titel: p.title,
    samenvatting: p.excerpt,
    datum: new Date(p.publishedAt || p.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
    lees: p.readTime ? `${String(p.readTime).replace(/\s*leestijd/i, "")} leestijd` : "",
    beeld: p.imageUrl,
    alt: p.imageAlt || "",
  }));
}

export default function Home() {
  const { trackPageView } = useAnalytics();
  useEffect(() => { trackPageView({ path: "/", variant: "a" }); }, [trackPageView]);

  const loon = useRef<HTMLElement>(null);
  const stapel = useRef<HTMLDivElement>(null);
  const confetti = useRef<HTMLDivElement>(null);
  const reus = useRef<HTMLHeadingElement>(null);
  const carrousel = useRef<HTMLDivElement>(null);
  const [hoeTab, setHoeTab] = useState<"wg" | "mw">("wg");
  const [groep, setGroep] = useState<"klanten" | "medewerkers">("klanten");
  const [wissel, setWissel] = useState(false);
  useStapelTop(loon);
  useDekking(stapel);
  useConfetti(confetti);
  useReus(reus, 0.72);
  useCarrousel(carrousel, [groep]);
  const artikelen = useArtikelen();
  const rev = useLiveReviews();
  const reviews = groep === "klanten" ? KLANTEN : MEDEWERKERS;

  const kiesGroep = (g: "klanten" | "medewerkers") => {
    if (g === groep) return;
    setWissel(true);
    window.setTimeout(() => {
      setGroep(g);
      carrousel.current?.querySelector(".spoor")?.scrollTo({ left: 0 });
      window.setTimeout(() => setWissel(false), 40);
    }, 220);
  };

  return (
    <Shell sector="algemeen" css={["blog"]} knopHref="/personeelsaanvraag">
      <div id="home">
      <section className="hero hh">
        <div className="hh-foto"><img src="/d3/strip-hospitality.webp" alt="" {...({ fetchpriority: "high" } as any)} /></div>
        <div className="hh-merk" aria-hidden="true"></div>
        <div className="w hh-kop">
          <span className="chip"><i></i>800+ medewerkers actief</span>
          <h1 className="hh-h1">Het uitzendbureau <span className="serif">dat werkt</span></h1>
        </div>
        <div className="w hh-kies">
          <p className="kies-label"><span>Kies je branche</span></p>
          <nav className="kiesbollen" aria-label="Kies je branche">
            <a className="kies" href="/hotels" style={v({ "--kleur": "var(--rose)" })}><small>Werk in</small><b>hotels</b><Ic n="pijl" /></a>
            <a className="kies" href="/logistiek" style={v({ "--kleur": "var(--pistachio)" })}><small>Werk in de</small><b>logistiek</b><Ic n="pijl" /></a>
            <a className="kies" href="/evenementen" style={v({ "--kleur": "var(--sky)" })}><small>Werk in de</small><b>events</b><Ic n="pijl" /></a>
          </nav>
        </div>
        <div className="w"><dl className="hh-stats">
          <div><dt>Actieve medewerkers</dt><dd>800+</dd></div>
          <div><dt>Tevreden opdrachtgevers</dt><dd>90+</dd></div>
          <div><dt>Punten verdiend</dt><dd>500k+</dd></div>
          <div><dt>{rev.aantalTekst}</dt><dd>{rev.scoreTekst}/5</dd></div>
        </dl></div>
      </section>

      <section className="zoek">
        <div className="w"><h2 className="groot">Wat zoek <span className="serif">jij?</span></h2><p className="lead zacht" style={{ textAlign: "center", margin: "-44px auto 64px" }}>Zoek je EXTRA personeel of zoek je een EXTRA baan?</p></div>
        <div className="takken">
          <Tak kleur="var(--rose)" foto="/d3/strip-hotelstaf.webp" pos="30% 30%" label={["Hospitality", "experts"]} kop="Hotels" tekst="Van housekeeping tot banqueting, van front office tot F&B."
            k1={["Ik zoek hotelpersoneel", "/hotels"]} k2={["Ik zoek werk in hotels", "/horeca-vacatures-amsterdam"]} />
          <Tak kleur="var(--pistachio)" foto="/d3/strip-logistiek.webp" pos="50% 25%" label={["Logistic", "professionals"]} kop="Logistiek" tekst="Van orderpicken tot heftruck."
            k1={["Ik zoek logistiek personeel", "/logistiek"]} k2={["Ik zoek werk in de logistiek", "/logistiek-werk"]} />
          <Tak kleur="var(--sky)" foto="/d3/strip-event.webp" pos="50% 20%" label={["Event", "manpower"]} kop="Events" tekst="Bediening, bar, catering, hosts en logistiek."
            k1={["Ik zoek eventpersoneel", "/evenementen"]} k2={["Ik zoek werk bij events", "/events-werk"]} />
        </div>
        <div className="logos"><div className="w">
          <div className="logoband"><div className="logorij">
            {[0, 1].map((n) => (
              <div className="set" key={n} aria-hidden={n === 1 || undefined}>
                {[...LOGOS, ...LOGOS].map(([src, h, alt], i) => <img key={i} src={src} style={{ height: `${h}px` }} alt={n === 0 && i < LOGOS.length ? alt : ""} loading="lazy" />)}
              </div>
            ))}
          </div></div>
        </div></div>
      </section>

      <div className="stapel" ref={stapel}>
        <section className="donker loon" ref={loon}>
          <div className="w loon-grid">
            <div className="loon-tekst">
              <span className="eyebrow">EXTRAATJE</span>
              <h2 className="mega loon-h2">Werken <span className="b2"><span className="serif">wordt</span> beloond</span></h2>
              <p className="lead">Medewerkers verdienen automatisch punten voor elke gewerkte shift en behaalde challenge. Die punten wissel je in voor echte beloningen.</p>
              <a className="knop vol" href="/extraatje" style={{ marginTop: "30px" }}>Lees meer over EXTRAATJE <Pijl /></a>
              <div className="loon-merkt"><h3>Wat jij als opdrachtgever merkt</h3><ul className="lijst">
                <li><Ic n="vink" />Meer opkomst, minder last-minute uitval</li>
                <li><Ic n="vink" />Mensen komen graag terug, dus een stabielere poule</li>
                <li><Ic n="vink" />Gemotiveerde medewerkers die een stapje extra doen</li>
              </ul></div>
            </div>
            <div className="loon-podium">
              <span className="lp-badge lb1" aria-hidden="true"><i>&#9733;</i><span><small>Beloning</small>Pathé Bon · 2.500 ptn</span></span>
              <span className="lp-badge lb2" aria-hidden="true"><i>3</i><span><small>Op tijd-reeks</small>diensten op rij</span></span>
              <div className="tel"><div className="tel-scherm"><img src="/d3/app-extraatje.webp" alt="EXTRAATJE in de EXTRA-app: puntensaldo, status en op tijd-reeks" loading="lazy" /><span className="eiland"></span></div></div>
            </div>
          </div>
          <BeloningenBand />
        </section>
        <div className="stapel-pauze" aria-hidden="true"></div>
        <section className="dag" aria-labelledby="dag-kop">
          <div className="w dag-grid">
            <div className="dag-tekst">
              <span className="eyebrow">Dagbetaling</span>
              <h2 className="mega dag-h2" id="dag-kop">Krijg de <span className="d2"><span className="serif">volgende dag</span></span> <span className="d3r">betaald</span></h2>
              <p className="lead zacht">Geen einde-van-de-maand wachten. Na elke gewerkte shift zie je direct wat je hebt verdiend en staat jouw voorschot klaar in Jixbee.</p>
              <ol className="dag-stappen">
                <li><b>Je hebt gewerkt</b><span>Na je shift registreer je je uren via de EXTRA-app.</span></li>
                <li><b>Wij keuren je uren goed</b><span>Ons team controleert je uren zorgvuldig en keurt ze snel goed.</span></li>
                <li><b>Voorschot in Jixbee</b><span>Nadat EXTRA je uren heeft goedgekeurd, wordt het geld voor je klaargezet in de Jixbee-app.</span></li>
              </ol>
              <div className="knoppen" style={{ marginTop: "34px" }}><a className="knop vol" href="/aanmelden">Meld je aan in 2 minuten <Pijl /></a><a className="knop lijn" href="/dagbetaling">Hoe werkt dagbetaling <Pijl /></a></div>
            </div>
            <div className="dag-beeld">
              <div className="confetti" aria-hidden="true" ref={confetti}></div>
              <figure className="dag-bon" aria-hidden="true"><span className="db-label"><i></i>Voorschot klaar in Jixbee</span><img src="/d3/jix-bon.webp" alt="" loading="lazy" /></figure>
              <img className="dag-tel" src="/d3/jix-transactie.webp" alt="Jixbee: je transactie wordt verwerkt" loading="lazy" />
            </div>
          </div>
        </section>
      </div>

      <section className="hoe"><div className="w">
        <div className="kop"><div><span className="eyebrow">Simpel &amp; snel</span><h2 className="groot" style={{ marginTop: "22px" }}>Hoe EXTRA <span className="serif">werkt</span></h2></div>
          <div className="toggle" role="tablist" aria-label="Hoe EXTRA werkt voor">
            <button type="button" role="tab" id="tab-wg" aria-controls="stappen-wg" aria-selected={hoeTab === "wg"} className={hoeTab === "wg" ? "aan" : undefined} onClick={() => setHoeTab("wg")}>Voor werkgevers</button>
            <button type="button" role="tab" id="tab-mw" aria-controls="stappen-mw" aria-selected={hoeTab === "mw"} className={hoeTab === "mw" ? "aan" : undefined} onClick={() => setHoeTab("mw")}>Voor medewerkers</button>
          </div></div>
        <div className={`stappen${hoeTab === "wg" ? " wissel" : ""}`} id="stappen-wg" role="tabpanel" aria-labelledby="tab-wg" hidden={hoeTab !== "wg"}>
          <Stap i={1} kop="Neem contact op" tekst="Bel ons of stuur je aanvraag in." />
          <Stap i={2} kop="Kennismaking & behoefte" tekst="We bespreken je vraag en pijnpunten." />
          <Stap i={3} kop="Selectie & inzet" tekst="Wij selecteren en plannen passend personeel." />
          <Stap i={4} kop="Evaluatie & vaste pool" tekst="We verwerken feedback en bouwen je favorietenpoule op." knop={["Lees hoe EXTRA werkt", "/onze-werkwijze"]} />
        </div>
        <div className={`stappen${hoeTab === "mw" ? " wissel" : ""}`} id="stappen-mw" role="tabpanel" aria-labelledby="tab-mw" hidden={hoeTab !== "mw"}>
          <Stap i={1} kop="Solliciteer bij EXTRA" tekst="Meld je aan via het formulier." />
          <Stap i={2} kop="Kennismaking" tekst="We bespreken je ervaring en voorkeuren." />
          <Stap i={3} kop="Planning & werk" tekst="Pak diensten op die bij je passen." />
          <Stap i={4} kop="Beloningen & betaling" tekst="Verdien EXTRAATjes en krijg snel betaald." knop={["Meld je aan", "/aanmelden"]} />
        </div>
      </div></section>

      <section className="donker reviews"><div className="w">
        <div><span className="eyebrow">Ervaringen</span><h2 className="groot" style={{ marginTop: "22px" }}>Wat anderen <span className="serif">zeggen</span></h2>
          <ReviewScore />
          <div className="toggle rv-toggle" role="tablist" aria-label="Reviews van" style={{ marginTop: "28px" }}>
            <button type="button" role="tab" aria-selected={groep === "medewerkers"} className={groep === "medewerkers" ? "aan" : undefined} onClick={() => kiesGroep("medewerkers")}>Medewerkers</button>
            <button type="button" role="tab" aria-selected={groep === "klanten"} className={groep === "klanten" ? "aan" : undefined} onClick={() => kiesGroep("klanten")}>Klanten</button>
          </div>
        </div>
        <div style={{ paddingTop: "20px" }}>
          <div className={`carrousel${wissel ? " wissel" : ""}`} aria-roledescription="carrousel" ref={carrousel}>
            <div className="spoor" tabIndex={0}>
              {reviews.map((r, i) => (
                <figure className="slide" aria-label={`Review ${i + 1} van ${reviews.length}`} key={groep + i}>
                  <blockquote className="quote" style={v({ "--n": String(r.quote.split(/\s+/).length) })}><Woorden tekst={r.quote} /></blockquote>
                  <figcaption className="wie"><span className="avatar">{initialen(r.naam)}</span><div><b>{r.naam}</b><span>{r.rol}</span></div></figcaption>
                </figure>
              ))}
            </div>
            <div className="bedien"><button className="pijl vorige" type="button" aria-label="Vorige review"><Ic n="pijl" /></button><span className="teller"><b>1</b> / {reviews.length}</span><button className="pijl volgende" type="button" aria-label="Volgende review"><Ic n="pijl" /></button><span className="stippen"></span></div>
          </div>
        </div>
      </div></section>

      <section className="waarom" style={{ paddingTop: "110px" }}><div className="w">
        <div className="kop"><div><span className="eyebrow">Wetgeving-proof</span><h2 className="groot" style={{ marginTop: "22px" }}>Waarom <span className="serif">EXTRA</span></h2></div><p className="lead zacht">Klaar voor de nieuwe arbeidswetgeving van 2026. Zekerheid voor jou en je personeel.</p></div>
        <div className="rijen">
          <div className="rijpunt"><Ic n="schild" /><h3>Iedereen in loondienst</h3><p className="zacht">Geen zzp-constructies. Duidelijke afspraken.</p></div>
          <div className="rijpunt"><Ic n="oog" /><h3>Geselecteerd &amp; beoordeeld</h3><p className="zacht">Na elke opdracht feedback. Kwaliteit blijft omhoog.</p></div>
          <div className="rijpunt"><Ic n="snel" /><h3>Snel &amp; flexibel inzetbaar</h3><p className="zacht">Opschalen bij piekdrukte. Of een snelle fix last-minute.</p></div>
          <div className="rijpunt"><Ic n="hand" /><h3>Heldere afspraken</h3><p className="zacht">Je weet waar je aan toe bent. Korte lijnen.</p></div>
        </div>
        <span className="check"><Ic n="schild" />Volledig compliant met arbeidswetgeving 2026</span>
      </div></section>

      <section className="donker diensten"><div className="w">
        <div className="dkop"><div><span className="eyebrow">Onze diensten</span>
          <h2 className="groot" style={{ marginTop: "22px", fontSize: "clamp(46px,5.6vw,92px)" }}>Welke <span className="rose">EXTRA's</span> heb je <span className="serif">nodig?</span></h2></div>
          <p className="lead">Kies het team dat bij jou past, van keuken tot magazijn, altijd representatief en in loondienst.</p></div>
        <div className="dlijst">
          <Dienst naam="Chef" sub="Direct inzetbaar voor jouw keuken." kop="Ervaren chefs" punten={["Geselecteerd op ervaring & representativiteit", "Binnen 24 uur geleverd"]} knop={["Chef aanvragen", "/hotelpersoneel-inhuren#aanvragen"]} />
          <Dienst open naam="Horeca" sub="Bediening, bar & hospitality op topniveau." kop="Horecamedewerkers" punten={["Representatief & servicegericht", "Flexibel inzetbaar per dienst"]} knop={["Horeca aanvragen", "/personeelsaanvraag"]} />
          <Dienst naam="Front-office" sub="Dé eerste indruk van jouw hotel of locatie." kop="Front-office" punten={["Meertalig & representatief", "Ervaring met hotelprocessen"]} knop={["Front-office aanvragen", "/hotelpersoneel-inhuren#aanvragen"]} />
          <Dienst naam="Housekeeping" sub="Kamers & ruimtes onberispelijk schoon." kop="Housekeeping" punten={["Getraind op hotelstandaarden", "Direct beschikbaar, ook last-minute"]} knop={["Housekeeping aanvragen", "/hotelpersoneel-inhuren#aanvragen"]} />
          <Dienst naam="Logistiek" sub="Van orderpicken tot heftruck, in elk magazijn." kop="Logistiek personeel" punten={["Heftruckcertificaten gecontroleerd", "Meestal binnen 48 uur inzetbaar"]} knop={["Logistiek aanvragen", "/logistiek-personeel-inhuren"]} />
        </div>
      </div></section>

      <div style={{ paddingTop: "110px" }} aria-hidden="true"><div className="uitsnede"></div></div>

      <Faq s={{ type: "faq", eyebrow: "FAQ", h2: "Veelgestelde [[vragen]]", items: FAQ }} />

      <section style={{ paddingTop: "0" }}><div className="w">
        <div className="nieuws-kop"><div><span className="eyebrow">Nieuws &amp; blogs</span><h2 className="groot" style={{ marginTop: "22px" }}>Laatste nieuws uit de <span className="serif">branche</span></h2><p className="lead zacht" style={{ marginTop: "22px" }}>Wetgeving, keuzes en praktijk voor hotels, eventlocaties en horeca.</p></div><a className="knop lijn" href="/blog">Alle blogs <Pijl /></a></div>
        <div className="nieuws drie">
          {artikelen.map((a) => <ArtikelKaart a={a} key={a.slug} />)}
        </div>
      </div></section>

      <section className="slot2">
        <div className="foto"><img src="/d3/closeup.webp" alt="" loading="lazy" /></div>
        <img className="tag" src="/d3/logo-tag-w.svg" alt="EXTRA, het uitzendbureau dat werkt" />
        <h2 className="reus" ref={reus}><span className="l1">Klaar</span> <span className="l2">om samen te</span> <span className="l3">werken?</span></h2>
        <p className="intro">Of je nu extra personeel zoekt of extra werk: we regelen het snel en duidelijk.</p>
        <div className="acties"><div className="knoppen op-foto"><a className="knop vol" href="/personeelsaanvraag">Vraag extra personeel aan <Pijl /></a><a className="knop lijn" href="/vacatures">Ik zoek extra werk <Pijl /></a></div></div>
      </section>
      </div>
    </Shell>
  );
}

function Tak({ kleur, foto, pos, label, kop, tekst, k1, k2 }: { kleur: string; foto: string; pos: string; label: [string, string]; kop: string; tekst: string; k1: [string, string]; k2: [string, string] }) {
  return (
    <article className="tak" style={v({ "--kleur": kleur })}>
      <img src={foto} alt="" style={{ objectPosition: pos }} loading="lazy" />
      <span className="taklabel" aria-hidden="true"><b>{label[0]}</b><small>{label[1]}</small></span>
      <div className="takinhoud">
        <h3>{kop}</h3>
        <p>{tekst}</p>
        <div className="takknoppen">
          <a className="knop takvol" href={k1[1]}>{k1[0]} <Pijl /></a>
          <a className="knop taklijn" href={k2[1]}>{k2[0]} <Pijl /></a>
        </div>
      </div>
    </article>
  );
}

function Stap({ i, kop, tekst, knop }: { i: number; kop: string; tekst: string; knop?: [string, string] }) {
  return (
    <div className="stap">
      <span className="nr" aria-hidden="true">{String(i).padStart(2, "0")}</span><small>Stap {i}</small><h3>{kop}</h3><p className="zacht">{tekst}</p>
      {knop && <a className="knop vol" href={knop[1]} style={{ marginTop: "28px" }}>{knop[0]} <Pijl /></a>}
    </div>
  );
}

function Dienst({ naam, sub, kop, punten, knop, open = false }: { naam: string; sub: string; kop: string; punten: string[]; knop: [string, string]; open?: boolean }) {
  return (
    <details className="dienst" name="diensten" open={open}>
      <summary><span className="naam">{naam}</span><span className="sub">{sub}</span><i aria-hidden="true"></i></summary>
      <div className="inhoud">
        <div><h3>{kop}</h3><p>{sub}</p></div>
        <ul className="lijst">{punten.map((p) => <li key={p}><Ic n="vink" />{p}</li>)}</ul>
        <a className="knop vol" href={knop[1]}>{knop[0]} <Pijl /></a>
      </div>
    </details>
  );
}

function ArtikelKaart({ a }: { a: Artikel }) {
  const o = OMSLAG[a.slug];
  const catKleur = a.cat === "Housekeeping" ? "c-rose" : "c-sky";
  return (
    <a className="artikel" href={`/blog/${a.slug}`} data-cat={a.cat}>
      {o ? (
        <div className={`img bcover ${o.klasse}`} role="img" aria-label={o.label}>
          <span className="bc-letters" aria-hidden="true"></span>
          <span className="bc-woord" aria-hidden="true"><b>{o.woord}</b><span className="serif">{o.sub}</span></span>
          <span className={`cat ${catKleur}`}>{a.cat}</span>
        </div>
      ) : (
        <div className="img bcover bc-foto">
          {a.beeld && <img src={a.beeld} alt={a.alt ?? ""} loading="lazy" />}
          <span className={`cat ${catKleur}`}>{a.cat}</span>
        </div>
      )}
      <h3>{a.titel}</h3>
      <p className="zacht">{a.samenvatting}</p>
      <span className="b-meta"><time>{a.datum}</time>{a.lees && <span>{a.lees}</span>}</span>
    </a>
  );
}
