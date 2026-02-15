import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Globe,
  Database,
  Zap
} from 'lucide-react';
import { LingoCLI } from '../lingo/cli-integration';

interface DiagnosticCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface DiagnosticResult {
  status: 'healthy' | 'degraded' | 'failed';
  checks: DiagnosticCheck[];
}

export function LingoCliPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Lingo CLI (if configured)
  const [lingoCLI] = useState(() => {
    try {
      return new LingoCLI({
        apiKey: import.meta.env.VITE_LINGO_API_KEY || '',
        projectId: import.meta.env.VITE_LINGO_PROJECT_ID || 'chaos-compiler',
        baseLocale: 'en',
        targetLocales: ['es', 'zh', 'hi'],
      });
    } catch (error) {
      console.error('[Lingo CLI] Initialization failed:', error);
      return null;
    }
  });

  const runDiagnostics = async () => {
    if (!lingoCLI) {
      setError('Lingo CLI not configured. Add VITE_LINGO_API_KEY to .env');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const result = await lingoCLI.runDiagnostics();
      setDiagnostics(result);
    } catch (err) {
      setError((err as Error).message);
      setDiagnostics(null);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run diagnostics on mount if configured
    if (lingoCLI) {
      runDiagnostics();
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-400';
      case 'degraded':
        return 'text-amber-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Lingo CLI Integration</h2>
            <p className="text-sm text-slate-400">Translation & Validation System</p>
          </div>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isRunning || !lingoCLI}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 
            text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Diagnostics
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span className="font-medium">Error</span>
          </div>
          <pre className="mt-2 text-sm text-red-300 font-mono whitespace-pre-wrap">
            {error}
          </pre>
        </motion.div>
      )}

      {/* Status Overview */}
      {diagnostics && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            p-6 rounded-lg border
            ${diagnostics.status === 'healthy' 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : diagnostics.status === 'degraded'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-red-500/10 border-red-500/30'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className={getStatusColor(diagnostics.status)}>
              {getStatusIcon(diagnostics.status)}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${getStatusColor(diagnostics.status)}`}>
                System Status: {diagnostics.status.toUpperCase()}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {diagnostics.checks.filter(c => c.passed).length} / {diagnostics.checks.length} checks passed
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Diagnostic Checks */}
      {diagnostics && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Diagnostic Checks
          </h3>
          <div className="grid gap-3">
            {diagnostics.checks.map((check, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  p-4 rounded-lg border
                  ${check.passed 
                    ? 'bg-slate-800/50 border-slate-700' 
                    : 'bg-red-500/10 border-red-500/30'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={check.passed ? 'text-emerald-400' : 'text-red-400'}>
                    {check.passed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {check.name === 'Config' && <Database className="w-4 h-4 text-slate-400" />}
                      {check.name === 'Auth' && <Globe className="w-4 h-4 text-slate-400" />}
                      {check.name === 'Glossary' && <Terminal className="w-4 h-4 text-slate-400" />}
                      {check.name === 'SDK' && <Zap className="w-4 h-4 text-slate-400" />}
                      <span className="font-medium text-slate-200">{check.name}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 font-mono">
                      {check.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {!lingoCLI && (
        <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Setup Instructions</h3>
          <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
            <li>Create a Lingo.dev account at https://lingo.dev</li>
            <li>Generate an API key from your account settings</li>
            <li>Add VITE_LINGO_API_KEY to your .env file</li>
            <li>Restart the development server</li>
            <li>Run diagnostics to verify connection</li>
          </ol>
        </div>
      )}

      {/* Feature Overview */}
      <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Lingo CLI Features</h3>
        <ul className="text-sm text-slate-400 space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>AI-powered translation with compiler glossary context</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Technical term validation for educational accuracy</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Multi-language support (ES, ZH, HI, and more)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Semantic preservation across translations</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
