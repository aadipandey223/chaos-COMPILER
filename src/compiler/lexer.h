#ifndef LEXER_H
#define LEXER_H

typedef enum {
    TOKEN_EOF,
    TOKEN_INT,          // "int"
    TOKEN_RETURN,       // "return"
    TOKEN_MAIN,         // "main"
    TOKEN_IDENTIFIER,   // Variable names
    TOKEN_NUMBER,       // Integers
    TOKEN_ASSIGN,       // "="
    TOKEN_PLUS,         // "+"
    TOKEN_MINUS,        // "-"
    TOKEN_STAR,         // "*"
    TOKEN_SLASH,        // "/"
    TOKEN_LPAREN,       // "("
    TOKEN_RPAREN,       // ")"
    TOKEN_LBRACE,       // "{"
    TOKEN_RBRACE,       // "}"
    TOKEN_SEMICOLON     // ";"
} TokenType;

typedef struct {
    TokenType type;
    char* text;
    int line;
} Token;

void init_lexer(const char* source);
Token next_token();
const char* token_type_to_string(TokenType type);

#endif
