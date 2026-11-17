import { FaCamera, FaCheckCircle, FaThermometerHalf } from 'react-icons/fa'
import { LuBanana } from 'react-icons/lu'

export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md select-none overflow-visible px-6 py-6">
      {/* glow blob + orbit ring (kept inside bounds) */}
      <div className="blob absolute inset-4 rounded-full bg-brand-500/20 dark:bg-brand-500/15" />
      <div className="orbit-ring absolute inset-0 rounded-full border-2 border-dashed border-brand-500/30">
        <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-brand-500 shadow-lg shadow-brand-500/50" />
        <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-green-500" />
      </div>

      {/* main scanner card */}
      <div className="card anim-float relative overflow-hidden !p-4 shadow-xl shadow-brand-500/10">
        <div className="flex items-center gap-2">
          <span className="live-dot inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          <p className="text-xs font-bold tracking-widest text-black dark:text-white">LIVE ANALYSIS</p>
          <span className="ml-auto rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs text-brand-600 dark:bg-brand-500/10">BT-000042</span>
        </div>

        {/* banana scan frame */}
        <div className="relative mt-3 overflow-hidden rounded-xl bg-brand-50 dark:bg-brand-500/10" style={{ backgroundImage: 'radial-gradient(circle, rgba(249,115,22,0.12) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
          <span className="absolute left-2 top-2 h-5 w-5 rounded-tl-lg border-l-[3px] border-t-[3px] border-brand-500" />
          <span className="absolute right-2 top-2 h-5 w-5 rounded-tr-lg border-r-[3px] border-t-[3px] border-brand-500" />
          <span className="absolute bottom-2 left-2 h-5 w-5 rounded-bl-lg border-b-[3px] border-l-[3px] border-brand-500" />
          <span className="absolute bottom-2 right-2 h-5 w-5 rounded-br-lg border-b-[3px] border-r-[3px] border-brand-500" />
          <div className="scan-line" />
          <div className="flex items-center justify-center py-2">
            <LuBanana className="h-32 w-32 text-amber-400 drop-shadow-[0_10px_16px_rgba(249,115,22,0.45)]" strokeWidth={1.4} />
          </div>
        </div>

        {/* cycling stage pills */}
        <div className="mt-3 flex justify-between gap-1">
          {['S1', 'S2', 'S3', 'S4', 'S5'].map((s, i) => (
            <span key={s} style={{ '--i': i } as React.CSSProperties}
              className="stage-pill flex-1 rounded-lg border border-brand-500/40 py-1 text-center text-xs font-bold text-black dark:border-brand-500/40 dark:text-white">
              {s}
            </span>
          ))}
        </div>

        {/* probability bars */}
        <div className="mt-3 space-y-2 text-xs">
          <div>
            <div className="mb-1 flex justify-between font-semibold"><span>Natural</span><span className="text-green-500">92.4%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-500/10">
              <div className="bar-fill h-full rounded-full bg-green-500" style={{ '--w': '92.4%' } as React.CSSProperties} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between font-semibold"><span>Adulterated</span><span className="text-red-500">7.6%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-500/10">
              <div className="bar-fill h-full rounded-full bg-red-500" style={{ '--w': '7.6%' } as React.CSSProperties} />
            </div>
          </div>
        </div>
      </div>

      {/* floating chips (inside padding bounds) */}
      <div className="anim-float anim-float-1 absolute right-2 top-0 flex items-center gap-1.5 rounded-xl border border-brand-500/25 bg-white px-3 py-1.5 text-xs font-bold shadow-lg shadow-brand-500/10 dark:border-brand-500/40 dark:bg-black">
        <FaThermometerHalf className="text-brand-500" /> Thermal <span className="text-brand-500">24.6°C</span>
      </div>
      <div className="anim-float anim-float-2 absolute left-2 top-1/3 flex items-center gap-1.5 rounded-xl border border-brand-500/25 bg-white px-3 py-1.5 text-xs font-bold shadow-lg shadow-brand-500/10 dark:border-brand-500/40 dark:bg-black">
        <FaCamera className="text-brand-500" /> RGB <FaCheckCircle className="text-green-500" />
      </div>
      <div className="anim-float anim-float-3 absolute bottom-0 right-6 flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-brand-500/40">
        <LuBanana /> Stage 4 · Fully Yellow
      </div>
    </div>
  )
}
