import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Domain, PlayerProfile, Screen } from '../types/game';
import type { Effects } from '../engines/narrative/types';
import { evaluateCondition } from '../engines/narrative/conditions';
import { toCtx } from '../engines/narrative/context';
import { CLUE_MAP, CLUES } from '../engines/case/chestPainCase';
import { DIALOGUE_MAP, WHO_ARE_YOU } from '../data/level1/dialogue';
import { NURSE_EVENTS } from '../data/level1/nurseEvents';
import { OBJECT_MAP, type InteractionRule } from '../data/level1/objects';
import { OBJECTIVES } from '../data/level1/objectives';
import { PR_SLOTS } from '../data/level1/puzzle';
import { evaluatePuzzle, type Hypothesis, type Placements } from '../engines/puzzle/problemRepresentation';
import { buildLevel1Report } from '../engines/assessment/level1Report';
import type { LevelReport, TeacherWeights } from '../engines/assessment/scoring';
import { hintLimit, REASONING_UNLOCK_CLUES } from '../config/modes';
import { initialLevel1, type Level1State } from './types';
import { useUI } from './uiStore';
import { sfx } from '../audio/audioEngine';

export type Quality = 'low' | 'medium' | 'high';
export interface Settings { master: number; ambience: number; sfx: number; quality: Quality; reducedMotion: boolean }

interface GameStore {
  screen: Screen;
  profile: PlayerProfile | null;
  settings: Settings;
  weights: TeacherWeights;
  level1: Level1State;
  reports: Record<string, LevelReport>;
  completedLevels: string[];

  setScreen: (s: Screen) => void;
  newGame: (p: PlayerProfile) => void;
  continueGame: () => void;
  resetAll: () => void;
  updateSettings: (p: Partial<Settings>) => void;
  setWeights: (w: TeacherWeights) => void;

  startLevel: () => void;
  tick: (ms: number) => void;
  setViewpoint: (v: string) => void;
  interact: (objectId: string) => InteractionRule | null;
  ask: (optionId: string) => void;
  chooseNurse: (eventId: string, optionId: string) => void;
  dismissNurseOutcome: () => void;
  useHint: (objectiveId: string) => { tier: number; text: string } | null;
  setPlacements: (p: Placements) => void;
  setHypothesis: (h: Hypothesis) => void;
  submitPuzzle: () => void;
  assistPuzzle: () => void;
  ackTimeUp: () => void;
  exitLevel: () => void;
}

const DEFAULT_SETTINGS: Settings = { master: 0.7, ambience: 0.6, sfx: 0.8, quality: 'medium', reducedMotion: false };

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      /** 更新 level1 並寫入事件 */
      const patch = (fn: (s: Level1State) => Partial<Level1State>) => set((st) => ({ level1: { ...st.level1, ...fn(st.level1) } }));
      const log = (type: string, ref?: string, detail?: string) =>
        patch((s) => ({ events: [...s.events, { t: s.elapsedMs, type, ref, detail }] }));

      const applyEffects = (e: Effects | undefined) => {
        if (!e) return;
        const mode = get().profile?.mode;
        const s = get().level1;
        const newClues = (e.clues ?? []).filter((c) => !s.clues.some((x) => x.id === c));
        patch((s) => ({
          clues: [...s.clues, ...newClues.map((id) => ({ id, acquiredAt: s.elapsedMs, interpreted: false }))],
          flags: [...new Set([...s.flags, ...(e.flags ?? [])])],
          trust: s.trust + (e.trust ?? 0),
          emotion: e.emotion ?? s.emotion,
        }));
        for (const c of newClues) {
          log('clue', c);
          const def = CLUE_MAP[c];
          if (def) {
            sfx('clue');
            useUI.getState().toast(mode === 'assessment' ? `已記錄：${def.title}` : `${def.narrative ? '劇情線索' : '取得線索'}：${def.title}`, 'clue');
          }
        }
        postUpdate();
      };

      /** 檢查推理板解鎖與團隊事件觸發（案例狀態機） */
      const postUpdate = () => {
        const s = get().level1;
        const clinical = s.clues.filter((c) => !CLUE_MAP[c.id]?.narrative).length;
        if (!s.flags.includes('reasoning_unlocked') && clinical >= REASONING_UNLOCK_CLUES && s.clues.some((c) => c.id === 'cl_triage')) {
          patch((s) => ({ flags: [...s.flags, 'reasoning_unlocked'] }));
          log('unlock', 'reasoning_board');
          sfx('unlock');
          useUI.getState().toast('臨床推理板已解鎖：可至工作站或下方面板開啟', 'success');
        }
        const s2 = get().level1;
        if (!s2.activeNurse && !s2.lastNurseOutcome) {
          const ctx = toCtx(s2);
          const ev = NURSE_EVENTS.find((n) => !s2.nurseDone.includes(n.id) && evaluateCondition(n.trigger, ctx));
          if (ev) {
            patch(() => ({ activeNurse: ev.id }));
            log('nurse_event', ev.id);
            sfx('alert');
          }
        }
      };

      return {
        screen: 'home', profile: null, settings: DEFAULT_SETTINGS,
        weights: { domains: {}, items: {} }, level1: initialLevel1(), reports: {}, completedLevels: [],

        setScreen: (screen) => set({ screen }),
        newGame: (profile) => set({ profile, level1: initialLevel1(), screen: 'briefing' }),
        continueGame: () => {
          const { level1, profile } = get();
          if (!profile) return;
          set({ screen: level1.status === 'completed' ? 'report' : level1.status === 'in_progress' ? 'level' : 'briefing' });
        },
        resetAll: () => { useUI.getState().closeAll(); set({ screen: 'home', profile: null, level1: initialLevel1(), reports: {}, completedLevels: [] }); },
        updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
        setWeights: (weights) => set({ weights }),

        startLevel: () => {
          if (get().level1.status === 'not_started') {
            patch(() => ({ status: 'in_progress' }));
            log('level_start', 'L01');
          }
          set({ screen: 'level' });
        },
        tick: (ms) => patch((s) => ({ elapsedMs: s.elapsedMs + ms })),
        setViewpoint: (viewpoint) => patch(() => ({ viewpoint })),

        interact: (objectId) => {
          const obj = OBJECT_MAP[objectId];
          if (!obj) return null;
          const s = get().level1;
          const rule = obj.rules.find((r) => evaluateCondition(r.when, toCtx(s)));
          if (!rule) return null;
          patch((s) => ({ inspected: s.inspected.includes(objectId) ? s.inspected : [...s.inspected, objectId], viewpoint: obj.viewpoint }));
          log('inspect', objectId);
          if (objectId === 'patient' && !s.patientContacted) {
            patch((s) => ({ patientContacted: true, firstPatientContactBeforeHygiene: !s.flags.includes('hand_hygiene') }));
          }
          if (objectId === 'sanitizer') sfx('sanitize');
          applyEffects(rule.effects);
          return rule;
        },

        ask: (optionId) => {
          const opt = DIALOGUE_MAP[optionId];
          if (!opt) return;
          const s = get().level1;
          const ctx = toCtx(s);
          const repeat = s.asked.includes(optionId);
          const lines: Level1State['transcript'] = [{ speaker: 'doctor', text: opt.label, t: s.elapsedMs }];
          if (repeat) {
            lines.push({ speaker: 'patient', text: opt.repeatText ?? '（病人有點疑惑）剛剛不是說過了嗎……', t: s.elapsedMs });
            patch((s) => ({ transcript: [...s.transcript, ...lines] }));
            log('ask_repeat', optionId);
            return;
          }
          const resp = opt.responses.find((r) => evaluateCondition(r.when, ctx)) ?? opt.responses[opt.responses.length - 1];
          let text = resp.text;
          const extraFlags: string[] = [];
          if (opt.topic !== 'opening' && !s.flags.includes('introduced') && !s.flags.includes('asked_who')) {
            text = `${WHO_ARE_YOU}\n${text}`;
            extraFlags.push('asked_who');
          }
          lines.push({ speaker: 'patient', text, stage: resp.stage, t: s.elapsedMs });
          patch((s) => ({ asked: [...s.asked, optionId], transcript: [...s.transcript, ...lines] }));
          log('ask', optionId);
          applyEffects({ ...resp.effects, flags: [...(resp.effects?.flags ?? []), ...extraFlags] });
        },

        chooseNurse: (eventId, optionId) => {
          const ev = NURSE_EVENTS.find((n) => n.id === eventId);
          const opt = ev?.options.find((o) => o.id === optionId);
          if (!ev || !opt) return;
          const s = get().level1;
          const out = opt.outcomes.find((o) => evaluateCondition(o.when, toCtx(s))) ?? opt.outcomes[opt.outcomes.length - 1];
          const t = s.elapsedMs;
          patch((s) => ({
            activeNurse: null, nurseDone: [...s.nurseDone, eventId],
            decisions: [...s.decisions, { eventId, title: ev.title, optionId, label: opt.label, verdict: out.verdict, teaching: out.teaching, t }],
            lastNurseOutcome: { eventId, nurse: out.nurse, patient: out.patient, verdict: out.verdict, teaching: out.teaching },
            transcript: [...s.transcript, { speaker: 'nurse', text: ev.prompt, t }, { speaker: 'doctor', text: opt.label, t }, { speaker: 'nurse', text: out.nurse, t },
              ...(out.patient ? [{ speaker: 'patient' as const, text: out.patient, t }] : [])],
          }));
          log('decision', eventId, `${ev.title} → ${optionId} (${out.verdict})`);
          applyEffects(out.effects);
        },
        dismissNurseOutcome: () => { patch(() => ({ lastNurseOutcome: null })); postUpdate(); },

        useHint: (objectiveId) => {
          const { profile, level1 } = get();
          if (!profile) return null;
          const limit = hintLimit(profile.mode, profile.difficulty);
          const obj = OBJECTIVES.find((o) => o.id === objectiveId);
          if (!obj) return null;
          const used = level1.hints.filter((h) => h.objectiveId === objectiveId).length;
          if (used >= 3) return { tier: 3, text: obj.hints[2] };
          if (limit !== null && level1.hints.length >= limit) return null;
          const tier = used + 1;
          patch((s) => ({ hints: [...s.hints, { objectiveId, tier, t: s.elapsedMs }] }));
          log('hint', objectiveId, `tier ${tier}`);
          return { tier, text: obj.hints[tier - 1] };
        },

        setPlacements: (placements) => patch((s) => ({
          puzzle: { ...s.puzzle, placements },
          clues: s.clues.map((c) => ({ ...c, interpreted: Object.values(placements).some((ids) => ids.includes(c.id)) })),
        })),
        setHypothesis: (hypothesis) => patch((s) => ({ puzzle: { ...s.puzzle, hypothesis } })),

        submitPuzzle: () => {
          const { level1: s, profile } = get();
          const result = evaluatePuzzle(PR_SLOTS, s.puzzle.placements, s.puzzle.hypothesis, CLUE_MAP);
          const finalize = result.passed || profile?.mode === 'assessment';
          patch((s) => ({ puzzle: { ...s.puzzle, attempts: s.puzzle.attempts + 1, result } }));
          log('puzzle_submit', 'problem_representation', `${result.slotsCorrect}/${PR_SLOTS.length} 欄位、主診斷${result.leadingCorrect ? '✓' : '✗'}、危急鑑別${result.mustNotMissCorrect ? '✓' : '✗'}`);
          if (finalize) {
            applyEffects({ flags: ['puzzle_solved'] });
            sfx('unlock');
            useUI.getState().toast(profile?.mode === 'assessment' ? '問題表述已上傳。門禁系統已解除。' : '工作站解鎖！門禁系統已恢復。', 'success');
          } else sfx('error');
        },
        assistPuzzle: () => {
          patch((s) => ({ puzzle: { ...s.puzzle, assisted: true } }));
          log('puzzle_assist', 'problem_representation');
          applyEffects({ flags: ['puzzle_solved'] });
        },
        ackTimeUp: () => { patch(() => ({ timeUpAcknowledged: true })); log('time_up'); },

        exitLevel: () => {
          const st = get();
          if (!st.profile) return;
          patch((s) => ({ status: 'completed', completedAtMs: s.elapsedMs, flags: [...new Set([...s.flags, 'level_exit'])] }));
          log('level_complete', 'L01');
          const report = buildLevel1Report(get().level1, st.profile, st.weights);
          set((s) => ({ reports: { ...s.reports, L01: report }, completedLevels: [...new Set([...s.completedLevels, 'L01'])], screen: 'levelClear' }));
        },
      };
    },
    {
      name: 'osce-escape-save-v1',
      version: 1,
      partialize: (s) => ({ profile: s.profile, settings: s.settings, weights: s.weights, level1: s.level1, reports: s.reports, completedLevels: s.completedLevels }),
    },
  ),
);

export const hasSave = () => {
  const s = useGame.getState();
  return !!s.profile && s.level1.status !== 'not_started';
};

export const clinicalClueTotal = CLUES.filter((c) => !c.narrative).length;
export type { Domain };
