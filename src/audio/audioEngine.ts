/**
 * 程序化音效引擎（Web Audio API）
 * 不依賴外部音檔：環境空調低頻噪音、遠方設備嗡鳴、監視器心跳音、介面音效。
 * 待補素材：真實醫院環境錄音（需授權）可替換 ambience。
 */
type SfxName = 'click' | 'clue' | 'unlock' | 'error' | 'alert' | 'sanitize' | 'door' | 'hover';

let ctx: AudioContext | null = null;
let master: GainNode, ambBus: GainNode, sfxBus: GainNode;
let ambienceNodes: AudioNode[] = [];
let beepTimer: number | null = null;
let vol = { master: 0.7, ambience: 0.6, sfx: 0.8 };

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.connect(ctx.destination);
  ambBus = ctx.createGain(); ambBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  applyVolumes();
  return ctx;
}

function applyVolumes() {
  if (!ctx) return;
  master.gain.value = vol.master;
  ambBus.gain.value = vol.ambience * 0.5;
  sfxBus.gain.value = vol.sfx * 0.6;
}

export function setVolumes(v: { master: number; ambience: number; sfx: number }) { vol = v; applyVolumes(); }

export function unlockAudio() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }

function noiseBuffer(c: AudioContext, seconds = 4) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // brown noise
  return buf;
}

export type AmbienceKind = 'corridor' | 'examroom' | null;

export function setAmbience(kind: AmbienceKind, heartRate = 104) {
  const c = ensure();
  if (!c) return;
  ambienceNodes.forEach((n) => { try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* noop */ } n.disconnect(); });
  ambienceNodes = [];
  if (beepTimer) { clearInterval(beepTimer); beepTimer = null; }
  if (!kind) return;

  // HVAC 低頻噪音
  const src = c.createBufferSource(); src.buffer = noiseBuffer(c); src.loop = true;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'corridor' ? 420 : 300;
  const g = c.createGain(); g.gain.value = 0.35;
  src.connect(lp).connect(g).connect(ambBus); src.start();
  // 日光燈／設備嗡鳴
  const hum = c.createOscillator(); hum.type = 'sine'; hum.frequency.value = 120;
  const hg = c.createGain(); hg.gain.value = 0.012;
  hum.connect(hg).connect(ambBus); hum.start();
  ambienceNodes.push(src, lp, g, hum, hg);

  if (kind === 'examroom') {
    const interval = 60000 / heartRate;
    beepTimer = window.setInterval(() => tone(980, 0.07, 0.05, ambBus, 'sine'), interval);
  } else {
    // 遠方偶發的設備提示音
    beepTimer = window.setInterval(() => { if (Math.random() < 0.35) tone(660 + Math.random() * 200, 0.12, 0.025, ambBus, 'sine'); }, 2600);
  }
}

function tone(freq: number, dur: number, gain: number, bus: AudioNode, type: OscillatorType = 'sine', when = 0, slideTo?: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(bus); o.start(t0); o.stop(t0 + dur + 0.05);
}

export function sfx(name: SfxName) {
  const c = ensure();
  if (!c || c.state !== 'running') return;
  switch (name) {
    case 'click': tone(1200, 0.05, 0.08, sfxBus, 'triangle'); break;
    case 'hover': tone(1800, 0.03, 0.02, sfxBus, 'sine'); break;
    case 'clue': tone(880, 0.12, 0.12, sfxBus, 'sine'); tone(1320, 0.18, 0.1, sfxBus, 'sine', 0.08); break;
    case 'unlock': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 0.1, sfxBus, 'triangle', i * 0.09)); break;
    case 'error': tone(220, 0.25, 0.12, sfxBus, 'square', 0, 160); break;
    case 'alert': tone(740, 0.15, 0.1, sfxBus, 'sine'); tone(740, 0.15, 0.1, sfxBus, 'sine', 0.22); break;
    case 'door': tone(160, 0.6, 0.15, sfxBus, 'sawtooth', 0, 80); tone(1046, 0.3, 0.08, sfxBus, 'sine', 0.1); break;
    case 'sanitize': {
      const s = c.createBufferSource(); s.buffer = noiseBuffer(c, 1);
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
      const g = c.createGain(); g.gain.setValueAtTime(0.25, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
      s.connect(hp).connect(g).connect(sfxBus); s.start(); s.stop(c.currentTime + 0.6); break;
    }
  }
}
