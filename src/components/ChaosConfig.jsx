import React, { useState, useEffect } from 'react';
import { Settings, Zap, Play, Plus, Trash2, Shield, Info, ToggleLeft, ToggleRight, FlaskConical, GripVertical, CheckCircle2, HelpCircle, RotateCcw, Save, Upload, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const DEFAULT_CONFIG = {
    passes: {
        numberEncoding: true,
        substitution: true,
        opaquePredicates: true,
        flattening: true
    },
    customRules: []
};

const DEMO_PRESETS = {
    arithmeticChaos: {
        name: 'Arithmetic Chaos',
        icon: Zap,
        color: 'amber',
        config: {
            passes: {
                numberEncoding: true,
                substitution: true,
                opaquePredicates: false,
                flattening: false
            },
            customRules: [
                { id: Date.now() + 1, source: 'ADD', target: 'XOR, AND, MUL' },
                { id: Date.now() + 2, source: 'SUB', target: 'ADD, NEG' }
            ]
        }
    },
    controlFlowChaos: {
        name: 'Control Flow Chaos',
        icon: Shield,
        color: 'blue',
        config: {
            passes: {
                numberEncoding: false,
                substitution: false,
                opaquePredicates: true,
                flattening: true
            },
            customRules: []
        }
    },
    heavyObfuscation: {
        name: 'Heavy Obfuscation',
        icon: FlaskConical,
        color: 'violet',
        config: {
            passes: {
                numberEncoding: true,
                substitution: true,
                opaquePredicates: true,
                flattening: true
            },
            customRules: [
                { id: Date.now() + 3, source: 'ADD', target: 'XOR, AND, MUL, ADD' },
                { id: Date.now() + 4, source: 'MUL', target: 'ADD, ADD, ADD' }
            ]
        }
    }
};

export const ChaosConfig = ({ config, setConfig, ruleHits = {} }) => {
    const [newRule, setNewRule] = useState({ source: 'ADD', target: 'XOR, AND, MUL' });
    const [savedPresets, setSavedPresets] = useState([]);
    const [presetName, setPresetName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Load saved presets from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('chaosPresets');
        if (stored) {
            try {
                setSavedPresets(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to load presets:', e);
            }
        }
    }, []);

    const savePreset = () => {
        if (!presetName.trim()) return;
        const newPreset = {
            id: Date.now(),
            name: presetName,
            config: JSON.parse(JSON.stringify(config))
        };
        const updated = [...savedPresets, newPreset];
        setSavedPresets(updated);
        localStorage.setItem('chaosPresets', JSON.stringify(updated));
        setPresetName('');
        setShowSaveDialog(false);
    };

    const loadPreset = (preset) => {
        setConfig(JSON.parse(JSON.stringify(preset.config)));
    };

    const deletePreset = (id) => {
        const updated = savedPresets.filter(p => p.id !== id);
        setSavedPresets(updated);
        localStorage.setItem('chaosPresets', JSON.stringify(updated));
    };

    const resetToDefault = () => {
        setConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    };

    const applyDemoPreset = (presetKey) => {
        const preset = DEMO_PRESETS[presetKey];
        if (preset) {
            setConfig(JSON.parse(JSON.stringify(preset.config)));
        }
    };

    const togglePass = (pass) => {
        setConfig(prev => ({
            ...prev,
            passes: {
                ...prev.passes,
                [pass]: !prev.passes[pass]
            }
        }));
    };

    const addRule = () => {
        if (!newRule.source || !newRule.target) return;
        setConfig(prev => ({
            ...prev,
            customRules: [...prev.customRules, { ...newRule, id: Date.now() }]
        }));
        setNewRule({ source: 'ADD', target: 'XOR, AND, MUL' });
    };

    const removeRule = (id) => {
        setConfig(prev => ({
            ...prev,
            customRules: prev.customRules.filter(r => r.id !== id)
        }));
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(config.customRules);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setConfig(prev => ({
            ...prev,
            customRules: items
        }));
    };

    const passIcons = {
        numberEncoding: Zap,
        substitution: FlaskConical,
        opaquePredicates: Shield,
        flattening: Play
    };

    const passLabels = {
        numberEncoding: 'Data Encoding',
        substitution: 'Substitutions',
        opaquePredicates: 'Opaque Flow',
        flattening: 'CF Flattening'
    };

    const mutationSteps = Object.keys(config.passes);

    return (
        <div className="space-y-8">
            {/* Demo Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(DEMO_PRESETS).map(([key, preset]) => {
                    const Icon = preset.icon;
                    const colorClasses = {
                        amber: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-400',
                        blue: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400',
                        violet: 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 text-violet-400'
                    };
                    return (
                        <motion.button
                            key={key}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applyDemoPreset(key)}
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${colorClasses[preset.color]}`}
                        >
                            <div className="p-2 bg-black/20 rounded-lg">
                                <Icon size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold">{preset.name}</div>
                                <div className="text-[10px] opacity-60 uppercase tracking-wider">Quick Apply</div>
                            </div>
                            <Sparkles size={14} className="ml-auto opacity-40" />
                        </motion.button>
                    );
                })}
            </div>

            {/* Pipeline Step Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Automated Pipeline Stages</span>
                </div>
                <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>

            {/* Pipeline Steps - Numbered Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {mutationSteps.map((pass, index) => {
                    const Icon = passIcons[pass];
                    const isActive = config.passes[pass];
                    const stepNum = index + 1;

                    return (
                        <div key={pass} className="relative group">
                            {/* Connector Line */}
                            {index < mutationSteps.length - 1 && (
                                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-[1px] bg-slate-800 z-0" />
                            )}

                            <motion.button
                                whileHover={{ y: -2 }}
                                onClick={() => togglePass(pass)}
                                className={`
                                    relative w-full flex flex-col items-start p-5 rounded-2xl border transition-all z-10
                                    ${isActive
                                        ? 'bg-slate-900/60 border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.05)] text-white'
                                        : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between w-full mb-4">
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono
                                        ${isActive ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-600'}
                                    `}>
                                        0{stepNum}
                                    </div>
                                    {isActive ? <ToggleRight size={24} className="text-violet-400" /> : <ToggleLeft size={24} className="text-slate-700" />}
                                </div>

                                <div className="flex items-center gap-2 mb-1">
                                    <Icon size={14} className={isActive ? 'text-violet-400' : 'text-slate-600'} />
                                    <span className="text-xs font-bold tracking-wide">{passLabels[pass]}</span>
                                </div>
                                <span className="text-[10px] opacity-40 uppercase tracking-widest font-medium">Stage {stepNum} Pass</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="glow"
                                        className="absolute inset-0 rounded-2xl bg-violet-500/5 pointer-events-none"
                                    />
                                )}
                            </motion.button>
                        </div>
                    );
                })}
            </div>

            {/* Custom Rules Section Header */}
            <div className="flex items-center justify-between px-2 pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Manual Mutation Overrides</span>
                </div>
                <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-slate-800 to-transparent" />
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSaveDialog(!showSaveDialog)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                        <Save size={12} />
                        Save
                    </button>
                    <button
                        onClick={resetToDefault}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-transparent hover:border-rose-500/30"
                    >
                        <RotateCcw size={12} />
                        Reset
                    </button>
                </div>
            </div>

            {/* Save Preset Dialog */}
            <AnimatePresence>
                {showSaveDialog && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-panel p-5 bg-slate-950/60 border-emerald-500/30"
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && savePreset()}
                                placeholder="Preset name..."
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                autoFocus
                            />
                            <button
                                onClick={savePreset}
                                disabled={!presetName.trim()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                Save Preset
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Saved Presets */}
            {savedPresets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {savedPresets.map(preset => (
                        <div
                            key={preset.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg group hover:border-emerald-500/30 transition-all"
                        >
                            <button
                                onClick={() => loadPreset(preset)}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-all"
                            >
                                <Upload size={12} />
                                {preset.name}
                            </button>
                            <button
                                onClick={() => deletePreset(preset.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-500 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Rules Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Side */}
                <div className="lg:col-span-4 space-y-5 glass-panel p-6 bg-slate-950/40 border-slate-800">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Source Operation</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newRule.source}
                                    onChange={e => setNewRule(prev => ({ ...prev, source: e.target.value.toUpperCase() }))}
                                    placeholder="e.g. ADD"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-700"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700 font-mono">OP_IN</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mutation Target Sequence</label>
                            <textarea
                                value={newRule.target}
                                onChange={e => setNewRule(prev => ({ ...prev, target: e.target.value.toUpperCase() }))}
                                placeholder="XOR, AND, MUL"
                                rows={2}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none placeholder:text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live Transformation Preview</span>
                            <HelpCircle size={12} className="text-slate-700" />
                        </div>
                        <div className="font-mono text-[11px] space-y-1.5 leading-relaxed">
                            <div className="text-slate-500 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                {newRule.source || 'OP'} a, b
                            </div>
                            <div className="text-violet-400 pl-4 border-l border-slate-800 flex flex-col gap-1">
                                {(newRule.target || 'TARGET').split(',').map((op, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <ArrowRight size={10} className="text-slate-700" />
                                        <span>{op.trim() || '...'} {i === (newRule.target.split(',').length - 1) ? 'result' : `tmp_${i}`}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={addRule}
                        className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-violet-900/20 flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Deploy Rule
                    </motion.button>
                </div>

                {/* Rules List Side */}
                <div className="lg:col-span-8 flex flex-col">
                    <div className="flex-1 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="rules">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                        <AnimatePresence mode="popLayout">
                                            {config.customRules.length === 0 ? (
                                                <motion.div
                                                    key="empty"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="h-full flex flex-col items-center justify-center bg-slate-950/20 border-2 border-dashed border-slate-800 rounded-3xl p-10 grayscale opacity-40"
                                                >
                                                    <FlaskConical size={48} strokeWidth={1} className="mb-4 text-slate-500" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Laboratory Empty</p>
                                                    <p className="text-[10px] text-slate-600 mt-2">Deploy mutations to overwrite system logic</p>
                                                </motion.div>
                                            ) : (
                                                config.customRules.map((rule, index) => {
                                                    const hitCount = ruleHits[rule.id] || 0;
                                                    const isApplied = hitCount > 0;
                                                    return (
                                                        <Draggable key={rule.id} draggableId={String(rule.id)} index={index}>
                                                            {(provided, snapshot) => (
                                                                <motion.div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    layout
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className={`group flex items-center justify-between p-4 bg-slate-900/40 border rounded-2xl transition-all shadow-sm ${snapshot.isDragging ? 'border-violet-500 bg-slate-900 z-50 shadow-2xl' : 'border-slate-800 hover:border-violet-500/30'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div
                                                                            {...provided.dragHandleProps}
                                                                            className="text-slate-700 hover:text-slate-400 cursor-grab active:cursor-grabbing p-1"
                                                                        >
                                                                            <GripVertical size={18} />
                                                                        </div>

                                                                        <div className="flex items-center gap-3">
                                                                            <div className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[11px] font-mono font-bold text-violet-400">
                                                                                {rule.source}
                                                                            </div>
                                                                            <ArrowRight size={14} className="text-slate-700" />
                                                                            <div className="flex items-center gap-1.5 text-ellipsis overflow-hidden">
                                                                                {rule.target.split(',').map((op, i) => (
                                                                                    <span key={i} className="px-2 py-0.5 bg-slate-950 rounded-md text-[10px] font-mono text-slate-300 border border-slate-800 whitespace-nowrap">
                                                                                        {op.trim()}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-4 ml-4">
                                                                        {/* Status Badge */}
                                                                        <div className={`
                                                                            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
                                                                            ${isApplied
                                                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                                                : 'bg-slate-800/50 text-slate-500 border border-slate-800'
                                                                            }
                                                                        `}>
                                                                            {isApplied ? (
                                                                                <>
                                                                                    <CheckCircle2 size={10} />
                                                                                    Applied ({hitCount} {hitCount === 1 ? 'hit' : 'hits'})
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                                                                    Inactive
                                                                                </>
                                                                            )}
                                                                        </div>

                                                                        <button
                                                                            onClick={() => removeRule(rule.id)}
                                                                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })
                                            )}
                                        </AnimatePresence>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ArrowRight = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);
