import { ShieldCheck } from 'lucide-react';

const SkillBadge = ({ skill, type = 'teach', level, verified = false, onRemove }) => {
  const colors = {
    teach: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    learn: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    verified: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  };

  const colorClass = verified ? colors.verified : colors[type] || colors.teach;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass} transition-all hover:scale-105`}>
      {verified && <ShieldCheck size={12} className="text-yellow-400" />}
      {skill}
      {level && <span className="opacity-60 ml-1">({level})</span>}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-red-400 transition-colors"
        >
          &times;
        </button>
      )}
    </span>
  );
};

export default SkillBadge;
