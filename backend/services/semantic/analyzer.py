"""Phase 6 — Semantic Analyzer: symbol table + type checker."""


def analyze(parse_tree: dict | None, tokens: list[dict]) -> dict:
    """
    Walk the token list to build a symbol table and detect errors.
    Returns {symbol_table: {name: {type, scope, line}}, errors: [{type, message, line}]}
    """
    symbol_table: dict[str, dict] = {}
    errors: list[dict] = []
    declared_types = {"int", "float", "char", "double", "void"}
    scope = "global"

    i = 0
    while i < len(tokens):
        tok = tokens[i]

        # Track scope (very simplified: inside {} is local)
        if tok["value"] == "{":
            scope = "local"
        elif tok["value"] == "}":
            scope = "global"

        # Detect declarations: <type> <identifier>
        if tok["type"] == "KEYWORD" and tok["value"] in declared_types:
            if i + 1 < len(tokens) and tokens[i + 1]["type"] == "IDENTIFIER":
                name = tokens[i + 1]["value"]
                if name in symbol_table:
                    errors.append({
                        "type": "redeclaration",
                        "message": f"Variable '{name}' already declared.",
                        "line": tokens[i + 1]["line"],
                    })
                else:
                    symbol_table[name] = {
                        "type": tok["value"],
                        "scope": scope,
                        "line": tokens[i + 1]["line"],
                    }
                i += 2
                continue

        # Detect use of undeclared identifiers
        if tok["type"] == "IDENTIFIER":
            name = tok["value"]
            # Skip if it's a function-name candidate (next token is `(`)
            is_func = (i + 1 < len(tokens) and tokens[i + 1]["value"] == "(")
            if not is_func and name not in symbol_table:
                # Only flag if not already flagged for this name
                if not any(e["message"].startswith(f"Variable '{name}'") for e in errors):
                    errors.append({
                        "type": "undeclared",
                        "message": f"Variable '{name}' used before declaration.",
                        "line": tok["line"],
                    })

        i += 1

    return {"symbol_table": symbol_table, "errors": errors}
