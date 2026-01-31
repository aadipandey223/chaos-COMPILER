import React from 'react';
import { History, CheckCircle, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const phases = [
    {
        id: 1,
        title: 'Foundation',
        status: 'complete',
        items: ['Lexer & Parser', 'IR generation', 'Basic CodeGen (x86)']
    },
    {
        id: 2,
        title: 'Chaos Engine',
        status: 'complete',
        items: ['Instruction Substitution', 'Opaque Predicates', 'Control Flow Lite', 'Algebraic Swap']
    },
    {
        id: 3,
        title: 'Lingo Integration',
        status: 'complete',
        items: ['Glossary enforcement', 'Placeholder validation', 'MCP explanations']
    },
    {
        id: 4,
        title: 'Future Work',
        status: 'active',
        items: ['Binary polymorphism', 'Multi-architecture', 'Community recipes', 'De-obfuscation resistance']
    }
];

export const RoadmapTab = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-lingo/10 rounded-full border border-lingo/30 mb-4">
                    <History size={16} className="text-lingo" />
                    <span className="text-xs font-bold text-lingo uppercase tracking-wide">Development Timeline</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Technical Research Notes</h2>
                <p className="text-slate-400 max-w-xl mx-auto">
                    From polymorphic chaos to universal build resilience.
                </p>
                <div className="mt-4 p-2 bg-slate-800/50 border border-slate-700 rounded-md inline-block">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        Non-Evaluative Research Section
                    </p>
                </div>
            </div>

            {/* Quote */}
            <div className="glass-panel p-6 border-l-4 border-lingo">
                <p className="text-lg text-slate-200 italic">
                    "Polymorphism is the shield; <span className="text-lingo font-bold">Lingo.dev</span> is the source of truth."
                </p>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {phases.map((phase, idx) => (
                    <motion.div
                        key={phase.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-panel p-5 flex gap-4"
                    >
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${phase.status === 'complete'
                                ? 'bg-lingo/20 text-lingo border-lingo'
                                : 'bg-mcp/20 text-mcp border-mcp'
                                }`}>
                                {phase.status === 'complete' ? <CheckCircle size={20} /> : <Circle size={20} />}
                            </div>
                            {idx < phases.length - 1 && <div className="w-0.5 h-full bg-slate-700 mt-2" />}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-white">{phase.title}</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${phase.status === 'complete'
                                    ? 'bg-lingo/20 text-lingo'
                                    : 'bg-mcp/20 text-mcp'
                                    }`}>
                                    {phase.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {phase.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-1 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300">
                                        <ArrowRight size={10} className="text-slate-500" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
