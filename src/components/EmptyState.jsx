export default function EmptyState({ tier, filtered }) {
  if (filtered) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-lg font-medium text-slate-500">No students match your filters</p>
        <p className="text-sm mt-1">Try adjusting or clearing your filter selections.</p>
      </div>
    );
  }

  const messages = {
    3: {
      icon: '✅',
      headline: 'No Tier 3 students — great news.',
      sub: 'No students are showing critical risk indicators at this time.',
    },
    2: {
      icon: '🟡',
      headline: 'No Tier 2 students currently.',
      sub: 'All students are either on track or receiving intensive support.',
    },
    1: {
      icon: '📚',
      headline: 'No Tier 1 students in view.',
      sub: 'Adjust your filters to see all students.',
    },
    all: {
      icon: '🎉',
      headline: 'No students loaded.',
      sub: 'Student data will appear here once loaded from Clever or mock data.',
    },
  };

  const msg = messages[tier] || messages.all;

  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">{msg.icon}</div>
      <p className="text-lg font-semibold text-slate-600">{msg.headline}</p>
      <p className="text-sm text-slate-400 mt-1">{msg.sub}</p>
    </div>
  );
}
