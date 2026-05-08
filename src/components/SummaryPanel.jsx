export default function SummaryPanel({ students, summary }) {
  const unreviewed = students.filter((s) => s.interventionStatus === 'unreviewed').length;
  const tier3 = students.filter((s) => s.tier === 3).length;
  const tier2 = students.filter((s) => s.tier === 2).length;
  const tier1 = students.filter((s) => s.tier === 1).length;

  const { open, inProgress, completed, staffWorkload } = summary;

  // Only show staff rows that have at least one assignment (or all if none yet)
  const activeStaff = staffWorkload.filter(
    (s) => s.assigned + s.inProgress + s.completed > 0
  );
  const tableRows = activeStaff.length > 0 ? activeStaff : staffWorkload;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-5 overflow-hidden">
      {/* Top section: two columns of metric tiles */}
      <div className="grid grid-cols-2 divide-x divide-slate-100">
        {/* Left: Student Tier Breakdown */}
        <div className="px-4 pt-3 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            Student Tiers
          </p>
          <div className="flex items-stretch gap-2">
            <MetricTile value={tier3} label="Tier 3" valueClass="text-red-600" bgClass="bg-red-50" />
            <MetricTile value={tier2} label="Tier 2" valueClass="text-amber-600" bgClass="bg-amber-50" />
            <MetricTile value={tier1} label="Tier 1" valueClass="text-green-600" bgClass="bg-green-50" />
            <MetricTile value={unreviewed} label="Unreviewed" valueClass="text-slate-500" bgClass="bg-slate-50" />
          </div>
        </div>

        {/* Right: Intervention Status */}
        <div className="px-4 pt-3 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            Interventions
          </p>
          <div className="flex items-stretch gap-2">
            <MetricTile value={open} label="Open" valueClass="text-slate-600" bgClass="bg-slate-50" />
            <MetricTile value={inProgress} label="In Progress" valueClass="text-blue-600" bgClass="bg-blue-50" />
            <MetricTile value={completed} label="Completed" valueClass="text-green-600" bgClass="bg-green-50" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Staff workload table */}
      <div className="px-4 pt-2.5 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Staff Workload
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 text-left">
                <th className="font-medium pb-1.5 pr-4 whitespace-nowrap">Name</th>
                <th className="font-medium pb-1.5 pr-4 whitespace-nowrap hidden sm:table-cell">Role</th>
                <th className="font-medium pb-1.5 pr-4 text-right whitespace-nowrap">Assigned</th>
                <th className="font-medium pb-1.5 pr-4 text-right whitespace-nowrap">In Progress</th>
                <th className="font-medium pb-1.5 text-right whitespace-nowrap">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableRows.map((s) => (
                <tr key={s.id} className="text-slate-600">
                  <td className="py-1 pr-4 font-medium text-slate-700 whitespace-nowrap">{s.name}</td>
                  <td className="py-1 pr-4 text-slate-400 whitespace-nowrap hidden sm:table-cell">{s.role}</td>
                  <td className="py-1 pr-4 text-right">
                    <span className={s.assigned > 0 ? 'text-blue-600 font-semibold' : 'text-slate-300'}>
                      {s.assigned}
                    </span>
                  </td>
                  <td className="py-1 pr-4 text-right">
                    <span className={s.inProgress > 0 ? 'text-amber-600 font-semibold' : 'text-slate-300'}>
                      {s.inProgress}
                    </span>
                  </td>
                  <td className="py-1 text-right">
                    <span className={s.completed > 0 ? 'text-green-600 font-semibold' : 'text-slate-300'}>
                      {s.completed}
                    </span>
                  </td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-2 text-slate-300 text-center">
                    No assignments yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ value, label, valueClass, bgClass }) {
  return (
    <div className={`flex-1 rounded-lg ${bgClass} px-2.5 py-2 text-center min-w-0`}>
      <div className={`text-xl font-bold leading-none ${valueClass}`}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
        {label}
      </div>
    </div>
  );
}
