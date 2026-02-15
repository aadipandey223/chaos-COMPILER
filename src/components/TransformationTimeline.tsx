import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowRight,
  Plus,
  Minus,
  Equal,
  Sparkles,
  X,
  XCircle,
  BookOpen,
  Zap,
  Loader2,
} from 'lucide-react';
import { useCompilerStore, useUIStore } from '../store';
import { IRInstruction } from '../types';
import { irExplainer, IRExplanation } from '../lingo/ir-explainer';

export function TransformationTimeline() {
  const { snapshots, isCompiled, originalIR, intensity, mode } = useCompilerStore();
  const { selectedSnapshotIndex, setSelectedSnapshotIndex } = useUIStore();
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<IRExplanation | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  const handleExplainClick = async () => {
    setShowExplanation(true);
    setIsLoadingExplanation(true);
    
    try {
      const result = await irExplainer.generateExplanation(
        originalIR,
        snapshots,
        intensity,
        mode
      );
      setExplanation(result);
    } catch (error) {
      console.error('[IR Explainer] Failed to generate explanation:', error);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  if (!isCompiled || snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Layers className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Transformations Yet</p>
        <p className="text-sm mt-1">Compile your code to see the transformation timeline</p>
      </div>
    );
  }

  const currentSnapshot = snapshots[selectedSnapshotIndex];
  const previousSnapshot = selectedSnapshotIndex > 0 ? snapshots[selectedSnapshotIndex - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header with AI Explain Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-indigo-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">IR Transformation Timeline</h2>
            <p className="text-sm text-slate-400">Step-by-step code evolution</p>
          </div>
        </div>
        <button
          onClick={handleExplainClick}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 
            hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-all shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          AI Explain Everything
        </button>
      </div>

      {/* AI Explanation Modal */}
      <AnimatePresence>
        {showExplanation && (
          <AIExplanationModal
            explanation={explanation}
            isLoading={isLoadingExplanation}
            onClose={() => setShowExplanation(false)}
            mode={mode}
          />
        )}
      </AnimatePresence>

      {/* Timeline Stepper */}
      <div className="relative">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {snapshots.map((snapshot, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => setSelectedSnapshotIndex(index)}
                className={`
                  flex flex-col items-center min-w-[120px] p-3 rounded-lg
                  transition-all duration-200
                  ${
                    index === selectedSnapshotIndex
                      ? 'bg-indigo-500/20 border-2 border-indigo-500'
                      : 'bg-slate-800/50 border-2 border-transparent hover:border-slate-700'
                  }
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${
                      index === selectedSnapshotIndex
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }
                  `}
                >
                  {index}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${index === selectedSnapshotIndex ? 'text-indigo-300' : 'text-slate-400'}
                  `}
                >
                  {snapshot.name}
                </span>
              </button>
              {index < snapshots.length - 1 && (
                <ArrowRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedSnapshotIndex(Math.max(0, selectedSnapshotIndex - 1))}
          disabled={selectedSnapshotIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 
            hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <div className="text-sm text-slate-500">
          Step {selectedSnapshotIndex + 1} of {snapshots.length}
        </div>
        <button
          onClick={() =>
            setSelectedSnapshotIndex(Math.min(snapshots.length - 1, selectedSnapshotIndex + 1))
          }
          disabled={selectedSnapshotIndex === snapshots.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 
            hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Pass Description */}
      {currentSnapshot.passDescription && (
        <motion.div
          key={selectedSnapshotIndex}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
        >
          <h3 className="font-medium text-indigo-300">{currentSnapshot.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{currentSnapshot.passDescription}</p>
        </motion.div>
      )}

      {/* IR Diff View */}
      <div className="grid grid-cols-2 gap-4">
        <IRViewer
          title={previousSnapshot ? previousSnapshot.name : 'Original'}
          ir={previousSnapshot ? previousSnapshot.ir : originalIR}
          isBase
        />
        <IRViewer
          title={currentSnapshot.name}
          ir={currentSnapshot.ir}
          compareWith={previousSnapshot?.ir ?? originalIR}
        />
      </div>

      {/* Statistics */}
      <IRStatistics
        previous={previousSnapshot?.ir ?? originalIR}
        current={currentSnapshot.ir}
      />
    </div>
  );
}

// ============================================================================
// IR VIEWER COMPONENT
// ============================================================================

interface IRViewerProps {
  title: string;
  ir: IRInstruction[];
  isBase?: boolean;
  compareWith?: IRInstruction[];
}

function IRViewer({ title, ir, isBase, compareWith }: IRViewerProps) {
  const [expanded, setExpanded] = useState(true);

  const diff = useMemo(() => {
    if (!compareWith) return new Set<number>();
    const prevStrings = new Set(compareWith.map((i) => JSON.stringify(i)));
    const diffIndices = new Set<number>();
    ir.forEach((instr, idx) => {
      if (!prevStrings.has(JSON.stringify(instr))) {
        diffIndices.add(idx);
      }
    });
    return diffIndices;
  }, [ir, compareWith]);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
      <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 font-mono text-xs max-h-96 overflow-auto">
              {ir.map((instr, idx) => (
                <IRInstructionLine
                  key={idx}
                  instruction={instr}
                  lineNumber={idx + 1}
                  isNew={!isBase && diff.has(idx)}
                />
              ))}
              {ir.length === 0 && (
                <span className="text-slate-600 italic">No instructions</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// IR INSTRUCTION LINE
// ============================================================================

interface IRInstructionLineProps {
  instruction: IRInstruction;
  lineNumber: number;
  isNew?: boolean;
}

function IRInstructionLine({ instruction, lineNumber, isNew }: IRInstructionLineProps) {
  const formatted = formatInstruction(instruction);

  return (
    <div
      className={`
        flex items-start gap-2 py-0.5 rounded px-1 -mx-1
        ${isNew ? 'bg-emerald-500/10' : ''}
      `}
    >
      <span className="text-slate-600 w-6 text-right flex-shrink-0">{lineNumber}</span>
      {isNew && <Plus className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />}
      <span
        className={`
          ${isNew ? 'text-emerald-300' : 'text-slate-300'}
          ${instruction.meta?.startsWith('CHAOS_') ? 'text-amber-300' : ''}
        `}
      >
        {formatted}
      </span>
    </div>
  );
}

function formatInstruction(instr: IRInstruction): string {
  switch (instr.op) {
    case 'ASSIGN':
      return `${instr.target} = ${instr.value}`;
    case 'ADD':
    case 'SUB':
    case 'MUL':
    case 'DIV':
    case 'MOD':
    case 'AND':
    case 'OR':
    case 'XOR':
      return `${instr.target} = ${instr.left} ${instr.op} ${instr.right}`;
    case 'LESS':
      return `${instr.target} = ${instr.left} < ${instr.right}`;
    case 'GREATER':
      return `${instr.target} = ${instr.left} > ${instr.right}`;
    case 'EQUAL':
      return `${instr.target} = ${instr.left} == ${instr.right}`;
    case 'PRINT':
      return `PRINT ${instr.value}`;
    case 'RETURN':
      return `RETURN ${instr.value}`;
    case 'IF':
      return `IF (${JSON.stringify(instr.test)}) { ... }`;
    case 'WHILE':
      return `WHILE (${JSON.stringify(instr.test)}) { ... }`;
    case 'SWITCH':
      return `SWITCH (${instr.value}) { ${instr.cases?.length ?? 0} cases }`;
    default:
      return JSON.stringify(instr);
  }
}

// ============================================================================
// IR STATISTICS
// ============================================================================

interface IRStatisticsProps {
  previous: IRInstruction[];
  current: IRInstruction[];
}

function IRStatistics({ previous, current }: IRStatisticsProps) {
  const prevCount = countInstructions(previous);
  const currCount = countInstructions(current);
  const diff = currCount - prevCount;

  return (
    <div className="flex items-center gap-6 p-4 rounded-lg bg-slate-800/30">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Previous:</span>
        <span className="font-mono text-slate-300">{prevCount}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Current:</span>
        <span className="font-mono text-slate-300">{currCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Δ:</span>
        <span
          className={`
            font-mono flex items-center gap-1
            ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'}
          `}
        >
          {diff > 0 ? <Plus className="w-3 h-3" /> : diff < 0 ? <Minus className="w-3 h-3" /> : <Equal className="w-3 h-3" />}
          {Math.abs(diff)}
        </span>
      </div>
    </div>
  );
}

function countInstructions(ir: IRInstruction[]): number {
  let count = 0;
  for (const instr of ir) {
    count++;
    if (instr.consequent) count += countInstructions(instr.consequent);
    if (instr.alternate) count += countInstructions(instr.alternate);
    if (instr.body) count += countInstructions(instr.body);
  }
  return count;
}

// ============================================================================
// AI EXPLANATION MODAL
// ============================================================================

interface AIExplanationModalProps {
  explanation: IRExplanation | null;
  isLoading: boolean;
  onClose: () => void;
  mode: 'student' | 'researcher';
}

function AIExplanationModal({ explanation, isLoading, onClose, mode }: AIExplanationModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI-Powered IR Explanation</h2>
              <p className="text-sm text-slate-400">Deep dive into your code transformations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-200">Generating AI Explanation...</p>
                <p className="text-sm text-slate-400 mt-2">Analyzing your code transformations</p>
              </div>
            </div>
          ) : explanation ? (
            <div className="space-y-6">
              {/* Overview */}
              <section className="p-5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-indigo-300">Overview</h3>
                </div>
                <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {explanation.overview}
                </div>
              </section>

              {/* How IR Works */}
              <section className="p-5 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-emerald-300">How IR Works</h3>
                </div>
                <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {explanation.howIRWorks}
                </div>
              </section>

              {/* Current State */}
              <section className="p-5 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-purple-300">Current State</h3>
                </div>
                <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {explanation.currentState}
                </div>
              </section>

              {/* Transformation Steps */}
              <section className="p-5 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-amber-300">Transformation Steps</h3>
                </div>
                <div className="space-y-3">
                  {explanation.transformationSteps.map((step, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-amber-300">
                          Step {step.stepNumber}: {step.passName}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          step.addedInstructions > 0 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {step.addedInstructions > 0 ? '+' : ''}{step.addedInstructions} instructions
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{step.description}</p>
                      <p className="text-sm text-slate-300">{step.impact}</p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>Before: {step.instructionsBefore}</span>
                        <span>→</span>
                        <span>After: {step.instructionsAfter}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Chaos Analysis */}
              <section className="p-5 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-300">Chaos Analysis</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Intensity</div>
                    <div className="text-lg font-semibold text-slate-200">
                      {explanation.chaosAnalysis.intensity.toUpperCase()}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Obfuscation Level</div>
                    <div className="text-lg font-semibold text-slate-200">
                      {explanation.chaosAnalysis.obfuscationLevel.toUpperCase()}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Complexity Increase</div>
                    <div className="text-lg font-semibold text-emerald-400">
                      {explanation.chaosAnalysis.complexity.increase}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Semantic Preservation</div>
                    <div className={`text-lg font-semibold ${
                      explanation.chaosAnalysis.semanticPreservation 
                        ? 'text-emerald-400' 
                        : 'text-red-400'
                    }`}>
                      {explanation.chaosAnalysis.semanticPreservation ? '✓ VERIFIED' : '✗ FAILED'}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-slate-400 mb-2">Applied Passes:</div>
                  <div className="flex flex-wrap gap-2">
                    {explanation.chaosAnalysis.appliedPasses.map((pass, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-800 border border-slate-600 rounded-full text-xs text-slate-300"
                      >
                        {pass}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Educational Tips */}
              <section className="p-5 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-300">
                    {mode === 'student' ? 'Learning Tips' : 'Advanced Tips'}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {explanation.educationalTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 font-bold mt-0.5">{index + 1}.</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Technical Details (for researchers) */}
              {mode === 'researcher' && (
                <section className="p-5 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-cyan-300">Technical Details</h3>
                  </div>
                  <div className="grid gap-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-300 mb-1">IR Basics</div>
                      <div className="text-slate-400">{explanation.technicalDetails.irBasics}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-300 mb-1">Three-Address Code</div>
                      <div className="text-slate-400">{explanation.technicalDetails.threeAddressCode}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-300 mb-1">SSA Form</div>
                      <div className="text-slate-400">{explanation.technicalDetails.ssaForm}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-300 mb-1">Control Flow Graph</div>
                      <div className="text-slate-400">{explanation.technicalDetails.controlFlowGraph}</div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
              <XCircle className="w-12 h-12" />
              <p>Failed to generate explanation</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

