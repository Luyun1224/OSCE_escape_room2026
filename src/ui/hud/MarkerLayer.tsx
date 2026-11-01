import { useMarkers, markerEls } from '../../engines/scene/markers';
import { useUI } from '../../store/uiStore';
import { useGame } from '../../store/gameStore';

/** 3D 標記的 DOM 覆蓋層（熱點與待補模型標籤） */
export function MarkerLayer() {
  const list = useMarkers((s) => s.list);
  const hovered = useUI((s) => s.hovered);
  const reveal = useUI((s) => s.reveal);
  const difficulty = useGame((s) => s.profile?.difficulty ?? 'basic');
  const inspected = useGame((s) => s.level1.inspected);
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {list.map((m) => {
        const ref = (el: HTMLDivElement | null) => { if (el) markerEls.set(m.id, el); else markerEls.delete(m.id); };
        if (m.kind === 'pending') {
          if (!m.label) return null;
          return (
            <div key={m.id} ref={ref} className="absolute left-0 top-0" style={{ visibility: 'hidden' }}>
              <div className="pending-tag -translate-x-1/2 -translate-y-full"><span className="pending-dot" />待補 3D 模型<div className="pending-name">{m.label}</div></div>
            </div>
          );
        }
        const hover = hovered === m.id;
        const done = inspected.includes(m.id);
        const show = hover || reveal || difficulty === 'basic' || (difficulty === 'standard' && !done);
        const faint = difficulty === 'standard' && !hover && !reveal;
        return (
          <div key={m.id} ref={ref} className="absolute left-0 top-0" style={{ visibility: 'hidden' }}>
            {show && (
              <div className={`hotspot ${hover ? 'is-hover' : ''} ${done ? 'is-done' : ''} ${faint ? 'faint' : ''}`}>
                <span className="hotspot-ring" />
                {(hover || reveal) && <span className="hotspot-label">{m.label}{done ? ' ✓' : ''}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
