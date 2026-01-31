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
    const base = { bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-600", icon: Box };

    if (label.includes('Program'))
        return { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", icon: Layers };

    if (label.includes('Function'))
        return { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", icon: FunctionSquare };

    if (label.includes('Binary') || label.includes('BinaryExpr'))
        return { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", icon: Calculator };

    if (label.includes('Literal'))
        return { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", icon: Hash };

    if (label.includes('ID') || label.includes('VarDecl'))
        return { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", icon: Type };

    if (label.includes('Return'))
        return { bg: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-700", icon: Code };

    return base;
};

// --- Tree Node Component ---
const TreeNode = ({ label, children, isRoot = false, isFirst = false, isLast = false, isOnlyChild = false }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = children && children.length > 0;
    const { bg, border, text, icon: Icon } = getNodeStyle(label || '');

    const labelStr = label || 'Node';
    const [nodeType, nodeValue] = labelStr.includes(':') ? labelStr.split(':') : [labelStr, ''];

    return (
        <div className="flex flex-col items-center relative px-2 md:px-4">
            {/* Connector Lines */}
            {!isRoot && (
                <div className="absolute top-0 w-full h-6" style={{ transform: 'translateY(-100%)' }}>
                    <div className="absolute left-1/2 bottom-0 w-px h-6 bg-slate-300 -translate-x-1/2" />
                    {!isOnlyChild && (
                        <>
                            {!isLast && <div className="absolute right-0 top-0 w-1/2 h-px bg-slate-300" />}
                            {!isFirst && <div className="absolute left-0 top-0 w-1/2 h-px bg-slate-300" />}
                        </>
                    )}
                </div>
            )}

            {/* Node Card */}
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`
                    relative z-10 flex flex-col items-center justify-center 
                    px-3 py-2 rounded-lg border shadow-sm cursor-pointer 
                    hover:shadow-md hover:-translate-y-0.5 transition-all
                    ${bg} ${border} ${text} min-w-[100px] max-w-[180px]
                `}
            >
                <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className="opacity-70" />
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {nodeType}
                    </span>
                </div>
                {nodeValue && (
                    <span className="text-xs font-mono font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                        {nodeValue}
                    </span>
                )}

                {hasChildren && (
                    <div className="mt-1 text-slate-400">
                        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                )}
            </motion.div>

            {/* Children */}
            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-px h-6 bg-slate-300" />
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

// --- Main Component ---
export const ParseTreeCard = ({ ast }) => {
    const treeData = astToTreeData(ast);
    const treeRef = React.useRef(null);

    const handleDownload = async () => {
        if (!treeRef.current) return;
        try {
            const canvas = await html2canvas(treeRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
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
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3 text-slate-700">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <GitBranch size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Parse Tree</h3>
                        <p className="text-xs text-slate-400">Hierarchical AST View</p>
                    </div>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={!treeData}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={14} />
                    Download PNG
                </button>
            </div>

            {/* Tree Canvas */}
            <div className="flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] p-12 custom-scrollbar">
                <div className="min-w-fit flex justify-center" ref={treeRef}>
                    {treeData ? (
                        <TreeNode {...treeData} isRoot={true} isOnlyChild={true} />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2 mt-20">
                            <Box size={40} strokeWidth={1} />
                            <p className="text-sm">No AST data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
