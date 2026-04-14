import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail, Plus, Trash2, Send, Users, FileText, BarChart2, Download,
  CheckCircle, XCircle, Clock, ChevronRight, Pencil, AlertTriangle,
  Building2, User, RefreshCw,
} from "lucide-react";

type Campaign = {
  id: number; name: string; subject: string; htmlContent: string;
  textContent: string | null; status: string; sentAt: string | null;
  sentCount: number; failedCount: number; createdAt: string;
};
type Recipient = {
  id: number; campaignId: number; email: string; name: string | null;
  company: string | null; status: string; sentAt: string | null; errorMessage: string | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Concept", color: "bg-slate-100 text-slate-700", icon: FileText },
  sent: { label: "Verzonden", color: "bg-green-100 text-green-700", icon: CheckCircle },
  scheduled: { label: "Gepland", color: "bg-blue-100 text-blue-700", icon: Clock },
};

const RECIPIENT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "In wachtrij", color: "text-slate-500" },
  sent: { label: "Verzonden", color: "text-green-600" },
  failed: { label: "Mislukt", color: "text-red-500" },
};

export default function ProspectCampagnesTab() {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("inhoud");

  // Form state
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formHtml, setFormHtml] = useState("");
  const [formText, setFormText] = useState("");

  // Recipient add form
  const [recipEmail, setRecipEmail] = useState("");
  const [recipName, setRecipName] = useState("");
  const [recipCompany, setRecipCompany] = useState("");

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/prospect-campaigns"],
  });

  const selected = campaigns.find((c) => c.id === selectedId);

  const { data: recipients = [], isLoading: recipLoading } = useQuery<Recipient[]>({
    queryKey: ["/api/admin/prospect-campaigns", selectedId, "recipients"],
    enabled: !!selectedId,
    queryFn: () => fetch(`/api/admin/prospect-campaigns/${selectedId}/recipients`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/prospect-campaigns", "POST", data),
    onSuccess: (campaign: Campaign) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns"] });
      setShowCreate(false);
      setSelectedId(campaign.id);
      toast({ title: "Campagne aangemaakt" });
      resetForm();
    },
    onError: () => toast({ title: "Fout bij aanmaken", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/admin/prospect-campaigns/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns"] });
      setEditMode(false);
      toast({ title: "Opgeslagen" });
    },
    onError: () => toast({ title: "Fout bij opslaan", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/prospect-campaigns/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns"] });
      setSelectedId(null);
      setShowDeleteConfirm(null);
      toast({ title: "Campagne verwijderd" });
    },
    onError: () => toast({ title: "Fout bij verwijderen", variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/prospect-campaigns/${id}/send`, "POST"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns", selectedId, "recipients"] });
      setShowSendConfirm(false);
      toast({ title: `Verzonden naar ${data.sentCount} ontvangers${data.failedCount ? `, ${data.failedCount} mislukt` : ""}` });
    },
    onError: (e: any) => toast({ title: e.message || "Fout bij verzenden", variant: "destructive" }),
  });

  const addRecipientMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/admin/prospect-campaigns/${selectedId}/recipients`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns", selectedId, "recipients"] });
      setRecipEmail(""); setRecipName(""); setRecipCompany("");
      toast({ title: "Ontvanger toegevoegd" });
    },
    onError: () => toast({ title: "Fout bij toevoegen", variant: "destructive" }),
  });

  const deleteRecipientMutation = useMutation({
    mutationFn: (recipId: number) =>
      apiRequest(`/api/admin/prospect-campaigns/${selectedId}/recipients/${recipId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns", selectedId, "recipients"] });
    },
  });

  const importCrmMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/admin/prospect-campaigns/${selectedId}/import-crm`, "POST"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prospect-campaigns", selectedId, "recipients"] });
      toast({ title: `${data.imported} CRM-contacten geïmporteerd` });
    },
    onError: () => toast({ title: "Fout bij importeren", variant: "destructive" }),
  });

  function resetForm() {
    setFormName(""); setFormSubject(""); setFormHtml(""); setFormText("");
  }

  function openEdit(c: Campaign) {
    setFormName(c.name); setFormSubject(c.subject);
    setFormHtml(c.htmlContent); setFormText(c.textContent || "");
    setEditMode(true);
  }

  function handleCreate() {
    if (!formName || !formSubject || !formHtml) {
      toast({ title: "Vul naam, onderwerp en HTML-inhoud in", variant: "destructive" }); return;
    }
    createMutation.mutate({ name: formName, subject: formSubject, htmlContent: formHtml, textContent: formText || null, status: "draft" });
  }

  function handleUpdate() {
    if (!selected) return;
    updateMutation.mutate({ id: selected.id, data: { name: formName, subject: formSubject, htmlContent: formHtml, textContent: formText || null } });
  }

  const pendingCount = recipients.filter(r => r.status === "pending").length;
  const sentCount = recipients.filter(r => r.status === "sent").length;
  const failedCount = recipients.filter(r => r.status === "failed").length;

  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Left: campaign list */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-slate-800 text-sm">Campagnes</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="h-3 w-3" /> Nieuw
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-slate-400 text-sm">Laden…</div>
          ) : campaigns.length === 0 ? (
            <div className="p-6 text-center">
              <Mail className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nog geen campagnes</p>
            </div>
          ) : (
            <div className="py-1">
              {campaigns.map((c) => {
                const s = STATUS_MAP[c.status] ?? STATUS_MAP.draft;
                const Icon = s.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedId(c.id); setEditMode(false); setActiveTab("inhoud"); }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedId === c.id ? "bg-purple-50" : ""}`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${c.status === "sent" ? "text-green-500" : c.status === "scheduled" ? "text-blue-500" : "text-slate-400"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{c.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                        {c.sentCount > 0 && <span className="text-xs text-slate-400">{c.sentCount} verstuurd</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-slate-300 mt-1 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: detail panel */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Mail className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Selecteer een campagne of maak een nieuwe aan</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
            <div>
              {editMode ? (
                <Input value={formName} onChange={e => setFormName(e.target.value)}
                  className="font-semibold text-lg h-8 border-0 border-b border-purple-400 rounded-none px-0 focus-visible:ring-0" />
              ) : (
                <h2 className="font-semibold text-slate-800">{selected.name}</h2>
              )}
              <p className="text-xs text-slate-400 mt-0.5">
                Aangemaakt op {new Date(selected.createdAt).toLocaleDateString("nl-NL")}
                {selected.sentAt && ` · Verzonden op ${new Date(selected.sentAt).toLocaleDateString("nl-NL")}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selected.status !== "sent" && (
                <>
                  {editMode ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>Annuleren</Button>
                      <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>Opslaan</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(selected)}>
                      <Pencil className="h-3 w-3" /> Bewerken
                    </Button>
                  )}
                  <Button size="sm" className="gap-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => setShowSendConfirm(true)}>
                    <Send className="h-3 w-3" /> Verzenden
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(selected.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-2 border-b border-slate-100">
              <TabsList className="h-8 bg-transparent gap-1 p-0">
                <TabsTrigger value="inhoud" className="h-8 text-xs data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-700 data-[state=active]:bg-transparent rounded-none px-3">
                  <FileText className="h-3 w-3 mr-1" /> Inhoud
                </TabsTrigger>
                <TabsTrigger value="ontvangers" className="h-8 text-xs data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-700 data-[state=active]:bg-transparent rounded-none px-3">
                  <Users className="h-3 w-3 mr-1" /> Ontvangers ({recipients.length})
                </TabsTrigger>
                <TabsTrigger value="statistieken" className="h-8 text-xs data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-700 data-[state=active]:bg-transparent rounded-none px-3">
                  <BarChart2 className="h-3 w-3 mr-1" /> Statistieken
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Inhoud tab */}
            <TabsContent value="inhoud" className="flex-1 overflow-auto p-6">
              <div className="space-y-4 max-w-2xl">
                <div>
                  <Label className="text-xs text-slate-500">Onderwerp</Label>
                  {editMode ? (
                    <Input value={formSubject} onChange={e => setFormSubject(e.target.value)} className="mt-1" />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-800">{selected.subject}</p>
                  )}
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-slate-500">HTML-inhoud</Label>
                  <p className="text-xs text-slate-400 mt-0.5 mb-1">
                    Gebruik <code className="bg-slate-100 px-1 rounded">{"{{naam}}"}</code> en <code className="bg-slate-100 px-1 rounded">{"{{bedrijf}}"}</code> als personalisatievariabelen.
                  </p>
                  {editMode ? (
                    <Textarea value={formHtml} onChange={e => setFormHtml(e.target.value)}
                      className="font-mono text-xs mt-1 min-h-[200px]" />
                  ) : (
                    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2 text-xs text-slate-500 border-b border-slate-200 flex items-center justify-between">
                        <span>HTML preview</span>
                      </div>
                      <div className="p-4 text-sm text-slate-700 max-h-[300px] overflow-auto"
                        dangerouslySetInnerHTML={{ __html: selected.htmlContent }} />
                    </div>
                  )}
                </div>
                {editMode && (
                  <div>
                    <Label className="text-xs text-slate-500">Platte tekst (optioneel)</Label>
                    <Textarea value={formText} onChange={e => setFormText(e.target.value)}
                      className="mt-1 text-xs min-h-[80px]" placeholder="Platte tekst versie van de e-mail…" />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Ontvangers tab */}
            <TabsContent value="ontvangers" className="flex-1 overflow-hidden flex flex-col">
              {selected.status !== "sent" && (
                <div className="px-6 py-3 border-b border-slate-100 flex items-end gap-3 bg-slate-50/50">
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500">E-mailadres *</Label>
                    <Input value={recipEmail} onChange={e => setRecipEmail(e.target.value)}
                      placeholder="naam@bedrijf.nl" className="h-8 text-sm mt-0.5" />
                  </div>
                  <div className="w-40">
                    <Label className="text-xs text-slate-500">Naam</Label>
                    <Input value={recipName} onChange={e => setRecipName(e.target.value)}
                      placeholder="Naam" className="h-8 text-sm mt-0.5" />
                  </div>
                  <div className="w-40">
                    <Label className="text-xs text-slate-500">Bedrijf</Label>
                    <Input value={recipCompany} onChange={e => setRecipCompany(e.target.value)}
                      placeholder="Bedrijf" className="h-8 text-sm mt-0.5" />
                  </div>
                  <Button size="sm" className="h-8 gap-1" disabled={!recipEmail || addRecipientMutation.isPending}
                    onClick={() => addRecipientMutation.mutate({ email: recipEmail, name: recipName || undefined, company: recipCompany || undefined })}>
                    <Plus className="h-3 w-3" /> Toevoegen
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    disabled={importCrmMutation.isPending}
                    onClick={() => importCrmMutation.mutate()}>
                    <Download className="h-3 w-3" />
                    {importCrmMutation.isPending ? "Importeren…" : "CRM importeren"}
                  </Button>
                </div>
              )}
              <ScrollArea className="flex-1 px-6 py-2">
                {recipLoading ? (
                  <div className="py-4 text-center text-slate-400 text-sm">Laden…</div>
                ) : recipients.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Geen ontvangers. Voeg toe of importeer uit CRM.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-100">
                        <th className="text-left py-2 font-medium">E-mail</th>
                        <th className="text-left py-2 font-medium">Naam</th>
                        <th className="text-left py-2 font-medium">Bedrijf</th>
                        <th className="text-left py-2 font-medium">Status</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((r) => {
                        const s = RECIPIENT_STATUS[r.status] ?? RECIPIENT_STATUS.pending;
                        return (
                          <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-2 text-slate-700 flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-slate-300" />{r.email}
                            </td>
                            <td className="py-2 text-slate-600">
                              {r.name ? <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-300" />{r.name}</span> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-2 text-slate-600">
                              {r.company ? <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-slate-300" />{r.company}</span> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-2">
                              <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                              {r.errorMessage && <span className="text-xs text-red-400 ml-1">({r.errorMessage})</span>}
                            </td>
                            <td className="py-2 text-right">
                              {selected.status !== "sent" && (
                                <button onClick={() => deleteRecipientMutation.mutate(r.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Statistieken tab */}
            <TabsContent value="statistieken" className="flex-1 overflow-auto p-6">
              <div className="max-w-lg space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-slate-100">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-slate-800">{recipients.length}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Totaal ontvangers</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-100 bg-green-50/50">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{sentCount}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Verzonden</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-100 bg-red-50/50">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-red-500">{failedCount}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Mislukt</p>
                    </CardContent>
                  </Card>
                </div>
                {pendingCount > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700">{pendingCount} ontvanger(s) staan nog in de wachtrij.</p>
                  </div>
                )}
                {selected.status === "sent" && selected.sentAt && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-700">
                      Campagne verzonden op {new Date(selected.sentAt).toLocaleString("nl-NL")}.
                    </p>
                  </div>
                )}
                {recipients.length > 0 && sentCount > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Afleverpercentage</p>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.round((sentCount / recipients.length) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{Math.round((sentCount / recipients.length) * 100)}%</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuwe campagne</DialogTitle>
            <DialogDescription>Maak een nieuwe B2B e-mailcampagne aan voor prospects.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Campagnenaam *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="bijv. Introductie EXTRA - April 2026" className="mt-1" />
            </div>
            <div>
              <Label>Onderwerp *</Label>
              <Input value={formSubject} onChange={e => setFormSubject(e.target.value)}
                placeholder="bijv. Flexibel personeel? Ontdek EXTRA." className="mt-1" />
            </div>
            <div>
              <Label>HTML-inhoud *</Label>
              <p className="text-xs text-slate-400 mb-1">
                Gebruik <code className="bg-slate-100 px-1 rounded">{"{{naam}}"}</code> en <code className="bg-slate-100 px-1 rounded">{"{{bedrijf}}"}</code> voor personalisatie.
              </p>
              <Textarea value={formHtml} onChange={e => setFormHtml(e.target.value)}
                placeholder="<p>Beste {{naam}},</p><p>Wij zijn EXTRA, het hospitality uitzendbureau…</p>"
                className="font-mono text-xs min-h-[160px] mt-0.5" />
            </div>
            <div>
              <Label>Platte tekst (optioneel)</Label>
              <Textarea value={formText} onChange={e => setFormText(e.target.value)}
                className="text-xs mt-1 min-h-[60px]"
                placeholder="Platte tekst versie (voor e-mailclients zonder HTML-ondersteuning)…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Annuleren</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
              {createMutation.isPending ? "Aanmaken…" : "Aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirmation */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-purple-600" /> Campagne verzenden
            </AlertDialogTitle>
            <AlertDialogDescription>
              Je staat op het punt de campagne "<strong>{selected?.name}</strong>" te verzenden naar{" "}
              <strong>{pendingCount}</strong> ontvanger(s). Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingCount === 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Geen ontvangers in de wachtrij. Voeg eerst ontvangers toe.
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingCount === 0 || sendMutation.isPending}
              onClick={() => selected && sendMutation.mutate(selected.id)}
              className="bg-purple-600 hover:bg-purple-700">
              {sendMutation.isPending ? <><RefreshCw className="h-3 w-3 animate-spin mr-1" /> Verzenden…</> : "Verzenden"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Campagne verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt. Alle ontvangers worden ook verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600"
              onClick={() => showDeleteConfirm && deleteMutation.mutate(showDeleteConfirm)}>
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
