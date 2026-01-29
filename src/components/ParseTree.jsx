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

// --- 1. Configuration & Helpers ---

const getNodeStyle = (label) => {
    const base = { bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-600", icon: Box };

    if (label.includes('Program'))
        return { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", icon: Layers };

    if (label.includes('Function'))
        return { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", icon: FunctionSquare };

    if (label.includes('Binary') || label.includes('BinaryExpr'))
        return { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", icon: Calculator };

    if (label.includes('Literal'))
        return { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", icon: Hash };

    if (label.includes('ID') || label.includes('ID') || label.includes('VarDecl'))
        return { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", icon: Type };

    if (label.includes('Return'))
        return { bg: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-700", icon: Code };

    return base;
};

// --- 2. The Node Component (Recursive) ---

const TreeNode = ({ label, children, isRoot = false, isFirst = false, isLast = false, isOnlyChild = false }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = children && children.length > 0;
    const { bg, border, text, icon: Icon } = getNodeStyle(label || '');

    // Parsing the label for display (Splitting "Type: Value")
    const labelStr = label || 'Node';
    const [nodeType, nodeValue] = labelStr.includes(':') ? labelStr.split(':') : [labelStr, ''];

    return (
        <div className="flex flex-col items-center relative px-1 sm:px-2 md:px-4">
            {/* --- CONNECTOR LINES ABOVE (for non-root nodes) --- */}
            {!isRoot && (
                <div className="absolute top-0 w-full h-4 sm:h-6" style={{ transform: 'translateY(-100%)' }}>
                    {/* Vertical line down to this node */}
                    <div className="absolute left-1/2 bottom-0 w-px h-4 sm:h-6 bg-slate-200 -translate-x-1/2" />

                    {/* Horizontal lines connecting to siblings */}
                    {!isOnlyChild && (
                        <>
                            {/* Line to the right (if not last child) */}
                            {!isLast && <div className="absolute right-0 top-0 w-1/2 h-px bg-slate-200" />}
                            {/* Line to the left (if not first child) */}
                            {!isFirst && <div className="absolute left-0 top-0 w-1/2 h-px bg-slate-200" />}
                        </>
                    )}
                </div>
            )}

            {/* --- NODE CARD --- */}
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`
                    relative z-10 flex flex-col items-center justify-center 
                    px-2 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border shadow-sm cursor-pointer 
                    hover:shadow-md hover:-translate-y-0.5 transition-all
                    ${bg} ${border} ${text} min-w-[80px] sm:min-w-[100px] max-w-[120px] sm:max-w-[180px]
                `}
            >
                <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <Icon size={12} className="opacity-70 sm:w-3.5 sm:h-3.5" />
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {nodeType}
                    </span>
                </div>
                {nodeValue && (
                    <span className="text-[10px] sm:text-xs font-mono font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                        {nodeValue}
                    </span>
                )}

                {hasChildren && (
                    <div className={`mt-0.5 sm:mt-1 -mb-1 text-slate-400 hover:text-slate-600`}>
                        {isOpen ? <ChevronUp size={10} className="sm:w-3 sm:h-3" /> : <ChevronDown size={10} className="sm:w-3 sm:h-3" />}
                    </div>
                )}
            </motion.div>

            {/* --- CHILDREN SECTION --- */}
            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center"
                    >
                        {/* Vertical Stem below parent */}
                        <div className="w-px h-4 sm:h-6 bg-slate-200" />

                        {/* Children Row Container */}
                        <div className="flex flex-row items-start justify-center pt-4 sm:pt-6 relative">
                            {/* The horizontal bar connecting children is handled by the children's top lines */}
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

// --- 3. AST Processor ---

export const astToTreeData = (node) => {
    if (!node) return null;

    if (node.type === 'Program') {
        return {
            label: 'Program',
            children: node.body.map(astToTreeData).filter(Boolean)
        };
    }
    if (node.type === 'FunctionDeclaration') {
        return {
            label: `Function:${node.name}`,
            children: node.body.map(astToTreeData).filter(Boolean)
        };
    }
    if (node.type === 'VariableDeclaration') {
        return {
            label: `VarDecl:${node.kind}`,
            children: node.declarations.map(d => ({
                label: `Assign:${d.id}`,
                children: [astToTreeData(d.init)].filter(Boolean)
            }))
        };
    }
    if (node.type === 'BinaryExpression') {
        return {
            label: `Binary:${node.operator}`,
            children: [astToTreeData(node.left), astToTreeData(node.right)].filter(Boolean)
        };
    }
    if (node.type === 'Literal') {
        return { label: `Literal:${node.value}` };
    }
    if (node.type === 'Identifier') {
        return { label: `ID:${node.name}` };
    }
    if (node.type === 'ReturnStatement') {
        return {
            label: 'Return',
            children: [astToTreeData(node.argument)].filter(Boolean)
        };
    }
    return { label: `Node:${node.type}` };
};

export const ParseTreeCard = ({ ast }) => {
    const treeData = astToTreeData(ast);
    const treeRef = React.useRef(null);

    const handleDownload = async () => {
        if (!treeRef.current) return;
        try {
            const canvas = await html2canvas(treeRef.current, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true
            });
            const link = document.createElement('a');
            link.download = `chaos-ast-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to download parse tree:', err);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2 sm:gap-3 text-slate-700">
                    <div className="p-1.5 sm:p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <GitBranch size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm sm:text-base lg:text-lg leading-tight">Parse Tree</h3>
                        <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">Hierarchical AST View</p>
                    </div>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={!treeData}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline">Download PNG</span>
                    <span className="xs:hidden">PNG</span>
                </button>
            </div>

            {/* The canvas needs allow panning/scrolling for wide trees */}
            <div className="flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] sm:[background-size:20px_20px] p-6 sm:p-12 custom-scrollbar">
                <div className="min-w-fit flex justify-center" ref={treeRef}>
                    {treeData ? (
                        <TreeNode {...treeData} isRoot={true} isOnlyChild={true} />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2 mt-12 sm:mt-20">
                            <Box size={32} strokeWidth={1} className="sm:w-10 sm:h-10" />
                            <p className="text-xs sm:text-sm">No AST data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
