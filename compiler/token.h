#ifndef TOKEN_H
#define TOKEN_H

typedef enum {
    /* Literals */
    TOK_NUMBER, TOK_FLOAT_LIT, TOK_STRING_LITERAL, TOK_CHAR_LIT, TOK_IDENT,

    /* Keywords — types */
    TOK_INT, TOK_CHAR, TOK_FLOAT, TOK_DOUBLE, TOK_VOID,
    TOK_LONG, TOK_SHORT, TOK_UNSIGNED, TOK_SIGNED, TOK_SIZE_T, TOK_BOOL,

    /* Keywords — control flow */
    TOK_RETURN, TOK_IF, TOK_ELSE, TOK_WHILE, TOK_FOR,
    TOK_BREAK, TOK_CONTINUE,

    /* Keywords — other */
    TOK_STRUCT, TOK_TYPEDEF, TOK_SIZEOF, TOK_NULL, TOK_TRUE, TOK_FALSE,

    /* Arithmetic operators */
    TOK_PLUS, TOK_MINUS, TOK_STAR, TOK_SLASH, TOK_PERCENT,

    /* Increment / decrement */
    TOK_PLUSPLUS, TOK_MINUSMINUS,

    /* Compound assignment */
    TOK_PLUS_ASSIGN, TOK_MINUS_ASSIGN, TOK_STAR_ASSIGN, TOK_SLASH_ASSIGN,

    /* Comparison / assignment */
    TOK_ASSIGN, TOK_EQ, TOK_NEQ, TOK_LT, TOK_GT, TOK_LEQ, TOK_GEQ,

    /* Logical */
    TOK_BANG, TOK_AMPAMP, TOK_PIPEPIPE,

    /* Bitwise */
    TOK_AMP, TOK_PIPE, TOK_CARET, TOK_TILDE, TOK_LSHIFT, TOK_RSHIFT,

    /* Punctuation */
    TOK_LPAREN, TOK_RPAREN, TOK_LBRACE, TOK_RBRACE,
    TOK_LBRACKET, TOK_RBRACKET, TOK_SEMICOLON, TOK_COMMA,
    TOK_DOT, TOK_ARROW, TOK_COLON, TOK_QUESTION, TOK_HASH,

    /* Special */
    TOK_PREPROCESSOR, TOK_EOF, TOK_UNKNOWN
} TokenType;

typedef struct {
    TokenType type;
    char* value;
    int line;
    int col;
} Token;

#endif
