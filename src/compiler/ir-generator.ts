import {
  ASTNode,
  Program,
  FunctionDeclaration,
  VariableDeclaration,
  ReturnStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  BlockStatement,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  ConditionalExpression,
  Identifier,
  Literal,
  IRInstruction,
  IROperation,
} from '../types';

// ============================================================================
// IR GENERATOR - Converts AST to Three-Address Code (TAC)
// ============================================================================

export class IRGenerator {
  private tempCounter: number = 0;
  private functions: Map<string, FunctionDeclaration> = new Map();

  private genTemp(): string {
    return `t${this.tempCounter++}`;
  }

  public reset(): void {
    this.tempCounter = 0;
    this.functions.clear();
  }

  public generate(ast: Program): IRInstruction[] {
    this.reset();
    const ir: IRInstruction[] = [];

    // First pass: collect function declarations
    for (const node of ast.body) {
      if (node.type === 'FunctionDeclaration') {
        const fn = node as FunctionDeclaration;
        if (fn.name !== 'main') {
          this.functions.set(fn.name, fn);
        }
      }
    }

    // Second pass: generate IR for main function
    for (const node of ast.body) {
      this.generateNode(node, ir);
    }

    return ir;
  }

  private generateNode(node: ASTNode, ir: IRInstruction[]): string | number | undefined {
    switch (node.type) {
      case 'Program':
        for (const stmt of (node as Program).body) {
          this.generateNode(stmt, ir);
        }
        return undefined;

      case 'FunctionDeclaration':
        return this.generateFunction(node as FunctionDeclaration, ir);

      case 'VariableDeclaration':
        return this.generateVariableDeclaration(node as VariableDeclaration, ir);

      case 'ReturnStatement':
        return this.generateReturn(node as ReturnStatement, ir);

      case 'IfStatement':
        return this.generateIf(node as IfStatement, ir);

      case 'WhileStatement':
        return this.generateWhile(node as WhileStatement, ir);

      case 'ForStatement':
        return this.generateFor(node as ForStatement, ir);

      case 'BlockStatement':
        for (const stmt of (node as BlockStatement).body) {
          this.generateNode(stmt, ir);
        }
        return undefined;

      case 'ExpressionStatement':
        return this.generateNode((node as { expression: ASTNode }).expression, ir);

      case 'AssignmentStatement':
        return this.generateAssignment(node as { left: Identifier; operator: string; right: ASTNode }, ir);

      case 'BinaryExpression':
        return this.generateBinary(node as BinaryExpression, ir);

      case 'UnaryExpression':
        return this.generateUnary(node as UnaryExpression, ir);

      case 'CallExpression':
        return this.generateCall(node as CallExpression, ir);

      case 'ConditionalExpression':
        return this.generateConditional(node as ConditionalExpression, ir);

      case 'Identifier':
        return (node as Identifier).name;

      case 'Literal':
        return (node as Literal).value as number;

      default:
        return undefined;
    }
  }

  private generateFunction(fn: FunctionDeclaration, ir: IRInstruction[]): undefined {
    // Only generate IR for main function body
    if (fn.name === 'main') {
      for (const stmt of fn.body) {
        this.generateNode(stmt, ir);
      }
    }
    return undefined;
  }

  private generateVariableDeclaration(decl: VariableDeclaration, ir: IRInstruction[]): undefined {
    for (const { id, init } of decl.declarations) {
      if (init) {
        const value = this.generateNode(init, ir);
        ir.push({
          op: 'ASSIGN',
          target: id,
          value,
          meta: 'USER_CODE',
        });
      } else {
        // Initialize to 0 if no initializer
        ir.push({
          op: 'ASSIGN',
          target: id,
          value: 0,
          meta: 'USER_CODE',
        });
      }
    }
    return undefined;
  }

  private generateReturn(ret: ReturnStatement, ir: IRInstruction[]): undefined {
    if (ret.argument) {
      const value = this.generateNode(ret.argument, ir);
      // Emit PRINT instruction to show output
      ir.push({
        op: 'PRINT',
        value,
        meta: 'USER_CODE',
      });
      ir.push({
        op: 'RETURN',
        value,
        meta: 'USER_CODE',
      });
    } else {
      // Print 0 for void returns
      ir.push({
        op: 'PRINT',
        value: 0,
        meta: 'USER_CODE',
      });
      ir.push({
        op: 'RETURN',
        value: 0,
        meta: 'USER_CODE',
      });
    }
    return undefined;
  }

  private generateIf(stmt: IfStatement, ir: IRInstruction[]): undefined {
    const testValue = this.generateNode(stmt.test, ir);

    const consequentIR: IRInstruction[] = [];
    this.generateNode(stmt.consequent, consequentIR);

    let alternateIR: IRInstruction[] | undefined;
    if (stmt.alternate) {
      alternateIR = [];
      this.generateNode(stmt.alternate, alternateIR);
    }

    ir.push({
      op: 'IF',
      test: { op: 'LOAD', value: testValue },
      consequent: consequentIR,
      alternate: alternateIR,
      meta: 'USER_CODE',
    });

    return undefined;
  }

  private generateWhile(stmt: WhileStatement, ir: IRInstruction[]): undefined {
    // Generate body IR
    const bodyIR: IRInstruction[] = [];
    this.generateNode(stmt.body, bodyIR);

    // Generate test expression
    const testIR: IRInstruction[] = [];
    const testResult = this.generateNode(stmt.test, testIR);

    ir.push({
      op: 'WHILE',
      test: { op: 'LOAD', value: testResult },
      body: bodyIR,
      // Store testIR separately so it can be evaluated before each iteration
      consequent: testIR, // Repurpose consequent for test instructions
      meta: 'USER_CODE',
    });

    return undefined;
  }

  private generateFor(stmt: ForStatement, ir: IRInstruction[]): undefined {
    // Generate init
    if (stmt.init) {
      this.generateNode(stmt.init, ir);
    }

    // Generate body
    const bodyIR: IRInstruction[] = [];
    this.generateNode(stmt.body, bodyIR);

    // Generate update
    const updateIR: IRInstruction[] = [];
    if (stmt.update) {
      this.generateNode(stmt.update, updateIR);
    }

    // Generate test
    let testResult: string | number | undefined = 1; // Default to true
    const testIR: IRInstruction[] = [];
    if (stmt.test) {
      testResult = this.generateNode(stmt.test, testIR);
    }

    ir.push({
      op: 'WHILE',
      test: { op: 'LOAD', value: testResult },
      consequent: testIR, // Test instructions
      body: [...bodyIR, ...updateIR], // Body + update
      meta: 'USER_CODE',
    });

    return undefined;
  }

  private generateAssignment(
    node: { left: Identifier; operator: string; right: ASTNode },
    ir: IRInstruction[]
  ): string {
    const { left, operator, right } = node;
    const rightValue = this.generateNode(right, ir);

    if (operator === '=') {
      ir.push({
        op: 'ASSIGN',
        target: left.name,
        value: rightValue,
        meta: 'USER_CODE',
      });
    } else if (operator === '+=') {
      const temp = this.genTemp();
      ir.push({
        op: 'ADD',
        target: temp,
        left: left.name,
        right: rightValue,
        meta: 'USER_CODE',
      });
      ir.push({
        op: 'ASSIGN',
        target: left.name,
        value: temp,
        meta: 'USER_CODE',
      });
    } else if (operator === '-=') {
      const temp = this.genTemp();
      ir.push({
        op: 'SUB',
        target: temp,
        left: left.name,
        right: rightValue,
        meta: 'USER_CODE',
      });
      ir.push({
        op: 'ASSIGN',
        target: left.name,
        value: temp,
        meta: 'USER_CODE',
      });
    }

    return left.name;
  }

  private generateBinary(expr: BinaryExpression, ir: IRInstruction[]): string {
    const left = this.generateNode(expr.left, ir);
    const right = this.generateNode(expr.right, ir);
    const target = this.genTemp();

    const opMap: Record<string, IROperation> = {
      '+': 'ADD',
      '-': 'SUB',
      '*': 'MUL',
      '/': 'DIV',
      '%': 'MOD',
      '&': 'AND',
      '|': 'OR',
      '^': 'XOR',
      '<': 'LESS',
      '>': 'GREATER',
      '<=': 'LESS_EQUAL',
      '>=': 'GREATER_EQUAL',
      '==': 'EQUAL',
      '!=': 'NOT_EQUAL',
      '&&': 'AND',
      '||': 'OR',
    };

    const op = opMap[expr.operator] || 'ADD';

    ir.push({
      op,
      target,
      left,
      right,
      meta: 'USER_CODE',
    });

    return target;
  }

  private generateUnary(expr: UnaryExpression, ir: IRInstruction[]): string {
    const arg = this.generateNode(expr.argument, ir);
    const target = this.genTemp();

    if (expr.operator === '-') {
      ir.push({
        op: 'NEG',
        target,
        value: arg,
        meta: 'USER_CODE',
      });
    } else if (expr.operator === '!') {
      ir.push({
        op: 'NOT',
        target,
        value: arg,
        meta: 'USER_CODE',
      });
    } else if (expr.operator === '~') {
      // Bitwise NOT
      ir.push({
        op: 'XOR',
        target,
        left: arg,
        right: -1,
        meta: 'USER_CODE',
      });
    } else if (expr.operator === '++') {
      if (typeof arg === 'string') {
        if (expr.prefix) {
          // ++x: increment first, return new value
          ir.push({ op: 'ADD', target, left: arg, right: 1, meta: 'USER_CODE' });
          ir.push({ op: 'ASSIGN', target: arg, value: target, meta: 'USER_CODE' });
        } else {
          // x++: save current, increment, return old
          ir.push({ op: 'ASSIGN', target, value: arg, meta: 'USER_CODE' });
          const temp2 = this.genTemp();
          ir.push({ op: 'ADD', target: temp2, left: arg, right: 1, meta: 'USER_CODE' });
          ir.push({ op: 'ASSIGN', target: arg, value: temp2, meta: 'USER_CODE' });
        }
      }
    } else if (expr.operator === '--') {
      if (typeof arg === 'string') {
        if (expr.prefix) {
          ir.push({ op: 'SUB', target, left: arg, right: 1, meta: 'USER_CODE' });
          ir.push({ op: 'ASSIGN', target: arg, value: target, meta: 'USER_CODE' });
        } else {
          ir.push({ op: 'ASSIGN', target, value: arg, meta: 'USER_CODE' });
          const temp2 = this.genTemp();
          ir.push({ op: 'SUB', target: temp2, left: arg, right: 1, meta: 'USER_CODE' });
          ir.push({ op: 'ASSIGN', target: arg, value: temp2, meta: 'USER_CODE' });
        }
      }
    }

    return target;
  }

  private generateCall(expr: CallExpression, ir: IRInstruction[]): string {
    const args = expr.arguments.map((arg) => this.generateNode(arg, ir));
    const target = this.genTemp();

    ir.push({
      op: 'CALL',
      target,
      value: expr.callee,
      args: args as (string | number)[],
      meta: 'USER_CODE',
    });

    return target;
  }

  private generateConditional(expr: ConditionalExpression, ir: IRInstruction[]): string {
    const test = this.generateNode(expr.test, ir);
    const target = this.genTemp();

    const consequentIR: IRInstruction[] = [];
    const consequentValue = this.generateNode(expr.consequent, consequentIR);
    consequentIR.push({ op: 'ASSIGN', target, value: consequentValue, meta: 'USER_CODE' });

    const alternateIR: IRInstruction[] = [];
    const alternateValue = this.generateNode(expr.alternate, alternateIR);
    alternateIR.push({ op: 'ASSIGN', target, value: alternateValue, meta: 'USER_CODE' });

    ir.push({
      op: 'IF',
      test: { op: 'LOAD', value: test },
      consequent: consequentIR,
      alternate: alternateIR,
      meta: 'USER_CODE',
    });

    return target;
  }
}

// Convenience function
export function generateIR(ast: Program): IRInstruction[] {
  return new IRGenerator().generate(ast);
}
