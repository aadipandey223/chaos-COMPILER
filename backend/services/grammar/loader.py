"""Phase 4 — Grammar Loader: parse text grammar & check for issues."""
import re


def check_grammar(grammar_text: str) -> dict:
    """
    Parse grammar written as:
      E -> E + T | T
      T -> T * F | F
    Returns {rules: [...str], issues: [{type, rule, message}]}
    """
    rules: list[str] = []
    issues: list[dict] = []
    non_terminals: set[str] = set()
    rule_map: dict[str, list[list[str]]] = {}

    for raw_line in grammar_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        # Support -> or →
        sep = "->" if "->" in line else ("→" if "→" in line else None)
        if sep is None:
            issues.append({"type": "syntax", "rule": line, "message": "Missing '->' in production."})
            continue

        parts = line.split(sep, 1)
        if len(parts) != 2:
            issues.append({"type": "syntax", "rule": line, "message": "Malformed production."})
            continue

        lhs = parts[0].strip()
        rhs_alts = [alt.strip().split() for alt in parts[1].split("|")]

        if not re.match(r'^[A-Z][A-Za-z0-9\'_]*$', lhs):
            issues.append({"type": "syntax", "rule": line, "message": f"LHS '{lhs}' must be a non-terminal (uppercase)."})
            continue

        non_terminals.add(lhs)
        rule_map[lhs] = rhs_alts
        rules.append(f"{lhs} → {' | '.join(' '.join(alt) for alt in rhs_alts)}")

    # Check left recursion
    for lhs, alts in rule_map.items():
        for alt in alts:
            if alt and alt[0] == lhs:
                issues.append({
                    "type": "left_recursion",
                    "rule": lhs,
                    "message": f"Rule '{lhs}' is directly left-recursive.",
                })
                break

    # Check unreachable symbols (non-terminals defined but not used in any RHS)
    all_used: set[str] = set()
    start = next(iter(rule_map), None)
    for lhs, alts in rule_map.items():
        if lhs == start:
            continue
        for alt in alts:
            all_used.update(sym for sym in alt if sym in non_terminals)

    for nt in non_terminals:
        if nt != start and nt not in all_used:
            issues.append({
                "type": "unreachable",
                "rule": nt,
                "message": f"Non-terminal '{nt}' is defined but never used.",
            })

    return {"rules": rules, "issues": issues}
