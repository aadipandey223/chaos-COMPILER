import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import ErrorBoundary from '../ui/ErrorBoundary';
import styles from './AppShell.module.css';

const EditorPage = lazy(() => import('../../pages/EditorPage'));
const AstPage = lazy(() => import('../../pages/AstPage'));
const DiffPage = lazy(() => import('../../pages/DiffPage'));
const LogPage = lazy(() => import('../../pages/LogPage'));

export default function AppShell() {
  return (
    <div className={styles.shell}>
      <TopBar />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          <ErrorBoundary>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route index element={<EditorPage />} />
                <Route path="editor" element={<EditorPage />} />
                <Route path="ast"    element={<AstPage />} />
                <Route path="diff"   element={<DiffPage />} />
                <Route path="log"    element={<LogPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
