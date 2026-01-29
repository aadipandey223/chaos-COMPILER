// Token Types
export const TokenType = {
    INT: 'INT',
    RETURN: 'RETURN',
    MAIN: 'MAIN',
    IDENTIFIER: 'IDENTIFIER',
    NUMBER: 'NUMBER',
    ASSIGN: 'ASSIGN',
    PLUS: 'PLUS',
    MINUS: 'MINUS',
    STAR: 'STAR',
    SLASH: 'SLASH',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    LBRACE: 'LBRACE',
    RBRACE: 'RBRACE',
    SEMICOLON: 'SEMICOLON',
    COMMA: 'COMMA',
    STRING: 'STRING',
    LBRACKET: 'LBRACKET',
    RBRACKET: 'RBRACKET',
    IF: 'IF',
    ELSE: 'ELSE',
    WHILE: 'WHILE',
    SIZEOF: 'SIZEOF',
    LESS: 'LESS',
    GREATER: 'GREATER',
    BANG: 'BANG',
    FOR: 'FOR',
    DOUBLE: 'DOUBLE',
    CONST: 'CONST',
    EOF: 'EOF'
};

export class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.tokens = [];
    }

    tokenize() {
        while (this.pos < this.input.length) {
            const char = this.input[this.pos];

            // Skip whitespace
            if (/\s/.test(char)) {
                if (char === '\n') this.line++;
                this.pos++;
                continue;
            }

            // Skip comments //
            if (char === '/' && this.input[this.pos + 1] === '/') {
                while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
                    this.pos++;
                }
                continue;
            }

            // Strings
            if (char === '"') {
                let str = '';
                this.pos++; // skip opening quote
                while (this.pos < this.input.length && this.input[this.pos] !== '"') {
                    if (this.input[this.pos] === '\\' && this.pos + 1 < this.input.length) {
                        // Handle escape sequences
                        const nextChar = this.input[this.pos + 1];
                        if (nextChar === 'n') {
                            str += '\n';
                            this.pos += 2;
                        } else if (nextChar === 't') {
                            str += '\t';
                            this.pos += 2;
                        } else if (nextChar === 'r') {
                            str += '\r';
                            this.pos += 2;
                        } else if (nextChar === '\\') {
                            str += '\\';
                            this.pos += 2;
                        } else if (nextChar === '"') {
                            str += '"';
                            this.pos += 2;
                        } else {
                            str += this.input[this.pos];
                            this.pos++;
                        }
                    } else {
                        str += this.input[this.pos];
                        this.pos++;
                    }
                }
                this.pos++; // skip closing quote
                this.tokens.push({ type: TokenType.STRING, value: str, line: this.line });
                continue;
            }

            // Numbers (including decimals)
            if (/[0-9]/.test(char)) {
                let num = '';
                let hasDot = false;
                while (this.pos < this.input.length && (/[0-9]/.test(this.input[this.pos]) || (this.input[this.pos] === '.' && !hasDot))) {
                    if (this.input[this.pos] === '.') hasDot = true;
                    num += this.input[this.pos];
                    this.pos++;
                }
                this.tokens.push({ type: TokenType.NUMBER, value: num, line: this.line });
                continue;
            }

            // Identifiers and Keywords
            if (/[a-zA-Z_]/.test(char)) {
                let id = '';
                while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
                    id += this.input[this.pos];
                    this.pos++;
                }

                let type = TokenType.IDENTIFIER;
                if (id === 'int') type = TokenType.INT;
                if (id === 'return') type = TokenType.RETURN;
                if (id === 'main') type = TokenType.MAIN;
                if (id === 'if') type = TokenType.IF;
                if (id === 'else') type = TokenType.ELSE;
                if (id === 'while') type = TokenType.WHILE;
                if (id === 'sizeof') type = TokenType.SIZEOF;
                if (id === 'for') type = TokenType.FOR;
                if (id === 'double') type = TokenType.DOUBLE;
                if (id === 'const') type = TokenType.CONST;

                this.tokens.push({ type, value: id, line: this.line });
                continue;
            }

            // Operators and Punctuation
            switch (char) {
                case '=': this.tokens.push({ type: TokenType.ASSIGN, value: '=', line: this.line }); break;
                case '+': this.tokens.push({ type: TokenType.PLUS, value: '+', line: this.line }); break;
                case '-': this.tokens.push({ type: TokenType.MINUS, value: '-', line: this.line }); break;
                case '*': this.tokens.push({ type: TokenType.STAR, value: '*', line: this.line }); break;
                case '/': this.tokens.push({ type: TokenType.SLASH, value: '/', line: this.line }); break;
                case '(': this.tokens.push({ type: TokenType.LPAREN, value: '(', line: this.line }); break;
                case ')': this.tokens.push({ type: TokenType.RPAREN, value: ')', line: this.line }); break;
                case '{': this.tokens.push({ type: TokenType.LBRACE, value: '{', line: this.line }); break;
                case '}': this.tokens.push({ type: TokenType.RBRACE, value: '}', line: this.line }); break;
                case ';': this.tokens.push({ type: TokenType.SEMICOLON, value: ';', line: this.line }); break;
                case ',': this.tokens.push({ type: TokenType.COMMA, value: ',', line: this.line }); break;
                case '[': this.tokens.push({ type: TokenType.LBRACKET, value: '[', line: this.line }); break;
                case ']': this.tokens.push({ type: TokenType.RBRACKET, value: ']', line: this.line }); break;
                case '<': this.tokens.push({ type: TokenType.LESS, value: '<', line: this.line }); break;
                case '>': this.tokens.push({ type: TokenType.GREATER, value: '>', line: this.line }); break;
                case '!': this.tokens.push({ type: TokenType.BANG, value: '!', line: this.line }); break;
                default:
                    console.warn(`Unknown character: ${char} at line ${this.line}`);
            }
            this.pos++;
        }

        this.tokens.push({ type: TokenType.EOF, value: '', line: this.line });
        return this.tokens;
    }
}
