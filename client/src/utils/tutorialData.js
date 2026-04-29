export const SOURCE = `int add(int a, int b) {
    if (a > 0) {
        return a + b;
    }
    return b;
}`;

export const TOKENS = [
  { type: 'KEYWORD', value: 'int',    line: 1, col: 1  },
  { type: 'IDENT',   value: 'add',    line: 1, col: 5  },
  { type: 'LPAREN',  value: '(',      line: 1, col: 8  },
  { type: 'KEYWORD', value: 'int',    line: 1, col: 9  },
  { type: 'IDENT',   value: 'a',      line: 1, col: 13 },
  { type: 'COMMA',   value: ',',      line: 1, col: 14 },
  { type: 'KEYWORD', value: 'int',    line: 1, col: 16 },
  { type: 'IDENT',   value: 'b',      line: 1, col: 20 },
  { type: 'RPAREN',  value: ')',      line: 1, col: 21 },
  { type: 'LBRACE',  value: '{',      line: 1, col: 23 },
  { type: 'KEYWORD', value: 'if',     line: 2, col: 5  },
  { type: 'LPAREN',  value: '(',      line: 2, col: 8  },
  { type: 'IDENT',   value: 'a',      line: 2, col: 9  },
  { type: 'GT',      value: '>',      line: 2, col: 11 },
  { type: 'NUMBER',  value: '0',      line: 2, col: 13 },
  { type: 'RPAREN',  value: ')',      line: 2, col: 14 },
  { type: 'LBRACE',  value: '{',      line: 2, col: 16 },
  { type: 'KEYWORD', value: 'return', line: 3, col: 9  },
  { type: 'IDENT',   value: 'a',      line: 3, col: 16 },
  { type: 'PLUS',    value: '+',      line: 3, col: 18 },
  { type: 'IDENT',   value: 'b',      line: 3, col: 20 },
  { type: 'SEMI',    value: ';',      line: 3, col: 21 },
  { type: 'RBRACE',  value: '}',      line: 4, col: 5  },
  { type: 'KEYWORD', value: 'return', line: 5, col: 5  },
  { type: 'IDENT',   value: 'b',      line: 5, col: 12 },
  { type: 'SEMI',    value: ';',      line: 5, col: 13 },
  { type: 'RBRACE',  value: '}',      line: 6, col: 1  },
  { type: 'EOF',     value: '',       line: 6, col: 2  },
];

export const DFA_STATES = [
  { id: 'START',  label: 'Start',  x: 80,  y: 120 },
  { id: 'IDENT',  label: 'Ident',  x: 240, y: 60  },
  { id: 'NUMBER', label: 'Number', x: 240, y: 180 },
  { id: 'OP',     label: 'Op',     x: 400, y: 120 },
  { id: 'ACCEPT', label: 'Accept', x: 540, y: 120 },
];

export const DFA_TRANSITIONS = [
  { from: 'START',  to: 'IDENT',  label: 'a-z A-Z _'  },
  { from: 'START',  to: 'NUMBER', label: '0-9'         },
  { from: 'START',  to: 'OP',     label: '+ - * / < >' },
  { from: 'IDENT',  to: 'IDENT',  label: 'a-z 0-9 _'  },
  { from: 'IDENT',  to: 'ACCEPT', label: 'other'       },
  { from: 'NUMBER', to: 'NUMBER', label: '0-9'         },
  { from: 'NUMBER', to: 'ACCEPT', label: 'other'       },
  { from: 'OP',     to: 'ACCEPT', label: 'any'         },
];

export const TOKEN_DFA_STATE = {
  KEYWORD: 'IDENT',
  IDENT:   'IDENT',
  NUMBER:  'NUMBER',
  GT:      'OP',
  PLUS:    'OP',
  LPAREN:  'OP',
  RPAREN:  'OP',
  LBRACE:  'OP',
  RBRACE:  'OP',
  COMMA:   'OP',
  SEMI:    'OP',
  EOF:     'ACCEPT',
};

export const PARSE_STEPS = [
  { fn: 'parse_program',    token: null,     rule: 'program → function*'                    },
  { fn: 'parse_function',   token: 'int',    rule: 'function → type name ( params ) block'  },
  { fn: 'parse_block',      token: '{',      rule: 'block → { statement* }'                 },
  { fn: 'parse_statement',  token: 'if',     rule: 'statement → if ( expr ) block'          },
  { fn: 'parse_expr',       token: 'a',      rule: 'expr → comparison'                      },
  { fn: 'parse_comparison', token: 'a',      rule: 'comparison → primary op primary'        },
  { fn: 'parse_primary',    token: 'a',      rule: 'primary → IDENT'                        },
  { fn: 'parse_primary',    token: '0',      rule: 'primary → NUMBER'                       },
  { fn: 'parse_statement',  token: 'return', rule: 'statement → return expr ;'              },
  { fn: 'parse_expr',       token: 'a',      rule: 'expr → addition'                        },
  { fn: 'parse_addition',   token: 'a',      rule: 'addition → primary + primary'           },
];

export const AST_BUILD_STEPS = [
  { id: 'program',  type: 'Program',  parent: null,      x: 340, y: 40,  value: null },
  { id: 'func',     type: 'FuncDecl', parent: 'program', x: 340, y: 120, value: 'add' },
  { id: 'param_a',  type: 'VarDecl',  parent: 'func',    x: 180, y: 200, value: 'a'   },
  { id: 'param_b',  type: 'VarDecl',  parent: 'func',    x: 280, y: 200, value: 'b'   },
  { id: 'block',    type: 'Block',    parent: 'func',    x: 420, y: 200, value: null  },
  { id: 'if',       type: 'If',       parent: 'block',   x: 340, y: 280, value: null  },
  { id: 'cond',     type: 'BinaryOp', parent: 'if',      x: 220, y: 360, value: '>'   },
  { id: 'ident_a',  type: 'Ident',    parent: 'cond',    x: 160, y: 440, value: 'a'   },
  { id: 'num_0',    type: 'Number',   parent: 'cond',    x: 280, y: 440, value: '0'   },
  { id: 'ret1',     type: 'Return',   parent: 'if',      x: 460, y: 360, value: null  },
  { id: 'plus',     type: 'BinaryOp', parent: 'ret1',    x: 460, y: 440, value: '+'   },
  { id: 'ret2',     type: 'Return',   parent: 'block',   x: 500, y: 280, value: null  },
];

export const SEMANTIC_STEPS = [
  { nodeId: 'program', result: 'ok', note: 'Root node — enter scope'              },
  { nodeId: 'func',    result: 'ok', note: 'FuncDecl "add" registered in scope'   },
  { nodeId: 'param_a', result: 'ok', note: 'VarDecl "a" type: int'                },
  { nodeId: 'param_b', result: 'ok', note: 'VarDecl "b" type: int'                },
  { nodeId: 'if',      result: 'ok', note: 'If statement — condition is boolean'  },
  { nodeId: 'cond',    result: 'ok', note: 'BinaryOp ">" — int > int → bool'      },
  { nodeId: 'ident_a', result: 'ok', note: 'Ident "a" — resolved to int param'    },
  { nodeId: 'num_0',   result: 'ok', note: 'Number "0" — type: int'               },
  { nodeId: 'ret1',    result: 'ok', note: 'Return type matches function: int'    },
  { nodeId: 'plus',    result: 'ok', note: 'BinaryOp "+" — int + int → int'       },
  { nodeId: 'ret2',    result: 'ok', note: 'Return type matches function: int'    },
];

export const SYMBOL_TABLE_STEPS = [
  { step: 2, entry: { name: 'add', type: 'function', scope: 'global' } },
  { step: 3, entry: { name: 'a',   type: 'int',      scope: 'add'    } },
  { step: 4, entry: { name: 'b',   type: 'int',      scope: 'add'    } },
];

export const CODEGEN_STEPS = [
  { nodeId: 'func',  output: 'int add(int a, int b) {' },
  { nodeId: 'if',    output: '    if (a > 0) {'         },
  { nodeId: 'ret1',  output: '        return a + b;'    },
  { nodeId: null,    output: '    }'                    },
  { nodeId: 'ret2',  output: '    return b;'            },
  { nodeId: null,    output: '}'                        },
];
