"""Phase 2 — DFA Builder (returns a graph suitable for React SVG rendering)"""


def build_dfa(tokens: list[dict]) -> dict:
    """
    Build a simple DFA from token types present in the token stream.
    Each unique token type becomes a state reachable from START via its type label.
    """
    seen_types = list(dict.fromkeys(t["type"] for t in tokens))

    states = [{"id": "START", "isStart": True, "isAccept": False}]
    transitions: list[dict] = []

    for i, tok_type in enumerate(seen_types):
        state_id = f"S{i}"
        is_final = tok_type not in ("ERROR",)
        states.append({"id": state_id, "isStart": False, "isAccept": is_final})
        transitions.append({"from": "START", "to": state_id, "label": tok_type[:4]})

    # Add self-loop on final states showing repetition
    for s in states[1:]:
        if s["isAccept"]:
            transitions.append({"from": s["id"], "to": s["id"], "label": "*"})

    return {
        "states": states,
        "alphabet": seen_types,
        "transitions": transitions,
        "start": "START",
        "accept": [s["id"] for s in states if s["isAccept"]],
    }
