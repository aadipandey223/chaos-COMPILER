import { ASTNode, Program } from '../types';

export class CodeGen {
    ast: ASTNode;
    instructions: string[];
    regCount: number;
    tempCount: number;
    machineCode: number[];

    constructor(ast: ASTNode) {
        this.ast = ast;
        this.instructions = [];
        this.regCount = 0;
        this.tempCount = 0;
        this.machineCode = [];
    }

    generate() {
        this.instructions.push('section .text');
        this.instructions.push('global _start');
        this.instructions.push('_start:');

        // Traverse body
        if (this.ast.type === 'Program') {
            (this.ast as Program).body.forEach(node => this.visit(node));
        }

        this.instructions.push('    ; Exit');
        this.instructions.push('    MOV R7, #1');
        this.instructions.push('    SWI 0');

        return this.instructions.join('\n');
    }

    generateMachineCode(): string {
        // Convert assembly instructions to simplified machine code representation
        const machineCodeLines: string[] = [];
        let address = 0x1000; // Start address

        machineCodeLines.push('; Machine Code Output');
        machineCodeLines.push('; Address    Opcode      Operands          Assembly');
        machineCodeLines.push('; --------------------------------------------------------');

        this.instructions.forEach((instr) => {
            const trimmed = instr.trim();
            
            // Skip section directives and labels
            if (trimmed.startsWith('section') || trimmed.startsWith('global') || 
                trimmed.endsWith(':') || trimmed.startsWith(';')) {
                return;
            }

            const opcode = this.assemblyToMachineCode(trimmed);
            const formatted = `0x${address.toString(16).padStart(8, '0').toUpperCase()}  ${opcode.hex.padEnd(12)} ${opcode.operands.padEnd(18)} ; ${trimmed}`;
            machineCodeLines.push(formatted);
            address += opcode.size;
        });

        return machineCodeLines.join('\n');
    }

    private assemblyToMachineCode(instruction: string): { hex: string, operands: string, size: number } {
        const parts = instruction.split(/[\s,]+/).filter(p => p.length > 0);
        if (parts.length === 0) return { hex: '00 00', operands: '', size: 2 };

        const op = parts[0].toUpperCase();

        // Simplified x86-64 inspired encoding
        switch (op) {
            case 'MOV': {
                if (parts.length >= 3) {
                    const dest = parts[1];
                    const src = parts[2];
                    // Check if source is immediate value
                    if (src.startsWith('#') || /^-?\d+$/.test(src)) {
                        const value = parseInt(src.replace('#', '')) & 0xFF;
                        return { 
                            hex: `B8 ${value.toString(16).padStart(2, '0').toUpperCase()}`, 
                            operands: `${dest}, ${src}`,
                            size: 2 
                        };
                    }
                    // Register to register
                    return { hex: '89 C0', operands: `${dest}, ${src}`, size: 2 };
                }
                return { hex: 'B8 00', operands: '', size: 2 };
            }
            case 'CONST':
                // Handle CONST MOV
                if (parts[1] === 'MOV') {
                    const value = parseInt(parts[3] || '0') & 0xFF;
                    return { 
                        hex: `C7 ${value.toString(16).padStart(2, '0').toUpperCase()}`,
                        operands: `${parts[2]}, ${parts[3] || '0'}`,
                        size: 2
                    };
                }
                return { hex: 'C7 00', operands: '', size: 2 };
            case 'ADD':
                return { hex: '01 C0', operands: parts.slice(1).join(', '), size: 2 };
            case 'SUB':
                return { hex: '29 C0', operands: parts.slice(1).join(', '), size: 2 };
            case 'MUL':
                return { hex: 'F7 E0', operands: parts.slice(1).join(', '), size: 2 };
            case 'DIV':
                return { hex: 'F7 F0', operands: parts.slice(1).join(', '), size: 2 };
            case 'CMP':
                return { hex: '39 C0', operands: parts.slice(1).join(', '), size: 2 };
            case 'CMP_LT':
                return { hex: '7C 00', operands: parts.slice(1).join(', '), size: 2 };
            case 'CMP_GT':
                return { hex: '7F 00', operands: parts.slice(1).join(', '), size: 2 };
            case 'JZ':
            case 'JMP':
                return { hex: '74 00', operands: parts.slice(1).join(', '), size: 2 };
            case 'CALL':
                return { hex: 'E8 00 00 00', operands: parts.slice(1).join(', '), size: 4 };
            case 'PRINT':
                return { hex: 'CD 80', operands: parts.slice(1).join(', '), size: 2 };
            case 'LOAD':
                return { hex: '8B 00', operands: parts.slice(1).join(', '), size: 2 };
            case 'STORE':
                return { hex: '89 00', operands: parts.slice(1).join(', '), size: 2 };
            case 'SWI':
                return { hex: 'CD 80', operands: parts.slice(1).join(', '), size: 2 };
            default:
                return { hex: '90 90', operands: parts.slice(1).join(', '), size: 2 }; // NOP
        }
    }

    visit(node: ASTNode | any) {
        if (!node) return;

        switch (node.type) {
            case 'FunctionDeclaration':
                // For main, we just process body
                node.body.forEach((stmt: ASTNode) => this.visit(stmt));
                break;

            case 'VariableDeclaration':
                // int x = 5, y; -> MOV x, 5 ...
                node.declarations.forEach((decl: any) => {
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
                if (node.init) {
                    const val = this.visitExpression(node.init);
                    this.instructions.push(`    MOV ${node.id}, ${val}`);
                }
                break;

            case 'ReturnStatement':
                if (node.argument) {
                    const res = this.visitExpression(node.argument);
                    this.instructions.push(`    PRINT ${res}`);
                } else {
                    this.instructions.push(`    PRINT 0`);
                }
                break;

            case 'IfStatement': {
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
            }

            case 'WhileStatement': {
                const startLabel = `.L_start_${this.tempCount}`;
                this.instructions.push(`${startLabel}:`);
                const test = this.visitExpression(node.test);
                this.instructions.push(`    CMP ${test}, #0`);
                this.instructions.push(`    JZ .L_end_${this.tempCount}`);
                this.visit(node.body);
                this.instructions.push(`    JMP ${startLabel}`);
                this.instructions.push(`.L_end_${this.tempCount}:`);
                break;
            }

            case 'BlockStatement':
                node.body.forEach((stmt: ASTNode) => this.visit(stmt));
                break;

            case 'ArrayAssignment': {
                const idx = this.visitExpression(node.index);
                const valArr = this.visitExpression(node.value);
                this.instructions.push(`    STORE ${node.id}, ${idx}, ${valArr}`);
                break;
            }

            case 'ExpressionStatement':
                this.visitExpression(node.expression);
                break;
        }
    }

    visitExpression(node: any): any {
        if (!node) return 0;
        if (node.type === 'Literal') return node.value;
        if (node.type === 'Identifier') return node.name;

        if (node.type === 'CallExpression') {
            const args = node.arguments.map((arg: any) => this.visitExpression(arg));
            this.instructions.push(`    CALL ${node.callee.name}, ${args.join(', ')}`);
            return 'RAX'; // Assume return in RAX for assembly
        }

        if (node.type === 'BinaryExpression') {
            const left = this.visitExpression(node.left);
            const right = this.visitExpression(node.right);
            const dest = `t${this.tempCount++}`;
            const opMap: Record<string, string> = { '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '<': 'CMP_LT', '>': 'CMP_GT' };

            this.instructions.push(`    MOV ${dest}, ${left}`);
            if (opMap[node.operator]) {
                this.instructions.push(`    ${opMap[node.operator]} ${dest}, ${right}`);
            }
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
