const fs = require('fs');
const p = 'E:/chaos-COMPILER/client/src/components/compiler/AstTree.jsx';
let code = fs.readFileSync(p, 'utf8');

const s1 = \  function advanceStep(step) {
    if (step >= stepsRef.current.length) {
      setIsPlaying(false);
      exitReplay();
      return;
    }
    const s = stepsRef.current[step];
    const key = s.node.data.meta && s.node.data.meta.type
      ? s.node.data.meta.type + (s.node.data.meta.line || '0') + s.node.data.name
      : s.node.data.name;

    if (s.kind === 'node') visibleNodesRef.current.add(key);
    else visibleEdgesRef.current.add(key);

    setCurrentStep(step + 1);
    renderTreeCore(true, visibleNodesRef.current, visibleEdgesRef.current, step + 1);
  }\;

const r1 = \  function advanceStep(step) {
    if (step >= stepsRef.current.length) {
      setIsPlaying(false);
      exitReplay();
      return;
    }
    const s = stepsRef.current[step];
    const key = s.node.data.meta && s.node.data.meta.type
      ? s.node.data.meta.type + (s.node.data.meta.line || '0') + s.node.data.name
      : s.node.data.name;

    if (s.kind === 'node') visibleNodesRef.current.add(key);
    else visibleEdgesRef.current.add(key);

    setCurrentStep(step + 1);

    const svg = select(svgRef.current);
    const tDur = STEP_DURATION[speed] ? STEP_DURATION[speed] * 0.7 : 300;

    const lastStep = step > 0 ? stepsRef.current[step - 1] : null;
    if (lastStep && lastStep.kind === 'node') {
         const prevKey = lastStep.node.data.meta && lastStep.node.data.meta.type
           ? lastStep.node.data.meta.type + (lastStep.node.data.meta.line || '0') + lastStep.node.data.name
           : lastStep.node.data.name;
         
         svg.selectAll('.ast-node').filter(d => {
              const dkey = d.data.meta && d.data.meta.type ? d.data.meta.type + (d.data.meta.line || '0') + d.data.name : d.data.name;
              return dkey === prevKey;
         }).select('rect')
           .transition().duration(200)
           .attr('stroke', d => mutatedLines && mutatedLines.has(d.data.meta && d.data.meta.line) ? '#d4522a' : 'transparent')
           .attr('stroke-width', d => mutatedLines && mutatedLines.has(d.data.meta && d.data.meta.line) ? 1.5 : 1);
    }

    if (s.kind === 'node') {
        const tgt = svg.selectAll('.ast-node').filter(d => {
             const dkey = d.data.meta && d.data.meta.type ? d.data.meta.type + (d.data.meta.line || '0') + d.data.name : d.data.name;
             return dkey === key;
        });
        
        tgt.transition().duration(tDur).style('opacity', 1);
        tgt.select('rect').transition().duration(tDur)
          .attr('stroke-width', 2.5).attr('stroke', '#ffcc00');
    } else {
        svg.selectAll('.edge').filter(l => {
             const trg = l.target.data;
             const dkey = trg.meta && trg.meta.type ? trg.meta.type + (trg.meta.line || '0') + trg.name : trg.name;
             return dkey === key;
        })
        .transition().duration(tDur)
        .style('opacity', l => mutatedLines && mutatedLines.has(l.target.data.meta && l.target.data.meta.line) ? 0.7 : 1);
    }
  }\;

const s2 = \  function enterReplay() {
    if (!data) return;
    const root = hierarchy(data);
    const steps = buildReplaySteps(root);
    stepsRef.current = steps;
    visibleNodesRef.current = new Set();
    visibleEdgesRef.current = new Set();
    setTotalSteps(steps.length);
    setCurrentStep(0);
    setReplayMode(true);
    setIsPlaying(false);
  }\;

const r2 = \  function enterReplay() {
    if (!data) return;
    const root = hierarchy(data);
    const steps = buildReplaySteps(root);
    stepsRef.current = steps;
    visibleNodesRef.current = new Set();
    visibleEdgesRef.current = new Set();
    setTotalSteps(steps.length);
    setCurrentStep(0);
    setReplayMode(true);
    setIsPlaying(false);
    renderTreeCore(true, new Set(), new Set(), 0);
  }\;

if (code.includes(s1)) {
    code = code.replace(s1, r1);
} else {
    console.log('s1 not found');
}

if (code.includes(s2)) {
    code = code.replace(s2, r2);
} else {
    console.log('s2 not found');
}

fs.writeFileSync(p, code);
console.log('done');
