import { useState, useRef, useCallback, createContext, useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Save, Eye, Mail, Monitor, Smartphone, Plus, Trash2, X,
  ChevronDown, ChevronRight, AlertCircle, RefreshCw, Type, AlignLeft,
  Image as ImageIcon, Minus, Square, Tag as TagIcon, Globe, User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type BuilderSettings = {
  achtergrond_email: string;
  achtergrond_inhoud: string;
  lettertype: string;
  tekstkleur: string;
  unsubscribe_tekst: string;
  lay_out?: 'extra' | 'geen';
  header_kleur?: string;
  header_tekst?: string;
  footer_tekst?: string;
};

export type KoptekstBlock = { id: string; type: 'koptekst'; tekst: string; niveau: 'h1'|'h2'|'h3'; uitlijning: 'left'|'center'|'right'; kleur: string };
export type ParagraafBlock = { id: string; type: 'paragraaf'; tekst: string; uitlijning: 'left'|'center'|'right'; kleur: string };
export type KnopBlock = { id: string; type: 'knop'; tekst: string; url: string; achtergrond: string; tekstkleur: string; uitlijning: 'left'|'center'|'right' };
export type LijnBlock = { id: string; type: 'lijn'; kleur: string; dikte: number };
export type RuimteBlock = { id: string; type: 'ruimte'; hoogte: number };
export type AfbeeldingBlock = { id: string; type: 'afbeelding'; url: string; alt: string; uitlijning: 'left'|'center'|'right'; link: string };
export type HandtekeningBlock = { id: string; type: 'handtekening' };
export type TaalvariantBlock = { id: string; type: 'taalvariant'; nl: string; en: string };
export type AanhefBlock = { id: string; type: 'aanhef'; nl: string; en: string };

export type BuilderBlock = KoptekstBlock | ParagraafBlock | KnopBlock | LijnBlock | RuimteBlock | AfbeeldingBlock | HandtekeningBlock | TaalvariantBlock | AanhefBlock;

export type BuilderContent = {
  modus: 'html' | 'plaintext';
  instellingen: BuilderSettings;
  blokken: BuilderBlock[];
};

const DEFAULT_SETTINGS: BuilderSettings = {
  achtergrond_email: '#F9FAFB',
  achtergrond_inhoud: '#FFFFFF',
  lettertype: 'Inter',
  tekstkleur: '#111827',
  unsubscribe_tekst: 'Wil je geen mails meer ontvangen? Klik hier om je uit te schrijven.',
  lay_out: 'extra',
  header_kleur: '#5b2eb5',
  header_tekst: 'EXTRA',
  footer_tekst: 'EXTRA · Herengracht 372 · Amsterdam',
};

export type PersonalTag = { tag: string; label: string };

const DEFAULT_PERSONAL_TAGS: PersonalTag[] = [
  { tag: '{{voornaam}}', label: 'Voornaam' },
  { tag: '{{achternaam}}', label: 'Achternaam' },
  { tag: '{{naam}}', label: 'Volledige naam' },
  { tag: '{{bedrijf}}', label: 'Bedrijfsnaam' },
  { tag: '{{functietitel}}', label: 'Functietitel' },
  { tag: '{{stad}}', label: 'Stad' },
];

export const PersonalTagsContext = createContext<PersonalTag[]>(DEFAULT_PERSONAL_TAGS);

function genId() { return `blok_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
export { genId };

export function makeBlock(type: BuilderBlock['type']): BuilderBlock {
  const id = genId();
  switch (type) {
    case 'koptekst': return { id, type, tekst: 'Kopregel', niveau: 'h2', uitlijning: 'left', kleur: '#111827' };
    case 'paragraaf': return { id, type, tekst: 'Schrijf hier je tekst. Gebruik {{voornaam}} en {{bedrijf}} voor personalisatie.', uitlijning: 'left', kleur: '#374151' };
    case 'knop': return { id, type, tekst: 'Plan een kennismaking', url: 'https://doehetextra.nl/contact', achtergrond: '#7c3aed', tekstkleur: '#ffffff', uitlijning: 'left' };
    case 'lijn': return { id, type, kleur: '#e5e7eb', dikte: 1 };
    case 'ruimte': return { id, type, hoogte: 24 };
    case 'afbeelding': return { id, type, url: '', alt: '', uitlijning: 'center', link: '' };
    case 'handtekening': return { id, type };
    case 'taalvariant': return { id, type, nl: 'Nederlandse versie van de tekst.', en: 'English version of the text.' };
    case 'aanhef': return { id, type, nl: 'Beste {{voornaam}},', en: 'Hi {{voornaam}},' };
  }
}

function emptyContent(): BuilderContent {
  return { modus: 'html', instellingen: { ...DEFAULT_SETTINGS }, blokken: [] };
}

export function parseContent(raw: string | null | undefined): BuilderContent {
  if (!raw) return emptyContent();
  try {
    const parsed = JSON.parse(raw);
    // New format
    if (parsed && !Array.isArray(parsed) && parsed.modus) return parsed as BuilderContent;
    // Old array format → convert
    if (Array.isArray(parsed)) {
      const blokken: BuilderBlock[] = parsed.map((b: any): BuilderBlock | null => {
        const id = genId();
        if (b.type === 'heading') return { id, type: 'koptekst', tekst: b.text || '', niveau: 'h2', uitlijning: b.align || 'left', kleur: '#111827' };
        if (b.type === 'text') return { id, type: 'paragraaf', tekst: b.text || '', uitlijning: 'left', kleur: '#374151' };
        if (b.type === 'button') return { id, type: 'knop', tekst: b.label || '', url: b.url || '', achtergrond: b.color || '#7c3aed', tekstkleur: '#ffffff', uitlijning: 'center' };
        if (b.type === 'divider') return { id, type: 'lijn', kleur: '#e5e7eb', dikte: 1 };
        if (b.type === 'spacer') return { id, type: 'ruimte', hoogte: b.height || 24 };
        if (b.type === 'image') return { id, type: 'afbeelding', url: b.url || '', alt: b.alt || '', uitlijning: 'center', link: '' };
        return null;
      }).filter(Boolean) as BuilderBlock[];
      return { modus: 'html', instellingen: { ...DEFAULT_SETTINGS }, blokken };
    }
    return emptyContent();
  } catch {
    return emptyContent();
  }
}

// ─── Block renderer (canvas preview) ─────────────────────────────────────────
export function BlockPreview({ blok, selected, onClick }: { blok: BuilderBlock; selected: boolean; onClick: () => void }) {
  const [hovNl, setHovNl] = useState(true);
  const cls = `relative rounded transition-all cursor-pointer ${selected ? 'ring-2 ring-purple-500 ring-offset-1' : 'hover:ring-1 hover:ring-purple-200'} px-1 py-0.5`;

  return (
    <div className={cls} onClick={onClick}>
      {blok.type === 'koptekst' && (
        <div style={{ textAlign: blok.uitlijning, color: blok.kleur, fontWeight: 700, fontSize: blok.niveau === 'h1' ? '26px' : blok.niveau === 'h2' ? '22px' : '18px', lineHeight: 1.3 }}>
          {blok.tekst || <span className="text-gray-300">Kopregel...</span>}
        </div>
      )}
      {blok.type === 'paragraaf' && (
        <div style={{ textAlign: blok.uitlijning, color: blok.kleur, fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {blok.tekst || <span className="text-gray-300">Paragraaf tekst...</span>}
        </div>
      )}
      {blok.type === 'knop' && (
        <div style={{ textAlign: blok.uitlijning }}>
          <span style={{ background: blok.achtergrond, color: blok.tekstkleur, padding: '12px 28px', borderRadius: '8px', display: 'inline-block', fontWeight: 600, fontSize: '15px' }}>
            {blok.tekst || 'Knop'}
          </span>
        </div>
      )}
      {blok.type === 'lijn' && <hr style={{ borderColor: blok.kleur, borderTopWidth: blok.dikte, borderStyle: 'solid', margin: '8px 0' }} />}
      {blok.type === 'ruimte' && (
        <div style={{ height: `${Math.min(blok.hoogte, 60)}px` }} className="bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-300">{blok.hoogte}px</span>
        </div>
      )}
      {blok.type === 'afbeelding' && (
        blok.url ? (
          <div style={{ textAlign: blok.uitlijning }}>
            <img src={blok.url} alt={blok.alt} className="max-w-full rounded-lg inline-block" style={{ maxHeight: '200px' }} />
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
            <div className="text-center"><ImageIcon className="h-6 w-6 mx-auto mb-1" /><p className="text-xs">Afbeelding</p></div>
          </div>
        )
      )}
      {blok.type === 'handtekening' && (
        <div className="border-t border-gray-200 pt-3 mt-2">
          <div className="text-xs text-gray-600 space-y-0.5">
            <p className="font-semibold">Max van der Berg</p>
            <p>Commercieel Manager</p>
            <p className="text-purple-600">+31 20 244 3040 · max@doehetextra.nl</p>
            <p className="text-purple-600">doehetextra.nl</p>
          </div>
        </div>
      )}
      {blok.type === 'taalvariant' && (
        <div className="border-2 border-blue-200 rounded-lg p-2 bg-blue-50">
          <div className="flex items-center gap-1 mb-1">
            <Globe className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Taalvariant</span>
            <div className="ml-auto flex gap-1">
              <button onClick={e => { e.stopPropagation(); setHovNl(true); }} className={`text-[10px] px-1.5 py-0.5 rounded ${hovNl ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border border-blue-300'}`}>NL</button>
              <button onClick={e => { e.stopPropagation(); setHovNl(false); }} className={`text-[10px] px-1.5 py-0.5 rounded ${!hovNl ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border border-blue-300'}`}>EN</button>
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{hovNl ? blok.nl : blok.en}</p>
        </div>
      )}
      {blok.type === 'aanhef' && (
        <div className="border-l-4 border-purple-400 pl-3">
          <p className="text-sm font-medium text-gray-800">{blok.nl || 'Beste {{voornaam}},'}</p>
          <p className="text-xs text-gray-400 mt-0.5">EN: {blok.en || 'Hi {{voornaam}},'}</p>
        </div>
      )}
    </div>
  );
}

// ─── Block properties (right panel) ──────────────────────────────────────────
function insertTagIntoTextarea(textareaRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>, tag: string, onChange: (v: string) => void) {
  const el = textareaRef.current;
  if (!el) { onChange(tag); return; }
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const newVal = el.value.slice(0, start) + tag + el.value.slice(end);
  onChange(newVal);
  setTimeout(() => { el.focus(); el.setSelectionRange(start + tag.length, start + tag.length); }, 10);
}

function TagInsertButton({ refEl, onChange }: { refEl: React.RefObject<any>; onChange: (v: string) => void }) {
  const tags = useContext(PersonalTagsContext);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-xs px-2 py-1 rounded border border-gray-200 text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-1">
          <TagIcon className="h-3 w-3" />{`{{}}`}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {tags.map(t => (
          <DropdownMenuItem key={t.tag} onClick={() => insertTagIntoTextarea(refEl, t.tag, onChange)}>
            <span className="font-mono text-xs text-purple-600 mr-2">{t.tag}</span>{t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BlockProperties({ blok, onChange }: { blok: BuilderBlock; onChange: (patch: Partial<BuilderBlock>) => void }) {
  const textRef = useRef<any>(null);

  if (blok.type === 'koptekst') return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-gray-500">Tekst</Label>
          <TagInsertButton refEl={textRef} onChange={v => onChange({ tekst: v } as any)} />
        </div>
        <Input ref={textRef} value={blok.tekst} onChange={e => onChange({ tekst: e.target.value } as any)} className="text-sm" />
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Niveau</Label>
        <div className="flex gap-1">{(['h1','h2','h3'] as const).map(n => (
          <button key={n} onClick={() => onChange({ niveau: n } as any)}
            className={`flex-1 text-xs py-1.5 rounded border transition-colors ${blok.niveau === n ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {n.toUpperCase()}
          </button>
        ))}</div>
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Uitlijning</Label>
        <div className="flex gap-1">{(['left','center','right'] as const).map(a => (
          <button key={a} onClick={() => onChange({ uitlijning: a } as any)}
            className={`flex-1 text-xs py-1.5 rounded border transition-colors ${blok.uitlijning === a ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {a === 'left' ? '←' : a === 'center' ? '|' : '→'}
          </button>
        ))}</div>
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Kleur</Label>
        <div className="flex items-center gap-2"><input type="color" value={blok.kleur} onChange={e => onChange({ kleur: e.target.value } as any)} className="h-8 w-10 rounded border cursor-pointer" /><span className="text-xs text-gray-500">{blok.kleur}</span></div>
      </div>
    </div>
  );

  if (blok.type === 'paragraaf') return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-gray-500">Tekst</Label>
          <TagInsertButton refEl={textRef} onChange={v => onChange({ tekst: v } as any)} />
        </div>
        <Textarea ref={textRef} value={blok.tekst} onChange={e => onChange({ tekst: e.target.value } as any)} rows={5} className="text-sm resize-none" />
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Uitlijning</Label>
        <div className="flex gap-1">{(['left','center','right'] as const).map(a => (
          <button key={a} onClick={() => onChange({ uitlijning: a } as any)}
            className={`flex-1 text-xs py-1.5 rounded border transition-colors ${blok.uitlijning === a ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {a === 'left' ? '←' : a === 'center' ? '|' : '→'}
          </button>
        ))}</div>
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Tekstkleur</Label>
        <div className="flex items-center gap-2"><input type="color" value={blok.kleur} onChange={e => onChange({ kleur: e.target.value } as any)} className="h-8 w-10 rounded border cursor-pointer" /><span className="text-xs text-gray-500">{blok.kleur}</span></div>
      </div>
    </div>
  );

  if (blok.type === 'knop') return (
    <div className="space-y-3">
      <div><Label className="text-xs text-gray-500 mb-1 block">Knoptekst</Label><Input value={blok.tekst} onChange={e => onChange({ tekst: e.target.value } as any)} className="text-sm" /></div>
      <div><Label className="text-xs text-gray-500 mb-1 block">URL</Label><Input value={blok.url} onChange={e => onChange({ url: e.target.value } as any)} className="text-sm" placeholder="https://..." /></div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Uitlijning</Label>
        <div className="flex gap-1">{(['left','center','right'] as const).map(a => (
          <button key={a} onClick={() => onChange({ uitlijning: a } as any)}
            className={`flex-1 text-xs py-1.5 rounded border transition-colors ${blok.uitlijning === a ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {a === 'left' ? '←' : a === 'center' ? '|' : '→'}
          </button>
        ))}</div>
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Achtergrondkleur</Label>
        <div className="flex items-center gap-2"><input type="color" value={blok.achtergrond} onChange={e => onChange({ achtergrond: e.target.value } as any)} className="h-8 w-10 rounded border cursor-pointer" /><span className="text-xs text-gray-500">{blok.achtergrond}</span></div>
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Tekstkleur</Label>
        <div className="flex items-center gap-2"><input type="color" value={blok.tekstkleur} onChange={e => onChange({ tekstkleur: e.target.value } as any)} className="h-8 w-10 rounded border cursor-pointer" /><span className="text-xs text-gray-500">{blok.tekstkleur}</span></div>
      </div>
    </div>
  );

  if (blok.type === 'lijn') return (
    <div className="space-y-3">
      <div><Label className="text-xs text-gray-500 mb-1 block">Kleur</Label><div className="flex items-center gap-2"><input type="color" value={blok.kleur} onChange={e => onChange({ kleur: e.target.value } as any)} className="h-8 w-10 rounded border cursor-pointer" /><span className="text-xs text-gray-500">{blok.kleur}</span></div></div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Dikte: {blok.dikte}px</Label>
        <Slider value={[blok.dikte]} onValueChange={v => onChange({ dikte: v[0] } as any)} min={1} max={4} step={1} />
      </div>
    </div>
  );

  if (blok.type === 'ruimte') return (
    <div>
      <Label className="text-xs text-gray-500 mb-1 block">Hoogte: {blok.hoogte}px</Label>
      <Slider value={[blok.hoogte]} onValueChange={v => onChange({ hoogte: v[0] } as any)} min={8} max={80} step={4} />
    </div>
  );

  if (blok.type === 'afbeelding') return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">URL of upload</Label>
        <Input value={blok.url} onChange={e => onChange({ url: e.target.value } as any)} className="text-sm" placeholder="https://..." />
        <label className="mt-2 flex items-center gap-2 text-xs text-purple-600 cursor-pointer hover:text-purple-800">
          <ImageIcon className="h-3 w-3" />Afbeelding uploaden
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => onChange({ url: ev.target?.result as string } as any);
            reader.readAsDataURL(file);
          }} />
        </label>
      </div>
      <div><Label className="text-xs text-gray-500 mb-1 block">Alt-tekst</Label><Input value={blok.alt} onChange={e => onChange({ alt: e.target.value } as any)} className="text-sm" /></div>
      <div><Label className="text-xs text-gray-500 mb-1 block">Klik-link (optioneel)</Label><Input value={blok.link} onChange={e => onChange({ link: e.target.value } as any)} className="text-sm" placeholder="https://..." /></div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Uitlijning</Label>
        <div className="flex gap-1">{(['left','center','right'] as const).map(a => (
          <button key={a} onClick={() => onChange({ uitlijning: a } as any)}
            className={`flex-1 text-xs py-1.5 rounded border transition-colors ${blok.uitlijning === a ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {a === 'left' ? '←' : a === 'center' ? '|' : '→'}
          </button>
        ))}</div>
      </div>
    </div>
  );

  if (blok.type === 'handtekening') return (
    <div className="space-y-2 text-sm text-gray-500">
      <p className="text-xs text-gray-400">Standaard EXTRA-handtekening:</p>
      <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
        <p className="font-semibold text-gray-700">Max van der Berg</p>
        <p>Commercieel Manager</p>
        <p>+31 20 244 3040</p>
        <p className="text-purple-600">max@doehetextra.nl</p>
        <p className="text-purple-600">doehetextra.nl</p>
      </div>
      <p className="text-xs text-gray-400">De handtekening is configureerbaar via de bedrijfsinstellingen.</p>
    </div>
  );

  if (blok.type === 'taalvariant') return (
    <div className="space-y-3">
      <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-600 flex items-start gap-1.5">
        <Globe className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <p>Dit blok wordt automatisch in de juiste taal verzonden op basis van het contact-taalveld.</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-gray-500 flex items-center gap-1">🇳🇱 Nederlands</Label>
          <TagInsertButton refEl={textRef} onChange={v => onChange({ nl: v } as any)} />
        </div>
        <Textarea ref={textRef} value={blok.nl} onChange={e => onChange({ nl: e.target.value } as any)} rows={3} className="text-sm resize-none" />
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">🇬🇧 Engels</Label>
        <Textarea value={blok.en} onChange={e => onChange({ en: e.target.value } as any)} rows={3} className="text-sm resize-none" />
      </div>
    </div>
  );

  if (blok.type === 'aanhef') return (
    <div className="space-y-3">
      <div className="bg-purple-50 rounded-lg p-2 text-xs text-purple-600 flex items-start gap-1.5">
        <User className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <p>De aanhef wordt automatisch gepersonaliseerd met de voornaam van het contact.</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-gray-500">🇳🇱 Aanhef (NL)</Label>
          <TagInsertButton refEl={textRef} onChange={v => onChange({ nl: v } as any)} />
        </div>
        <Input ref={textRef} value={blok.nl} onChange={e => onChange({ nl: e.target.value } as any)} className="text-sm" />
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">🇬🇧 Greeting (EN)</Label>
        <Input value={blok.en} onChange={e => onChange({ en: e.target.value } as any)} className="text-sm" />
      </div>
    </div>
  );

  return null;
}

// ─── Add blocks menu ──────────────────────────────────────────────────────────
export const BLOCK_TYPES: { type: BuilderBlock['type']; label: string; icon: any; desc: string }[] = [
  { type: 'aanhef',       label: 'Aanhef',          icon: User,       desc: 'Gepersonaliseerde opening' },
  { type: 'koptekst',     label: 'Koptekst',         icon: Type,       desc: 'H1 / H2 / H3 titel' },
  { type: 'paragraaf',    label: 'Paragraaf',        icon: AlignLeft,  desc: 'Tekstblok' },
  { type: 'taalvariant',  label: 'Taalvariant',      icon: Globe,      desc: 'NL + EN versie' },
  { type: 'knop',         label: 'Knop',             icon: Square,     desc: 'Call-to-action knop' },
  { type: 'afbeelding',   label: 'Afbeelding',       icon: ImageIcon,  desc: 'Foto of banner' },
  { type: 'lijn',         label: 'Scheidingslijn',   icon: Minus,      desc: 'Horizontale lijn' },
  { type: 'ruimte',       label: 'Ruimte',           icon: ChevronDown,desc: 'Witruimte' },
  { type: 'handtekening', label: 'Handtekening',     icon: User,       desc: 'EXTRA handtekening' },
];

// ─── Global settings panel ────────────────────────────────────────────────────
function SettingsPanel({ settings, onChange }: { settings: BuilderSettings; onChange: (p: Partial<BuilderSettings>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:bg-gray-100 transition-colors">
        E-mailinstellingen {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Achtergrond e-mail</Label>
            <div className="flex items-center gap-2"><input type="color" value={settings.achtergrond_email} onChange={e => onChange({ achtergrond_email: e.target.value })} className="h-8 w-10 rounded border cursor-pointer" /><span className="text-xs text-gray-500">{settings.achtergrond_email}</span></div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Achtergrond inhoud</Label>
            <div className="flex items-center gap-2"><input type="color" value={settings.achtergrond_inhoud} onChange={e => onChange({ achtergrond_inhoud: e.target.value })} className="h-8 w-10 rounded border cursor-pointer" /><span className="text-xs text-gray-500">{settings.achtergrond_inhoud}</span></div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Standaard lettertype</Label>
            <Select value={settings.lettertype} onValueChange={v => onChange({ lettertype: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Inter','Outfit','Arial','Georgia'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Standaard tekstkleur</Label>
            <div className="flex items-center gap-2"><input type="color" value={settings.tekstkleur} onChange={e => onChange({ tekstkleur: e.target.value })} className="h-8 w-10 rounded border cursor-pointer" /><span className="text-xs text-gray-500">{settings.tekstkleur}</span></div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Uitschrijf-tekst</Label>
            <Textarea value={settings.unsubscribe_tekst} onChange={e => onChange({ unsubscribe_tekst: e.target.value })} rows={2} className="text-xs resize-none" />
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Lay-out / EXTRA shell</div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Standaard lay-out</Label>
              <Select value={settings.lay_out ?? 'extra'} onValueChange={v => onChange({ lay_out: v as 'extra' | 'geen' })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="extra">EXTRA huisstijl (header + footer)</SelectItem>
                  <SelectItem value="geen">Geen — alleen blokken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(settings.lay_out ?? 'extra') === 'extra' && (
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Footer tekst</Label>
                <input
                  type="text"
                  value={settings.footer_tekst ?? 'EXTRA · Herengracht 372 · Amsterdam'}
                  onChange={e => onChange({ footer_tekst: e.target.value })}
                  className="w-full h-8 text-xs px-2 rounded border border-gray-200"
                />
                <p className="text-[10px] text-gray-400 mt-1">De EXTRA banner-afbeelding wordt automatisch gebruikt — gelijk aan alle andere mails.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main EmailBuilderPage ────────────────────────────────────────────────────
type Campaign = {
  id: number; name: string; subject: string;
  contentA: string | null; contentB: string | null; htmlContent: string;
  abTestActief: boolean; abSplitPct: number;
  [key: string]: any;
};

export default function EmailBuilderPage({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const { toast } = useToast();

  // Parse initial content
  const [variantA, setVariantA] = useState<BuilderContent>(() => parseContent(campaign.contentA));
  const [variantB, setVariantB] = useState<BuilderContent>(() => {
    const b = parseContent(campaign.contentB);
    // If B is empty, copy from A
    if (b.blokken.length === 0 && campaign.abTestActief) {
      return parseContent(campaign.contentA);
    }
    return b;
  });
  const [activeVariant, setActiveVariant] = useState<'a' | 'b'>('a');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop');
  const [showModeConfirm, setShowModeConfirm] = useState<'html' | 'plaintext' | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('max@doehetextra.nl');
  const [unsaved, setUnsaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const content = activeVariant === 'a' ? variantA : variantB;
  const setContent = activeVariant === 'a' ? setVariantA : setVariantB;

  // Auto-save mutation
  const saveMut = useMutation({
    mutationFn: async ({ silent }: { silent?: boolean } = {}) => {
      // Generate HTML from contentA for htmlContent
      const body: any = {
        contentA: JSON.stringify(variantA),
      };
      if (campaign.abTestActief) body.contentB = JSON.stringify(variantB);
      return apiRequest('PUT', `/api/admin/prospect-campaigns/${campaign.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      setUnsaved(false);
      setLastSaved(new Date());
    },
    onError: () => toast({ title: 'Opslaan mislukt', variant: 'destructive' }),
  });

  const testEmailMut = useMutation({
    mutationFn: () => apiRequest('POST', `/api/admin/prospect-campaigns/${campaign.id}/send-test`, { email: testEmailAddress }),
    onSuccess: () => { setShowTestEmail(false); toast({ title: `Testmail verstuurd naar ${testEmailAddress}` }); },
    onError: () => toast({ title: 'Testmail mislukt', variant: 'destructive' }),
  });

  // Auto-save after 1.5s of inactivity
  const scheduleAutoSave = useCallback(() => {
    setUnsaved(true);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveMut.mutate({ silent: true }), 1500);
  }, [saveMut]);

  // Update content and schedule auto-save
  function update(patch: Partial<BuilderContent>) {
    setContent(prev => ({ ...prev, ...patch }));
    scheduleAutoSave();
  }

  function updateBlock(id: string, patch: Partial<BuilderBlock>) {
    update({ blokken: content.blokken.map(b => b.id === id ? { ...b, ...patch } as BuilderBlock : b) });
  }

  function addBlock(type: BuilderBlock['type']) {
    const newBlok = makeBlock(type);
    update({ blokken: [...content.blokken, newBlok] });
    setSelectedBlockId(newBlok.id);
  }

  function removeBlock(id: string) {
    update({ blokken: content.blokken.filter(b => b.id !== id) });
    setSelectedBlockId(null);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = content.blokken.findIndex(b => b.id === id);
    if (idx < 0) return;
    const next = [...content.blokken];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    update({ blokken: next });
  }

  function toggleModus(newModus: 'html' | 'plaintext') {
    if (newModus === content.modus) return;
    if (newModus === 'plaintext' && content.blokken.some(b => ['afbeelding','knop','handtekening'].includes(b.type))) {
      setShowModeConfirm(newModus);
    } else {
      update({ modus: newModus });
    }
  }

  function confirmModeSwitch() {
    if (!showModeConfirm) return;
    const filtered = content.blokken.filter(b => !['afbeelding','knop','handtekening'].includes(b.type));
    update({ modus: showModeConfirm, blokken: filtered });
    setShowModeConfirm(null);
  }

  const selectedBlock = content.blokken.find(b => b.id === selectedBlockId) ?? null;
  const isPlain = content.modus === 'plaintext';

  // Plain text blocks only
  const plainAllowedTypes: BuilderBlock['type'][] = ['aanhef', 'paragraaf', 'taalvariant', 'lijn', 'ruimte'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* ── Topbalk ── */}
      <div className="h-14 flex-shrink-0 border-b border-gray-200 flex items-center px-4 gap-3 bg-white shadow-sm">
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Terug
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800 text-sm truncate">{campaign.name}</p>
          <p className="text-xs text-gray-400 truncate">Onderwerp: {campaign.subject}</p>
        </div>

        {/* Modus toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => toggleModus('html')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${!isPlain ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
            HTML
          </button>
          <button onClick={() => toggleModus('plaintext')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${isPlain ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
            Plain text
          </button>
        </div>

        {/* A/B variant tabs */}
        {campaign.abTestActief && (
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
            <button onClick={() => setActiveVariant('a')}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors ${activeVariant === 'a' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Variant A
            </button>
            <button onClick={() => setActiveVariant('b')}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-colors ${activeVariant === 'b' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Variant B
            </button>
          </div>
        )}

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs">
          {saveMut.isPending ? (
            <><RefreshCw className="h-3 w-3 animate-spin text-gray-400" /><span className="text-gray-400">Opslaan...</span></>
          ) : unsaved ? (
            <><div className="w-2 h-2 rounded-full bg-orange-400" /><span className="text-orange-500">Niet opgeslagen</span></>
          ) : lastSaved ? (
            <><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-400">Opgeslagen om {lastSaved.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span></>
          ) : null}
        </div>

        {/* Test email */}
        <button onClick={() => setShowTestEmail(true)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-700 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-purple-300 transition-colors">
          <Mail className="h-3.5 w-3.5" />Testmail
        </button>

        {/* Preview */}
        <button onClick={() => setShowPreviewModal(true)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-700 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-purple-300 transition-colors">
          <Eye className="h-3.5 w-3.5" />Voorvertoning
        </button>

        {/* Save */}
        <Button size="sm" onClick={() => saveMut.mutate({})} disabled={saveMut.isPending} className="gap-1.5 bg-purple-600 hover:bg-purple-700 h-8 text-xs">
          <Save className="h-3.5 w-3.5" />Opslaan
        </Button>
      </div>

      {/* A/B info banner */}
      {campaign.abTestActief && (
        <div className="h-8 bg-purple-50 border-b border-purple-100 flex items-center justify-center gap-2 text-xs text-purple-600 flex-shrink-0">
          <span>A/B Test actief —</span>
          <span className="font-semibold text-purple-700">Variant A</span>
          <span>{campaign.abSplitPct}% ·</span>
          <span className="font-semibold text-blue-700">Variant B</span>
          <span>{100 - campaign.abSplitPct}% van de ontvangers</span>
        </div>
      )}

      {/* Plain text notice */}
      {isPlain && (
        <div className="h-8 bg-blue-50 border-b border-blue-100 flex items-center justify-center gap-2 text-xs text-blue-600 flex-shrink-0">
          <AlertCircle className="h-3.5 w-3.5" />
          Plain text mails komen persoonlijker over en hebben vaak een hogere open rate in B2B
        </div>
      )}

      {/* ── Main 3-panel layout ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
          <SettingsPanel settings={content.instellingen} onChange={p => update({ instellingen: { ...content.instellingen, ...p } })} />

          {/* Block list */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 flex items-center justify-between">
              Blokken ({content.blokken.length})
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {content.blokken.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400">Voeg blokken toe via het paneel hieronder</div>
                )}
                {content.blokken.map((blok, i) => {
                  const meta = BLOCK_TYPES.find(t => t.type === blok.type);
                  const Icon = meta?.icon ?? Type;
                  const isSelected = selectedBlockId === blok.id;
                  return (
                    <div key={blok.id} onClick={() => setSelectedBlockId(blok.id)}
                      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${isSelected ? 'bg-purple-100 text-purple-800' : 'hover:bg-white text-gray-700'}`}>
                      <Icon className="h-3 w-3 flex-shrink-0 text-gray-400" />
                      <span className="flex-1 truncate">{meta?.label || blok.type}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                        <button onClick={e => { e.stopPropagation(); moveBlock(blok.id, -1); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-500">↑</button>
                        <button onClick={e => { e.stopPropagation(); moveBlock(blok.id, 1); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-500">↓</button>
                        <button onClick={e => { e.stopPropagation(); removeBlock(blok.id); }} className="p-0.5 rounded hover:bg-red-100 text-red-400"><X className="h-2.5 w-2.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Add blocks */}
          <div className="border-t border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Blok toevoegen</p>
            <div className="grid grid-cols-2 gap-1">
              {BLOCK_TYPES.filter(t => !isPlain || plainAllowedTypes.includes(t.type)).map(bt => (
                <button key={bt.type} onClick={() => addBlock(bt.type)}
                  className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-700 text-gray-600 transition-colors border border-transparent hover:border-purple-100">
                  <bt.icon className="h-3 w-3" />{bt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-100 overflow-auto relative">
          {/* Preview toggle */}
          <div className="sticky top-0 z-10 flex justify-center py-3 bg-gray-100/80 backdrop-blur-sm gap-2">
            <button onClick={() => setPreview('desktop')} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${preview === 'desktop' ? 'bg-white border-purple-300 text-purple-700 shadow-sm' : 'border-gray-300 text-gray-500 hover:bg-white'}`}>
              <Monitor className="h-3 w-3" />Desktop
            </button>
            <button onClick={() => setPreview('mobile')} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${preview === 'mobile' ? 'bg-white border-purple-300 text-purple-700 shadow-sm' : 'border-gray-300 text-gray-500 hover:bg-white'}`}>
              <Smartphone className="h-3 w-3" />Mobiel
            </button>
          </div>

          <div className="flex justify-center pb-8">
            <div style={{
              width: preview === 'desktop' ? '600px' : '375px',
              background: content.instellingen.achtergrond_inhoud,
              borderRadius: '8px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              fontFamily: content.instellingen.lettertype + ',sans-serif',
              color: content.instellingen.tekstkleur,
              padding: '32px 28px',
              minHeight: '400px',
            }}>
              {isPlain ? (
                // Plain text preview
                <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {content.blokken.map(blok => {
                    if (blok.type === 'paragraaf') return blok.tekst;
                    if (blok.type === 'koptekst') return `\n${blok.tekst.toUpperCase()}\n`;
                    if (blok.type === 'aanhef') return blok.nl;
                    if (blok.type === 'taalvariant') return blok.nl;
                    if (blok.type === 'lijn') return '---';
                    if (blok.type === 'ruimte') return '\n';
                    return '';
                  }).filter(Boolean).join('\n\n')}
                  {'\n\n---\n' + content.instellingen.unsubscribe_tekst + ': [uitschrijflink]'}
                </pre>
              ) : (
                // HTML preview
                <div className="space-y-2">
                  {content.blokken.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      <Mail className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      Voeg blokken toe via het linkerpaneel
                    </div>
                  )}
                  {content.blokken.map(blok => (
                    <div key={blok.id} className="relative group">
                      {/* Quick actions overlay on hover */}
                      <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 flex flex-col gap-0.5 transition-opacity z-10">
                        <button onClick={() => moveBlock(blok.id, -1)} className="bg-white border border-gray-200 shadow-sm rounded p-0.5 text-gray-400 hover:text-gray-700 text-[10px]">↑</button>
                        <button onClick={() => moveBlock(blok.id, 1)} className="bg-white border border-gray-200 shadow-sm rounded p-0.5 text-gray-400 hover:text-gray-700 text-[10px]">↓</button>
                        <button onClick={() => removeBlock(blok.id)} className="bg-white border border-red-200 shadow-sm rounded p-0.5 text-red-300 hover:text-red-600 text-[10px]"><X className="h-2.5 w-2.5" /></button>
                      </div>
                      <BlockPreview blok={blok} selected={selectedBlockId === blok.id} onClick={() => setSelectedBlockId(blok.id)} />
                    </div>
                  ))}
                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-[11px] text-gray-400 text-center">{content.instellingen.unsubscribe_tekst}</p>
                    <p className="text-[11px] text-gray-300 text-center mt-1">© EXTRA | doehetextra.nl</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: block properties */}
        <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          {selectedBlock ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {BLOCK_TYPES.find(t => t.type === selectedBlock.type)?.label ?? selectedBlock.type}
                </p>
                <button onClick={() => setSelectedBlockId(null)} className="text-gray-300 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <BlockProperties blok={selectedBlock} onChange={patch => updateBlock(selectedBlock.id, patch)} />
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => removeBlock(selectedBlock.id)} className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors">
                    <Trash2 className="h-3 w-3" />Blok verwijderen
                  </button>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlignLeft className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Selecteer een blok</p>
                <p className="text-xs text-gray-300 mt-1">Klik op een blok in het canvas of de lijst om het te bewerken</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mode switch confirmation ── */}
      <AlertDialog open={!!showModeConfirm} onOpenChange={v => !v && setShowModeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wisselen naar plain text?</AlertDialogTitle>
            <AlertDialogDescription>
              Opmaakblokken (afbeeldingen, knoppen, handtekening) worden verwijderd uit de inhoud. Tekst- en aanhefblokken blijven behouden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={confirmModeSwitch} className="bg-purple-600 hover:bg-purple-700">Wisselen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Preview modal ── */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Voorvertoning — {campaign.name}</DialogTitle>
          </DialogHeader>
          <div className="bg-gray-100 rounded-xl p-4">
            <div style={{
              maxWidth: '600px',
              margin: '0 auto',
              background: content.instellingen.achtergrond_inhoud,
              borderRadius: '8px',
              padding: '32px 28px',
              fontFamily: content.instellingen.lettertype + ',sans-serif',
              color: content.instellingen.tekstkleur,
            }}>
              {content.blokken.map(blok => (
                <div key={blok.id} className="mb-3">
                  <BlockPreview blok={blok} selected={false} onClick={() => {}} />
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-xs text-gray-400 text-center">{content.instellingen.unsubscribe_tekst}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPreviewModal(false)}>Sluiten</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Test email modal ── */}
      <Dialog open={showTestEmail} onOpenChange={setShowTestEmail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Testmail versturen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Stuur testmail naar:</Label>
              <Input value={testEmailAddress} onChange={e => setTestEmailAddress(e.target.value)} placeholder="email@bedrijf.nl" type="email" />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              De testmail wordt verstuurd met het onderwerp: <strong>[TEST] {campaign.subject}</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTestEmail(false)}>Annuleren</Button>
            <Button onClick={() => testEmailMut.mutate()} disabled={testEmailMut.isPending || !testEmailAddress} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
              {testEmailMut.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Stuur testmail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
