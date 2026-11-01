import { EffectComposer, N8AO, Bloom, Vignette, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import type { Quality } from '../../store/gameStore';

/** 後製：環境光遮蔽 (AO)、柔和泛光、暗角；依畫質設定調整 */
export function PostFX({ quality }: { quality: Quality }) {
  if (quality === 'low') return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO halfRes={false} aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} quality={quality === 'high' ? 'high' : 'medium'} />
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
      <Vignette offset={0.25} darkness={0.62} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {quality === 'high' ? <SMAA /> : <></>}
    </EffectComposer>
  );
}

export const QUALITY_DPR: Record<Quality, [number, number]> = { low: [0.75, 1], medium: [1, 1.5], high: [1, 2] };
