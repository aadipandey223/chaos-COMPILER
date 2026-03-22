const express = require('express');
const cors = require('cors');
const compileRouter = require('./routes/compile');
const dfaRouter = require('./routes/dfa');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

app.use('/api/dfa', dfaRouter);
app.use('/api', compileRouter);

app.listen(PORT, () => {
  console.log(`Chaos Compiler Backend is running on http://localhost:${PORT}`);
});
