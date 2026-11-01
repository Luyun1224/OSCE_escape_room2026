import type { DomainScore } from '../../engines/assessment/scoring';

/** 六大能力雷達圖（本關未評估之面向以虛線標示） */
export function RadarChart({ domains, size = 300 }: { domains: DomainScore[]; size?: number }) {
  const c = size / 2, R = size / 2 - 46, n = domains.length;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r] as const;
  };
  const poly = domains.map((d, i) => pt(i, ((d.pct ?? 0) / 100) * R).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[340px]" role="img" aria-label="六大能力雷達圖">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={domains.map((_, i) => pt(i, R * k).join(',')).join(' ')} fill="none" stroke="rgba(244,247,250,.12)" />
      ))}
      {domains.map((d, i) => { const [x, y] = pt(i, R); return <line key={d.domain} x1={c} y1={c} x2={x} y2={y} stroke="rgba(244,247,250,.12)" strokeDasharray={d.pct === null ? '3 3' : undefined} />; })}
      <polygon points={poly} fill="rgba(19,184,176,.28)" stroke="#13B8B0" strokeWidth={2} />
      {domains.map((d, i) => {
        const [x, y] = pt(i, ((d.pct ?? 0) / 100) * R);
        const [lx, ly] = pt(i, R + 26);
        return (
          <g key={d.domain}>
            {d.pct !== null && <circle cx={x} cy={y} r={3.5} fill="#5fe0d8" />}
            <text x={lx} y={ly - 4} textAnchor="middle" fontSize="11" fill={d.pct === null ? '#64748b' : '#F4F7FA'}>{d.label}</text>
            <text x={lx} y={ly + 10} textAnchor="middle" fontSize="11" fontWeight="700" fill={d.pct === null ? '#64748b' : '#13B8B0'}>{d.pct === null ? '本關未評' : `${d.pct}%`}</text>
          </g>
        );
      })}
    </svg>
  );
}
