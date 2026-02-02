import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  AlertCircle,
  Info,
  AlertTriangle,
  FileJson,
  X,
} from 'lucide-react';
import { useCompilerStore } from '../store';
import { Diagnostic } from '../types';

export function LingoPanel() {
  const {
    allDiagnostics,
    lingoReport,
    isCompiled,
  } = useCompilerStore();

  if (!isCompiled) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Shield className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Diagnostics Yet</p>
        <p className="text-sm mt-1">Compile your code to see validation results</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Validation Status Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          p-6 rounded-lg border
          ${
            lingoReport.valid
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {lingoReport.valid ? (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            ) : (
              <ShieldX className="w-8 h-8 text-red-400" />
            )}
            <div>
              <h2
                className={`
                  text-lg font-semibold
                  ${lingoReport.valid ? 'text-emerald-300' : 'text-red-300'}
                `}
              >
                {lingoReport.valid ? 'Lingo Validation Passed' : 'Lingo Validation Failed'}
              </h2>
              <p className="text-sm text-slate-400">
                {lingoReport.validCount} of {lingoReport.diagnosticCount} diagnostics validated
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-200">
              {lingoReport.validCount}/{lingoReport.diagnosticCount}
            </div>
            <div className="text-xs text-slate-500">Valid / Total</div>
          </div>
        </div>
      </motion.div>

      {/* Validation Errors */}
      {lingoReport.errors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
            <X className="w-4 h-4" />
            Validation Errors ({lingoReport.errors.length})
          </h3>
          <div className="space-y-1">
            {lingoReport.errors.map((error, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300"
              >
                {error}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Warnings */}
      {lingoReport.warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Warnings ({lingoReport.warnings.length})
          </h3>
          <div className="space-y-1">
            {lingoReport.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300"
              >
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostics List */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <FileJson className="w-4 h-4" />
          All Diagnostics ({allDiagnostics.length})
        </h3>
        <div className="space-y-2">
          {allDiagnostics.map((diag, idx) => (
            <DiagnosticCard key={idx} diagnostic={diag} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DIAGNOSTIC CARD
// ============================================================================

interface DiagnosticCardProps {
  diagnostic: Diagnostic;
}

function DiagnosticCard({ diagnostic }: DiagnosticCardProps) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const config = severityConfig[diagnostic.severity] || severityConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-lg border border-slate-700 overflow-hidden
        ${config.bg}
      `}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <div>
            <code className="text-sm font-mono text-slate-200">{diagnostic.id}</code>
            <p className="text-xs text-slate-500 mt-0.5">{diagnostic.context}</p>
          </div>
        </div>
        <span
          className={`
            px-2 py-0.5 text-xs rounded-full uppercase font-medium
            ${config.color} ${config.bg}
          `}
        >
          {diagnostic.severity}
        </span>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="border-t border-slate-700/50 p-4 space-y-3"
        >
          {diagnostic.explanation && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">Explanation</span>
              <p className="mt-1 text-sm text-slate-300">{diagnostic.explanation}</p>
            </div>
          )}
          {diagnostic.params && Object.keys(diagnostic.params).length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">Parameters</span>
              <pre className="mt-1 text-xs text-slate-400 font-mono bg-slate-900 rounded p-2 overflow-auto">
                {JSON.stringify(diagnostic.params, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
