# Learner API Contracts

This folder defines normalized JSON contracts shared by learner endpoints.

## Automata simulate (`POST /api/automata/simulate`)

Request:

```json
{
  "mode": "NFA",
  "input": "ab",
  "automaton": {
    "states": [{ "id": 0, "isStart": true, "isFinal": false }],
    "transitions": [{ "from": 0, "to": 1, "symbol": "a" }]
  }
}
```

Response:

```json
{
  "ok": true,
  "states": [{ "id": 0, "isStart": true, "isFinal": false }],
  "transitions": [{ "from": 0, "to": 1, "symbol": "a" }],
  "trace": [[0], [1]]
}
```

## Automata convert (`POST /api/automata/convert`)

Response:

```json
{
  "ok": true,
  "dfa": {
    "states": [],
    "transitions": []
  }
}
```

## Learner process (`POST /api/learner/process`)

Response:

```json
{
  "ok": true,
  "tokens": [],
  "parse_steps": [],
  "parse_tree": {},
  "parse_tree_graph": { "nodes": [], "edges": [] },
  "semantic": { "symbol_table": {}, "errors": [] },
  "intermediate_code": []
}
```

## Grammar check (`POST /api/grammar/check`)

Response:

```json
{
  "rules": [],
  "issues": [],
  "isValid": true,
  "errors": []
}
```
