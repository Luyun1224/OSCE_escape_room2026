import type { ReactNode } from 'react';
import { motion } from 'motion/react';

export function Modal({ title, subtitle, onClose, children, width = 'max-w-2xl', footer }: {
  title: string; subtitle?: string; onClose?: () => void; children: ReactNode; width?: string; footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }}
        className={`glass relative flex max-h-[88vh] w-full ${width} flex-col overflow-hidden rounded-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold tracking-wide">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
          </div>
          {onClose && <button className="rounded-md px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="關閉">✕</button>}
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-white/10 px-6 py-3">{footer}</div>}
      </motion.div>
    </div>
  );
}

export function ReviewBadge({ className = '' }: { className?: string }) {
  return <span className={`chip border-warn/60 text-warn ${className}`} title="所有臨床內容需經臨床教師審核後方可正式教學使用">⚠ 臨床內容待教師審核</span>;
}
