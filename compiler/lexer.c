#include "lexer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

static const char* src;
static int pos;
static int current_line;
static int current_col;

void lexer_init(const char* source) {
    src = source;
    pos = 0;
    current_line = 1;
    current_col = 1;
}

static char peek() {
    return src[pos];
}

static char advance() {
    char c = src[pos++];
    if (c == '\n') {
        current_line++;
        current_col = 1;
    } else {
        current_col++;
    }
    return c;
}

static void skip_whitespace_and_comments() {
    while (1) {
        char c = peek();
        if (isspace(c)) {
            advance();
        } else if (c == '/' && src[pos+1] == '/') {
            // Single-line comment
            while (peek() != '\n' && peek() != '\0') advance();
        } else if (c == '/' && src[pos+1] == '*') {
            // Multi-line comment
            advance(); advance();
            while (peek() != '\0') {
                if (peek() == '*' && src[pos+1] == '/') {
                    advance(); advance();
                    break;
                }
                advance();
            }
        } else {
            break;
        }
    }
}

static Token make_token(TokenType type, const char* start, int length) {
    Token t;
    t.type = type;
    t.line = current_line;
    // Calculate column correctly based on the start
    t.col = current_col - length;
    t.value = (char*)malloc(length + 1);
    strncpy(t.value, start, length);
    t.value[length] = '\0';
    return t;
}

Token next_token() {
    skip_whitespace_and_comments();
    if (peek() == '\0') {
        Token t;
        t.type = TOK_EOF;
        t.line = current_line;
        t.col = current_col;
        t.value = strdup("EOF");
        return t;
    }

    const char* start = src + pos;
    char c = advance();

    if (isalpha(c) || c == '_') {
        int length = 1;
        while (isalnum(peek()) || peek() == '_') {
            advance();
            length++;
        }
        char* text = (char*)malloc(length + 1);
        strncpy(text, start, length);
        text[length] = '\0';

        TokenType type = TOK_IDENT;
        if (strcmp(text, "int") == 0) type = TOK_INT;
        else if (strcmp(text, "return") == 0) type = TOK_RETURN;
        else if (strcmp(text, "if") == 0) type = TOK_IF;
        else if (strcmp(text, "else") == 0) type = TOK_ELSE;
        else if (strcmp(text, "while") == 0) type = TOK_WHILE;

        free(text);
        return make_token(type, start, length);
    }

    if (isdigit(c)) {
        int length = 1;
        while (isdigit(peek())) {
            advance();
            length++;
        }
        return make_token(TOK_NUMBER, start, length);
    }

    switch (c) {
        case '+': return make_token(TOK_PLUS, start, 1);
        case '-': return make_token(TOK_MINUS, start, 1);
        case '*': return make_token(TOK_STAR, start, 1);
        case '/': return make_token(TOK_SLASH, start, 1);
        case '=':
            if (peek() == '=') { advance(); return make_token(TOK_EQ, start, 2); }
            return make_token(TOK_ASSIGN, start, 1);
        case '!':
            if (peek() == '=') { advance(); return make_token(TOK_NEQ, start, 2); }
            return make_token(TOK_BANG, start, 1);
        case '<':
            if (peek() == '=') { advance(); return make_token(TOK_LEQ, start, 2); }
            return make_token(TOK_LT, start, 1);
        case '>':
            if (peek() == '=') { advance(); return make_token(TOK_GEQ, start, 2); }
            return make_token(TOK_GT, start, 1);
        case '&':
            if (peek() == '&') { advance(); return make_token(TOK_AMPAMP, start, 2); }
            break;
        case '|':
            if (peek() == '|') { advance(); return make_token(TOK_PIPEPIPE, start, 2); }
            break;
        case '(': return make_token(TOK_LPAREN, start, 1);
        case ')': return make_token(TOK_RPAREN, start, 1);
        case '{': return make_token(TOK_LBRACE, start, 1);
        case '}': return make_token(TOK_RBRACE, start, 1);
        case '[': return make_token(TOK_LBRACKET, start, 1);
        case ']': return make_token(TOK_RBRACKET, start, 1);
        case ';': return make_token(TOK_SEMICOLON, start, 1);
        case ',': return make_token(TOK_COMMA, start, 1);
        case '"': {
            int length = 0;
            const char* content_start = src + pos; // start after the opening quote
            while (peek() != '"' && peek() != '\0') {
                if (peek() == '\\' && src[pos+1] == '"') {
                    advance(); advance();
                    length += 2;
                } else {
                    advance();
                    length++;
                }
            }
            if (peek() == '"') {
                advance(); // skip closing quote
                return make_token(TOK_STRING, content_start, length);
            }
            return make_token(TOK_UNKNOWN, start, length + 1);
        }
    }

    return make_token(TOK_UNKNOWN, start, 1);
}
