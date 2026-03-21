import React, { useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import StageControls from '../components/learn/StageControls';
import LexerStage from '../components/learn/stages/LexerStage';
import ParserStage from '../components/learn/stages/ParserStage';
import AstStage from '../components/learn/stages/AstStage';
import SemanticStage from '../components/learn/stages/SemanticStage';
import CodegenStage from '../components/learn/stages/CodegenStage';
import { STAGES } from '../utils/tutorialData';
import styles from './LearnPage.module.css';

const STAGE_COMPONENTS = {
  lexer:    LexerStage,
  parser:   ParserStage,
  ast:      AstStage,
  semantic: SemanticStage,
  codegen:  CodegenStage,
};

function LearnShell() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [step, setStep]   = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const currentPath = location.pathname.replace('/learn/', '').replace('/learn', '');
  const stageId     = currentPath || 'lexer';
  const stageIdx    = STAGES.findIndex(s => s.id === stageId);
  const stage       = STAGES[stageIdx] || STAGES[0];

  const StageComponent = STAGE_COMPONENTS[stage.id] || LexerStage;

  const goToStage = (idx) => {
    setStep(0);
    setPlaying(false);
    navigate(STAGES[idx].path);
  };

  const handleBack = () => {
    if (step > 0) { setStep(s => s - 1); }
    else if (stageIdx > 0) { goToStage(stageIdx - 1); }
  };

  const handleNext = () => {
    navigate(STAGES[Math.min(stageIdx + 1, STAGES.length - 1)].path);
    setStep(0);
    setPlaying(false);
  };

  const handleStep = useCallback(() => setStep(s => s + 1), []);

  return (
    <div className={styles.shell}>
      <Navbar />

      {/* Progress bar */}
      <div className={styles.progress}>
        <div className={styles.progressDots}>
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              className={`${styles.dot} ${i === stageIdx ? styles.dotActive : ''} ${i < stageIdx ? styles.dotDone : ''}`}
              onClick={() => goToStage(i)}
              title={s.label}
            />
          ))}
        </div>
        <div className={styles.stageLabel}>
          Stage {stageIdx + 1} of {STAGES.length} — {stage.label}
        </div>
      </div>

      {/* Stage content */}
      <div className={styles.stageArea}>
        <StageComponent step={step} speed={speed} playing={playing} onStepComplete={handleStep} />
      </div>

      {/* Controls */}
      <StageControls
        step={step}
        playing={playing}
        speed={speed}
        canBack={stageIdx > 0 || step > 0}
        canNext={stageIdx < STAGES.length - 1}
        onBack={handleBack}
        onPlay={() => setPlaying(p => !p)}
        onStep={handleStep}
        onNext={handleNext}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}

export default function LearnPage() {
  return (
    <Routes>
      <Route path="/*" element={<LearnShell />} />
    </Routes>
  );
}
