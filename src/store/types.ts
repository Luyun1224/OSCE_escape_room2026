import type { CollectedClue, GameEvent } from '../types/game';
import type { PatientEmotion } from '../engines/narrative/types';
import type { Hypothesis, Placements, PuzzleResult } from '../engines/puzzle/problemRepresentation';
import type { DecisionRecord } from '../engines/assessment/scoring';

export interface TranscriptLine { speaker: 'doctor' | 'patient' | 'nurse' | 'system'; text: string; stage?: string; t: number }

export interface Level1State {
  status: 'not_started' | 'in_progress' | 'completed';
  elapsedMs: number;
  asked: string[];
  inspected: string[];
  flags: string[];
  trust: number;
  emotion: PatientEmotion;
  clues: CollectedClue[];
  events: GameEvent[];
  hints: { objectiveId: string; tier: number; t: number }[];
  decisions: DecisionRecord[];
  nurseDone: string[];
  activeNurse: string | null;
  lastNurseOutcome: { eventId: string; nurse: string; patient?: string; verdict: string; teaching: string } | null;
  transcript: TranscriptLine[];
  puzzle: { attempts: number; placements: Placements; hypothesis: Hypothesis; result?: PuzzleResult; assisted: boolean };
  patientContacted: boolean;
  firstPatientContactBeforeHygiene: boolean;
  timeUpAcknowledged: boolean;
  viewpoint: string;
  completedAtMs?: number;
}

export const initialLevel1 = (): Level1State => ({
  status: 'not_started', elapsedMs: 0, asked: [], inspected: [], flags: [], trust: 1, emotion: 'pained',
  clues: [], events: [], hints: [], decisions: [], nurseDone: [], activeNurse: null, lastNurseOutcome: null,
  transcript: [], puzzle: { attempts: 0, placements: {}, hypothesis: { mustNotMiss: [] }, assisted: false },
  patientContacted: false, firstPatientContactBeforeHygiene: false, timeUpAcknowledged: false, viewpoint: 'overview',
});
