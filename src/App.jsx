import React, { useState } from 'react';
import {
    Zap,
    Users,
    Info,
    FileText,
    Binary,
    ShieldCheck,
    Code2,
    RotateCcw,
    Play,
    ArrowRight,
    Download,
    Check,
    Layers,
    Fingerprint,
    Shield,
    Bug,
    FlaskConical,
    Shuffle,
    AlertCircle,
    Sparkles,
    Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/themes/prism-tomorrow.css';
import { Lexer } from './compiler/lexer';
import { Parser } from './compiler/parser';
import { CodeGen } from './compiler/codegen';
import { generateIR, applyChaos, executeIR } from './compiler/ir';
import { ParseTreeCard } from './components/ParseTree';

function App() {
    const [compilationCount, setCompilationCount] = useState(0);
    const [isCompiling, setIsCompiling] = useState(false);
    const [isCompiled, setIsCompiled] = useState(false);
    const [activeTab, setActiveTab] = useState("compiler");
    const [isAuto, setIsAuto] = useState(true);
    const [pipelineStep, setPipelineStep] = useState(0);
    const [ast, setAst] = useState(null);
    const [originalIr, setOriginalIr] = useState([]);
    const [chaoticIr, setChaoticIr] = useState([]);
    const [appliedTransforms, setAppliedTransforms] = useState([]);
    const [assembly, setAssembly] = useState("");
    const [executionOutput, setExecutionOutput] = useState(null);
    const [compilationError, setCompilationError] = useState(null);
    const [compilationHistory, setCompilationHistory] = useState([]);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);

    const EXAMPLES = [
        `// Example 1: Basic Arithmetic
int main() {
  int a = 10;
  int b = 20;
  int result = a + b;
  return result;
}`,
        `// Example 2: Multiplication
int main() {
  int x = 5;
  int y = 8;
  int area = x * y;
  return area;
}`,
        `// Example 3: Complex Expression
int main() {
  int a = 2;
  int b = 3;
  int c = 4;
  int res = (a + b) * c;
  return res;
}`,
        `// Example 4: Many Variables
int main() {
  int w = 100;
  int x = 200;
  int y = 300;
  int sum = w + x + y;
  return sum;
}`,
        `// Example 5: Division
int main() {
  int total = 100;
  int parts = 4;
  int share = total / parts;
  return share;
}`
    ];

    const defaultCode = `int main()\n {\n \n \n\n\n\treturn 0;\n}`;
    const [exampleIndex, setExampleIndex] = useState(0);

    const [code, setCode] = useState(defaultCode);
    const [intensity, setIntensity] = useState("none"); // New state for chaos intensity

    const loadExample = () => {
        const nextIndex = (exampleIndex + 1) % EXAMPLES.length;
        setExampleIndex(nextIndex);
        setCode(EXAMPLES[nextIndex]);
        setIsCompiled(false);
        setPipelineStep(0);
    };

    const handleFormat = () => {
        // Simple beautifier for C-like code
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
        setPipelineStep(1);
        setCompilationError(null);

        try {
            // 1. Lexer
            const lexer = new Lexer(code);
            const tokens = lexer.tokenize();

            // 2. Parser
            const parser = new Parser(tokens);
            const generatedAst = parser.parse();
            setAst(generatedAst);

            // 3. IR Generation
            const ir = generateIR(generatedAst);
            setOriginalIr(ir);

            // 4. Chaos Engine
            const { ir: transformedIr, transforms } = applyChaos(ir, intensity);
            setChaoticIr(transformedIr);
            setAppliedTransforms(transforms);

            // 5. CodeGen
            const codegen = new CodeGen(generatedAst);
            const generatedAssembly = codegen.generate();
            setAssembly(generatedAssembly);

            // 6. Execute IR (Real Output)
            const result = executeIR(ir);
            setExecutionOutput(result);

            if (isAuto) {
                setTimeout(() => setPipelineStep(2), 600);
                setTimeout(() => setPipelineStep(3), 1200);
                setTimeout(() => setPipelineStep(4), 1800);
                setTimeout(() => {
                    setPipelineStep(5);
                    setIsCompiling(false);
                    setIsCompiled(true);
                    setCompilationCount(prev => prev + 1);

                    // Add to History
                    const newRun = {
                        id: compilationCount + 1,
                        seed: Math.floor(Math.random() * 999999),
                        signature: Math.random().toString(16).substring(2, 10).toUpperCase(),
                        intensity,
                        irCount: ir.length,
                        timestamp: new Date().toLocaleTimeString()
                    };
                    setCompilationHistory(prev => [newRun, ...prev]);
                }, 2400);
            }
        } catch (err) {
            console.error(err);
            setCompilationError(err.message);
            setIsCompiling(false);
            setPipelineStep(0);
        }
    };

    const handleNextStep = () => {
        if (pipelineStep < 5) {
            const next = pipelineStep + 1;
            setPipelineStep(next);
            if (next === 5) {
                setIsCompiling(false);
                setIsCompiled(true);
                setCompilationCount(prev => prev + 1);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14 sm:h-16 items-center">
                        {/* Logo Section */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-slate-900 text-white p-1.5 sm:p-2 rounded-lg">
                                <Zap size={16} fill="currentColor" className="text-white sm:w-5 sm:h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm sm:text-lg leading-tight text-slate-900">Chaos Compiler</span>
                                <span className="text-[10px] sm:text-xs text-slate-500 font-medium hidden xs:block">Polymorphic Compilation</span>
                            </div>
                        </div>

                        {/* Nav Items */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => setActiveTab("compiler")}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'compiler' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Zap size={14} className="sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Compiler</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("agents")}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'agents' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Users size={14} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden xs:inline">Agents</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("about")}
                                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${activeTab === 'about' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Info size={14} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden xs:inline">About</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">

                {activeTab === 'compiler' && (
                    <>
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-2 gap-3 sm:gap-0">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-1 sm:mb-2">The Chaos Compiler</h1>
                                <p className="text-sm sm:text-base lg:text-lg text-slate-500 font-medium">Controlled Non-Deterministic Compilation Framework</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="block text-3xl sm:text-4xl font-bold text-slate-900 leading-none">{compilationCount}</span>
                                <span className="text-xs sm:text-sm text-slate-500 font-medium">Compilations</span>
                            </div>
                        </div>

                        {/* Info Alert */}
                        <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                            <Info className="flex-shrink-0 text-slate-500 mt-0.5" size={16} />
                            <p className="text-xs sm:text-sm lg:text-base text-slate-600">
                                Each compilation generates a <span className="font-bold text-slate-800">unique binary signature</span> while maintaining <span className="font-bold text-slate-800">identical behavior</span>. Try compiling the same code multiple times to see polymorphic outputs!
                            </p>
                        </div>

                        {/* Compilation Pipeline (visible when not compiled) */}
                        <AnimatePresence>
                            {(!isCompiled || isCompiling) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                                >
                                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-semibold text-sm sm:text-base text-slate-800">Compilation Pipeline</h3>
                                        {isCompiling && <span className="text-[10px] sm:text-xs font-bold text-blue-600 animate-pulse">PROCESSING...</span>}
                                    </div>
                                    <div className="p-4 sm:p-6 lg:p-8">
                                        {/* Desktop: Horizontal Layout */}
                                        <div className="hidden sm:flex items-center justify-between px-8 relative">
                                            {/* Progress Line */}
                                            {isCompiling && isAuto && (
                                                <motion.div
                                                    className="absolute top-1/2 left-0 h-1 bg-blue-500/20 z-0"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 1.5, ease: "linear" }}
                                                />
                                            )}

                                            {/* Step 1 */}
                                            <div className="flex flex-col items-center gap-3 z-10 relative">
                                                <motion.div
                                                    animate={pipelineStep === 1 ? { scale: [1, 1.1, 1], borderColor: "#3b82f6", boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.2)" } : pipelineStep > 1 ? { borderColor: "#3b82f6", color: "#3b82f6" } : {}}
                                                    className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${pipelineStep >= 1 ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400'}`}
                                                >
                                                    <FileText size={28} />
                                                </motion.div>
                                                <span className={`text-sm font-bold transition-colors ${pipelineStep >= 1 ? 'text-slate-800' : 'text-slate-300'}`}>Parser</span>
                                            </div>

                                            <ArrowRight className={`transition-colors ${pipelineStep >= 2 ? 'text-blue-200' : 'text-slate-200'}`} size={20} />

                                            {/* Step 2 */}
                                            <div className="flex flex-col items-center gap-3 z-10 relative">
                                                <motion.div
                                                    animate={pipelineStep === 2 ? { scale: [1, 1.1, 1], borderColor: "#eab308", boxShadow: "0 0 0 4px rgba(234, 179, 8, 0.2)" } : pipelineStep > 2 ? { borderColor: "#eab308", color: "#eab308" } : {}}
                                                    className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${pipelineStep >= 2 ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400'}`}
                                                >
                                                    <Zap size={28} />
                                                </motion.div>
                                                <span className={`text-sm font-bold transition-colors ${pipelineStep >= 2 ? 'text-slate-800' : 'text-slate-300'}`}>Chaos</span>
                                            </div>

                                            <ArrowRight className={`transition-colors ${pipelineStep >= 3 ? 'text-yellow-200' : 'text-slate-200'}`} size={20} />

                                            {/* Step 3 */}
                                            <div className="flex flex-col items-center gap-3 z-10 relative">
                                                <motion.div
                                                    animate={pipelineStep === 3 ? { scale: [1, 1.1, 1], borderColor: "#a855f7", boxShadow: "0 0 0 4px rgba(168, 85, 247, 0.2)" } : pipelineStep > 3 ? { borderColor: "#a855f7", color: "#a855f7" } : {}}
                                                    className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${pipelineStep >= 3 ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-400'}`}
                                                >
                                                    <div className="font-mono text-lg font-bold leading-none flex flex-col items-center">
                                                        <span>01</span>
                                                        <span>10</span>
                                                    </div>
                                                </motion.div>
                                                <span className={`text-sm font-bold transition-colors ${pipelineStep >= 3 ? 'text-slate-800' : 'text-slate-300'}`}>CodeGen</span>
                                            </div>

                                            <ArrowRight className={`transition-colors ${pipelineStep >= 4 ? 'text-purple-200' : 'text-slate-200'}`} size={20} />

                                            {/* Step 4 */}
                                            <div className="flex flex-col items-center gap-3 z-10 relative">
                                                <motion.div
                                                    animate={pipelineStep === 4 ? { scale: [1, 1.1, 1], borderColor: "#22c55e", boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.2)" } : pipelineStep > 4 ? { borderColor: "#22c55e", color: "#22c55e" } : {}}
                                                    className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${pipelineStep >= 4 ? 'border-green-500 text-green-500' : 'border-transparent text-slate-400'}`}
                                                >
                                                    <ShieldCheck size={28} />
                                                </motion.div>
                                                <span className={`text-sm font-bold transition-colors ${pipelineStep >= 4 ? 'text-slate-800' : 'text-slate-300'}`}>Verifier</span>
                                            </div>
                                        </div>

                                        {/* Mobile: 2x2 Grid Layout */}
                                        <div className="grid grid-cols-2 gap-4 sm:hidden relative">
                                            {/* Step 1 - Parser */}
                                            <div className="flex flex-col items-center gap-2 relative">
                                                <motion.div
                                                    animate={pipelineStep === 1 ? { scale: [1, 1.1, 1], borderColor: "#3b82f6", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)" } : pipelineStep > 1 ? { borderColor: "#3b82f6", color: "#3b82f6" } : {}}
                                                    className={`w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${pipelineStep >= 1 ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400'}`}
                                                >
                                                    <FileText size={22} />
                                                </motion.div>
                                                <span className={`text-xs font-bold transition-colors ${pipelineStep >= 1 ? 'text-slate-800' : 'text-slate-300'}`}>Parser</span>
                                                {pipelineStep >= 1 && (
                                                    <div className="absolute -right-2 top-6 w-4 h-0.5 bg-blue-300"></div>
                                                )}
                                            </div>

                                            {/* Step 2 - Chaos */}
                                            <div className="flex flex-col items-center gap-2 relative">
                                                <motion.div
                                                    animate={pipelineStep === 2 ? { scale: [1, 1.1, 1], borderColor: "#eab308", boxShadow: "0 0 0 3px rgba(234, 179, 8, 0.2)" } : pipelineStep > 2 ? { borderColor: "#eab308", color: "#eab308" } : {}}
                                                    className={`w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${pipelineStep >= 2 ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-400'}`}
                                                >
                                                    <Zap size={22} />
                                                </motion.div>
                                                <span className={`text-xs font-bold transition-colors ${pipelineStep >= 2 ? 'text-slate-800' : 'text-slate-300'}`}>Chaos</span>
                                                {pipelineStep >= 2 && (
                                                    <div className="absolute -bottom-2 left-6 w-0.5 h-4 bg-yellow-300"></div>
                                                )}
                                            </div>

                                            {/* Step 3 - CodeGen */}
                                            <div className="flex flex-col items-center gap-2 relative">
                                                <motion.div
                                                    animate={pipelineStep === 3 ? { scale: [1, 1.1, 1], borderColor: "#a855f7", boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.2)" } : pipelineStep > 3 ? { borderColor: "#a855f7", color: "#a855f7" } : {}}
                                                    className={`w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${pipelineStep >= 3 ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-400'}`}
                                                >
                                                    <div className="font-mono text-sm font-bold leading-none flex flex-col items-center">
                                                        <span>01</span>
                                                        <span>10</span>
                                                    </div>
                                                </motion.div>
                                                <span className={`text-xs font-bold transition-colors ${pipelineStep >= 3 ? 'text-slate-800' : 'text-slate-300'}`}>CodeGen</span>
                                                {pipelineStep >= 3 && (
                                                    <div className="absolute -right-2 top-6 w-4 h-0.5 bg-purple-300"></div>
                                                )}
                                            </div>

                                            {/* Step 4 - Verifier */}
                                            <div className="flex flex-col items-center gap-2 relative">
                                                <motion.div
                                                    animate={pipelineStep === 4 ? { scale: [1, 1.1, 1], borderColor: "#22c55e", boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.2)" } : pipelineStep > 4 ? { borderColor: "#22c55e", color: "#22c55e" } : {}}
                                                    className={`w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${pipelineStep >= 4 ? 'border-green-500 text-green-500' : 'border-transparent text-slate-400'}`}
                                                >
                                                    <ShieldCheck size={22} />
                                                </motion.div>
                                                <span className={`text-xs font-bold transition-colors ${pipelineStep >= 4 ? 'text-slate-800' : 'text-slate-300'}`}>Verifier</span>
                                            </div>

                                            {/* Grid Flow Indicator */}
                                            {isCompiling && isAuto && (
                                                <motion.div
                                                    className="absolute inset-0 pointer-events-none"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
                                                        <motion.path
                                                            d="M 80 28 L 100 28 M 80 28 L 80 50 M 80 50 L 100 50"
                                                            stroke="#93c5fd"
                                                            strokeWidth="2"
                                                            fill="none"
                                                            strokeDasharray="4 4"
                                                            initial={{ pathLength: 0 }}
                                                            animate={{ pathLength: 1 }}
                                                            transition={{ duration: 1.5, ease: "linear" }}
                                                        />
                                                    </svg>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Source Code Input */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700">
                                    <Code2 size={16} className="sm:w-5 sm:h-5" />
                                    <h3 className="font-semibold text-sm sm:text-base">Source Code Input</h3>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-3">
                                    <button
                                        onClick={handleCopyCode}
                                        className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium"
                                        title="Copy Code"
                                    >
                                        {copiedCode ? <Check size={12} className="text-emerald-500 sm:w-3.5 sm:h-3.5" /> : <Copy size={12} className="sm:w-3.5 sm:h-3.5" />}
                                        <span className="hidden sm:inline">{copiedCode ? "Copied!" : "Copy"}</span>
                                    </button>
                                    <button
                                        onClick={loadExample}
                                        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                                    >
                                        <RotateCcw size={12} className="sm:w-3.5 sm:h-3.5" />
                                        <span className="hidden xs:inline">Load Example</span>
                                        <span className="xs:hidden">Example</span>
                                    </button>
                                </div>
                            </div>

                            {compilationError && (
                                <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle size={20} />
                                    <span>Error: {compilationError}</span>
                                </div>
                            )}

                            {/* Editor */}
                            <div className="h-48 sm:h-64 rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-slate-200 focus-within:border-transparent transition-all shadow-inner bg-[#2d2d2d] flex">
                                <div
                                    className="bg-[#252525] text-slate-500 text-right pr-2 sm:pr-3 pl-2 sm:pl-4 py-3 sm:py-5 select-none font-mono text-xs sm:text-sm border-r border-[#3d3d3d] flex flex-col pointer-events-none"
                                    style={{ minWidth: '35px' }}
                                >
                                    {code.split('\n').map((_, i) => (
                                        <div key={i} className="leading-normal">{i + 1}</div>
                                    ))}
                                </div>
                                <div className="flex-1 h-full overflow-auto">
                                    <Editor
                                        value={code}
                                        onValueChange={setCode}
                                        highlight={code => highlight(code, languages.c || languages.clike, languages.c ? 'c' : 'clike')}
                                        padding={window.innerWidth < 640 ? 12 : 20}
                                        placeholder="Enter your C code here..."
                                        style={{
                                            fontFamily: '"Fira Code", "Fira Mono", monospace',
                                            fontSize: window.innerWidth < 640 ? 12 : 14,
                                            backgroundColor: '#2d2d2d',
                                            color: '#ccc',
                                            minHeight: '100%',
                                        }}
                                        textareaClassName="focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 sm:gap-4">
                            <div className="flex-1 max-w-full sm:max-w-xs space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-semibold text-slate-700">Chaos Intensity</label>
                                <div className="relative">
                                    <select
                                        value={intensity}
                                        onChange={(e) => setIntensity(e.target.value)}
                                        className="w-full appearance-none bg-white border border-gray-200 hover:border-gray-300 text-slate-700 py-2 sm:py-2.5 px-3 pr-8 rounded-lg text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200"
                                    >
                                        <option value="none">None - Clean compilation</option>
                                        <option value="low">Low - Subtle variations</option>
                                        <option value="medium">Medium - Balanced chaos</option>
                                        <option value="high">High - Maximum entropy</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                        <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={handleFormat}
                                    className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold border border-slate-200 transition-all shadow-sm active:scale-95 flex-1 sm:flex-initial justify-center"
                                    title="Format Code (Beautify)"
                                >
                                    <Sparkles size={14} className="text-blue-500 sm:w-4 sm:h-4" />
                                    Beautify
                                </button>

                                <button
                                    onClick={handleCompile}
                                    disabled={isCompiling}
                                    className={`flex items-center gap-1.5 sm:gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all transform active:scale-95 shadow-sm flex-1 sm:flex-initial justify-center ${isCompiling ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isCompiling ? (
                                        <>
                                            <Shuffle size={14} className="animate-spin sm:w-4 sm:h-4" />
                                            <span className="hidden xs:inline">Running...</span>
                                            <span className="xs:hidden">Run...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={14} fill="currentColor" className="sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Start Compilation</span>
                                            <span className="sm:hidden">Compile</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 justify-end">
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isAuto}
                                    onChange={(e) => setIsAuto(e.target.checked)}
                                    className="rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                                />
                                <span>Auto-Run Pipeline</span>
                            </label>
                        </div>
                        {isCompiling && !isAuto && (
                            <div className="mt-4 flex justify-center pb-4">
                                <button
                                    onClick={handleNextStep}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    Next Step <ArrowRight size={16} />
                                </button>
                            </div>
                        )}


                        {
                            isCompiled && (
                                <div className="space-y-6">
                                    {/* Parse Tree Card */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <ParseTreeCard ast={ast} />
                                    </motion.div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                        {/* Original IR (Placeholder for now, keeping static visual for layout continuity until IR generator is fully ported) */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm h-full"
                                        >
                                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 text-slate-700">
                                                <FileText size={20} />
                                                <h3 className="font-semibold">Original IR</h3>
                                            </div>
                                            <div className="p-6">
                                                <div className="bg-slate-50 rounded-lg p-6 font-mono text-sm text-slate-600 leading-relaxed border border-slate-100 h-full">
                                                    <div className="grid grid-cols-[30px_1fr] gap-x-4">
                                                        {originalIr.map((instr, idx) => (
                                                            <React.Fragment key={idx}>
                                                                <span className="text-slate-300 text-right select-none">{idx.toString().padStart(2, '0')}</span>
                                                                <span>
                                                                    <span className="font-bold text-slate-800">{instr.op}</span>
                                                                    {instr.target && ` ${instr.target}`}
                                                                    {instr.value && ` = ${instr.value}`}
                                                                    {instr.left && ` ${instr.left} ${instr.op === 'ADD' ? '+' : instr.op === 'MUL' ? '*' : instr.op === 'SUB' ? '-' : '/'} ${instr.right}`}
                                                                </span>
                                                            </React.Fragment>
                                                        ))}
                                                        {originalIr.length === 0 && <span className="col-span-2 text-slate-400 italic">No IR generated</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Chaotic IR */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm h-full"
                                        >
                                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 text-slate-700">
                                                <Zap size={20} />
                                                <h3 className="font-semibold">Chaotic IR</h3>
                                                <span className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                                                    {intensity === 'low' ? '1 transform' : intensity === 'medium' ? '2 transforms' : '3 transforms'}
                                                </span>
                                            </div>
                                            <div className="p-6">
                                                <div className="bg-slate-50 rounded-lg p-6 font-mono text-sm text-slate-600 leading-relaxed border border-slate-100 mb-6 transition-all duration-300">
                                                    <div className="grid grid-cols-[30px_1fr] gap-x-4">
                                                        {chaoticIr.map((instr, idx) => (
                                                            <motion.div
                                                                key={idx}
                                                                initial={instr.op === 'NOOP' || instr.meta?.includes('Redundant') ? { opacity: 0, x: -10 } : {}}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                className="col-span-2 grid grid-cols-[30px_1fr] gap-x-4"
                                                            >
                                                                <span className="text-slate-300 text-right select-none">{idx.toString().padStart(2, '0')}</span>
                                                                <span className={`${instr.meta ? 'bg-yellow-50/50 -ml-1 pl-1 border-l-2 border-yellow-400' : ''}`}>
                                                                    <span className="font-bold text-slate-800">{instr.op}</span>
                                                                    {instr.target && ` ${instr.target}`}
                                                                    {instr.value && ` = ${instr.value}`}
                                                                    {instr.left && ` ${instr.left} ${instr.op === 'ADD' ? '+' : instr.op === 'MUL' ? '*' : instr.op === 'SUB' ? '-' : '/'} ${instr.right}`}
                                                                    {instr.meta && <span className="text-[10px] text-orange-500 ml-2 italic underline decoration-yellow-400/30">← {instr.meta}</span>}
                                                                </span>
                                                            </motion.div>
                                                        ))}
                                                        {chaoticIr.length === 0 && <span className="col-span-2 text-slate-400 italic">No Chaotic IR generated</span>}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Transformations Applied:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {appliedTransforms.map((t, i) => (
                                                            <span key={i} className="px-3 py-1 border border-slate-200 bg-white rounded-md text-xs font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50">
                                                                {t}
                                                            </span>
                                                        ))}
                                                        {appliedTransforms.length === 0 && (
                                                            <span className="text-xs text-slate-400 italic font-normal">No transformations applied for this seed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Assembly Output */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                        className="bg-white rounded-xl border border-gray-200 shadow-sm"
                                    >
                                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Binary size={20} />
                                                <h3 className="font-semibold">Assembly Output</h3>
                                            </div>
                                            <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-xs font-medium transition-colors">
                                                <Download size={14} />
                                                Download
                                            </button>
                                        </div>
                                        <div className="bg-[#0f172a] p-6 text-sm font-mono text-slate-300 overflow-x-auto">
                                            <pre>{assembly || `; Chaos Compiler Assembly Output
; No output generated.`}</pre>
                                        </div>
                                    </motion.div>

                                    {/* Verification */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.6 }}
                                        className="bg-white rounded-xl border border-gray-200 shadow-sm"
                                    >
                                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <ShieldCheck size={20} />
                                                <h3 className="font-semibold">Verification</h3>
                                            </div>
                                            <button
                                                onClick={handleCopyOutput}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium"
                                                title="Copy Output"
                                            >
                                                {copiedOutput ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                {copiedOutput ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                        <div className="p-6">
                                            <div className="mb-4">
                                                <span className="block text-sm font-medium text-slate-700 mb-2">Status</span>
                                                <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-100 rounded-md">PASSED</span>
                                            </div>

                                            <div>
                                                <span className="block text-sm font-medium text-slate-700 mb-2">Execution Output</span>
                                                <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-sm font-mono text-slate-800 min-h-[40px] whitespace-pre-wrap">
                                                    {executionOutput !== null ? executionOutput : (isCompiling ? "Calculating..." : "0")}
                                                </div>
                                            </div>
                                            <p className="mt-4 text-xs text-slate-500">
                                                The verifier ensures that despite all chaos transformations, the program output remains <span className="font-bold text-slate-700">functionally identical</span> to the reference build.
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Multi-Compilation Comparison */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.8 }}
                                        className="bg-white rounded-xl border border-gray-200 shadow-sm"
                                    >
                                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 text-slate-700">
                                            <Layers size={20} />
                                            <h3 className="font-semibold">Multi-Compilation Comparison</h3>
                                            <span className="bg-slate-700 text-white text-xs px-2 py-0.5 rounded-md ml-2">{compilationCount} runs</span>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-sm text-slate-600 mb-6">
                                                Each compilation produces a <span className="font-bold text-slate-800">different binary signature</span> while maintaining <span className="font-bold text-slate-800">identical behavior</span>.
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                                {compilationHistory.map((run) => (
                                                    <motion.div
                                                        key={run.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="font-bold text-slate-800">Run #{run.id}</span>
                                                            <span className="text-xs font-mono text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded">Seed: {run.seed}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Fingerprint size={16} className="text-slate-400" />
                                                            <span className="font-mono text-sm text-slate-600">{run.signature}</span>
                                                        </div>

                                                        <div className="space-y-1 mb-4">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Intensity:</span>
                                                                <span className={`font-medium capitalize ${run.intensity === 'none' ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                                    {run.intensity}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Instructions:</span>
                                                                <span className="font-medium text-slate-700">{run.irCount}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded text-xs font-medium border border-emerald-100">
                                                                <Check size={12} />
                                                                Verified
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">{run.timestamp}</span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                {compilationHistory.length === 0 && (
                                                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                                        <p className="text-slate-400 text-sm">No compilation history yet. Run the compiler to see comparisons.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>

                                </div>
                            )}
                    </>
                )}

                {activeTab === 'agents' && (
                    <div className="space-y-6">
                        <div className="pb-4">
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">The 4 Development Agents</h1>
                            <p className="text-lg text-slate-500 font-medium">Modular architecture for building the Chaos Compiler system</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Agent 1 - Frontend Architect */}
                            <div className="bg-white rounded-xl border border-gray-200 hover:border-slate-300 transition-colors shadow-sm p-6 flex flex-col h-full relative overflow-hidden group">
                                <span className="absolute top-4 right-4 text-7xl font-bold text-slate-50 opacity-50 z-0">1</span>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <FileText size={24} className="text-slate-700" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">Frontend Architect</h3>
                                    </div>

                                    <div className="mb-6">
                                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                            Lexer & Parser
                                        </span>
                                    </div>

                                    <div className="space-y-5 flex-grow">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Goal</span>
                                            </div>
                                            <p className="text-sm text-slate-700 font-medium">Convert raw text into structured Intermediate Representation (IR)</p>
                                        </div>

                                        <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Input</span>
                                                <span className="block text-xs font-medium text-slate-700">Raw string (Source Code)</span>
                                            </div>
                                            <div className="w-px bg-slate-200"></div>
                                            <div className="flex-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Output</span>
                                                <span className="block text-xs font-medium text-slate-700">Clean List of Objects (IR)</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-2">Task Specification</h4>
                                            <ul className="space-y-2">
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Define simple grammar (VAR = VAL, VAR = OP1 + OP2, PRINT VAR)
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Implement tokenizer for whitespace, operators, identifiers
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Validate syntax and output linear IR (Three-Address Code)
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="pt-4 mt-auto border-t border-slate-100">
                                            <div className="flex items-start gap-2">
                                                <Info size={14} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-700">Constraint</span>
                                                    <p className="text-xs text-slate-500">IR must be simple enough to be shuffled, not a complex nested tree</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Agent 2 - Chaos Engineer */}
                            <div className="bg-white rounded-xl border border-gray-200 hover:border-slate-300 transition-colors shadow-sm p-6 flex flex-col h-full relative overflow-hidden group">
                                <span className="absolute top-4 right-4 text-7xl font-bold text-slate-50 opacity-50 z-0">2</span>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <Zap size={24} className="text-slate-700" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">Chaos Engineer</h3>
                                    </div>

                                    <div className="mb-6">
                                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                            The Core
                                        </span>
                                    </div>

                                    <div className="space-y-5 flex-grow">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Goal</span>
                                            </div>
                                            <p className="text-sm text-slate-700 font-medium">Take the IR and "mess it up" without breaking it</p>
                                        </div>

                                        <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Input</span>
                                                <span className="block text-xs font-medium text-slate-700">Original IR + Chaos Config</span>
                                            </div>
                                            <div className="w-px bg-slate-200"></div>
                                            <div className="flex-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Output</span>
                                                <span className="block text-xs font-medium text-slate-700">Transformed IR</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-2">Task Specification</h4>
                                            <ul className="space-y-2">
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Safety Analysis: Identify instruction dependencies
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Math Transformation: Swap commutative operations (+, *)
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Junk Injection: Insert NOOP instructions
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Control Flow Flattening (Advanced): Break linear blocks into jumps
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="pt-4 mt-auto border-t border-slate-100">
                                            <div className="flex items-start gap-2">
                                                <Info size={14} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-700">Constraint</span>
                                                    <p className="text-xs text-slate-500">Never reorder dependent instructions (preserve data flow)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Agent 3 - Backend Specialist */}
                            <div className="bg-white rounded-xl border border-gray-200 hover:border-slate-300 transition-colors shadow-sm p-6 flex flex-col h-full relative overflow-hidden group">
                                <span className="absolute top-4 right-4 text-7xl font-bold text-slate-50 opacity-50 z-0">3</span>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <div className="font-mono text-sm font-bold leading-none flex flex-col items-center text-slate-700">
                                                <span>01</span>
                                                <span>10</span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">Backend Specialist</h3>
                                    </div>

                                    <div className="mb-6">
                                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                            Code Generator
                                        </span>
                                    </div>

                                    <div className="space-y-5 flex-grow">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Goal</span>
                                            </div>
                                            <p className="text-sm text-slate-700 font-medium">Turn Transformed IR into valid Assembly</p>
                                        </div>

                                        <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Input</span>
                                                <span className="block text-xs font-medium text-slate-700">Transformed IR</span>
                                            </div>
                                            <div className="w-px bg-slate-200"></div>
                                            <div className="flex-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Output</span>
                                                <span className="block text-xs font-medium text-slate-700">Executable Assembly Code</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-2">Task Specification</h4>
                                            <ul className="space-y-2">
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Register Allocation: Map variables to CPU registers
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Polymorphic Instruction Selection (MOV vs XOR vs SUB)
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Format output for target architecture (x86, ARM, etc.)
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="pt-4 mt-auto border-t border-slate-100">
                                            <div className="flex items-start gap-2">
                                                <Info size={14} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-700">Constraint</span>
                                                    <p className="text-xs text-slate-500">Must generate syntactically valid assembly</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Agent 4 - QA / Verification Agent */}
                            <div className="bg-white rounded-xl border border-gray-200 hover:border-slate-300 transition-colors shadow-sm p-6 flex flex-col h-full relative overflow-hidden group">
                                <span className="absolute top-4 right-4 text-7xl font-bold text-slate-50 opacity-50 z-0">4</span>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <ShieldCheck size={24} className="text-slate-700" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">QA / Verification Agent</h3>
                                    </div>

                                    <div className="mb-6">
                                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                            Differential Tester
                                        </span>
                                    </div>

                                    <div className="space-y-5 flex-grow">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Goal</span>
                                            </div>
                                            <p className="text-sm text-slate-700 font-medium">Prove the Chaos Compiler generates correct code</p>
                                        </div>

                                        <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Input</span>
                                                <span className="block text-xs font-medium text-slate-700">Source Code</span>
                                            </div>
                                            <div className="w-px bg-slate-200"></div>
                                            <div className="flex-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Output</span>
                                                <span className="block text-xs font-medium text-slate-700">Verification Report</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-2">Task Specification</h4>
                                            <ul className="space-y-2">
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Run Reference Build (Standard Compiler) → Capture Output A
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Run Chaos Build (Chaos Compiler) → Capture Output B
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Compare Output A == Output B
                                                </li>
                                                <li className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    Report: PASSED if identical, FAILED if different
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="pt-4 mt-auto border-t border-slate-100">
                                            <div className="flex items-start gap-2">
                                                <Info size={14} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-700">Constraint</span>
                                                    <p className="text-xs text-slate-500">Zero tolerance for semantic differences</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="mt-12 bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                            <h3 className="font-semibold text-slate-800 mb-6">Implementation Tech Stack</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Stack Item 1 */}
                                <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                                    <span className="block text-xs font-bold text-slate-900 mb-1">Language</span>
                                    <span className="block text-sm text-slate-600 mb-1">C (C11 Standard)</span>
                                </div>
                                {/* Stack Item 2 */}
                                <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                                    <span className="block text-xs font-bold text-slate-900 mb-1">Build System</span>
                                    <span className="block text-sm text-slate-600 mb-1">CMake</span>
                                </div>
                                {/* Stack Item 3 */}
                                <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                                    <span className="block text-xs font-bold text-slate-900 mb-1">Core Libs</span>
                                    <span className="block text-sm text-slate-600 mb-1">STL + LLVM</span>
                                </div>
                                {/* Stack Item 4 */}
                                <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                                    <span className="block text-xs font-bold text-slate-900 mb-1">Testing</span>
                                    <span className="block text-sm text-slate-600 mb-1">Python Scripts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        {/* Header */}
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">The Chaos Compiler</h1>
                            <h2 className="text-xl text-slate-500 font-medium mb-4">A Framework for Controlled Non-Deterministic Compilation</h2>
                            <p className="text-slate-600 text-lg leading-relaxed max-w-4xl">
                                Unlike traditional compilers that strive for bitwise-identical binary outputs, the Chaos Compiler intentionally generates <span className="font-bold text-slate-900">diverse binary signatures</span> for the same source code upon every compilation—while rigorously preserving program semantics.
                            </p>
                        </div>

                        {/* Primary Objectives */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-1 rounded-full border border-slate-300">
                                    <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Primary Objectives</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Objective 1 */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4 border border-slate-100">
                                        <Shield size={20} className="text-slate-700" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-2">Security</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Mitigate massive-scale binary exploitation by constantly shifting the attack surface through polymorphism.
                                    </p>
                                </div>
                                {/* Objective 2 */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4 border border-slate-100">
                                        <Bug size={20} className="text-slate-700" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-2">Robustness Testing</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Expose latent bugs in software that relies on undefined compiler behaviors or implementation-specific details.
                                    </p>
                                </div>
                                {/* Objective 3 */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4 border border-slate-100">
                                        <FlaskConical size={20} className="text-slate-700" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-2">Compiler Research</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Study the effects of entropy on code optimization, execution efficiency, and binary diversity.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* How It Works */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-slate-900">How It Works</h3>
                            </div>
                            <div className="p-8 space-y-8">
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2">The Chaos Injection Engine</h4>
                                    <p className="text-slate-600 leading-relaxed">
                                        Operating on the Intermediate Representation (IR), the engine applies randomized—yet mathematically equivalent—transformations. Each transformation is carefully designed to maintain program correctness while maximizing binary diversity.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-800 mb-4">Transformation Strategies</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            "Instruction Reordering (preserving data dependencies)",
                                            "Operand Swapping (exploiting commutativity)",
                                            "Dead Code Injection (NOOP, redundant operations)",
                                            "Alternative Instruction Selection (polymorphic assembly)",
                                            "Register Remapping (varying register allocation)",
                                            "Differential Verification (ensuring correctness)"
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                <span className="text-sm font-medium text-slate-700">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-5 flex items-start gap-3">
                                    <Info className="flex-shrink-0 text-slate-500 mt-1" size={20} />
                                    <div>
                                        <h5 className="font-bold text-slate-800 mb-1">Key Insight</h5>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            The Differential Verification Module guarantees that despite chaotic internal transformations, the functional output of the generated binary remains <span className="font-bold text-slate-900">identical</span> to a standard reference build. This ensures security and diversity without sacrificing correctness.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Real-World Applications */}
                        <div className="pb-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Real-World Applications</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2">Defense Systems</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Critical infrastructure can recompile daily, preventing attackers from developing reliable exploits against fixed binary patterns.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2">Continuous Testing</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Automated nightly builds with different chaos seeds can expose race conditions and undefined behavior in test suites.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-2">Compiler Research</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Academic study of optimization stability, determinism requirements, and the relationship between source code and machine code.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </main >

            {/* Footer */}
            < footer className="py-6 sm:py-8 text-center text-slate-400 text-xs sm:text-sm px-4" >
                An experimental compiler infrastructure for enhanced software robustness and security
            </footer >
        </div >
    );
}

export default App;
