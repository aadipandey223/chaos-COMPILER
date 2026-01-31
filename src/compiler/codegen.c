#include <stdio.h>
#include "codegen.h"
#include "ir.h"

// Simple register allocator (mock)
const char* get_reg(int i) {
    static const char* regs[] = {"R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"};
    return regs[i % 8];
}

void generate_assembly(IRProgram* prog) {
    printf("; Chaos Lab Assembly Output\n");
    printf("section .text\n");
    printf("global _start\n\n");
    printf("_start:\n");

    for (int i = 0; i < prog->count; i++) {
        IRInstruction* instr = &prog->instructions[i];
        switch (instr->op) {
            case IR_MOV:
                printf("    MOV %s, %s\n", instr->dest, instr->src1);
                break;
            case IR_ADD:
                printf("    MOV %s, %s\n", instr->dest, instr->src1);
                printf("    ADD %s, %s\n", instr->dest, instr->src2);
                break;
            case IR_SUB:
                printf("    MOV %s, %s\n", instr->dest, instr->src1);
                printf("    SUB %s, %s\n", instr->dest, instr->src2);
                break;
            case IR_MUL:
                printf("    MUL %s, %s, %s\n", instr->dest, instr->src1, instr->src2);
                break;
            case IR_DIV:
                printf("    DIV %s, %s, %s\n", instr->dest, instr->src1, instr->src2);
                break;
            case IR_PRINT:
                printf("    PRINT %s\n", instr->src1);
                break;
            case IR_NOOP:
                printf("    NOP\t; Chaos\n");
                break;
        }
    }
    printf("\n    ; Exit\n");
    printf("    MOV R7, #1\n");
    printf("    SWI 0\n");
}
