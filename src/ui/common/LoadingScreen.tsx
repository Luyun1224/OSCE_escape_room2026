export function LoadingScreen({ label = '載入臨床場景中…' }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070d14]">
      <svg width="160" height="40" viewBox="0 0 160 40" className="mb-4">
        <path d="M0 20h40l8-14 12 28 10-22 6 8h84" fill="none" stroke="#13B8B0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="220" strokeDashoffset="220">
          <animate attributeName="stroke-dashoffset" from="220" to="-220" dur="1.6s" repeatCount="indefinite" />
        </path>
      </svg>
      <p className="text-sm tracking-widest text-slate-400">{label}</p>
    </div>
  );
}
