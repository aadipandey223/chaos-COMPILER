import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Brain, Zap, Sparkles, ArrowRight, Play, Target } from 'lucide-react';

export const IntroOverlay = ({ onDismiss, onStartGuidedTour }) => {
    const [showQuickValue, setShowQuickValue] = useState(true);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="max-w-xl w-full glass-panel p-6 sm:p-8 relative border-lingo/30 shadow-[0_0_50px_rgba(0,180,216,0.1)] flex flex-col items-center mx-4"
            >
                {/* Background Glows (Inside the box) */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-lingo/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-mcp/10 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative z-10 text-center w-full space-y-4 sm:space-y-6">
                    {/* 10-Second Value Proposition */}
                    <AnimatePresence mode="wait">
                        {showQuickValue && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-emerald-500/10 rounded-2xl p-6 border border-violet-500/20"
                            >
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <Target className="text-violet-400" size={24} />
                                    <h3 className="text-xl sm:text-2xl font-black text-white">Why This Matters</h3>
                                </div>
                                <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-4">
                                    <strong className="text-white">Watch code transform in real-time.</strong><br/>
                                    See how compilers obfuscate programs while preserving behavior.
                                </p>
                                <div className="grid grid-cols-3 gap-3 text-xs">
                                    <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                                        <div className="text-violet-400 font-bold mb-1">VISUAL</div>
                                        <div className="text-slate-400">See IR transform</div>
                                    </div>
                                    <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                                        <div className="text-blue-400 font-bold mb-1">VERIFIED</div>
                                        <div className="text-slate-400">AI + validation</div>
                                    </div>
                                    <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                                        <div className="text-emerald-400 font-bold mb-1">SAFE</div>
                                        <div className="text-slate-400">Semantic check</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowQuickValue(false)}
                                    className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    Show technical details →
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header with BIG Logo */}
                    {!showQuickValue && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center -mt-4"
                        >
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="w-32 h-32 sm:w-56 sm:h-56 object-contain drop-shadow-[0_0_40px_rgba(0,180,216,0.3)] mb-[-0.5rem] sm:mb-[-1.5rem] scale-110"
                            />
                            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight text-center">Chaos Lab — Compiler Transformation Laboratory</h2>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mt-2 px-2">
                                A research environment where <span className="text-white font-semibold">AI explains what's happening</span>, and <span className="text-lingo font-extrabold tracking-wide">Lingo.dev enforces truth</span>.
                            </p>
                        </motion.div>
                    )}

                    {/* Core Philosophy Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-left">
                        <div className="p-3 sm:p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-mcp/10 rounded-lg text-mcp">
                                    <Brain size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </div>
                                <h4 className="font-bold text-white text-[13px] sm:text-sm">AI Explainer (MCP)</h4>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed font-medium">
                                Untrusted intelligence. Generates creative technical explanations, but can make mistakes.
                            </p>
                        </div>

                        <div className="p-3 sm:p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                                    <ShieldCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </div>
                                <h4 className="font-bold text-white text-[13px] sm:text-sm">Validation Gate</h4>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed font-medium">
                                Strict authority. Checks structure and terminology. Blocks invalid explanations before they render.
                            </p>
                        </div>
                    </div>

                    {/* Highlighted Rule */}
                    <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700">
                        <p className="text-[10px] text-slate-300 font-medium">
                            <span className="text-lingo font-bold uppercase tracking-tighter">Rule:</span> If Lingo detects a violation, the explanation is never shown.
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                onStartGuidedTour();
                                onDismiss();
                            }}
                            className="flex flex-col items-center justify-center gap-2 py-4 bg-gradient-to-br from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20 group transform-gpu active:scale-[0.98] border-2 border-violet-400/50"
                        >
                            <div className="flex items-center gap-2">
                                <Play size={18} />
                                <span>Guided Tour</span>
                            </div>
                            <span className="text-[10px] opacity-80 font-normal">Perfect for judges</span>
                        </button>
                        <button
                            onClick={onDismiss}
                            className="flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-600 group transform-gpu active:scale-[0.98]"
                        >
                            Skip to Lab
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Instruction Note */}
                    <div className="flex items-center gap-2 justify-center text-[10px] text-slate-600 font-medium pb-2">
                        <Zap size={10} className="text-amber-500/50" />
                        Tip: You can simulate validation failures to test the gate.
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
