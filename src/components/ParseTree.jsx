import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch,
    Box,
    Code,
    Type,
    Hash,
    Calculator,
    ChevronDown,
    ChevronUp,
    Layers,
    FunctionSquare,
    Download
} from 'lucide-react';
import html2canvas from 'html2canvas';

// --- Node Style Configuration ---
const getNodeStyle = (label) => {
    // Light "Cream" Eye-Soothing Palette
    const base = { bg: "bg-[#fdfbf7]", border: "border-[#e0d6c5]", text: "text-[#5d4a3b]", icon: Box, desc: "A generic AST node" };

    if (label.includes('Program'))
        return { bg: "bg-[#f2f4ff]", border: "border-[#c5cae9]", text: "text-[#3f51b5]", icon: Layers, desc: "The entry point of the source program" };

    if (label.includes('Function'))
        return { bg: "bg-[#f3eaff]", border: "border-[#d1c4e9]", text: "text-[#673ab7]", icon: FunctionSquare, desc: "A block of code that performs a specific task" };

    if (label.includes('Binary') || label.includes('BinaryExpr'))
        return { bg: "bg-[#fff0f0]", border: "border-[#ffcdd2]", text: "text-[#d32f2f]", icon: Calculator, desc: "A mathematical or logical operation" };

    if (label.includes('Literal'))
        return { bg: "bg-[#f0fff4]", border: "border-[#c6f6d5]", text: "text-[#2e7d32]", icon: Hash, desc: "A fixed constant value" };

    if (label.includes('ID') || label.includes('VarDecl'))
        return { bg: "bg-[#fffaf0]", border: "border-[#feebc8]", text: "text-[#dd6b20]", icon: Type, desc: "Variable name or declaration" };

    if (label.includes('Return'))
        return { bg: "bg-[#fff5f7]", border: "border-[#fed7e2]", text: "text-[#d53f8c]", icon: Code, desc: "Exits function and returns a value" };

    return base;
};

// --- Tree Node Component ---
const TreeNode = ({ label, children, isRoot = false, isFirst = false, isLast = false, isOnlyChild = false }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = children && children.length > 0;
    const { bg, border, text, icon: Icon, desc } = getNodeStyle(label || '');

    const labelStr = label || 'Node';
    const [nodeType, nodeValue] = labelStr.includes(':') ? labelStr.split(':') : [labelStr, ''];

    return (
        <div className="flex flex-col items-center relative px-2 md:px-4">
            {!isRoot && (
                <div className="absolute top-0 w-full h-6" style={{ transform: 'translateY(-100%)' }}>
                    <div className="absolute left-1/2 bottom-0 w-px h-6 bg-[#e0d6c5] -translate-x-1/2" />
                    {!isOnlyChild && (
                        <>
                            {!isLast && <div className="absolute right-0 top-0 w-1/2 h-px bg-[#e0d6c5]" />}
                            {!isFirst && <div className="absolute left-0 top-0 w-1/2 h-px bg-[#e0d6c5]" />}
                        </>
                    )}
                </div>
            )}

            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`
                    relative z-10 flex flex-col items-center justify-center 
                    px-4 py-2.5 rounded-xl border shadow-sm cursor-pointer 
                    hover:scale-105 transition-all group
                    ${bg} ${border} ${text} min-w-[120px] max-w-[200px]
                `}
            >
                <div className="flex items-center gap-2 mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Icon size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                        {nodeType}
                    </span>
                </div>
                {nodeValue && (
                    <span className="text-sm font-mono font-bold text-[#2d3748] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                        {nodeValue}
                    </span>
                )}

                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#2d3748] text-[#f7fafc] text-[10px] px-2 py-1 rounded border border-[#4a5568] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-lg">
                    {desc}
                </div>

                {hasChildren && (
                    <div className="mt-1 text-slate-400 group-hover:text-slate-600 transition-colors">
                        {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-px h-6 bg-[#e0d6c5]" />
                        <div className="flex flex-row items-start justify-center pt-6 relative">
                            {children.map((child, index) => (
                                <TreeNode
                                    key={index}
                                    {...child}
                                    isRoot={false}
                                    isFirst={index === 0}
                                    isLast={index === children.length - 1}
                                    isOnlyChild={children.length === 1}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- AST Processor ---
export const astToTreeData = (node) => {
    if (!node) return null;
    if (node.type === 'Program') return { label: 'Program', children: node.body.map(astToTreeData).filter(Boolean) };
    if (node.type === 'FunctionDeclaration') return { label: `Function:${node.name}`, children: node.body.map(astToTreeData).filter(Boolean) };
    if (node.type === 'VariableDeclaration') return { label: `VarDecl:${node.kind}`, children: node.declarations.map(d => ({ label: `Assign:${d.id}`, children: [astToTreeData(d.init)].filter(Boolean) })) };
    if (node.type === 'BinaryExpression') return { label: `Binary:${node.operator}`, children: [astToTreeData(node.left), astToTreeData(node.right)].filter(Boolean) };
    if (node.type === 'Literal') return { label: `Literal:${node.value}` };
    if (node.type === 'Identifier') return { label: `ID:${node.name}` };
    if (node.type === 'ReturnStatement') return { label: 'Return', children: [astToTreeData(node.argument)].filter(Boolean) };
    return { label: `Node:${node.type}` };
};

// --- Main Component ---
export const ParseTreeCard = ({ ast }) => {
    const treeData = astToTreeData(ast);
    const treeRef = React.useRef(null);

    const handleDownload = async () => {
        if (!treeRef.current) return;
        try {
            const canvas = await html2canvas(treeRef.current, { backgroundColor: '#fdfbf7', scale: 2 });
            const link = document.createElement('a');
            link.download = `chaos-ast-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to download parse tree:', err);
        }
    };

    return (
        <div className="bg-[#fdfbf7] border border-[#e2e8f0] overflow-hidden h-full flex flex-col rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-[#edebef] flex items-center justify-between bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="p-2 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-lg">
                        <GitBranch size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm uppercase tracking-widest text-slate-700 leading-tight">Parse Tree</h3>
                        <p className="text-[10px] font-medium text-slate-400">HIERARCHICAL LABORATORY VIEW</p>
                    </div>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={!treeData}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-100 rounded-lg transition-all disabled:opacity-50"
                >
                    <Download size={14} />
                    Snap View
                </button>
            </div>

            <div className="flex-1 overflow-auto bg-[#faf9f6]/40 [background-image:radial-gradient(#e0d6c5_0.8px,transparent_0.8px)] [background-size:24px_24px] p-12 custom-scrollbar">
                <div className="min-w-fit flex justify-center" ref={treeRef}>
                    {treeData ? (
                        <TreeNode {...treeData} isRoot={true} isOnlyChild={true} />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 gap-2 mt-20 opacity-40">
                            <Box size={64} strokeWidth={1} />
                            <p className="text-xl font-bold uppercase tracking-tighter">Engine Idle</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
