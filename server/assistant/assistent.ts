/**
 * Dashboard-AI-assistent: tool-uitvoerders + OpenAI function-calling-loop.
 * Pure logica (periode-parsing, groep-matching, prompt, tooldefinities)
 * staat in assistentLogic.ts; de routes staan in server/routes.ts (sectie
 * "AI-ASSISTENT").
 *
 * Veiligheidsmodel — zie ook de doc-comment in assistentLogic.ts:
 *   - alle lees-tools zijn read-only queries;
 *   - de enige "doe"-tool (zet_template_verzending_klaar) slaat uitsluitend
 *     een voorstel op in het servergeheugen en verstuurt NIETS;
 *   - uitvoeren gebeurt alleen via het bevestig-endpoint, dat de hier
 *     opgeslagen parameters aan het bestaande, gevalideerde groeps-
 *     verzendpad (sendGroupTemplate in routes.ts) geeft — dus met exact
 *     dezelfde validaties, rate-limiting en bulk-send-administratie als een
 *     handmatige verzending.
 */
import { randomUUID } from 'crypto';
import { db } from '../db';
import { and, gte, lte, sql } from 'drizzle-orm';
import {
  candidates,
  staffingRequests,
  employees,
  crmCompanies,
  blogPosts,
  whatsappGroups,
  whatsappGroupMembers,
} from '@shared/schema';
import { isGa4Configured, fetchGa4BezoekersPeriode } from '../ga4';
import { getStats as waConversatieStats } from '../whatsapp/storage';
import { listAllTemplates } from '../whatsapp/templates';
import {
  ACTIE_TTL_MS,
  TOOL_DEFINITIES,
  bouwSysteemPrompt,
  isActieVerlopen,
  ontbrekendeVariabelen,
  parsePeriode,
  vindGroep,
  type ActieVoorstel,
  type AssistentBericht,
  type KlaargezetteActie,
} from './assistentLogic';

// Zelfde model als de overige AI-functies in dit project (WhatsApp-
// suggesties, taalherkenning) — bewezen werkend via de Replit AI-gateway.
const ASSISTENT_MODEL = 'gpt-4o-mini';
/** Max. aantal model-rondes per vraag; ruim genoeg voor 2-3 tool-aanroepen. */
const MAX_RONDES = 6;
/** Max. berichten uit de gespreksgeschiedenis die meegaan naar het model. */
const MAX_GESCHIEDENIS = 20;

// ─── Klaargezette acties (in-memory, TTL — zie assistentLogic.ts) ───────────

const klaargezetteActies = new Map<string, KlaargezetteActie>();

function ruimVerlopenActiesOp(nu: number): void {
  const teVerwijderen: string[] = [];
  klaargezetteActies.forEach((actie, id) => {
    if (isActieVerlopen(actie.aangemaaktOp, nu)) teVerwijderen.push(id);
  });
  for (const id of teVerwijderen) klaargezetteActies.delete(id);
}

/**
 * Haalt een actie op EN verwijdert hem — eenmalig uitvoerbaar, dus een
 * dubbele klik op Bevestigen (of een replay) kan nooit twee keer versturen.
 */
export function neemActie(id: string): KlaargezetteActie | null {
  ruimVerlopenActiesOp(Date.now());
  const actie = klaargezetteActies.get(id);
  if (!actie) return null;
  klaargezetteActies.delete(id);
  return actie;
}

export function verwijderActie(id: string): void {
  klaargezetteActies.delete(id);
}

// ─── Tool-uitvoerders ────────────────────────────────────────────────────────

/** Per-aanvraag context: vangt de actie die een tool dit gesprek klaarzet. */
interface UitvoerContext {
  actie: ActieVoorstel | null;
}

type ToolUitvoerder = (args: any, ctx: UitvoerContext, nu: Date) => Promise<unknown>;

function telPer<T>(rijen: T[], sleutel: (rij: T) => string | null | undefined): Record<string, number> {
  const telling: Record<string, number> = {};
  for (const rij of rijen) {
    const k = sleutel(rij) || 'onbekend';
    telling[k] = (telling[k] || 0) + 1;
  }
  return telling;
}

const uitvoerders: Record<string, ToolUitvoerder> = {
  async ga4_bezoekers(args, _ctx, nu) {
    if (!isGa4Configured()) {
      return { fout: 'Google Analytics is niet gekoppeld — zie Website Statistieken → Koppelingen.' };
    }
    const periode = parsePeriode(args?.van, args?.tot, nu);
    return await fetchGa4BezoekersPeriode(periode.vanIso, periode.totIso);
  },

  async aanmeldingen_overzicht(args, _ctx, nu) {
    const periode = parsePeriode(args?.van, args?.tot, nu);
    const rijen = await db
      .select({
        status: candidates.status,
        functionType: candidates.functionType,
        hasCv: candidates.hasCv,
      })
      .from(candidates)
      .where(and(gte(candidates.createdAt, periode.van), lte(candidates.createdAt, periode.tot)));
    return {
      periode: { van: periode.vanIso, tot: periode.totIso },
      totaal: rijen.length,
      perStatus: telPer(rijen, r => r.status),
      perFunctie: telPer(rijen, r => r.functionType),
      metCv: rijen.filter(r => r.hasCv).length,
    };
  },

  async personeelsaanvragen_overzicht(args, _ctx, nu) {
    const periode = parsePeriode(args?.van, args?.tot, nu);
    const rijen = await db
      .select({
        companyName: staffingRequests.companyName,
        status: staffingRequests.status,
        functions: staffingRequests.functions,
        createdAt: staffingRequests.createdAt,
      })
      .from(staffingRequests)
      .where(and(gte(staffingRequests.createdAt, periode.van), lte(staffingRequests.createdAt, periode.tot)));
    const recent = [...rijen]
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(0, 10)
      .map(r => ({
        bedrijf: r.companyName,
        status: r.status,
        functies: r.functions,
        datum: r.createdAt ? r.createdAt.toISOString().slice(0, 10) : null,
      }));
    return {
      periode: { van: periode.vanIso, tot: periode.totIso },
      totaal: rijen.length,
      perStatus: telPer(rijen, r => r.status),
      meestRecente: recent,
    };
  },

  async kandidaten_medewerkers_overzicht() {
    const kandidaatRijen = await db
      .select({ status: candidates.status, optIn: candidates.whatsappOptInStatus })
      .from(candidates);
    const medewerkerRijen = await db
      .select({ status: employees.status, optIn: employees.whatsappOptInStatus })
      .from(employees);
    return {
      kandidaten: {
        totaal: kandidaatRijen.length,
        perStatus: telPer(kandidaatRijen, r => r.status),
        whatsappOptIn: telPer(kandidaatRijen, r => r.optIn),
      },
      medewerkers: {
        totaal: medewerkerRijen.length,
        perStatus: telPer(medewerkerRijen, r => r.status),
        whatsappOptIn: telPer(medewerkerRijen, r => r.optIn),
      },
    };
  },

  async crm_overzicht(args) {
    const categorie = typeof args?.categorie === 'string' ? args.categorie : undefined;
    const rijen = await db
      .select({
        phase: crmCompanies.phase,
        type: crmCompanies.type,
        isClient: crmCompanies.isClient,
        categorie: crmCompanies.categorie,
      })
      .from(crmCompanies)
      .where(categorie ? sql`${crmCompanies.categorie} = ${categorie}` : undefined);
    return {
      filter: categorie ? { categorie } : 'geen (alle bedrijven)',
      totaal: rijen.length,
      klanten: rijen.filter(r => r.isClient).length,
      prospects: rijen.filter(r => !r.isClient).length,
      perFase: telPer(rijen, r => r.phase),
      perType: telPer(rijen, r => r.type),
      perCategorie: telPer(rijen, r => r.categorie),
    };
  },

  async whatsapp_overzicht() {
    const [gesprekken, templates, groepen, ledenTelling] = await Promise.all([
      waConversatieStats(),
      listAllTemplates(),
      db.select({ id: whatsappGroups.id, name: whatsappGroups.name }).from(whatsappGroups),
      db
        .select({ groupId: whatsappGroupMembers.groupId, aantal: sql<number>`count(*)::int` })
        .from(whatsappGroupMembers)
        .groupBy(whatsappGroupMembers.groupId),
    ]);
    const ledenPerGroep = new Map(ledenTelling.map(t => [t.groupId, t.aantal]));
    return {
      gesprekken,
      verzendgroepen: groepen.map(g => ({ naam: g.name, leden: ledenPerGroep.get(g.id) || 0 })),
      templates: templates.map(t => ({ key: t.key, naam: t.name, status: t.status, variabelen: t.variables })),
    };
  },

  async blogs_overzicht() {
    const rijen = await db
      .select({ title: blogPosts.title, status: blogPosts.status, publishedAt: blogPosts.publishedAt })
      .from(blogPosts);
    const laatstGepubliceerd = rijen
      .filter(r => r.status === 'published')
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
      .slice(0, 5)
      .map(r => r.title);
    return {
      totaal: rijen.length,
      perStatus: telPer(rijen, r => r.status),
      laatstGepubliceerd,
    };
  },

  async zet_template_verzending_klaar(args, ctx) {
    const reden = typeof args?.reden === 'string' ? args.reden.trim() : '';
    if (!reden) return { fout: 'Een reden (aanleiding) is verplicht bij een template-verzending. Vraag de gebruiker ernaar.' };

    // 1. Groep vinden (fuzzy, maar nooit gokken bij meerdere treffers).
    const groepen = await db.select({ id: whatsappGroups.id, name: whatsappGroups.name }).from(whatsappGroups);
    const zoek = vindGroep(groepen, String(args?.groep ?? ''));
    if (zoek.soort === 'meerdere') {
      return { fout: `Meerdere groepen passen bij "${args?.groep}" — vraag de gebruiker welke: ${zoek.opties.map(o => o.name).join(', ')}` };
    }
    if (zoek.soort === 'niets') {
      return { fout: `Geen verzendgroep gevonden voor "${args?.groep}". Beschikbare groepen: ${zoek.beschikbaar.join(', ') || '(geen)'}` };
    }
    const groep = zoek.groep;

    // 2. Template vinden op key of naam.
    const alleTemplates = await listAllTemplates();
    const term = String(args?.template ?? '').trim().toLowerCase();
    const template =
      alleTemplates.find(t => t.key.toLowerCase() === term) ||
      alleTemplates.find(t => t.name.toLowerCase() === term) ||
      alleTemplates.find(t => t.name.toLowerCase().includes(term) && term.length >= 3);
    if (!template) {
      return { fout: `Template "${args?.template}" niet gevonden. Beschikbaar: ${alleTemplates.map(t => `${t.name} (${t.key}, ${t.status})`).join('; ') || '(geen)'}` };
    }

    // 3. Zelfde validaties als het verzendpad — zodat Bevestigen niet alsnog faalt.
    if (template.status !== 'approved') {
      return { fout: `Template "${template.name}" heeft status "${template.status}" — alleen goedgekeurde templates kunnen verstuurd worden.` };
    }
    if (template.buttonDynamic) {
      return { fout: `Template "${template.name}" heeft een dynamische knop en kan nog niet via groepsverzending verstuurd worden.` };
    }
    const variabelen: string[] = Array.isArray(template.variables) ? (template.variables as string[]) : [];
    const extraVariabelen: Record<string, string> | undefined =
      args?.extraVariabelen && typeof args.extraVariabelen === 'object' ? args.extraVariabelen : undefined;
    const ontbreekt = ontbrekendeVariabelen(variabelen, extraVariabelen);
    if (ontbreekt.length > 0) {
      return { fout: `Waarde ontbreekt voor template-variabele(n): ${ontbreekt.join(', ')}. Vraag de gebruiker om deze waarden (voornaam/achternaam/naam worden automatisch per ontvanger ingevuld).` };
    }

    // 4. Ontvangers ophalen voor de preview.
    const leden = await db
      .select({
        displayName: whatsappGroupMembers.displayName,
        firstName: whatsappGroupMembers.firstName,
        lastName: whatsappGroupMembers.lastName,
        phoneNumber: whatsappGroupMembers.phoneNumber,
      })
      .from(whatsappGroupMembers)
      .where(sql`${whatsappGroupMembers.groupId} = ${groep.id}`);
    if (leden.length === 0) {
      return { fout: `Groep "${groep.name}" heeft geen leden — er valt niets te versturen.` };
    }
    const preview = leden.slice(0, 15).map(l =>
      l.displayName || [l.firstName, l.lastName].filter(Boolean).join(' ') || `+${l.phoneNumber}`,
    );

    // 5. Klaarzetten — NIET versturen.
    const actie: KlaargezetteActie = {
      id: randomUUID(),
      soort: 'template_verzending',
      groepId: groep.id,
      groepNaam: groep.name,
      templateKey: template.key,
      templateNaam: template.name,
      reden,
      extraVariabelen,
      aantalOntvangers: leden.length,
      ontvangersPreview: preview,
      aangemaaktOp: Date.now(),
    };
    klaargezetteActies.set(actie.id, actie);
    ctx.actie = {
      id: actie.id,
      omschrijving: `Template "${template.name}" naar groep "${groep.name}" (${leden.length} ontvanger${leden.length === 1 ? '' : 's'})`,
      groepNaam: groep.name,
      templateNaam: template.name,
      reden,
      aantalOntvangers: leden.length,
      ontvangersPreview: preview,
    };
    return {
      status: 'klaargezet',
      omschrijving: ctx.actie.omschrijving,
      aantalOntvangers: leden.length,
      letOp: `NOG NIET VERSTUURD. De gebruiker ziet nu een bevestigkaart en beslist zelf. De actie verloopt na ${Math.round(ACTIE_TTL_MS / 60000)} minuten.`,
    };
  },
};

// ─── OpenAI-loop ─────────────────────────────────────────────────────────────

export interface AssistentResultaat {
  antwoord: string;
  actie?: ActieVoorstel;
}

/**
 * Beantwoordt één gebruikersvraag (met gespreksgeschiedenis) via het
 * function-calling-patroon: model kiest tools → wij voeren uit → resultaten
 * terug naar het model → tot er een gewoon tekst-antwoord komt (of de
 * ronde-limiet bereikt is). Fouten uit tools gaan als leesbare tekst terug
 * naar het model in plaats van de hele aanvraag te laten klappen — het
 * model kan zichzelf dan corrigeren of de fout netjes uitleggen.
 */
export async function beantwoordVraag(berichten: AssistentBericht[]): Promise<AssistentResultaat> {
  // Zelfde lazy-importpatroon als de andere AI-functies in routes.ts.
  let OpenAI: any;
  try {
    OpenAI = (await import('openai')).default;
  } catch {
    throw new Error('AI-module niet beschikbaar');
  }
  const client = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? 'unused',
  });

  const nu = new Date();
  const geschiedenis = berichten.slice(-MAX_GESCHIEDENIS).map(b => ({
    role: b.rol === 'gebruiker' ? ('user' as const) : ('assistant' as const),
    content: String(b.tekst ?? '').slice(0, 4000),
  }));

  const modelBerichten: any[] = [
    { role: 'system', content: bouwSysteemPrompt(nu) },
    ...geschiedenis,
  ];
  const ctx: UitvoerContext = { actie: null };

  for (let ronde = 0; ronde < MAX_RONDES; ronde++) {
    const completion = await client.chat.completions.create({
      model: ASSISTENT_MODEL,
      messages: modelBerichten,
      tools: TOOL_DEFINITIES,
      max_tokens: 900,
      temperature: 0.2,
    });

    const keuze = completion.choices?.[0]?.message;
    if (!keuze) throw new Error('Leeg antwoord van het AI-model');

    const toolCalls = keuze.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return { antwoord: keuze.content || 'Ik heb geen antwoord kunnen formuleren — probeer de vraag anders te stellen.', actie: ctx.actie ?? undefined };
    }

    modelBerichten.push(keuze);
    for (const call of toolCalls) {
      const naam: string = call.function?.name;
      const uitvoerder = uitvoerders[naam];
      let resultaat: unknown;
      if (!uitvoerder) {
        resultaat = { fout: `Onbekende tool "${naam}"` };
      } else {
        try {
          const argumenten = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
          resultaat = await uitvoerder(argumenten, ctx, nu);
        } catch (err: any) {
          resultaat = { fout: err?.message || 'Onbekende fout bij het uitvoeren van deze tool' };
        }
      }
      modelBerichten.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(resultaat),
      });
    }
  }

  // Ronde-limiet bereikt: geef terug wat er is, zonder te blijven hangen.
  return {
    antwoord: 'Deze vraag kostte meer stappen dan ik aankan in één keer — stel hem iets specifieker (bijv. met een concrete periode of groep).',
    actie: ctx.actie ?? undefined,
  };
}
