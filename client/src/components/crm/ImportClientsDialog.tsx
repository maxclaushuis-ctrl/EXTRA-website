import { useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

type ParsedContact = { name: string; function?: string; email?: string; phone?: string };

type ParsedRow = {
  name: string;
  type?: string;
  city?: string;
  region?: string;
  website?: string;
  linkedin?: string;
  owner?: string;
  accountOwner?: string;
  abc?: string;
  potential?: string;
  source?: string;
  busyPeriods?: string;
  notes?: string;
  tags?: string;
  contactName?: string;
  contactFunction?: string;
  contactEmail?: string;
  contactPhone?: string;
  contacts?: ParsedContact[];
  _rowError?: string;
};

const COLUMNS: Array<{ header: string; key: keyof ParsedRow; width: number; example: string; required?: boolean }> = [
  { header: 'Bedrijfsnaam *',  key: 'name',            width: 28, example: 'Hotel De Zon',                  required: true },
  { header: 'Type',            key: 'type',            width: 14, example: 'hotel' },
  { header: 'Stad',            key: 'city',            width: 18, example: 'Amsterdam' },
  { header: 'Regio',           key: 'region',          width: 18, example: 'Noord-Holland' },
  { header: 'Website',         key: 'website',         width: 28, example: 'https://hoteldezon.nl' },
  { header: 'LinkedIn',        key: 'linkedin',        width: 28, example: '' },
  { header: 'Eigenaar',        key: 'owner',           width: 12, example: 'lea' },
  { header: 'Account-eigenaar',key: 'accountOwner',    width: 16, example: 'eveline' },
  { header: 'Klasse (A/B/C)',  key: 'abc',             width: 12, example: 'A' },
  { header: 'Potentie',        key: 'potential',       width: 12, example: 'hoog' },
  { header: 'Bron',            key: 'source',          width: 16, example: 'netwerk' },
  { header: 'Drukke periodes', key: 'busyPeriods',     width: 22, example: 'Zomer, Kerst' },
  { header: 'Notities',        key: 'notes',           width: 30, example: 'Belangrijke klant' },
  { header: 'Tags (komma)',    key: 'tags',            width: 22, example: 'VIP klant, Hot lead' },
  { header: 'Contact naam',    key: 'contactName',     width: 22, example: 'Jan de Vries' },
  { header: 'Contact functie', key: 'contactFunction', width: 18, example: 'F&B Manager' },
  { header: 'Contact e-mail',  key: 'contactEmail',    width: 26, example: 'jan@hoteldezon.nl' },
  { header: 'Contact telefoon',key: 'contactPhone',    width: 18, example: '+31201234567' },
];

const HEADER_TO_KEY: Record<string, keyof ParsedRow> = COLUMNS.reduce((acc, c) => {
  acc[c.header.toLowerCase().replace(/\s*\*$/, '').trim()] = c.key;
  return acc;
}, {} as Record<string, keyof ParsedRow>);

// Aliassen voor wat soepelere herkenning
const ALIASES: Record<string, keyof ParsedRow> = {
  'naam': 'name',
  'bedrijf': 'name',
  'company': 'name',
  'plaats': 'city',
  'klasse': 'abc',
  'abc': 'abc',
  'a/b/c': 'abc',
  'tag': 'tags',
};

async function downloadTemplate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Klanten');

  ws.columns = COLUMNS.map(c => ({ header: c.header, key: c.key as string, width: c.width }));

  // Header opmaak
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 22;

  // Voorbeeldrij
  const exampleRow: Record<string, string> = {};
  COLUMNS.forEach(c => { exampleRow[c.key as string] = c.example; });
  ws.addRow(exampleRow);
  ws.getRow(2).font = { italic: true, color: { argb: 'FF94A3B8' } };

  // Toelichting-tab
  const ws2 = wb.addWorksheet('Toelichting');
  ws2.columns = [{ width: 26 }, { width: 60 }];
  ws2.addRow(['Veld', 'Toegestane waardes / uitleg']).font = { bold: true };
  const help: Array<[string, string]> = [
    ['Bedrijfsnaam *', 'Verplicht. Naam van de klant.'],
    ['Type', 'hotel | restaurant | eventlocatie | cateraar (default: hotel)'],
    ['Eigenaar', 'max | eveline | charlotte | lea (kleine letters)'],
    ['Account-eigenaar', 'max | eveline | charlotte | lea'],
    ['Klasse (A/B/C)', 'A | B | C'],
    ['Potentie', 'laag | midden | hoog'],
    ['Bron', 'linkedin | referral | website | inbound | netwerk | anders'],
    ['Tags (komma)', 'Meerdere tags scheiden met komma. Bv: "VIP klant, Hot lead"'],
    ['Contact-velden', 'Optioneel. Als ingevuld wordt automatisch een primair contact aangemaakt.'],
  ];
  help.forEach(r => ws2.addRow(r));

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'klanten-import-template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

// Eenvoudige RFC4180-achtige CSV-parser (ondersteunt quoted velden, dubbele quotes)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cur.push(field); field = ''; }
      else if (ch === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.some(c => c && c.trim() !== ''));
}

function cleanZip(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function cleanPhone(s: string): string {
  let v = (s || '').trim();
  if (!v) return '';
  // formaten zoals "31 0639125620" of "31 0207106025" → "+31 6 39 12 56 20"-stijl
  if (/^31\s+0?/.test(v)) v = '+31 ' + v.replace(/^31\s+0?/, '');
  // normaliseer dubbele spaties
  v = v.replace(/\s+/g, ' ');
  return v;
}

function pickRegion(regions: string): string | undefined {
  // "EXTRA, Brabant" → "Brabant"; "Noord-holland, EXTRA" → "Noord-holland"
  if (!regions) return undefined;
  const parts = regions.split(',').map(p => p.trim()).filter(p => p && p.toLowerCase() !== 'extra');
  return parts[0];
}

// Bekend export-formaat: client_id,client_name,street_name,...
function parseExportRows(headers: string[], dataRows: string[][]): ParsedRow[] {
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => { idx[h.trim().toLowerCase()] = i; });
  const get = (row: string[], key: string) => {
    const i = idx[key];
    return i === undefined ? '' : (row[i] || '').trim();
  };

  // Groepeer op client_id
  type Group = {
    name: string;
    city?: string;
    region?: string;
    notesLines: string[];
    contactsByKey: Map<string, ParsedContact>;
  };
  const groups = new Map<string, Group>();

  for (const row of dataRows) {
    const clientId = get(row, 'client_id');
    const clientName = get(row, 'client_name');
    if (!clientId && !clientName) continue;
    const groupKey = clientId || clientName;

    let g = groups.get(groupKey);
    if (!g) {
      // Bouw notitie-regels uit adres / e-mail / telefoon / rating / rate
      const street = get(row, 'street_name');
      const number = get(row, 'number');
      const numberExt = get(row, 'number_extention');
      const zip = cleanZip(get(row, 'zip_code'));
      const cityVal = get(row, 'city');
      const email = get(row, 'email');
      const mobile = get(row, 'mobile');
      const rating = get(row, 'rating');
      const rate = get(row, 'rate');
      const regions = get(row, 'regions');

      const addressLine = [street, [number, numberExt].filter(Boolean).join(' ')].filter(Boolean).join(' ').trim();
      const fullAddress = [addressLine, [zip, cityVal].filter(Boolean).join(' ')].filter(Boolean).join(', ');
      const notesLines: string[] = [];
      if (fullAddress) notesLines.push(`Adres: ${fullAddress}`);
      if (email) notesLines.push(`E-mail bedrijf: ${email}`);
      if (mobile) notesLines.push(`Telefoon bedrijf: ${cleanPhone(mobile)}`);
      if (rating && rating !== '0') notesLines.push(`Beoordeling: ${rating}`);
      if (rate && rate !== '0') notesLines.push(`Tarief: € ${rate}`);
      if (regions) notesLines.push(`Regio's: ${regions}`);
      if (clientId) notesLines.push(`Geïmporteerd uit oud systeem (ID ${clientId})`);

      g = {
        name: clientName,
        city: cityVal || undefined,
        region: pickRegion(regions),
        notesLines,
        contactsByKey: new Map(),
      };
      groups.set(groupKey, g);
    }

    // Contact toevoegen indien aanwezig
    const cid = get(row, 'contact_id');
    const cFirst = get(row, 'contact_first_name');
    const cLast = get(row, 'contact_last_name');
    const cPhone = cleanPhone(get(row, 'contact_phone_number'));
    const cEmail = get(row, 'contact_email');
    if (cid || cFirst || cLast || cEmail || cPhone) {
      const fullName = [cFirst, cLast].filter(Boolean).join(' ').trim();
      const key = cid || `${fullName}|${cEmail}`;
      if (!g.contactsByKey.has(key)) {
        g.contactsByKey.set(key, {
          name: fullName || cEmail || cPhone,
          email: cEmail || undefined,
          phone: cPhone || undefined,
        });
      }
    }
  }

  const result: ParsedRow[] = [];
  for (const g of Array.from(groups.values())) {
    const contacts = Array.from(g.contactsByKey.values()).filter(c => c.name || c.email || c.phone);
    const row: ParsedRow = {
      name: g.name,
      type: 'hotel',
      city: g.city,
      region: g.region,
      notes: g.notesLines.join('\n') || undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
    };
    if (!row.name) row._rowError = 'Bedrijfsnaam ontbreekt';
    result.push(row);
  }
  return result;
}

function isExportFormat(headers: string[]): boolean {
  const lower = headers.map(h => h.trim().toLowerCase());
  return lower.includes('client_id') && lower.includes('client_name');
}

async function parseFile(file: File): Promise<ParsedRow[]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv') || file.type === 'text/csv') {
    const text = await file.text();
    const all = parseCsv(text);
    if (all.length === 0) return [];
    const headers = all[0];
    const dataRows = all.slice(1);
    if (isExportFormat(headers)) {
      return parseExportRows(headers, dataRows);
    }
    // Generieke CSV (sjabloon-compatible): map kolommen op de bekende keys
    const colMap: Record<number, keyof ParsedRow> = {};
    headers.forEach((h, i) => {
      const raw = h.toLowerCase().replace(/\s*\*$/, '').trim();
      const key = HEADER_TO_KEY[raw] || ALIASES[raw];
      if (key) colMap[i] = key;
    });
    const rows: ParsedRow[] = [];
    for (const dr of dataRows) {
      const data: any = {};
      let has = false;
      dr.forEach((val, i) => {
        const key = colMap[i];
        if (!key) return;
        const s = (val || '').trim();
        if (s) { data[key] = s; has = true; }
      });
      if (!has) continue;
      if (!data.name) data._rowError = 'Bedrijfsnaam ontbreekt';
      rows.push(data as ParsedRow);
    }
    return rows;
  }

  // Excel-pad
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => { headers[colNumber - 1] = String(cell.value || ''); });

  // Detecteer ook in Excel als iemand het export-CSV via Excel heeft opgeslagen
  if (isExportFormat(headers)) {
    const dataRows: string[][] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const arr: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let v: any = cell.value;
        if (v && typeof v === 'object' && 'text' in v) v = (v as any).text;
        if (v && typeof v === 'object' && 'result' in v) v = (v as any).result;
        arr[colNumber - 1] = v == null ? '' : String(v);
      });
      dataRows.push(arr);
    });
    return parseExportRows(headers, dataRows);
  }

  const colMap: Record<number, keyof ParsedRow> = {};
  headerRow.eachCell((cell, colNumber) => {
    const raw = String(cell.value || '').toLowerCase().replace(/\s*\*$/, '').trim();
    const key = HEADER_TO_KEY[raw] || ALIASES[raw];
    if (key) colMap[colNumber] = key;
  });

  const rows: ParsedRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const data: any = {};
    let hasValue = false;
    row.eachCell((cell, colNumber) => {
      const key = colMap[colNumber];
      if (!key) return;
      let val: any = cell.value;
      if (val && typeof val === 'object' && 'text' in val) val = (val as any).text;
      if (val && typeof val === 'object' && 'result' in val) val = (val as any).result;
      const s = val == null ? '' : String(val).trim();
      if (s) { data[key] = s; hasValue = true; }
    });
    if (!hasValue) return;
    if (!data.name) data._rowError = 'Bedrijfsnaam ontbreekt';
    rows.push(data as ParsedRow);
  });
  return rows;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportClientsDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<null | { createdCount: number; errorCount: number; errors: Array<{ row: number; name?: string; reason: string }> }>(null);

  function reset() {
    setRows([]);
    setFileName('');
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleFile(file: File) {
    try {
      setResult(null);
      const parsed = await parseFile(file);
      setRows(parsed);
      setFileName(file.name);
      if (parsed.length === 0) {
        toast({ title: 'Geen rijen gevonden', description: 'Het bestand lijkt leeg of de kolomnamen wijken af van het sjabloon.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Inlezen mislukt', description: e?.message || 'Onbekende fout', variant: 'destructive' });
    }
  }

  async function handleImport() {
    const validRows = rows.filter(r => !r._rowError);
    if (validRows.length === 0) {
      toast({ title: 'Niets te importeren', description: 'Geen geldige rijen gevonden.', variant: 'destructive' });
      return;
    }
    setImporting(true);
    try {
      const data: any = await apiRequest('/api/admin/crm/companies/import', {
        method: 'POST',
        body: JSON.stringify({ rows: validRows, defaultIsClient: true }),
      });
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] });
      toast({
        title: 'Import voltooid',
        description: `${data.createdCount} klant(en) toegevoegd${data.errorCount ? `, ${data.errorCount} fout(en)` : ''}.`,
      });
    } catch (e: any) {
      toast({ title: 'Import mislukt', description: e?.message || 'Onbekende fout', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter(r => !r._rowError).length;
  const errorCount = rows.length - validCount;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            Klanten importeren via Excel
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-5">
            {/* Stap 1: template */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Download het sjabloon</h4>
                  <p className="text-xs text-gray-600 mt-0.5">Vul je klantgegevens in volgens het voorbeeld. De eerste rij bevat de kolomnamen.</p>
                  <Button size="sm" variant="outline" className="mt-3 h-8 gap-1.5 text-xs" onClick={downloadTemplate}>
                    <Download className="w-3.5 h-3.5" /> Sjabloon downloaden (.xlsx)
                  </Button>
                </div>
              </div>
            </div>

            {/* Stap 2: upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">Upload het ingevulde Excel-bestand</h4>
                  <p className="text-xs text-gray-600 mt-0.5">Alleen .xlsx of .xls bestanden.</p>
                  <Button size="sm" className="mt-3 h-8 gap-1.5 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => inputRef.current?.click()}>
                    <Upload className="w-3.5 h-3.5" /> {fileName ? 'Ander bestand kiezen' : 'Bestand kiezen'}
                  </Button>
                  {fileName && <p className="text-xs text-gray-500 mt-2">Geselecteerd: <span className="font-medium text-gray-700">{fileName}</span></p>}
                </div>
              </div>
            </div>

            {/* Stap 3: preview */}
            {rows.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Voorbeeld ({rows.length} rij{rows.length !== 1 ? 'en' : ''})</h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{validCount} geldig</span>
                    {errorCount > 0 && (
                      <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{errorCount} ongeldig</span>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 w-8"></th>
                        <th className="text-left p-2">Bedrijfsnaam</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Stad</th>
                        <th className="text-left p-2">Eigenaar</th>
                        <th className="text-left p-2">Klasse</th>
                        <th className="text-left p-2">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} className={`border-t ${r._rowError ? 'bg-red-50' : ''}`}>
                          <td className="p-2">
                            {r._rowError
                              ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                              : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                          </td>
                          <td className="p-2 font-medium text-gray-800">{r.name || <span className="text-red-500 italic">(leeg)</span>}</td>
                          <td className="p-2 text-gray-600">{r.type || '—'}</td>
                          <td className="p-2 text-gray-600">{r.city || '—'}</td>
                          <td className="p-2 text-gray-600">{r.owner || '—'}</td>
                          <td className="p-2 text-gray-600">{r.abc || '—'}</td>
                          <td className="p-2 text-gray-600 truncate max-w-[160px]">{r.contactName || r.contactEmail || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && <p className="text-xs text-gray-400 mt-1">…en nog {rows.length - 50} rijen meer.</p>}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-900">Import voltooid</h3>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold text-green-700">{result.createdCount}</span> klant(en) toegevoegd
                {result.errorCount > 0 && <>, <span className="font-semibold text-red-600">{result.errorCount}</span> overgeslagen</>}.
              </p>
            </div>
            {result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Overgeslagen rijen</h4>
                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Rij</th>
                        <th className="text-left p-2">Bedrijfsnaam</th>
                        <th className="text-left p-2">Reden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((er, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 text-gray-500">{er.row}</td>
                          <td className="p-2 text-gray-800">{er.name || '—'}</td>
                          <td className="p-2 text-red-600">{er.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {!result ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9"><X className="w-3.5 h-3.5 mr-1" />Annuleren</Button>
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 gap-1.5"
              >
                {importing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Bezig…</> : <><Upload className="w-3.5 h-3.5" /> {validCount} klant(en) importeren</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={reset} className="text-xs h-9">Opnieuw importeren</Button>
              <Button onClick={() => onOpenChange(false)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9">Sluiten</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
