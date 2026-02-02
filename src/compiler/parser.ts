import {
  Token,
  TokenType,
  ASTNode,
  Program,
  FunctionDeclaration,
  VariableDeclaration,
  ReturnStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  UnaryExpression,
  CallExpression,
  ConditionalExpression,
  Identifier,
  Literal,
} from '../types';

// ============================================================================
// PARSER - Recursive descent parser for C-like syntax
// ============================================================================

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset: number = 0): Token {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) {
      return { type: TokenType.EOF, value: '', line: 0, column: 0 };
    }
    return this.tokens[idx];
  }

  private current(): Token {
    return this.peek();
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.peek(-1);
  }

  private isAtEnd(): boolean {
    return this.current().type === TokenType.EOF;
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private expect(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw new Error(
      `Parse error at line ${this.current().line}, column ${this.current().column}: ${message}. Got '${this.current().value}' (${this.current().type})`
    );
  }

  // ============================================================================
  // PARSING METHODS
  // ============================================================================

  public parse(): Program {
    const body: ASTNode[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseDeclaration();
      if (stmt) {
        body.push(stmt);
      }
    }

    // Extract function declarations for convenience
    const functions = body.filter(
      (node): node is FunctionDeclaration => node.type === 'FunctionDeclaration'
    );

    return { type: 'Program', body, functions };
  }

  private parseDeclaration(): ASTNode | null {
    // Function declaration or variable declaration
    if (
      this.check(TokenType.INT) ||
      this.check(TokenType.VOID) ||
      this.check(TokenType.DOUBLE) ||
      this.check(TokenType.CONST)
    ) {
      return this.parseTypeDeclaration();
    }

    return this.parseStatement();
  }

  private parseTypeDeclaration(): ASTNode {
    const isConst = this.match(TokenType.CONST);
    const typeToken = this.advance(); // int, void, double
    const typeName = (isConst ? 'const ' : '') + typeToken.value;

    // Could be a function or variable
    const nameToken = this.expect(TokenType.IDENTIFIER, 'Expected identifier');

    // Function declaration
    if (this.check(TokenType.LPAREN)) {
      return this.parseFunctionDeclaration(typeName, nameToken.value);
    }

    // Variable declaration
    return this.parseVariableDeclaration(typeName, nameToken.value);
  }

  private parseFunctionDeclaration(
    returnType: string,
    name: string
  ): FunctionDeclaration {
    this.expect(TokenType.LPAREN, "Expected '(' after function name");

    const params: string[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        // Parse parameter type
        if (
          this.check(TokenType.INT) ||
          this.check(TokenType.DOUBLE) ||
          this.check(TokenType.VOID)
        ) {
          this.advance();
        }
        const param = this.expect(TokenType.IDENTIFIER, 'Expected parameter name');
        params.push(param.value);
      } while (this.match(TokenType.COMMA));
    }

    this.expect(TokenType.RPAREN, "Expected ')' after parameters");
    this.expect(TokenType.LBRACE, "Expected '{' before function body");

    const body = this.parseBlockBody();

    return {
      type: 'FunctionDeclaration',
      name,
      params,
      returnType,
      body,
    };
  }

  private parseVariableDeclaration(kind: string, firstName: string): VariableDeclaration {
    const declarations: Array<{ id: string; init: ASTNode | null }> = [];

    // First variable
    let init: ASTNode | null = null;
    if (this.match(TokenType.ASSIGN)) {
      init = this.parseExpression();
    }
    declarations.push({ id: firstName, init });

    // Additional variables in same declaration
    while (this.match(TokenType.COMMA)) {
      const name = this.expect(TokenType.IDENTIFIER, 'Expected variable name');
      let varInit: ASTNode | null = null;
      if (this.match(TokenType.ASSIGN)) {
        varInit = this.parseExpression();
      }
      declarations.push({ id: name.value, init: varInit });
    }

    this.expect(TokenType.SEMICOLON, "Expected ';' after variable declaration");

    return {
      type: 'VariableDeclaration',
      kind,
      declarations,
    };
  }

  private parseStatement(): ASTNode | null {
    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }

    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }

    if (this.check(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }

    if (this.check(TokenType.FOR)) {
      return this.parseForStatement();
    }

    if (this.check(TokenType.LBRACE)) {
      this.advance();
      const body = this.parseBlockBody();
      return { type: 'BlockStatement', body };
    }

    // Type declarations
    if (
      this.check(TokenType.INT) ||
      this.check(TokenType.DOUBLE) ||
      this.check(TokenType.CONST)
    ) {
      return this.parseTypeDeclaration();
    }

    return this.parseExpressionStatement();
  }

  private parseBlockBody(): ASTNode[] {
    const body: ASTNode[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.parseDeclaration();
      if (stmt) {
        body.push(stmt);
      }
    }

    this.expect(TokenType.RBRACE, "Expected '}'");
    return body;
  }

  private parseReturnStatement(): ReturnStatement {
    this.expect(TokenType.RETURN, "Expected 'return'");

    let argument: ASTNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      argument = this.parseExpression();
    }

    this.expect(TokenType.SEMICOLON, "Expected ';' after return statement");

    return {
      type: 'ReturnStatement',
      argument,
    };
  }

  private parseIfStatement(): IfStatement {
    this.expect(TokenType.IF, "Expected 'if'");
    this.expect(TokenType.LPAREN, "Expected '(' after 'if'");
    const test = this.parseExpression();
    this.expect(TokenType.RPAREN, "Expected ')' after condition");

    const consequent = this.parseStatement() as ASTNode;

    let alternate: ASTNode | null = null;
    if (this.match(TokenType.ELSE)) {
      alternate = this.parseStatement() as ASTNode;
    }

    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate,
    };
  }

  private parseWhileStatement(): WhileStatement {
    this.expect(TokenType.WHILE, "Expected 'while'");
    this.expect(TokenType.LPAREN, "Expected '(' after 'while'");
    const test = this.parseExpression();
    this.expect(TokenType.RPAREN, "Expected ')' after condition");

    const body = this.parseStatement() as ASTNode;

    return {
      type: 'WhileStatement',
      test,
      body,
    };
  }

  private parseForStatement(): ForStatement {
    this.expect(TokenType.FOR, "Expected 'for'");
    this.expect(TokenType.LPAREN, "Expected '(' after 'for'");

    // Init
    let init: ASTNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      if (this.check(TokenType.INT) || this.check(TokenType.DOUBLE)) {
        const typeToken = this.advance();
        const name = this.expect(TokenType.IDENTIFIER, 'Expected variable name');
        init = this.parseVariableDeclarationInline(typeToken.value, name.value);
      } else {
        init = this.parseExpression();
        this.expect(TokenType.SEMICOLON, "Expected ';' after for init");
      }
    } else {
      this.expect(TokenType.SEMICOLON, "Expected ';'");
    }

    // Test
    let test: ASTNode | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      test = this.parseExpression();
    }
    this.expect(TokenType.SEMICOLON, "Expected ';' after for condition");

    // Update
    let update: ASTNode | null = null;
    if (!this.check(TokenType.RPAREN)) {
      update = this.parseExpression();
    }
    this.expect(TokenType.RPAREN, "Expected ')' after for clauses");

    const body = this.parseStatement() as ASTNode;

    return {
      type: 'ForStatement',
      init,
      test,
      update,
      body,
    };
  }

  private parseVariableDeclarationInline(kind: string, firstName: string): VariableDeclaration {
    const declarations: Array<{ id: string; init: ASTNode | null }> = [];

    let init: ASTNode | null = null;
    if (this.match(TokenType.ASSIGN)) {
      init = this.parseExpression();
    }
    declarations.push({ id: firstName, init });

    while (this.match(TokenType.COMMA)) {
      const name = this.expect(TokenType.IDENTIFIER, 'Expected variable name');
      let varInit: ASTNode | null = null;
      if (this.match(TokenType.ASSIGN)) {
        varInit = this.parseExpression();
      }
      declarations.push({ id: name.value, init: varInit });
    }

    this.expect(TokenType.SEMICOLON, "Expected ';' after variable declaration");

    return {
      type: 'VariableDeclaration',
      kind,
      declarations,
    };
  }

  private parseExpressionStatement(): ASTNode | null {
    const expr = this.parseExpression();
    this.expect(TokenType.SEMICOLON, "Expected ';' after expression");
    return { type: 'ExpressionStatement', expression: expr };
  }

  // ============================================================================
  // EXPRESSION PARSING (Precedence Climbing)
  // ============================================================================

  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode {
    const expr = this.parseTernary();

    if (
      this.check(TokenType.ASSIGN) ||
      this.check(TokenType.PLUS_ASSIGN) ||
      this.check(TokenType.MINUS_ASSIGN)
    ) {
      const operator = this.advance();
      const right = this.parseAssignment();

      if (expr.type === 'Identifier') {
        return {
          type: 'AssignmentStatement',
          left: expr as Identifier,
          operator: operator.value,
          right,
        };
      }
    }

    return expr;
  }

  private parseTernary(): ASTNode {
    let expr = this.parseOr();

    if (this.match(TokenType.QUESTION)) {
      const consequent = this.parseExpression();
      this.expect(TokenType.COLON, "Expected ':' in ternary expression");
      const alternate = this.parseTernary();
      expr = {
        type: 'ConditionalExpression',
        test: expr,
        consequent,
        alternate,
      } as ConditionalExpression;
    }

    return expr;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();

    while (this.match(TokenType.OR)) {
      const operator = '||';
      const right = this.parseAnd();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseBitwiseOr();

    while (this.match(TokenType.AND)) {
      const operator = '&&';
      const right = this.parseBitwiseOr();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseBitwiseOr(): ASTNode {
    let left = this.parseBitwiseXor();

    while (this.match(TokenType.PIPE)) {
      const operator = '|';
      const right = this.parseBitwiseXor();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseBitwiseXor(): ASTNode {
    let left = this.parseBitwiseAnd();

    while (this.match(TokenType.CARET)) {
      const operator = '^';
      const right = this.parseBitwiseAnd();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseBitwiseAnd(): ASTNode {
    let left = this.parseEquality();

    while (this.match(TokenType.AMPERSAND)) {
      const operator = '&';
      const right = this.parseEquality();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseComparison();

    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.peek(-1).value;
      const right = this.parseComparison();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseTerm();

    while (
      this.match(
        TokenType.LESS,
        TokenType.GREATER,
        TokenType.LESS_EQUAL,
        TokenType.GREATER_EQUAL
      )
    ) {
      const operator = this.peek(-1).value;
      const right = this.parseTerm();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseTerm(): ASTNode {
    let left = this.parseFactor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.peek(-1).value;
      const right = this.parseFactor();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseFactor(): ASTNode {
    let left = this.parseUnary();

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.peek(-1).value;
      const right = this.parseUnary();
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (
      this.match(
        TokenType.NOT,
        TokenType.MINUS,
        TokenType.TILDE,
        TokenType.PLUS_PLUS,
        TokenType.MINUS_MINUS
      )
    ) {
      const operator = this.peek(-1).value;
      const argument = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator,
        argument,
        prefix: true,
      } as UnaryExpression;
    }

    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary();

    while (this.match(TokenType.PLUS_PLUS, TokenType.MINUS_MINUS)) {
      const operator = this.peek(-1).value;
      expr = {
        type: 'UnaryExpression',
        operator,
        argument: expr,
        prefix: false,
      } as UnaryExpression;
    }

    return expr;
  }

  private parsePrimary(): ASTNode {
    // Number literal
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: parseFloat(token.value),
        raw: token.value,
      } as Literal;
    }

    // String literal
    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return {
        type: 'Literal',
        value: token.value,
        raw: `"${token.value}"`,
      } as Literal;
    }

    // Identifier or function call
    if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.MAIN)) {
      const nameToken = this.advance();

      // Function call
      if (this.check(TokenType.LPAREN)) {
        return this.parseCallExpression(nameToken.value);
      }

      return { type: 'Identifier', name: nameToken.value } as Identifier;
    }

    // sizeof
    if (this.match(TokenType.SIZEOF)) {
      this.expect(TokenType.LPAREN, "Expected '(' after sizeof");
      this.parseExpression(); // Consume the expression but return fixed value
      this.expect(TokenType.RPAREN, "Expected ')' after sizeof expression");
      return { type: 'Literal', value: 4. } as Literal;
    }

    // Grouped expression
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    throw new Error(
      `Unexpected token '${this.current().value}' at line ${this.current().line}`
    );
  }

  private parseCallExpression(callee: string): CallExpression {
    this.expect(TokenType.LPAREN, "Expected '(' for function call");

    const args: ASTNode[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.parseExpression());
      } while (this.match(TokenType.COMMA));
    }

    this.expect(TokenType.RPAREN, "Expected ')' after arguments");

    return {
      type: 'CallExpression',
      callee,
      arguments: args,
    };
  }
}

// Convenience function
export function parse(tokens: Token[]): Program {
  return new Parser(tokens).parse();
}
