import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'motion/react';
import * as THREE from 'three';
import { ExamRoomScene } from '../engines/scene/ExamRoom';
import { PostFX, QUALITY_DPR } from '../engines/scene/PostFX';
import { useGame } from '../store/gameStore';
import { useUI } from '../store/uiStore';
import { setAmbience, unlockAudio } from '../audio/audioEngine';
import { MONITOR_VITALS } from '../engines/case/chestPainCase';
import { HUD } from './hud/HUD';
import { MarkerProjector } from '../engines/scene/markers';
import { MarkerLayer } from './hud/MarkerLayer';
import { DialoguePanel } from './panels/DialoguePanel';
import { DocumentPanel, MessagePanel } from './panels/DocumentPanel';
import { NursePanel } from './panels/NursePanel';
import { DockPanels } from './panels/DockPanels';
import { HintPanel } from './panels/HintPanel';
import { TimeUpOverlay } from './panels/TimeUpOverlay';
import { LoadingScreen } from './common/LoadingScreen';

export default function LevelScreen() {
  const settings = useGame((s) => s.settings);
  const tick = useGame((s) => s.tick);
  const doorOpen = useUI((s) => s.doorOpen);

  useEffect(() => {
    unlockAudio();
    setAmbience('examroom', MONITOR_VITALS.hr);
    const id = setInterval(() => { if (document.visibilityState === 'visible') tick(1000); }, 1000);
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); useUI.getState().setReveal(true); }
      if (e.code === 'Escape') useUI.getState().closeAll();
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') useUI.getState().setReveal(false); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { clearInterval(id); setAmbience(null); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); useUI.getState().closeAll(); useUI.getState().setDoorOpen(false); };
  }, [tick]);

  return (
    <div className="absolute inset-0">
      <Suspense fallback={<LoadingScreen />}>
        <Canvas shadows={settings.quality !== 'low'} dpr={QUALITY_DPR[settings.quality]}
          camera={{ fov: 52, near: 0.05, far: 40, position: [1.9, 1.7, 2.55] }}
          gl={{ antialias: settings.quality !== 'high', toneMapping: settings.quality === 'low' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
          onPointerMissed={() => useUI.getState().setHovered(null)}>
          <ExamRoomScene quality={settings.quality} />
          <MarkerProjector />
          <PostFX quality={settings.quality} />
        </Canvas>
      </Suspense>
      <MarkerLayer />
      <HUD />
      <DockPanels />
      <AnimatePresence>
        <DialoguePanel key="dlg" />
      </AnimatePresence>
      <DocumentPanel />
      <MessagePanel />
      <NursePanel />
      <HintPanel />
      <TimeUpOverlay />
      <AnimatePresence>
        {doorOpen && (
          <motion.div key="door" className="absolute inset-0 z-[60] flex items-center justify-center bg-[#05090e]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6, delay: 0.5 }}>
            <p className="text-lg tracking-[0.4em] text-teal">ACCESS GRANTED</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
