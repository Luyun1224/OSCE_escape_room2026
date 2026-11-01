import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useGame } from '../../store/gameStore';
import { useUI } from '../../store/uiStore';
import { buildLevel1Report, OBJECTIVE_TITLE } from '../../engines/assessment/level1Report';
import { exportCSV, exportJSON } from '../../engines/assessment/export';
import { RadarChart } from './RadarChart';
import { fmtTime } from '../hud/useLevel';
import { MODE_INFO, ROLE_LABEL } from '../../config/modes';
import { DOMAIN_LABEL } from '../../types/game';
import { DX_ANSWER, MODEL_PR } from '../../data/level1/puzzle';
import { ReviewBadge } from '../common/Modal';

const VERDICT_STYLE: Record<string, string> = { safe: 'text-ok border-ok/50', suboptimal: 'text-warn border-warn/50', unsafe: 'text-crit border-crit/50', neutral: 'text-slate-400 border-white/20' };
const VERDICT_LABEL: Record<string, string> = { safe: '安全', suboptimal: '次佳', unsafe: '風險', neutral: '—' };

export default function ReportScreen() {
  const level1 = useGame((s) => s.level1);
  const profile = useGame((s) => s.profile);
  const weights = useGame((s) => s.weights);
  const setScreen = useGame((s) => s.setScreen);
  const newGame = useGame((s) => s.newGame);
  const report = useMemo(() => (profile ? buildLevel1Report(level1, profile, weights) : null), [level1, profile, weights]);
  const [reveal, setReveal] = useState(profile?.mode !== 'assessment');
  if (!report || !profile) return null;

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#16263a_0%,#0b1420_50%,#070d14_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* 標頭 */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.35em] text-teal">LEARNING REPORT · LEVEL 01</div>
            <h1 className="mt-1 text-3xl font-bold">學習成果報告｜消失的病歷</h1>
            <p className="mt-1 text-sm text-slate-400">
              {profile.nickname}・{ROLE_LABEL[profile.role]}・{MODE_INFO[profile.mode].title}・用時 {fmtTime(report.durationMs)}
              {report.timeLimitMs && `／時限 ${fmtTime(report.timeLimitMs)}`}{report.overtime && <span className="ml-1 text-warn">（超時完成）</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost text-sm" onClick={() => exportJSON(report)}>⇩ 匯出 JSON</button>
            <button className="btn btn-ghost text-sm" onClick={() => exportCSV(report)}>⇩ 匯出 CSV</button>
            <button className="btn btn-ghost text-sm" onClick={() => useUI.getState().setSettings(true)}>⚙ 教師權重</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400"><ReviewBadge /><span>{report.disclaimer}</span></div>

        {/* 總覽 */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[340px_1fr]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col items-center rounded-2xl p-5">
            <div className="text-sm text-slate-400">本關加權表現</div>
            <div className="text-6xl font-black text-teal">{report.overallPct}<span className="text-2xl">%</span></div>
            <RadarChart domains={report.domains} />
          </motion.div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="六大能力表現">
              <div className="space-y-2.5">
                {report.domains.map((d) => (
                  <div key={d.domain}>
                    <div className="flex justify-between text-sm"><span>{d.label}</span><span className="font-mono text-slate-300">{d.pct === null ? '本關未評' : `${d.pct}%`}<span className="ml-2 text-[10px] text-slate-500">權重 {d.weight}</span></span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">{d.pct !== null && <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ duration: 1 }} className={`h-full ${d.pct >= 80 ? 'bg-teal' : d.pct >= 60 ? 'bg-warn' : 'bg-crit'}`} />}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="關卡概況">
              <Stat k="關鍵線索" v={`${report.keyCluesCollected} / ${report.keyCluesTotal}`} />
              <Stat k="臨床線索總數" v={String(report.cluesCollected)} />
              <Stat k="問題表述提交次數" v={`${report.puzzle.attempts}${report.puzzle.assisted ? '（輔助完成）' : ''}`} />
              <Stat k="提示使用" v={`${report.hints.total} 次`} />
              <div className="mt-1 text-xs text-slate-500">{Object.entries(report.hints.byObjective).map(([k, v]) => `${OBJECTIVE_TITLE[k] ?? k} ×${v}`).join('、') || '未使用提示'}</div>
              <div className="mt-2 text-xs text-slate-500">提示使用不等同臨床能力不足；用時僅供參考，不作為能力指標。</div>
              <div className="mt-3 border-t border-white/10 pt-3 text-sm">
                <div className="mb-1 text-slate-400">關卡完成狀況</div>
                <div className="flex flex-wrap gap-1.5">
                  {['L01', 'L02', 'L03', 'L04', 'L05', 'FINAL'].map((l) => <span key={l} className={`chip ${l === 'L01' ? 'border-teal text-teal' : 'text-slate-500'}`}>{l === 'L01' ? '✓ ' : '🔒 '}{l}</span>)}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 安全與錯誤 */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card title="病人安全行為">
            {report.safetyBehaviors.length ? <ul className="space-y-1 text-sm">{report.safetyBehaviors.map((s) => <li key={s}><span className="text-ok">✓</span> {s}</li>)}</ul> : <p className="text-sm text-slate-500">無</p>}
            {report.criticalMissed.length > 0 && (
              <div className="mt-3 rounded-lg border border-crit/40 bg-crit/10 p-3 text-sm">
                <div className="font-semibold text-crit">關鍵安全項目未達成</div>
                <ul className="mt-1 list-disc pl-5">{report.criticalMissed.map((c) => <li key={c.id}>{c.label}{reveal && <span className="text-slate-300">：{c.feedback}</span>}</li>)}</ul>
              </div>
            )}
          </Card>
          <Card title="關鍵錯誤分析">
            {report.errors.length ? <ul className="space-y-1.5 text-sm">{report.errors.map((e) => <li key={e} className="text-slate-200">{e}</li>)}</ul> : <p className="text-sm text-ok">未記錄到錯誤決策。</p>}
          </Card>
        </div>

        {/* 決策歷程 */}
        <Card title="臨床決策歷程" className="mt-4">
          {report.decisions.length === 0 ? <p className="text-sm text-slate-500">無決策紀錄</p> : (
            <ol className="relative space-y-3 border-l border-white/15 pl-5">
              {report.decisions.map((d, i) => (
                <li key={i}>
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-teal" />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-slate-500">{fmtTime(d.t)}</span>
                    <span className="font-semibold">{d.title}</span>
                    {reveal && <span className={`chip ${VERDICT_STYLE[d.verdict]}`}>{VERDICT_LABEL[d.verdict]}</span>}
                  </div>
                  <div className="text-sm text-slate-300">→ {d.label}</div>
                  {reveal && d.teaching && <div className="mt-1 text-xs text-slate-400">{d.teaching}</div>}
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* 評核項目 */}
        <Card title="評核項目明細（可觀察指標）" className="mt-4">
          {!reveal ? (
            <div className="flex flex-col items-center py-6 text-center">
              <p className="text-sm text-slate-300">OSCE 模擬模式：評核已結束。你可以開啟完整解析，查看各項目達成情形與學習建議。</p>
              <button className="btn btn-primary mt-3" onClick={() => setReveal(true)}>查看完整解析</button>
            </div>
          ) : (
            <div className="grid gap-x-6 md:grid-cols-2">
              {(Object.keys(DOMAIN_LABEL) as (keyof typeof DOMAIN_LABEL)[]).filter((d) => report.items.some((i) => i.domain === d)).map((d) => (
                <div key={d} className="mb-4">
                  <div className="mb-1 text-sm font-semibold text-teal">{DOMAIN_LABEL[d]}</div>
                  <ul className="space-y-1">
                    {report.items.filter((i) => i.domain === d).map((i) => (
                      <li key={i.id} className="text-sm">
                        <span className={i.achieved ? 'text-ok' : 'text-crit'}>{i.achieved ? '✓' : '✗'}</span> {i.label}
                        <span className="ml-1 text-[10px] text-slate-500">{i.id}・權重 {i.weight}{i.critical ? '・關鍵' : ''}</span>
                        {!i.achieved && <div className="pl-4 text-xs text-slate-400">{i.feedback}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>

        {reveal && (
          <Card title="問題表述示範與解析" className="mt-4">
            <p className="text-sm leading-relaxed">{MODEL_PR}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{DX_ANSWER.explanation}</p>
          </Card>
        )}

        {/* 推理路徑 */}
        <Card title="推理路徑（行為序列）" className="mt-4">
          <div className="scroll-thin max-h-60 overflow-y-auto font-mono text-xs leading-6 text-slate-300">
            {report.reasoningPath.map((r, i) => <div key={i}><span className="text-slate-500">{fmtTime(r.t)}</span>　{r.label}</div>)}
          </div>
        </Card>

        {/* 建議 */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card title="推薦補強方向">
            <ul className="space-y-1.5 text-sm">{report.recommendations.map((r) => <li key={r}>▸ {r}</li>)}</ul>
          </Card>
          <Card title="適合重新挑戰">
            <p className="text-sm text-slate-300">
              {report.overallPct < 80 ? '建議以「故事探索模式」重新挑戰 LEVEL 01，專注於未達成的項目。' : '建議以「極限逃脫」或「OSCE 模擬模式」重新挑戰 LEVEL 01，練習在時間壓力下維持完整性。'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-primary text-sm" onClick={() => newGame({ ...profile, mode: report.overallPct < 80 ? 'story' : 'challenge' })}>重新挑戰 LEVEL 01</button>
              <button className="btn btn-ghost text-sm" onClick={() => setScreen('setup')}>變更模式／難度</button>
              <button className="btn btn-ghost text-sm" onClick={() => setScreen('home')}>返回首頁</button>
            </div>
          </Card>
        </div>
        <p className="mt-8 text-center text-xs text-slate-600">報告資料僅存於此瀏覽器。正式評量資料請勿上傳至公開網站。</p>
      </div>
    </div>
  );
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-2xl p-5 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold tracking-wider text-slate-300">{title}</h3>
      {children}
    </section>
  );
}
function Stat({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b border-white/5 py-1 text-sm"><span className="text-slate-400">{k}</span><span className="font-semibold">{v}</span></div>;
}
