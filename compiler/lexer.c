#include "lexer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ── state ────────────────────────────────────────────────────────────── */

static const char* src;
static int         pos;
static int         line;
static int         col;

/* ── private helpers ──────────────────────────────────────────────────── */

static char peek(void) {
    return src[pos];
}

static char peek_next(void) {
    return src[pos] != '\0' ? src[pos + 1] : '\0';
}

static char advance(void) {
    char c = src[pos++];
    if (c == '\n') {
        line++;
        col = 1;
    } else {
        col++;
    }
    return c;
}

/*
 * make_token — builds a Token from a known start pointer and length.
 * tok_line / tok_col are captured BEFORE any characters are consumed,
 * so they always point to the first character of the token.
 */
static Token make_token(TokenType   type,
                        const char* start,
                        int         length,
                        int         tok_line,
                        int         tok_col) {
    Token t;
    t.type  = type;
    t.line  = tok_line;
    t.col   = tok_col;
    t.value = (char*)malloc(length + 1);
    if (!t.value) {
        fprintf(stderr, "lexer: out of memory\n");
        exit(1);
    }
    strncpy(t.value, start, length);
    t.value[length] = '\0';
    return t;
}

static Token make_eof(void) {
    Token t;
    t.type  = TOK_EOF;
    t.line  = line;
    t.col   = col;
    t.value = strdup("EOF");
    return t;
}

/* ── whitespace / comment skipping ───────────────────────────────────── */

static void skip_whitespace_and_comments(void) {
    for (;;) {
        /* whitespace */
        while (isspace((unsigned char)peek()))
            advance();

        /* single-line comment  // ... */
        if (peek() == '/' && peek_next() == '/') {
            while (peek() != '\n' && peek() != '\0')
                advance();
            continue;
        }

        /* multi-line comment:  slash-star ... star-slash */
        if (peek() == '/' && peek_next() == '*') {
            advance(); advance();          /* consume /  * */
            while (peek() != '\0') {
                if (peek() == '*' && peek_next() == '/') {
                    advance(); advance();  /* consume *  / */
                    break;
                }
                advance();
            }
            if (peek() == '\0')
                fprintf(stderr,
                    "lexer warning: unterminated /* comment\n");
            continue;
        }

        break;
    }
}

/* ── keyword lookup ───────────────────────────────────────────────────── */

static TokenType keyword_type(const char* word) {
    if (strcmp(word, "int")      == 0) return TOK_INT;
    if (strcmp(word, "char")     == 0) return TOK_CHAR;
    if (strcmp(word, "float")    == 0) return TOK_FLOAT;
    if (strcmp(word, "double")   == 0) return TOK_DOUBLE;
    if (strcmp(word, "void")     == 0) return TOK_VOID;
    if (strcmp(word, "long")     == 0) return TOK_LONG;
    if (strcmp(word, "short")    == 0) return TOK_SHORT;
    if (strcmp(word, "unsigned") == 0) return TOK_UNSIGNED;
    if (strcmp(word, "signed")   == 0) return TOK_SIGNED;
    if (strcmp(word, "size_t")   == 0) return TOK_SIZE_T;
    if (strcmp(word, "bool")     == 0) return TOK_BOOL;
    if (strcmp(word, "true")     == 0) return TOK_TRUE;
    if (strcmp(word, "false")    == 0) return TOK_FALSE;
    if (strcmp(word, "return")   == 0) return TOK_RETURN;
    if (strcmp(word, "if")       == 0) return TOK_IF;
    if (strcmp(word, "else")     == 0) return TOK_ELSE;
    if (strcmp(word, "while")    == 0) return TOK_WHILE;
    if (strcmp(word, "for")      == 0) return TOK_FOR;
    if (strcmp(word, "break")    == 0) return TOK_BREAK;
    if (strcmp(word, "continue") == 0) return TOK_CONTINUE;
    if (strcmp(word, "struct")   == 0) return TOK_STRUCT;
    if (strcmp(word, "typedef")  == 0) return TOK_TYPEDEF;
    if (strcmp(word, "sizeof")   == 0) return TOK_SIZEOF;
    if (strcmp(word, "NULL")     == 0) return TOK_NULL;
    return TOK_IDENT;
}

/* ── public API ───────────────────────────────────────────────────────── */

void lexer_init(const char* source) {
    src  = source;
    pos  = 0;
    line = 1;
    col  = 1;
}

Token next_token(void) {
    skip_whitespace_and_comments();

    if (peek() == '\0')
        return make_eof();

    /*
     * Capture position BEFORE consuming any characters.
     * This is the fix for bugs 1 and 4 — col/line are
     * always the first character of the token.
     */
    const char* start     = src + pos;
    int         tok_line  = line;
    int         tok_col   = col;

    char c = advance();

    /* ── identifiers and keywords ─────────────────────────── */
    if (isalpha((unsigned char)c) || c == '_') {
        int length = 1;
        while (isalnum((unsigned char)peek()) || peek() == '_') {
            advance();
            length++;
        }

        /* build a null-terminated copy just for keyword lookup */
        char buf[256];
        int  cpy = length < 255 ? length : 255;
        strncpy(buf, start, cpy);
        buf[cpy] = '\0';

        TokenType type = keyword_type(buf);
        return make_token(type, start, length, tok_line, tok_col);
    }

    /* ── integer and float literals ───────────────────────── */
    if (isdigit((unsigned char)c)) {
        int length = 1;
        while (isdigit((unsigned char)peek())) {
            advance();
            length++;
        }
        /* float: consume decimal part */
        if (peek() == '.' && isdigit((unsigned char)src[pos + 1])) {
            advance(); length++;               /* consume '.' */
            while (isdigit((unsigned char)peek())) {
                advance();
                length++;
            }
            return make_token(TOK_FLOAT_LIT, start, length,
                              tok_line, tok_col);
        }
        return make_token(TOK_NUMBER, start, length, tok_line, tok_col);
    }

    /* ── string literals ──────────────────────────────────── */
    if (c == '"') {
        /*
         * Include the opening " in the token value so the
         * token is self-contained and col points to the ".
         * Recount from start (which points to the ").
         */
        int length = 1;   /* opening " already consumed */

        while (peek() != '"' && peek() != '\0') {
            if (peek() == '\\' && peek_next() != '\0') {
                advance(); length++;   /* escape character */
            }
            advance(); length++;
        }

        if (peek() == '"') {
            advance(); length++;       /* closing " */
            return make_token(TOK_STRING_LITERAL, start, length,
                              tok_line, tok_col);
        }

        /* unterminated string */
        fprintf(stderr,
            "lexer warning: unterminated string literal "
            "starting at line %d col %d\n",
            tok_line, tok_col);
        return make_token(TOK_UNKNOWN, start, length, tok_line, tok_col);
    }

    /* ── character literals ───────────────────────────────── */
    if (c == '\'') {
        int length = 1;
        while (peek() != '\'' && peek() != '\0' && peek() != '\n') {
            if (peek() == '\\' && peek_next() != '\0') {
                advance(); length++;
            }
            advance(); length++;
        }
        if (peek() == '\'') {
            advance(); length++;
            return make_token(TOK_CHAR_LIT, start, length,
                              tok_line, tok_col);
        }
        fprintf(stderr,
            "lexer warning: unterminated char literal "
            "at line %d col %d\n", tok_line, tok_col);
        return make_token(TOK_UNKNOWN, start, length, tok_line, tok_col);
    }

    /* ── operators and punctuation ────────────────────────── */
    switch (c) {

        /* arithmetic */
        case '+':
            if (peek() == '+') { advance();
                return make_token(TOK_PLUSPLUS,  start, 2, tok_line, tok_col); }
            if (peek() == '=') { advance();
                return make_token(TOK_PLUS_ASSIGN, start, 2, tok_line, tok_col); }
            return make_token(TOK_PLUS,  start, 1, tok_line, tok_col);

        case '-':
            if (peek() == '-') { advance();
                return make_token(TOK_MINUSMINUS, start, 2, tok_line, tok_col); }
            if (peek() == '=') { advance();
                return make_token(TOK_MINUS_ASSIGN, start, 2, tok_line, tok_col); }
            if (peek() == '>') { advance();
                return make_token(TOK_ARROW,  start, 2, tok_line, tok_col); }
            return make_token(TOK_MINUS, start, 1, tok_line, tok_col);

        case '*':
            if (peek() == '=') { advance();
                return make_token(TOK_STAR_ASSIGN, start, 2, tok_line, tok_col); }
            return make_token(TOK_STAR,  start, 1, tok_line, tok_col);

        case '/':
            if (peek() == '=') { advance();
                return make_token(TOK_SLASH_ASSIGN, start, 2, tok_line, tok_col); }
            return make_token(TOK_SLASH, start, 1, tok_line, tok_col);

        case '%':
            return make_token(TOK_PERCENT, start, 1, tok_line, tok_col);

        /* comparison */
        case '=':
            if (peek() == '=') { advance();
                return make_token(TOK_EQ,     start, 2, tok_line, tok_col); }
            return make_token(TOK_ASSIGN, start, 1, tok_line, tok_col);

        case '!':
            if (peek() == '=') { advance();
                return make_token(TOK_NEQ,  start, 2, tok_line, tok_col); }
            return make_token(TOK_BANG, start, 1, tok_line, tok_col);

        case '<':
            if (peek() == '=') { advance();
                return make_token(TOK_LEQ, start, 2, tok_line, tok_col); }
            if (peek() == '<') { advance();
                return make_token(TOK_LSHIFT, start, 2, tok_line, tok_col); }
            return make_token(TOK_LT, start, 1, tok_line, tok_col);

        case '>':
            if (peek() == '=') { advance();
                return make_token(TOK_GEQ, start, 2, tok_line, tok_col); }
            if (peek() == '>') { advance();
                return make_token(TOK_RSHIFT, start, 2, tok_line, tok_col); }
            return make_token(TOK_GT, start, 1, tok_line, tok_col);

        /* logical */
        case '&':
            if (peek() == '&') { advance();
                return make_token(TOK_AMPAMP, start, 2, tok_line, tok_col); }
            return make_token(TOK_AMP, start, 1, tok_line, tok_col);

        case '|':
            if (peek() == '|') { advance();
                return make_token(TOK_PIPEPIPE, start, 2, tok_line, tok_col); }
            return make_token(TOK_PIPE, start, 1, tok_line, tok_col);

        case '^':
            return make_token(TOK_CARET, start, 1, tok_line, tok_col);

        case '~':
            return make_token(TOK_TILDE, start, 1, tok_line, tok_col);

        /* punctuation */
        case '(':  return make_token(TOK_LPAREN,    start, 1, tok_line, tok_col);
        case ')':  return make_token(TOK_RPAREN,    start, 1, tok_line, tok_col);
        case '{':  return make_token(TOK_LBRACE,    start, 1, tok_line, tok_col);
        case '}':  return make_token(TOK_RBRACE,    start, 1, tok_line, tok_col);
        case '[':  return make_token(TOK_LBRACKET,  start, 1, tok_line, tok_col);
        case ']':  return make_token(TOK_RBRACKET,  start, 1, tok_line, tok_col);
        case ';':  return make_token(TOK_SEMICOLON, start, 1, tok_line, tok_col);
        case ',':  return make_token(TOK_COMMA,     start, 1, tok_line, tok_col);
        case '.':  return make_token(TOK_DOT,       start, 1, tok_line, tok_col);
        case ':':  return make_token(TOK_COLON,     start, 1, tok_line, tok_col);
        case '?':  return make_token(TOK_QUESTION,  start, 1, tok_line, tok_col);
        case '#':  {
            int length = 1;
            while (peek() != '\n' && peek() != '\0') {
                advance();
                length++;
            }
            return make_token(TOK_PREPROCESSOR, start, length, tok_line, tok_col);
        }

        default:
            break;
    }

    /* ── unrecognised character ────────────────────────────── */
    fprintf(stderr,
        "lexer warning: unknown character '%c' (0x%02x) "
        "at line %d col %d\n",
        isprint((unsigned char)c) ? c : '?',
        (unsigned char)c,
        tok_line, tok_col);
    return make_token(TOK_UNKNOWN, start, 1, tok_line, tok_col);
}