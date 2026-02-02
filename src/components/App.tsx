import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  GitBranch,
  Layers,
  Cog,
  Zap,
  GraduationCap,
  Microscope,
  Check,
  X,
} from 'lucide-react';
import { useCompilerStore, useUIStore } from '../store';
import { EditorPanel } from './EditorPanel';
import { TransformationTimeline } from './TransformationTimeline';
import { LingoPanel } from './LingoPanel';
import { ChaosOrchestrator } from './ChaosOrchestrator';
import { SemanticVerifier } from './SemanticVerifier';
import { ExampleLibrary } from './ExampleLibrary';

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

const TABS = [
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'timeline', label: 'Timeline', icon: GitBranch },
  { id: 'diagnostics', label: 'Diagnostics', icon: Layers },
  { id: 'orchestration', label: 'Orchestration', icon: Cog, researcherOnly: true },
];

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export function App() {
  const { mode, setMode, isCompiled, lingoReport, executionResult } = useCompilerStore();
  const { activeTab, setActiveTab } = useUIStore();

  const filteredTabs = TABS.filter(
    (tab) => !tab.researcherOnly || mode === 'researcher'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Chaos Lab</h1>
                <p className="text-xs text-slate-400">Compiler Transformation Laboratory</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4">
              {isCompiled && executionResult && (
                <SemanticVerifier />
              )}

              {isCompiled && (
                <div className="flex items-center gap-2">
                  {lingoReport.valid ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                      <Check className="w-3 h-3" />
                      Lingo Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
                      <X className="w-3 h-3" />
                      Validation Failed
                    </span>
                  )}
                </div>
              )}

              {/* Mode Toggle */}
              <ModeToggle mode={mode} setMode={setMode} />
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-1 mt-4 -mb-px">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg
                  transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-white border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto">
        <div className="flex">
          {/* Left Sidebar - Examples */}
          <aside className="w-64 border-r border-slate-800 bg-slate-900/30 p-4 min-h-[calc(100vh-120px)]">
            <ExampleLibrary />
          </aside>

          {/* Center Content */}
          <div className="flex-1 p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'editor' && <EditorPanel />}
                {activeTab === 'timeline' && <TransformationTimeline />}
                {activeTab === 'diagnostics' && <LingoPanel />}
                {activeTab === 'orchestration' && mode === 'researcher' && (
                  <ChaosOrchestrator />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// MODE TOGGLE COMPONENT
// ============================================================================

interface ModeToggleProps {
  mode: 'student' | 'researcher';
  setMode: (mode: 'student' | 'researcher') => void;
}

function ModeToggle({ mode, setMode }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-800">
      <button
        onClick={() => setMode('student')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
          transition-all duration-200
          ${
            mode === 'student'
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }
        `}
      >
        <GraduationCap className="w-4 h-4" />
        Student
      </button>
      <button
        onClick={() => setMode('researcher')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
          transition-all duration-200
          ${
            mode === 'researcher'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }
        `}
      >
        <Microscope className="w-4 h-4" />
        Researcher
      </button>
    </div>
  );
}

export default App;
