import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle, AlignLeft, ChevronDown, Eye, Image as ImageIcon, Mail,
  Minus, Square, Trash2, Type, User, X,
} from 'lucide-react';
import {
  BLOCK_TYPES, BlockPreview, BlockProperties, makeBlock, parseContent,
  PersonalTagsContext, type BuilderBlock, type BuilderContent, type PersonalTag,
} from '@/components/EmailBuilderPage';

const ONBOARDING_TAGS: PersonalTag[] = [
  { tag: '{{voornaam}}', label: 'Voornaam' },
  { tag: '{{achternaam}}', label: 'Achternaam' },
  { tag: '{{naam}}', label: 'Volledige naam' },
  { tag: '{{functie}}', label: 'Functie' },
  { tag: '{{opdrachtgever}}', label: 'Opdrachtgever' },
  { tag: '{{startdatum}}', label: 'Startdatum' },
];

// Onboarding gebruikt een vereenvoudigde set: geen taalvariant (aparte templates per taal)
// en geen aanhef-blok (handmatig in eerste paragraaf).
const HIDDEN_BLOCK_TYPES = new Set<BuilderBlock['type']>(['taalvariant', 'aanhef']);
const ONBOARDING_BLOCKS = BLOCK_TYPES.filter(b => !HIDDEN_BLOCK_TYPES.has(b.type));

const BLOCK_ICONS: Record<string, any> = {
  koptekst: Type, paragraaf: AlignLeft, knop: Square, afbeelding: ImageIcon,
  lijn: Minus, ruimte: ChevronDown, handtekening: User,
};

export function migreerNaarBuilderContent(raw: string | null | undefined): BuilderContent {
  if (!raw) {
    return {
      modus: 'html',
      instellingen: {
        achtergrond_email: '#F9FAFB',
        achtergrond_inhoud: '#FFFFFF',
        lettertype: 'Inter',
        tekstkleur: '#111827',
        unsubscribe_tekst: '',
      },
      blokken: [],
    };
  }

  // Probeer als BuilderContent te lezen
  const parsed = parseContent(raw);
  if (parsed.blokken.length > 0 || (raw.startsWith('{') && raw.includes('"modus"'))) {
    return parsed;
  }

  // Probeer als legacy onboarding-formaat: { blokken: [{type:'tekst', content}] }
  try {
    const json = JSON.parse(raw);
    if (json?.blokken && Array.isArray(json.blokken)) {
      const tekst = json.blokken
        .map((b: any) => b.content || b.tekst || '')
        .filter(Boolean)
        .join('\n\n');
      return wrapAlsParagraaf(tekst);
    }
  } catch {
    // raw is plain text
    return wrapAlsParagraaf(raw);
  }

  return wrapAlsParagraaf(raw);
}

function wrapAlsParagraaf(tekst: string): BuilderContent {
  return {
    modus: 'html',
    instellingen: {
      achtergrond_email: '#F9FAFB',
      achtergrond_inhoud: '#FFFFFF',
      lettertype: 'Inter',
      tekstkleur: '#111827',
      unsubscribe_tekst: '',
    },
    blokken: tekst.trim()
      ? [{
          id: `blok_${Date.now()}_init`,
          type: 'paragraaf',
          tekst,
          uitlijning: 'left',
          kleur: '#374151',
        }]
      : [],
  };
}

interface Props {
  value: BuilderContent;
  onChange: (next: BuilderContent) => void;
  isSaving?: boolean;
  savedAt?: Date | null;
  onPreview?: () => void;
  onTestmail?: () => void;
}

export default function OnboardingEmailBuilder({
  value, onChange, isSaving, savedAt, onPreview, onTestmail,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedBlock = useMemo(
    () => value.blokken.find(b => b.id === selectedId) ?? null,
    [value.blokken, selectedId]
  );

  function update(patch: Partial<BuilderContent>) {
    onChange({ ...value, ...patch });
  }
  function addBlock(type: BuilderBlock['type']) {
    const blk = makeBlock(type);
    update({ blokken: [...value.blokken, blk] });
    setSelectedId(blk.id);
  }
  function updateBlock(id: string, patch: Partial<BuilderBlock>) {
    update({
      blokken: value.blokken.map(b => (b.id === id ? ({ ...b, ...patch } as BuilderBlock) : b)),
    });
  }
  function removeBlock(id: string) {
    update({ blokken: value.blokken.filter(b => b.id !== id) });
    if (selectedId === id) setSelectedId(null);
  }
  function moveBlock(id: string, dir: -1 | 1) {
    const idx = value.blokken.findIndex(b => b.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= value.blokken.length) return;
    const next = [...value.blokken];
    [next[idx], next[j]] = [next[j], next[idx]];
    update({ blokken: next });
  }

  return (
    <PersonalTagsContext.Provider value={ONBOARDING_TAGS}>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Toolbar + save indicator */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {ONBOARDING_BLOCKS.map(bt => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md hover:bg-purple-50 hover:text-purple-700 text-gray-600 transition-colors border border-transparent hover:border-purple-200"
                title={bt.desc}
                data-testid={`btn-add-block-${bt.type}`}
              >
                <bt.icon className="h-3.5 w-3.5" />+ {bt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {isSaving ? (
              <><span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" /><span className="text-orange-500">Opslaan…</span></>
            ) : savedAt ? (
              <><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-500">Opgeslagen om {savedAt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span></>
            ) : (
              <span className="text-gray-400">Niet opgeslagen</span>
            )}
          </div>
        </div>

        {/* Body: canvas + properties */}
        <div className="grid grid-cols-[1fr_280px] min-h-[420px]">
          {/* Canvas */}
          <div className="bg-gray-100 p-4 overflow-auto">
            <div
              className="mx-auto rounded-lg shadow-sm"
              style={{
                width: '100%',
                maxWidth: '600px',
                background: value.instellingen.achtergrond_inhoud,
                fontFamily: value.instellingen.lettertype + ',sans-serif',
                color: value.instellingen.tekstkleur,
                padding: '28px 24px',
                minHeight: '380px',
              }}
            >
              {value.blokken.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <Mail className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  Voeg blokken toe via de knoppen bovenaan
                </div>
              )}
              <div className="space-y-2">
                {value.blokken.map(blok => (
                  <div key={blok.id} className="relative group">
                    <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 flex flex-col gap-0.5 transition-opacity z-10">
                      <button onClick={() => moveBlock(blok.id, -1)} className="bg-white border border-gray-200 shadow-sm rounded p-0.5 text-gray-400 hover:text-gray-700 text-[10px]" title="Omhoog">↑</button>
                      <button onClick={() => moveBlock(blok.id, 1)} className="bg-white border border-gray-200 shadow-sm rounded p-0.5 text-gray-400 hover:text-gray-700 text-[10px]" title="Omlaag">↓</button>
                      <button onClick={() => removeBlock(blok.id)} className="bg-white border border-red-200 shadow-sm rounded p-0.5 text-red-300 hover:text-red-600" title="Verwijderen"><X className="h-2.5 w-2.5" /></button>
                    </div>
                    <BlockPreview blok={blok} selected={selectedId === blok.id} onClick={() => setSelectedId(blok.id)} />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 mt-4 text-[11px] text-gray-300 text-center">
                EXTRA B.V. — Amsterdam · doehetextra.nl
              </div>
            </div>
          </div>

          {/* Properties side panel */}
          <div className="border-l border-gray-200 bg-white flex flex-col">
            {selectedBlock ? (
              <>
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    {ONBOARDING_BLOCKS.find(t => t.type === selectedBlock.type)?.label || selectedBlock.type}
                  </p>
                  <button onClick={() => setSelectedId(null)} className="text-gray-300 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ScrollArea className="flex-1 max-h-[400px]">
                  <div className="p-3">
                    <BlockProperties blok={selectedBlock} onChange={patch => updateBlock(selectedBlock.id, patch)} />
                    <button
                      onClick={() => removeBlock(selectedBlock.id)}
                      className="mt-4 w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg py-2 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-3 w-3" /> Blok verwijderen
                    </button>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <AlignLeft className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Selecteer een blok</p>
                  <p className="text-[11px] text-gray-400 mt-1">Klik op een blok in het canvas om het te bewerken</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer-acties */}
        <div className="flex justify-end gap-2 px-3 py-2 border-t border-gray-200 bg-white">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview} data-testid="btn-builder-preview">
              <Eye className="h-3.5 w-3.5 mr-1" /> Voorvertoning
            </Button>
          )}
          {onTestmail && (
            <Button variant="outline" size="sm" onClick={onTestmail} data-testid="btn-builder-testmail">
              <Mail className="h-3.5 w-3.5 mr-1" /> Testmail sturen
            </Button>
          )}
        </div>
      </div>
    </PersonalTagsContext.Provider>
  );
}
