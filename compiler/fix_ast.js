const fs = require('fs');
let code = fs.readFileSync('../client/src/components/compiler/AstTree.jsx', 'utf8');

code = code.replace(/g\.attr\('transform', g\? \[\] : ranslate\( \+ \(startX \- x0 \+ NODE_W\/2\) \+ , 40\)\);/g, "g.attr('transform', 	ranslate(\, 40));");
code = code.replace(/g\.attr\('transform',       ranslate\( \+ \(startX \- x0 \+ NODE_W\/2\) \+ , 40\)\);/g, "g.attr('transform', 	ranslate(\, 40));");

code = code.replace(/\.attr\('transform', d =>  ranslate\( \+ d\.x \+ , \+ d\.y \+ \)\)/g, ".attr('transform', d => 	ranslate(\,\))");

code = code.replace(/\.text\(d => d\.data\.meta\?\.line \? L\+d\.data\.meta\.line : ''\);/g, ".text(d => d.data.meta?.line ? L\ : '');");

fs.writeFileSync('../client/src/components/compiler/AstTree.jsx', code);
