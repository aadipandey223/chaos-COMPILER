import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { CompilerProvider, useCompiler } from './store/useCompilerStore';
import { compileCode } from './api/compile';
import { useTheme } from './hooks/useTheme';
import { ThemeContext } from './context/ThemeContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AppShell from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import LearnPage from './pages/LearnPage';

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
  return (
    <>
      <KeyboardShortcuts />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/*" element={<AppShell />} />
        <Route path="/learn/*" element={<LearnPage />} />
      </Routes>
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
