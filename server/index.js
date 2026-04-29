const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compileRouter = require('./routes/compile');
const dfaRouter = require('./routes/dfa');
const automataRouter = require('./routes/automata');
const learnerRouter = require('./routes/learner');
const grammarRouter = require('./routes/grammar');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

app.use('/api/dfa', dfaRouter);
app.use('/api/automata', automataRouter);
app.use('/api/learner', learnerRouter);
app.use('/api/grammar', grammarRouter);
app.use('/api', compileRouter);

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, { index: false }));

  // SPA fallback: serve index.html for all routes except /api and static files
  app.get(/^(?!\/api|\/assets\/|\/favicon).*$/, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Chaos Compiler Backend is running on http://localhost:${PORT}`);
});
