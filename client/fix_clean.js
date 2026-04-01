const fs = require('fs');
let code = fs.readFileSync('src/components/compiler/AstTree.jsx', 'utf8');

const anchor1 =         select(this).select('rect').transition().duration(tDur)\n          .attr('stroke', key === lastKey ? '#e05c3a' : nodeColor(d.data.meta?.type).stroke)\n          .attr('stroke-width', key === lastKey ? 2.5 : 1);\n      }\n    });\n  });;

const anchor2 =   function advanceStep(step) {\n    if (step >= stepsRef.current.length) {\n      setIsPlaying(false);;

const startIdx = code.indexOf(anchor1);
const endIdx = code.indexOf(anchor2);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement =         select(this).select('rect').transition().duration(tDur)\n          .attr('stroke', key === lastKey ? '#e05c3a' : nodeColor(d.data.meta?.type).stroke)\n          .attr('stroke-width', key === lastKey ? 2.5 : 1);\n      }\n    });\n  }\n\n  function advanceStep(step) {\n    if (step >= stepsRef.current.length) {\n      setIsPlaying(false);;
  
  const newCode = code.substring(0, startIdx) + replacement + code.substring(endIdx + anchor2.length);
  fs.writeFileSync('src/components/compiler/AstTree.jsx', newCode);
  console.log('Fixed');
} else {
  console.log('Failed to find anchors');
}
