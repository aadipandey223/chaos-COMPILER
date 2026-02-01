#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "parser.h"
#include "lexer.h"
#include "ir.h"

static Token current_token;

static void advance_parser() {
    current_token = next_token();
}

static void expect(TokenType type) {
    if (current_token.type == type) {
        advance_parser();
    } else {
        printf("Syntax Error: Expected %s, got %s\n", token_type_to_string(type), token_type_to_string(current_token.type));
        exit(1);
    }
}

void init_ir(IRProgram* prog) {
    prog->count = 0;
    prog->capacity = 10;
    prog->instructions = malloc(sizeof(IRInstruction) * prog->capacity);
}

void add_instruction(IRProgram* prog, IROp op, const char* dest, const char* src1, const char* src2) {
    if (prog->count >= prog->capacity) {
        prog->capacity *= 2;
        prog->instructions = realloc(prog->instructions, sizeof(IRInstruction) * prog->capacity);
    }
    IRInstruction* instr = &prog->instructions[prog->count++];
    instr->op = op;
    instr->dest = dest ? strdup(dest) : NULL;
    instr->src1 = src1 ? strdup(src1) : NULL;
    instr->src2 = src2 ? strdup(src2) : NULL;
}

void free_ir(IRProgram* prog) {
    for (int i = 0; i < prog->count; i++) {
        if (prog->instructions[i].dest) free(prog->instructions[i].dest);
        if (prog->instructions[i].src1) free(prog->instructions[i].src1);
        if (prog->instructions[i].src2) free(prog->instructions[i].src2);
    }
    free(prog->instructions);
}

void print_ir(IRProgram* prog) {
    for (int i = 0; i < prog->count; i++) {
        IRInstruction* instr = &prog->instructions[i];
        switch (instr->op) {
            case IR_MOV: printf("%s = %s\n", instr->dest, instr->src1); break;
            case IR_ADD: printf("%s = %s + %s\n", instr->dest, instr->src1, instr->src2); break;
            case IR_SUB: printf("%s = %s - %s\n", instr->dest, instr->src1, instr->src2); break;
            case IR_MUL: printf("%s = %s * %s\n", instr->dest, instr->src1, instr->src2); break;
            case IR_DIV: printf("%s = %s / %s\n", instr->dest, instr->src1, instr->src2); break;
            case IR_PRINT: printf("PRINT %s\n", instr->src1); break;
            case IR_NOOP: printf("NOOP\n"); break;
        }
    }
}

// Simple Parser Implementation
// Grammar:
// Program -> StmtList
// StmtList -> Stmt StmtList | epsilon
// Stmt -> int ID = Expr ; | return ID ;
// Expr -> Term | Term + Term | Term - Term
// Term -> ID | NUM

void parse_program(IRProgram* prog) {
    advance_parser(); // Load first token

    while (current_token.type != TOKEN_EOF) {
        if (current_token.type == TOKEN_INT) {
            // int x = 10;
            // int res = a + b;
            advance_parser(); // skip 'int'
            
            if (current_token.type == TOKEN_MAIN) {
                 // int main() { ... }
                 advance_parser();
                 expect(TOKEN_LPAREN);
                 expect(TOKEN_RPAREN);
                 expect(TOKEN_LBRACE);
                 continue; // Continue to parse body
            }

            char* dest = strdup(current_token.text);
            expect(TOKEN_IDENTIFIER);
            expect(TOKEN_ASSIGN);

            Token parsed[3]; // Crude storage for expression terms
            int count = 0;

            while (current_token.type != TOKEN_SEMICOLON) {
                parsed[count++] = current_token;
                advance_parser();
            }
            expect(TOKEN_SEMICOLON);

            if (count == 1) {
                // x = 10
                add_instruction(prog, IR_MOV, dest, parsed[0].text, NULL);
            } else if (count == 3) {
                // x = a + b
                IROp op = IR_ADD;
                if (parsed[1].type == TOKEN_PLUS) op = IR_ADD;
                else if (parsed[1].type == TOKEN_MINUS) op = IR_SUB;
                else if (parsed[1].type == TOKEN_STAR) op = IR_MUL;
                else if (parsed[1].type == TOKEN_SLASH) op = IR_DIV;

                add_instruction(prog, op, dest, parsed[0].text, parsed[2].text);
            }
            free(dest);
        } else if (current_token.type == TOKEN_RETURN) {
            advance_parser();
            char* val = strdup(current_token.text);
            advance_parser(); // Consumes ID or NUM
            expect(TOKEN_SEMICOLON);
            add_instruction(prog, IR_PRINT, NULL, val, NULL); // We treat return as PRINT for demo
            free(val);
        } else if (current_token.type == TOKEN_RBRACE) {
            advance_parser(); // End of main
        } else {
            advance_parser(); // Skip unknown
        }
    }
}
