import json
import sys
from typing import Any

from services.lexer.tokenizer import tokenize
from services.parser.lr0 import parse
from services.parser.parse_tree import build_tree
from services.semantic.analyzer import analyze
from services.codegen.three_addr import generate_code
from services.grammar.loader import check_grammar


def handle_pipeline(source: str) -> dict[str, Any]:
    tokens = tokenize(source)
    parse_steps = parse(tokens)
    parse_tree = build_tree(parse_steps, tokens)
    semantic = analyze(parse_tree, tokens)
    intermediate_code = generate_code(parse_tree)
    return {
        "tokens": tokens,
        "parse_steps": parse_steps,
        "parse_tree": parse_tree,
        "semantic": semantic,
        "intermediate_code": intermediate_code,
    }


def main() -> int:
    payload = json.loads(sys.stdin.read() or "{}")
    action = payload.get("action", "pipeline")

    if action == "pipeline":
        result = handle_pipeline(payload.get("source", ""))
    elif action == "grammar":
        result = check_grammar(payload.get("grammar", ""))
    else:
        result = {"error": f"Unknown action '{action}'."}

    sys.stdout.write(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
