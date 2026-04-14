import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail, Plus, Trash2, Send, Users, FileText, BarChart2, ChevronRight, Pencil,
  AlertTriangle, RefreshCw, Search, Eye, MousePointer, CheckCircle, Clock, X,
  Megaphone, MailOpen, MoreVertical, ImageIcon, Play, Square, Copy, Rocket,
  ArrowLeft, ArrowRight, SlidersHorizontal, Calendar, Timer, FlaskConical,
  Zap, TrendingUp, Tag,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Campaign = {
  id: number; name: string; subject: string;
  campagneType: string; // bulk | flow
  status: string; // concept | gepland | actief | voltooid | gestopt | draft | sent | scheduled
  brancheFilter: string[]; functieFilter: string[];
  typeFilter: string; taalFilter: string; tagFilter: string;
  editorBlocks: string | null; contentA: string | null; contentB: string | null;
  htmlContent: string; textContent: string | null;
  scheduledAt: string | null; sentAt: string | null;
  sentCount: number; failedCount: number; openCount: number; clickCount: number;
  abTestActief: boolean; abSplitPct: number; abWinnaarOp: string; abWinnaarNaUren: number;
  abWinnaarVariant: string | null; abWinnaarBepaaldOp: string | null; abTestFase: string | null;
  alleenWerkdagen: boolean; tijdvensterStart: string; tijdvensterEind: string;
  createdAt: string; updatedAt: string;
};
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
  verzendMode: 'direct' | 'gepland'; verzendOp: string;
  alleenWerkdagen: boolean; tijdvensterStart: string; tijdvensterEind: string;
  abTestActief: boolean; abSplitPct: number; abWinnaarOp: string; abWinnaarNaUren: number;
};

const EMPTY_WIZARD: WizardData = {
  name: '', subject: '', campagneType: 'bulk',
  brancheFilter: [], functieFilter: [], typeFilter: 'alles', taalFilter: 'alles', tagFilter: [],
  verzendMode: 'direct', verzendOp: '',
  alleenWerkdagen: true, tijdvensterStart: '08:00', tijdvensterEind: '18:00',
  abTestActief: false, abSplitPct: 50, abWinnaarOp: 'open_rate', abWinnaarNaUren: 24,
};

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
      const res = await fetch(`/api/admin/prospect-campaigns/segment-count?${params}`, { credentials: 'include' });
      const { count } = await res.json();
      setSegmentCount(count ?? 0);
    } catch {
      setSegmentCount(0);
    } finally {
      setSegmentLoading(false);
    }
  }, [data.brancheFilter, data.functieFilter, data.typeFilter, data.taalFilter, data.tagFilter]);

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
    queryFn: () => fetch(`/api/admin/prospect-campaigns/${campaign.id}/ab-stats`, { credentials: 'include' }).then(r => r.json()),
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
    queryFn: () => fetch(`/api/admin/prospect-campaigns/${campaignId}/flow-stats`, { credentials: 'include' }).then(r => r.json()),
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
                    <td className="px-4 py-2.5 text-slate-700">{p.contactId}</td>
                    <td className="px-4 py-2.5 text-slate-600 font-mono">{p.huidigeStapId}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{p.wachtTot ? new Date(p.wachtTot).toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400">{new Date(p.bijgewerktOp).toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
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

// ─── Main module ──────────────────────────────────────────────────────────────
export default function ProspectCampagnesTab() {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState('overzicht');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [flowBuilderOpen, setFlowBuilderOpen] = useState(false);

  // ── Queries
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/admin/prospect-campaigns'],
  });

  const selectedCampaign = campaigns.find(c => c.id === selectedId) ?? null;

  const { data: recipients = [], isLoading: recipLoading } = useQuery<Recipient[]>({
    queryKey: ['/api/admin/prospect-campaigns', selectedId, 'recipients'],
    enabled: !!selectedId && detailTab === 'ontvangers',
    queryFn: () => fetch(`/api/admin/prospect-campaigns/${selectedId}/recipients`, { credentials: 'include' }).then(r => r.json()),
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
    queryFn: () => fetch(`/api/admin/prospect-campaigns/${selectedId}/stats`, { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 30000,
  });

  // ── Mutations
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/prospect-campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      setSelectedId(null); setDeleteId(null);
      toast({ title: 'Campagne verwijderd' });
    },
    onError: (e: any) => toast({ title: e?.data?.message || 'Verwijderen mislukt', variant: 'destructive' }),
  });

  const duplicateMut = useMutation({
    mutationFn: async (c: Campaign) => {
      const payload = {
        name: `${c.name} (kopie)`, subject: c.subject,
        campagneType: c.campagneType, status: 'concept',
        brancheFilter: c.brancheFilter, functieFilter: c.functieFilter,
        typeFilter: c.typeFilter, taalFilter: c.taalFilter, tagFilter: c.tagFilter,
        contentA: c.contentA, contentB: c.contentB, editorBlocks: c.editorBlocks,
        alleenWerkdagen: c.alleenWerkdagen, tijdvensterStart: c.tijdvensterStart, tijdvensterEind: c.tijdvensterEind,
        abTestActief: c.abTestActief, abSplitPct: c.abSplitPct, abWinnaarOp: c.abWinnaarOp, abWinnaarNaUren: c.abWinnaarNaUren,
      };
      return apiRequest('POST', '/api/admin/prospect-campaigns', payload);
    },
    onSuccess: (c: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      setSelectedId(c.id);
      toast({ title: `Kopie '${c.name}' aangemaakt` });
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PUT', `/api/admin/prospect-campaigns/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] }); },
  });

  const sendMut = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/admin/prospect-campaigns/${id}/send`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-campaigns', selectedId, 'stats'] });
      const n = data?.verzonden ?? data?.sentCount ?? 0;
      toast({ title: `Campagne verzonden naar ${n} contacten ✓` });
    },
    onError: (e: any) => toast({ title: e?.data?.message || e?.message || 'Verzenden mislukt', variant: 'destructive' }),
  });

  // ── Filtered list
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
    return matchSearch && matchStatus;
  });

  // ── Segment summary text
  function getSegmentSummary(c: Campaign): string {
    const parts: string[] = [];
    if (c.brancheFilter?.length > 0) parts.push(`Branches: ${c.brancheFilter.join(', ')}`);
    if (c.typeFilter && c.typeFilter !== 'alles') parts.push(`Type: ${c.typeFilter === 'prospect' ? 'Prospects' : 'Klanten'}`);
    if (c.taalFilter && c.taalFilter !== 'alles') parts.push(`Taal: ${c.taalFilter}`);
    const tags = (() => { try { return JSON.parse(c.tagFilter || '[]'); } catch { return []; } })();
    if (tags.length > 0) parts.push(`Tags: ${tags.join(', ')}`);
    return parts.length > 0 ? parts.join(' | ') : 'Alle actieve contacten';
  }

  function isSentStatus(status: string) { return ['sent','voltooid','actief'].includes(status); }

  return (
    <div className="flex h-full bg-white">
      {/* ── Left: Campaign list ── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/50">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">Campagnes</h2>
            <Button size="sm" className="gap-1 bg-purple-600 hover:bg-purple-700 h-7 text-xs px-2" onClick={() => setWizardOpen(true)}>
              <Plus className="h-3 w-3" />Nieuw
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoeken..." className="pl-7 h-8 text-xs bg-white" />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="px-3 py-2 border-b border-slate-100 flex gap-1 flex-wrap bg-white">
          {STATUS_FILTER_OPTIONS.map(opt => (
            <button key={opt.v} onClick={() => setStatusFilter(opt.v)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${statusFilter === opt.v ? 'bg-purple-100 border-purple-300 text-purple-700 font-medium' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Campaign list */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Laden...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center">
              <Megaphone className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">{campaigns.length === 0 ? 'Nog geen campagnes' : 'Geen campagnes gevonden'}</p>
            </div>
          ) : (
            <div className="py-1">
              {filteredCampaigns.map(c => {
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
                          {['concept','draft'].includes(c.status) && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteId(c.id); }} className="text-red-600">
                              <Trash2 className="h-3.5 w-3.5 mr-2" />Verwijderen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Right: Detail / empty state ── */}
      {!selectedCampaign ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Megaphone className="h-14 w-14 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Selecteer een campagne</p>
            <p className="text-xs text-slate-300 mt-1">of maak een nieuwe aan via "Nieuw"</p>
            <Button onClick={() => setWizardOpen(true)} className="mt-4 gap-1.5 bg-purple-600 hover:bg-purple-700" size="sm">
              <Plus className="h-3.5 w-3.5" />Eerste campagne aanmaken
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Campaign header */}
          <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-start justify-between gap-4">
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
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedCampaign.campagneType === 'flow' ? (
                <Button size="sm" variant="outline" className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => setFlowBuilderOpen(true)}>
                  <Zap className="h-3.5 w-3.5" />Flow opmaken
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setBuilderOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />E-mail opmaken
                </Button>
              )}
              {['concept','draft'].includes(selectedCampaign.status) && selectedCampaign.campagneType !== 'flow' && (
                <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700"
                  disabled={!selectedCampaign.htmlContent || sendMut.isPending}
                  onClick={() => { if (window.confirm(`Campagne '${selectedCampaign.name}' activeren en verzenden?`)) sendMut.mutate(selectedCampaign.id); }}>
                  {sendMut.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                  {sendMut.isPending ? 'Bezig...' : 'Activeren'}
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                onClick={() => setDeleteId(selectedCampaign.id)}>
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
            <TabsContent value="overzicht" className="flex-1 overflow-auto p-6">
              <div className="max-w-xl space-y-5">
                {/* Doelgroep samenvatting */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />Doelgroep
                  </p>
                  <p className="text-sm text-slate-700">{getSegmentSummary(selectedCampaign)}</p>
                </div>

                {/* Verzendmoment */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />Verzendmoment
                  </p>
                  <p className="text-sm text-slate-700">
                    {selectedCampaign.scheduledAt
                      ? new Date(selectedCampaign.scheduledAt).toLocaleString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Direct na activatie'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedCampaign.alleenWerkdagen ? 'Alleen werkdagen • ' : ''}
                    Tijdvenster: {selectedCampaign.tijdvensterStart}–{selectedCampaign.tijdvensterEind}
                  </p>
                </div>

                {/* A/B test */}
                {selectedCampaign.abTestActief && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <FlaskConical className="h-3.5 w-3.5" />A/B Test
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-purple-400">Split</p><p className="font-medium text-purple-700">A: {selectedCampaign.abSplitPct}% / B: {100 - selectedCampaign.abSplitPct}%</p></div>
                      <div><p className="text-xs text-purple-400">Winnaar op</p><p className="font-medium text-purple-700">{selectedCampaign.abWinnaarOp === 'open_rate' ? 'Open rate' : 'Click rate'} na {selectedCampaign.abWinnaarNaUren}u</p></div>
                      {selectedCampaign.abWinnaarVariant && <div><p className="text-xs text-purple-400">Winnaar</p><p className="font-bold text-purple-700">Variant {selectedCampaign.abWinnaarVariant}</p></div>}
                    </div>
                  </div>
                )}

                {/* E-mail inhoud status */}
                <div className={`rounded-xl p-4 border ${selectedCampaign.htmlContent ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedCampaign.htmlContent
                        ? <CheckCircle className="h-4 w-4 text-green-600" />
                        : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      <p className={`text-sm font-medium ${selectedCampaign.htmlContent ? 'text-green-700' : 'text-amber-700'}`}>
                        {selectedCampaign.htmlContent ? 'E-mail inhoud ingevuld' : 'E-mail inhoud nog niet ingevuld'}
                      </p>
                    </div>
                    <Button size="sm" variant={selectedCampaign.htmlContent ? 'outline' : 'default'}
                      className={selectedCampaign.htmlContent ? '' : 'bg-purple-600 hover:bg-purple-700'}
                      onClick={() => setBuilderOpen(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />E-mail opmaken
                    </Button>
                  </div>
                </div>

                {/* Activeer knop */}
                {['concept','draft'].includes(selectedCampaign.status) && selectedCampaign.htmlContent && (
                  <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700" size="lg"
                    disabled={sendMut.isPending}
                    onClick={() => { if (window.confirm(`Campagne '${selectedCampaign.name}' activeren en verzenden naar alle gefilterde contacten?`)) sendMut.mutate(selectedCampaign.id); }}>
                    {sendMut.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                    {sendMut.isPending ? 'Bezig met verzenden...' : 'Campagne activeren & verzenden'}
                  </Button>
                )}
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
                <div className="max-w-2xl space-y-6">
                  {/* Main KPI cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Verzonden', value: campaignStats?.verzonden ?? selectedCampaign.sentCount ?? 0, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Geopend', value: `${campaignStats?.geopend_pct ?? 0}%`, sub: `${campaignStats?.geopend ?? 0} uniek`, icon: MailOpen, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Geklikt', value: `${campaignStats?.geklikt_pct ?? 0}%`, sub: `${campaignStats?.geklikt ?? 0} uniek`, icon: MousePointer, color: 'text-purple-600', bg: 'bg-purple-50' },
                      { label: 'Uitgeschreven', value: `${campaignStats?.uitgeschreven_pct ?? 0}%`, sub: `${campaignStats?.uitgeschreven ?? 0} totaal`, icon: X, color: 'text-orange-500', bg: 'bg-orange-50' },
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
                <div className="p-6">
                  {recipLoading ? (
                    <div className="text-center py-8 text-slate-400 text-sm">Laden...</div>
                  ) : recipients.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Geen ontvangers voor deze campagne</p>
                      <p className="text-xs text-slate-300 mt-1">Ontvangers worden geladen bij verzending</p>
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

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Campagne verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>Dit kan niet ongedaan worden gemaakt. Alleen conceptcampagnes kunnen worden verwijderd.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteId && deleteMut.mutate(deleteId)}>Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
