import type { LevelReport } from './scoring';

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const esc = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cells: unknown[]) => cells.map(esc).join(',');

const stamp = (r: LevelReport) => `${r.levelId}_${(r.player.nickname || 'player').replace(/[^\w一-鿿-]/g, '')}_${r.generatedAt.slice(0, 19).replace(/[:T]/g, '-')}`;

export function exportJSON(r: LevelReport) {
  download(`osce-escape_${stamp(r)}.json`, JSON.stringify(r, null, 2), 'application/json');
}

export function reportToCSV(r: LevelReport): string {
  const lines: string[] = [];
  lines.push(row(['section', 'key', 'value', 'domain', 'weight', 'achieved', 'critical', 'note']));
  lines.push(row(['meta', 'level', r.levelId]));
  lines.push(row(['meta', 'case', r.caseId]));
  lines.push(row(['meta', 'review_status', r.reviewStatus]));
  lines.push(row(['meta', 'nickname', r.player.nickname]));
  lines.push(row(['meta', 'role', r.player.role]));
  lines.push(row(['meta', 'mode', r.player.mode]));
  lines.push(row(['meta', 'difficulty', r.player.difficulty]));
  lines.push(row(['meta', 'generated_at', r.generatedAt]));
  lines.push(row(['meta', 'duration_sec', Math.round(r.durationMs / 1000)]));
  lines.push(row(['meta', 'overtime', r.overtime]));
  lines.push(row(['meta', 'overall_pct', r.overallPct]));
  lines.push(row(['meta', 'hints_total', r.hints.total]));
  lines.push(row(['meta', 'puzzle_attempts', r.puzzle.attempts]));
  lines.push(row(['meta', 'puzzle_assisted', r.puzzle.assisted]));
  for (const d of r.domains) lines.push(row(['domain', d.domain, d.pct ?? 'N/A', d.label, d.weight, d.achieved, '', `possible=${d.possible}`]));
  for (const i of r.items) lines.push(row(['item', i.id, i.label, i.domain, i.weight, i.achieved ? 1 : 0, i.critical ? 1 : 0, i.criterion]));
  for (const d of r.decisions) lines.push(row(['decision', d.eventId, d.optionId, '', '', d.verdict, '', `t=${Math.round(d.t / 1000)}s`]));
  for (const e of r.events) lines.push(row(['event', e.type, e.ref ?? '', '', '', '', '', `t=${Math.round(e.t / 1000)}s ${e.detail ?? ''}`]));
  return '﻿' + lines.join('\n');
}

export function exportCSV(r: LevelReport) {
  download(`osce-escape_${stamp(r)}.csv`, reportToCSV(r), 'text/csv;charset=utf-8');
}
