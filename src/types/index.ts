// ============================================================================
// TOKEN TYPES
// ============================================================================

export enum TokenType {
  // Keywords
  INT = 'INT',
  RETURN = 'RETURN',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  FOR = 'FOR',
  MAIN = 'MAIN',
  VOID = 'VOID',
  CONST = 'CONST',
  DOUBLE = 'DOUBLE',
  SIZEOF = 'SIZEOF',

  // Identifiers & Literals
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',

  // Operators
  ASSIGN = 'ASSIGN',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  PERCENT = 'PERCENT',
  LESS = 'LESS',
  GREATER = 'GREATER',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_EQUAL = 'GREATER_EQUAL',
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  AND = 'AND',
  OR = 'OR',
  XOR = 'XOR',
  NOT = 'NOT',
  AMPERSAND = 'AMPERSAND',
  PIPE = 'PIPE',
  CARET = 'CARET',
  TILDE = 'TILDE',
  PLUS_ASSIGN = 'PLUS_ASSIGN',
  MINUS_ASSIGN = 'MINUS_ASSIGN',
  PLUS_PLUS = 'PLUS_PLUS',
  MINUS_MINUS = 'MINUS_MINUS',

  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',
  QUESTION = 'QUESTION',
  COLON = 'COLON',

  // Special
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// ============================================================================
// AST TYPES
// ============================================================================

export type ASTNode =
  | Program
  | FunctionDeclaration
  | VariableDeclaration
  | AssignmentStatement
  | ReturnStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | BlockStatement
  | ExpressionStatement
  | BinaryExpression
  | UnaryExpression
  | CallExpression
  | ConditionalExpression
  | Identifier
  | Literal;

export interface Program {
  type: 'Program';
  body: ASTNode[];
  // Helper getter for function declarations
  functions?: FunctionDeclaration[];
}

export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: string;
  params: string[];
  returnType: string;
  body: ASTNode[];
}

export interface VariableDeclaration {
  type: 'VariableDeclaration';
  kind: string;
  declarations: Array<{
    id: string;
    init: ASTNode | null;
  }>;
}

export interface AssignmentStatement {
  type: 'AssignmentStatement';
  left: Identifier;
  operator: string;
  right: ASTNode;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  argument: ASTNode | null;
}

export interface IfStatement {
  type: 'IfStatement';
  test: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode | null;
}

export interface WhileStatement {
  type: 'WhileStatement';
  test: ASTNode;
  body: ASTNode;
}

export interface ForStatement {
  type: 'ForStatement';
  init: ASTNode | null;
  test: ASTNode | null;
  update: ASTNode | null;
  body: ASTNode;
}

export interface BlockStatement {
  type: 'BlockStatement';
  body: ASTNode[];
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: ASTNode;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: string;
  argument: ASTNode;
  prefix: boolean;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: string;
  arguments: ASTNode[];
}

export interface ConditionalExpression {
  type: 'ConditionalExpression';
  test: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface Literal {
  type: 'Literal';
  value: number | string | boolean;
  raw?: string;
}

// ============================================================================
// IR TYPES
// ============================================================================

export type IROperation =
  | 'ADD'
  | 'SUB'
  | 'MUL'
  | 'DIV'
  | 'MOD'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'NOT'
  | 'NEG'
  | 'LESS'
  | 'GREATER'
  | 'LESS_EQUAL'
  | 'GREATER_EQUAL'
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'ASSIGN'
  | 'LOAD'
  | 'STORE'
  | 'IF'
  | 'WHILE'
  | 'FOR'
  | 'GOTO'
  | 'LABEL'
  | 'RETURN'
  | 'CALL'
  | 'PRINT'
  | 'NOP'
  | 'SWITCH'
  | 'CASE';

export interface IRInstruction {
  op: IROperation;
  target?: string;
  left?: string | number;
  right?: string | number;
  value?: string | number | boolean;
  test?: IRInstruction | ASTNode;
  consequent?: IRInstruction[];
  alternate?: IRInstruction[];
  body?: IRInstruction[];
  cases?: Array<{ caseValue: number; body: IRInstruction[] }>;
  meta?: string;
}

export interface IRSnapshot {
  name: string;
  ir: IRInstruction[];
  passDescription?: string;
}

// ============================================================================
// CHAOS ENGINE TYPES
// ============================================================================

export interface ChaosConfig {
  passes: {
    numberEncoding: boolean;
    substitution: boolean;
    opaquePredicates: boolean;
    flattening: boolean;
  };
  customRules: CustomRule[];
  seed: number;
}

export interface CustomRule {
  id: number;
  source: string;
  target: string;
}

export interface RuleHits {
  [ruleId: number]: number;
}

export interface ChaosBudget {
  instructionsAdded: number;
  controlDepth: number;
  encodingOps: number;
}

export const CHAOS_LIMITS = {
  maxNewInstructions: 30,
  maxControlDepth: 3,
  maxEncodingOps: 10,
};

export interface ChaosResult {
  ir: IRInstruction[];
  snapshots: IRSnapshot[];
  ruleHits: RuleHits;
  budget: ChaosBudget;
  appliedPasses: string[];
}

// ============================================================================
// DIAGNOSTIC TYPES
// ============================================================================

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface Diagnostic {
  id: string;
  context: string;
  severity: DiagnosticSeverity;
  params?: Record<string, unknown>;
  explanation?: string;
  timestamp?: number;
}

export interface LingoValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  diagnosticCount: number;
  validCount: number;
  invalidCount: number;
}

// ============================================================================
// MCP TYPES
// ============================================================================

export interface MCPExplanationRequest {
  transformationType: string;
  params: Record<string, unknown>;
  glossary: string[];
}

export interface MCPExplanationResponse {
  explanation: string;
  validated: boolean;
  retries: number;
}

// ============================================================================
// COMPILER STATE TYPES
// ============================================================================

export type Mode = 'student' | 'researcher';

export interface ExecutionResult {
  original: number;
  transformed: number;
  match: boolean;
  stdout: string[];
}

export interface CompilerState {
  // Mode
  mode: Mode;
  setMode: (mode: Mode) => void;

  // Source Code
  code: string;
  setCode: (code: string) => void;

  // Compilation State
  isCompiling: boolean;
  isCompiled: boolean;
  compilationError: string | null;

  // AST & IR
  ast: Program | null;
  originalIR: IRInstruction[];
  chaoticIR: IRInstruction[];
  snapshots: IRSnapshot[];

  // Diagnostics
  diagnostics: Diagnostic[];
  lingoReport: LingoValidationReport;

  // Execution
  executionResult: ExecutionResult | null;

  // Chaos Configuration
  chaosConfig: ChaosConfig;
  setChaosConfig: (config: Partial<ChaosConfig>) => void;
  ruleHits: RuleHits;

  // Intensity
  intensity: 'none' | 'low' | 'medium' | 'high';
  setIntensity: (intensity: 'none' | 'low' | 'medium' | 'high') => void;

  // Actions
  compile: () => Promise<void>;
  reset: () => void;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface UIState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSnapshotIndex: number;
  setSelectedSnapshotIndex: (index: number) => void;
  showGuidedTour: boolean;
  setShowGuidedTour: (show: boolean) => void;
  guidedTourStep: number;
  setGuidedTourStep: (step: number) => void;

}
