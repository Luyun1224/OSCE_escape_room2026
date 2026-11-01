import { useGame } from '../../store/gameStore';
import { timeLimitMs } from '../../config/modes';

/** 極限逃脫：計時結束不強制中斷，可繼續完成或進入回饋 */
export function TimeUpOverlay() {
  const profile = useGame((s) => s.profile);
  const elapsed = useGame((s) => s.level1.elapsedMs);
  const ack = useGame((s) => s.level1.timeUpAcknowledged);
  const ackTimeUp = useGame((s) => s.ackTimeUp);
  const exitLevel = useGame((s) => s.exitLevel);
  if (!profile) return null;
  const limit = timeLimitMs(profile.mode, profile.difficulty);
  if (limit === null || elapsed < limit || ack) return null;
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70">
      <div className="glass max-w-lg rounded-2xl p-6 text-center">
        <div className="text-xs tracking-[0.3em] text-crit">TIME UP</div>
        <h2 className="mt-2 text-2xl font-bold">計時結束</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          挑戰時間已到。病人的照護不會因計時結束而中斷——你可以繼續完成本關（報告將標記超時），或直接進入學習回饋與補救學習。
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button className="btn btn-primary" onClick={ackTimeUp}>繼續完成照護</button>
          <button className="btn btn-ghost" onClick={() => { ackTimeUp(); exitLevel(); }}>前往學習回饋</button>
        </div>
      </div>
    </div>
  );
}
