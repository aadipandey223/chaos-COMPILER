"""LR(0) Table Generator
Dynamically builds ACTION and GOTO tables from a given set of grammar productions.
"""
from typing import Dict, List, Tuple, Set

def build_lr0_tables(productions: List[Tuple[str, List[str]]]) -> Tuple[Dict, Dict]:
    # 1. Augment grammar
    start_symbol = productions[0][0]
    aug_start = start_symbol + "'"
    
    # Map production index to (LHS, RHS)
    prods = [(aug_start, [start_symbol])] + productions
    
    non_terminals = {p[0] for p in prods}
    terminals = set()
    for _, rhs in prods:
        for sym in rhs:
            if sym not in non_terminals and sym != "ε":
                terminals.add(sym)
    terminals.add("$")

    # Item is represented as (prod_idx, dot_pos)
    def closure(items: Set[Tuple[int, int]]) -> Set[Tuple[int, int]]:
        C = set(items)
        changed = True
        while changed:
            changed = False
            additions = set()
            for p_idx, dot in C:
                lhs, rhs = prods[p_idx]
                if dot < len(rhs):
                    next_sym = rhs[dot]
                    if next_sym in non_terminals:
                        for i, (p_lhs, _) in enumerate(prods):
                            if p_lhs == next_sym:
                                if (i, 0) not in C and (i, 0) not in additions:
                                    additions.add((i, 0))
            if additions:
                C.update(additions)
                changed = True
        return C

    def goto(items: Set[Tuple[int, int]], symbol: str) -> Set[Tuple[int, int]]:
        next_items = set()
        for p_idx, dot in items:
            lhs, rhs = prods[p_idx]
            if dot < len(rhs) and rhs[dot] == symbol:
                next_items.add((p_idx, dot + 1))
        return closure(next_items)

    # 2. Build states
    start_item = (0, 0)
    C0 = closure({start_item})
    
    states: List[Set[Tuple[int, int]]] = [C0]
    state_transitions: Dict[int, Dict[str, int]] = {0: {}}
    
    unprocessed = [0]
    while unprocessed:
        state_idx = unprocessed.pop(0)
        state_items = states[state_idx]
        
        # Find all symbols after the dot
        symbols = set()
        for p_idx, dot in state_items:
            _, rhs = prods[p_idx]
            if dot < len(rhs):
                symbols.add(rhs[dot])
                
        for sym in symbols:
            next_state_items = goto(state_items, sym)
            if not next_state_items:
                continue
                
            if next_state_items not in states:
                states.append(next_state_items)
                new_idx = len(states) - 1
                state_transitions[new_idx] = {}
                unprocessed.append(new_idx)
            else:
                new_idx = states.index(next_state_items)
                
            state_transitions[state_idx][sym] = new_idx

    # 3. Build ACTION and GOTO tables
    ACTION = {i: {} for i in range(len(states))}
    GOTO = {i: {} for i in range(len(states))}
    
    for i, state_items in enumerate(states):
        for p_idx, dot in state_items:
            lhs, rhs = prods[p_idx]
            if dot == len(rhs) or (len(rhs) == 1 and rhs[0] == "ε"):
                if p_idx == 0:
                    ACTION[i]["$"] = "acc"
                else:
                    # LR(0) reduction: reduce for ALL terminals
                    # For a subset of C, SLR(1) might be needed to avoid shift-reduce conflicts.
                    # Here we do basic LR(0) reduce
                    for term in terminals:
                        # naive conflict resolution: shift takes precedence over reduce
                        if term not in ACTION[i] or ACTION[i][term].startswith("r"):
                            # Original productions are 0-indexed without augmented start
                            ACTION[i][term] = f"r{p_idx - 1}"
            else:
                sym = rhs[dot]
                if sym in terminals:
                    next_state = state_transitions[i].get(sym)
                    if next_state is not None:
                        ACTION[i][sym] = f"s{next_state}"
        
        for sym in non_terminals:
            next_state = state_transitions[i].get(sym)
            if next_state is not None:
                GOTO[i][sym] = next_state
                
    return ACTION, GOTO
