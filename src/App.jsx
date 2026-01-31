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
    Network
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
import { AgentsTab } from './components/AgentsTab';
import { RoadmapTab } from './components/RoadmapTab';
import { ParseTreeCard } from './components/ParseTree';
import { IntroOverlay } from './components/IntroOverlay';

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
    { id: 'agents', label: 'Agents', icon: Users }
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

    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);

    const handleDismissIntro = () => {
        setShowIntro(false);
    };

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

    const handleCompile = () => {
        setIsCompiling(true);
        setIsCompiled(false);
        setCompilationError(null);

        try {
            diagnostics.clear();

            const lexer = new Lexer(code);
            const tokens = lexer.tokenize();

            const parser = new Parser(tokens);
            const generatedAst = parser.parse();
            setAst(generatedAst);

            const ir = generateIR(generatedAst);
            setOriginalIr(ir);

            const { ir: transformedIr } = applyChaos(ir, intensity);
            setChaoticIr(transformedIr);

            const currentDiag = LingoCompiler.injectTestFailure(
                [...diagnostics.getDiagnostics()],
                simulateLingoError
            );

            setCompilerDiagnostics(currentDiag);
            setLingoReport(LingoCompiler.generateReport(currentDiag));

            const codegen = new CodeGen(generatedAst);
            const generatedAssembly = codegen.generate();
            setAssembly(generatedAssembly);

            const result = executeIR(transformedIr);
            setExecutionOutput(result);

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
                                alt="Chaos Compiler Logo"
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain mcp-glow bg-slate-900/50"
                            />
                            <div className="hidden xs:block">
                                <span className="font-bold text-sm sm:text-lg text-white block leading-tight">Chaos Compiler</span>
                                <p className="text-[8px] sm:text-[10px] text-slate-400 font-medium">Powered by Lingo.dev</p>
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
                                />
                            </div>
                            <div className="min-h-[450px]">
                                <IRDiffView originalIr={originalIr} chaoticIr={chaoticIr} />
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
                                <div className="bg-slate-950 rounded-lg p-4 font-mono text-xl text-lingo border border-slate-800 min-h-[80px] flex items-center justify-center">
                                    {executionOutput !== null ? executionOutput : '0'}
                                </div>
                                <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                                    <CheckCircle size={14} className="text-lingo" />
                                    Verified: chaotic output = original output
                                </p>
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

                {activeTab === 'agents' && <AgentsTab />}
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

            <AnimatePresence>
                {showIntro && (
                    <IntroOverlay onDismiss={handleDismissIntro} />
                )}
            </AnimatePresence>

        </div>
    );
}

export default App;
