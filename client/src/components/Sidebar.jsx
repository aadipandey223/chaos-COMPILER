import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCompiler } from '../store/useCompilerStore';
import classes from './Sidebar.module.css';

export default function Sidebar() {
  const { state } = useCompiler();

  return (
    <div className={classes.sidebar}>
      <nav className={classes.nav}>
        <NavLink to="/" className={({isActive}) => isActive ? `${classes.link} ${classes.active}` : classes.link} end>
          [ ] Editor
        </NavLink>
        <NavLink to="/ast" className={({isActive}) => isActive ? `${classes.link} ${classes.active}` : classes.link}>
          [ ] AST tree
        </NavLink>
        <NavLink to="/diff" className={({isActive}) => isActive ? `${classes.link} ${classes.active}` : classes.link}>
          [ ] Diff
        </NavLink>
        <NavLink to="/log" className={({isActive}) => isActive ? `${classes.link} ${classes.active}` : classes.link}>
          [ ] Mutation log
        </NavLink>
      </nav>
      
      <div className={classes.infoPanel}>
        <p>Seed: {state.options.seed || 'random'}</p>
        <p>Intensity: {state.options.intensity}</p>
      </div>
    </div>
  );
}
