import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCP } from '../compiler/mcp';

export const IRDiffView = ({ originalIr, chaoticIr }) => {
    // New state to track exact coordinates and content
    const [tooltipState, setTooltipState] = useState({
        visible: false,
        x: 0,
        y: 0,
        content: null,
        meta: null
    });

    const getExplanationForMeta = (meta) => {
        const exactMatch = MCP.getExplanation(meta, 'student');
        if (exactMatch && !exactMatch.startsWith("Transformation '")) {
            return exactMatch;
        }

        const map = {
            'CHAOS_OPAQUE_PREDICATE': 'CHAOS_OPAQUE_PRED',
            'CHAOS_CF_FLATTENING_LITE': 'CHAOS_CF_FLATTEN'
        };
        const diagnosticId = map[meta] || meta;
        return MCP.getExplanation(diagnosticId, 'student');
    };

    const handleMouseEnter = (e, meta) => {
        if (!meta) return;

        // Calculate position relative to viewport
        const rect = e.currentTarget.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        // Default: Position to the right + 10px
        let x = rect.right + 10;
        let y = rect.top;

        // If too far right, flip to left side
        if (x + 300 > viewportWidth) {
            x = rect.left - 310;
        }

        setTooltipState({
            visible: true,
            x,
            y,
            content: getExplanationForMeta(meta),
            meta
        });
    };

    const handleMouseLeave = () => {
        setTooltipState(prev => ({ ...prev, visible: false }));
    };

    const renderInstruction = (instr, idx, isOriginal) => {
        const isChanged = !isOriginal && instr.meta;
        const uniqueId = `${isOriginal ? 'orig' : 'chaos'}_${idx}`;

        return (
            <div
                key={uniqueId}
                className={`flex gap-3 px-3 py-2 rounded-lg relative group ${isChanged
                    ? 'bg-mcp/10 border border-mcp/30 cursor-help'
                    : 'hover:bg-slate-800/50'
                    }`}
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

                    {isChanged && (
                        <span className="text-[10px] font-bold text-mcp bg-mcp/20 px-2 py-0.5 rounded">{instr.meta}</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="glass-panel h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400">
                        <Layers size={18} className="text-mcp" />
                        <span className="text-sm font-semibold">IR Comparison</span>
                    </div>
                    <div className="flex text-xs font-medium">
                        <span className="px-3 py-1 bg-slate-800 rounded-l-lg border border-slate-700 text-slate-400">Original</span>
                        <span className="px-3 py-1 bg-mcp/20 rounded-r-lg border border-mcp/30 text-mcp">Chaotic</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700 overflow-hidden">
                    {/* Original IR */}
                    <div className="overflow-y-auto custom-scrollbar">
                        <div className="px-3 py-2 sticky top-0 bg-slate-800/80 backdrop-blur text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-700 z-10">
                            Original IR
                        </div>
                        <div className="p-3 space-y-1">
                            {originalIr && originalIr.length > 0 ? (
                                originalIr.map((instr, idx) => renderInstruction(instr, idx, true))
                            ) : (
                                <div className="flex items-center justify-center h-32 text-slate-600">
                                    <Info size={20} className="mr-2" />
                                    <span className="text-sm">No IR generated</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chaotic IR */}
                    <div className="overflow-y-auto custom-scrollbar bg-mcp/[0.02]">
                        <div className="px-3 py-2 sticky top-0 bg-mcp/10 backdrop-blur text-xs font-medium text-mcp uppercase tracking-wide border-b border-mcp/20 z-10">
                            Chaotic IR
                        </div>
                        <div className="p-3 space-y-1">
                            {chaoticIr && chaoticIr.length > 0 ? (
                                chaoticIr.map((instr, idx) => renderInstruction(instr, idx, false))
                            ) : (
                                <div className="flex items-center justify-center h-32 text-mcp/50">
                                    <Info size={20} className="mr-2" />
                                    <span className="text-sm">Awaiting compilation</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Portal Tooltip */}
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

                            {/* Decorative glow */}
                            <div className="absolute inset-0 bg-mcp/5 rounded-xl pointer-events-none" />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
