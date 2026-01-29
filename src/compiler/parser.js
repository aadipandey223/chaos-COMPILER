import { TokenType } from './lexer';

export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.ast = { type: 'Program', body: [] };
    }

    peek() {
        return this.tokens[this.pos];
    }

    consume(type) {
        const token = this.tokens[this.pos];
        if (token.type === type) {
            this.pos++;
            return token;
        }
        throw new Error(`Expected ${type} but found ${token.type} at line ${token.line}`);
    }

    parse() {
        while (this.peek().type !== TokenType.EOF) {
            this.ast.body.push(this.parseStatement());
        }
        return this.ast;
    }

    parseStatement() {
        const token = this.peek();

        const isConst = token.type === TokenType.CONST;
        if (isConst) this.consume(TokenType.CONST);

        const typeToken = this.peek();
        if (typeToken.type === TokenType.INT || typeToken.type === TokenType.DOUBLE) {
            // function or variable
            const nextToken = this.tokens[this.pos + 1];
            if (nextToken.type === TokenType.IDENTIFIER && this.tokens[this.pos + 2].type === TokenType.LPAREN) {
                return this.parseFunction(isConst);
            } else if (nextToken.type === TokenType.MAIN) {
                return this.parseFunction(isConst);
            } else {
                return this.parseVariableDeclaration(isConst);
            }
        }

        if (token.type === TokenType.RETURN) {
            return this.parseReturn();
        }

        if (token.type === TokenType.IF) {
            return this.parseIfStatement();
        }

        if (token.type === TokenType.WHILE) {
            return this.parseWhileStatement();
        }

        if (token.type === TokenType.FOR) {
            return this.parseForStatement();
        }

        if (token.type === TokenType.LBRACE) {
            return this.parseBlock();
        }

        if (token.type === TokenType.IDENTIFIER) {
            // Check if it's a function call, array access, or assignment
            const next = this.tokens[this.pos + 1];
            if (next.type === TokenType.LPAREN) {
                const call = this.parseFunctionCall();
                this.consume(TokenType.SEMICOLON);
                return { type: 'ExpressionStatement', expression: call };
            }
            if (next.type === TokenType.LBRACKET) {
                // Potential array assignment: arr[i] = x;
                return this.parseArrayAssignment();
            }
            return this.parseAssignment();
        }

        throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
    }

    parseFunction(isConst = false) {
        const typeNode = this.consume(this.peek().type);
        const name = this.peek().type === TokenType.MAIN ? this.consume(TokenType.MAIN).value : this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.LPAREN);
        const params = [];
        if (this.peek().type !== TokenType.RPAREN) {
            while (true) {
                const pTypeNode = this.consume(this.peek().type); // int or double
                const pId = this.consume(TokenType.IDENTIFIER).value;
                let isPArray = false;
                if (this.peek().type === TokenType.LBRACKET) {
                    this.consume(TokenType.LBRACKET);
                    this.consume(TokenType.RBRACKET);
                    isPArray = true;
                }
                params.push({ id: pId, isArray: isPArray });
                if (this.peek().type === TokenType.COMMA) {
                    this.consume(TokenType.COMMA);
                } else {
                    break;
                }
            }
        }
        this.consume(TokenType.RPAREN);
        this.consume(TokenType.LBRACE);

        const body = [];
        while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
            body.push(this.parseStatement());
        }

        this.consume(TokenType.RBRACE);

        return {
            type: 'FunctionDeclaration',
            name: name,
            params: params,
            body: body
        };
    }

    parseAssignment() {
        const id = this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.ASSIGN);
        const init = this.parseExpression();
        this.consume(TokenType.SEMICOLON);

        return {
            type: 'AssignmentStatement',
            id,
            init
        };
    }

    parseFunctionCall() {
        const name = this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.LPAREN);
        const args = [];
        if (this.peek().type !== TokenType.RPAREN) {
            args.push(this.parseExpression());
            while (this.peek().type === TokenType.COMMA) {
                this.consume(TokenType.COMMA);
                args.push(this.parseExpression());
            }
        }
        this.consume(TokenType.RPAREN);
        return {
            type: 'CallExpression',
            callee: { type: 'Identifier', name },
            arguments: args
        };
    }

    parseVariableDeclaration(isConst = false) {
        const typeToken = this.consume(this.peek().type);
        const declarations = [];

        while (true) {
            const id = this.consume(TokenType.IDENTIFIER).value;
            let isArray = false;
            let arraySize = null;

            if (this.peek().type === TokenType.LBRACKET) {
                this.consume(TokenType.LBRACKET);
                isArray = true;
                if (this.peek().type !== TokenType.RBRACKET) {
                    arraySize = this.parseExpression();
                }
                this.consume(TokenType.RBRACKET);
            }

            let init = null;
            if (this.peek().type === TokenType.ASSIGN) {
                this.consume(TokenType.ASSIGN);
                if (this.peek().type === TokenType.LBRACE) {
                    init = this.parseArrayInitializer();
                } else {
                    init = this.parseExpression();
                }
            }

            declarations.push({ id, init, isArray, arraySize, isConst });

            if (this.peek().type === TokenType.SEMICOLON) {
                this.consume(TokenType.SEMICOLON);
                break;
            } else if (this.peek().type === TokenType.COMMA) {
                this.consume(TokenType.COMMA);
            } else {
                break;
            }
        }

        return {
            type: 'VariableDeclaration',
            kind: typeToken.value,
            isConst,
            declarations
        };
    }

    parseArrayInitializer() {
        this.consume(TokenType.LBRACE);
        const elements = [];
        if (this.peek().type !== TokenType.RBRACE) {
            elements.push(this.parseExpression());
            while (this.peek().type === TokenType.COMMA) {
                this.consume(TokenType.COMMA);
                elements.push(this.parseExpression());
            }
        }
        this.consume(TokenType.RBRACE);
        return { type: 'ArrayExpression', elements };
    }

    parseArrayAssignment() {
        const id = this.consume(TokenType.IDENTIFIER).value;
        this.consume(TokenType.LBRACKET);
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET);
        this.consume(TokenType.ASSIGN);
        const value = this.parseExpression();
        this.consume(TokenType.SEMICOLON);
        return { type: 'ArrayAssignment', id, index, value };
    }

    parseIfStatement() {
        this.consume(TokenType.IF);
        this.consume(TokenType.LPAREN);
        const test = this.parseExpression();
        this.consume(TokenType.RPAREN);
        const consequent = this.parseStatement();
        let alternate = null;
        if (this.peek().type === TokenType.ELSE) {
            this.consume(TokenType.ELSE);
            alternate = this.parseStatement();
        }
        return { type: 'IfStatement', test, consequent, alternate };
    }

    parseWhileStatement() {
        this.consume(TokenType.WHILE);
        this.consume(TokenType.LPAREN);
        const test = this.parseExpression();
        this.consume(TokenType.RPAREN);
        const body = this.parseStatement();
        return { type: 'WhileStatement', test, body };
    }

    parseForStatement() {
        this.consume(TokenType.FOR);
        this.consume(TokenType.LPAREN);

        let init = null;
        if (this.peek().type !== TokenType.SEMICOLON) {
            if (this.peek().type === TokenType.INT) {
                init = this.parseVariableDeclaration();
                // parseVariableDeclaration already consumes semicolon
            } else {
                init = this.parseAssignment();
                this.consume(TokenType.SEMICOLON);
            }
        } else {
            this.consume(TokenType.SEMICOLON);
        }

        let test = null;
        if (this.peek().type !== TokenType.SEMICOLON) {
            test = this.parseExpression();
        }
        this.consume(TokenType.SEMICOLON);

        let update = null;
        if (this.peek().type !== TokenType.RPAREN) {
            // Very simple update expression (i++ or i=i+1)
            // We'll treat it as an AssignmentStatement without semicolon for now
            const id = this.consume(TokenType.IDENTIFIER).value;
            if (this.peek().type === TokenType.ASSIGN) {
                this.consume(TokenType.ASSIGN);
                const expr = this.parseExpression();
                update = { type: 'AssignmentStatement', id, init: expr, noSemicolon: true };
            } else if (this.peek().type === TokenType.PLUS && this.tokens[this.pos + 1].type === TokenType.PLUS) {
                this.consume(TokenType.PLUS);
                this.consume(TokenType.PLUS);
                update = { type: 'AssignmentStatement', id, init: { type: 'BinaryExpression', operator: '+', left: { type: 'Identifier', name: id }, right: { type: 'Literal', value: 1 } }, noSemicolon: true };
            }
        }
        this.consume(TokenType.RPAREN);

        const body = this.parseStatement();
        return { type: 'ForStatement', init, test, update, body };
    }

    parseBlock() {
        this.consume(TokenType.LBRACE);
        const body = [];
        while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
            body.push(this.parseStatement());
        }
        this.consume(TokenType.RBRACE);
        return { type: 'BlockStatement', body };
    }

    parseReturn() {
        this.consume(TokenType.RETURN);
        let argument = null;

        if (this.peek().type !== TokenType.SEMICOLON) {
            argument = this.parseExpression();
        }

        this.consume(TokenType.SEMICOLON);
        return {
            type: 'ReturnStatement',
            argument
        };
    }

    parseExpression() {
        let left = this.parseTerm();

        while (
            this.peek().type === TokenType.PLUS ||
            this.peek().type === TokenType.MINUS ||
            this.peek().type === TokenType.LESS ||
            this.peek().type === TokenType.GREATER
        ) {
            const operator = this.consume(this.peek().type).value;
            const right = this.parseTerm();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }
        return left;
    }

    parseTerm() {
        let left = this.parseFactor();

        while (this.peek().type === TokenType.STAR || this.peek().type === TokenType.SLASH) {
            const operator = this.consume(this.peek().type).value;
            const right = this.parseFactor();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right
            };
        }
        return left;
    }

    parseFactor() {
        const token = this.peek();
        if (token.type === TokenType.NUMBER) {
            this.consume(TokenType.NUMBER);
            const val = token.value.includes('.') ? parseFloat(token.value) : parseInt(token.value);
            return { type: 'Literal', value: val };
        }
        if (token.type === TokenType.STRING) {
            this.consume(TokenType.STRING);
            return { type: 'Literal', value: `"${token.value}"` };
        }
        if (token.type === TokenType.SIZEOF) {
            this.consume(TokenType.SIZEOF);
            this.consume(TokenType.LPAREN);
            const expr = this.parseExpression();
            this.consume(TokenType.RPAREN);
            return { type: 'SizeofExpression', argument: expr };
        }
        if (token.type === TokenType.IDENTIFIER) {
            // Potential function call or array access within expression
            const next = this.tokens[this.pos + 1];
            if (next.type === TokenType.LPAREN) {
                return this.parseFunctionCall();
            }
            if (next.type === TokenType.LBRACKET) {
                this.consume(TokenType.IDENTIFIER);
                this.consume(TokenType.LBRACKET);
                const index = this.parseExpression();
                this.consume(TokenType.RBRACKET);
                return { type: 'MemberExpression', object: { type: 'Identifier', name: token.value }, property: index };
            }
            this.consume(TokenType.IDENTIFIER);
            return { type: 'Identifier', name: token.value };
        }
        if (token.type === TokenType.LPAREN) {
            this.consume(TokenType.LPAREN);
            const expr = this.parseExpression();
            this.consume(TokenType.RPAREN);
            return expr;
        }
        throw new Error(`Unexpected token in expression: ${token.type} at line ${token.line}`);
    }
}
