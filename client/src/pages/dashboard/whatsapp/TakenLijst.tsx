/**
 * De takenlijst: filterrij plus de taken zelf.
 *
 * Een taak komt uit dezelfde AI-call als het antwoord ("deze persoon vraagt
 * om zijn uren in Jixbee") en staat BEWUST los van het gesprek: je vinkt de
 * taak af zonder het gesprek te sluiten, en je sluit een gesprek zonder dat
 * de taak verdwijnt. Vandaar een eigen lijst met een eigen status.
 *
 * Heette TakenPanel en zat ingeklapt boven de gesprekkenlijst in de
 * WhatsApp-sidebar. Sinds Taken een eigen navigatie-item heeft is er niets
 * meer om in of uit te klappen en is dit gewoon de inhoud van die pagina —
 * vandaar dat `open`, `onToggleOpen` en `openTotaal` weg zijn. De teller die
 * op de ingeklapte kop stond zit nu in de rode badge naast Taken in de
 * hoofdnavigatie. De data komt van TakenPagina.tsx, dit component doet zelf
 * geen fetch.
 */
import { useState } from 'react';
import type { Task, TaskCategory, TaskStatus, TeamMember } from '../../../api/whatsappClient';
import { TASK_CATEGORY_LABELS } from '../../../api/whatsappClient';
import { WA, WA_TEKST, WA_GEWICHT, relativeTime } from './theme';

export type TakenAssigneeFilter = 'alle' | 'mij' | 'niemand';

interface Props {
  tasks: Task[];
  statusFilter: TaskStatus | 'alle';
  onStatusFilter: (s: TaskStatus | 'alle') => void;
  assigneeFilter: TakenAssigneeFilter;
  onAssigneeFilter: (f: TakenAssigneeFilter) => void;
  teamMembers: TeamMember[];
  onToggleTask: (task: Task) => void;
  onAssign: (task: Task, assignedToId: number | null) => void;
  /** Doorklik naar het bijbehorende gesprek (schakelt zo nodig van tab). */
  onSelectConversation: (task: Task) => void;
  /** Taak-ids waarvoor nu een verzoek loopt (checkbox tijdelijk uit). */
  bezig: number[];
  fout: string | null;
}

/**
 * Exhaustief getypt op TaskCategory (niet Record<string, string>): zo faalt
 * `tsc` zodra er een categorie bijkomt zonder kleur, in plaats van dat de
 * badge stilzwijgend grijs wordt.
 */
const CATEGORIE_KLEUR: Record<TaskCategory, string> = {
  uren_jixbee: '#0077b6',
  vervanging: '#e07a00',
  contract: '#b5179e',
  overig: '#667781',
};

function MiniChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '3px 9px', borderRadius: 999, flexShrink: 0,
        fontSize: WA_TEKST.badge, fontWeight: WA_GEWICHT.semibold, cursor: 'pointer', fontFamily: 'inherit',
        background: active ? WA.purple : '#fff',
        color: active ? '#fff' : '#4b5563',
        border: `1px solid ${active ? WA.purple : WA.border}`,
      }}
    >
      {children}
    </button>
  );
}

function TaakRegel({
  task, teamMembers, bezig, onToggleTask, onAssign, onSelectConversation,
}: {
  task: Task;
  teamMembers: TeamMember[];
  bezig: boolean;
  onToggleTask: (t: Task) => void;
  onAssign: (t: Task, id: number | null) => void;
  onSelectConversation: (t: Task) => void;
}) {
  const [hover, setHover] = useState(false);
  const klaar = task.status === 'klaar';
  const kleur = CATEGORIE_KLEUR[task.category] ?? CATEGORIE_KLEUR.overig;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', gap: 9, padding: '8px 12px',
        borderBottom: `1px solid ${WA.border}`,
        background: hover ? '#faf7ff' : '#fff',
        opacity: klaar ? 0.6 : 1,
      }}
    >
      {/* Afvinken. Staat los van het sluiten van het gesprek — met opzet. */}
      <input
        type="checkbox"
        checked={klaar}
        disabled={bezig}
        onChange={() => onToggleTask(task)}
        title={klaar ? 'Weer openzetten' : 'Afvinken (sluit het gesprek niet)'}
        style={{ marginTop: 2, width: 15, height: 15, cursor: bezig ? 'wait' : 'pointer', accentColor: WA.purple }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={() => onSelectConversation(task)}
          title="Open het bijbehorende gesprek"
          style={{
            fontSize: WA_TEKST.secundair, lineHeight: 1.35, color: WA.text, cursor: 'pointer',
            textDecoration: klaar ? 'line-through' : 'none',
          }}
        >
          {task.summary}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
          fontSize: WA_TEKST.mini, color: WA.textSub, flexWrap: 'wrap',
        }}>
          <span style={{
            background: kleur, color: '#fff', borderRadius: 4,
            padding: '1px 5px', fontWeight: WA_GEWICHT.semibold,
          }}>
            {TASK_CATEGORY_LABELS[task.category] ?? task.category}
          </span>
          <span
            onClick={() => onSelectConversation(task)}
            style={{ cursor: 'pointer', fontWeight: WA_GEWICHT.semibold, color: WA.purple }}
          >
            {task.contactName || `+${task.phoneNumber}`}
          </span>
          <span>· {relativeTime(task.createdAt)}</span>
          {klaar && task.completedByName && <span>· afgevinkt door {task.completedByName}</span>}
        </div>

        {/* Toewijzen. Leeg = van niemand; dan pakt wie tijd heeft hem op. */}
        <select
          value={task.assignedToId ?? ''}
          onChange={e => onAssign(task, e.target.value === '' ? null : Number(e.target.value))}
          style={{
            marginTop: 5, fontSize: WA_TEKST.mini, padding: '2px 4px', maxWidth: '100%',
            border: `1px solid ${WA.border}`, borderRadius: 5,
            background: '#fff', color: task.assignedToId ? WA.text : WA.textSub,
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <option value="">Niemand toegewezen</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function TakenLijst(props: Props) {
  const {
    tasks, statusFilter, onStatusFilter, assigneeFilter, onAssigneeFilter,
    teamMembers, onToggleTask, onAssign, onSelectConversation, bezig, fout,
  } = props;

  return (
    <div style={{ background: '#fff', border: `1px solid ${WA.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 5, padding: '10px 12px', overflowX: 'auto' }}>
        <MiniChip active={assigneeFilter === 'alle'} onClick={() => onAssigneeFilter('alle')}>Iedereen</MiniChip>
        <MiniChip active={assigneeFilter === 'mij'} onClick={() => onAssigneeFilter('mij')}>Van mij</MiniChip>
        <MiniChip active={assigneeFilter === 'niemand'} onClick={() => onAssigneeFilter('niemand')}>Vrij</MiniChip>
        <span style={{ width: 1, background: WA.border, margin: '2px 3px', flexShrink: 0 }} />
        <MiniChip active={statusFilter === 'open'} onClick={() => onStatusFilter('open')}>Open</MiniChip>
        <MiniChip active={statusFilter === 'klaar'} onClick={() => onStatusFilter('klaar')}>Klaar</MiniChip>
      </div>

      {fout && (
        <div style={{ padding: '6px 12px', fontSize: WA_TEKST.badge, color: '#b91c1c', background: '#fef2f2' }}>{fout}</div>
      )}

      {/* Geen maxHeight meer met een eigen scrollbalk: in de sidebar moest de
          lijst binnen 260px blijven omdat de gesprekken eronder stonden. Op
          een eigen pagina scrollt de pagina zelf. */}
      <div style={{ borderTop: `1px solid ${WA.border}` }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '24px 12px', fontSize: WA_TEKST.secundair, color: WA.textSub, textAlign: 'center' }}>
            {statusFilter === 'klaar' ? 'Nog niets afgevinkt.' : 'Geen openstaande taken.'}
          </div>
        ) : (
          tasks.map(t => (
            <TaakRegel
              key={t.id}
              task={t}
              teamMembers={teamMembers}
              bezig={bezig.includes(t.id)}
              onToggleTask={onToggleTask}
              onAssign={onAssign}
              onSelectConversation={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
}
