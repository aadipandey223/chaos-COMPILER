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
} from 'lucide-react';
import { useCompilerStore, useUIStore } from '../store';
import { IRInstruction } from '../types';

export function TransformationTimeline() {
  const { snapshots, isCompiled, originalIR } = useCompilerStore();
  const { selectedSnapshotIndex, setSelectedSnapshotIndex } = useUIStore();

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
