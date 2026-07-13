type DashboardCardProps = { label: string; value: string; change: string; tone: "green" | "blue" | "purple" | "orange" };

const tones = { green: "bg-[#e5faed] text-[#237347]", blue: "bg-[#e9f3ff] text-[#3372ad]", purple: "bg-[#f2edff] text-[#7053a8]", orange: "bg-[#fff2df] text-[#a96921]" };

export function DashboardCard({ label, value, change, tone }: DashboardCardProps) {
  return <article className="rounded-2xl border border-[#dfe5da] bg-white p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-[#607068]">{label}</p><span className={`grid size-9 place-items-center rounded-xl text-base ${tones[tone]}`}>✦</span></div><p className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-[#10231d] sm:text-3xl">{value}</p><p className="mt-2 text-xs font-medium text-[#668074]">↗ {change}</p></article>;
}
