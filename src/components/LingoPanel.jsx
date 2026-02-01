import React from 'react';
import { AlertCircle, ShieldCheck, HelpCircle, ShieldAlert, Cpu, Users, BrainCircuit, Compass, Terminal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCP } from '../compiler/mcp';
import { LingoCompiler } from '../compiler/lingo';

export const LingoPanel = ({ diagnostics, lingoReport, mode, setMode, simulateError, setSimulateError, onShowResearch }) => {
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

    const FAILURE_OPTIONS = [
        { id: null, label: 'None (Passing)', icon: ShieldCheck, color: 'text-emerald-500' },
        { id: 'MISSING_SEVERITY', label: 'Missing Severity', icon: AlertCircle, color: 'text-red-400' },
        { id: 'EMPTY_CONTEXT', label: 'Empty Context', icon: AlertCircle, color: 'text-red-400' },
        { id: 'INVALID_ID_FORMAT', label: 'Invalid ID Format', icon: AlertCircle, color: 'text-amber-400' },
        { id: 'UNKNOWN_TERM', label: 'Unknown Term', icon: AlertCircle, color: 'text-amber-400' },
    ];

    const currentOption = FAILURE_OPTIONS.find(opt => opt.id === simulateError) || FAILURE_OPTIONS[0];

    // Get explanation from MCP based on diagnostic ID
    const getExplanation = (diag) => {
        try {
            return MCP.getExplanation(diag.id, mode) || diag.context || 'Transformation applied';
        } catch {
            return diag.context || 'Transformation applied';
        }
    };

    const injectedDiagnostic = simulateError ? LingoCompiler.TEST_FAILURE_MODES[simulateError] : null;

    return (
        <div className="glass-panel h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/50 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-slate-400">
                        <ShieldCheck size={18} className="text-lingo" />
                        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Transformations & Explanations</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end">
                    {/* Failure Mode Selector */}
                    <div className="relative flex-1 sm:flex-none">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all w-full sm:min-w-[160px]"
                        >
                            <currentOption.icon size={12} className={currentOption.color} />
                            <span className="text-[10px] font-bold text-slate-300 flex-1 text-left truncate">
                                {currentOption.label}
                            </span>
                            <ChevronDown size={12} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[100] overflow-hidden"
                                >
                                    {FAILURE_OPTIONS.map((option) => (
                                        <button
                                            key={option.id || 'none'}
                                            onClick={() => {
                                                setSimulateError(option.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold transition-all text-left border-b border-slate-800 last:border-none ${simulateError === option.id
                                                ? 'bg-slate-800 text-white'
                                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                                }`}
                                        >
                                            <option.icon size={12} className={option.color} />
                                            {option.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="group relative">
                            <HelpCircle size={14} className="text-slate-500 cursor-help hover:text-slate-300 transition-colors" />
                            <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-[11px] text-slate-300 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[200] translate-y-2 group-hover:translate-y-0">
                                <div className="absolute -top-1 right-3 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45" />
                                Student and Researcher modes control how transformations are explained, not how they are executed.
                            </div>
                        </div>
                        <div className="flex bg-slate-800 p-0.5 sm:p-1 rounded-lg border border-slate-700">
                            <button
                                onClick={() => setMode('student')}
                                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${mode === 'student'
                                    ? 'bg-lingo text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                            >
                                <Users size={14} />
                                <span className="hidden sm:inline">Student</span>
                            </button>
                            <button
                                onClick={() => setMode('researcher')}
                                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${mode === 'researcher'
                                    ? 'bg-lingo text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                            >
                                <BrainCircuit size={14} />
                                <span className="hidden sm:inline">Researcher</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {!lingoReport.valid ? (
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto bg-red-500/5">
                    <div className="flex flex-col items-center space-y-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50"
                        >
                            <ShieldAlert size={32} className="text-red-500" />
                        </motion.div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Build Blocked</h3>
                            <p className="text-slate-400 max-w-md mx-auto mt-2">
                                The Lingo Compiler detected invalid diagnostics. Content has been blocked to prevent unverified information from reaching the user.
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Failure Injection Preview */}
                        {injectedDiagnostic && (
                            <div className="bg-slate-950/80 border border-mcp/30 rounded-lg p-4 text-left shadow-2xl">
                                <div className="flex items-center gap-2 text-mcp font-bold mb-3 border-b border-mcp/20 pb-2 text-[10px] uppercase">
                                    <Terminal size={14} />
                                    Failure Injection Preview
                                </div>
                                <pre className="font-mono text-[10px] text-slate-300 overflow-x-auto">
                                    {JSON.stringify(injectedDiagnostic, (key, value) => {
                                        if (key.startsWith('__')) return undefined;
                                        return value;
                                    }, 2)}
                                </pre>
                                <div className="mt-3 pt-2 border-t border-mcp/10">
                                    <p className="text-[9px] text-mcp italic leading-tight">
                                        Reason: {injectedDiagnostic.__reason}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Lingo Error Logs */}
                        <div className="bg-slate-950/80 border border-red-500/30 rounded-lg p-4 text-left font-mono text-xs shadow-2xl">
                            <div className="flex items-center gap-2 text-red-400 font-bold mb-3 border-b border-red-900/50 pb-2 text-[10px] uppercase">
                                <AlertCircle size={14} />
                                Lingo Validation Errors
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {lingoReport.errors.map((e, idx) => (
                                    <div key={idx} className="flex gap-2 text-red-300/80 leading-snug">
                                        <span className="text-red-500 opacity-50 font-bold font-mono">[{idx}]</span>
                                        <span>{e}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {diagnostics && diagnostics.length > 0 ? (
                            diagnostics.map((diag, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="glass-panel p-4 hover:border-lingo/50 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-3 border-b border-slate-700/50 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${diag.severity === 'high' ? 'bg-red-500' :
                                                diag.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`} />
                                            <span className="text-xs font-bold text-slate-300 font-mono">{diag.id}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${diag.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                            diag.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {diag.severity}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-lingo mb-2">
                                        <Compass size={12} className="group-hover:rotate-45 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">
                                            {mode === 'student' ? 'Simple Explanation' : 'Technical Details'}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                        {getExplanation(diag)}
                                    </p>

                                    <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500 font-mono">ctx: {diag.context}</span>
                                        <div className="flex gap-1 items-center">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] text-emerald-500 font-bold uppercase">Lingo Verified</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-500">
                                <BrainCircuit size={48} strokeWidth={1} className="mb-4 opacity-20" />
                                <p className="text-lg font-bold text-slate-400">Intelligence Engine Idle</p>
                                <p className="text-sm mt-1">Compile code to see Lingo-validated analysis</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Footnote */}
            <div className="px-5 py-2 border-t border-slate-700/20 flex justify-between items-center bg-slate-900/30">
                <p className="text-[9px] text-slate-500 font-medium italic opacity-50 text-left">
                    Validation powered by Lingo.dev Compiler
                </p>
                <button
                    onClick={onShowResearch}
                    className="text-[9px] text-slate-500 hover:text-lingo font-bold uppercase tracking-tighter transition-colors"
                >
                    Research Notes
                </button>
            </div>
        </div>
    );
};
