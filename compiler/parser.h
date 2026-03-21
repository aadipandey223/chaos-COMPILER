#ifndef PARSER_H
#define PARSER_H

#include "ast.h"

void parser_init();
Node* parse_program();

Node* parse_block();
Node* parse_statement();
Node* parse_expr();
Node* parse_assignment();
Node* parse_equality();
Node* parse_comparison();
Node* parse_addition();
Node* parse_multiplication();
Node* parse_unary();
Node* parse_primary();

#endif
