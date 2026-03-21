import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { select } from 'd3';
import { useCompiler } from '../store/useCompilerStore';
import { adaptAst } from '../utils/astAdapter';
import AstTree from '../components/compiler/AstTree';
import NodeDetail from '../components/compiler/NodeDetail';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import styles from './AstPage.module.css';

function countNodes(n) {
  if (!n) return 0;
  return 1 + (n.children || []).reduce((s, c) => s + countNodes(c), 0);
}

function collectTypes(n, set) {
  if (!n) return;
  set.add(n.meta.type);
  (n.children || []).forEach(c => collectTypes(c, set));
}

const LEGEND = [
  { color: 'var(--node-funcdecl)', label: 'Declarations' },
  { color: 'var(--node-control)',  label: 'Statements'   },
  { color: 'var(--node-expr)',     label: 'Expressions'  },
  { color: 'var(--node-literal)',  label: 'Literals'     },
  { color: 'var(--node-call)',     label: 'Calls'        },
];

export default function AstPage() {
  const { state: { ast, status, error, mutations } } = useCompiler();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('tree');
  const [search, setSearch] = useState('');
  const svgRef = React.useRef(null);

  const mutatedLines = React.useMemo(
    () => new Set((mutations || []).map(m => m.line).filter(Boolean)),
    [mutations]
  );

  const handleSvgRef = useCallback((ref) => { svgRef.current = ref; }, []);

  const handleExportPng = () => {
    const svgEl = document.querySelector('svg[data-ast-tree]');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ast.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'compiling') {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingLabel}>Parsing AST…</div>
        <LoadingSkeleton variant="tree" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        icon="✕"
        heading="Compilation failed"
        description={error}
        action="Back to editor"
        onAction={() => navigate('/app/editor')}
      />
    );
  }

  if (!ast) {
    return (
      <EmptyState
        icon="⬡"
        heading="No AST yet"
        description="Write some code and hit Compile."
        action="Go to editor"
        onAction={() => navigate('/app/editor')}
      />
    );
  }

  const adapted = adaptAst(ast);
  const total = countNodes(adapted);
  const typesSet = new Set();
  collectTypes(adapted, typesSet);

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.meta}>
            {total} nodes · {typesSet.size} types
          </span>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'tree' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Visual Tree
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'json' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('json')}
            >
              JSON
            </button>
          </div>

          {viewMode === 'tree' && (
            <input
              type="text"
              placeholder="Search nodes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          )}
        </div>

        <div className={styles.toolbarRight}>
          {viewMode === 'tree' && (
            <>
              <div className={styles.legend}>
                {LEGEND.map(({ color, label }) => (
                  <div key={label} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: color }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <button className={styles.toolBtn} onClick={handleExportPng}>
                Export SVG
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.treePane}>
          {viewMode === 'tree' ? (
            <AstTree
              data={adapted}
              onNodeClick={setSelected}
              search={search}
              mutatedLines={mutatedLines}
            />
          ) : (
            <div className={styles.jsonPane}>
              <CodeMirror
                value={JSON.stringify(ast, null, 2)}
                extensions={[json()]}
                theme={oneDark}
                readOnly
                style={{ fontSize: '13px', height: '100%' }}
              />
            </div>
          )}
        </div>
        {viewMode === 'tree' && (
          <NodeDetail node={selected} />
        )}
      </div>
    </div>
  );
}
