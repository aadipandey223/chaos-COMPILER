"""Phase 1 — Lexical Analyzer"""
import re

KEYWORDS = {'int', 'float', 'if', 'else', 'while', 'return', 'void', 'char', 'double'}

TOKEN_PATTERNS = [
    ('NUMBER',      r'\b\d+(\.\d+)?\b'),
    ('IDENTIFIER',  r'\b[a-zA-Z_]\w*\b'),
    ('OPERATOR',    r'==|!=|<=|>=|[+\-*/=<>!]'),
    ('PUNCTUATION', r'[(){}\[\];,]'),
]

def normalize(source: str) -> str:
    """Add spaces around operators so tokenisation is cleaner."""
    for op in ['==', '!=', '<=', '>=', '+=', '-=', '*=', '/=',
               '+', '-', '*', '/', '=', '<', '>', '!', ';', ',',
               '(', ')', '{', '}']:
        source = source.replace(op, f' {op} ')
    return re.sub(r'[ \t]+', ' ', source)


def tokenize(source: str) -> list[dict]:
    tokens = []
    for line_num, line in enumerate(source.splitlines(), start=1):
        line = normalize(line)
        pos = 0
        while pos < len(line):
            if line[pos].isspace():
                pos += 1
                continue
            matched = False
            for tok_type, pattern in TOKEN_PATTERNS:
                m = re.match(pattern, line[pos:])
                if m:
                    value = m.group(0)
                    actual_type = 'KEYWORD' if (tok_type == 'IDENTIFIER' and value in KEYWORDS) else tok_type
                    tokens.append({'type': actual_type, 'value': value, 'line': line_num})
                    pos += len(value)
                    matched = True
                    break
            if not matched:
                tokens.append({'type': 'ERROR', 'value': line[pos], 'line': line_num})
                pos += 1
    return tokens
