
import { Check, X, Equal } from 'lucide-react';
import { useCompilerStore } from '../store';

export function SemanticVerifier() {
  const { executionResult } = useCompilerStore();

  if (!executionResult) return null;

  const { original, transformed, match } = executionResult;

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
        ${match ? 'bg-emerald-500/20' : 'bg-red-500/20'}
      `}
    >
      {match ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <X className="w-4 h-4 text-red-400" />
      )}
      <span className="text-slate-400">
        <span className="font-mono text-slate-200">{original}</span>
        <Equal className="w-3 h-3 inline mx-1" />
        <span className="font-mono text-slate-200">{transformed}</span>
      </span>
      <span
        className={`
          font-medium
          ${match ? 'text-emerald-400' : 'text-red-400'}
        `}
      >
        {match ? 'Preserved' : 'Mismatch!'}
      </span>
    </div>
  );
}
