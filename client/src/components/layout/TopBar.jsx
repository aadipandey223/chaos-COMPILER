import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCompiler } from '../../store/useCompilerStore';
import { useThemeContext } from '../../context/ThemeContext';
import { compileCode, compileFile } from '../../api/compile';
import Spinner from '../ui/Spinner';
import styles from './TopBar.module.css';

function StatusBadge({ status }) {
  const map = {
    idle:      { label: 'Ready',       cls: styles.idle      },
    compiling: { label: 'Compiling…',  cls: styles.compiling },
    success:   { label: 'Success',     cls: styles.success   },
    error:     { label: 'Error',       cls: styles.error     },
  };
  const { label, cls } = map[status] || map.idle;
  return (
    <div className={`${styles.statusBadge} ${cls}`}>
      {status === 'compiling' && <Spinner size={12} />}
      {label}
    </div>
  );
}

export default function TopBar() {
  const { state, dispatch } = useCompiler();
  const { theme, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleCompile = async () => {
    dispatch({ type: 'COMPILE_START' });
    try {
      const result = await compileCode(state.code, state.options);
      dispatch({ type: 'COMPILE_SUCCESS', payload: result });
      navigate('/app/ast');
    } catch (err) {
      dispatch({ type: 'COMPILE_ERROR', payload: err.message });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: 'COMPILE_START' });
    try {
      const result = await compileFile(file, state.options);
      dispatch({ type: 'COMPILE_SUCCESS', payload: result });
      navigate('/app/ast');
    } catch (err) {
      dispatch({ type: 'COMPILE_ERROR', payload: err.message });
    } finally {
      e.target.value = null;
    }
  };

  return (
    <header className={styles.topbar}>
      <Link to="/" className={styles.brand}>
        <span className={styles.brandAccent}>⚡</span>
        Chaos Compiler
      </Link>

      <div className={styles.actions}>
        <StatusBadge status={state.status} />

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".c,.cpp"
          onChange={handleFileChange}
        />

        <button
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload file
        </button>

        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 100 11 5.5 5.5 0 007-4z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <motion.button
          className={styles.compileBtn}
          onClick={handleCompile}
          disabled={state.status === 'compiling' || !state.code.trim()}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
        >
          {state.status === 'compiling' ? 'Compiling…' : 'Compile'}
        </motion.button>
      </div>
    </header>
  );
}
