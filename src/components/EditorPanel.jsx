import React from 'react';
import { Code2, Zap, Sparkles, RotateCcw, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';

export const EditorPanel = ({
    code,
    setCode,
    intensity,
    setIntensity,
    onCompile,
    onFormat,
    onLoadExample,
    isCompiling,
    copiedCode,
    onCopyCode,
    lingoValid
}) => {
    return (
        <div className="glass-panel h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <Code2 size={18} className="text-mcp" />
                    <span className="text-sm font-semibold">C</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCopyCode}
                        className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all"
                    >
                        {copiedCode ? <Check size={16} className="text-lingo" /> : <Copy size={16} />}
                    </button>
                    <button
                        onClick={onLoadExample}
                        className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 hover:border-mcp transition-all"
                    >
                        Load Example
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden flex">
                <div
                    className="bg-slate-950 text-slate-600 text-right pr-4 pl-4 py-5 select-none font-mono text-xs border-r border-slate-800"
                    style={{ minWidth: '50px' }}
                >
                    {code.split('\n').map((_, i) => (
                        <div key={i} className="leading-relaxed">{i + 1}</div>
                    ))}
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar bg-slate-950">
                    <Editor
                        value={code}
                        onValueChange={setCode}
                        highlight={code => Prism.highlight(code, Prism.languages.c || Prism.languages.clike, 'c')}
                        padding={20}
                        style={{
                            fontFamily: '"Fira Code", "Fira Mono", monospace',
                            fontSize: 13,
                            backgroundColor: 'transparent',
                            color: '#94a3b8',
                            minHeight: '100%',
                        }}
                        textareaClassName="focus:outline-none leading-relaxed"
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="p-5 border-t border-slate-700 space-y-4">
                {/* Intensity Control */}
                <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-400 font-medium">Chaos Intensity</label>
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        {['low', 'medium', 'high'].map((level) => (
                            <button
                                key={level}
                                onClick={() => setIntensity(level)}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${intensity === level
                                    ? 'bg-mcp text-white shadow-lg'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onFormat}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                    >
                        <Sparkles size={16} />
                        Beautify
                    </button>
                    <button
                        onClick={onCompile}
                        disabled={isCompiling}
                        className={`flex-[2] flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${isCompiling
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-mcp text-white hover:bg-violet-600 mcp-glow'
                            }`}
                    >
                        {isCompiling ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                                Compiling...
                            </>
                        ) : (
                            <>
                                <Zap size={16} />
                                Compile & Chaos
                            </>
                        )}
                    </button>
                </div>

                {/* Lingo Status */}
                {lingoValid !== undefined && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium ${lingoValid
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${lingoValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {lingoValid ? 'Lingo Verified' : 'Validation Failed'}
                    </motion.div>
                )}
            </div>
        </div>
    );
};
