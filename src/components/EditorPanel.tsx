import { useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, Sparkles, RotateCcw, Code2, GitBranch, X } from 'lucide-react';
import { useCompilerStore } from '../store';
import { useI18n } from '../i18n/LanguageProvider';
import { ParseTreeCard } from './ParseTree.tsx';
import { StudentExplanation } from './StudentExplanation.tsx';

export function EditorPanel() {
  const { t } = useI18n();
  const {
    code,
    setCode,
    intensity,
    setIntensity,
    isCompiling,
    isCompiled,
    compilationError,
    compile,
    reset,
    chaosConfig,
    ast,
    mode,
  } = useCompilerStore();

  const [showParseTree, setShowParseTree] = useState(false);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        setCode(value);
      }
    },
    [setCode]
  );

  const handleCompile = useCallback(() => {
    setShowParseTree(false);
    compile();
  }, [compile]);

  return (
    <div className="space-y-4">
      {/* Compilation Progress Indicator */}
      <AnimatePresence>
        {isCompiling && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-indigo-300">
                    Compiling Your Code...
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Running lexer → parser → IR generation → chaos transformations → verification
                  </div>
                </div>
              </div>
              {/* Progress bar animation */}
              <div className="mt-3 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Intensity Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{t('ui.intensity', 'Intensity')}:</span>
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(['none', 'low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setIntensity(level)}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-colors
                  ${intensity === level
                    ? level === 'none'
                      ? 'bg-slate-500/20 text-slate-400'
                      : level === 'low'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : level === 'medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                {t(`ui.${level}`, level.charAt(0).toUpperCase() + level.slice(1))}
              </button>
            ))}
          </div>
        </div>

        {/* Active Passes Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Active:</span>
          {Object.entries(chaosConfig.passes)
            .filter(([, enabled]) => enabled)
            .map(([pass]) => (
              <span
                key={pass}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-400"
              >
                {pass.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={!isCompiled}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium
              text-slate-400 hover:text-slate-200 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('ui.reset', 'Reset')}
          </button>

          <motion.button
            onClick={handleCompile}
            disabled={isCompiling}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
              transition-all duration-200 shadow-lg
              ${isCompiling
                ? 'bg-slate-700 text-slate-300 cursor-wait'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
              }
            `}
          >
            {isCompiling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('ui.compiling', 'Compiling...')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('ui.apply_chaos', 'Apply Chaos')}
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Error Display */}
      {compilationError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <div className="flex items-center gap-2 text-red-400">
            <Code2 className="w-4 h-4" />
            <span className="font-medium">Compilation Error</span>
          </div>
          <pre className="mt-2 text-sm text-red-300 font-mono whitespace-pre-wrap">
            {compilationError}
          </pre>
        </motion.div>
      )}

      {/* Monaco Editor */}
      <div className="rounded-lg overflow-hidden border border-slate-800">
        <Editor
          height="500px"
          defaultLanguage="c"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            minimap: { enabled: false },
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 16, bottom: 16 },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>

      {/* Success State */}
      {isCompiled && !compilationError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Play className="w-4 h-4" />
                <span className="font-medium">Compilation Successful</span>
              </div>
              <p className="mt-1 text-sm text-emerald-300/70">
                Check the Timeline tab to see transformation snapshots.
              </p>
            </div>
            <button
              onClick={() => setShowParseTree(!showParseTree)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              {showParseTree ? 'Hide' : 'Show'} Parse Tree
            </button>
          </div>
        </motion.div>
      )}

      {/* Parse Tree Display */}
      <AnimatePresence>
        {showParseTree && isCompiled && ast && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
          >
            <button
              onClick={() => setShowParseTree(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="h-[600px]">
              <ParseTreeCard ast={ast} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Mode Explanations */}
      {mode === 'student' && isCompiled && !compilationError && (
        <StudentExplanation />
      )}
    </div>
  );
}
