#ifndef IR_H
#define IR_H

typedef enum {
    IR_MOV,     // x = 10
    IR_ADD,     // x = y + z
    IR_SUB,     // x = y - z
    IR_MUL,     // x = y * z
    IR_DIV,     // x = y / z
    IR_PRINT,   // print x
    IR_NOOP     // No operation (chaos)
} IROp;

typedef struct {
    IROp op;
    char* dest;  // Variable name
    char* src1;  // Variable or Constant
    char* src2;  // Variable or Constant (optional)
} IRInstruction;

typedef struct {
    IRInstruction* instructions;
    int count;
    int capacity;
} IRProgram;

void init_ir(IRProgram* prog);
void add_instruction(IRProgram* prog, IROp op, const char* dest, const char* src1, const char* src2);
void print_ir(IRProgram* prog);
void free_ir(IRProgram* prog);

#endif
