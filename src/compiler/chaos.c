#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "ir.h"
#include "chaos.h"

void init_chaos() {
    srand(time(NULL));
}

// Check if op is commutative (ADD, MUL)
int is_commutative(IROp op) {
    return (op == IR_ADD || op == IR_MUL);
}

// Swap operands: x = a + b  ->  x = b + a
void chaos_swap_operands(IRProgram* prog) {
    for (int i = 0; i < prog->count; i++) {
        IRInstruction* instr = &prog->instructions[i];
        if (is_commutative(instr->op) && rand() % 2 == 0) {
            char* temp = instr->src1;
            instr->src1 = instr->src2;
            instr->src2 = temp;
            // printf("[Chaos] Swapped operands at instruction %d\n", i);
        }
    }
}

// Insert NOOPs
void chaos_inject_noops(IRProgram* prog) {
    // We iterate backwards or just insert into a new list. 
    // For simplicity, let's assume we have capacity.
    // Real implementation would resize or use a linked list.
    
    // In this C demo, we'll just modify in place if space, or simpler:
    // Just append a NOOP at the end for demonstration if we hit a random chance?
    // Proper way: resize array.
    
    if (prog->count < prog->capacity - 1 && rand() % 3 == 0) {
        add_instruction(prog, IR_NOOP, NULL, NULL, NULL);
    }
}

void apply_chaos(IRProgram* prog) {
    init_chaos();
    chaos_swap_operands(prog);
    chaos_inject_noops(prog);
}
