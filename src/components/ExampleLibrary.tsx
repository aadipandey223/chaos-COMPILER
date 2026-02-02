
import { motion } from 'framer-motion';
import { BookOpen, Code2, ArrowRight } from 'lucide-react';
import { useCompilerStore, EXAMPLES, ExampleKey } from '../store';

export function ExampleLibrary() {
  const { code, loadExample } = useCompilerStore();

  const examples = Object.entries(EXAMPLES) as [ExampleKey, typeof EXAMPLES[ExampleKey]][];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-300">
        <BookOpen className="w-4 h-4" />
        <h3 className="text-sm font-medium">Example Library</h3>
      </div>

      <div className="space-y-2">
        {examples.map(([key, example]) => {
          const isActive = code === example.code;
          return (
            <motion.button
              key={key}
              onClick={() => loadExample(key)}
              whileHover={{ x: 4 }}
              className={`
                w-full p-3 rounded-lg text-left transition-colors
                ${
                  isActive
                    ? 'bg-indigo-500/20 border border-indigo-500/30'
                    : 'bg-slate-800/30 border border-transparent hover:border-slate-700'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{example.icon}</span>
                {isActive && <ArrowRight className="w-4 h-4 text-indigo-400" />}
              </div>
              <div className="mt-2">
                <span
                  className={`
                    text-sm font-medium
                    ${isActive ? 'text-indigo-300' : 'text-slate-300'}
                  `}
                >
                  {example.label}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">{example.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Learning Tips */}
      <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-2 text-indigo-400 mb-2">
          <Code2 className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">How It Works</span>
        </div>
        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
          <li>Select an example or write code</li>
          <li>Choose transformation intensity</li>
          <li>Click "Apply Chaos" to compile</li>
          <li>Explore the Timeline tab for diffs</li>
          <li>Check Diagnostics for validation</li>
        </ol>
      </div>
    </div>
  );
}
