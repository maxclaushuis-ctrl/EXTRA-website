/**
 * Bedankpagina na aanmeldformulier 3 (bord B): /aanmelden/ontvangen en
 * /en/apply/received. Gegevens komen uit sessionStorage; het token van Job
 * staat nooit in de URL van deze pagina. Er gaat vanaf hier geen mail uit.
 */
import { useMemo } from "react";
import { useLocation } from "wouter";
import Shell from "@/design3/Shell";
import { taalVanPad } from "@shared/taal";

interface Ontvangen { voornaam?: string; functie?: string; kanaal?: string | null; jobLink?: string | null; waNummer?: string | null }

const T = {
  nl: {
    gelukt: "Gelukt", job: "Job stuurt je nu een bericht.", terugval: "We nemen snel contact met je op.",
    binnen: (f: string) => `Je aanmelding voor ${f} is binnen.`, openWa: "Open WhatsApp", werktNiet: "WhatsApp werkt niet? Open Job hier", openJob: "Praat met Job",
    stappen: [["Aanmelden", "Klaar"], ["Vragen van Job", "Nu, via WhatsApp. Ongeveer vijf minuten."], ["Kennismaken op kantoor", "Je kiest zelf een moment"], ["Aan de slag", "Contract, de app en je eerste dienst"]],
    webStap: "Nu, in het gesprek met Job. Ongeveer vijf minuten.", collega: "Een collega van EXTRA neemt contact met je op.",
  },
  en: {
    gelukt: "Done", job: "Job is sending you a message now.", terugval: "We'll be in touch soon.",
    binnen: (f: string) => `Your application for ${f} is in.`, openWa: "Open WhatsApp", werktNiet: "WhatsApp not working? Open Job here", openJob: "Talk to Job",
    stappen: [["Apply", "Done"], ["Questions from Job", "Now, on WhatsApp. About five minutes."], ["Meet us at the office", "You choose a time"], ["Start working", "Contract, the app and your first shift"]],
    webStap: "Now, in the chat with Job. About five minutes.", collega: "A colleague from EXTRA will contact you.",
  },
};

export default function AanmeldenOntvangen() {
  const [pad] = useLocation();
  const taal = taalVanPad(pad) === "en" ? "en" : "nl";
  const t = T[taal];
  const o = useMemo<Ontvangen>(() => {
    try { return JSON.parse(sessionStorage.getItem("extra-aanmelding-ontvangen") || "{}") || {}; } catch { return {}; }
  }, []);
  const metJob = !!o.jobLink;
  const viaWa = metJob && o.kanaal === "whatsapp";
  const waLink = viaWa && o.waNummer ? `https://wa.me/${o.waNummer.replace(/\D/g, "")}` : null;
  const stappen = t.stappen.map(([a, b], i) => [a, i === 1 ? (!metJob ? t.collega : viaWa ? b : t.webStap) : b]);

  return (
    <Shell css={["werk", "pagina"]} werkzoekende telKnop>
      <style>{CSS}</style>
      <section className="ao">
        <div className="ao-kolom">
          <h1>{t.gelukt}{o.voornaam ? `, ${o.voornaam}` : ""}!<br /><em>{metJob ? t.job : t.terugval}</em></h1>
          {o.functie && <p className="ao-sub">{t.binnen(o.functie.toLowerCase())}</p>}
          {waLink && <a className="ao-wa" href={waLink}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" /></svg>{t.openWa}</a>}
          {metJob && !waLink && <a className="ao-wa" href={o.jobLink!}>{t.openJob}</a>}
          <ol className="ao-stappen">
            {stappen.map(([a, b], i) => (
              <li key={a} className={i === 0 ? "klaar" : i === 1 ? "nu" : ""}>
                <b aria-hidden="true">{i === 0 ? "✓" : i + 1}</b>
                <span><strong>{a}</strong>{b}</span>
              </li>
            ))}
          </ol>
          {waLink && o.jobLink && <a className="ao-alt" href={o.jobLink}>{t.werktNiet}</a>}
        </div>
      </section>
    </Shell>
  );
}

const CSS = `
.d3.d3 .ao{padding:132px 16px 72px;color:#37352C;background:#37352C;box-shadow:0 0 0 100vmax #37352C;clip-path:inset(0 -100vmax)}
.d3.d3 .ao *{box-sizing:border-box}
.d3.d3 .ao-kolom{max-width:480px;margin:0 auto;background:#fff;border-radius:22px;padding:28px 22px 24px}
.d3.d3 .ao h1{font-size:32px;font-weight:800;line-height:1.15;margin:0 0 10px;letter-spacing:-.01em;color:#37352C}
.d3.d3 .ao h1 em{font-family:Fraunces,Georgia,serif;font-style:italic;font-weight:400}
.d3.d3 .ao-sub{font-size:15px;color:#5C594F;margin:0 0 20px}
.d3.d3 .ao-wa{display:flex;align-items:center;justify-content:center;gap:10px;height:56px;border-radius:14px;background:#2E7D4F;color:#fff;font-weight:800;font-size:16px;text-decoration:none;margin:0 0 18px}
.d3.d3 .ao-wa:visited,.d3.d3 .ao-wa:hover{color:#fff}
.d3.d3 .ao-stappen{list-style:none;margin:0 0 18px;padding:16px;border:1px solid #E4E0D8;border-radius:16px;background:#fff;display:grid;gap:14px}
.d3.d3 .ao-stappen li{display:flex;gap:12px;align-items:flex-start;color:#8A8478;margin:0}
.d3.d3 .ao-stappen b{flex:none;width:28px;height:28px;border-radius:50%;border:1.5px solid #C9C3B8;display:inline-flex;align-items:center;justify-content:center;font-size:13px;color:#8A8478}
.d3.d3 .ao-stappen li.klaar b{background:#3F6A2A;border-color:#3F6A2A;color:#fff}
.d3.d3 .ao-stappen li.nu b{background:#37352C;border-color:#37352C;color:#fff}
.d3.d3 .ao-stappen li.klaar,.d3.d3 .ao-stappen li.nu{color:#5C594F}
.d3.d3 .ao-stappen span{display:flex;flex-direction:column;font-size:13.5px}
.d3.d3 .ao-stappen strong{color:#37352C;font-size:15px}
.d3.d3 .ao-stappen li:not(.klaar):not(.nu) strong{color:#8A8478}
.d3.d3 .ao-alt{display:flex;align-items:center;justify-content:center;height:48px;border-radius:14px;border:1.5px solid #37352C;color:#37352C;font-weight:700;text-decoration:none}
.d3.d3 .ao a:focus-visible{outline:2px solid #37352C;outline-offset:2px}
`;
