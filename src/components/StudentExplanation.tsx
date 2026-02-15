import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Lightbulb, Code2, Zap } from 'lucide-react';
import { useCompilerStore } from '../store';

export function StudentExplanation() {
  const { isCompiled, snapshots, executionResult, intensity } = useCompilerStore();

  if (!isCompiled) return null;

  const getIntensityExplanation = () => {
    switch (intensity) {
      case 'none':
        return 'No transformations applied. The code remains as written.';
      case 'low':
        return 'Light transformations: Basic number encoding to make constants less obvious.';
      case 'medium':
        return 'Moderate transformations: Number encoding + instruction substitution. Code becomes harder to read.';
      case 'high':
        return 'Heavy transformations: All passes enabled including control flow flattening. Maximum obfuscation while preserving semantics.';
    }
  };

  const getTransformationCount = () => {
    return snapshots.length - 1; // Subtract original snapshot
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4"
      >
        {/* What Happened Card */}
        <div className="p-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-300">What Just Happened?</h3>
              <p className="text-sm text-slate-400">Understanding Your Compilation</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Intensity Level: {intensity.toUpperCase()}
              </div>
              <p className="text-slate-400">{getIntensityExplanation()}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Transformations Applied
              </div>
              <p className="text-slate-400">
                Your code went through {getTransformationCount()} transformation{getTransformationCount() !== 1 ? 's' : ''}.
                Each transformation changes how the code looks while keeping what it does exactly the same.
              </p>
            </div>

            {executionResult && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="font-semibold text-purple-300 mb-2">
                  Semantic Preservation
                </div>
                <p className="text-slate-400">
                  Original result: <code className="px-2 py-0.5 bg-slate-700 rounded text-emerald-400">{executionResult.original}</code>
                  {' → '}
                  Transformed result: <code className="px-2 py-0.5 bg-slate-700 rounded text-emerald-400">{executionResult.transformed}</code>
                </p>
                <p className="text-slate-400 mt-2">
                  {executionResult.match ? (
                    <span className="text-emerald-400">✓ Results match! The transformation preserved the program's behavior.</span>
                  ) : (
                    <span className="text-red-400">✗ Results differ! This shouldn't happen - the transformation failed to preserve semantics.</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Tips */}
        <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Learning Tips</h3>
          </div>

          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold mt-0.5">1.</span>
              <p>
                <strong className="text-slate-300">Check the Timeline tab</strong> to see step-by-step 
                what happened to your code at each transformation stage.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold mt-0.5">2.</span>
              <p>
                <strong className="text-slate-300">Try different intensity levels</strong> to see how 
                aggressive transformations affect complexity.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold mt-0.5">3.</span>
              <p>
                <strong className="text-slate-300">Look at the Diagnostics tab</strong> for detailed 
                information about each transformation pass.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold mt-0.5">4.</span>
              <p>
                <strong className="text-slate-300">Switch to Researcher mode</strong> (top right) to 
                access advanced chaos orchestration controls.
              </p>
            </div>
          </div>
        </div>

        {/* Compiler Stages Explanation */}
        <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Compiler Pipeline Stages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <div className="font-semibold text-blue-300 mb-1">1. Lexer</div>
              <p className="text-slate-400">Breaks code into tokens (keywords, operators, numbers)</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <div className="font-semibold text-purple-300 mb-1">2. Parser</div>
              <p className="text-slate-400">Builds abstract syntax tree (AST) from tokens</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <div className="font-semibold text-emerald-300 mb-1">3. IR Generator</div>
              <p className="text-slate-400">Creates intermediate representation for transformations</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <div className="font-semibold text-amber-300 mb-1">4. Chaos Engine</div>
              <p className="text-slate-400">Applies obfuscation transformations to IR</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
