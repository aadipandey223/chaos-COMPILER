import React, { useState } from 'react';
import {
    Zap,
    Users,
    Layers,
    Shield,
    History,
    Code2,
    Binary,
    ShieldCheck,
    Copy,
    Check,
    Download,
    CheckCircle,
    Network,
    Workflow,
    Cog
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/themes/prism-tomorrow.css';

import { Lexer } from './compiler/lexer';
import { Parser } from './compiler/parser';
import { CodeGen } from './compiler/codegen';
import { generateIR, applyChaos, executeIR } from './compiler/ir';
import { diagnostics } from './compiler/diagnostics';
import { LingoCompiler } from './compiler/lingo';

import { EditorPanel } from './components/EditorPanel';
import { LingoPanel } from './components/LingoPanel';
import { IRDiffView } from './components/IRDiffView';
import { PipelineTab } from './components/PipelineTab';
import { RoadmapTab } from './components/RoadmapTab';
import { ParseTreeCard } from './components/ParseTree';
import { IntroOverlay } from './components/IntroOverlay';
import { ChaosConfig } from './components/ChaosConfig';

const EXAMPLES = [
    `// Example 1: Basic Arithmetic
int main() {
  int a = 10;
  int b = 20;
  int result = a + b;
    return result;
} `,
    `// Example 2: Multiplication
int main() {
  int x = 5;
  int y = 8;
  int area = x * y;
    return area;
} `,
    `// Example 3: Complex Expression
int main() {
  int a = 2;
  int b = 3;
  int c = 4;
  int res = (a + b) * c;
    return res;
} `,
    `// Example 4: Many Variables
int main() {
  int w = 100;
  int x = 200;
  int y = 300;
  int sum = w + x + y;
    return sum;
} `
];

const TABS = [
    { id: 'editor', label: 'Editor', icon: Code2 },
    { id: 'parse-tree', label: 'Parse Tree', icon: Network },
    { id: 'pipeline', label: 'Pipeline Components', icon: Workflow },
    { id: 'orchestration', label: 'Chaos Orchestration', icon: Cog }
];

function App() {
    const [activeTab, setActiveTab] = useState('editor');
    const [code, setCode] = useState(EXAMPLES[0]);
    const [intensity, setIntensity] = useState('medium');
    const [exampleIndex, setExampleIndex] = useState(0);

    const [isCompiling, setIsCompiling] = useState(false);
    const [isCompiled, setIsCompiled] = useState(false);

    const [ast, setAst] = useState(null);
    const [originalIr, setOriginalIr] = useState([]);
    const [chaoticIr, setChaoticIr] = useState([]);
    const [assembly, setAssembly] = useState('');
    const [executionOutput, setExecutionOutput] = useState(null);
    const [compilationError, setCompilationError] = useState(null);
    const [irSnapshots, setIrSnapshots] = useState([]);
    const [originalOutput, setOriginalOutput] = useState(null);
    const [stdout, setStdout] = useState([]);

    const [compilerDiagnostics, setCompilerDiagnostics] = useState([]);
    const [lingoReport, setLingoReport] = useState({
        summary: '',
        errors: [],
        warnings: [],
        valid: true,
        stats: { total: 0, errorsCount: 0, warningsCount: 0 }
    });
    const [explanationMode, setExplanationMode] = useState('student');
    const [simulateLingoError, setSimulateLingoError] = useState(null);

    const [showIntro, setShowIntro] = useState(true);
    const [guidedTourStep, setGuidedTourStep] = useState(0);
    const [showGuidedTour, setShowGuidedTour] = useState(false);

    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);

    const handleDismissIntro = () => {
        setShowIntro(false);
    };

    const startGuidedTour = () => {
        setShowGuidedTour(true);
        setGuidedTourStep(1);
        setShowIntro(false);
        // Auto-load Heavy Obfuscation preset
        setChaosConfig({
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
        });
    };

    const nextTourStep = () => {
        setGuidedTourStep(prev => prev + 1);
    };

    const skipTour = () => {
        setShowGuidedTour(false);
        setGuidedTourStep(0);
    };

    // Auto-advance tour when user compiles
    React.useEffect(() => {
        if (showGuidedTour && guidedTourStep === 1 && isCompiled) {
            setTimeout(() => nextTourStep(), 500);
        }
    }, [isCompiled, showGuidedTour, guidedTourStep]);

    const loadExample = () => {
        const nextIndex = (exampleIndex + 1) % EXAMPLES.length;
        setExampleIndex(nextIndex);
        setCode(EXAMPLES[nextIndex]);
        setIsCompiled(false);
    };

    const handleFormat = () => {
        let formatted = code
            .replace(/;/g, ';\n')
            .replace(/{/g, '{\n')
            .replace(/}/g, '\n}\n')
            .replace(/\n\s*\n/g, '\n')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');

        let indent = 0;
        let finalCode = '';
        formatted.split('\n').forEach(line => {
            if (line.includes('}')) indent = Math.max(0, indent - 1);
            finalCode += '  '.repeat(indent) + line + '\n';
            if (line.includes('{')) indent++;
        });

        setCode(finalCode.trim());
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleCopyOutput = () => {
        if (!executionOutput) return;
        navigator.clipboard.writeText(String(executionOutput));
        setCopiedOutput(true);
        setTimeout(() => setCopiedOutput(false), 2000);
    };

    const [chaosConfig, setChaosConfig] = useState({
        passes: {
            numberEncoding: true,
            substitution: true,
            opaquePredicates: true,
            flattening: true
        },
        customRules: []
    });
    const [ruleHits, setRuleHits] = useState({});

    const handleCompile = () => {
        setIsCompiling(true);
        setIsCompiled(false);
        setCompilationError(null);
        setIrSnapshots([]);
        setOriginalOutput(null);
        setStdout([]);
        setRuleHits({});

        try {
            diagnostics.clear();

            const lexer = new Lexer(code);
            const tokens = lexer.tokenize();

            const parser = new Parser(tokens);
            const generatedAst = parser.parse();
            setAst(generatedAst);

            const ir = generateIR(generatedAst);
            setOriginalIr(ir);

            // Execute Original for comparison
            const origResult = executeIR(JSON.parse(JSON.stringify(ir)));
            setOriginalOutput(origResult);

            const { ir: transformedIr, snapshots, ruleHits: hits } = applyChaos(ir, intensity, undefined, chaosConfig);
            setChaoticIr(transformedIr);
            setIrSnapshots(snapshots);
            setRuleHits(hits || {});

            const currentDiag = LingoCompiler.injectTestFailure(
                [...diagnostics.getDiagnostics()],
                simulateLingoError
            );

            setCompilerDiagnostics(currentDiag);
            setLingoReport(LingoCompiler.generateReport(currentDiag));

            const codegen = new CodeGen(generatedAst);
            const generatedAssembly = codegen.generate();
            setAssembly(generatedAssembly);

            const currentStdout = [];
            const result = executeIR(transformedIr, {}, currentStdout);
            setExecutionOutput(result);
            setStdout(currentStdout);

            setTimeout(() => {
                setIsCompiling(false);
                setIsCompiled(true);
            }, 800);

        } catch (err) {
            console.error(err);
            setCompilationError(err.message);
            setIsCompiling(false);

            // Critical Fix: Update Lingo status on build failure
            setLingoReport({
                valid: false,
                summary: 'Compilation Failed',
                errors: [`Build Error: ${err.message}`],
                warnings: [],
                stats: { total: 1, errorsCount: 1, warningsCount: 0 }
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between h-14 sm:h-16 items-center">
                        {/* Logo */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <img
                                src="/logo.png"
                                alt="Chaos Lab Logo"
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain mcp-glow bg-slate-900/50"
                            />
                            <div className="hidden xs:block">
                                <span className="font-bold text-sm sm:text-lg text-white block leading-tight">Chaos Lab</span>
                                <p className="text-[8px] sm:text-[10px] text-slate-400 font-medium">Compiler Transformation Laboratory</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700 scale-90 sm:scale-100 origin-right sm:origin-center">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-mcp text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    <tab.icon size={14} className="sm:w-[16px] sm:h-[16px]" />
                                    <span className="hidden lg:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Status (Hidden on very small screens, compact on mobile) */}
                        <div className={`hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border ${lingoReport.valid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                            <Shield size={12} className="sm:w-[14px] sm:h-[14px]" />
                            <span className="hidden md:inline">{lingoReport.valid ? 'Lingo Valid' : 'Validation Failed'}</span>
                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${lingoReport.valid ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-20 sm:pt-28 pb-8 px-4 sm:px-6">
                {activeTab === 'editor' && (
                    <div className="space-y-4 max-w-7xl mx-auto">
                        {/* Top Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="min-h-[450px]">
                                <EditorPanel
                                    code={code}
                                    setCode={setCode}
                                    intensity={intensity}
                                    setIntensity={setIntensity}
                                    onCompile={handleCompile}
                                    onFormat={handleFormat}
                                    onLoadExample={loadExample}
                                    isCompiling={isCompiling}
                                    copiedCode={copiedCode}
                                    onCopyCode={handleCopyCode}
                                    lingoValid={isCompiled ? lingoReport.valid : undefined}
                                    showQuickWin={showGuidedTour && guidedTourStep === 1}
                                />
                            </div>
                            <div className="min-h-[450px]">
                                <IRDiffView snapshots={irSnapshots} />
                            </div>
                        </div>

                        {/* Middle Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Execution Output */}
                            <div className="glass-panel p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <ShieldCheck size={18} className="text-lingo" />
                                        <span className="text-sm font-semibold">Execution Result</span>
                                    </div>
                                    <button onClick={handleCopyOutput} className="text-slate-500 hover:text-slate-300 p-2 hover:bg-slate-800 rounded-lg transition-all">
                                        {copiedOutput ? <Check size={16} className="text-lingo" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="bg-slate-950 rounded-lg p-4 font-mono border border-slate-800 min-h-[120px] flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Standard Output</span>
                                        <div className="text-sm text-slate-300">
                                            {stdout.length > 0 ? (
                                                stdout.map((line, i) => <div key={i}>{line}</div>)
                                            ) : (
                                                <span className="opacity-30 italic">No output</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-slate-800/50">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Return Value</span>
                                        <div className="text-2xl font-bold text-mcp">
                                            {executionOutput !== null ? executionOutput : '0'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3 px-1">
                                    <p className="text-[10px] text-slate-500 flex items-center gap-2">
                                        <CheckCircle size={12} className={executionOutput === originalOutput ? "text-emerald-500" : "text-red-500"} />
                                        Semantic Check: {executionOutput === originalOutput ? "Passed" : "Mismatch Rejected"}
                                    </p>
                                    <span className="text-[10px] font-mono text-slate-600">
                                        orig: {originalOutput || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Assembly */}
                            <div className="glass-panel flex flex-col min-h-[180px]">
                                <div className="px-5 py-3 border-b border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Binary size={18} />
                                        <span className="text-sm font-semibold">Assembly Output</span>
                                    </div>
                                    <button className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
                                        <Download size={14} />
                                        Download
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto p-4 font-mono text-sm text-slate-400 custom-scrollbar leading-relaxed">
                                    <pre>{assembly || '; No output generated'}</pre>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="min-h-[350px]">
                            <LingoPanel
                                diagnostics={compilerDiagnostics}
                                lingoReport={lingoReport}
                                mode={explanationMode}
                                setMode={setExplanationMode}
                                simulateError={simulateLingoError}
                                setSimulateError={setSimulateLingoError}
                                onShowResearch={() => setActiveTab('roadmap')}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'parse-tree' && (
                    <div className="min-h-[calc(100vh-100px)] p-4">
                        <div className="max-w-5xl mx-auto">
                            {ast ? (
                                <ParseTreeCard ast={ast} />
                            ) : (
                                <div className="glass-panel h-[calc(100vh-150px)] flex items-center justify-center">
                                    <div className="text-center text-slate-500">
                                        <Network size={64} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-xl font-semibold">No Parse Tree Available</p>
                                        <p className="text-sm mt-2">Compile your code first to see the parse tree</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'pipeline' && (
                    <PipelineTab />
                )}
                {activeTab === 'orchestration' && (
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg border border-violet-500/20">
                                <Cog size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white tracking-tight uppercase tracking-widest text-sm">Chaos Orchestration</h3>
                                <p className="text-[10px] text-slate-500 font-bold">DRIVE THE TRANSFORMATION ENGINE</p>
                            </div>
                        </div>
                        <ChaosConfig
                            config={chaosConfig}
                            setConfig={setChaosConfig}
                            ruleHits={ruleHits}
                        />
                    </div>
                )}
                {activeTab === 'roadmap' && <RoadmapTab />}
            </main>

            {/* Error Toast */}
            <AnimatePresence>
                {compilationError && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-md"
                    >
                        <p className="text-sm font-medium">Compilation Error</p>
                        <p className="text-xs opacity-80 mt-1">{compilationError}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Guided Tour Overlay */}
            <AnimatePresence>
                {showGuidedTour && guidedTourStep > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] pointer-events-none"
                    >
                        {guidedTourStep === 1 && (
                            <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-violet-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-violet-400 max-w-md"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold mb-1">✓ Heavy Obfuscation Loaded</h3>
                                            <p className="text-sm opacity-90 mb-3">All transformation passes enabled. Click the pulsing "Run Lab Engine" button below to see code transform!</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={skipTour}
                                                    className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-all"
                                                >
                                                    Skip tour
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                        {guidedTourStep === 2 && (
                            <div className="absolute top-1/2 right-8 -translate-y-1/2 pointer-events-auto max-w-sm">
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-emerald-400"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold mb-1">✓ Code Transformed!</h3>
                                            <p className="text-sm opacity-90 mb-3">Check the IR Diff panel on the right → Each stage shows what changed. Scroll down to see execution results.</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={nextTourStep}
                                                    className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-bold text-sm hover:bg-emerald-50 transition-all"
                                                >
                                                    Next →
                                                </button>
                                                <button
                                                    onClick={skipTour}
                                                    className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-all"
                                                >
                                                    Skip
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                        {guidedTourStep === 3 && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-blue-400 max-w-md"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold mb-1">Scroll down to see Diagnostics</h3>
                                            <p className="text-sm opacity-90 mb-3">AI-generated explanations validated by Lingo.dev. Try the failure simulation!</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={skipTour}
                                                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-all"
                                                >
                                                    Finish tour ✓
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showIntro && (
                    <IntroOverlay
                        onDismiss={handleDismissIntro}
                        onStartGuidedTour={startGuidedTour}
                    />
                )}
            </AnimatePresence>

        </div>
    );
}

export default App;
