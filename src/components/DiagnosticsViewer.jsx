import { AlertCircle, Info, Bug, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { MCP } from '../compiler/mcp';

export const DiagnosticsViewer = ({ diagnostics, mode = 'student' }) => {

    if (!diagnostics || diagnostics.length === 0) return null;

    const getIcon = (severity) => {
        switch (severity) {
            case 'error': return <AlertCircle className="text-red-500" size={16} />;
            case 'warning': return <AlertCircle className="text-yellow-500" size={16} />;
            case 'info': return <Info className="text-blue-500" size={16} />;
            case 'chaos': return <Bug className="text-purple-500" size={16} />;
            default: return <Shield className="text-slate-500" size={16} />;
        }
    };

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'error': return 'border-red-100 bg-red-50/50';
            case 'warning': return 'border-yellow-100 bg-yellow-50/50';
            case 'info': return 'border-blue-100 bg-blue-50/50';
            case 'chaos': return 'border-purple-100 bg-purple-50/50';
            default: return 'border-slate-100 bg-slate-50/50';
        }
    };

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield size={16} /> Lingo.dev Validated Diagnostics
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {diagnostics.map((d, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 rounded-lg border flex flex-col gap-1 ${getSeverityStyle(d.severity)}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getIcon(d.severity)}
                                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">{d.id}</span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">{d.context}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-semibold mb-1">
                            {d.id === 'CHAOS_SUBST_ADD' && `Replaced ADD with XOR/AND/MUL chain`}
                            {d.id === 'CHAOS_OPAQUE_PRED' && `Injected opaque predicate (${d.params?.cond || 'N/A'})`}
                            {d.id === 'CHAOS_CF_FLATTEN' && `Flattened control flow (Switch-Loop)`}
                            {d.id === 'CHAOS_ALGEBRAIC_SWAP' && `Swapped operands for ${d.params?.op || 'operation'}`}
                            {d.id === 'COMPILE_CLEAN' && `Clean compilation (${d.params?.irCount || 0} IR instructions)`}
                        </p>
                        <p className={`text-[11px] leading-relaxed p-2 rounded border ${mode === 'researcher' ? 'bg-indigo-50/50 border-indigo-100 text-indigo-900 italic' : 'bg-white/50 border-slate-100 text-slate-600'}`}>
                            {MCP.getExplanation(d.id, mode)}
                        </p>
                        {d.params && Object.keys(d.params).length > 0 && (

                            <div className="mt-1 flex flex-wrap gap-2">
                                {Object.entries(d.params).map(([k, v]) => (
                                    <span key={k} className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded border border-black/5 text-slate-500">
                                        <span className="font-bold">{k}:</span> {v}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
