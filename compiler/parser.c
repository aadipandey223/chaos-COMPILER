#include "parser.h"
#include "lexer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static Token current;
static Token previous;

static void advance_token() {
    if (previous.value) {
        // free(previous.value); // In a real compiler we'd manage memory better
    }
    previous = current;
    current = next_token();
}

static int consume(TokenType type) {
    if (current.type == type) {
        advance_token();
        return 1;
    }
    return 0;
}

static void expect(TokenType type, const char* msg) {
    if (current.type == type) {
        advance_token();
    } else {
        fprintf(stderr, "Error at line %d, col %d: %s. Found token '%s'\n", current.line, current.col, msg, current.value);
        exit(1);
    }
}

Node* parse_primary() {
    if (consume(TOK_NUMBER)) {
        return node_make(NODE_NUMBER, previous.value, previous.line, previous.col);
    }
    if (consume(TOK_STRING)) {
        return node_make(NODE_STRING, previous.value, previous.line, previous.col);
    }
    if (consume(TOK_IDENT)) {
        Token ident = previous;
        if (consume(TOK_LPAREN)) {
            Node* call = node_make(NODE_CALL, ident.value, ident.line, ident.col);
            if (current.type != TOK_RPAREN) {
                do {
                    node_add_child(call, parse_expr());
                } while (consume(TOK_COMMA));
            }
            expect(TOK_RPAREN, "Expected ')' after arguments");
            return call;
        }
        return node_make(NODE_IDENT, ident.value, ident.line, ident.col);
    }
    if (consume(TOK_LPAREN)) {
        Node* expr = parse_expr();
        expect(TOK_RPAREN, "Expected ')' after expression");
        return expr;
    }
    fprintf(stderr, "Unexpected token '%s' at line %d\n", current.value, current.line);
    exit(1);
}

Node* parse_unary() {
    if (consume(TOK_MINUS) || consume(TOK_BANG)) {
        Token op = previous;
        Node* expr = parse_unary();
        Node* node = node_make(NODE_UNARY_OP, op.value, op.line, op.col);
        node->left = expr;
        return node;
    }
    return parse_primary();
}

Node* parse_multiplication() {
    Node* expr = parse_unary();
    while (consume(TOK_STAR) || consume(TOK_SLASH)) {
        Token op = previous;
        Node* right = parse_unary();
        Node* node = node_make(NODE_BINARY_OP, op.value, op.line, op.col);
        node->left = expr;
        node->right = right;
        expr = node;
    }
    return expr;
}

Node* parse_addition() {
    Node* expr = parse_multiplication();
    while (consume(TOK_PLUS) || consume(TOK_MINUS)) {
        Token op = previous;
        Node* right = parse_multiplication();
        Node* node = node_make(NODE_BINARY_OP, op.value, op.line, op.col);
        node->left = expr;
        node->right = right;
        expr = node;
    }
    return expr;
}

Node* parse_comparison() {
    Node* expr = parse_addition();
    while (consume(TOK_LT) || consume(TOK_GT) || consume(TOK_LEQ) || consume(TOK_GEQ)) {
        Token op = previous;
        Node* right = parse_addition();
        Node* node = node_make(NODE_BINARY_OP, op.value, op.line, op.col);
        node->left = expr;
        node->right = right;
        expr = node;
    }
    return expr;
}

Node* parse_equality() {
    Node* expr = parse_comparison();
    while (consume(TOK_EQ) || consume(TOK_NEQ)) {
        Token op = previous;
        Node* right = parse_comparison();
        Node* node = node_make(NODE_BINARY_OP, op.value, op.line, op.col);
        node->left = expr;
        node->right = right;
        expr = node;
    }
    return expr;
}

Node* parse_logical() {
    Node* left = parse_equality();
    while (current.type == TOK_AMPAMP || current.type == TOK_PIPEPIPE) {
        Token op = current;
        advance_token();
        Node* right = parse_equality();
        Node* node  = node_make(NODE_BINARY_OP, op.value, op.line, op.col);
        node->left  = left;
        node->right = right;
        left = node;
    }
    return left;
}

Node* parse_assignment() {
    Node* expr = parse_logical();
    if (consume(TOK_ASSIGN)) {
        Token op = previous;
        Node* right = parse_assignment();
        Node* node = node_make(NODE_ASSIGN, op.value, op.line, op.col);
        node->left = expr;
        node->right = right;
        return node;
    }
    return expr;
}

Node* parse_expr() {
    return parse_assignment();
}

Node* parse_block() {
    Node* block = node_make(NODE_BLOCK, NULL, previous.line, previous.col);
    while (current.type != TOK_RBRACE && current.type != TOK_EOF) {
        node_add_child(block, parse_statement());
    }
    expect(TOK_RBRACE, "Expected '}' after block");
    return block;
}

Node* parse_statement() {
    if (consume(TOK_INT)) {
        expect(TOK_IDENT, "Expected identifier after 'int'");
        Token ident = previous;
        Node* decl = node_make(NODE_VAR_DECL, ident.value, ident.line, ident.col);
        if (consume(TOK_ASSIGN)) {
            decl->right = parse_expr(); // init expression
        }
        expect(TOK_SEMICOLON, "Expected ';' after declaration");
        return decl;
    }
    if (consume(TOK_RETURN)) {
        Node* stmt = node_make(NODE_RETURN, NULL, previous.line, previous.col);
        if (current.type != TOK_SEMICOLON) {
            stmt->left = parse_expr();
        }
        expect(TOK_SEMICOLON, "Expected ';' after return");
        return stmt;
    }
    if (consume(TOK_IF)) {
        Node* stmt = node_make(NODE_IF, NULL, previous.line, previous.col);
        expect(TOK_LPAREN, "Expected '(' after 'if'");
        stmt->cond = parse_expr();
        expect(TOK_RPAREN, "Expected ')' after condition");
        if (consume(TOK_LBRACE)) {
            stmt->left = parse_block(); // if branch
        } else {
            stmt->left = parse_statement();
        }
        if (consume(TOK_ELSE)) {
            if (consume(TOK_LBRACE)) {
                stmt->right = parse_block(); // else branch
            } else {
                stmt->right = parse_statement();
            }
        }
        return stmt;
    }
    if (consume(TOK_WHILE)) {
        Node* stmt = node_make(NODE_WHILE, NULL, previous.line, previous.col);
        expect(TOK_LPAREN, "Expected '(' after 'while'");
        stmt->cond = parse_expr();
        expect(TOK_RPAREN, "Expected ')' after condition");
        if (consume(TOK_LBRACE)) {
            stmt->left = parse_block();
        } else {
            stmt->left = parse_statement();
        }
        return stmt;
    }
    
    Node* expr = parse_expr();
    Node* stmt = node_make(NODE_EXPR_STMT, NULL, expr->line, expr->col);
    stmt->left = expr;
    expect(TOK_SEMICOLON, "Expected ';' after expression");
    return stmt;
}

void parser_init() {
    // initialize current token memory
    current.value = NULL;
    previous.value = NULL;
    advance_token();
}

Node* parse_program() {
    Node* prog = node_make(NODE_PROGRAM, NULL, 1, 1);
    while (current.type != TOK_EOF) {
        if (consume(TOK_INT)) {
            expect(TOK_IDENT, "Expected identifier after 'int'");
            Token ident = previous;
            if (consume(TOK_LPAREN)) { // function decl
                Node* func = node_make(NODE_FUNC_DECL, ident.value, ident.line, ident.col);
                if (current.type != TOK_RPAREN) {
                    do {
                        expect(TOK_INT, "Expected 'int' in parameter list");
                        expect(TOK_IDENT, "Expected identifier in parameter list");
                        node_add_child(func, node_make(NODE_VAR_DECL, previous.value, previous.line, previous.col));
                    } while (consume(TOK_COMMA));
                }
                expect(TOK_RPAREN, "Expected ')' after params");
                expect(TOK_LBRACE, "Expected '{' before function body");
                func->left = parse_block();
                node_add_child(prog, func);
            } else {
                // global var decl
                Node* decl = node_make(NODE_VAR_DECL, ident.value, ident.line, ident.col);
                if (consume(TOK_ASSIGN)) {
                    decl->right = parse_expr();
                }
                expect(TOK_SEMICOLON, "Expected ';' after declaration");
                node_add_child(prog, decl);
            }
        } else {
            fprintf(stderr, "Unexpected top-level token '%s' at line %d\n", current.value, current.line);
            exit(1);
        }
    }
    return prog;
}
