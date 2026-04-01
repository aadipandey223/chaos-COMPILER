#include "parser.h"
#include "lexer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static Token current;
static Token previous;

// Known built-in functions stub list (printf, scanf, malloc, free, puts, strlen, strcmp, memcpy, fprintf, sprintf, fopen, fclose, fgets)
// These are caught natively by the generic TOK_IDENT function call fallthrough.

static void advance_token() {
    if (previous.value) {
        // free(previous.value); // In a real compiler we'd manage memory better
    }
    previous = current;
    do {
        current = next_token();
    } while (current.type == TOK_PREPROCESSOR);
}

static int consume(TokenType type) {
    if (current.type == type) {
        advance_token();
        return 1;
    }
    return 0;
}

static int consume_type() {
    if (consume(TOK_INT) || consume(TOK_CHAR) || consume(TOK_FLOAT) || 
        consume(TOK_DOUBLE) || consume(TOK_VOID) || consume(TOK_LONG) || 
        consume(TOK_SHORT) || consume(TOK_UNSIGNED) || consume(TOK_SIGNED) || 
        consume(TOK_SIZE_T) || consume(TOK_BOOL)) {
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

static int is_type_token(TokenType t) {
    return (t == TOK_INT || t == TOK_CHAR || t == TOK_FLOAT || 
            t == TOK_DOUBLE || t == TOK_VOID || t == TOK_LONG || 
            t == TOK_SHORT || t == TOK_UNSIGNED || t == TOK_SIGNED || 
            t == TOK_SIZE_T || t == TOK_BOOL || t == TOK_STRUCT);
}

static Node* handle_postfix(Node* node) {
    while (1) {
        if (consume(TOK_LPAREN)) {
            Node* call = node_make(NODE_CALL, node->value, node->line, node->col);
            call->left = node; // store the callee
            if (current.type != TOK_RPAREN) {
                do {
                    node_add_child(call, parse_expr());
                } while (consume(TOK_COMMA));
            }
            expect(TOK_RPAREN, "Expected ')' after arguments");
            node = call;
        } else if (consume(TOK_LBRACKET)) {
            Node* access = node_make(NODE_ARRAY_ACCESS, NULL, node->line, node->col);
            access->left = node;
            access->right = parse_expr();
            expect(TOK_RBRACKET, "Expected ']' after array index");
            node = access;
        } else if (consume(TOK_DOT) || consume(TOK_ARROW)) {
            Token op = previous;
            expect(TOK_IDENT, "Expected field name after member access");
            Node* access = node_make(NODE_MEMBER_ACCESS, op.value, node->line, node->col);
            access->left = node; // the struct or pointer
            access->right = node_make(NODE_IDENT, previous.value, previous.line, previous.col);
            node = access;
        } else if (consume(TOK_PLUSPLUS)) {
            Node* inc = node_make(NODE_UNARY_OP, "++", node->line, node->col);
            inc->left = node;
            node = inc;
        } else if (consume(TOK_MINUSMINUS)) {
            Node* dec = node_make(NODE_UNARY_OP, "--", node->line, node->col);
            dec->left = node;
            node = dec;
        } else {
            break;
        }
    }
    return node;
}

Node* parse_primary() {
    Node* node = NULL;
    if (consume(TOK_NUMBER) || consume(TOK_FLOAT_LIT) || consume(TOK_CHAR_LIT)) {
        node = node_make(NODE_NUMBER, previous.value, previous.line, previous.col);
    } else if (consume(TOK_NULL) || consume(TOK_FALSE)) {
        node = node_make(NODE_NUMBER, "0", previous.line, previous.col);
    } else if (consume(TOK_TRUE)) {
        node = node_make(NODE_NUMBER, "1", previous.line, previous.col);
    } else if (consume(TOK_STRING_LITERAL)) {
        node = node_make(NODE_STRING_LITERAL, previous.value, previous.line, previous.col);
    } else if (consume(TOK_IDENT)) {
        node = node_make(NODE_IDENT, previous.value, previous.line, previous.col);
    } else if (consume(TOK_LPAREN)) {
        node = parse_expr();
        expect(TOK_RPAREN, "Expected ')' after expression");
    } else {
        fprintf(stderr, "Unexpected token '%s' at line %d\n", current.value, current.line);
        exit(1);
    }
    return handle_postfix(node);
}

Node* parse_unary() {
    if (consume(TOK_LPAREN)) {
        if (is_type_token(current.type)) {
            // It's a cast
            if (consume(TOK_STRUCT)) { consume(TOK_IDENT); }
            else { consume_type(); }
            while (consume(TOK_STAR)); // consume pointer asterisks
            expect(TOK_RPAREN, "Expected ')' after cast type");
            Node* expr = parse_unary();
            Node* node = node_make(NODE_CAST_EXPR, "cast", previous.line, previous.col);
            node->left = expr;
            return node;
        } else {
            // Expression in parens
            Node* expr = parse_expr();
            expect(TOK_RPAREN, "Expected ')' after expression");
            return handle_postfix(expr);
        }
    }

    if (consume(TOK_STAR)) {
        Token op = previous;
        Node* expr = parse_unary();
        Node* node = node_make(NODE_DEREF, op.value, op.line, op.col);
        node->left = expr;
        return node;
    }
    if (consume(TOK_AMP)) {
        Token op = previous;
        Node* expr = parse_unary();
        Node* node = node_make(NODE_ADDRESS_OF, op.value, op.line, op.col);
        node->left = expr;
        return node;
    }
    if (consume(TOK_MINUS) || consume(TOK_BANG) || consume(TOK_PLUSPLUS) || consume(TOK_MINUSMINUS)) {
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
    if (consume(TOK_STRUCT)) {
        if (consume(TOK_IDENT)) {
            Token ident = previous;
            if (consume(TOK_LBRACE)) {
                // not fully expecting inline struct defs inside functions for this toy, but let's allow skipping or basic
                Node* decl = node_make(NODE_STRUCT_DECL, ident.value, ident.line, ident.col);
                while (current.type != TOK_RBRACE && current.type != TOK_EOF) {
                    consume_type();
                    consume(TOK_STAR);
                    consume(TOK_IDENT);
                    expect(TOK_SEMICOLON, "Expected ';' after field");
                }
                expect(TOK_RBRACE, "Expected '}' after struct body");
                expect(TOK_SEMICOLON, "Expected ';' after struct declaration");
                return decl;
            }
            // Struct var decl: struct Name varName;
            int is_ptr = consume(TOK_STAR);
            expect(TOK_IDENT, "Expected identifier after struct type");
            Token var_ident = previous;
            Node* decl;
            if (is_ptr) decl = node_make(NODE_POINTER_DECL, var_ident.value, var_ident.line, var_ident.col);
            else decl = node_make(NODE_VAR_DECL, var_ident.value, var_ident.line, var_ident.col);
            if (consume(TOK_ASSIGN)) decl->right = parse_expr();
            expect(TOK_SEMICOLON, "Expected ';' after struct var declaration");
            return decl;
        }
    }

    if (consume_type()) {
        int is_ptr = consume(TOK_STAR);
        expect(TOK_IDENT, "Expected identifier after type");
        Token ident = previous;
        Node* decl;
        
        if (is_ptr) {
            decl = node_make(NODE_POINTER_DECL, ident.value, ident.line, ident.col);
        } else {
            decl = node_make(NODE_VAR_DECL, ident.value, ident.line, ident.col);
            if (consume(TOK_LBRACKET)) {
                Node* arr_decl = node_make(NODE_ARRAY_DECL, ident.value, ident.line, ident.col);
                arr_decl->left = parse_expr(); // size
                expect(TOK_RBRACKET, "Expected ']' after array size");
                decl = arr_decl;
            }
        }
        
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
    if (consume(TOK_FOR)) {
        Node* stmt = node_make(NODE_FOR, NULL, previous.line, previous.col);
        expect(TOK_LPAREN, "Expected '(' after 'for'");

        // 1. Init
        if (consume(TOK_SEMICOLON)) {
            stmt->left = NULL;
        } else {
            stmt->left = parse_statement(); // parse_statement consumes the semicolon
        }

        // 2. Condition
        if (consume(TOK_SEMICOLON)) {
            stmt->cond = NULL;
        } else {
            stmt->cond = parse_expr();
            expect(TOK_SEMICOLON, "Expected ';' after loop condition");
        }

        // 3. Step/Update
        if (consume(TOK_RPAREN)) {
            stmt->right = NULL;
        } else {
            stmt->right = parse_expr();
            expect(TOK_RPAREN, "Expected ')' after for clauses");
        }

        // 4. Body
        if (consume(TOK_LBRACE)) {
            node_add_child(stmt, parse_block());
        } else {
            node_add_child(stmt, parse_statement());
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
        if (consume(TOK_STRUCT)) {
            expect(TOK_IDENT, "Expected struct name");
            Token struct_name = previous;
            if (consume(TOK_LBRACE)) {
                Node* decl = node_make(NODE_STRUCT_DECL, struct_name.value, struct_name.line, struct_name.col);
                while (current.type != TOK_RBRACE && current.type != TOK_EOF) {
                    consume_type(); // simplify skipping type
                    int is_ptr = consume(TOK_STAR);
                    expect(TOK_IDENT, "Expected field name");
                    Node* field;
                    if (is_ptr) 
                        field = node_make(NODE_POINTER_DECL, previous.value, previous.line, previous.col);
                    else 
                        field = node_make(NODE_VAR_DECL, previous.value, previous.line, previous.col);
                    node_add_child(decl, field);
                    expect(TOK_SEMICOLON, "Expected ';' after field");
                }
                expect(TOK_RBRACE, "Expected '}' after struct body");
                expect(TOK_SEMICOLON, "Expected ';' after struct declaration");
                node_add_child(prog, decl);
                continue;
            } else {
                // struct something varName; handled below
                int is_fn_ptr = consume(TOK_STAR);
                expect(TOK_IDENT, "Expected identifier after type");
                Token ident = previous;
                Node* decl;
                if (is_fn_ptr) {
                    decl = node_make(NODE_POINTER_DECL, ident.value, ident.line, ident.col);
                } else {
                    decl = node_make(NODE_VAR_DECL, ident.value, ident.line, ident.col);
                }
                if (consume(TOK_ASSIGN)) decl->right = parse_expr();
                expect(TOK_SEMICOLON, "Expected ';' after struct var");
                node_add_child(prog, decl);
                continue;
            }
        }

        if (consume_type()) {
            int is_fn_ptr = consume(TOK_STAR);
            expect(TOK_IDENT, "Expected identifier after type");
            Token ident = previous;
            if (consume(TOK_LPAREN)) { // function decl
                Node* func = node_make(NODE_FUNC_DECL, ident.value, ident.line, ident.col);
                if (current.type != TOK_RPAREN) {
                    do {
                        if (consume(TOK_STRUCT)) { consume(TOK_IDENT); }
                        else { consume_type(); }
                        int is_param_ptr = consume(TOK_STAR);
                        expect(TOK_IDENT, "Expected identifier in parameter list");
                        Node* param;
                        if (is_param_ptr) {
                            param = node_make(NODE_POINTER_DECL, previous.value, previous.line, previous.col);
                        } else {
                            param = node_make(NODE_VAR_DECL, previous.value, previous.line, previous.col);
                        }
                        node_add_child(func, param);
                    } while (consume(TOK_COMMA));
                }
                expect(TOK_RPAREN, "Expected ')' after params");
                expect(TOK_LBRACE, "Expected '{' before function body");
                func->left = parse_block();
                node_add_child(prog, func);
            } else {
                // global var decl
                Node* decl;
                if (is_fn_ptr) {
                    decl = node_make(NODE_POINTER_DECL, ident.value, ident.line, ident.col);
                } else {
                    decl = node_make(NODE_VAR_DECL, ident.value, ident.line, ident.col);
                    if (consume(TOK_LBRACKET)) {
                        Node* arr_decl = node_make(NODE_ARRAY_DECL, ident.value, ident.line, ident.col);
                        arr_decl->left = parse_expr(); // size
                        expect(TOK_RBRACKET, "Expected ']' after array size");
                        decl = arr_decl;
                    }
                }
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
