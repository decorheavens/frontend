type AdminMetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function AdminMetricCard({ label, value, hint }: AdminMetricCardProps) {
  return (
    <div className="rounded-[1.6rem] border border-white/8 bg-[#1b2028] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-white/55">{hint}</p> : null}
    </div>
  );
}
