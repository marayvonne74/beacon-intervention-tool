export default function FilterBar({ filters, onChange, counts }) {
  const tiers = [
    { value: 'all', label: 'All Tiers' },
    { value: '3', label: 'Tier 3' },
    { value: '2', label: 'Tier 2' },
    { value: '1', label: 'Tier 1' },
  ];

  const grades = [
    { value: 'all', label: 'All Grades' },
    { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'unreviewed', label: 'Unreviewed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
  ];

  function Select({ id, options, value, onSelect }) {
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-slate-500">Filter:</span>

      <Select
        id="filter-tier"
        options={tiers}
        value={filters.tier}
        onSelect={(v) => onChange({ ...filters, tier: v })}
      />

      <Select
        id="filter-grade"
        options={grades}
        value={filters.grade}
        onSelect={(v) => onChange({ ...filters, grade: v })}
      />

      <Select
        id="filter-status"
        options={statuses}
        value={filters.status}
        onSelect={(v) => onChange({ ...filters, status: v })}
      />

      {(filters.tier !== 'all' || filters.grade !== 'all' || filters.status !== 'all') && (
        <button
          onClick={() => onChange({ tier: 'all', grade: 'all', status: 'all' })}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Clear filters
        </button>
      )}

      <span className="ml-auto text-sm text-slate-400">
        {counts.shown} of {counts.total} students
      </span>
    </div>
  );
}
