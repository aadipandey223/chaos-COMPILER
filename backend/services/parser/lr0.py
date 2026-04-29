"""Phase 3 — LR(0) Parser
Grammar:  E -> E + T | T
          T -> T * F | F
          F -> ( E ) | id

Returns a list of {stack, input, action} dicts.
"""


# ------------------------------------------------------------------
# Grammar definition (Expanded C/C++ Subset)
# ------------------------------------------------------------------
PRODUCTIONS = [
    ("Program", ["StatementList"]),
    ("StatementList", ["Statement", "StatementList"]),
    ("StatementList", ["Statement"]),
    ("Statement", ["Type", "id", "=", "Expr", ";"]),
    ("Statement", ["id", "=", "Expr", ";"]),
    ("Type", ["int"]),
    ("Type", ["float"]),
    ("Expr", ["Expr", "+", "Term"]),
    ("Expr", ["Expr", "-", "Term"]),
    ("Expr", ["Term"]),
    ("Term", ["Term", "*", "Factor"]),
    ("Term", ["Term", "/", "Factor"]),
    ("Term", ["Factor"]),
    ("Factor", ["(", "Expr", ")"]),
    ("Factor", ["id"]),
    ("Factor", ["num"]),
]

from .lr0_generator import build_lr0_tables
ACTION, GOTO = build_lr0_tables(PRODUCTIONS)


def _token_to_sym(tok: dict) -> str:
    """Map a token dict to an LR(0) terminal symbol."""
    t_type = tok["type"]
    v = tok["value"]
    if t_type == "NUMBER":
        return "num"
    if t_type == "IDENTIFIER":
        return "id"
    # For KEYWORD, OPERATOR, PUNCTUATION return the exact string value
    return v


def parse(tokens: list[dict]) -> list[dict]:
    """Run LR(0) on the token list; return step list."""
    stream = [_token_to_sym(t) for t in tokens if t["type"] not in ("ERROR",)]
    stream.append("$")

    stack   = [0]
    sym_stack: list[str] = []
    pos     = 0
    steps   = []
    MAX_STEPS = 500

    while len(steps) < MAX_STEPS:
        state  = stack[-1]
        lookahead = stream[pos] if pos < len(stream) else "$"

        stack_str = " ".join(str(x) for x in stack)
        input_str = " ".join(stream[pos:])

        action = ACTION.get(state, {}).get(lookahead, "")

        if action == "acc":
            steps.append({"stack": stack_str, "input": input_str, "action": "accept"})
            break
        elif action.startswith("s"):
            next_state = int(action[1:])
            steps.append({"stack": stack_str, "input": input_str, "action": f"shift {next_state}"})
            stack.append(next_state)
            sym_stack.append(lookahead)
            pos += 1
        elif action.startswith("r"):
            prod_idx = int(action[1:])
            lhs, rhs = PRODUCTIONS[prod_idx]
            steps.append({
                "stack":  stack_str,
                "input":  input_str,
                "action": f"reduce {lhs} → {' '.join(rhs)}"
            })
            for _ in rhs:
                if stack:
                    stack.pop()
                if sym_stack:
                    sym_stack.pop()
            top = stack[-1]
            next_state = GOTO.get(top, {}).get(lhs)
            if next_state is None:
                steps.append({"stack": stack_str, "input": input_str, "action": "error (goto missing)"})
                break
            stack.append(next_state)
            sym_stack.append(lhs)
        else:
            steps.append({"stack": stack_str, "input": input_str, "action": "error"})
            break

    return steps

