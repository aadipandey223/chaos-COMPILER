import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompiler } from '../store/useCompilerStore';
import { compileCode, compileFile } from '../api/compile';
import StatusBadge from './StatusBadge';
import classes from './TopBar.module.css';

export default function TopBar() {
  const { state, dispatch } = useCompiler();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleCompile = async () => {
    dispatch({ type: 'COMPILE_START' });
    try {
      const result = await compileCode(state.code, state.options);
      dispatch({ type: 'COMPILE_SUCCESS', payload: result });
      navigate('/ast');
    } catch (err) {
      dispatch({ type: 'COMPILE_ERROR', payload: err.message });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    dispatch({ type: 'COMPILE_START' });
    try {
      const result = await compileFile(file, state.options);
      dispatch({ type: 'COMPILE_SUCCESS', payload: result });
      navigate('/ast');
    } catch (err) {
      dispatch({ type: 'COMPILE_ERROR', payload: err.message });
    } finally {
      // Reset input value so the same file can be uploaded again
      e.target.value = null;
    }
  };

  return (
    <div className={classes.topbar}>
      <div className={classes.brand}>
        Chaos Compiler
      </div>
      <div className={classes.actions}>
        <StatusBadge status={state.status} />
        
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".c,.cpp" 
          onChange={handleFileChange} 
        />
        
        <button className={classes.uploadBtn} onClick={handleUploadClick}>
          Upload file
        </button>
        
        <button 
          className={classes.compileBtn} 
          onClick={handleCompile}
          disabled={state.status === 'compiling' || !state.code.trim()}
        >
          Compile
        </button>
      </div>
    </div>
  );
}
