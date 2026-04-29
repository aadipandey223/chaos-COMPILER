"""Phase 7 — 3-Address Code Generator."""


def _walk(node: dict, instrs: list[dict], counter: list[int]) -> str:
    """Recursively walk the parse tree and emit 3-address instructions."""
    if not node:
        return "?"

    children = node.get("children", [])
    val = node.get("value", "?")

    # Leaf / terminal
    if not children:
        return val

    # Binary op:  E -> E + T  |  T -> T * F
    if len(children) == 3 and children[1]["value"] in ("+", "-", "*", "/"):
        left  = _walk(children[0], instrs, counter)
        right = _walk(children[2], instrs, counter)
        op    = children[1]["value"]
        t = f"t{counter[0]}"
        counter[0] += 1
        instrs.append({
            "step_num":    len(instrs) + 1,
            "instruction": f"{t} = {left} {op} {right}",
            "explanation": f"Compute {left} {op} {right} and store in temp {t}.",
        })
        return t

    # Parenthesised expression:  F -> ( E )
    if len(children) == 3 and children[0]["value"] == "(" and children[2]["value"] == ")":
        return _walk(children[1], instrs, counter)
        
    # Assignment Statement: Statement -> id = Expr ;
    if len(children) == 4 and children[1]["value"] == "=":
        var_name = _walk(children[0], instrs, counter)
        expr_val = _walk(children[2], instrs, counter)
        instrs.append({
            "step_num": len(instrs) + 1,
            "instruction": f"{var_name} = {expr_val}",
            "explanation": f"Assign {expr_val} to {var_name}."
        })
        return ""
        
    # Declaration with Assignment Statement: Statement -> Type id = Expr ;
    if len(children) == 5 and children[2]["value"] == "=":
        var_name = _walk(children[1], instrs, counter)
        expr_val = _walk(children[3], instrs, counter)
        instrs.append({
            "step_num": len(instrs) + 1,
            "instruction": f"{var_name} = {expr_val}",
            "explanation": f"Initialize {var_name} with {expr_val}."
        })
        return ""

    # Pass-through lists and single children
    for child in children:
        if child.get("value") not in (";", "Type"):
            _walk(child, instrs, counter)

    return val


def generate_code(parse_tree: dict | None) -> list[dict]:
    if not parse_tree:
        return []
    instrs: list[dict] = []
    counter = [1]
    
    # Check if root is Program or StatementList to avoid wrapping in result
    root_val = parse_tree.get("value", "")
    if root_val in ("Program", "StatementList", "Statement"):
        _walk(parse_tree, instrs, counter)
    else:
        result = _walk(parse_tree, instrs, counter)
        if instrs and result:
            instrs.append({
                "step_num":    len(instrs) + 1,
                "instruction": f"result = {result}",
                "explanation": "Assign final expression value to result.",
            })
    return instrs
