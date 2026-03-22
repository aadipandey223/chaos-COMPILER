import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CompilerProvider, useCompiler } from './store/useCompilerStore';
import { compileCode } from './api/compile';
import { useTheme } from './hooks/useTheme';
import { ThemeContext } from './context/ThemeContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AppShell from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import LearnPage from './pages/LearnPage';

const pageVariants = {
  initial:  { opacity: 0, y: 12, filter: 'blur(3px)' },
  animate:  { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 0.3,
                  ease: [0.16, 1, 0.3, 1] }},
  exit:     { opacity: 0, y: -8, filter: 'blur(3px)',
    transition: { duration: 0.18 }},
};

function KeyboardShortcuts() {
  const { state, dispatch } = useCompiler();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = async (e) => {
      if (!e.ctrlKey && !e.metaKey) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (state.status === 'compiling' || !state.code.trim()) return;
        dispatch({ type: 'COMPILE_START' });
        try {
          const result = await compileCode(state.code, state.options);
          dispatch({ type: 'COMPILE_SUCCESS', payload: result });
          navigate('/app/ast');
        } catch (err) {
          dispatch({ type: 'COMPILE_ERROR', payload: err.message });
        }
        return;
      }

      const pageMap = { '1': '/app/editor', '2': '/app/ast', '3': '/app/diff', '4': '/app/log' };
      if (pageMap[e.key]) {
        e.preventDefault();
        navigate(pageMap[e.key]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.code, state.options, state.status, dispatch, navigate]);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  // Use the first path segment as the animation key so sub-routes don't re-trigger
  const routeKey = '/' + (location.pathname.split('/')[1] || '');

  return (
    <>
      <KeyboardShortcuts />
      <AnimatePresence mode="wait">
        <motion.div
          key={routeKey}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ height: '100%', width: '100%' }}
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app/*" element={<AppShell />} />
            <Route path="/learn/*" element={<LearnPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ErrorBoundary>
        <CompilerProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CompilerProvider>
      </ErrorBoundary>
    </ThemeContext.Provider>
  );
}
