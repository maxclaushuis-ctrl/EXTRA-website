/**
 * Fase 3B — Taken, sinds Fase 3E het vierde sub-tabblad van de sidebar.
 *
 * Een taak komt uit dezelfde AI-call als het antwoord ("deze persoon vraagt
 * om zijn uren in Jixbee") en staat BEWUST los van het gesprek: je vinkt de
 * taak af zonder het gesprek te sluiten, en je sluit een gesprek zonder dat
 * de taak verdwijnt. Vandaar een eigen lijst met een eigen status.
 *
 * Was: een inklapbaar paneel bóven de gesprekkenlijst. Dat kostte in elk
 * tabblad permanent een balk, en gaf de takenlijst maar 260px hoogte. Nu is
 * het een eigen tabblad dat de volle hoogte krijgt; de teller van openstaande
 * taken is verhuisd naar de tab-badge in Sidebar.tsx, zodat je nog steeds in
 * één oogopslag ziet dat er iets ligt zonder er eerst heen te klikken.
 */
import { useState } from 'react';
import type { Task, TaskCategory, TaskStatus, TeamMember } from '../../../api/whatsappClient';
import { TASK_CATEGORY_LABELS } from '../../../api/whatsappClient';
import { WA, relativeTime } from './theme';

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
        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
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
            fontSize: 12.5, lineHeight: 1.35, color: WA.text, cursor: 'pointer',
            textDecoration: klaar ? 'line-through' : 'none',
          }}
        >
          {task.summary}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
          fontSize: 10.5, color: WA.textSub, flexWrap: 'wrap',
        }}>
          <span style={{
            background: kleur, color: '#fff', borderRadius: 4,
            padding: '1px 5px', fontWeight: 600,
          }}>
            {TASK_CATEGORY_LABELS[task.category] ?? task.category}
          </span>
          <span
            onClick={() => onSelectConversation(task)}
            style={{ cursor: 'pointer', fontWeight: 600, color: WA.purple }}
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
            marginTop: 5, fontSize: 10.5, padding: '2px 4px', maxWidth: '100%',
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

export default function TakenPanel(props: Props) {
  const {
    tasks,
    statusFilter, onStatusFilter, assigneeFilter, onAssigneeFilter,
    teamMembers, onToggleTask, onAssign, onSelectConversation, bezig, fout,
  } = props;

  return (
    // minHeight:0 is hier geen detail maar de voorwaarde: zonder die regel
    // weigert een flex-kind te krimpen onder zijn inhoud en scrollt de lijst
    // hieronder niet, maar duwt hij de sidebar uit beeld.
    <div style={{
      flex: 1, minHeight: 0, background: '#fff',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', gap: 5, padding: '9px 12px', overflowX: 'auto', flexShrink: 0,
      }}>
        <MiniChip active={assigneeFilter === 'alle'} onClick={() => onAssigneeFilter('alle')}>Iedereen</MiniChip>
        <MiniChip active={assigneeFilter === 'mij'} onClick={() => onAssigneeFilter('mij')}>Van mij</MiniChip>
        <MiniChip active={assigneeFilter === 'niemand'} onClick={() => onAssigneeFilter('niemand')}>Vrij</MiniChip>
        <span style={{ width: 1, background: WA.border, margin: '2px 3px', flexShrink: 0 }} />
        <MiniChip active={statusFilter === 'open'} onClick={() => onStatusFilter('open')}>Open</MiniChip>
        <MiniChip active={statusFilter === 'klaar'} onClick={() => onStatusFilter('klaar')}>Klaar</MiniChip>
      </div>

      {fout && (
        <div style={{ padding: '6px 12px', fontSize: 11, color: '#b91c1c', background: '#fef2f2', flexShrink: 0 }}>{fout}</div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', borderTop: `1px solid ${WA.border}` }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '18px 12px', fontSize: 11.5, color: WA.textSub, textAlign: 'center' }}>
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
