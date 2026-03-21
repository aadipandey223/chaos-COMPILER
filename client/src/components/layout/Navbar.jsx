import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.brand}>
        <span className={styles.brandIcon}>⚡</span>
        Chaos Compiler
      </Link>

      <div className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
        <Link to="/app/editor" className={styles.link}>Editor</Link>
        <Link to="/learn" className={styles.link}>Learn</Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          GitHub ↗
        </a>
        <Link to="/app/editor" className={styles.cta}>Start compiling →</Link>
      </div>

      <button
        className={styles.menuBtn}
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>
    </nav>
  );
}
