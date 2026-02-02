import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Settings,
  Plus,
  Trash2,
  GripVertical,
  Zap,
  Shield,
  Shuffle,
  Binary,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useCompilerStore } from '../store';
import { ChaosPreset } from '../compiler/chaos-engine';
import { CustomRule } from '../types';

const PRESET_CONFIG: { key: ChaosPreset; label: string; icon: typeof Zap; color: string }[] = [
  { key: 'arithmeticChaos', label: 'Arithmetic Chaos', icon: Binary, color: 'amber' },
  { key: 'controlFlowChaos', label: 'Control Flow', icon: Shuffle, color: 'blue' },
  { key: 'heavyObfuscation', label: 'Heavy Obfuscation', icon: Shield, color: 'purple' },
];

export function ChaosOrchestrator() {
  const {
    chaosConfig,
    setChaosConfig,
    applyPreset,
    resetConfig,
    ruleHits,
  } = useCompilerStore();

  const [newRule, setNewRule] = useState({ source: '', target: '' });

  const togglePass = useCallback(
    (pass: keyof typeof chaosConfig.passes) => {
      setChaosConfig({
        passes: {
          ...chaosConfig.passes,
          [pass]: !chaosConfig.passes[pass],
        },
      });
    },
    [chaosConfig.passes, setChaosConfig]
  );

  const addCustomRule = useCallback(() => {
    if (newRule.source.trim() && newRule.target.trim()) {
      const rule: CustomRule = {
        id: Date.now(),
        source: newRule.source.trim().toUpperCase(),
        target: newRule.target.trim().toUpperCase(),
      };
      setChaosConfig({
        customRules: [...chaosConfig.customRules, rule],
      });
      setNewRule({ source: '', target: '' });
    }
  }, [newRule, chaosConfig.customRules, setChaosConfig]);

  const removeRule = useCallback(
    (id: number) => {
      setChaosConfig({
        customRules: chaosConfig.customRules.filter((r) => r.id !== id),
      });
    },
    [chaosConfig.customRules, setChaosConfig]
  );

  const reorderRules = useCallback(
    (newOrder: CustomRule[]) => {
      setChaosConfig({ customRules: newOrder });
    },
    [setChaosConfig]
  );

  const updateSeed = useCallback(
    (seed: number) => {
      setChaosConfig({ seed });
    },
    [setChaosConfig]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-indigo-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Chaos Orchestrator</h2>
            <p className="text-sm text-slate-400">Advanced transformation controls</p>
          </div>
        </div>
        <button
          onClick={resetConfig}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 
            hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Quick Presets */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Quick Apply Presets
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {PRESET_CONFIG.map(({ key, label, icon: Icon, color }) => (
            <motion.button
              key={key}
              onClick={() => applyPreset(key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-lg border transition-colors text-left
                bg-${color}-500/10 border-${color}-500/30 hover:border-${color}-500/50
              `}
            >
              <Icon className={`w-5 h-5 text-${color}-400 mb-2`} />
              <span className="text-sm font-medium text-slate-200">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Pass Toggles */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Transformation Passes</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(chaosConfig.passes).map(([pass, enabled]) => (
            <button
              key={pass}
              onClick={() => togglePass(pass as keyof typeof chaosConfig.passes)}
              className={`
                p-4 rounded-lg border transition-all text-left
                ${
                  enabled
                    ? 'bg-indigo-500/20 border-indigo-500/50'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">
                  {formatPassName(pass)}
                </span>
                <div
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center
                    ${enabled ? 'bg-indigo-500' : 'bg-slate-700'}
                  `}
                >
                  {enabled && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">{getPassDescription(pass)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Seed Configuration */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Randomization Seed</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={chaosConfig.seed}
            onChange={(e) => updateSeed(parseInt(e.target.value) || 0)}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
              text-slate-200 font-mono text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Seed value"
          />
          <button
            onClick={() => updateSeed(Math.floor(Math.random() * 1000000))}
            className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm
              hover:bg-slate-600 transition-colors"
          >
            Random
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Same seed + same code = deterministic transformations
        </p>
      </div>

      {/* Custom Rules */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Custom Mutation Rules
        </h3>

        {/* Add Rule Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newRule.source}
            onChange={(e) => setNewRule({ ...newRule, source: e.target.value })}
            placeholder="Source (e.g., ADD)"
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
              text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          />
          <span className="text-slate-500 self-center">→</span>
          <input
            type="text"
            value={newRule.target}
            onChange={(e) => setNewRule({ ...newRule, target: e.target.value })}
            placeholder="Target (e.g., XOR, AND, MUL)"
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg
              text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && addCustomRule()}
          />
          <motion.button
            onClick={addCustomRule}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 bg-indigo-500 text-white rounded-lg
              hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Rules List */}
        <Reorder.Group
          axis="y"
          values={chaosConfig.customRules}
          onReorder={reorderRules}
          className="space-y-2"
        >
          <AnimatePresence>
            {chaosConfig.customRules.map((rule) => (
              <Reorder.Item
                key={rule.id}
                value={rule}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 
                  rounded-lg cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-4 h-4 text-slate-500" />
                <div className="flex-1 flex items-center gap-2">
                  <code className="px-2 py-1 bg-slate-700 rounded text-xs text-amber-300">
                    {rule.source}
                  </code>
                  <span className="text-slate-500">→</span>
                  <code className="px-2 py-1 bg-slate-700 rounded text-xs text-emerald-300">
                    {rule.target}
                  </code>
                </div>
                {ruleHits[rule.id] !== undefined && ruleHits[rule.id] > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                    ✓ {ruleHits[rule.id]} hit{ruleHits[rule.id] !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  onClick={() => removeRule(rule.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {chaosConfig.customRules.length === 0 && (
          <p className="text-center text-sm text-slate-600 py-4">
            No custom rules defined. Add one above!
          </p>
        )}
      </div>
    </div>
  );
}

function formatPassName(pass: string): string {
  return pass.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

function getPassDescription(pass: string): string {
  const descriptions: Record<string, string> = {
    numberEncoding: 'Replace constants with encoded expressions',
    substitution: 'Replace arithmetic with bitwise equivalents',
    opaquePredicates: 'Inject always-true conditions',
    flattening: 'Convert to dispatcher-based control flow',
  };
  return descriptions[pass] || '';
}
