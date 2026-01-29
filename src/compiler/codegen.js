export class CodeGen {
    constructor(ast) {
        this.ast = ast;
        this.instructions = [];
        this.regCount = 0;
        this.tempCount = 0;
    }

    generate() {
        this.instructions.push('section .text');
        this.instructions.push('global _start');
        this.instructions.push('_start:');

        // Traverse body
        if (this.ast.type === 'Program') {
            this.ast.body.forEach(node => this.visit(node));
        }

        this.instructions.push('    ; Exit');
        this.instructions.push('    MOV R7, #1');
        this.instructions.push('    SWI 0');

        return this.instructions.join('\n');
    }

    visit(node) {
        if (!node) return;

        switch (node.type) {
            case 'FunctionDeclaration':
                // For main, we just process body
                node.body.forEach(stmt => this.visit(stmt));
                break;

            case 'VariableDeclaration':
                // int x = 5, y; -> MOV x, 5 ...
                node.declarations.forEach(decl => {
                    const prefix = node.isConst ? 'CONST ' : '';
                    if (decl.init) {
                        const val = this.visitExpression(decl.init);
                        this.instructions.push(`    ${prefix}MOV ${decl.id}, ${val} ; Type: ${node.kind}`);
                    }
                    // For uninitialized, we just ensure it exists in assembly context
                });
                break;

            case 'AssignmentStatement':
                // x = 10; -> MOV x, 10
                const val = this.visitExpression(node.init);
                this.instructions.push(`    MOV ${node.id}, ${val}`);
                break;

            case 'ReturnStatement':
                if (node.argument) {
                    const res = this.visitExpression(node.argument);
                    this.instructions.push(`    PRINT ${res}`);
                } else {
                    this.instructions.push(`    PRINT 0`);
                }
                break;

            case 'IfStatement':
                this.instructions.push('    ; If Statement');
                const cond = this.visitExpression(node.test);
                this.instructions.push(`    CMP ${cond}, #0`);
                this.instructions.push(`    JZ .L_else_${this.tempCount}`);
                this.visit(node.consequent);
                this.instructions.push(`    JMP .L_end_${this.tempCount}`);
                this.instructions.push(`.L_else_${this.tempCount}:`);
                if (node.alternate) this.visit(node.alternate);
                this.instructions.push(`.L_end_${this.tempCount}:`);
                break;

            case 'WhileStatement':
                const startLabel = `.L_start_${this.tempCount}`;
                this.instructions.push(`${startLabel}:`);
                const test = this.visitExpression(node.test);
                this.instructions.push(`    CMP ${test}, #0`);
                this.instructions.push(`    JZ .L_end_${this.tempCount}`);
                this.visit(node.body);
                this.instructions.push(`    JMP ${startLabel}`);
                this.instructions.push(`.L_end_${this.tempCount}:`);
                break;

            case 'BlockStatement':
                node.body.forEach(stmt => this.visit(stmt));
                break;

            case 'ArrayAssignment':
                const idx = this.visitExpression(node.index);
                const valArr = this.visitExpression(node.value);
                this.instructions.push(`    STORE ${node.id}, ${idx}, ${valArr}`);
                break;

            case 'ExpressionStatement':
                this.visitExpression(node.expression);
                break;
        }
    }

    visitExpression(node) {
        if (node.type === 'Literal') return node.value;
        if (node.type === 'Identifier') return node.name;

        if (node.type === 'CallExpression') {
            const args = node.arguments.map(arg => this.visitExpression(arg));
            this.instructions.push(`    CALL ${node.callee.name}, ${args.join(', ')}`);
            return 'RAX'; // Assume return in RAX for assembly
        }

        if (node.type === 'BinaryExpression') {
            const left = this.visitExpression(node.left);
            const right = this.visitExpression(node.right);
            const dest = `t${this.tempCount++}`;
            const opMap = { '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '<': 'CMP_LT', '>': 'CMP_GT' };

            this.instructions.push(`    MOV ${dest}, ${left}`);
            this.instructions.push(`    ${opMap[node.operator]} ${dest}, ${right}`);
            return dest;
        }

        if (node.type === 'MemberExpression') {
            const idx = this.visitExpression(node.property);
            const dest = `t${this.tempCount++}`;
            this.instructions.push(`    LOAD ${dest}, ${node.object.name}, ${idx}`);
            return dest;
        }

        if (node.type === 'SizeofExpression') {
            return '4';
        }
    }
}
