import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCompiler } from '../../store/useCompilerStore';
import Divider from '../ui/Divider';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/app/editor', label: 'Editor',       icon: '{ }' },
  { to: '/app/ast',    label: 'AST Tree',      icon: '⬡'   },
  { to: '/app/diff',   label: 'Diff',          icon: '⇄'   },
  { to: '/app/log',    label: 'Mutation Log',  icon: '≡'   },
  { to: '/app/learners', label: 'Learners',    icon: '✦'   },
];

export default function Sidebar() {
  const { state, dispatch } = useCompiler();

  const handleOptions = (e) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_OPTIONS', payload: { [name]: value } });
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: {
      opacity: 1, x: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <aside className={styles.sidebar}>
      <motion.nav
        className={styles.nav}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            {({ isActive }) => (
              <motion.div className={styles.linkInner} variants={itemVariants}>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className={styles.activePill}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className={styles.accentBar} />
                <span className={styles.icon}>{icon}</span>
                <span className={styles.labelText}>{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </motion.nav>

      <Divider />

      <div className={styles.settings}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="sb-seed">Seed</label>
          <input
            id="sb-seed"
            name="seed"
            type="text"
            placeholder="random"
            value={state.options.seed}
            onChange={handleOptions}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="sb-intensity">Intensity</label>
          <select
            id="sb-intensity"
            name="intensity"
            value={state.options.intensity}
            onChange={handleOptions}
            className={styles.select}
          >
            <option value="low">Low — 1–2 mutations</option>
            <option value="medium">Medium — 3–5 mutations</option>
            <option value="high">High — aggressive</option>
          </select>
        </div>

        {/* Custom rules slot — reserved for future */}
        <div className={styles.lockedSlot}>
          <span className={styles.lockIcon}>🔒</span>
          <span className={styles.lockLabel}>Custom rules</span>
          <span className={styles.comingSoon}>soon</span>
        </div>
      </div>
    </aside>
  );
}
