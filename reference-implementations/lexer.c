#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "lexer.h"

static const char* src;
static int pos = 0;
static int line = 1;

void init_lexer(const char* source) {
    src = source;
    pos = 0;
    line = 1;
}

static char peek() {
    return src[pos];
}

static char advance() {
    char c = src[pos];
    if (c == '\n') line++;
    pos++;
    return c;
}

static void skip_whitespace() {
    while (isspace(peek())) {
        advance();
    }
}

static Token make_token(TokenType type, const char* start, int length) {
    Token token;
    token.type = type;
    token.line = line;
    token.text = malloc(length + 1);
    strncpy(token.text, start, length);
    token.text[length] = '\0';
    return token;
}

Token next_token() {
    skip_whitespace();

    if (peek() == '\0') {
        return make_token(TOKEN_EOF, "EOF", 3);
    }

    char c = peek();

    // Identifiers and Keywords
    if (isalpha(c) || c == '_') {
        const char* start = &src[pos];
        int length = 0;
        while (isalnum(peek()) || peek() == '_') {
            advance();
            length++;
        }
        
        // Check keywords
        if (strncmp(start, "int", 3) == 0 && length == 3) return make_token(TOKEN_INT, start, 3);
        if (strncmp(start, "return", 6) == 0 && length == 6) return make_token(TOKEN_RETURN, start, 6);
        if (strncmp(start, "main", 4) == 0 && length == 4) return make_token(TOKEN_MAIN, start, 4);

        return make_token(TOKEN_IDENTIFIER, start, length);
    }

    // Numbers
    if (isdigit(c)) {
        const char* start = &src[pos];
        int length = 0;
        while (isdigit(peek())) {
            advance();
            length++;
        }
        return make_token(TOKEN_NUMBER, start, length);
    }

    // Single-character tokens
    advance();
    switch (c) {
        case '=': return make_token(TOKEN_ASSIGN, "=", 1);
        case '+': return make_token(TOKEN_PLUS, "+", 1);
        case '-': return make_token(TOKEN_MINUS, "-", 1);
        case '*': return make_token(TOKEN_STAR, "*", 1);
        case '/': return make_token(TOKEN_SLASH, "/", 1);
        case '(': return make_token(TOKEN_LPAREN, "(", 1);
        case ')': return make_token(TOKEN_RPAREN, ")", 1);
        case '{': return make_token(TOKEN_LBRACE, "{", 1);
        case '}': return make_token(TOKEN_RBRACE, "}", 1);
        case ';': return make_token(TOKEN_SEMICOLON, ";", 1);
    }

    return make_token(TOKEN_EOF, "UNKNOWN", 7);
}

const char* token_type_to_string(TokenType type) {
    switch (type) {
        case TOKEN_INT: return "INT";
        case TOKEN_RETURN: return "RETURN";
        case TOKEN_MAIN: return "MAIN";
        case TOKEN_IDENTIFIER: return "IDENTIFIER";
        case TOKEN_NUMBER: return "NUMBER";
        case TOKEN_ASSIGN: return "ASSIGN";
        case TOKEN_PLUS: return "PLUS";
        case TOKEN_MINUS: return "MINUS";
        case TOKEN_STAR: return "STAR";
        case TOKEN_SLASH: return "SLASH";
        case TOKEN_LPAREN: return "LPAREN";
        case TOKEN_RPAREN: return "RPAREN";
        case TOKEN_LBRACE: return "LBRACE";
        case TOKEN_RBRACE: return "RBRACE";
        case TOKEN_SEMICOLON: return "SEMICOLON";
        case TOKEN_EOF: return "EOF";
        default: return "UNKNOWN";
    }
}
