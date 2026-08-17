import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { queryClient, apiRequest, fetchJson, fetchJsonList } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FUNCTIEGROEPEN } from "@shared/schema";
import EmailBuilderPage from "@/components/EmailBuilderPage";
import FlowBuilderPage from "@/components/FlowBuilderPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail, Plus, Trash2, Send, Users, FileText, BarChart2, ChevronRight, Pencil,
  AlertTriangle, RefreshCw, Search, Eye, MousePointer, CheckCircle, Clock, X,
  Megaphone, MailOpen, MoreVertical, ImageIcon, Play, Square, Copy, Rocket,
  ArrowLeft, ArrowRight, SlidersHorizontal, Calendar, Timer, FlaskConical,
  Zap, TrendingUp, Tag, ChevronDown, ChevronUp, UserMinus, ExternalLink,
  CalendarClock, BanIcon, Hourglass, SendHorizontal,
  // Blok 3
  CheckCircle2, MessageSquare, Flag, Reply, Inbox,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Campaign = {
  id: number; name: string; subject: string;
  campagneType: string; // bulk | flow
  status: string; // concept | gepland | actief | voltooid | gestopt | draft | sent | scheduled
  brancheFilter: string[]; functieFilter: string[];
  typeFilter: string; taalFilter: string; tagFilter: string;
  phaseFilter: string[] | null;
  editorBlocks: string | null; contentA: string | null; contentB: string | null;
  htmlContent: string; textContent: string | null;
  scheduledAt: string | null; sentAt: string | null;
  werkelijkVerzendOp: string | null; verzendDirect: boolean | null; tijdzone: string | null;
  sentCount: number; failedCount: number; openCount: number; clickCount: number;
  // Blok 3 — aggregated tellers vanuit SendGrid Event-webhook
  deliveredCount?: number | null; bounceCount?: number | null; spamCount?: number | null; replyCount?: number | null;
  abTestActief: boolean; abSplitPct: number; abWinnaarOp: string; abWinnaarNaUren: number;
  abWinnaarVariant: string | null; abWinnaarBepaaldOp: string | null; abTestFase: string | null;
  alleenWerkdagen: boolean; tijdvensterStart: string; tijdvensterEind: string;
  verzendDagen: number[] | null; verzendSlots: Array<{ dag: number; tijd: string }> | null;
  serie: string | null; serieStapNr: number | null;
  createdAt: string; updatedAt: string;
};

// Blok 2: vaste preset voor de banqueting jaarcampagne (di 14:30 + wo 10:30 Amsterdam)
const JAARCAMPAGNE_DAGEN: number[] = [2, 3];
const JAARCAMPAGNE_SLOTS: Array<{ dag: number; tijd: string }> = [
  { dag: 2, tijd: '14:30' },
  { dag: 3, tijd: '10:30' },
];
type Recipient = {
  id: number; campaignId: number; email: string; name: string | null;
  company: string | null; functieTags: string[]; status: string;
  sentAt: string | null; errorMessage: string | null;
  openedAt: string | null; clickedAt: string | null; trackingToken: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const BRANCHES = ['Hotel', 'Restaurant', 'Cateraar', 'Evenementenlocatie', 'Logistiek'] as const;

const STATUS_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  concept: { label: 'Concept', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  draft:   { label: 'Concept', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  gepland: { label: 'Gepland', cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  scheduled:{ label: 'Gepland', cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  actief:  { label: 'Actief', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  voltooid:{ label: 'Voltooid', cls: 'bg-slate-200 text-slate-600', dot: 'bg-slate-500' },
  sent:    { label: 'Verzonden', cls: 'bg-slate-200 text-slate-600', dot: 'bg-slate-500' },
  gestopt: { label: 'Gestopt', cls: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
};

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  bulk: { label: 'Bulk', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
  flow: { label: 'Flow', cls: 'bg-purple-50 text-purple-600 border border-purple-200' },
};

// ─── Tag pill component ───────────────────────────────────────────────────────
function TagPill({ label, color = "purple", onRemove }: { label: string; color?: string; onRemove?: () => void }) {
  const colors: Record<string, string> = {
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.purple}`}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity ml-0.5">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

// ─── Tag input component ──────────────────────────────────────────────────────
function TagInput({ value, onChange, suggestions = [], placeholder, color = "purple" }: {
  value: string[]; onChange: (v: string[]) => void;
  suggestions?: string[]; placeholder?: string; color?: string;
}) {
  const [input, setInput] = useState("");
  const [showSugg, setShowSugg] = useState(false);
  const filtered = suggestions.filter(s => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()));
  function add(tag: string) { const t = tag.trim(); if (t && !value.includes(t)) onChange([...value, t]); setInput(""); setShowSugg(false); }
  function remove(tag: string) { onChange(value.filter(t => t !== tag)); }
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 min-h-[36px] border border-input rounded-md px-2 py-1 bg-background focus-within:ring-1 focus-within:ring-ring">
        {value.map(t => <TagPill key={t} label={t} color={color} onRemove={() => remove(t)} />)}
        <input value={input} onChange={e => { setInput(e.target.value); setShowSugg(true); }}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); add(input); } if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]); }}
          onFocus={() => setShowSugg(true)} onBlur={() => setTimeout(() => setShowSugg(false), 150)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent" />
      </div>
      {showSugg && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-auto">
          {filtered.map(s => (
            <button key={s} onMouseDown={() => add(s)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors">{s}</button>
          ))}
          {input.trim() && !suggestions.includes(input.trim()) && (
            <button onMouseDown={() => add(input)}
              className="w-full text-left px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors border-t border-slate-100">
              + Voeg "{input.trim()}" toe
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Visual Email Editor ──────────────────────────────────────────────────────
type Block =
  | { type: 'heading'; text: string; align: 'left' | 'center' | 'right' }
  | { type: 'text'; text: string }
  | { type: 'button'; label: string; url: string; color: string }
  | { type: 'spacer'; height: number }
  | { type: 'divider' }
  | { type: 'image'; url: string; alt: string };

function defaultBlock(type: Block['type']): Block {
  if (type === 'heading') return { type, text: 'Kopregel', align: 'left' };
  if (type === 'text') return { type, text: 'Schrijf hier je tekst. Gebruik {{naam}} en {{bedrijf}} voor personalisatie.' };
  if (type === 'button') return { type, label: 'Meer informatie', url: '{{klik_link}}', color: '#7c3aed' };
  if (type === 'spacer') return { type, height: 24 };
  if (type === 'divider') return { type };
  return { type: 'image', url: '', alt: '' };
}

export function blocksToHtml(blocks: Block[]): string {
  const bodyStyle = 'font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px 24px';
  const inner = blocks.map(b => {
    if (b.type === 'heading') return `<h2 style="font-size:22px;font-weight:700;color:#1e1b4b;margin:0 0 12px;text-align:${b.align}">${b.text}</h2>`;
    if (b.type === 'text') return `<p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 12px">${b.text.replace(/\n/g, '<br/>')}</p>`;
    if (b.type === 'button') return `<div style="text-align:center;margin:20px 0"><a href="${b.url}" style="background:${b.color};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">${b.label}</a></div>`;
    if (b.type === 'spacer') return `<div style="height:${b.height}px"></div>`;
    if (b.type === 'divider') return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>`;
    if (b.type === 'image' && b.url) return `<img src="${b.url}" alt="${b.alt}" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 12px"/>`;
    return '';
  }).join('\n');
  return `<div style="${bodyStyle}">\n${inner}\n<p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:32px">© EXTRA | doehetextra.nl</p>\n</div>`;
}

function EmailEditor({ blocks, onChange }: { blocks: Block[]; onChange: (b: Block[]) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  function update(i: number, patch: Partial<Block>) { onChange(blocks.map((b, idx) => idx === i ? { ...b, ...patch } as Block : b)); }
  function remove(i: number) { onChange(blocks.filter((_, idx) => idx !== i)); setSelected(null); }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks]; [next[i], next[j]] = [next[j], next[i]]; onChange(next); setSelected(j);
  }
  function addBlock(type: Block['type']) { onChange([...blocks, defaultBlock(type)]); setSelected(blocks.length); }
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, i: number) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => update(i, { url: ev.target?.result as string });
    reader.readAsDataURL(file);
  }
  const ADD_BLOCKS: { type: Block['type']; label: string }[] = [
    { type: 'heading', label: 'Koptekst' }, { type: 'text', label: 'Paragraaf' },
    { type: 'button', label: 'Knop' }, { type: 'divider', label: 'Lijn' },
    { type: 'spacer', label: 'Ruimte' }, { type: 'image', label: 'Afbeelding' },
  ];
  return (
    <div className="flex gap-4" style={{ minHeight: '380px', height: '100%' }}>
      <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-auto p-4">
        <div className="max-w-[520px] mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-1">
          {blocks.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">Voeg blokken toe via het paneel rechts →</div>}
          {blocks.map((block, i) => (
            <div key={i} onClick={() => setSelected(i)}
              className={`relative group rounded-lg transition-all ${selected === i ? 'ring-2 ring-purple-500 ring-offset-1' : 'hover:ring-1 hover:ring-slate-300'}`}>
              <div className={`absolute -top-3 right-2 flex gap-1 z-10 ${selected === i ? 'flex' : 'hidden group-hover:flex'}`}>
                <button onClick={e => { e.stopPropagation(); move(i, -1); }} className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50 shadow-sm">↑</button>
                <button onClick={e => { e.stopPropagation(); move(i, 1); }} className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50 shadow-sm">↓</button>
                <button onClick={e => { e.stopPropagation(); remove(i); }} className="bg-white border border-red-200 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-50 shadow-sm"><X className="h-2.5 w-2.5" /></button>
              </div>
              <div className="p-2">
                {block.type === 'heading' && <input type="text" value={block.text} onChange={e => update(i, { text: e.target.value })} onFocus={() => setSelected(i)} style={{ textAlign: block.align }} className="w-full font-bold text-slate-800 text-lg border-none outline-none bg-transparent cursor-text placeholder:text-slate-300" placeholder="Kopregel..." />}
                {block.type === 'text' && <textarea value={block.text} onChange={e => update(i, { text: e.target.value })} onFocus={() => setSelected(i)} rows={Math.max(2, (block.text.match(/\n/g) || []).length + 2)} className="w-full text-sm text-slate-600 leading-relaxed resize-none border-none outline-none bg-transparent cursor-text placeholder:text-slate-300" placeholder="Schrijf je tekst hier..." />}
                {block.type === 'button' && <div className="text-center py-2"><span className="text-white text-sm font-semibold px-6 py-2.5 rounded-lg inline-block" style={{ background: block.color }}>{block.label}</span></div>}
                {block.type === 'divider' && <hr className="border-slate-200 my-2" />}
                {block.type === 'spacer' && <div style={{ height: Math.min(block.height, 40) }} className="bg-slate-50 rounded border border-dashed border-slate-200 text-center text-xs text-slate-300 flex items-center justify-center">{block.height}px</div>}
                {block.type === 'image' && (block.url ? (
                  <div className="relative group/img">
                    <img src={block.url} alt={block.alt} className="max-w-full rounded-lg mx-auto block" />
                    <button onClick={e => { e.stopPropagation(); update(i, { url: '' }); }} className="absolute top-1 right-1 bg-white border border-red-200 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-50 shadow-sm opacity-0 group-hover/img:opacity-100 transition-opacity"><X className="h-2.5 w-2.5" /></button>
                  </div>
                ) : (
                  <label className="bg-slate-100 rounded-lg h-28 flex flex-col items-center justify-center text-slate-400 text-sm cursor-pointer hover:bg-purple-50 hover:text-purple-500 transition-colors gap-2 border-2 border-dashed border-slate-200 hover:border-purple-300" onClick={e => e.stopPropagation()}>
                    <ImageIcon className="h-6 w-6" /><span className="text-xs font-medium">Klik om afbeelding te uploaden</span><span className="text-xs text-slate-300">JPG, PNG, GIF, WebP</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { setSelected(i); handleImageUpload(e, i); }} />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-56 flex-shrink-0 space-y-3 overflow-y-auto">
        {selected !== null && blocks[selected] && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Eigenschappen</p>
            {(() => {
              const b = blocks[selected];
              if (b.type === 'heading') return (
                <div><Label className="text-xs text-slate-500">Uitlijning</Label>
                  <div className="flex gap-1 mt-0.5">{(['left','center','right'] as const).map(a => (
                    <button key={a} onClick={() => update(selected, { align: a })} className={`flex-1 text-xs py-1 rounded border transition-colors ${b.align === a ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-slate-200 text-slate-500'}`}>{a === 'left' ? '← L' : a === 'center' ? '| M' : 'R →'}</button>
                  ))}</div>
                </div>
              );
              if (b.type === 'text') return <p className="text-xs text-slate-400 leading-relaxed">Klik op de tekst in de editor om direct te typen.<br />Gebruik <code className="bg-slate-100 px-1 rounded">{"{{naam}}"}</code> en <code className="bg-slate-100 px-1 rounded">{"{{bedrijf}}"}</code> voor personalisatie.</p>;
              if (b.type === 'button') return (<>
                <div><Label className="text-xs text-slate-500">Label</Label><Input value={b.label} onChange={e => update(selected, { label: e.target.value })} className="h-7 text-sm mt-0.5" /></div>
                <div><Label className="text-xs text-slate-500">URL</Label><Input value={b.url} onChange={e => update(selected, { url: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="https://..." /></div>
                <div><Label className="text-xs text-slate-500">Kleur</Label><div className="flex items-center gap-2 mt-0.5"><input type="color" value={b.color} onChange={e => update(selected, { color: e.target.value })} className="h-7 w-10 rounded border border-slate-200 cursor-pointer" /><span className="text-xs text-slate-500">{b.color}</span></div></div>
              </>);
              if (b.type === 'spacer') return <div><Label className="text-xs text-slate-500">Hoogte (px)</Label><Input type="number" value={b.height} onChange={e => update(selected, { height: parseInt(e.target.value) || 16 })} className="h-7 text-sm mt-0.5" min={4} max={120} /></div>;
              if (b.type === 'image') return (<>
                {!b.url && <div><Label className="text-xs text-slate-500">Of voer URL in</Label><Input value={b.url} onChange={e => update(selected, { url: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="https://..." /></div>}
                <div><Label className="text-xs text-slate-500">Alt-tekst</Label><Input value={b.alt} onChange={e => update(selected, { alt: e.target.value })} className="h-7 text-sm mt-0.5" placeholder="Beschrijving…" /></div>
                {b.url && <button onClick={() => update(selected, { url: '' })} className="w-full text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg py-1 hover:bg-red-50 transition-colors">Afbeelding verwijderen</button>}
              </>);
              return null;
            })()}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Blok toevoegen</p>
          <div className="space-y-1">
            {ADD_BLOCKS.map(({ type, label }) => (
              <button key={type} onClick={() => addBlock(type)} className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition-colors flex items-center gap-2">
                <Plus className="h-3 w-3" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center mb-6">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done ? 'bg-purple-600 text-white' : active ? 'bg-purple-600 text-white ring-4 ring-purple-100' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : n}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? 'text-purple-700' : done ? 'text-purple-500' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 mb-4 transition-colors ${done ? 'bg-purple-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Campaign Wizard ──────────────────────────────────────────────────────────
type WizardData = {
  name: string; subject: string; campagneType: 'bulk' | 'flow';
  brancheFilter: string[]; functieFilter: string[]; typeFilter: string; taalFilter: string; tagFilter: string[];
  // Blok 1: pijplijn-fase
  phaseFilter: string[];
  verzendMode: 'direct' | 'gepland'; verzendOp: string;
  alleenWerkdagen: boolean; tijdvensterStart: string; tijdvensterEind: string;
  abTestActief: boolean; abSplitPct: number; abWinnaarOp: string; abWinnaarNaUren: number;
};

const EMPTY_WIZARD: WizardData = {
  name: '', subject: '', campagneType: 'bulk',
  brancheFilter: [], functieFilter: [], typeFilter: 'alles', taalFilter: 'alles', tagFilter: [],
  phaseFilter: [],
  verzendMode: 'direct', verzendOp: '',
  alleenWerkdagen: true, tijdvensterStart: '08:00', tijdvensterEind: '18:00',
  abTestActief: false, abSplitPct: 50, abWinnaarOp: 'open_rate', abWinnaarNaUren: 24,
};

// Pijplijn-fases (Blok 1) — moet matchen met server-side whitelist
const WIZARD_PHASES = [
  { value: 'nieuw',       label: 'Nieuw' },
  { value: 'in_campagne', label: 'In campagne' },
  { value: 'in_gesprek',  label: 'In gesprek' },
  { value: 'klant',       label: 'Klant' },
  { value: 'uitgesloten', label: 'Uitgesloten' },
];

/**
 * Doelgroep aanpassen ná het aanmaken van een campagne.
 *
 * Tot augustus 2026 kon de doelgroep alleen in de aanmaakwizard worden bepaald.
 * Daarna stond hij vast: het overzicht toonde de filters als platte tekst en er
 * was geen weg terug. In de praktijk wil je juist ná het schrijven van de mail
 * nog schuiven — een branche erbij, een fase eraf.
 *
 * Bewust dezelfde chips als in de wizard, zodat het één ding blijft dat je op
 * twee plekken tegenkomt in plaats van twee dingen die op elkaar lijken.
 */
function DoelgroepDialog({ campaign, open, onClose }: {
  campaign: Campaign; open: boolean; onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: uniqueTags = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/prospect-contacts/unique-tags'],
    enabled: open,
  });

  const [typeFilter, setTypeFilter] = useState('alles');
  const [taalFilter, setTaalFilter] = useState('alles');
  const [brancheFilter, setBrancheFilter] = useState<string[]>([]);
  const [functieFilter, setFunctieFilter] = useState<string[]>([]);
  const [phaseFilter, setPhaseFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [count, setCount] = useState<number | null>(null);

  // Bij openen: de opgeslagen filters inladen. Niet bij elke render, anders
  // overschrijft de server-state wat de gebruiker net heeft aangeklikt.
  useEffect(() => {
    if (!open) return;
    setTypeFilter(campaign.typeFilter || 'alles');
    setTaalFilter(campaign.taalFilter || 'alles');
    setBrancheFilter(Array.isArray(campaign.brancheFilter) ? campaign.brancheFilter : []);
    setFunctieFilter(Array.isArray(campaign.functieFilter) ? campaign.functieFilter : []);
    setPhaseFilter(Array.isArray(campaign.phaseFilter) ? campaign.phaseFilter : []);
    try { setTagFilter(JSON.parse(campaign.tagFilter || '[]')); } catch { setTagFilter([]); }
  }, [open, campaign.id]);

  // Live telling, zodat je ziet wat een klik doet vóórdat je opslaat.
  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams();
    if (brancheFilter.length > 0) params.set('branche_filter', JSON.stringify(brancheFilter));
    if (functieFilter.length > 0) params.set('functie_filter', JSON.stringify(functieFilter));
    params.set('type_filter', typeFilter);
    params.set('taal_filter', taalFilter);
    if (tagFilter.length > 0) params.set('tag_filter', JSON.stringify(tagFilter));
    if (phaseFilter.length > 0) params.set('phase_filter', JSON.stringify(phaseFilter));
    let afgebroken = false;
    fetchJson<{ count: number }>(`/api/admin/prospect-campaigns/segment-count?${params}`)
      .then(r => { if (!afgebroken) setCount(r.count); })
      .catch(() => { if (!afgebroken) setCount(null); });
    return () => { afgebroken = true; };
  }, [open, typeFilter, taalFilter, brancheFilter, functieFilter, phaseFilter, tagFilter]);

  const opslaan = useMutation({
    mutationFn: () => apiRequest(`/api/admin/prospect-campaigns/${campaign.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        typeFilter, taalFilter, brancheFilter, functieFilter, phaseFilter,
        tagFilter: JSON.stringify(tagFilter),
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      toast({ title: 'Doelgroep bijgewerkt' });
      onClose();
    },
    onError: () => toast({ title: 'Opslaan mislukt', variant: 'destructive' }),
  });

  const chip = (actief: boolean, kleur: string) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${actief ? kleur : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Doelgroep aanpassen</DialogTitle>
          <DialogDescription>
            Bepaalt wie deze campagne krijgt. Handmatig toegevoegde contacten blijven staan,
            ook als ze buiten deze filters vallen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Label className="text-sm font-medium mb-2 block">Contacttype</Label>
            <div className="flex gap-2">
              {[{ v: 'alles', label: 'Iedereen' }, { v: 'prospect', label: 'Alleen prospects' }, { v: 'klant', label: 'Alleen klanten' }].map(opt => (
                <button key={opt.v} type="button" onClick={() => setTypeFilter(opt.v)}
                  className={chip(typeFilter === opt.v, 'bg-purple-100 border-purple-300 text-purple-700')}
                  data-testid={`btn-doelgroep-type-${opt.v}`}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Branche <span className="text-gray-400 font-normal">(leeg = alle branches)</span></Label>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map(b => (
                <button key={b} type="button"
                  onClick={() => setBrancheFilter(v => v.includes(b) ? v.filter(x => x !== b) : [...v, b])}
                  className={chip(brancheFilter.includes(b), 'bg-blue-100 border-blue-300 text-blue-700')}>{b}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Pijplijn-fase <span className="text-gray-400 font-normal">(leeg = alle fases)</span></Label>
            <div className="flex flex-wrap gap-2">
              {WIZARD_PHASES.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setPhaseFilter(v => v.includes(p.value) ? v.filter(x => x !== p.value) : [...v, p.value])}
                  className={chip(phaseFilter.includes(p.value), 'bg-amber-100 border-amber-300 text-amber-700')}>{p.label}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Functiegroep <span className="text-gray-400 font-normal">(leeg = alle functies)</span></Label>
            <div className="flex flex-wrap gap-2">
              {FUNCTIEGROEPEN.map(g => (
                <button key={g} type="button"
                  onClick={() => setFunctieFilter(v => v.includes(g) ? v.filter(x => x !== g) : [...v, g])}
                  className={chip(functieFilter.includes(g), 'bg-purple-100 border-purple-300 text-purple-700')}>{g}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Voertaal</Label>
            <div className="flex gap-2">
              {['alles', 'Nederlands', 'Engels', 'Anders'].map(t => (
                <button key={t} type="button" onClick={() => setTaalFilter(t)}
                  className={chip(taalFilter === t, 'bg-purple-100 border-purple-300 text-purple-700')}>
                  {t === 'alles' ? 'Iedereen' : t}
                </button>
              ))}
            </div>
          </div>

          {uniqueTags.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Tags <span className="text-gray-400 font-normal">(leeg = geen tagfilter)</span></Label>
              <div className="flex flex-wrap gap-2">
                {uniqueTags.map(t => (
                  <button key={t} type="button"
                    onClick={() => setTagFilter(v => v.includes(t) ? v.filter(x => x !== t) : [...v, t])}
                    className={chip(tagFilter.includes(t), 'bg-orange-100 border-orange-300 text-orange-700')}>
                    <Tag className="h-3 w-3 inline mr-1" />{t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-purple-50 border border-purple-100 px-3 py-2 text-sm">
            <span className="text-slate-500">Deze filters raken nu </span>
            <span className="font-semibold text-purple-700">{count === null ? '…' : count}</span>
            <span className="text-slate-500"> contact{count === 1 ? '' : 'en'}.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" disabled={opslaan.isPending}
            onClick={() => opslaan.mutate()} data-testid="btn-doelgroep-opslaan">
            {opslaan.isPending ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CampaignWizard({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (campaign: Campaign) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({ ...EMPTY_WIZARD });
  const [segmentCount, setSegmentCount] = useState<number | null>(null);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: uniqueTags = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/prospect-contacts/unique-tags'],
  });

  const set = useCallback((k: keyof WizardData, v: any) => setData(d => ({ ...d, [k]: v })), []);

  // Live segment count with debounce
  const fetchCount = useCallback(async () => {
    setSegmentLoading(true);
    try {
      const params = new URLSearchParams();
      if (data.brancheFilter.length > 0) params.set('branche_filter', JSON.stringify(data.brancheFilter));
      if (data.functieFilter.length > 0) params.set('functie_filter', JSON.stringify(data.functieFilter));
      params.set('type_filter', data.typeFilter);
      params.set('taal_filter', data.taalFilter);
      if (data.tagFilter.length > 0) params.set('tag_filter', JSON.stringify(data.tagFilter));
      if (data.phaseFilter.length > 0) params.set('phase_filter', JSON.stringify(data.phaseFilter));
      const res = await fetch(`/api/admin/prospect-campaigns/segment-count?${params}`, { credentials: 'include' });
      const { count } = await res.json();
      setSegmentCount(count ?? 0);
    } catch {
      setSegmentCount(0);
    } finally {
      setSegmentLoading(false);
    }
  }, [data.brancheFilter, data.functieFilter, data.typeFilter, data.taalFilter, data.tagFilter, data.phaseFilter]);

  useEffect(() => {
    if (step === 2) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchCount, 400);
    }
  }, [step, fetchCount]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiRequest('POST', '/api/admin/prospect-campaigns', payload),
    onSuccess: (campaign: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      toast({ title: `Campagne '${campaign.name}' aangemaakt ✓` });
      onCreated(campaign);
      setData({ ...EMPTY_WIZARD });
      setStep(1);
    },
    onError: (e: any) => toast({ title: e.message || 'Fout bij aanmaken', variant: 'destructive' }),
  });

  function handleCreate() {
    createMutation.mutate({
      name: data.name, subject: data.subject, campagneType: data.campagneType,
      brancheFilter: data.brancheFilter, functieFilter: data.functieFilter,
      typeFilter: data.typeFilter, taalFilter: data.taalFilter,
      tagFilter: data.tagFilter,
      phaseFilter: data.phaseFilter,
      status: 'concept',
      alleenWerkdagen: data.alleenWerkdagen,
      tijdvensterStart: data.tijdvensterStart, tijdvensterEind: data.tijdvensterEind,
      scheduledAt: data.verzendMode === 'gepland' && data.verzendOp ? data.verzendOp : null,
      abTestActief: data.abTestActief, abSplitPct: data.abSplitPct,
      abWinnaarOp: data.abWinnaarOp, abWinnaarNaUren: data.abWinnaarNaUren,
    });
  }

  function handleClose() { onClose(); setData({ ...EMPTY_WIZARD }); setStep(1); }

  const canNext1 = data.name.trim() && data.subject.trim();

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Nieuwe campagne aanmaken</DialogTitle>
        </DialogHeader>

        <StepBar step={step} labels={['Basisgegevens', 'Doelgroep', 'Verzendopties']} />

        {/* ── Step 1: Basisgegevens ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium">Campagnenaam *</Label>
              <Input value={data.name} onChange={e => set('name', e.target.value)} placeholder="Hotels April 2026" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Onderwerpregel *</Label>
              <Input value={data.subject} onChange={e => set('subject', e.target.value)} placeholder="Flexibel horeca-personeel voor {{bedrijf}}" className="mt-1" />
              <p className="text-xs text-gray-400 mt-1">Gebruik <code className="bg-gray-100 px-1 rounded">{'{{voornaam}}'}</code> en <code className="bg-gray-100 px-1 rounded">{'{{bedrijf}}'}</code> voor personalisatie</p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-3 block">Campagnetype</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'bulk', label: 'Eenmalige campagne', desc: 'Eenmalig versturen naar doelgroep', icon: Send },
                  { v: 'flow', label: 'Geautomatiseerde flow', desc: 'Automatisch op basis van triggers', icon: Zap },
                ].map(opt => (
                  <button key={opt.v} onClick={() => set('campagneType', opt.v as 'bulk' | 'flow')}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${data.campagneType === opt.v ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <opt.icon className={`h-5 w-5 mb-2 ${data.campagneType === opt.v ? 'text-purple-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-semibold ${data.campagneType === opt.v ? 'text-purple-700' : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Doelgroep ── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Contacttype */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Contacttype</Label>
              <div className="flex gap-2">
                {[
                  { v: 'alles', label: 'Iedereen' },
                  { v: 'prospect', label: 'Alleen prospects' },
                  { v: 'klant', label: 'Alleen klanten' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => set('typeFilter', opt.v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${data.typeFilter === opt.v ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Branche */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Branche <span className="text-gray-400 font-normal">(leeg = alle branches)</span></Label>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map(b => (
                  <button key={b} onClick={() => {
                    const has = data.brancheFilter.includes(b);
                    set('brancheFilter', has ? data.brancheFilter.filter(x => x !== b) : [...data.brancheFilter, b]);
                  }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${data.brancheFilter.includes(b) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Pijplijn-fase */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Pijplijn-fase <span className="text-gray-400 font-normal">(leeg = alle fases)</span></Label>
              <div className="flex flex-wrap gap-2">
                {WIZARD_PHASES.map(p => {
                  const has = data.phaseFilter.includes(p.value);
                  return (
                    <button key={p.value} type="button"
                      onClick={() => set('phaseFilter', has ? data.phaseFilter.filter(x => x !== p.value) : [...data.phaseFilter, p.value])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${has ? 'bg-amber-100 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                      data-testid={`button-wizard-phase-${p.value}`}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Functiegroep — bron van waarheid (gekoppeld aan veld op contact) */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Functiegroep <span className="text-gray-400 font-normal">(leeg = alle functies)</span></Label>
              <div className="flex flex-wrap gap-2">
                {FUNCTIEGROEPEN.map(g => {
                  const has = data.functieFilter.includes(g);
                  return (
                    <button key={g} type="button"
                      onClick={() => set('functieFilter', has ? data.functieFilter.filter(x => x !== g) : [...data.functieFilter, g])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${has ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                      data-testid={`button-wizard-functiegroep-${g}`}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voertaal */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Voertaal</Label>
              <div className="flex gap-2">
                {['alles', 'Nederlands', 'Engels', 'Anders'].map(t => (
                  <button key={t} onClick={() => set('taalFilter', t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${data.taalFilter === t ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {t === 'alles' ? 'Iedereen' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {uniqueTags.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Tags <span className="text-gray-400 font-normal">(leeg = geen tagfilter)</span></Label>
                <div className="flex flex-wrap gap-2">
                  {uniqueTags.map(t => (
                    <button key={t} onClick={() => {
                      const has = data.tagFilter.includes(t);
                      set('tagFilter', has ? data.tagFilter.filter(x => x !== t) : [...data.tagFilter, t]);
                    }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${data.tagFilter.includes(t) ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      <Tag className="h-3 w-3 inline mr-1" />{t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live segment count */}
            <div className={`rounded-xl p-4 flex items-center gap-3 ${segmentCount === 0 ? 'bg-orange-50 border border-orange-200' : 'bg-purple-50 border border-purple-200'}`}>
              <Mail className={`h-5 w-5 flex-shrink-0 ${segmentCount === 0 ? 'text-orange-500' : 'text-purple-600'}`} />
              <div>
                {segmentLoading ? (
                  <p className="text-sm font-medium text-gray-500">Tellen...</p>
                ) : segmentCount === 0 ? (
                  <>
                    <p className="text-sm font-semibold text-orange-700">Geen contacten gevonden met deze filters</p>
                    <p className="text-xs text-orange-500 mt-0.5">Pas de filters aan of voeg meer contacten toe</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-purple-700">
                      📬 Deze campagne wordt verzonden naar <span className="text-lg font-bold">{segmentCount}</span> contacten
                    </p>
                    <p className="text-xs text-purple-500 mt-0.5">Op basis van de huidige filterinstellingen</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Verzendopties ── */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Wanneer verzenden */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Wanneer versturen?</Label>
              <div className="space-y-2">
                {[
                  { v: 'direct', label: 'Direct na aanmaken', icon: Rocket },
                  { v: 'gepland', label: 'Inplannen op datum en tijdstip', icon: Calendar },
                ].map(opt => (
                  <button key={opt.v} onClick={() => set('verzendMode', opt.v as 'direct' | 'gepland')}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${data.verzendMode === opt.v ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <opt.icon className={`h-4 w-4 ${data.verzendMode === opt.v ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${data.verzendMode === opt.v ? 'text-purple-700' : 'text-gray-700'}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
              {data.verzendMode === 'gepland' && (
                <Input type="datetime-local" value={data.verzendOp} onChange={e => set('verzendOp', e.target.value)} className="mt-2" />
              )}
            </div>

            {/* Verzendvenster */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <p className="text-sm font-medium text-gray-700">Verzendvenster</p>
              <div className="flex items-center gap-3">
                <Switch checked={data.alleenWerkdagen} onCheckedChange={v => set('alleenWerkdagen', v)} id="werkdagen" />
                <Label htmlFor="werkdagen" className="text-sm cursor-pointer">Alleen verzenden op werkdagen (ma–vr)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-xs text-gray-500 w-12">Tussen</Label>
                <Input type="time" value={data.tijdvensterStart} onChange={e => set('tijdvensterStart', e.target.value)} className="w-28 h-8 text-sm" />
                <Label className="text-xs text-gray-500">en</Label>
                <Input type="time" value={data.tijdvensterEind} onChange={e => set('tijdvensterEind', e.target.value)} className="w-28 h-8 text-sm" />
              </div>
              <p className="text-xs text-gray-400">Mails die buiten dit venster vallen worden automatisch verschoven naar het volgende beschikbare moment</p>
            </div>

            {/* A/B Test */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2"><FlaskConical className="h-4 w-4 text-purple-500" />A/B Test (optioneel)</p>
                  <p className="text-xs text-gray-400 mt-0.5">Test twee versies van je e-mail</p>
                </div>
                <Switch checked={data.abTestActief} onCheckedChange={v => set('abTestActief', v)} />
              </div>
              {data.abTestActief && (
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">Split: Variant A {data.abSplitPct}% — Variant B {100 - data.abSplitPct}%</Label>
                    <Slider value={[data.abSplitPct]} onValueChange={v => set('abSplitPct', v[0])} min={10} max={90} step={5} className="w-full" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">Winnaar bepalen op</Label>
                    <div className="flex gap-2">
                      {[{ v: 'open_rate', label: 'Open rate' }, { v: 'click_rate', label: 'Click rate' }].map(opt => (
                        <button key={opt.v} onClick={() => set('abWinnaarOp', opt.v)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${data.abWinnaarOp === opt.v ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-gray-500">Winnaar na</Label>
                    <Input type="number" value={data.abWinnaarNaUren} onChange={e => set('abWinnaarNaUren', parseInt(e.target.value) || 24)} className="w-20 h-8 text-sm" min={1} max={168} />
                    <span className="text-xs text-gray-500">uur</span>
                  </div>
                  <p className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-lg p-2">De winnende variant wordt automatisch naar de rest van de lijst gestuurd</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={handleClose}>Annuleren</Button>
          {step > 1 && <Button variant="outline" onClick={() => setStep(s => (s - 1) as 1|2|3)} className="gap-1"><ArrowLeft className="h-3.5 w-3.5" />Terug</Button>}
          {step < 3 && (
            <Button onClick={() => setStep(s => (s + 1) as 1|2|3)} disabled={step === 1 && !canNext1} className="gap-1 bg-purple-600 hover:bg-purple-700">
              Volgende <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="gap-1 bg-purple-600 hover:bg-purple-700">
              {createMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Aanmaken...</> : <><Rocket className="h-3.5 w-3.5" />Campagne aanmaken</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Genereer-varianten dialog ────────────────────────────────────────────────
function GenereerVariantenDialog({ open, onClose, onConfirm, pending }: {
  open: boolean; onClose: () => void;
  onConfirm: (branches: string[], functies: string[], talen: string[]) => void;
  pending: boolean;
}) {
  const [b, setB] = useState<string[]>([]);
  const [f, setF] = useState<string[]>([]);
  const [t, setT] = useState<string[]>([]);
  const TALEN = ['nl', 'en'];
  const totaal = Math.max(b.length, 1) * Math.max(f.length, 1) * Math.max(t.length, 1);
  const minstensEen = b.length + f.length + t.length > 0;

  const toggle = (arr: string[], setter: (v: string[]) => void, val: string) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Genereer varianten</DialogTitle>
          <DialogDescription>
            Maakt voor elke combinatie van branche × functie × taal een kopie van deze campagne.
            Iedere variant krijgt z'n eigen filter en kan apart worden bewerkt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Branches</p>
            <div className="flex flex-wrap gap-1.5">
              {BRANCHES.map(x => {
                const has = b.includes(x);
                return (
                  <button key={x} onClick={() => toggle(b, setB, x)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${has ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {x}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Functies</p>
            <div className="flex flex-wrap gap-1.5">
              {FUNCTIEGROEPEN.map(x => {
                const has = f.includes(x);
                return (
                  <button key={x} onClick={() => toggle(f, setF, x)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${has ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {x}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Talen</p>
            <div className="flex flex-wrap gap-1.5">
              {TALEN.map(x => {
                const has = t.includes(x);
                return (
                  <button key={x} onClick={() => toggle(t, setT, x)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${has ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {x.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
            {minstensEen ? (
              <span>Maakt <strong className="text-purple-700">{totaal}</strong> variant{totaal === 1 ? '' : 'en'} aan
                {b.length > 0 && ` — ${b.length} branche${b.length === 1 ? '' : 's'}`}
                {f.length > 0 && ` × ${f.length} functie${f.length === 1 ? '' : 's'}`}
                {t.length > 0 && ` × ${t.length} ta${t.length === 1 ? 'al' : 'len'}`}.
              </span>
            ) : (
              <span className="text-slate-500">Kies minstens één dimensie om te beginnen.</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={() => onConfirm(b, f, t)} disabled={!minstensEen || pending}
            className="bg-purple-600 hover:bg-purple-700">
            {pending ? 'Bezig...' : `Maak ${totaal} variant${totaal === 1 ? '' : 'en'} aan`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── A/B Rapportage Tab ───────────────────────────────────────────────────────

interface ABStats {
  fase: string; winnaar: string | null; winnaarBepaaldOp: string | null;
  variantA: { verzonden: number; geopend: number; geopendPct: number; geklikt: number; gekliktPct: number; eersteVerzondenOp: string | null };
  variantB: { verzonden: number; geopend: number; geopendPct: number; geklikt: number; gekliktPct: number; eersteVerzondenOp: string | null };
  restAantal: number;
  tijdlijn: Array<{ uur: number; aOpens: number; bOpens: number; aClicks: number; bClicks: number }>;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ABRapportageTab({ campaign }: { campaign: Campaign }) {
  const { toast } = useToast();
  const [winModal, setWinModal] = useState(false);
  const [tijdlijnOpen, setTijdlijnOpen] = useState(false);
  const [picking, setPicking] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery<ABStats>({
    queryKey: ['/api/admin/prospect-campaigns', campaign.id, 'ab-stats'],
    queryFn: () => fetchJson<ABStats>(`/api/admin/prospect-campaigns/${campaign.id}/ab-stats`),
    refetchInterval: 60_000,
    enabled: campaign.abTestActief,
  });

  const pickWinnaar = async (variant: 'A' | 'B' | 'auto') => {
    setPicking(true);
    try {
      const result: any = await apiRequest('POST', `/api/admin/prospect-campaigns/${campaign.id}/ab-pick-winner`, { variant });
      toast({ title: `Winnaar variant ${result.winnaar} bepaald ✓` });
      setWinModal(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
    } catch (e: any) {
      toast({ title: e?.data?.message || 'Mislukt', variant: 'destructive' });
    } finally {
      setPicking(false);
    }
  };

  if (!campaign.abTestActief) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <FlaskConical className="h-10 w-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">A/B test is uitgeschakeld voor deze campagne</p>
        </div>
      </div>
    );
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <RefreshCw className="h-6 w-6 text-slate-300 animate-spin" />
    </div>
  );

  const fase = stats?.fase || campaign.abTestFase || 'concept';
  const winnaar = stats?.winnaar || campaign.abWinnaarVariant;
  const a = stats?.variantA || { verzonden: 0, geopend: 0, geopendPct: 0, geklikt: 0, gekliktPct: 0, eersteVerzondenOp: null };
  const b = stats?.variantB || { verzonden: 0, geopend: 0, geopendPct: 0, geklikt: 0, gekliktPct: 0, eersteVerzondenOp: null };
  const maxOpen = Math.max(a.geopendPct, b.geopendPct, 1);
  const maxClick = Math.max(a.gekliktPct, b.gekliktPct, 1);

  // Winnaarstatus banner
  const WinnaarBanner = () => {
    if (fase === 'concept' || fase === null) return null;

    if (!winnaar && (fase === 'test' || !fase)) {
      const eersteVerzending = a.eersteVerzondenOp;
      const bepaalOp = eersteVerzending
        ? new Date(new Date(eersteVerzending).getTime() + (campaign.abWinnaarNaUren || 24) * 3600000)
        : null;
      return (
        <div className="border-l-4 border-blue-400 bg-blue-50 rounded-r-xl p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-800">A/B test loopt</span>
              </div>
              <p className="text-xs text-blue-600">
                Variant A getest bij {a.verzonden} contacten · Variant B bij {b.verzonden} contacten
              </p>
              {bepaalOp && (
                <p className="text-xs text-blue-500 mt-1">
                  Winnaar bepaald op <strong>{bepaalOp.toLocaleString('nl-NL', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong> op basis van {campaign.abWinnaarOp === 'click_rate' ? 'click rate' : 'open rate'}
                </p>
              )}
              {stats?.restAantal != null && stats.restAantal > 0 && (
                <p className="text-xs text-blue-400 mt-1">{stats.restAantal} contacten wachten op winnaar</p>
              )}
            </div>
            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 text-xs" onClick={() => setWinModal(true)}>
              Winnaar nu bepalen
            </Button>
          </div>
        </div>
      );
    }

    if (winnaar) {
      const winnaarData = winnaar === 'A' ? a : b;
      const verliezerData = winnaar === 'A' ? b : a;
      const score = campaign.abWinnaarOp === 'click_rate' ? `${winnaarData.gekliktPct}% click rate` : `${winnaarData.geopendPct}% open rate`;
      const verliezerScore = campaign.abWinnaarOp === 'click_rate' ? `${verliezerData.gekliktPct}%` : `${verliezerData.geopendPct}%`;
      return (
        <div className="border-l-4 border-green-400 bg-green-50 rounded-r-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-semibold text-green-800">Winnaar: Variant {winnaar}</span>
          </div>
          <p className="text-xs text-green-600">
            {campaign.abWinnaarBepaaldOp && `Bepaald op ${new Date(campaign.abWinnaarBepaaldOp).toLocaleString('nl-NL', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} · `}
            Variant {winnaar}: {score} vs Variant {winnaar === 'A' ? 'B' : 'A'}: {verliezerScore}
          </p>
          {stats?.restAantal === 0 && fase === 'voltooid' && (
            <p className="text-xs text-green-500 mt-1">Winnaar verzonden naar alle resterende contacten ✓</p>
          )}
        </div>
      );
    }

    return null;
  };

  // Grafiek data
  const chartData = (stats?.tijdlijn || []).map(t => ({
    name: `${t.uur}u`,
    'Variant A opens': t.aOpens,
    'Variant B opens': t.bOpens,
    'Variant A clicks': t.aClicks,
    'Variant B clicks': t.bClicks,
  }));

  return (
    <div className="max-w-3xl space-y-6">
      <WinnaarBanner />

      {/* Twee kolommen vergelijking */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Variant A', data: a, color: '#7C3AED', bgHeader: 'bg-purple-600', isWinnaar: winnaar === 'A', isVerliezer: !!winnaar && winnaar !== 'A' },
          { label: 'Variant B', data: b, color: '#2563EB', bgHeader: 'bg-blue-600', isWinnaar: winnaar === 'B', isVerliezer: !!winnaar && winnaar !== 'B' },
        ].map(v => (
          <div key={v.label} className={`rounded-xl border overflow-hidden ${v.isVerliezer ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div className={`${v.bgHeader} px-4 py-3 flex items-center justify-between`}>
              <span className="text-white font-semibold text-sm">{v.label}</span>
              {v.isWinnaar && (
                <span className="bg-white text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">🏆 Winnaar</span>
              )}
              {v.isVerliezer && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Verliezer</span>
              )}
            </div>
            <div className="p-4 space-y-4">
              {/* Onderwerp */}
              <p className="text-xs text-slate-500 truncate">
                {v.label === 'Variant A' ? campaign.subject : (campaign.subject + ' (B)')}
              </p>

              {/* KPI rij */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Verzonden', value: v.data.verzonden },
                  { label: 'Geopend', value: `${v.data.geopendPct}%` },
                  { label: 'Geklikt', value: `${v.data.gekliktPct}%` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg font-bold" style={{ color: v.color }}>{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progressbars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Open rate</span><span>{v.data.geopendPct}%</span>
                  </div>
                  <ProgressBar value={v.data.geopendPct} max={maxOpen} color={v.color} />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Click rate</span><span>{v.data.gekliktPct}%</span>
                  </div>
                  <ProgressBar value={v.data.gekliktPct} max={maxClick} color={v.color} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grafiek */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Opens over tijd</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Variant A opens" stroke="#7C3AED" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Variant B opens" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tijdlijn detailtabel */}
      {(stats?.tijdlijn || []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setTijdlijnOpen(v => !v)}
          >
            Gedetailleerde tijdlijn
            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${tijdlijnOpen ? 'rotate-90' : ''}`} />
          </button>
          {tijdlijnOpen && (
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Tijdstip</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-purple-600">A opens</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-blue-600">B opens</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-purple-600">A clicks</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-blue-600">B clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.tijdlijn || []).map((t, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2 text-slate-500">{t.uur}–{[1,2,4,8,12,24,48][idx] ?? '48+'}u</td>
                      <td className="px-4 py-2 text-right text-purple-600 font-medium">{t.aOpens}</td>
                      <td className="px-4 py-2 text-right text-blue-600 font-medium">{t.bOpens}</td>
                      <td className="px-4 py-2 text-right text-purple-400">{t.aClicks}</td>
                      <td className="px-4 py-2 text-right text-blue-400">{t.bClicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => refetch()}
        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
      >
        <RefreshCw className="h-3 w-3" />Vernieuwen
      </button>

      {/* Winnaar bepalen modal */}
      <Dialog open={winModal} onOpenChange={setWinModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              Winnaar bepalen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Tussenstand op dit moment:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Variant A', data: a, color: 'purple' },
                { label: 'Variant B', data: b, color: 'blue' },
              ].map(v => (
                <div key={v.label} className={`rounded-xl border-2 p-3 ${v.color === 'purple' ? 'border-purple-200 bg-purple-50' : 'border-blue-200 bg-blue-50'}`}>
                  <p className={`text-xs font-bold mb-2 ${v.color === 'purple' ? 'text-purple-700' : 'text-blue-700'}`}>{v.label}</p>
                  <p className={`text-xl font-bold ${v.color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`}>{v.data.geopendPct}%</p>
                  <p className="text-xs text-slate-400">open rate</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <Button
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                disabled={picking}
                onClick={() => pickWinnaar('A')}
              >
                Kies Variant A als winnaar
              </Button>
              <Button
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={picking}
                onClick={() => pickWinnaar('B')}
              >
                Kies Variant B als winnaar
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={picking}
                onClick={() => pickWinnaar('auto')}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Automatisch bepalen (huidig data)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Flow Voortgang Tab ───────────────────────────────────────────────────────

interface FlowStats {
  actief: number; voltooid: number; gestopt: number; error: number;
  perStap: Array<{ stapId: string; wachtHier: number; doorgelopen: number }>;
  contacten: Array<{
    id: number; contactId: number; huidigeStapId: string;
    status: string; wachtTot: string | null; bijgewerktOp: string;
    foutMelding: string | null;
  }>;
}

function FlowVoortgangTab({ campaignId }: { campaignId: number }) {
  const { data: stats, isLoading, refetch } = useQuery<FlowStats>({
    queryKey: ['/api/admin/prospect-campaigns', campaignId, 'flow-stats'],
    queryFn: () => fetchJson<FlowStats>(`/api/admin/prospect-campaigns/${campaignId}/flow-stats`),
    refetchInterval: 30_000,
  });

  const STATUS_COLOR: Record<string, string> = {
    actief: 'bg-blue-100 text-blue-700',
    voltooid: 'bg-green-100 text-green-700',
    gestopt: 'bg-gray-100 text-gray-600',
    error: 'bg-red-100 text-red-600',
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-sm text-slate-400">Voortgang laden...</div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center py-20 text-sm text-slate-400">Geen flow gegevens beschikbaar. Activeer de flow eerst.</div>
  );

  const total = stats.actief + stats.voltooid + stats.gestopt + stats.error;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Statistieken kaarten */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Actief', value: stats.actief, color: 'border-blue-200 bg-blue-50 text-blue-700' },
          { label: 'Voltooid', value: stats.voltooid, color: 'border-green-200 bg-green-50 text-green-700' },
          { label: 'Gestopt', value: stats.gestopt, color: 'border-gray-200 bg-gray-50 text-gray-600' },
          { label: 'Fout', value: stats.error, color: 'border-red-200 bg-red-50 text-red-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per stap overzicht */}
      {stats.perStap.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Per stap</p>
          <div className="space-y-2">
            {stats.perStap.map(s => (
              <div key={s.stapId} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-36 truncate">{s.stapId}</span>
                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${total > 0 ? Math.round((s.wachtHier / total) * 100) : 0}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-12 text-right">{s.wachtHier} wacht</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact voortgang tabel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contacten ({total})</p>
          <button onClick={() => refetch()} className="text-xs text-purple-600 hover:underline">Vernieuwen</button>
        </div>
        {(stats.contacten || []).length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">Nog geen contacten in de flow.</div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Contact ID</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Huidige stap</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Wacht tot</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Bijgewerkt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats.contacten || []).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700 align-top">{p.contactId}</td>
                    <td className="px-4 py-2.5 align-top">
                      <div className="text-slate-600 font-mono">{p.huidigeStapId}</div>
                      {p.foutMelding && (p.status === 'gestopt' || p.status === 'error') && (
                        <div className={`mt-1 text-[11px] italic ${p.status === 'error' ? 'text-red-500' : 'text-slate-500'}`}>
                          {p.foutMelding}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-600'}`}
                        title={p.foutMelding || undefined}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 align-top">{p.wachtTot ? new Date(p.wachtTot).toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400 align-top">{new Date(p.bijgewerktOp).toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {stats.error > 0 && (
          <p className="text-xs text-red-500 mt-2">⚠ {stats.error} contact(en) met een fout — controleer de flow configuratie.</p>
        )}
      </div>
    </div>
  );
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(targetDate: string | null): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!targetDate) { setLabel(''); return; }
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setLabel('Wordt verzonden...'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setLabel(`${d}d ${h}u ${m}m`);
      else if (h > 0) setLabel(`${h}u ${m}m ${s}s`);
      else setLabel(`${m}m ${s}s`);
    }
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [targetDate]);
  return label;
}

// ─── Verzendplanning sectie component ────────────────────────────────────────
function VerzendplanningSection({ campaign, onRefresh }: { campaign: Campaign; onRefresh: () => void }) {
  const { toast } = useToast();
  const [modus, setModus] = useState<'idle' | 'plannen' | 'wijzigen'>('idle');
  const [verzendOp, setVerzendOp] = useState('');
  const [alleenWerkdagen, setAlleenWerkdagen] = useState(campaign.alleenWerkdagen ?? true);
  const [tijdvensterStart, setTijdvensterStart] = useState(campaign.tijdvensterStart || '08:00');
  const [tijdvensterEind, setTijdvensterEind] = useState(campaign.tijdvensterEind || '18:00');
  // Blok 2: vaste verzenddagen + slots (lege array = niet actief, val terug op tijdvenster)
  const [verzendDagen, setVerzendDagen] = useState<number[]>(Array.isArray(campaign.verzendDagen) ? campaign.verzendDagen : []);
  const [verzendSlots, setVerzendSlots] = useState<Array<{ dag: number; tijd: string }>>(
    Array.isArray(campaign.verzendSlots) ? campaign.verzendSlots : [],
  );
  const jaarcampagneActief = verzendSlots.length > 0
    && JAARCAMPAGNE_SLOTS.every(s => verzendSlots.some(v => v.dag === s.dag && v.tijd === s.tijd))
    && verzendSlots.length === JAARCAMPAGNE_SLOTS.length;
  const [preview, setPreview] = useState<{ leesbaar: string; gecorrigeerd: boolean; reden: string | null } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdown = useCountdown(campaign.werkelijkVerzendOp ?? null);

  const isGepland = ['gepland', 'scheduled'].includes(campaign.status);
  const isConcept = ['concept', 'draft'].includes(campaign.status);
  const isActief = campaign.status === 'actief';

  // Debounced preview
  useEffect(() => {
    if (modus === 'idle') return;
    if (!verzendOp) { setPreview(null); return; }
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const data: any = await apiRequest('POST', `/api/admin/prospect-campaigns/${campaign.id}/plannen-preview`, {
          verzendOp, alleenWerkdagen, tijdvensterStart, tijdvensterEind,
          verzendDagen: verzendDagen.length > 0 ? verzendDagen : undefined,
          verzendSlots: verzendSlots.length > 0 ? verzendSlots : undefined,
          verzendDirect: false,
        });
        setPreview(data);
      } catch { setPreview(null); }
      finally { setPreviewLoading(false); }
    }, 600);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [verzendOp, alleenWerkdagen, tijdvensterStart, tijdvensterEind, verzendDagen, verzendSlots, modus, campaign.id]);

  const planMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest('POST', `/api/admin/prospect-campaigns/${campaign.id}/plannen`, payload) as Promise<any>,
    onSuccess: (data: any) => {
      onRefresh();
      setModus('idle');
      toast({
        title: data?.verzendDirect ? '✅ Campagne wordt direct verzonden' : '📅 Campagne ingepland',
        description: data?.leesbaar ? `Verzending: ${data.leesbaar}` : undefined,
      });
    },
    onError: (err: any) => toast({ title: 'Fout bij inplannen', description: err?.data?.message || err?.message || 'Onbekende fout', variant: 'destructive' }),
  });

  const wijzigMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest('PUT', `/api/admin/prospect-campaigns/${campaign.id}/verzendtijd`, payload) as Promise<any>,
    onSuccess: (data: any) => {
      onRefresh();
      setModus('idle');
      toast({ title: '📅 Verzendmoment bijgewerkt', description: data?.leesbaar ?? undefined });
    },
    onError: (err: any) => toast({ title: 'Fout bij bijwerken', description: err?.data?.message || err?.message || 'Onbekende fout', variant: 'destructive' }),
  });

  const annuleerMut = useMutation({
    mutationFn: () =>
      apiRequest('POST', `/api/admin/prospect-campaigns/${campaign.id}/annuleer-planning`, {}) as Promise<any>,
    onSuccess: () => { onRefresh(); toast({ title: 'Planning geannuleerd', description: 'Campagne is teruggezet naar concept.' }); },
    onError: (err: any) => toast({ title: 'Fout', description: err?.data?.message || err?.message || 'Onbekende fout', variant: 'destructive' }),
  });

  function openPlanForm() {
    const basis = campaign.scheduledAt ? new Date(campaign.scheduledAt) : new Date(Date.now() + 3600000);
    const local = new Date(basis.getTime() - basis.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setVerzendOp(local);
    setAlleenWerkdagen(campaign.alleenWerkdagen ?? true);
    setTijdvensterStart(campaign.tijdvensterStart || '08:00');
    setTijdvensterEind(campaign.tijdvensterEind || '18:00');
    setVerzendDagen(Array.isArray(campaign.verzendDagen) ? campaign.verzendDagen : []);
    setVerzendSlots(Array.isArray(campaign.verzendSlots) ? campaign.verzendSlots : []);
    setPreview(null);
    setModus(isGepland ? 'wijzigen' : 'plannen');
  }

  // Blok 2: zet/verwijder de banqueting-jaarcampagne preset (di 14:30 / wo 10:30)
  function toggleJaarcampagnePreset() {
    if (jaarcampagneActief) {
      setVerzendDagen([]);
      setVerzendSlots([]);
    } else {
      setVerzendDagen([...JAARCAMPAGNE_DAGEN]);
      setVerzendSlots(JAARCAMPAGNE_SLOTS.map(s => ({ ...s })));
    }
  }

  function submitPlan() {
    const payload = {
      verzendOp, alleenWerkdagen, tijdvensterStart, tijdvensterEind,
      verzendDagen: verzendDagen.length > 0 ? verzendDagen : null,
      verzendSlots: verzendSlots.length > 0 ? verzendSlots : null,
      verzendDirect: false,
    };
    if (modus === 'wijzigen') wijzigMut.mutate(payload);
    else planMut.mutate(payload);
  }

  const isPending = planMut.isPending || wijzigMut.isPending;

  // ── Render: Gepland status ──────────────────────────────────────────────────
  if (isGepland) {
    const werkelijkDt = campaign.werkelijkVerzendOp ? new Date(campaign.werkelijkVerzendOp) : null;
    const werkelijkLeesbaar = werkelijkDt
      ? werkelijkDt.toLocaleString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—';

    if (modus === 'wijzigen') {
      return (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />Verzendmoment wijzigen
          </p>
          <JaarcampagnePresetKnop actief={jaarcampagneActief} onToggle={toggleJaarcampagnePreset} testIdPrefix="wijzigen" />
          <PlanFormVelden
            verzendOp={verzendOp} setVerzendOp={setVerzendOp}
            alleenWerkdagen={alleenWerkdagen} setAlleenWerkdagen={setAlleenWerkdagen}
            tijdvensterStart={tijdvensterStart} setTijdvensterStart={setTijdvensterStart}
            tijdvensterEind={tijdvensterEind} setTijdvensterEind={setTijdvensterEind}
            preview={preview} previewLoading={previewLoading}
            slotsActief={jaarcampagneActief}
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!verzendOp || isPending} onClick={submitPlan} data-testid="button-verzendmoment-opslaan">
              {isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CalendarClock className="h-3.5 w-3.5 mr-1.5" />}
              Opslaan
            </Button>
            <Button size="sm" variant="outline" onClick={() => setModus('idle')}>Annuleren</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-200 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />Ingepland
          </p>
          <span className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono">{countdown}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900 capitalize leading-tight">{werkelijkLeesbaar}</p>
          {campaign.scheduledAt && campaign.werkelijkVerzendOp &&
            campaign.scheduledAt !== campaign.werkelijkVerzendOp && (
            <p className="text-[11px] text-blue-500 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Gewenst: {new Date(campaign.scheduledAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {' '}— aangepast aan tijdvenster
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-blue-500">
            {Array.isArray(campaign.verzendSlots) && campaign.verzendSlots.length > 0 ? (
              <span data-testid="badge-vaste-slots-actief">
                Slots: {campaign.verzendSlots.map(s => `${WEEKDAG_KORT[s.dag] ?? '?'} ${s.tijd}`).join(' / ')}
              </span>
            ) : (
              <>
                {campaign.alleenWerkdagen && <span>Alleen werkdagen</span>}
                <span>Venster: {campaign.tijdvensterStart}–{campaign.tijdvensterEind}</span>
              </>
            )}
            <span className="text-blue-400">{campaign.tijdzone || 'Europe/Amsterdam'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 flex-1 h-7 text-xs" onClick={openPlanForm}>
            <Pencil className="h-3 w-3 mr-1.5" />Wijzigen
          </Button>
          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-7 px-2" disabled={annuleerMut.isPending}
            onClick={() => { if (window.confirm('Planning annuleren? De campagne wordt teruggezet naar concept.')) annuleerMut.mutate(); }}>
            {annuleerMut.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <BanIcon className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: Concept zonder email — toon met melding ──────────────────────
  if (isConcept && !campaign.htmlContent) {
    return (
      <div className="rounded-xl p-4 border border-slate-200 bg-slate-50 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5" />Verzending
        </p>
        <div className="flex gap-2 opacity-50 pointer-events-none">
          <Button className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700" size="sm" disabled>
            <SendHorizontal className="h-3.5 w-3.5" />Direct verzenden
          </Button>
          <Button variant="outline" className="flex-1 gap-2" size="sm" disabled>
            <CalendarClock className="h-3.5 w-3.5" />Inplannen op datum
          </Button>
        </div>
        <p className="text-[11px] text-slate-400">Vul eerst de e-mail inhoud in om de campagne in te plannen of te verzenden.</p>
      </div>
    );
  }

  // ── Render: Plannen form open ──────────────────────────────────────────────
  if (isConcept && modus === 'plannen') {
    return (
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 space-y-3">
        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />Verzendmoment inplannen
        </p>
        <JaarcampagnePresetKnop actief={jaarcampagneActief} onToggle={toggleJaarcampagnePreset} testIdPrefix="plannen" />
        <PlanFormVelden
          verzendOp={verzendOp} setVerzendOp={setVerzendOp}
          alleenWerkdagen={alleenWerkdagen} setAlleenWerkdagen={setAlleenWerkdagen}
          tijdvensterStart={tijdvensterStart} setTijdvensterStart={setTijdvensterStart}
          tijdvensterEind={tijdvensterEind} setTijdvensterEind={setTijdvensterEind}
          preview={preview} previewLoading={previewLoading}
          slotsActief={jaarcampagneActief}
        />
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={!verzendOp || isPending}
            onClick={submitPlan} data-testid="button-verzendmoment-inplannen">
            {isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CalendarClock className="h-3.5 w-3.5 mr-1.5" />}
            Inplannen
          </Button>
          <Button size="sm" variant="outline" onClick={() => setModus('idle')}>Annuleren</Button>
        </div>
      </div>
    );
  }

  // ── Render: Concept met email — knoppen ────────────────────────────────────
  if (isConcept && campaign.htmlContent) {
    return (
      <div className="rounded-xl p-4 border border-slate-200 bg-slate-50 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5" />Verzending
        </p>
        <div className="flex gap-2">
          <Button className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700" size="sm"
            disabled={planMut.isPending}
            onClick={() => planMut.mutate({ verzendDirect: true })}>
            {planMut.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <SendHorizontal className="h-3.5 w-3.5" />}
            Direct verzenden
          </Button>
          <Button variant="outline" className="flex-1 gap-2" size="sm" onClick={openPlanForm}>
            <CalendarClock className="h-3.5 w-3.5" />Inplannen op datum
          </Button>
        </div>
        <p className="text-[11px] text-slate-400">Direct verzenden stuurt nu, inplannen laat je een datum/tijd kiezen.</p>
      </div>
    );
  }

  // ── Render: Actief ─────────────────────────────────────────────────────────
  if (isActief) {
    const total = (campaign.sentCount ?? 0) + (campaign.failedCount ?? 0);
    const pct = total > 0 ? Math.round((campaign.sentCount ?? 0) / total * 100) : 0;
    return (
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 animate-pulse" />Verzending actief
        </p>
        <div className="w-full bg-green-200 rounded-full h-2 mb-2">
          <div className="bg-green-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-green-700">{campaign.sentCount ?? 0} van {total} verzonden ({pct}%)</p>
      </div>
    );
  }

  return null;
}

// Korte weekdag-labels voor weergave (ISO 1=ma..7=zo)
const WEEKDAG_KORT: Record<number, string> = { 1: 'ma', 2: 'di', 3: 'wo', 4: 'do', 5: 'vr', 6: 'za', 7: 'zo' };

// Blok 2: preset-knop voor de banqueting jaarcampagne (di 14:30 / wo 10:30 Amsterdam)
function JaarcampagnePresetKnop({ actief, onToggle, testIdPrefix }: {
  actief: boolean; onToggle: () => void; testIdPrefix: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid={`button-preset-jaarcampagne-${testIdPrefix}`}
      className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        actief
          ? 'bg-purple-100 border-purple-400 text-purple-900'
          : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-slate-700'
      }`}
    >
      <div>
        <p className="text-xs font-semibold flex items-center gap-1.5">
          {actief ? <CheckCircle className="h-3.5 w-3.5 text-purple-600" /> : <CalendarClock className="h-3.5 w-3.5 text-slate-400" />}
          Banqueting jaarcampagne-preset
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Vaste momenten: dinsdag 14:30 en woensdag 10:30 (Europe/Amsterdam)
        </p>
      </div>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${actief ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {actief ? 'Aan' : 'Uit'}
      </span>
    </button>
  );
}

// ─── Plan form velden ─────────────────────────────────────────────────────────
function PlanFormVelden({
  verzendOp, setVerzendOp,
  alleenWerkdagen, setAlleenWerkdagen,
  tijdvensterStart, setTijdvensterStart,
  tijdvensterEind, setTijdvensterEind,
  preview, previewLoading,
  slotsActief = false,
}: {
  verzendOp: string; setVerzendOp: (v: string) => void;
  alleenWerkdagen: boolean; setAlleenWerkdagen: (v: boolean) => void;
  tijdvensterStart: string; setTijdvensterStart: (v: string) => void;
  tijdvensterEind: string; setTijdvensterEind: (v: string) => void;
  preview: { leesbaar: string; gecorrigeerd: boolean; reden: string | null } | null;
  previewLoading: boolean;
  slotsActief?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-600 mb-1 block">
          Gewenst verzendmoment {slotsActief && <span className="text-purple-600 font-normal">(wordt afgerond op eerstvolgende vaste slot)</span>}
        </Label>
        <Input
          type="datetime-local"
          value={verzendOp}
          onChange={e => setVerzendOp(e.target.value)}
          className="text-sm"
          min={new Date().toISOString().slice(0, 16)}
          data-testid="input-verzend-op"
        />
      </div>
      <div className={`flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 ${slotsActief ? 'opacity-50' : ''}`}>
        <div>
          <p className="text-xs font-medium text-slate-700">Alleen werkdagen</p>
          <p className="text-[11px] text-slate-400">Weekend worden overgeslagen</p>
        </div>
        <Switch checked={alleenWerkdagen} onCheckedChange={setAlleenWerkdagen} disabled={slotsActief} />
      </div>
      <div className={`grid grid-cols-2 gap-2 ${slotsActief ? 'opacity-50' : ''}`}>
        <div>
          <Label className="text-xs text-slate-600 mb-1 block">Tijdvenster start</Label>
          <Input type="time" value={tijdvensterStart} onChange={e => setTijdvensterStart(e.target.value)} className="text-sm" disabled={slotsActief} />
        </div>
        <div>
          <Label className="text-xs text-slate-600 mb-1 block">Tijdvenster eind</Label>
          <Input type="time" value={tijdvensterEind} onChange={e => setTijdvensterEind(e.target.value)} className="text-sm" disabled={slotsActief} />
        </div>
      </div>

      {/* Live preview */}
      {(previewLoading || preview) && (
        <div className={`rounded-lg px-3 py-2.5 text-xs border ${preview?.gecorrigeerd ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {previewLoading ? (
            <span className="flex items-center gap-1.5 text-slate-400"><RefreshCw className="h-3 w-3 animate-spin" />Berekening...</span>
          ) : preview ? (
            <div className="space-y-0.5">
              <p className="font-medium flex items-center gap-1.5">
                {preview.gecorrigeerd
                  ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  : <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                Werkelijk verzendmoment: <span className="capitalize">{preview.leesbaar}</span>
              </p>
              {preview.gecorrigeerd && preview.reden && (
                <p className="text-amber-600 ml-5">{preview.reden}</p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Blok 3 — Campagne replies-paneel ────────────────────────────────────────
type ProspectReplyDTO = {
  id: number; contactId: number | null; campaignId: number | null; mailSendId: number | null;
  fromEmail: string; fromName: string | null; subject: string | null;
  bodyText: string | null; bodyHtml: string | null;
  inReplyTo: string | null; receivedAt: string;
  handled: boolean; handledAt: string | null;
};

function CampagneRepliesPaneel({ campaignId }: { campaignId: number }) {
  const { toast } = useToast();
  const [openId, setOpenId] = useState<number | null>(null);
  const { data: replies = [], isLoading } = useQuery<ProspectReplyDTO[]>({
    queryKey: ['/api/admin/prospect-replies', { campaignId }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/prospect-replies?campaignId=${campaignId}&limit=20`, { credentials: 'include' });
      if (!res.ok) throw new Error('replies laden mislukt');
      return res.json();
    },
    refetchInterval: 60_000,
  });
  const markeerAfgehandeld = useMutation({
    mutationFn: async ({ id, handled }: { id: number; handled: boolean }) => {
      return apiRequest('PATCH', `/api/admin/prospect-replies/${id}`, { handled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-replies'] });
      toast({ title: 'Reply bijgewerkt' });
    },
    onError: (e: any) => toast({ title: 'Bijwerken mislukt', description: e?.message || '', variant: 'destructive' }),
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="campagne-replies-paneel">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-semibold text-slate-700">Recente replies</p>
          {replies.length > 0 && (
            <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{replies.length}</span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">Auto-refresh elke minuut</span>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="h-4 w-4 text-slate-300 animate-spin" />
        </div>
      ) : replies.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">Nog geen antwoorden ontvangen via SendGrid Inbound Parse.</p>
      ) : (
        <ul className="divide-y divide-slate-100" data-testid="replies-lijst">
          {replies.map((r) => {
            const isOpen = openId === r.id;
            const tijd = new Date(r.receivedAt).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' });
            return (
              <li key={r.id} className="py-2.5" data-testid={`reply-${r.id}`}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  className="w-full text-left flex items-start gap-3 hover:bg-slate-50 rounded-md p-1 -m-1"
                  data-testid={`reply-toggle-${r.id}`}
                >
                  <Reply className={`h-4 w-4 mt-0.5 ${r.handled ? 'text-slate-300' : 'text-indigo-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {r.fromName || r.fromEmail}
                      </span>
                      {r.handled && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Afgehandeld</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{r.subject || '(geen onderwerp)'}</p>
                    <p className="text-[11px] text-slate-400">{r.fromEmail} · {tijd}</p>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
                </button>
                {isOpen && (
                  <div className="mt-2 ml-7 pr-2">
                    <div className="bg-slate-50 rounded-md p-3 text-xs text-slate-700 whitespace-pre-wrap max-h-48 overflow-auto" data-testid={`reply-body-${r.id}`}>
                      {r.bodyText?.trim() || (r.bodyHtml ? <span className="italic text-slate-400">(alleen HTML beschikbaar)</span> : <span className="italic text-slate-400">(geen tekst)</span>)}
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant={r.handled ? 'outline' : 'default'}
                        onClick={() => markeerAfgehandeld.mutate({ id: r.id, handled: !r.handled })}
                        disabled={markeerAfgehandeld.isPending}
                        data-testid={`reply-handle-${r.id}`}
                      >
                        {r.handled ? 'Heropen' : 'Markeer afgehandeld'}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Serie-editor: toon en bewerk serie + stapnummer voor de geselecteerde campagne
function SerieEditor({ campaign, alleSeries }: { campaign: Campaign; alleSeries: string[] }) {
  const { toast } = useToast();
  const [serie, setSerie] = useState<string>(campaign.serie ?? '');
  const [stap, setStap] = useState<string>(campaign.serieStapNr != null ? String(campaign.serieStapNr) : '');
  const [showSuggesties, setShowSuggesties] = useState(false);

  useEffect(() => {
    setSerie(campaign.serie ?? '');
    setStap(campaign.serieStapNr != null ? String(campaign.serieStapNr) : '');
  }, [campaign.id]);

  const dirty = (serie || '') !== (campaign.serie ?? '') ||
    (stap || '') !== (campaign.serieStapNr != null ? String(campaign.serieStapNr) : '');

  const opslaanMut = useMutation({
    mutationFn: () => apiRequest('PUT', `/api/admin/prospect-campaigns/${campaign.id}`, {
      serie: serie.trim() || null,
      serieStapNr: stap ? parseInt(stap) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      toast({ title: 'Serie opgeslagen' });
    },
    onError: (e: any) => toast({ title: e?.data?.message || 'Opslaan mislukt', variant: 'destructive' }),
  });

  const suggesties = serie
    ? alleSeries.filter(s => s.toLowerCase().includes(serie.toLowerCase()) && s !== serie).slice(0, 5)
    : alleSeries.slice(0, 5);

  return (
    <div className="bg-purple-50/50 rounded-xl px-3 py-2.5 border border-purple-200">
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide whitespace-nowrap">Serie</span>
        <div className="relative flex-1 min-w-0">
          <Input
            value={serie}
            onChange={e => { setSerie(e.target.value); setShowSuggesties(true); }}
            onFocus={() => setShowSuggesties(true)}
            onBlur={() => setTimeout(() => setShowSuggesties(false), 200)}
            placeholder="bv. Banqueting jaarcampagne"
            className="h-7 text-xs bg-white"
          />
          {showSuggesties && suggesties.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-y-auto">
              {suggesties.map(s => (
                <button key={s} type="button" onMouseDown={e => { e.preventDefault(); setSerie(s); setShowSuggesties(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 text-slate-600">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">Stap</span>
        <Input type="number" min={1} value={stap} onChange={e => setStap(e.target.value)}
          placeholder="1..N" className="h-7 text-xs bg-white w-16" />
        {dirty && (
          <Button size="sm" onClick={() => opslaanMut.mutate()} disabled={opslaanMut.isPending}
            className="bg-purple-600 hover:bg-purple-700 h-7 text-xs px-2">
            {opslaanMut.isPending ? '...' : 'Opslaan'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main module ──────────────────────────────────────────────────────────────
export default function ProspectCampagnesTab() {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState('overzicht');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [flowBuilderOpen, setFlowBuilderOpen] = useState(false);
  // Serie/branche/functie/taal filters voor de gegroepeerde sidebar
  const [serieFilter, setSerieFilter] = useState<string>('alle');
  const [brancheGroepFilter, setBrancheGroepFilter] = useState<string>('alle');
  const [functieGroepFilter, setFunctieGroepFilter] = useState<string>('alle');
  const [taalGroepFilter, setTaalGroepFilter] = useState<string>('alle');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [variantenWizardOpen, setVariantenWizardOpen] = useState(false);

  // ── Queries
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/admin/prospect-campaigns'],
  });

  const PHASE_LABELS: Record<string, string> = {
    nieuw: 'Nieuw', in_campagne: 'In campagne', in_gesprek: 'In gesprek',
    klant: 'Klant', uitgesloten: 'Uitgesloten',
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedId) ?? null;

  const { data: recipients = [], isLoading: recipLoading } = useQuery<Recipient[]>({
    queryKey: ['/api/admin/prospect-campaigns', selectedId, 'recipients'],
    enabled: !!selectedId && detailTab === 'ontvangers',
    queryFn: () => fetchJsonList<Recipient>(`/api/admin/prospect-campaigns/${selectedId}/recipients`),
  });

  // Voor concept/geplande campagnes: bereken nu welke contacten op het
  // verzendmoment in het segment zouden zitten (incl. uitsluitingen).
  type SegmentPreviewItem = {
    id: number; name: string; email: string; company: string | null;
    function: string | null; branche: string | null; functiegroep: string | null;
    contactType: string | null; phase: string | null; excluded: boolean;
    /** 'segment' = via de filters, 'handmatig' = los toegevoegd. */
    herkomst?: 'segment' | 'handmatig';
  };
  type SegmentPreview = {
    totaal: number; verzendBaar: number; uitgesloten: number; handmatig?: number;
    contacts: SegmentPreviewItem[];
  };
  const isPlannedOrConcept = !!selectedCampaign && !['sent','voltooid','actief','gestopt'].includes(selectedCampaign.status);
  const { data: segmentPreviewRaw, isLoading: segLoading } = useQuery<SegmentPreview>({
    queryKey: ['/api/admin/prospect-campaigns', selectedId, 'segment-preview'],
    enabled: !!selectedId && detailTab === 'ontvangers' && isPlannedOrConcept,
    queryFn: () => fetchJson<SegmentPreview>(`/api/admin/prospect-campaigns/${selectedId}/segment-preview`),
  });

  // Lokale shadow-state voor uitsluitingen. Gesynchroniseerd met server bij
  // elke nieuwe fetch, maar synchroon updatebaar voor instant UI feedback.
  const [excludedShadow, setExcludedShadow] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (segmentPreviewRaw) {
      const set = new Set<number>(
        segmentPreviewRaw.contacts.filter(c => c.excluded).map(c => c.id)
      );
      setExcludedShadow(set);
    }
  }, [segmentPreviewRaw]);

  // Afgeleide preview die UI gebruikt: combineert de server data met de
  // lokale shadow zodat klikken meteen zichtbaar is.
  const segmentPreview = useMemo<SegmentPreview | undefined>(() => {
    if (!segmentPreviewRaw) return segmentPreviewRaw;
    const contacts = segmentPreviewRaw.contacts.map(c => ({
      ...c, excluded: excludedShadow.has(c.id),
    }));
    const uitgesloten = contacts.filter(c => c.excluded).length;
    return {
      ...segmentPreviewRaw, contacts, uitgesloten,
      verzendBaar: contacts.length - uitgesloten,
    };
  }, [segmentPreviewRaw, excludedShadow]);

  const [doelgroepOpen, setDoelgroepOpen] = useState(false);
  /** Zoekterm voor het handmatig toevoegen van een contact (Ontvangers-tab). */
  const [contactZoek, setContactZoek] = useState('');

  // Contacten om uit te kiezen. Pas zoeken vanaf twee tekens: de volledige
  // lijst is groot en een lege zoekterm zou hem in zijn geheel binnenhalen.
  const { data: zoekResultaten = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/prospect-contacts', 'zoek', contactZoek],
    enabled: detailTab === 'ontvangers' && contactZoek.trim().length >= 2,
    queryFn: () => fetchJsonList<any>(`/api/admin/prospect-contacts?search=${encodeURIComponent(contactZoek.trim())}`),
  });

  /** Handmatig toevoegen of weer weghalen. */
  const toggleExtra = useMutation({
    mutationFn: ({ contactId, toevoegen }: { contactId: number; toevoegen: boolean }) =>
      apiRequest(`/api/admin/prospect-campaigns/${selectedId}/extra/${contactId}`, {
        method: toevoegen ? 'POST' : 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns', selectedId, 'segment-preview'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      setContactZoek('');
    },
    onError: (err: any) => toast({
      title: 'Toevoegen mislukt',
      description: err?.message || 'Probeer het opnieuw',
      variant: 'destructive',
    }),
  });

  const toggleExclusion = useMutation({
    mutationFn: async ({ contactId, exclude }: { contactId: number; exclude: boolean }) => {
      const url = `/api/admin/prospect-campaigns/${selectedId}/exclude/${contactId}`;
      return (await apiRequest(exclude ? 'POST' : 'DELETE', url)) as { success: boolean; excludedContactIds: number[] };
    },
    onMutate: ({ contactId, exclude }) => {
      // Synchroon de shadow-set bijwerken zodat de UI direct reageert.
      setExcludedShadow(prev => {
        const next = new Set(prev);
        if (exclude) next.add(contactId); else next.delete(contactId);
        return next;
      });
    },
    onSuccess: (data) => {
      // Server is bron-van-waarheid: sync de shadow met wat de server teruggeeft.
      if (data && Array.isArray(data.excludedContactIds)) {
        setExcludedShadow(new Set(data.excludedContactIds));
      }
    },
    onError: (err: any, vars) => {
      // Rollback: zet de shadow terug.
      setExcludedShadow(prev => {
        const next = new Set(prev);
        if (vars.exclude) next.delete(vars.contactId); else next.add(vars.contactId);
        return next;
      });
      toast({ title: err?.data?.message || err?.message || 'Fout bij wijzigen', variant: 'destructive' });
    },
  });

  type CampaignStats = {
    verzonden: number; geopend: number; geklikt: number; uitgeschreven: number; mislukt: number;
    geopend_pct: number; geklikt_pct: number; uitgeschreven_pct: number;
    variant_a: { verzonden: number; geopend: number; geopend_pct: number; geklikt: number; geklikt_pct: number };
    variant_b: { verzonden: number; geopend: number; geopend_pct: number; geklikt: number; geklikt_pct: number };
  };
  const { data: campaignStats, isLoading: statsLoading } = useQuery<CampaignStats>({
    queryKey: ['/api/admin/prospect-campaigns', selectedId, 'stats'],
    enabled: !!selectedId && detailTab === 'statistieken' && isSentStatus(selectedCampaign?.status ?? ''),
    queryFn: () => fetchJson<CampaignStats>(`/api/admin/prospect-campaigns/${selectedId}/stats`),
    refetchInterval: 30000,
  });

  type KlikRegel = { url: string; kliks: number; unieke_kliks: number };
  type ContactRegel = { id: number; name: string; email: string; company?: string | null };
  type KlikAnalyseData = { klik_analyse: KlikRegel[]; geopend_door: ContactRegel[]; niet_geopend: ContactRegel[] };

  const { data: klikAnalyse, isLoading: klikLoading } = useQuery<KlikAnalyseData>({
    queryKey: ['/api/admin/prospect-campaigns', selectedId, 'click-analyse'],
    enabled: !!selectedId && detailTab === 'statistieken' && isSentStatus(selectedCampaign?.status ?? ''),
    queryFn: () => fetchJson<KlikAnalyseData>(`/api/admin/prospect-campaigns/${selectedId}/click-analyse`),
  });

  const [klikAnalyseOpen, setKlikAnalyseOpen] = useState(false);
  const [geopendOpen, setGeopendOpen] = useState(false);
  const [nietGeopendOpen, setNietGeopendOpen] = useState(false);

  // ── Mutations
  const deleteMut = useMutation({
    mutationFn: ({ id, force }: { id: number; force?: boolean }) =>
      apiRequest('DELETE', `/api/admin/prospect-campaigns/${id}${force ? '?force=true' : ''}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      setSelectedId(null); setDeleteId(null); setDeleteConfirmText('');
      toast({ title: 'Campagne verwijderd' });
    },
    onError: (e: any) => toast({ title: e?.data?.message || 'Verwijderen mislukt', variant: 'destructive' }),
  });

  const duplicateMut = useMutation({
    mutationFn: async (c: Campaign) => apiRequest('POST', `/api/admin/prospect-campaigns/${c.id}/duplicate`),
    onSuccess: (c: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      setSelectedId(c.id);
      toast({ title: `Kopie '${c.name}' aangemaakt` });
    },
    onError: (e: any) => toast({ title: e?.data?.message || 'Dupliceren mislukt', variant: 'destructive' }),
  });

  const genereerVariantenMut = useMutation({
    mutationFn: async (args: { id: number; branches: string[]; functies: string[]; talen: string[] }) =>
      apiRequest('POST', `/api/admin/prospect-campaigns/${args.id}/genereer-varianten`, {
        branches: args.branches, functies: args.functies, talen: args.talen,
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      toast({ title: `${res.aantal} varianten aangemaakt` });
    },
    onError: (e: any) => toast({ title: e?.data?.message || 'Varianten aanmaken mislukt', variant: 'destructive' }),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PUT', `/api/admin/prospect-campaigns/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] }); },
  });

  // ── Filtered list
  const statusCounts = {
    alle: campaigns.length,
    concept: campaigns.filter(c => ['concept','draft'].includes(c.status)).length,
    gepland: campaigns.filter(c => ['gepland','scheduled'].includes(c.status)).length,
    actief: campaigns.filter(c => c.status === 'actief').length,
    voltooid: campaigns.filter(c => ['voltooid','sent'].includes(c.status)).length,
  };

  const STATUS_FILTER_OPTIONS = [
    { v: 'alle', label: 'Alle' },
    { v: 'concept', label: 'Concept' },
    { v: 'gepland', label: 'Gepland' },
    { v: 'actief', label: 'Actief' },
    { v: 'voltooid', label: 'Voltooid' },
  ];

  const filteredCampaigns = campaigns.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'alle' ||
      (statusFilter === 'concept' && ['concept','draft'].includes(c.status)) ||
      (statusFilter === 'gepland' && ['gepland','scheduled'].includes(c.status)) ||
      (statusFilter === 'actief' && c.status === 'actief') ||
      (statusFilter === 'voltooid' && ['voltooid','sent'].includes(c.status));
    const matchSerie = serieFilter === 'alle' ||
      (serieFilter === '__geen__' ? !c.serie : c.serie === serieFilter);
    const cBranche = c.brancheFilter?.[0] ?? '';
    const cFunctie = c.functieFilter?.[0] ?? '';
    const cTaal = c.taalFilter ?? 'alles';
    const matchBranche = brancheGroepFilter === 'alle' || cBranche === brancheGroepFilter;
    const matchFunctie = functieGroepFilter === 'alle' || cFunctie === functieGroepFilter;
    const matchTaal = taalGroepFilter === 'alle' || cTaal === taalGroepFilter;
    return matchSearch && matchStatus && matchSerie && matchBranche && matchFunctie && matchTaal;
  }).sort((a, b) => {
    // Eerst op serie (alfabetisch, leeg laatst), daarna stapnr, daarna gepland-tijd
    const sa = a.serie ?? '\uffff'; const sb = b.serie ?? '\uffff';
    if (sa !== sb) return sa.localeCompare(sb);
    const na = a.serieStapNr ?? 9999; const nb = b.serieStapNr ?? 9999;
    if (na !== nb) return na - nb;
    if (['gepland','scheduled'].includes(a.status) && ['gepland','scheduled'].includes(b.status)) {
      const da = a.werkelijkVerzendOp ? new Date(a.werkelijkVerzendOp).getTime() : 0;
      const db2 = b.werkelijkVerzendOp ? new Date(b.werkelijkVerzendOp).getTime() : 0;
      return da - db2;
    }
    return a.name.localeCompare(b.name);
  });

  // Unieke series + filter-opties uit alle campagnes
  const seriesSet = new Set<string>();
  const branchesSet = new Set<string>();
  const functiesSet = new Set<string>();
  const talenSet = new Set<string>();
  for (const c of campaigns) {
    if (c.serie) seriesSet.add(c.serie);
    if (c.brancheFilter?.[0]) branchesSet.add(c.brancheFilter[0]);
    if (c.functieFilter?.[0]) functiesSet.add(c.functieFilter[0]);
    if (c.taalFilter && c.taalFilter !== 'alles') talenSet.add(c.taalFilter);
  }
  const alleSeries = Array.from(seriesSet).sort();
  const alleBranches = Array.from(branchesSet).sort();
  const alleFuncties = Array.from(functiesSet).sort();
  const alleTalen = Array.from(talenSet).sort();

  // Groepeer gefilterde campagnes per serie (geen serie = "Losse campagnes")
  type GroepKey = string;
  const grouped = new Map<GroepKey, { label: string; isLos: boolean; items: Campaign[] }>();
  for (const c of filteredCampaigns) {
    const key = c.serie ?? '__los__';
    if (!grouped.has(key)) grouped.set(key, { label: c.serie ?? 'Losse campagnes', isLos: !c.serie, items: [] });
    grouped.get(key)!.items.push(c);
  }
  const groupedArr = Array.from(grouped.entries()).sort(([ka, va], [kb, vb]) => {
    if (va.isLos && !vb.isLos) return 1;
    if (!va.isLos && vb.isLos) return -1;
    return va.label.localeCompare(vb.label);
  });

  const filtersActive = serieFilter !== 'alle' || brancheGroepFilter !== 'alle' ||
    functieGroepFilter !== 'alle' || taalGroepFilter !== 'alle';
  const wisFilters = () => {
    setSerieFilter('alle'); setBrancheGroepFilter('alle');
    setFunctieGroepFilter('alle'); setTaalGroepFilter('alle');
  };

  function groepStatusBalk(items: Campaign[]) {
    const t: Record<string, number> = { concept: 0, gepland: 0, actief: 0, voltooid: 0 };
    for (const c of items) {
      if (['concept','draft'].includes(c.status)) t.concept++;
      else if (['gepland','scheduled'].includes(c.status)) t.gepland++;
      else if (c.status === 'actief') t.actief++;
      else if (['voltooid','sent'].includes(c.status)) t.voltooid++;
    }
    return t;
  }

  // ── Segment summary text
  function getSegmentSummary(c: Campaign): string {
    const parts: string[] = [];
    if (c.brancheFilter?.length > 0) parts.push(`Branches: ${c.brancheFilter.join(', ')}`);
    if (c.phaseFilter && c.phaseFilter.length > 0) {
      parts.push(`Fase: ${c.phaseFilter.map(p => PHASE_LABELS[p] ?? p).join(', ')}`);
    }
    if (c.functieFilter && c.functieFilter.length > 0) {
      parts.push(`Functies: ${c.functieFilter.join(', ')}`);
    }
    if (c.typeFilter && c.typeFilter !== 'alles') parts.push(`Type: ${c.typeFilter === 'prospect' ? 'Prospects' : 'Klanten'}`);
    if (c.taalFilter && c.taalFilter !== 'alles') parts.push(`Taal: ${c.taalFilter}`);
    const tags = (() => { try { return JSON.parse(c.tagFilter || '[]'); } catch { return []; } })();
    if (tags.length > 0) parts.push(`Tags: ${tags.join(', ')}`);
    return parts.length > 0 ? parts.join(' | ') : 'Alle actieve contacten';
  }

  /**
   * Losse contacten aan de campagne toevoegen.
   *
   * Bewust een JSX-constante en geen eigen component: een component die hier
   * binnen wordt gedefinieerd, wordt bij elke render opnieuw aangemaakt en
   * daardoor opnieuw gemonteerd — dan verlies je de focus in het zoekveld bij
   * elke toetsaanslag.
   *
   * Al in de lijst? Dan geen knop maar een rustige melding. Iemand twee keer
   * toevoegen is geen fout, maar wel verwarrend.
   */
  const alInLijst = new Set((segmentPreview?.contacts ?? []).map(c => c.id));
  const contactToevoeger = (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Contact toevoegen</p>
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          value={contactZoek}
          onChange={e => setContactZoek(e.target.value)}
          placeholder="Zoek op naam, e-mail of bedrijf..."
          className="pl-7 h-9 text-sm"
          data-testid="input-contact-zoeken"
        />
      </div>
      {contactZoek.trim().length >= 2 && (
        <div className="mt-2 max-w-md border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {zoekResultaten.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-3">Geen contacten gevonden.</p>
          ) : zoekResultaten.slice(0, 25).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{c.name || c.email}</p>
                <p className="text-[11px] text-slate-400 truncate">{c.email}{c.company ? ` · ${c.company}` : ''}</p>
              </div>
              {alInLijst.has(c.id) ? (
                <span className="text-[11px] text-slate-400 flex-shrink-0">Staat er al in</span>
              ) : (
                <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0"
                  disabled={toggleExtra.isPending}
                  onClick={() => toggleExtra.mutate({ contactId: c.id, toevoegen: true })}
                  data-testid={`btn-extra-toevoegen-${c.id}`}>
                  Toevoegen
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-400 mt-2">
        Een handmatig toegevoegd contact krijgt de mail ook als het buiten de doelgroep valt.
        Uitgeschreven en geblokkeerde contacten kunnen niet worden toegevoegd.
      </p>
    </div>
  );

  function isSentStatus(status: string) { return ['sent','voltooid','actief'].includes(status); }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* ── Page header (Onboarding-stijl) ── */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4" style={{ gridTemplateColumns: '320px 1fr' }}>

      {/* ── Left: Campaign list (witte card) ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 h-fit flex flex-col">
        {/* Nieuw knop */}
        <Button
          onClick={() => setWizardOpen(true)}
          className="w-full mb-3 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Nieuwe campagne
        </Button>

        {/* Zoekveld */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoeken..." className="pl-7 h-9 text-sm bg-white" />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1 flex-wrap mb-3">
          {STATUS_FILTER_OPTIONS.map(opt => {
            const count = statusCounts[opt.v as keyof typeof statusCounts] ?? 0;
            const isActive = statusFilter === opt.v;
            return (
              <button key={opt.v} onClick={() => setStatusFilter(opt.v)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${isActive ? 'bg-purple-100 border-purple-300 text-purple-700 font-medium' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {opt.label}
                {count > 0 && opt.v !== 'alle' && (
                  <span className={`text-[10px] px-1 rounded-full ${isActive ? 'bg-purple-200 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
                )}
                {opt.v === 'alle' && (
                  <span className={`text-[10px] px-1 rounded-full ${isActive ? 'bg-purple-200 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Groep-filters (Serie / Branche / Functie / Taal) — shadcn Select in 2x2 grid */}
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={serieFilter} onValueChange={setSerieFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle series</SelectItem>
                {alleSeries.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                <SelectItem value="__geen__">— Losse campagnes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={brancheGroepFilter} onValueChange={setBrancheGroepFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle branches</SelectItem>
                {alleBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={functieGroepFilter} onValueChange={setFunctieGroepFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle functies</SelectItem>
                {alleFuncties.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={taalGroepFilter} onValueChange={setTaalGroepFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle talen</SelectItem>
                {alleTalen.map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filtersActive && (
            <button onClick={wisFilters} className="text-xs text-purple-600 hover:text-purple-800 hover:underline">
              Wis filters
            </button>
          )}
        </div>

        {/* Campaign list (gegroepeerd per serie) */}
        <div className="space-y-1 max-h-[calc(100vh-460px)] overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Laden...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center">
              <Megaphone className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">{campaigns.length === 0 ? 'Nog geen campagnes' : 'Geen campagnes gevonden'}</p>
            </div>
          ) : (
            <div className="py-1">
              {groupedArr.map(([key, groep]) => {
                const isCollapsed = collapsedGroups[key] === true;
                const tellers = groepStatusBalk(groep.items);
                return (
                  <div key={key} className="border-b border-slate-100">
                    <button
                      onClick={() => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors text-left ${groep.isLos ? 'bg-slate-50/40' : 'bg-slate-50/80'}`}>
                      <ChevronRight className={`h-3 w-3 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                      <span className={`text-[11px] font-semibold flex-1 truncate ${groep.isLos ? 'text-slate-500 italic' : 'text-slate-700'}`}>
                        {groep.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{groep.items.length}</span>
                      <div className="flex gap-0.5 items-center">
                        {tellers.concept > 0 && <span className="text-[9px] px-1 rounded bg-gray-100 text-gray-600">{tellers.concept}</span>}
                        {tellers.gepland > 0 && <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-700">{tellers.gepland}</span>}
                        {tellers.actief > 0 && <span className="text-[9px] px-1 rounded bg-green-100 text-green-700">{tellers.actief}</span>}
                        {tellers.voltooid > 0 && <span className="text-[9px] px-1 rounded bg-slate-200 text-slate-600">{tellers.voltooid}</span>}
                      </div>
                    </button>
                    {!isCollapsed && groep.items.map(c => {
                const sb = STATUS_BADGE[c.status] ?? STATUS_BADGE.concept;
                const tb = TYPE_BADGE[c.campagneType ?? 'bulk'] ?? TYPE_BADGE.bulk;
                const isActive = c.id === selectedId;
                const hasSentStats = isSentStatus(c.status) && (c.sentCount ?? 0) > 0;
                return (
                  <div key={c.id} onClick={() => { setSelectedId(c.id); setDetailTab('overzicht'); }}
                    className={`group px-3 py-2.5 border-b border-slate-50 cursor-pointer transition-colors ${isActive ? 'bg-purple-50/60' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tb.cls}`}>{tb.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${sb.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sb.dot}`} />{sb.label}
                          </span>
                        </div>
                        <p className={`text-xs font-medium truncate ${isActive ? 'text-purple-800' : 'text-gray-800'}`}>{c.name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.subject}</p>
                        {hasSentStats && (
                          <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                            <span className="flex items-center gap-0.5"><Send className="h-2.5 w-2.5" />{c.sentCount}</span>
                            <span className="flex items-center gap-0.5"><MailOpen className="h-2.5 w-2.5" />{c.sentCount > 0 ? Math.round(c.openCount / c.sentCount * 100) : 0}%</span>
                            <span className="flex items-center gap-0.5"><MousePointer className="h-2.5 w-2.5" />{c.sentCount > 0 ? Math.round(c.clickCount / c.sentCount * 100) : 0}%</span>
                          </div>
                        )}
                        {['gepland','scheduled'].includes(c.status) && c.werkelijkVerzendOp && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-500">
                            <CalendarClock className="h-2.5 w-2.5" />
                            {new Date(c.werkelijkVerzendOp).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                      {/* Action menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 flex-shrink-0">
                            <MoreVertical className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); setSelectedId(c.id); setDetailTab('overzicht'); }}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); duplicateMut.mutate(c); }}>
                            <Copy className="h-3.5 w-3.5 mr-2" />Dupliceren
                          </DropdownMenuItem>
                          {['actief','gepland','scheduled'].includes(c.status) && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); updateStatusMut.mutate({ id: c.id, status: 'gestopt' }); }} className="text-orange-600">
                              <Square className="h-3.5 w-3.5 mr-2" />Stoppen
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteId(c.id); setDeleteConfirmText(''); }} className="text-red-600">
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Detail / empty state (witte card) ── */}
      {!selectedCampaign ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Megaphone className="h-14 w-14 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Selecteer een campagne</p>
          <p className="text-xs text-slate-300 mt-1">of maak een nieuwe aan via "Nieuwe campagne"</p>
          <Button onClick={() => setWizardOpen(true)} className="mt-4 gap-1.5 bg-purple-600 hover:bg-purple-700" size="sm">
            <Plus className="h-3.5 w-3.5" />Eerste campagne aanmaken
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden">
          {/* Campaign header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[selectedCampaign.campagneType ?? 'bulk']?.cls}`}>
                  {TYPE_BADGE[selectedCampaign.campagneType ?? 'bulk']?.label}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${STATUS_BADGE[selectedCampaign.status]?.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGE[selectedCampaign.status]?.dot}`} />
                  {STATUS_BADGE[selectedCampaign.status]?.label}
                </span>
              </div>
              <h2 className="text-base font-semibold text-gray-900 truncate">{selectedCampaign.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedCampaign.subject}</p>
              {selectedCampaign.serie && (
                <p className="text-[11px] text-purple-600 mt-0.5 truncate">
                  Serie: {selectedCampaign.serie}
                  {selectedCampaign.serieStapNr ? ` — stap ${selectedCampaign.serieStapNr}` : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end shrink-0 max-w-full">
              {selectedCampaign.campagneType === 'flow' ? (
                <Button size="sm" variant="outline" className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-50 shrink-0" onClick={() => setFlowBuilderOpen(true)}>
                  <Zap className="h-3.5 w-3.5" /><span className="hidden sm:inline">Flow opmaken</span>
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => setBuilderOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" /><span className="hidden sm:inline">E-mail opmaken</span>
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1 shrink-0"
                onClick={() => duplicateMut.mutate(selectedCampaign)}
                disabled={duplicateMut.isPending}
                title="Dupliceren">
                <Copy className="h-3.5 w-3.5" /><span className="hidden md:inline">Dupliceren</span>
              </Button>
              {['concept','draft'].includes(selectedCampaign.status) && (
                <Button size="sm" variant="outline" className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-50 shrink-0"
                  onClick={() => setVariantenWizardOpen(true)}
                  title="Genereer varianten">
                  <Plus className="h-3.5 w-3.5" /><span className="hidden md:inline">Genereer varianten</span>
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2 shrink-0"
                onClick={() => { setDeleteId(selectedCampaign.id); setDeleteConfirmText(''); }}
                title="Verwijderen">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-slate-100 px-6">
              <TabsList className="h-9 bg-transparent gap-0 p-0">
                {[
                  { v: 'overzicht', label: 'Overzicht', icon: FileText },
                  { v: 'statistieken', label: 'Statistieken', icon: BarChart2, hide: selectedCampaign?.campagneType === 'flow' || !!selectedCampaign?.abTestActief },
                  { v: 'ab-rapport', label: 'A/B Rapport', icon: FlaskConical, hide: !selectedCampaign?.abTestActief || selectedCampaign?.campagneType === 'flow' },
                  { v: 'ontvangers', label: 'Ontvangers', icon: Users, hide: selectedCampaign?.campagneType === 'flow' },
                  { v: 'voortgang', label: 'Flow voortgang', icon: Zap, hide: selectedCampaign?.campagneType !== 'flow' },
                ].filter(t => !t.hide).map(t => (
                  <TabsTrigger key={t.v} value={t.v}
                    className="h-9 text-xs data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-700 data-[state=active]:bg-transparent data-[state=inactive]:text-slate-400 rounded-none px-4 gap-1.5">
                    <t.icon className="h-3 w-3" />{t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overzicht */}
            <TabsContent value="overzicht" className="flex-1 overflow-auto p-4">
              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Hoofdkolom: instellingen */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Serie-toewijzing */}
                  <SerieEditor campaign={selectedCampaign} alleSeries={alleSeries} />

                  {/* Doelgroep samenvatting */}
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 flex items-start gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-2">Doelgroep:</span>
                      <span className="text-xs text-slate-700">{getSegmentSummary(selectedCampaign)}</span>
                    </div>
                    {/* Alleen zolang de campagne nog niet verstuurd is: de doelgroep
                        van een verzonden campagne aanpassen zou de statistieken
                        laten slaan op een lijst die nooit is gebruikt. */}
                    {isPlannedOrConcept && (
                      <Button size="sm" variant="ghost"
                        className="h-6 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex-shrink-0"
                        onClick={() => setDoelgroepOpen(true)}
                        data-testid="btn-doelgroep-aanpassen">
                        <Pencil className="h-3 w-3 mr-1" /> Aanpassen
                      </Button>
                    )}
                  </div>

                  {/* Verzendplanning sectie */}
                  <VerzendplanningSection
                    campaign={selectedCampaign}
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] })}
                  />
                </div>

                {/* Zijkolom: status & extra's */}
                <div className="space-y-3">
                  {/* E-mail inhoud status */}
                  <div className={`rounded-xl px-3 py-2.5 border ${selectedCampaign.htmlContent ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedCampaign.htmlContent
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                      <p className={`text-xs font-medium ${selectedCampaign.htmlContent ? 'text-green-700' : 'text-amber-700'}`}>
                        {selectedCampaign.htmlContent ? 'E-mail inhoud ingevuld' : 'E-mail inhoud ontbreekt'}
                      </p>
                    </div>
                    <Button size="sm" variant={selectedCampaign.htmlContent ? 'outline' : 'default'}
                      className={`w-full h-7 text-xs ${selectedCampaign.htmlContent ? '' : 'bg-purple-600 hover:bg-purple-700'}`}
                      onClick={() => setBuilderOpen(true)}>
                      <Pencil className="h-3 w-3 mr-1.5" />E-mail opmaken
                    </Button>
                  </div>

                  {/* A/B test */}
                  {selectedCampaign.abTestActief && (
                    <div className="bg-purple-50 rounded-xl px-3 py-2.5 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FlaskConical className="h-3 w-3" />A/B Test
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-purple-400">Split</span><span className="font-medium text-purple-700">A: {selectedCampaign.abSplitPct}% / B: {100 - selectedCampaign.abSplitPct}%</span></div>
                        <div className="flex justify-between"><span className="text-purple-400">Winnaar op</span><span className="font-medium text-purple-700">{selectedCampaign.abWinnaarOp === 'open_rate' ? 'Open rate' : 'Click rate'} na {selectedCampaign.abWinnaarNaUren}u</span></div>
                        {selectedCampaign.abWinnaarVariant && <div className="flex justify-between"><span className="text-purple-400">Winnaar</span><span className="font-bold text-purple-700">Variant {selectedCampaign.abWinnaarVariant}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Statistieken */}
            <TabsContent value="statistieken" className="flex-1 overflow-auto p-6">
              {!isSentStatus(selectedCampaign.status) ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart2 className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Statistieken beschikbaar na verzending</p>
                    <p className="text-xs text-slate-300 mt-1">Activeer en verzend de campagne om statistieken te zien</p>
                  </div>
                </div>
              ) : statsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-6 w-6 text-slate-300 animate-spin" />
                </div>
              ) : (
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Main KPI cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Verzonden', value: campaignStats?.verzonden ?? selectedCampaign.sentCount ?? 0, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
                      // Blok 3 — Afgeleverd komt van SendGrid 'delivered' events
                      { label: 'Afgeleverd', value: selectedCampaign.deliveredCount ?? 0, sub: ((selectedCampaign.sentCount ?? 0) > 0 ? `${Math.round(((selectedCampaign.deliveredCount ?? 0) / (selectedCampaign.sentCount || 1)) * 100)}%` : '0%'), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Geopend', value: `${campaignStats?.geopend_pct ?? 0}%`, sub: `${campaignStats?.geopend ?? 0} uniek`, icon: MailOpen, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Geklikt', value: `${campaignStats?.geklikt_pct ?? 0}%`, sub: `${campaignStats?.geklikt ?? 0} uniek`, icon: MousePointer, color: 'text-purple-600', bg: 'bg-purple-50' },
                      // Blok 3 — Reply teller (SendGrid Inbound Parse)
                      { label: 'Replies', value: selectedCampaign.replyCount ?? 0, icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { label: 'Uitgeschreven', value: `${campaignStats?.uitgeschreven_pct ?? 0}%`, sub: `${campaignStats?.uitgeschreven ?? 0} totaal`, icon: X, color: 'text-orange-500', bg: 'bg-orange-50' },
                      // Blok 3 — Bounce + Spam tellers (SendGrid bounce/spamreport events)
                      { label: 'Bounces', value: selectedCampaign.bounceCount ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Spam', value: selectedCampaign.spamCount ?? 0, icon: Flag, color: 'text-rose-600', bg: 'bg-rose-50' },
                      { label: 'Mislukt', value: campaignStats?.mislukt ?? selectedCampaign.failedCount ?? 0, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
                    ].map(stat => (
                      <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-white`}>
                        <div className="flex items-center gap-2 mb-1">
                          <stat.icon className={`h-4 w-4 ${stat.color}`} />
                          <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        {(stat as any).sub && <p className="text-xs text-gray-400 mt-0.5">{(stat as any).sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Blok 3 — Replies paneel (laatst ontvangen antwoorden voor deze campagne) */}
                  <CampagneRepliesPaneel campaignId={selectedCampaign.id} />

                  {/* A/B Test vergelijking */}
                  {selectedCampaign.abTestActief && campaignStats && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FlaskConical className="h-4 w-4 text-slate-500" />
                        <p className="text-sm font-semibold text-slate-700">A/B Test Vergelijking</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-400 border-b border-slate-200">
                              <th className="text-left py-2 font-medium">Variant</th>
                              <th className="text-right py-2 font-medium">Verzonden</th>
                              <th className="text-right py-2 font-medium">Open %</th>
                              <th className="text-right py-2 font-medium">Klik %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { label: 'Variant A', data: campaignStats.variant_a, winner: campaignStats.variant_a.geopend_pct >= campaignStats.variant_b.geopend_pct },
                              { label: 'Variant B', data: campaignStats.variant_b, winner: campaignStats.variant_b.geopend_pct > campaignStats.variant_a.geopend_pct },
                            ].map(v => (
                              <tr key={v.label} className="border-b border-slate-100 last:border-0">
                                <td className="py-2.5 font-medium text-slate-700 flex items-center gap-2">
                                  {v.label}
                                  {v.winner && v.data.verzonden > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Winnaar</span>}
                                </td>
                                <td className="py-2.5 text-right text-slate-600">{v.data.verzonden}</td>
                                <td className={`py-2.5 text-right font-semibold ${v.winner ? 'text-green-600' : 'text-slate-500'}`}>{v.data.geopend_pct}%</td>
                                <td className="py-2.5 text-right text-slate-600">{v.data.geklikt_pct}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── Klik-analyse tabel ── */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                      onClick={() => setKlikAnalyseOpen(o => !o)}
                    >
                      <div className="flex items-center gap-2">
                        <MousePointer className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-semibold text-slate-700">URL Klik-analyse</span>
                        {(klikAnalyse?.klik_analyse?.length ?? 0) > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                            {klikAnalyse!.klik_analyse.length} URL{klikAnalyse!.klik_analyse.length !== 1 ? "'s" : ''}
                          </span>
                        )}
                      </div>
                      {klikAnalyseOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                    {klikAnalyseOpen && (
                      <div className="p-4">
                        {klikLoading ? (
                          <div className="py-6 text-center text-slate-300 text-sm"><RefreshCw className="h-4 w-4 animate-spin mx-auto" /></div>
                        ) : (klikAnalyse?.klik_analyse?.length ?? 0) === 0 ? (
                          <div className="py-8 text-center">
                            <MousePointer className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Nog geen klikken geregistreerd</p>
                            <p className="text-xs text-slate-300 mt-1">Klikdata wordt bijgehouden zodra ontvangers op links klikken</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400">
                                  <th className="text-left pb-2 font-semibold">URL</th>
                                  <th className="text-right pb-2 font-semibold">Totaal</th>
                                  <th className="text-right pb-2 font-semibold">Uniek</th>
                                  <th className="text-right pb-2 font-semibold">CTR</th>
                                </tr>
                              </thead>
                              <tbody>
                                {klikAnalyse!.klik_analyse.map((k, i) => {
                                  const ctr = campaignStats?.verzonden
                                    ? ((k.unieke_kliks / campaignStats.verzonden) * 100).toFixed(1)
                                    : '—';
                                  return (
                                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                      <td className="py-2.5 pr-4 max-w-[280px]">
                                        <div className="flex items-center gap-1.5">
                                          <span className="truncate text-slate-600">{k.url}</span>
                                          <a href={k.url} target="_blank" rel="noopener noreferrer"
                                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="h-3 w-3 text-slate-300 hover:text-purple-500" />
                                          </a>
                                        </div>
                                      </td>
                                      <td className="py-2.5 text-right font-medium text-slate-700">{k.kliks}</td>
                                      <td className="py-2.5 text-right text-slate-500">{k.unieke_kliks}</td>
                                      <td className="py-2.5 text-right font-semibold text-purple-600">{ctr}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Geopend door ── */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                      onClick={() => setGeopendOpen(o => !o)}
                    >
                      <div className="flex items-center gap-2">
                        <MailOpen className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold text-slate-700">Geopend door</span>
                        {(klikAnalyse?.geopend_door?.length ?? 0) > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                            {klikAnalyse!.geopend_door.length} contact{klikAnalyse!.geopend_door.length !== 1 ? 'en' : ''}
                          </span>
                        )}
                      </div>
                      {geopendOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                    {geopendOpen && (
                      <div className="p-4">
                        {klikLoading ? (
                          <div className="py-4 text-center text-slate-300 text-sm"><RefreshCw className="h-4 w-4 animate-spin mx-auto" /></div>
                        ) : (klikAnalyse?.geopend_door?.length ?? 0) === 0 ? (
                          <p className="py-6 text-center text-sm text-slate-400">Nog niemand heeft de e-mail geopend</p>
                        ) : (
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {klikAnalyse!.geopend_door.map(c => (
                              <div key={c.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-green-50/50 transition-colors group">
                                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[10px] font-semibold text-green-600">{c.name[0]?.toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-700 truncate">{c.name}</p>
                                  {c.company && <p className="text-[10px] text-slate-400 truncate">{c.company}</p>}
                                </div>
                                <span className="text-[10px] text-slate-300 truncate hidden group-hover:block">{c.email}</span>
                                <CheckCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Niet geopend + follow-up ── */}
                  <div className="border border-orange-200 rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-orange-50 hover:bg-orange-100/60 transition-colors text-left"
                      onClick={() => setNietGeopendOpen(o => !o)}
                    >
                      <div className="flex items-center gap-2">
                        <UserMinus className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold text-slate-700">Niet geopend</span>
                        {(klikAnalyse?.niet_geopend?.length ?? 0) > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                            {klikAnalyse!.niet_geopend.length} contact{klikAnalyse!.niet_geopend.length !== 1 ? 'en' : ''}
                          </span>
                        )}
                      </div>
                      {nietGeopendOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                    {nietGeopendOpen && (
                      <div className="p-4 space-y-3">
                        {klikLoading ? (
                          <div className="py-4 text-center text-slate-300 text-sm"><RefreshCw className="h-4 w-4 animate-spin mx-auto" /></div>
                        ) : (klikAnalyse?.niet_geopend?.length ?? 0) === 0 ? (
                          <p className="py-6 text-center text-sm text-slate-400">Iedereen heeft de e-mail geopend 🎉</p>
                        ) : (
                          <>
                            <div className="space-y-1 max-h-56 overflow-y-auto">
                              {klikAnalyse!.niet_geopend.map(c => (
                                <div key={c.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-orange-50/50 transition-colors">
                                  <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-semibold text-orange-500">{c.name[0]?.toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">{c.name}</p>
                                    {c.company && <p className="text-[10px] text-slate-400 truncate">{c.company}</p>}
                                  </div>
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px] hidden sm:block">{c.email}</span>
                                </div>
                              ))}
                            </div>

                            {/* Follow-up knop */}
                            <div className="border-t border-orange-100 pt-3">
                              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <p className="text-xs text-slate-600 mb-3">
                                  <span className="font-semibold text-slate-700">{klikAnalyse!.niet_geopend.length} contacten</span> hebben
                                  {" "}<span className="font-medium">"{selectedCampaign.name}"</span> niet geopend.
                                  Stuur hen een follow-up herinnering.
                                </p>
                                <Button
                                  size="sm"
                                  className="bg-orange-500 hover:bg-orange-600 text-white w-full gap-2 text-xs"
                                  onClick={() => {
                                    const ids = klikAnalyse!.niet_geopend.map(c => c.id).join(',');
                                    toast({
                                      title: 'Follow-up contacten geselecteerd',
                                      description: `${klikAnalyse!.niet_geopend.length} contacten klaar. Maak een nieuwe campagne aan en selecteer deze contacten.`,
                                    });
                                  }}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Verstuur follow-up campagne
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedCampaign.sentAt && (
                    <p className="text-xs text-gray-400">Verzonden op: {new Date(selectedCampaign.sentAt).toLocaleString('nl-NL')}</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* A/B Rapport */}
            {selectedCampaign?.abTestActief && (
              <TabsContent value="ab-rapport" className="flex-1 overflow-auto p-6">
                <ABRapportageTab campaign={selectedCampaign} />
              </TabsContent>
            )}

            {/* Ontvangers */}
            <TabsContent value="ontvangers" className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 max-w-5xl mx-auto">
                  {isPlannedOrConcept ? (
                    // Voor concept/geplande campagnes: live preview van wie er
                    // op verzendmoment in het segment zal zitten, met de mogelijkheid
                    // om individuele contacten uit te sluiten.
                    segLoading ? (
                      <div className="text-center py-8 text-slate-400 text-sm">Verzendlijst laden...</div>
                    ) : !segmentPreview || segmentPreview.contacts.length === 0 ? (
                      <div>
                        <div className="text-center py-10">
                          <Users className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">Geen contacten in dit segment</p>
                          <p className="text-xs text-slate-300 mt-1">Pas de doelgroep aan in het Overzicht, of voeg hieronder losse contacten toe.</p>
                        </div>
                        {contactToevoeger}
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 flex items-center gap-3 text-xs">
                          <div className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                            <span className="text-slate-500">Verzendlijst </span>
                            <span className="font-semibold text-purple-700">{segmentPreview.verzendBaar}</span>
                            <span className="text-slate-400"> / {segmentPreview.totaal} contacten</span>
                          </div>
                          {segmentPreview.uitgesloten > 0 && (
                            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 font-medium">
                              {segmentPreview.uitgesloten} uitgesloten
                            </div>
                          )}
                          {(segmentPreview.handmatig ?? 0) > 0 && (
                            <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-medium">
                              {segmentPreview.handmatig} handmatig toegevoegd
                            </div>
                          )}
                          <p className="text-slate-400 text-[11px]">Live berekend op basis van de doelgroep van deze campagne, plus wat je handmatig hebt toegevoegd.</p>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-400 border-b border-slate-100">
                              <th className="text-left py-2 font-medium">Contact</th>
                              <th className="text-left py-2 font-medium">Bedrijf</th>
                              <th className="text-left py-2 font-medium">Functie</th>
                              <th className="text-left py-2 font-medium">Type</th>
                              <th className="text-left py-2 font-medium">Herkomst</th>
                              <th className="text-right py-2 font-medium pr-2">Actie</th>
                            </tr>
                          </thead>
                          <tbody>
                            {segmentPreview.contacts.map(c => (
                              <tr key={c.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${c.excluded ? 'opacity-50' : ''}`}>
                                <td className="py-2">
                                  <p className={`font-medium text-xs ${c.excluded ? 'line-through text-slate-400' : 'text-slate-700'}`}>{c.name || c.email}</p>
                                  {c.name && <p className="text-xs text-slate-400">{c.email}</p>}
                                </td>
                                <td className="py-2 text-xs text-slate-600">{c.company || '—'}</td>
                                <td className="py-2 text-xs text-slate-600">
                                  {c.function || c.functiegroep || '—'}
                                  {c.branche && <span className="block text-[10px] text-slate-400">{c.branche}</span>}
                                </td>
                                <td className="py-2">
                                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.contactType === 'klant' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                                    {c.contactType === 'klant' ? 'Klant' : 'Prospect'}
                                  </span>
                                </td>
                                <td className="py-2">
                                  {c.herkomst === 'handmatig' ? (
                                    <button
                                      className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                      title="Klik om de handmatige toevoeging weg te halen"
                                      disabled={toggleExtra.isPending}
                                      onClick={() => toggleExtra.mutate({ contactId: c.id, toevoegen: false })}
                                      data-testid={`btn-extra-weg-${c.id}`}>
                                      Handmatig ✕
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-slate-400">Doelgroep</span>
                                  )}
                                </td>
                                <td className="py-2 text-right pr-2">
                                  {c.excluded ? (
                                    <Button size="sm" variant="outline" className="h-7 text-xs"
                                      disabled={toggleExclusion.isPending}
                                      onClick={() => toggleExclusion.mutate({ contactId: c.id, exclude: false })}
                                      data-testid={`btn-include-${c.id}`}>
                                      Toevoegen
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50"
                                      disabled={toggleExclusion.isPending}
                                      onClick={() => toggleExclusion.mutate({ contactId: c.id, exclude: true })}
                                      data-testid={`btn-exclude-${c.id}`}>
                                      Uitsluiten
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {contactToevoeger}
                      </>
                    )
                  ) : recipLoading ? (
                    <div className="text-center py-8 text-slate-400 text-sm">Laden...</div>
                  ) : recipients.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Geen ontvangers voor deze campagne</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="text-left py-2 font-medium">Contact</th>
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium"><MailOpen className="h-3 w-3 inline mr-1" />Geopend</th>
                          <th className="text-left py-2 font-medium"><MousePointer className="h-3 w-3 inline mr-1" />Geklikt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map(r => (
                          <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-2">
                              <p className="font-medium text-slate-700 text-xs">{r.name || r.email}</p>
                              {r.name && <p className="text-xs text-slate-400">{r.email}</p>}
                              {r.company && <p className="text-xs text-slate-400">{r.company}</p>}
                            </td>
                            <td className="py-2">
                              <span className={`text-xs font-medium ${r.status === 'sent' ? 'text-green-600' : r.status === 'failed' ? 'text-red-500' : 'text-slate-400'}`}>
                                {r.status === 'sent' ? 'Verzonden' : r.status === 'failed' ? 'Mislukt' : 'Wacht'}
                              </span>
                            </td>
                            <td className="py-2">
                              {r.openedAt ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />{new Date(r.openedAt).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span> : <span className="text-xs text-slate-300">—</span>}
                            </td>
                            <td className="py-2">
                              {r.clickedAt ? <span className="text-xs text-blue-600 flex items-center gap-1"><MousePointer className="h-3 w-3" />{new Date(r.clickedAt).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span> : <span className="text-xs text-slate-300">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Flow voortgang tab */}
            {selectedCampaign?.campagneType === 'flow' && (
              <TabsContent value="voortgang" className="flex-1 overflow-auto p-6">
                <FlowVoortgangTab campaignId={selectedCampaign.id} />
              </TabsContent>
            )}

          </Tabs>
        </div>
      )}

        </div>{/* /grid */}
      </div>{/* /p-6 */}

      {/* ── Email Builder (full-page) ── */}
      {builderOpen && selectedCampaign && (
        <EmailBuilderPage
          campaign={selectedCampaign}
          onClose={() => setBuilderOpen(false)}
        />
      )}

      {/* ── Flow Builder (full-page) ── */}
      {flowBuilderOpen && selectedCampaign && (
        <FlowBuilderPage
          campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name}
          onClose={() => setFlowBuilderOpen(false)}
          onActivate={() => {
            setFlowBuilderOpen(false);
            queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
          }}
        />
      )}

      {/* ── Wizard modal ── */}
      <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreated={(c) => { setWizardOpen(false); setSelectedId(c.id); }} />

      {/* ── Doelgroep aanpassen ── */}
      {selectedCampaign && (
        <DoelgroepDialog
          campaign={selectedCampaign}
          open={doelgroepOpen}
          onClose={() => setDoelgroepOpen(false)}
        />
      )}

      {/* ── Genereer-varianten wizard ── */}
      {selectedCampaign && (
        <GenereerVariantenDialog
          open={variantenWizardOpen}
          onClose={() => setVariantenWizardOpen(false)}
          onConfirm={(b, f, t) => {
            genereerVariantenMut.mutate({ id: selectedCampaign.id, branches: b, functies: f, talen: t });
            setVariantenWizardOpen(false);
          }}
          pending={genereerVariantenMut.isPending}
        />
      )}

      {/* ── Delete confirm ── */}
      {(() => {
        const target = deleteId ? campaigns.find(c => c.id === deleteId) : null;
        const isConceptDelete = target ? ['concept','draft'].includes(target.status) : true;
        const requireType = !isConceptDelete;
        const canConfirm = !requireType || deleteConfirmText.trim().toUpperCase() === 'VERWIJDER';
        return (
          <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) { setDeleteId(null); setDeleteConfirmText(''); } }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isConceptDelete ? 'Campagne verwijderen?' : 'Verzonden campagne verwijderen?'}
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  {isConceptDelete ? (
                    <span>Dit kan niet ongedaan worden gemaakt.</span>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <p className="font-semibold mb-1">Let op — alle data van deze campagne wordt definitief verwijderd:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs">
                            <li>Verzendgeschiedenis &amp; ontvangerslijst</li>
                            <li>Open-, klik- en bouncestatistieken</li>
                            <li>Antwoorden gekoppeld aan deze campagne worden ontkoppeld</li>
                          </ul>
                          <p className="mt-2 text-xs">Doe dit alleen voor test- of opgeschoonde campagnes.</p>
                        </div>
                      </div>
                      {target && (
                        <div className="text-xs text-slate-600">
                          Campagne: <span className="font-medium text-slate-900">{target.name}</span>
                          <br />Status: <span className="font-medium">{target.status}</span> · Verzonden: <span className="font-medium">{target.sentCount ?? 0}</span>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Typ <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">VERWIJDER</span> om te bevestigen
                        </label>
                        <Input
                          autoFocus
                          value={deleteConfirmText}
                          onChange={e => setDeleteConfirmText(e.target.value)}
                          placeholder="VERWIJDER"
                          className="h-8 text-sm"
                          data-testid="input-delete-confirm"
                        />
                      </div>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  disabled={!canConfirm || deleteMut.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    if (deleteId && canConfirm) deleteMut.mutate({ id: deleteId, force: requireType });
                  }}
                  data-testid="button-confirm-delete">
                  {deleteMut.isPending ? 'Bezig…' : 'Verwijderen'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      })()}
    </div>
  );
}
