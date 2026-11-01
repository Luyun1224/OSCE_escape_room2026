import { motion } from 'motion/react';
import { useUI } from '../../store/uiStore';
import { DOCUMENTS } from '../../data/level1/documents';
import { MONITOR_VITALS } from '../../engines/case/chestPainCase';

export function DocumentPanel() {
  const docId = useUI((s) => s.docId);
  const close = () => useUI.getState().openDoc(null);
  if (!docId) return null;
  const doc = DOCUMENTS[docId];
  if (!doc) return null;
  const theme = doc.kind === 'paper' ? 'paper-doc' : doc.kind === 'board' ? 'board-doc' : 'bg-[#0b1520] text-paper';
  return (
    <div className="absolute inset-0 z-[38] flex items-center justify-start bg-black/30 pl-[6vw]" onClick={close}>
      <motion.div initial={{ opacity: 0, y: 20, rotate: doc.kind === 'paper' ? -1.5 : 0 }} animate={{ opacity: 1, y: 0, rotate: doc.kind === 'paper' ? -0.6 : 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[78vh] w-[min(560px,90vw)] overflow-y-auto rounded-xl shadow-2xl ${theme} ${doc.kind === 'screen' || doc.kind === 'monitor' ? 'scanlines border border-teal/30' : ''}`}>
        <div className={`flex items-start justify-between px-6 pb-3 pt-5 ${doc.kind === 'paper' ? 'border-b-4 border-crit' : 'border-b border-current/10'}`}>
          <div>
            <h3 className="text-xl font-bold">{doc.title}</h3>
            {doc.subtitle && <p className="text-sm opacity-70">{doc.subtitle}</p>}
          </div>
          <button onClick={close} className="rounded px-2 opacity-60 hover:opacity-100">✕</button>
        </div>
        <div className="space-y-4 px-6 py-4">
          {doc.kind === 'monitor' && (
            <div className="grid grid-cols-2 gap-3 font-mono">
              {[['HR', MONITOR_VITALS.hr, 'bpm', 'text-ok'], ['SpO₂', MONITOR_VITALS.spo2, '%', 'text-sky-300'], ['NIBP', `${MONITOR_VITALS.sys}/${MONITOR_VITALS.dia}`, 'mmHg', 'text-paper'], ['RR', MONITOR_VITALS.rr, '/min', 'text-warn']].map(([k, v, u, c]) => (
                <div key={k as string} className="rounded-lg bg-black/50 p-3">
                  <div className="text-xs opacity-60">{k}</div>
                  <div className={`text-3xl font-bold ${c}`}>{v}<span className="ml-1 text-xs opacity-60">{u}</span></div>
                </div>
              ))}
            </div>
          )}
          {doc.sections.map((sec, i) => (
            <section key={i}>
              {sec.heading && <h4 className={`mb-1.5 text-sm font-bold ${doc.kind === 'paper' || doc.kind === 'board' ? 'text-[#13706b]' : 'text-teal'}`}>{sec.heading}</h4>}
              {sec.rows && (
                <table className="w-full text-sm">
                  <tbody>{sec.rows.map(([k, v]) => (
                    <tr key={k} className="border-b border-current/10"><td className="w-28 py-1 opacity-70">{k}</td><td className="py-1 font-medium">{v}</td></tr>
                  ))}</tbody>
                </table>
              )}
              {sec.text && <p className={`whitespace-pre-line text-sm leading-relaxed ${doc.kind === 'board' ? 'font-semibold text-[#1f4fa8]' : ''}`}>{sec.text}</p>}
            </section>
          ))}
          {doc.footnote && <p className="border-t border-current/10 pt-3 text-xs opacity-60">{doc.footnote}</p>}
        </div>
      </motion.div>
    </div>
  );
}

export function MessagePanel() {
  const msg = useUI((s) => s.message);
  if (!msg) return null;
  return (
    <div className="absolute inset-x-0 bottom-28 z-[38] flex justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass flex max-w-xl items-start gap-3 rounded-xl px-5 py-4">
        <span className="text-teal">ℹ</span>
        <p className="flex-1 text-sm leading-relaxed">{msg}</p>
        <button className="btn btn-ghost !px-3 !py-1 text-xs" onClick={() => useUI.getState().showMessage(null)}>了解</button>
      </motion.div>
    </div>
  );
}
