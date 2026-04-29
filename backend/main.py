"""
Chaos Compiler — FastAPI Backend  (Phase 0 → real phases added below)
POST /compile   → tokens, dfa, parse_steps, parse_tree, semantic, intermediate_code
POST /grammar/check → rules, issues
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

# ── Compiler services ──────────────────────────────────────
from services.lexer.tokenizer   import tokenize
from services.dfa.builder       import build_dfa
from services.parser.lr0        import parse
from services.parser.parse_tree import build_tree
from services.semantic.analyzer import analyze
from services.codegen.three_addr import generate_code
from services.grammar.loader    import check_grammar

# ── App setup ──────────────────────────────────────────────
app = FastAPI(title="Chaos Compiler API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────
class CompileRequest(BaseModel):
    source: str

class GrammarRequest(BaseModel):
    grammar: str


# ── Routes ─────────────────────────────────────────────────
@app.post("/compile")
def compile_source(req: CompileRequest) -> dict[str, Any]:
    source = req.source

    tokens      = tokenize(source)
    dfa         = build_dfa(tokens)
    parse_steps = parse(tokens)
    parse_tree  = build_tree(parse_steps, tokens)
    semantic    = analyze(parse_tree, tokens)
    ir          = generate_code(parse_tree)

    return {
        "tokens":           tokens,
        "dfa":              dfa,
        "parse_steps":      parse_steps,
        "parse_tree":       parse_tree,
        "semantic":         semantic,
        "intermediate_code": ir,
    }


@app.post("/grammar/check")
def grammar_check(req: GrammarRequest) -> dict[str, Any]:
    return check_grammar(req.grammar)


@app.get("/health")
def health():
    return {"status": "ok"}
