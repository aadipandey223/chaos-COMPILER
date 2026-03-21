import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import ErrorBoundary from '../ui/ErrorBoundary';
import EditorPage from '../../pages/EditorPage';
import AstPage from '../../pages/AstPage';
import DiffPage from '../../pages/DiffPage';
import LogPage from '../../pages/LogPage';
import styles from './AppShell.module.css';

export default function AppShell() {
  return (
    <div className={styles.shell}>
      <TopBar />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          <ErrorBoundary>
            <Routes>
              <Route index element={<EditorPage />} />
              <Route path="editor" element={<EditorPage />} />
              <Route path="ast"    element={<AstPage />} />
              <Route path="diff"   element={<DiffPage />} />
              <Route path="log"    element={<LogPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
