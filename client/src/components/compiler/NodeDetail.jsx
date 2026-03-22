import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './NodeDetail.module.css';

const DEFAULT_DESCRIPTION = "AST node.";

const descriptionMap = {
  Program:   "Root of the file. Contains all top-level functions and declarations.",
  FuncDecl:  "Function definition. value = function name. Children are parameters, right = body block.",
  VarDecl:   "Variable declaration. value = variable name. left = initial value expression (if any).",
  Block:     "A { } block. Children are the statements inside it.",
  Return:    "Return statement. left = returned expression.",
  If:        "If statement. cond = condition, left = then block, right = else block (may be absent).",
  While:     "While loop. cond = condition, left = body.",
  BinaryOp:  "Two-operand expression. value = operator (+,-,*,/,==,!=,<,>). left and right = operands.",
  UnaryOp:   "Single-operand expression. value = operator (- or !). left = operand.",
  Assign:    "Assignment. value = variable name. left = new value expression.",
  Number:    "Numeric literal. value = the number.",
  StringLiteral: "String literal. value = the text content (with quotes).",
  Ident:     "Variable reference. value = variable name.",
  Call:      "Function call. value = function name. Children = arguments.",
};

const NodeDetail = ({ node }) => {
  return (
    <div className={styles.panel}>
      <AnimatePresence mode="wait">
        {!node ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <p className={styles.placeholder}>
              Click any node in the tree to inspect it.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={JSON.stringify(node)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <h3 className={styles.nodeType}>{node.type}</h3>
            
            <table className={styles.table}>
              <tbody>
                <tr>
                  <td>Type</td>
                  <td>{node.type || '—'}</td>
                </tr>
                <tr>
                  <td>Value</td>
                  <td>{node.value || '—'}</td>
                </tr>
                <tr>
                  <td>Line</td>
                  <td>{node.line || '—'}</td>
                </tr>
                <tr>
                  <td>Column</td>
                  <td>{node.col || '—'}</td>
                </tr>
                <tr>
                  <td>Role</td>
                  <td>{node.role || '—'}</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.description}>
              {descriptionMap[node.type] || DEFAULT_DESCRIPTION}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NodeDetail;
