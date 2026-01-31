import React from 'react';
import { Cpu, Cog, Atom, ArrowRight, Sparkles, Shield, Brain, GitBranch, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const components = [
    {
        id: 'parser',
        name: 'Parser Agent',
        desc: 'Lexes & parses C source into AST',
        icon: GitBranch,
        type: 'trusted',
        role: 'Structural Foundation'
    },
    {
        id: 'ir',
        name: 'IR Generator',
        desc: 'Converts AST to intermediate representation',
        icon: Cpu,
        type: 'trusted',
        role: 'Semantic Translation'
    },
    {
        id: 'chaos',
        name: 'Chaos Engine',
        desc: 'Applies polymorphic transformations',
        icon: Atom,
        type: 'trusted',
        role: 'Entropy Generation'
    },
    {
        id: 'lingo',
        name: 'Lingo Validator (Lingo.dev)',
        desc: 'Validates diagnostic structure, terminology, and context (not code generation)',
        icon: Shield,
        type: 'authoritative',
        role: 'Authority & Validation'
    },
    {
        id: 'codegen',
        name: 'Code Generator',
        desc: 'Emits x86 assembly from transformed IR',
        icon: Cog,
        type: 'trusted',
        role: 'Target Emission'
    },
    {
        id: 'mcp',
        name: 'MCP Explainer',
        desc: 'Generates contextual explanations (never rendered without validation)',
        icon: Brain,
        type: 'generative',
        role: 'Educational Insights'
    },
];

const mainPipeline = ['parser', 'ir', 'chaos', 'lingo', 'codegen'];

export const AgentsTab = () => {
    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-10">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-mcp/10 rounded-full border border-mcp/30 mb-3 sm:mb-4">
                    <Sparkles size={14} className="text-mcp sm:w-[16px] sm:h-[16px]" />
                    <span className="text-[10px] sm:text-xs font-bold text-mcp uppercase tracking-widest">System Architecture</span>
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Pipeline Components</h2>
                    <div className="group relative">
                        <HelpCircle size={16} className="text-slate-500 cursor-help hover:text-slate-300 transition-colors sm:w-[18px] sm:h-[18px]" />
                        <div className="absolute top-1/2 left-full ml-3 sm:ml-4 -translate-y-1/2 w-48 sm:w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-[10px] sm:text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 border-b border-l border-slate-700 rotate-45" />
                            <p className="font-bold text-white mb-1">Why validation matters:</p>
                            AI explains what might be true. Lingo enforces what is allowed to be shown.
                        </div>
                    </div>
                </div>
                <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed px-2">
                    Some components generate content. One component enforces correctness.
                    We treat AI/Generative output as untrusted until verified by the validation gate.
                </p>
            </div>

            {/* Categorized Grid */}
            <div className="space-y-8">
                {/* Authority Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Authoritative / Trusted Layer
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {components.filter(c => c.type !== 'generative').map((comp, idx) => (
                            <motion.div
                                key={comp.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`glass-panel p-5 border-l-4 ${comp.type === 'authoritative' ? 'border-l-emerald-500' : 'border-l-slate-700'
                                    } hover:bg-white/[0.02] transition-colors group`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${comp.type === 'authoritative' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        <comp.icon size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{comp.name}</h4>
                                            {comp.type === 'authoritative' && (
                                                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Truth</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">{comp.role}</p>
                                        <p className="text-xs text-slate-400 leading-normal">{comp.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Generative Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-mcp" />
                        Generative / Untrusted Layer
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {components.filter(c => c.type === 'generative').map((comp) => (
                            <motion.div
                                key={comp.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-panel p-5 border-l-4 border-l-mcp hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-mcp/10 text-mcp rounded-lg">
                                        <comp.icon size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-white group-hover:text-mcp transition-colors">{comp.name}</h4>
                                            <span className="text-[9px] bg-mcp/10 text-mcp border border-mcp/30 px-1.5 py-0.5 rounded font-bold uppercase">Untrusted</span>
                                        </div>
                                        <p className="text-[10px] text-mcp uppercase font-bold mb-2">{comp.role}</p>
                                        <p className="text-xs text-slate-400 leading-normal">{comp.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="glass-panel p-4 sm:p-8 bg-slate-900/50 relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-lingo/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-mcp/5 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Enforcement Flow</h3>
                        <div className="flex items-center gap-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-700 rounded-full" /> Logic</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-mcp rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" /> Explanation</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> Validation Gate</div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-10">
                        {/* Main Pipeline - Vertical List */}
                        <div className="flex flex-col items-center w-full max-w-sm">
                            <span className="text-[9px] text-slate-500 uppercase font-black mb-6 tracking-[0.3em] text-center">Main Transformation Pipeline</span>
                            <div className="flex flex-col items-center gap-4 w-full">
                                {mainPipeline.map((compId, idx) => {
                                    const comp = components.find(c => c.id === compId);
                                    if (!comp) return null;
                                    const Icon = comp.icon;
                                    const isLingo = comp.type === 'authoritative';

                                    return (
                                        <React.Fragment key={compId}>
                                            <div className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl border transition-all duration-300 ${isLingo
                                                ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                                : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                                                }`}>
                                                <div className={`p-2.5 rounded-lg ${isLingo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className={`text-sm font-bold tracking-tight ${isLingo ? 'text-white' : 'text-slate-200'}`}>{comp.name}</span>
                                                    <span className={`text-[9px] uppercase font-bold tracking-widest mt-1 ${isLingo ? 'text-emerald-500/70' : 'text-slate-600'}`}>{comp.type}</span>
                                                </div>
                                                {idx < mainPipeline.length - 1 && <div className="text-slate-700 hidden sm:block"><ArrowRight size={16} className="opacity-20" /></div>}
                                            </div>
                                            {idx < mainPipeline.length - 1 && (
                                                <div className="flex flex-col items-center py-2">
                                                    <div className="w-px h-6 bg-gradient-to-b from-slate-700 to-slate-800 flex flex-col items-center justify-end">
                                                        <div className="w-1.5 h-1.5 border-b border-r border-slate-700 rotate-45 mb-[-1px]" />
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Side Channel - Horizontal Flow */}
                        <div className="flex flex-col items-center w-full">
                            <div className="flex flex-col items-center">
                                <div className="h-10 w-px bg-gradient-to-b from-slate-800 to-mcp/40" />
                                <div className="w-1.5 h-1.5 border-b border-r border-mcp/40 rotate-45 mt-[-4px]" />
                                <span className="text-[9px] text-mcp uppercase font-black mb-8 tracking-[0.3em] mt-3">Validation Side-Channel</span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full justify-center">
                                {/* MCP Card */}
                                <div className="w-full sm:w-auto flex items-center gap-4 px-6 py-4 rounded-xl border bg-mcp/5 border-mcp/30 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                                    <div className="p-2.5 bg-mcp/10 rounded-lg text-mcp">
                                        <Brain size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white tracking-tight">MCP Explainer</span>
                                        <span className="text-[9px] text-mcp/70 uppercase font-bold tracking-widest mt-1">generative</span>
                                    </div>
                                </div>

                                {/* Arrow Line */}
                                <div className="flex items-center sm:w-12 h-6 sm:h-px justify-center">
                                    <div className="w-px sm:w-full h-full sm:h-px bg-slate-700 relative">
                                        <div className="absolute right-[-2.5px] top-[-3px] sm:right-[-1px] sm:top-[-3px] w-1.5 h-1.5 border-t border-r border-slate-700 rotate-[135deg] sm:rotate-45" />
                                    </div>
                                </div>

                                {/* Lingo Card */}
                                <div className="w-full sm:w-auto flex items-center gap-4 px-6 py-4 rounded-xl border bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <Shield size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white tracking-tight">Lingo Validator</span>
                                        <span className="text-[9px] text-emerald-500/70 uppercase font-bold tracking-widest mt-1">authoritative</span>
                                    </div>
                                </div>

                                {/* Arrow Line */}
                                <div className="flex items-center sm:w-12 h-6 sm:h-px justify-center">
                                    <div className="w-px sm:w-full h-full sm:h-px bg-slate-700 relative">
                                        <div className="absolute right-[-2.5px] top-[-3px] sm:right-[-1px] sm:top-[-3px] w-1.5 h-1.5 border-t border-r border-slate-700 rotate-[135deg] sm:rotate-45" />
                                    </div>
                                </div>

                                {/* UI Card */}
                                <div className="w-full sm:w-auto flex items-center gap-4 px-6 py-4 rounded-xl border bg-slate-800/40 border-slate-700/50 opacity-60">
                                    <div className="p-2.5 bg-slate-800 rounded-lg text-slate-500">
                                        <Sparkles size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-300 tracking-tight">UI Rendering</span>
                                        <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mt-1">frontend</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-[10px] sm:text-[11px] text-slate-500 max-w-sm font-medium italic leading-relaxed">
                            MCP explanations are generated after compilation and validated by Lingo before rendering.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
