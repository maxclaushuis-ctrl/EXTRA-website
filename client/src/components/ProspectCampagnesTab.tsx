import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail, Plus, Trash2, Send, Users, FileText, BarChart2, ChevronRight, Pencil,
  AlertTriangle, Building2, User, RefreshCw, Tag, Filter, Search, Download,
  Eye, MousePointer, CheckCircle, XCircle, Clock, X, UserPlus, Megaphone,
  SlidersHorizontal, MailOpen, ExternalLink, MoreVertical,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Contact = {
  id: number; name: string; email: string; company: string | null;
  function: string | null; brancheTags: string[]; functieTags: string[];
  unsubscribed: boolean; notes: string | null; source: string; createdAt: string;
};
type Campaign = {
  id: number; name: string; subject: string; htmlContent: string; editorBlocks: string | null;
  textContent: string | null; brancheFilter: string[]; functieFilter: string[];
  status: string; sentAt: string | null; sentCount: number; failedCount: number;
  openCount: number; clickCount: number; createdAt: string;
};
type Recipient = {
  id: number; campaignId: number; email: string; name: string | null;
  company: string | null; functieTags: string[]; status: string;
  sentAt: string | null; errorMessage: string | null;
  openedAt: string | null; clickedAt: string | null; trackingToken: string | null;
};
type Tags = { branche: string[]; functie: string[] };

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_BRANCHES = [
  "Hotel (4/5 sterren)", "Hotel (budget/midrange)", "Restaurant / Bistro",
  "Evenementenlocatie / Congrescentrum", "Catering bedrijf",
  "Luchthaven / Aviation catering", "Cruise / Maritiem", "Zorginstelling met horeca",
];

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  draft: { label: "Concept", cls: "bg-slate-100 text-slate-600", icon: FileText },
  sent: { label: "Verzonden", cls: "bg-green-100 text-green-700", icon: CheckCircle },
  scheduled: { label: "Gepland", cls: "bg-blue-100 text-blue-700", icon: Clock },
};

const RECIP_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Wacht", cls: "text-slate-400" },
  sent: { label: "Verzonden", cls: "text-green-600" },
  failed: { label: "Mislukt", cls: "text-red-500" },
};

// ─── Tag pill component ───────────────────────────────────────────────────────
function TagPill({ label, color = "purple", onRemove }: { label: string; color?: string; onRemove?: () => void }) {
  const colors: Record<string, string> = {
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
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
function TagInput({
  value, onChange, suggestions = [], placeholder, color = "purple",
}: {
  value: string[]; onChange: (v: string[]) => void;
  suggestions?: string[]; placeholder?: string; color?: string;
}) {
  const [input, setInput] = useState("");
  const [showSugg, setShowSugg] = useState(false);
  const filtered = suggestions.filter(s => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()));

  function add(tag: string) {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
    setShowSugg(false);
  }
  function remove(tag: string) { onChange(value.filter(t => t !== tag)); }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 min-h-[36px] border border-input rounded-md px-2 py-1 bg-background focus-within:ring-1 focus-within:ring-ring">
        {value.map(t => <TagPill key={t} label={t} color={color} onRemove={() => remove(t)} />)}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSugg(true); }}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); add(input); } if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]); }}
          onFocus={() => setShowSugg(true)}
          onBlur={() => setTimeout(() => setShowSugg(false), 150)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
        />
      </div>
      {showSugg && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-auto">
          {filtered.map(s => (
            <button key={s} onMouseDown={() => add(s)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors">
              {s}
            </button>
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

function blocksToHtml(blocks: Block[]): string {
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

  function update(i: number, patch: Partial<Block>) {
    const next = blocks.map((b, idx) => idx === i ? { ...b, ...patch } as Block : b);
    onChange(next);
  }
  function remove(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
    setSelected(null);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setSelected(j);
  }
  function addBlock(type: Block['type']) {
    onChange([...blocks, defaultBlock(type)]);
    setSelected(blocks.length);
  }

  const ADD_BLOCKS: { type: Block['type']; label: string; icon: any }[] = [
    { type: 'heading', label: 'Koptekst', icon: FileText },
    { type: 'text', label: 'Paragraaf', icon: FileText },
    { type: 'button', label: 'Knop', icon: MousePointer },
    { type: 'divider', label: 'Lijn', icon: SlidersHorizontal },
    { type: 'spacer', label: 'Ruimte', icon: SlidersHorizontal },
    { type: 'image', label: 'Afbeelding', icon: Eye },
  ];

  return (
    <div className="flex gap-4 h-full">
      {/* Canvas */}
      <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-auto p-4">
        <div className="max-w-[520px] mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-1">
          {blocks.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              Voeg blokken toe via het paneel rechts →
            </div>
          )}
          {blocks.map((block, i) => (
            <div key={i}
              onClick={() => setSelected(i)}
              className={`relative group rounded-lg transition-all cursor-pointer ${selected === i ? 'ring-2 ring-purple-500 ring-offset-1' : 'hover:ring-1 hover:ring-slate-300'}`}>
              {/* Block toolbar */}
              <div className={`absolute -top-3 right-2 flex gap-1 z-10 ${selected === i ? 'flex' : 'hidden group-hover:flex'}`}>
                <button onClick={e => { e.stopPropagation(); move(i, -1); }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50 shadow-sm">↑</button>
                <button onClick={e => { e.stopPropagation(); move(i, 1); }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50 shadow-sm">↓</button>
                <button onClick={e => { e.stopPropagation(); remove(i); }}
                  className="bg-white border border-red-200 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-50 shadow-sm"><X className="h-2.5 w-2.5" /></button>
              </div>
              {/* Preview */}
              <div className="p-2">
                {block.type === 'heading' && (
                  <h2 style={{ textAlign: block.align }} className="font-bold text-slate-800 text-lg">{block.text}</h2>
                )}
                {block.type === 'text' && (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{block.text}</p>
                )}
                {block.type === 'button' && (
                  <div className="text-center py-2">
                    <span className="text-white text-sm font-semibold px-6 py-2.5 rounded-lg inline-block" style={{ background: block.color }}>
                      {block.label}
                    </span>
                  </div>
                )}
                {block.type === 'divider' && <hr className="border-slate-200 my-2" />}
                {block.type === 'spacer' && <div style={{ height: Math.min(block.height, 40) }} className="bg-slate-50 rounded border border-dashed border-slate-200 text-center text-xs text-slate-300 flex items-center justify-center">{block.height}px</div>}
                {block.type === 'image' && (
                  block.url ? <img src={block.url} alt={block.alt} className="max-w-full rounded-lg mx-auto block" /> :
                  <div className="bg-slate-100 rounded-lg h-24 flex items-center justify-center text-slate-400 text-sm">Afbeelding URL invoeren →</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: properties + add blocks */}
      <div className="w-56 flex-shrink-0 space-y-3">
        {/* Properties */}
        {selected !== null && blocks[selected] && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Eigenschappen</p>
            {(() => {
              const b = blocks[selected];
              if (b.type === 'heading') return (
                <>
                  <div>
                    <Label className="text-xs text-slate-500">Tekst</Label>
                    <Input value={b.text} onChange={e => update(selected, { text: e.target.value })} className="h-7 text-sm mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Uitlijning</Label>
                    <div className="flex gap-1 mt-0.5">
                      {(['left', 'center', 'right'] as const).map(a => (
                        <button key={a} onClick={() => update(selected, { align: a })}
                          className={`flex-1 text-xs py-1 rounded border transition-colors ${b.align === a ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-slate-200 text-slate-500'}`}>
                          {a === 'left' ? 'L' : a === 'center' ? 'M' : 'R'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              );
              if (b.type === 'text') return (
                <div>
                  <Label className="text-xs text-slate-500">Tekst</Label>
                  <Textarea value={b.text} onChange={e => update(selected, { text: e.target.value })}
                    className="text-xs mt-0.5 min-h-[80px]" />
                  <p className="text-xs text-slate-400 mt-1">Gebruik {"{{naam}}"} en {"{{bedrijf}}"}</p>
                </div>
              );
              if (b.type === 'button') return (
                <>
                  <div><Label className="text-xs text-slate-500">Label</Label><Input value={b.label} onChange={e => update(selected, { label: e.target.value })} className="h-7 text-sm mt-0.5" /></div>
                  <div><Label className="text-xs text-slate-500">URL</Label><Input value={b.url} onChange={e => update(selected, { url: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="https://..." /></div>
                  <div>
                    <Label className="text-xs text-slate-500">Kleur</Label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <input type="color" value={b.color} onChange={e => update(selected, { color: e.target.value })} className="h-7 w-10 rounded border border-slate-200 cursor-pointer" />
                      <span className="text-xs text-slate-500">{b.color}</span>
                    </div>
                  </div>
                </>
              );
              if (b.type === 'spacer') return (
                <div>
                  <Label className="text-xs text-slate-500">Hoogte (px)</Label>
                  <Input type="number" value={b.height} onChange={e => update(selected, { height: parseInt(e.target.value) || 16 })} className="h-7 text-sm mt-0.5" min={4} max={120} />
                </div>
              );
              if (b.type === 'image') return (
                <>
                  <div><Label className="text-xs text-slate-500">URL</Label><Input value={b.url} onChange={e => update(selected, { url: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="https://..." /></div>
                  <div><Label className="text-xs text-slate-500">Alt-tekst</Label><Input value={b.alt} onChange={e => update(selected, { alt: e.target.value })} className="h-7 text-sm mt-0.5" /></div>
                </>
              );
              return null;
            })()}
          </div>
        )}

        {/* Add blocks */}
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Blok toevoegen</p>
          <div className="space-y-1">
            {ADD_BLOCKS.map(({ type, label }) => (
              <button key={type} onClick={() => addBlock(type)}
                className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition-colors flex items-center gap-2">
                <Plus className="h-3 w-3" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main module ──────────────────────────────────────────────────────────────
export default function ProspectCampagnesTab() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<'campaigns' | 'contacts'>('campaigns');

  // Campaign state
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [campaignDetailTab, setCampaignDetailTab] = useState("editor");
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showDeleteCampaign, setShowDeleteCampaign] = useState<number | null>(null);
  const [editingCampaign, setEditingCampaign] = useState(false);

  // Campaign form
  const [cfName, setCfName] = useState("");
  const [cfSubject, setCfSubject] = useState("");
  const [cfBlocks, setCfBlocks] = useState<Block[]>([]);
  const [cfBrancheFilter, setCfBrancheFilter] = useState<string[]>([]);
  const [cfFunctieFilter, setCfFunctieFilter] = useState<string[]>([]);

  // Contact state
  const [contactSearch, setContactSearch] = useState("");
  const [contactBrancheFilter, setContactBrancheFilter] = useState("");
  const [contactFunctieFilter, setContactFunctieFilter] = useState("");
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showDeleteContact, setShowDeleteContact] = useState<number | null>(null);

  // Contact form
  const [conName, setConName] = useState("");
  const [conEmail, setConEmail] = useState("");
  const [conCompany, setConCompany] = useState("");
  const [conFunction, setConFunction] = useState("");
  const [conBranche, setConBranche] = useState<string[]>([]);
  const [conFunctie, setConFunctie] = useState<string[]>([]);
  const [conNotes, setConNotes] = useState("");

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/prospect-campaigns"],
  });

  const { data: tags = { branche: [], functie: [] } } = useQuery<Tags>({
    queryKey: ["/api/admin/prospect-contacts/tags"],
    queryFn: () => fetch('/api/admin/prospect-contacts/tags').then(r => r.json()),
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/admin/prospect-contacts", contactSearch, contactBrancheFilter, contactFunctieFilter],
    queryFn: () => {
      const p = new URLSearchParams();
      if (contactSearch) p.set('search', contactSearch);
      if (contactBrancheFilter) p.set('branche', contactBrancheFilter);
      if (contactFunctieFilter) p.set('functie', contactFunctieFilter);
      return fetch(`/api/admin/prospect-contacts?${p}`).then(r => r.json());
    },
  });

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const { data: recipients = [], isLoading: recipientsLoading } = useQuery<Recipient[]>({
    queryKey: ["/api/admin/prospect-campaigns", selectedCampaignId, "recipients"],
    enabled: !!selectedCampaignId,
    queryFn: () => fetch(`/api/admin/prospect-campaigns/${selectedCampaignId}/recipients`).then(r => r.json()),
  });

  // Compute all branche/functie tags including defaults
  const allBrancheTags = [...new Set([...DEFAULT_BRANCHES, ...tags.branche])];
  const allFunctieTags = [...new Set([...tags.functie])];

  // Count matching contacts for campaign targeting
  const matchingContacts = contacts.filter(c => {
    if (!selectedCampaign) return false;
    const bf = selectedCampaign.brancheFilter || [];
    const ff = selectedCampaign.functieFilter || [];
    if (bf.length > 0 && !bf.some(t => (c.brancheTags || []).includes(t))) return false;
    if (ff.length > 0 && !ff.some(t => (c.functieTags || []).includes(t))) return false;
    return !c.unsubscribed;
  });

  // ─── Campaign mutations ───────────────────────────────────────────────────
  const createCampaignMut = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/prospect-campaigns", "POST", data),
    onSuccess: (c: Campaign) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns"] });
      setShowCreateCampaign(false);
      setSelectedCampaignId(c.id);
      toast({ title: "Campagne aangemaakt" });
      resetCampaignForm();
    },
    onError: () => toast({ title: "Fout bij aanmaken", variant: "destructive" }),
  });

  const updateCampaignMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/admin/prospect-campaigns/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns"] });
      setEditingCampaign(false);
      toast({ title: "Opgeslagen" });
    },
    onError: () => toast({ title: "Fout bij opslaan", variant: "destructive" }),
  });

  const deleteCampaignMut = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/prospect-campaigns/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns"] });
      setSelectedCampaignId(null);
      setShowDeleteCampaign(null);
      toast({ title: "Campagne verwijderd" });
    },
  });

  const sendCampaignMut = useMutation({
    mutationFn: async (id: number) => {
      // First load matching contacts as recipients
      const c = campaigns.find(x => x.id === id);
      if (!c) return;
      const bf = c.brancheFilter || [], ff = c.functieFilter || [];
      const targets = contacts.filter(ct => {
        if (bf.length > 0 && !bf.some(t => (ct.brancheTags || []).includes(t))) return false;
        if (ff.length > 0 && !ff.some(t => (ct.functieTags || []).includes(t))) return false;
        return !ct.unsubscribed;
      });
      // Add all as recipients
      const existingEmails = new Set(recipients.map(r => r.email.toLowerCase()));
      for (const ct of targets) {
        if (!existingEmails.has(ct.email.toLowerCase())) {
          await apiRequest(`/api/admin/prospect-campaigns/${id}/recipients`, "POST", {
            email: ct.email, name: ct.name, company: ct.company,
            functieTags: ct.functieTags, contactId: ct.id,
          });
        }
      }
      return apiRequest(`/api/admin/prospect-campaigns/${id}/send`, "POST");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns", selectedCampaignId, "recipients"] });
      setShowSendConfirm(false);
      toast({ title: `Verstuurd naar ${data?.sentCount || 0} ontvangers${data?.failedCount ? `, ${data.failedCount} mislukt` : ""}` });
    },
    onError: (e: any) => toast({ title: e.message || "Fout bij verzenden", variant: "destructive" }),
  });

  // ─── Contact mutations ────────────────────────────────────────────────────
  const createContactMut = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/prospect-contacts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-contacts/tags"] });
      setShowCreateContact(false);
      toast({ title: "Contact toegevoegd" });
      resetContactForm();
    },
    onError: () => toast({ title: "Fout bij toevoegen", variant: "destructive" }),
  });

  const updateContactMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/admin/prospect-contacts/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-contacts/tags"] });
      setEditingContact(null);
      toast({ title: "Opgeslagen" });
    },
    onError: () => toast({ title: "Fout bij opslaan", variant: "destructive" }),
  });

  const deleteContactMut = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/prospect-contacts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-contacts"] });
      setShowDeleteContact(null);
      toast({ title: "Contact verwijderd" });
    },
  });

  const importCrmMut = useMutation({
    mutationFn: () => apiRequest("/api/admin/prospect-contacts/import-crm", "POST"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-contacts"] });
      toast({ title: `${data.imported} CRM-contacten geïmporteerd` });
    },
    onError: () => toast({ title: "Fout bij importeren", variant: "destructive" }),
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function resetCampaignForm() { setCfName(""); setCfSubject(""); setCfBlocks([]); setCfBrancheFilter([]); setCfFunctieFilter([]); }
  function resetContactForm() { setConName(""); setConEmail(""); setConCompany(""); setConFunction(""); setConBranche([]); setConFunctie([]); setConNotes(""); }

  function openEditCampaign(c: Campaign) {
    setCfName(c.name); setCfSubject(c.subject);
    try { setCfBlocks(c.editorBlocks ? JSON.parse(c.editorBlocks) : []); } catch { setCfBlocks([]); }
    setCfBrancheFilter(c.brancheFilter || []); setCfFunctieFilter(c.functieFilter || []);
    setEditingCampaign(true);
  }

  function openEditContact(c: Contact) {
    setConName(c.name); setConEmail(c.email); setConCompany(c.company || "");
    setConFunction(c.function || ""); setConBranche(c.brancheTags || []);
    setConFunctie(c.functieTags || []); setConNotes(c.notes || "");
    setEditingContact(c);
  }

  function handleCreateCampaign() {
    if (!cfName || !cfSubject || cfBlocks.length === 0) {
      toast({ title: "Vul naam, onderwerp en voeg minimaal één blok toe", variant: "destructive" }); return;
    }
    const html = blocksToHtml(cfBlocks);
    createCampaignMut.mutate({
      name: cfName, subject: cfSubject, htmlContent: html,
      editorBlocks: JSON.stringify(cfBlocks),
      brancheFilter: cfBrancheFilter, functieFilter: cfFunctieFilter, status: "draft",
    });
  }

  function handleUpdateCampaign() {
    if (!selectedCampaign) return;
    const html = blocksToHtml(cfBlocks);
    updateCampaignMut.mutate({ id: selectedCampaign.id, data: {
      name: cfName, subject: cfSubject, htmlContent: html,
      editorBlocks: JSON.stringify(cfBlocks),
      brancheFilter: cfBrancheFilter, functieFilter: cfFunctieFilter,
    }});
  }

  function handleCreateContact() {
    if (!conName || !conEmail) { toast({ title: "Naam en e-mail zijn verplicht", variant: "destructive" }); return; }
    createContactMut.mutate({ name: conName, email: conEmail, company: conCompany || null,
      function: conFunction || null, brancheTags: conBranche, functieTags: conFunctie, notes: conNotes || null });
  }

  function handleUpdateContact() {
    if (!editingContact) return;
    updateContactMut.mutate({ id: editingContact.id, data: { name: conName, email: conEmail, company: conCompany || null,
      function: conFunction || null, brancheTags: conBranche, functieTags: conFunctie, notes: conNotes || null }});
  }

  // Stats
  const totalRecipients = recipients.length;
  const sentR = recipients.filter(r => r.status === 'sent').length;
  const failedR = recipients.filter(r => r.status === 'failed').length;
  const openedR = recipients.filter(r => r.openedAt).length;
  const clickedR = recipients.filter(r => r.clickedAt).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-slate-50/50 overflow-hidden">
      {/* ── Left sidebar ── */}
      <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
        {/* Section switcher */}
        <div className="flex border-b border-slate-100">
          <button onClick={() => setActiveSection('campaigns')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${activeSection === 'campaigns' ? 'text-purple-700 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Megaphone className="h-3.5 w-3.5" /> Campagnes
          </button>
          <button onClick={() => setActiveSection('contacts')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${activeSection === 'contacts' ? 'text-purple-700 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Users className="h-3.5 w-3.5" /> Contacten
          </button>
        </div>

        {activeSection === 'campaigns' ? (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-50">
              <span className="text-xs text-slate-500">{campaigns.length} campagne{campaigns.length !== 1 ? 's' : ''}</span>
              <Button size="sm" variant="outline" className="h-6 px-2 text-xs gap-1" onClick={() => { resetCampaignForm(); setShowCreateCampaign(true); }}>
                <Plus className="h-2.5 w-2.5" /> Nieuw
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {campaignsLoading ? (
                <div className="p-4 text-center text-slate-400 text-xs">Laden…</div>
              ) : campaigns.length === 0 ? (
                <div className="p-6 text-center">
                  <Megaphone className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Nog geen campagnes</p>
                </div>
              ) : (
                <div className="py-1">
                  {campaigns.map(c => {
                    const s = STATUS_BADGE[c.status] ?? STATUS_BADGE.draft;
                    return (
                      <button key={c.id} onClick={() => { setSelectedCampaignId(c.id); setEditingCampaign(false); setCampaignDetailTab("editor"); }}
                        className={`w-full text-left px-3 py-2.5 flex gap-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedCampaignId === c.id ? 'bg-purple-50' : ''}`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{c.subject}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                            {c.sentCount > 0 && <span className="text-xs text-slate-400">{c.sentCount} <Mail className="h-2.5 w-2.5 inline" /></span>}
                            {c.openCount > 0 && <span className="text-xs text-green-500">{c.openCount} <MailOpen className="h-2.5 w-2.5 inline" /></span>}
                          </div>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-300 mt-1 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="px-3 py-2 border-b border-slate-50 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                <Input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                  placeholder="Zoeken…" className="h-7 pl-7 text-xs" />
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-6 text-xs gap-1 flex-1"
                  onClick={() => { resetContactForm(); setShowCreateContact(true); }}>
                  <Plus className="h-2.5 w-2.5" /> Toevoegen
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-xs gap-1 px-2 text-blue-600 border-blue-200"
                  disabled={importCrmMut.isPending} onClick={() => importCrmMut.mutate()}>
                  <Download className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
            {/* Filter pills */}
            <div className="px-3 py-1.5 border-b border-slate-50 flex flex-wrap gap-1">
              {allBrancheTags.slice(0, 6).map(t => (
                <button key={t} onClick={() => setContactBrancheFilter(contactBrancheFilter === t ? "" : t)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${contactBrancheFilter === t ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {t.split('(')[0].trim()}
                </button>
              ))}
            </div>
            <ScrollArea className="flex-1">
              <div className="text-xs text-slate-400 px-3 py-1">{contacts.length} contact{contacts.length !== 1 ? 'en' : ''}</div>
              {contactsLoading ? <div className="p-4 text-center text-xs text-slate-400">Laden…</div> : contacts.length === 0 ? (
                <div className="p-6 text-center"><Users className="h-6 w-6 text-slate-200 mx-auto mb-1" /><p className="text-xs text-slate-400">Geen contacten</p></div>
              ) : contacts.map(c => (
                <div key={c.id} className="px-3 py-2 border-b border-slate-50 hover:bg-slate-50 group flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.company || c.email}</p>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {(c.brancheTags || []).slice(0, 2).map(t => <TagPill key={t} label={t.split('(')[0].trim()} color="blue" />)}
                      {(c.functieTags || []).slice(0, 1).map(t => <TagPill key={t} label={t} color="purple" />)}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditContact(c)} className="text-slate-300 hover:text-blue-500 transition-colors"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => setShowDeleteContact(c.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
      </div>

      {/* ── Main content ── */}
      {activeSection === 'campaigns' && !selectedCampaign ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Megaphone className="h-14 w-14 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Selecteer een campagne</p>
            <p className="text-xs text-slate-300 mt-1">of maak een nieuwe aan via "Nieuw"</p>
          </div>
        </div>
      ) : activeSection === 'campaigns' && selectedCampaign ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100">
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-800 truncate">{selectedCampaign.name}</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[selectedCampaign.status]?.cls}`}>
                  {STATUS_BADGE[selectedCampaign.status]?.label}
                </span>
                {(selectedCampaign.brancheFilter || []).map(t => <TagPill key={t} label={t.split('(')[0].trim()} color="blue" />)}
                {(selectedCampaign.functieFilter || []).map(t => <TagPill key={t} label={t} color="purple" />)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCampaign.status !== 'sent' && (
                <>
                  {editingCampaign ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCampaign(false)}>Annuleren</Button>
                      <Button size="sm" onClick={handleUpdateCampaign} disabled={updateCampaignMut.isPending}
                        className="bg-slate-800 hover:bg-slate-700">Opslaan</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEditCampaign(selectedCampaign)}>
                      <Pencil className="h-3 w-3" /> Bewerken
                    </Button>
                  )}
                  <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700"
                    onClick={() => setShowSendConfirm(true)}>
                    <Send className="h-3 w-3" /> Verzenden
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                onClick={() => setShowDeleteCampaign(selectedCampaign.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={campaignDetailTab} onValueChange={setCampaignDetailTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-slate-100 px-6">
              <TabsList className="h-9 bg-transparent gap-0 p-0">
                {[
                  { v: 'editor', label: 'E-mail opbouw', icon: FileText },
                  { v: 'targeting', label: 'Doelgroep', icon: Filter },
                  { v: 'recipients', label: `Ontvangers (${recipients.length})`, icon: Users },
                  { v: 'stats', label: 'Statistieken', icon: BarChart2 },
                ].map(t => (
                  <TabsTrigger key={t.v} value={t.v}
                    className="h-9 text-xs data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-700 data-[state=active]:bg-transparent data-[state=inactive]:text-slate-400 rounded-none px-4 gap-1.5">
                    <t.icon className="h-3 w-3" /> {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Editor tab */}
            <TabsContent value="editor" className="flex-1 overflow-hidden p-4">
              {editingCampaign ? (
                <div className="h-full flex flex-col gap-3">
                  <div className="flex gap-4">
                    <div className="flex-1"><Label className="text-xs text-slate-500">Campagnenaam</Label><Input value={cfName} onChange={e => setCfName(e.target.value)} className="mt-0.5" /></div>
                    <div className="flex-1"><Label className="text-xs text-slate-500">Onderwerp e-mail</Label><Input value={cfSubject} onChange={e => setCfSubject(e.target.value)} className="mt-0.5" /></div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <EmailEditor blocks={cfBlocks} onChange={setCfBlocks} />
                  </div>
                </div>
              ) : (
                <div className="h-full bg-slate-50 rounded-xl border border-slate-100 overflow-auto p-4">
                  <div className="max-w-[520px] mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div dangerouslySetInnerHTML={{ __html: selectedCampaign.htmlContent }} />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Targeting tab */}
            <TabsContent value="targeting" className="flex-1 overflow-auto p-6">
              <div className="max-w-xl space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">Doelgroep instellingen</h3>
                  <p className="text-xs text-slate-400">Filter op branche en/of functie. Leeg = alle contacten.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Branche</Label>
                    <p className="text-xs text-slate-400 mb-1.5">Alleen contacten met één van deze branche-tags ontvangen de mail.</p>
                    {editingCampaign ? (
                      <TagInput value={cfBrancheFilter} onChange={setCfBrancheFilter} suggestions={allBrancheTags} placeholder="Selecteer branche…" color="blue" />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedCampaign.brancheFilter || []).length === 0
                          ? <span className="text-sm text-slate-400">Alle branches</span>
                          : (selectedCampaign.brancheFilter || []).map(t => <TagPill key={t} label={t} color="blue" />)}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Functie</Label>
                    <p className="text-xs text-slate-400 mb-1.5">Alleen contacten met één van deze functie-tags ontvangen de mail.</p>
                    {editingCampaign ? (
                      <TagInput value={cfFunctieFilter} onChange={setCfFunctieFilter} suggestions={allFunctieTags} placeholder="Selecteer functie…" color="purple" />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedCampaign.functieFilter || []).length === 0
                          ? <span className="text-sm text-slate-400">Alle functies</span>
                          : (selectedCampaign.functieFilter || []).map(t => <TagPill key={t} label={t} color="purple" />)}
                      </div>
                    )}
                  </div>
                </div>
                {/* Matching contacts preview */}
                <div className={`rounded-xl p-4 border ${matchingContacts.length > 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className={`h-4 w-4 ${matchingContacts.length > 0 ? 'text-green-600' : 'text-amber-500'}`} />
                    <span className={`text-sm font-semibold ${matchingContacts.length > 0 ? 'text-green-700' : 'text-amber-700'}`}>
                      {matchingContacts.length} contacten voldoen aan de filters
                    </span>
                  </div>
                  {matchingContacts.length === 0 && (
                    <p className="text-xs text-amber-600">Pas de filters aan of voeg meer contacten toe met de juiste tags.</p>
                  )}
                  {matchingContacts.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-auto">
                      {matchingContacts.slice(0, 8).map(c => (
                        <div key={c.id} className="text-xs text-green-700 flex items-center gap-1.5">
                          <User className="h-2.5 w-2.5" /> {c.name} {c.company ? `(${c.company})` : ''}
                        </div>
                      ))}
                      {matchingContacts.length > 8 && <div className="text-xs text-green-500">+{matchingContacts.length - 8} meer…</div>}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Recipients tab */}
            <TabsContent value="recipients" className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {recipientsLoading ? <div className="text-center py-8 text-slate-400 text-sm">Laden…</div> :
                  recipients.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Nog niet verzonden. Klik op "Verzenden" om de doelgroep te laden en te versturen.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="text-left py-2 font-medium">Contact</th>
                          <th className="text-left py-2 font-medium">Functie-tags</th>
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium flex items-center gap-1"><MailOpen className="h-3 w-3" /> Geopend</th>
                          <th className="text-left py-2 font-medium"><MousePointer className="h-3 w-3 inline" /> Geklikt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map(r => {
                          const s = RECIP_STATUS[r.status] ?? RECIP_STATUS.pending;
                          return (
                            <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-2">
                                <p className="font-medium text-slate-700 text-xs">{r.name || r.email}</p>
                                {r.name && <p className="text-xs text-slate-400">{r.email}</p>}
                                {r.company && <p className="text-xs text-slate-400">{r.company}</p>}
                              </td>
                              <td className="py-2">
                                <div className="flex flex-wrap gap-0.5">
                                  {(r.functieTags || []).map(t => <TagPill key={t} label={t} color="purple" />)}
                                </div>
                              </td>
                              <td className="py-2"><span className={`text-xs font-medium ${s.cls}`}>{s.label}</span></td>
                              <td className="py-2">
                                {r.openedAt ? (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> {new Date(r.openedAt).toLocaleString("nl-NL", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                ) : <span className="text-xs text-slate-300">—</span>}
                              </td>
                              <td className="py-2">
                                {r.clickedAt ? (
                                  <span className="text-xs text-blue-600 flex items-center gap-1">
                                    <MousePointer className="h-3 w-3" /> {new Date(r.clickedAt).toLocaleString("nl-NL", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                ) : <span className="text-xs text-slate-300">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Stats tab */}
            <TabsContent value="stats" className="flex-1 overflow-auto p-6">
              <div className="max-w-2xl space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Verzonden", value: sentR, icon: Send, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
                    { label: "Geopend", value: openedR, icon: MailOpen, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
                    { label: "Geklikt", value: clickedR, icon: MousePointer, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
                    { label: "Mislukt", value: failedR, icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
                  ].map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
                      <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {totalRecipients > 0 && (
                  <div className="space-y-3">
                    {[
                      { label: "Afleverpercentage", value: sentR, total: totalRecipients, color: "bg-slate-500" },
                      { label: "Openpercentage", value: openedR, total: sentR || 1, color: "bg-green-500" },
                      { label: "Klikpercentage", value: clickedR, total: openedR || 1, color: "bg-blue-500" },
                    ].map(({ label, value, total, color }) => {
                      const pct = Math.round((value / total) * 100);
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{label}</span><span className="font-medium">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedCampaign.sentAt && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-700">
                      Campagne verzonden op {new Date(selectedCampaign.sentAt).toLocaleString("nl-NL")}.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* Contact section main area - stats overview */
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            <h2 className="font-semibold text-slate-800 mb-1">Prospectlijst</h2>
            <p className="text-sm text-slate-400 mb-4">Beheer je contacten voor e-mailcampagnes. Tags bepalen wie welke mail ontvangt.</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="border-slate-100">
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-slate-800">{contacts.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Totaal contacten</p>
                </CardContent>
              </Card>
              <Card className="border-green-100 bg-green-50/50">
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{contacts.filter(c => !c.unsubscribed).length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Actief</p>
                </CardContent>
              </Card>
              <Card className="border-slate-100">
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-slate-500">{contacts.filter(c => c.unsubscribed).length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Uitgeschreven</p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Branches</p>
              <div className="flex flex-wrap gap-1.5">
                {allBrancheTags.map(t => {
                  const count = contacts.filter(c => (c.brancheTags || []).includes(t)).length;
                  return count > 0 ? (
                    <span key={t} className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded-lg">
                      {t} <span className="font-semibold">{count}</span>
                    </span>
                  ) : null;
                })}
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3">Functies</p>
              <div className="flex flex-wrap gap-1.5">
                {allFunctieTags.map(t => {
                  const count = contacts.filter(c => (c.functieTags || []).includes(t)).length;
                  return count > 0 ? (
                    <span key={t} className="bg-purple-50 border border-purple-200 text-purple-700 text-xs px-2 py-1 rounded-lg">
                      {t} <span className="font-semibold">{count}</span>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Campaign Dialog ── */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nieuwe campagne aanmaken</DialogTitle>
            <DialogDescription>Ontwerp je e-mail en stel je doelgroep in.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2 min-h-0">
            <div className="flex gap-4 flex-shrink-0">
              <div className="flex-1">
                <Label>Campagnenaam *</Label>
                <Input value={cfName} onChange={e => setCfName(e.target.value)} placeholder="bijv. Hotels April 2026" className="mt-1" />
              </div>
              <div className="flex-1">
                <Label>Onderwerp *</Label>
                <Input value={cfSubject} onChange={e => setCfSubject(e.target.value)} placeholder="bijv. Flexibel horeca-personeel voor uw hotel" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-shrink-0">
              <div>
                <Label className="text-sm">Branche-filter</Label>
                <p className="text-xs text-slate-400 mb-1">Leeg = iedereen</p>
                <TagInput value={cfBrancheFilter} onChange={setCfBrancheFilter} suggestions={allBrancheTags} placeholder="Selecteer branches…" color="blue" />
              </div>
              <div>
                <Label className="text-sm">Functie-filter</Label>
                <p className="text-xs text-slate-400 mb-1">Leeg = alle functies</p>
                <TagInput value={cfFunctieFilter} onChange={setCfFunctieFilter} suggestions={allFunctieTags} placeholder="Selecteer functies…" color="purple" />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Label className="text-sm mb-1 block">E-mail inhoud *</Label>
              <div className="h-full">
                <EmailEditor blocks={cfBlocks} onChange={setCfBlocks} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="ghost" onClick={() => setShowCreateCampaign(false)}>Annuleren</Button>
            <Button onClick={handleCreateCampaign} disabled={createCampaignMut.isPending} className="bg-purple-600 hover:bg-purple-700">
              {createCampaignMut.isPending ? "Aanmaken…" : "Campagne aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send confirmation ── */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-purple-600" /> Campagne verzenden
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Je staat op het punt <strong>"{selectedCampaign?.name}"</strong> te verzenden naar:</p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-purple-800">{matchingContacts.length} contacten</p>
                  {(selectedCampaign?.brancheFilter || []).length > 0 && (
                    <p className="text-xs text-purple-600 mt-0.5">Branche: {selectedCampaign?.brancheFilter?.join(', ')}</p>
                  )}
                  {(selectedCampaign?.functieFilter || []).length > 0 && (
                    <p className="text-xs text-purple-600 mt-0.5">Functie: {selectedCampaign?.functieFilter?.join(', ')}</p>
                  )}
                </div>
                {matchingContacts.length === 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-amber-700">Geen contacten voldoen aan de filters. Voeg contacten toe of pas de filters aan.</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction disabled={matchingContacts.length === 0 || sendCampaignMut.isPending}
              onClick={() => selectedCampaign && sendCampaignMut.mutate(selectedCampaign.id)}
              className="bg-purple-600 hover:bg-purple-700">
              {sendCampaignMut.isPending ? <><RefreshCw className="h-3 w-3 animate-spin mr-1" /> Verzenden…</> : `Verzenden naar ${matchingContacts.length} contacten`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete campaign ── */}
      <AlertDialog open={!!showDeleteCampaign} onOpenChange={() => setShowDeleteCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Campagne verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>Dit verwijdert ook alle ontvangersgegevens. Niet ongedaan te maken.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600"
              onClick={() => showDeleteCampaign && deleteCampaignMut.mutate(showDeleteCampaign)}>Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Create/Edit Contact Dialog ── */}
      <Dialog open={showCreateContact || !!editingContact} onOpenChange={v => { if (!v) { setShowCreateContact(false); setEditingContact(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Contact bewerken' : 'Nieuw contact'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-500">Naam *</Label><Input value={conName} onChange={e => setConName(e.target.value)} className="mt-0.5" /></div>
              <div><Label className="text-xs text-slate-500">E-mail *</Label><Input value={conEmail} onChange={e => setConEmail(e.target.value)} className="mt-0.5" /></div>
              <div><Label className="text-xs text-slate-500">Bedrijf</Label><Input value={conCompany} onChange={e => setConCompany(e.target.value)} className="mt-0.5" /></div>
              <div><Label className="text-xs text-slate-500">Functie</Label><Input value={conFunction} onChange={e => setConFunction(e.target.value)} className="mt-0.5" /></div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Branche-tags</Label>
              <TagInput value={conBranche} onChange={setConBranche} suggestions={allBrancheTags} placeholder="Hotel, Restaurant…" color="blue" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Functie-tags</Label>
              <TagInput value={conFunctie} onChange={setConFunctie} suggestions={allFunctieTags} placeholder="Housekeeping Manager, F&B Manager…" color="purple" />
              <p className="text-xs text-slate-400 mt-0.5">Voer bestaande tags in of maak nieuwe aan</p>
            </div>
            <div><Label className="text-xs text-slate-500">Notities</Label><Textarea value={conNotes} onChange={e => setConNotes(e.target.value)} className="mt-0.5 text-sm min-h-[60px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowCreateContact(false); setEditingContact(null); }}>Annuleren</Button>
            <Button onClick={editingContact ? handleUpdateContact : handleCreateContact}
              disabled={createContactMut.isPending || updateContactMut.isPending}
              className="bg-purple-600 hover:bg-purple-700">
              {editingContact ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete contact ── */}
      <AlertDialog open={!!showDeleteContact} onOpenChange={() => setShowDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contact verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>Dit kan niet ongedaan worden gemaakt.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600"
              onClick={() => showDeleteContact && deleteContactMut.mutate(showDeleteContact)}>Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
