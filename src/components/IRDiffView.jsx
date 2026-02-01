import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCP } from '../compiler/mcp';

export const IRDiffView = ({ snapshots = [] }) => {
    const [step, setStep] = useState(0);
    const [tooltipState, setTooltipState] = useState({
        visible: false,
        x: 0,
        y: 0,
        content: null,
        meta: null
    });

    const currentSnapshot = snapshots[step] || { name: 'Empty', ir: [] };
    const prevSnapshot = (step > 0 ? snapshots[step - 1] : snapshots[0]) || { name: 'Empty', ir: [] };

    const getExplanationForMeta = (meta) => {
        const exactMatch = MCP.getExplanation(meta, 'student');
        if (exactMatch && !exactMatch.startsWith("Transformation '")) return exactMatch;
        const map = { 'CHAOS_OPAQUE_PREDICATE': 'CHAOS_OPAQUE_PRED', 'CHAOS_CF_FLATTENING_LITE': 'CHAOS_CF_FLATTEN' };
        return MCP.getExplanation(map[meta] || meta, 'student');
    };

    const handleMouseEnter = (e, meta) => {
        if (!meta) return;
        const rect = e.currentTarget.getBoundingClientRect();
        let x = rect.right + 10;
        if (x + 300 > window.innerWidth) x = rect.left - 310;
        setTooltipState({ visible: true, x, y: rect.top, content: getExplanationForMeta(meta), meta });
    };

    const handleMouseLeave = () => setTooltipState(prev => ({ ...prev, visible: false }));

    const renderInstruction = (instr, idx, isNew) => {
        const isChanged = isNew && instr.meta;
        return (
            <div
                key={`${isNew ? 'new' : 'old'}_${idx}`}
                className={`flex gap-3 px-3 py-2 rounded-lg relative group ${isChanged ? 'bg-mcp/10 border border-mcp/30 cursor-help' : 'hover:bg-slate-800/50'}`}
                onMouseEnter={(e) => isChanged && handleMouseEnter(e, instr.meta)}
                onMouseLeave={handleMouseLeave}
            >
                <span className="text-xs text-slate-600 font-mono w-8 text-right">{idx}</span>
                <div className="flex-1 flex items-center justify-between">
                    <div className="font-mono text-sm">
                        <span className={`font-bold ${isChanged ? 'text-mcp' : 'text-slate-300'}`}>{instr.op}</span>
                        {instr.target && <span className="text-blue-400 ml-2">{instr.target}</span>}
                        {instr.left !== undefined && <span className="text-slate-500"> = {String(instr.left)}</span>}
                        {instr.right !== undefined && <span className="text-slate-500"> op {String(instr.right)}</span>}
                        {instr.value !== undefined && <span className="text-slate-500"> = {String(instr.value)}</span>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="glass-panel h-full flex flex-col overflow-hidden bg-slate-900/40 border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
                    <Layers size={20} className="text-violet-400" />
                    <h3 className="font-bold text-sm uppercase tracking-widest text-slate-200">Transformation Timeline</h3>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Vertical Rail Navigation */}
                    <div className="w-20 flex flex-col items-center py-6 relative border-r border-slate-800/50 bg-slate-950/20">
                        {/* Rail Line */}
                        <div className="absolute top-10 bottom-10 w-1 bg-slate-800 rounded-full" />

                        <div className="flex flex-col gap-8 relative z-10 w-full items-center">
                            {snapshots.map((snap, i) => (
                                <button
                                    key={i}
                                    onClick={() => setStep(i)}
                                    className="group relative flex items-center justify-center"
                                >
                                    {/* Step Indicator */}
                                    <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300
                                    ${step === i
                                            ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] scale-110'
                                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                                        }
                                `}>
                                        {i === 0 ? <Info size={14} /> : i}
                                    </div>

                                    {/* Pulse for active step */}
                                    {step === i && (
                                        <div className="absolute inset-0 rounded-full bg-violet-600 animate-pulse opacity-20" />
                                    )}

                                    {/* Hover tooltip (Snapshot Name) */}
                                    <div className="absolute left-14 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                                        {snap.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Instruction List */}
                    <div className="flex-1 flex flex-col bg-slate-950/40 p-6 overflow-hidden">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">{step}</span>
                            <h4 className="text-xs font-bold text-violet-300 uppercase tracking-widest">{currentSnapshot.name}</h4>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/40 rounded-xl border border-slate-800/50 p-4 shadow-inner">
                            <div className="space-y-1">
                                {currentSnapshot.ir.map((instr, idx) => {
                                    const isChanged = instr.meta && step > 0;
                                    return (
                                        <div
                                            key={idx}
                                            className={`
                                            flex gap-4 px-4 py-2.5 rounded-lg border transition-all group
                                            ${isChanged
                                                    ? 'bg-violet-950/20 border-violet-500/30'
                                                    : 'bg-transparent border-transparent hover:bg-slate-800/30'
                                                }
                                        `}
                                            onMouseEnter={(e) => isChanged && handleMouseEnter(e, instr.meta)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <span className="text-xs text-slate-600 font-mono w-6 text-right select-none opacity-50 group-hover:opacity-100">{idx}</span>
                                            <div className="flex-1 flex items-center justify-between">
                                                <div className="font-mono text-sm tracking-tight flex items-center gap-2">
                                                    <span className={`font-bold ${isChanged ? 'text-violet-400' : 'text-slate-300'}`}>{instr.op}</span>
                                                    {instr.target && (
                                                        <>
                                                            <span className="text-violet-500/80 font-semibold">{instr.target}</span>
                                                            <span className="text-slate-600">=</span>
                                                        </>
                                                    )}
                                                    {instr.left !== undefined && <span className="text-slate-400">{String(instr.left)}</span>}
                                                    {instr.right !== undefined && (
                                                        <>
                                                            <span className="text-slate-600">op</span>
                                                            <span className="text-slate-400">{String(instr.right)}</span>
                                                        </>
                                                    )}
                                                    {instr.value !== undefined && <span className="text-emerald-400/80">{String(instr.value)}</span>}
                                                </div>

                                                {isChanged && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                                                        <span className="text-[9px] font-bold text-violet-400/70 uppercase tracking-tighter bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">{instr.meta}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {createPortal(
                <AnimatePresence>
                    {tooltipState.visible && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                top: tooltipState.y,
                                left: tooltipState.x,
                                position: 'fixed',
                                zIndex: 9999
                            }}
                            className="bg-slate-900/95 backdrop-blur-xl border border-mcp/50 rounded-xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] w-80 pointer-events-none"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-mcp">
                                    <Info size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Strategy Insight</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500">{tooltipState.meta}</span>
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                {tooltipState.content}
                            </p>
                            <div className="absolute inset-0 bg-mcp/5 rounded-xl pointer-events-none" />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
