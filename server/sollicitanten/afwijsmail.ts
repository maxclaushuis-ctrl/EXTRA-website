/**
 * Afwijsmail van Sollicitanten (D10), in de huisstijl van shared/mailOpmaak.ts
 * (bord H3, mail 2). De tekst per reden staat in shared/sollicitantRegels.ts.
 *
 * Uitzetten: SOLLICITANTEN_AFWIJSMAIL=0. Afwijzen werkt dan gewoon, zonder mail.
 * In de testomgeving staat de mail in testmodus en komt hij in het mailvenster.
 */
import { sendEmail } from "../mail";
import { AFZENDER } from "@shared/aanvraagMails";
import { mailOpmaak, brancheVanFunctie, escapeHtml, alinea, afsluiting } from "@shared/mailOpmaak";
import { afwijsmail } from "@shared/sollicitantRegels";

export function afwijsmailAan(): boolean {
  return process.env.SOLLICITANTEN_AFWIJSMAIL !== "0";
}

export function maakAfwijsmail(o: { voornaam: string; functie: string; reden: string; naGesprek: boolean; metJob?: boolean; eigenTekst?: string }) {
  const m = afwijsmail(o.reden, o.voornaam, { naGesprek: o.naGesprek, metJob: o.metJob, eigenTekst: o.eigenTekst });
  const html = mailOpmaak({
    branche: brancheVanFunctie(o.functie),
    taal: "nl",
    titel: m.onderwerp,
    voorkop: "Je aanmelding",
    kop: escapeHtml(m.aanhef),
    preheader: m.alineas[1].slice(0, 110),
    inhoud: [...m.alineas.map((a) => alinea(escapeHtml(a))), afsluiting("nl", { groet: "Groet," })].join(""),
    voetExtra: "Lees in onze privacyverklaring hoe lang we je gegevens bewaren: doehetextra.nl/privacybeleid",
  });
  const tekst = `${m.aanhef}\n\n${m.alineas.join("\n\n")}\n\nGroet,\nTeam EXTRA`;
  return { onderwerp: m.onderwerp, html, tekst };
}

export async function stuurAfwijsmail(o: { email: string; voornaam: string; functie: string; reden: string; naGesprek: boolean; metJob?: boolean; eigenTekst?: string }): Promise<boolean> {
  const m = maakAfwijsmail(o);
  return sendEmail({ to: o.email, from: AFZENDER, subject: m.onderwerp, html: m.html, text: m.tekst });
}
