/**
 * Mails van Job, in de huisstijl van shared/mailOpmaak.ts. Bron: bord B2.
 *
 *  - Startmail: alleen als Job via het webgesprek praat (geen WhatsApp).
 *  - Herinneringsmail: 22 uur na de laatste activiteit, met afmeldlink.
 *  - Bevestigingsmail: na het boeken van de kennismaking.
 *  - Cv-mail: als de kandidaat het cv nog niet bij de hand heeft.
 *
 * In de testomgeving staat de mail in testmodus en komen deze mails in het
 * mailvenster terecht, niet in een mailbox.
 */
import { sendEmail } from "../mail";
import { AFZENDER } from "@shared/aanvraagMails";
import { mailOpmaak, brancheVanFunctie, escapeHtml, alinea, knop, knoppen, stappen, gegevens, afsluiting, label } from "@shared/mailOpmaak";
import { functieLabel, type JobTaal } from "@shared/jobRegels";

function basis(): string {
  return (process.env.BASE_URL || "https://www.doehetextra.nl").replace(/\/$/, "");
}

export async function stuurStartmail(o: { voornaam: string; email: string; functie: string; taal: JobTaal; link: string }) {
  const en = o.taal === "en";
  const html = mailOpmaak({
    branche: brancheVanFunctie(o.functie),
    taal: o.taal,
    titel: en ? "A few quick questions from Job" : "Een paar korte vragen van Job",
    voorkop: en ? "Your application" : "Je aanmelding",
    kop: en ? `Thanks, ${escapeHtml(o.voornaam)}!` : `Dank je, ${escapeHtml(o.voornaam)}!`,
    preheader: en ? "Answer a few quick questions and book your meeting." : "Beantwoord een paar korte vragen en plan je kennismaking.",
    inhoud: [
      alinea(en
        ? `Your application for ${escapeHtml(functieLabel(o.functie, "en"))} is in. Job, our AI recruiter, has a few quick questions. It takes about five minutes.`
        : `Je aanmelding voor ${escapeHtml(functieLabel(o.functie, "nl"))} is binnen. Job, onze AI-recruiter, heeft nog een paar korte vragen. Dat duurt ongeveer vijf minuten.`),
      knoppen(knop(en ? "Talk to Job" : "Praat met Job", o.link, "vol")),
      stappen(brancheVanFunctie(o.functie), en
        ? ["Quick questions from Job", "A short meeting at our office", "Contract, the EXTRAATJE app and your first shift"]
        : ["Korte vragen van Job", "Kennismaken op kantoor", "Contract, de EXTRAATJE-app en je eerste dienst"]),
      alinea(en ? "A colleague from EXTRA always makes the decision." : "Een collega van EXTRA neemt altijd de beslissing.", { klein: true }),
      afsluiting(o.taal),
    ].join(""),
  });
  return sendEmail({
    to: o.email, from: AFZENDER,
    subject: en ? "A few quick questions from Job" : "Een paar korte vragen van Job",
    html,
    text: en ? `Hi ${o.voornaam},\n\nYour application is in. Job has a few quick questions: ${o.link}\n\nTeam EXTRA` : `Hoi ${o.voornaam},\n\nJe aanmelding is binnen. Job heeft nog een paar korte vragen: ${o.link}\n\nTeam EXTRA`,
  });
}

export async function stuurHerinneringsmail(o: { voornaam: string; email: string; functie: string; taal: JobTaal; link: string; stopLink: string; waLink?: string | null }) {
  const en = o.taal === "en";
  const html = mailOpmaak({
    branche: brancheVanFunctie(o.functie),
    taal: o.taal,
    titel: en ? `You're almost done, ${o.voornaam}` : `Je bent bijna klaar, ${o.voornaam}`,
    voorkop: en ? "Almost done" : "Bijna klaar",
    kop: en ? `You're almost done, ${escapeHtml(o.voornaam)}` : `Je bent bijna klaar, ${escapeHtml(o.voornaam)}`,
    preheader: en ? "A few more quick questions, then you can book a meeting." : "Nog een paar korte vragen, dan kun je meteen een kennismaking plannen.",
    inhoud: [
      alinea(en
        ? `Great that you signed up for ${escapeHtml(functieLabel(o.functie, "en"))}! Your conversation with Job isn't finished yet. A few more quick questions, then you can book a meeting right away.`
        : `Leuk dat je je hebt aangemeld voor ${escapeHtml(functieLabel(o.functie, "nl"))}! Je gesprek met Job is nog niet af. Nog een paar korte vragen, dan kun je meteen een kennismaking plannen.`),
      stappen(brancheVanFunctie(o.functie), en
        ? ["Apply: done", "Questions from Job: almost done", "Meet us at the office"]
        : ["Aanmelden: klaar", "Vragen van Job: bijna klaar", "Kennismaken op kantoor"]),
      o.waLink
        ? knoppen(knop(en ? "Continue on WhatsApp →" : "Verder via WhatsApp →", o.waLink, "vol"), knop(en ? "Continue on the website →" : "Verder op de website →", o.link, "rand"))
        : knoppen(knop(en ? "Continue on the website →" : "Verder op de website →", o.link, "vol")),
      alinea(en ? "You'll pick up where you left off. What you already told us has been saved." : "Je gaat verder waar je gebleven was. Wat je al vertelde, hebben we bewaard."),
      afsluiting(o.taal, { groet: en ? "Best," : "Groet," }),
    ].join(""),
    voetExtra: en
      ? `No longer interested? <a href="${o.stopLink}" style="color:inherit;text-decoration:underline;">Unsubscribe</a> and we won't send reminders.`
      : `Geen interesse meer? <a href="${o.stopLink}" style="color:inherit;text-decoration:underline;">Meld je af</a>, dan sturen we geen herinneringen meer.`,
  });
  return sendEmail({
    to: o.email, from: AFZENDER,
    subject: en ? `You're almost done, ${o.voornaam}` : `Je bent bijna klaar, ${o.voornaam}`,
    html,
    text: en ? `Hi ${o.voornaam},\n\nYour conversation with Job isn't finished yet. Continue here: ${o.link}\n\nNo longer interested? ${o.stopLink}` : `Hoi ${o.voornaam},\n\nJe gesprek met Job is nog niet af. Ga verder via: ${o.link}\n\nGeen interesse meer? ${o.stopLink}`,
  });
}

export async function stuurBevestigingsmail(o: {
  voornaam: string; email: string; functie: string; taal: JobTaal;
  dag: string; datum: string; tijd: string; interviewer: string; samenvatting: string;
  agendaLink: string; verzettenLink: string; gesprekLink: string;
}) {
  const en = o.taal === "en";
  const branche = brancheVanFunctie(o.functie);
  const kortDag = o.dag.split(" ")[0];
  const html = mailOpmaak({
    branche,
    taal: o.taal,
    titel: en ? `Your application is complete, see you ${kortDag}!` : `Je aanmelding is rond, tot ${kortDag.toLowerCase()}!`,
    voorkop: en ? "Application complete" : "Aanmelding rond",
    kop: en ? `See you ${escapeHtml(kortDag)}, ${escapeHtml(o.voornaam)}!` : `Tot ${escapeHtml(kortDag.toLowerCase())}, ${escapeHtml(o.voornaam)}!`,
    preheader: en ? `${o.dag} at ${o.tijd}, Herengracht 372, Amsterdam` : `${o.dag} om ${o.tijd}, Herengracht 372, Amsterdam`,
    inhoud: [
      alinea(en
        ? "Thanks for your application and your conversation with Job. The first screening is done. This is your next step:"
        : "Dank je voor je aanmelding en je gesprek met Job. De eerste screening is klaar. Dit is je volgende stap:"),
      gegevens(en
        ? [["When", `${escapeHtml(o.dag)}, ${escapeHtml(o.tijd)}`], ["Where", "Herengracht 372, Amsterdam"], ["With", escapeHtml(o.interviewer)], ["Bring", "Passport or ID card"]]
        : [["Wanneer", `${escapeHtml(o.dag)}, ${escapeHtml(o.tijd)}`], ["Waar", "Herengracht 372, Amsterdam"], ["Met wie", escapeHtml(o.interviewer)], ["Meenemen", "Paspoort of ID-kaart"]]),
      knoppen(knop(en ? "Add to calendar" : "Zet in agenda", o.agendaLink, "vol"), knop(en ? "Reschedule" : "Verzetten", o.verzettenLink, "rand")),
      label(en ? "What you told Job" : "Wat je Job vertelde"),
      alinea(`${escapeHtml(o.samenvatting)}. ${en ? `Something not right? <a href="${o.gesprekLink}" style="color:inherit;">Let Job know</a>.` : `Klopt er iets niet? <a href="${o.gesprekLink}" style="color:inherit;">Laat het Job weten</a>.`}`),
      label(en ? "After that" : "Daarna"),
      stappen(branche, en
        ? ["A short meeting at our office", "Contract and the EXTRAATJE app", "Your first shift"]
        : ["Kennismaken op kantoor", "Contract en de EXTRAATJE-app", "Je eerste dienst"]),
      afsluiting(o.taal, { groet: en ? `See you ${kortDag}!` : `Tot ${kortDag.toLowerCase()}!` }),
    ].join(""),
  });
  return sendEmail({
    to: o.email, from: AFZENDER,
    subject: en ? `Your application is complete, see you ${kortDag}!` : `Je aanmelding is rond, tot ${kortDag.toLowerCase()}!`,
    html,
    text: en
      ? `Hi ${o.voornaam},\n\nYour meeting: ${o.dag} at ${o.tijd}, Herengracht 372, Amsterdam, with ${o.interviewer}. Bring your passport or ID card.\n\nReschedule: ${o.verzettenLink}\n\nTeam EXTRA`
      : `Hoi ${o.voornaam},\n\nJe kennismaking: ${o.dag} om ${o.tijd}, Herengracht 372, Amsterdam, met ${o.interviewer}. Neem je paspoort of ID-kaart mee.\n\nVerzetten: ${o.verzettenLink}\n\nTeam EXTRA`,
  });
}

export async function stuurCvMail(o: { voornaam: string; email: string; functie: string; taal: JobTaal; gesprekToken: string }) {
  const en = o.taal === "en";
  const uploadUrl = `${basis()}/job-gesprek?token=${encodeURIComponent(o.gesprekToken)}&cv=1`;
  const html = mailOpmaak({
    branche: brancheVanFunctie(o.functie),
    taal: o.taal,
    titel: en ? "Upload your CV" : "Upload je cv",
    voorkop: en ? "One more step" : "Nog één stap",
    kop: en ? "One more step: your CV" : "Nog één stap: je cv",
    preheader: en ? "As soon as your CV is in, you can book a meeting." : "Zodra je cv binnen is, kun je een kennismaking plannen.",
    inhoud: [
      alinea(en ? `Hi ${escapeHtml(o.voornaam)},` : `Hoi ${escapeHtml(o.voornaam)},`),
      alinea(en
        ? "Thanks for your conversation with Job! The only thing missing is your CV. A PDF or a photo is fine."
        : "Dank je voor je gesprek met Job! Alleen je cv ontbreekt nog. Een pdf of een foto is prima."),
      knoppen(knop(en ? "Upload your CV" : "Upload je cv", uploadUrl, "vol")),
      alinea(en ? "As soon as it's in, you can book a meeting at our office right away." : "Zodra het binnen is, kun je meteen een kennismaking op ons kantoor plannen.", { klein: true }),
      afsluiting(o.taal),
    ].join(""),
  });
  return sendEmail({
    to: o.email, from: AFZENDER,
    subject: en ? "Upload your CV to book a meeting" : "Upload je cv om een kennismaking te plannen",
    html,
    text: en ? `Hi ${o.voornaam},\n\nUpload your CV here: ${uploadUrl}\n\nTeam EXTRA` : `Hoi ${o.voornaam},\n\nUpload je cv hier: ${uploadUrl}\n\nTeam EXTRA`,
  });
}

/** Kandidaten (bord H3, mail 1): na Accepteren kiest de kandidaat zelf een moment. */
export async function stuurUitnodigingsmail(o: { voornaam: string; email: string; functie: string; taal: JobTaal; link: string; nonEu: boolean; viaWhatsapp: boolean }) {
  const en = o.taal === "en";
  const meenemen = en
    ? (o.nonEu ? "Passport or ID card and your residence document" : "Passport or ID card")
    : (o.nonEu ? "Paspoort of ID-kaart en je verblijfsdocument" : "Paspoort of ID-kaart");
  const html = mailOpmaak({
    branche: brancheVanFunctie(o.functie),
    taal: o.taal,
    titel: en ? "You're invited to meet us" : "Je bent uitgenodigd voor een kennismaking",
    voorkop: en ? "Invitation" : "Uitnodiging kennismaking",
    kop: en ? `Hi ${escapeHtml(o.voornaam)}, you're invited` : `Hoi ${escapeHtml(o.voornaam)}, je bent uitgenodigd`,
    preheader: en ? "Choose a time that suits you." : "Kies zelf een moment dat je uitkomt.",
    inhoud: [
      alinea(en
        ? "Good news: we'd like to meet you at our office. Choose a time that suits you."
        : "Goed nieuws: we maken graag kennis met je op ons kantoor. Kies zelf een moment dat je uitkomt."),
      gegevens([[en ? "Where" : "Waar", "Herengracht 372, Amsterdam"], [en ? "Bring" : "Meenemen", meenemen]]),
      knoppen(knop(en ? "Choose a time →" : "Kies een moment →", o.link, "vol")),
      alinea(o.viaWhatsapp
        ? (en ? "Questions? Send Job a message on WhatsApp." : "Vragen? Stuur Job een bericht via WhatsApp.")
        : (en ? "Questions? Send Job a message via the link above." : "Vragen? Stuur Job een bericht via de link hierboven."), { klein: true }),
      afsluiting(o.taal),
    ].join(""),
  });
  return sendEmail({
    to: o.email, from: AFZENDER,
    subject: en ? "You're invited to meet us" : "Je bent uitgenodigd voor een kennismaking",
    html,
    text: en
      ? `Hi ${o.voornaam},\n\nGood news: we'd like to meet you at our office. Choose a time: ${o.link}\n\nWhere: Herengracht 372, Amsterdam\nBring: ${meenemen}\n\nSee you soon!\nTeam EXTRA`
      : `Hoi ${o.voornaam},\n\nGoed nieuws: we maken graag kennis met je op ons kantoor. Kies een moment: ${o.link}\n\nWaar: Herengracht 372, Amsterdam\nMeenemen: ${meenemen}\n\nTot snel!\nTeam EXTRA`,
  });
}
