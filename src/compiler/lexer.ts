import { Token, TokenType } from '../types';

// ============================================================================
// LEXER - Tokenizes C-like source code
// ============================================================================

const KEYWORDS: Record<string, TokenType> = {
  int: TokenType.INT,
  return: TokenType.RETURN,
  if: TokenType.IF,
  else: TokenType.ELSE,
  while: TokenType.WHILE,
  for: TokenType.FOR,
  void: TokenType.VOID,
  const: TokenType.CONST,
  double: TokenType.DOUBLE,
  sizeof: TokenType.SIZEOF,
};

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  private peek(offset: number = 0): string {
    return this.source[this.pos + offset] ?? '\0';
  }

  private advance(): string {
    const char = this.peek();
    this.pos++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - value.length,
    });
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd() && this.isWhitespace(this.peek())) {
      this.advance();
    }
  }

  private skipComment(): boolean {
    if (this.peek() === '/' && this.peek(1) === '/') {
      // Single-line comment
      while (!this.isAtEnd() && this.peek() !== '\n') {
        this.advance();
      }
      return true;
    }
    if (this.peek() === '/' && this.peek(1) === '*') {
      // Multi-line comment
      this.advance(); // /
      this.advance(); // *
      while (!this.isAtEnd()) {
        if (this.peek() === '*' && this.peek(1) === '/') {
          this.advance(); // *
          this.advance(); // /
          break;
        }
        this.advance();
      }
      return true;
    }
    return false;
  }

  private scanNumber(): void {
    const startCol = this.column;
    let value = '';

    // Check for negative sign
    if (this.peek() === '-') {
      value += this.advance();
    }

    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }

    // Handle decimal numbers
    if (this.peek() === '.' && this.isDigit(this.peek(1))) {
      value += this.advance(); // .
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    this.tokens.push({
      type: TokenType.NUMBER,
      value,
      line: this.line,
      column: startCol,
    });
  }

  private scanIdentifier(): void {
    const startCol = this.column;
    let value = '';

    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    const type = KEYWORDS[value] ?? TokenType.IDENTIFIER;
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: startCol,
    });
  }

  private scanString(): void {
    const startCol = this.column;
    const quote = this.advance(); // Opening quote
    let value = '';

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance(); // Escape char
        const escaped = this.advance();
        switch (escaped) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '\\':
            value += '\\';
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            value += escaped;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.peek() === quote) {
      this.advance(); // Closing quote
    }

    this.tokens.push({
      type: TokenType.STRING,
      value,
      line: this.line,
      column: startCol,
    });
  }

  public tokenize(): Token[] {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      this.skipWhitespace();
      if (this.isAtEnd()) break;

      // Skip comments
      if (this.skipComment()) continue;

      const char = this.peek();

      // Numbers
      if (this.isDigit(char)) {
        this.scanNumber();
        continue;
      }

      // Identifiers and keywords
      if (this.isAlpha(char)) {
        this.scanIdentifier();
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        this.scanString();
        continue;
      }

      // Operators and delimiters
      switch (char) {
        case '+':
          this.advance();
          if (this.peek() === '+') {
            this.advance();
            this.addToken(TokenType.PLUS_PLUS, '++');
          } else if (this.peek() === '=') {
            this.advance();
            this.addToken(TokenType.PLUS_ASSIGN, '+=');
          } else {
            this.addToken(TokenType.PLUS, '+');
          }
          break;

        case '-':
          this.advance();
          if (this.peek() === '-') {
            this.advance();
            this.addToken(TokenType.MINUS_MINUS, '--');
          } else if (this.peek() === '=') {
            this.advance();
            this.addToken(TokenType.MINUS_ASSIGN, '-=');
          } else {
            this.addToken(TokenType.MINUS, '-');
          }
          break;

        case '*':
          this.advance();
          this.addToken(TokenType.STAR, '*');
          break;

        case '/':
          this.advance();
          this.addToken(TokenType.SLASH, '/');
          break;

        case '%':
          this.advance();
          this.addToken(TokenType.PERCENT, '%');
          break;

        case '=':
          this.advance();
          if (this.peek() === '=') {
            this.advance();
            this.addToken(TokenType.EQUAL, '==');
          } else {
            this.addToken(TokenType.ASSIGN, '=');
          }
          break;

        case '<':
          this.advance();
          if (this.peek() === '=') {
            this.advance();
            this.addToken(TokenType.LESS_EQUAL, '<=');
          } else {
            this.addToken(TokenType.LESS, '<');
          }
          break;

        case '>':
          this.advance();
          if (this.peek() === '=') {
            this.advance();
            this.addToken(TokenType.GREATER_EQUAL, '>=');
          } else {
            this.addToken(TokenType.GREATER, '>');
          }
          break;

        case '!':
          this.advance();
          if (this.peek() === '=') {
            this.advance();
            this.addToken(TokenType.NOT_EQUAL, '!=');
          } else {
            this.addToken(TokenType.NOT, '!');
          }
          break;

        case '&':
          this.advance();
          if (this.peek() === '&') {
            this.advance();
            this.addToken(TokenType.AND, '&&');
          } else {
            this.addToken(TokenType.AMPERSAND, '&');
          }
          break;

        case '|':
          this.advance();
          if (this.peek() === '|') {
            this.advance();
            this.addToken(TokenType.OR, '||');
          } else {
            this.addToken(TokenType.PIPE, '|');
          }
          break;

        case '^':
          this.advance();
          this.addToken(TokenType.CARET, '^');
          break;

        case '~':
          this.advance();
          this.addToken(TokenType.TILDE, '~');
          break;

        case '(':
          this.advance();
          this.addToken(TokenType.LPAREN, '(');
          break;

        case ')':
          this.advance();
          this.addToken(TokenType.RPAREN, ')');
          break;

        case '{':
          this.advance();
          this.addToken(TokenType.LBRACE, '{');
          break;

        case '}':
          this.advance();
          this.addToken(TokenType.RBRACE, '}');
          break;

        case '[':
          this.advance();
          this.addToken(TokenType.LBRACKET, '[');
          break;

        case ']':
          this.advance();
          this.addToken(TokenType.RBRACKET, ']');
          break;

        case ';':
          this.advance();
          this.addToken(TokenType.SEMICOLON, ';');
          break;

        case ',':
          this.advance();
          this.addToken(TokenType.COMMA, ',');
          break;

        case '?':
          this.advance();
          this.addToken(TokenType.QUESTION, '?');
          break;

        case ':':
          this.advance();
          this.addToken(TokenType.COLON, ':');
          break;

        default:
          // Unknown character - skip it
          this.advance();
          break;
      }
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }
}

// Convenience function
export function tokenize(source: string): Token[] {
  return new Lexer(source).tokenize();
}
