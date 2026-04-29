/**
 * Lexical Analyzer (Tokenizer) for C/C++
 * Parses a raw source code string using regex specifications.
 * Retains line numbers, explicitly filters out comments (or marks them), 
 * and identifies Keywords, Identifiers, Numbers, Strings, Operators, and Punctuation.
 */

const KEYWORDS = new Set([
  'int', 'float', 'double', 'char', 'void', 'long', 'short', 'signed', 'unsigned',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
  'return', 'struct', 'union', 'enum', 'typedef', 'sizeof', 'static', 'extern',
  'const', 'volatile', 'register', 'auto', 'goto'
]);

// Ordered list of token specifications.
// The regexes must be anchored to the start of the string using ^
const TOKEN_SPECS = [
  // 1. Whitespace (ignore)
  { regex: /^\s+/, type: null },
  
  // 2. Comments (matched and ignored to keep token stream clean for parsing)
  { regex: /^\/\/.*/, type: 'COMMENT' },
  { regex: /^\/\*[\s\S]*?\*\//, type: 'COMMENT' },
  
  // 3. Strings and Chars
  { regex: /^"(?:\\.|[^"\\])*"/, type: 'STRING' },
  { regex: /^'(?:\\.|[^'\\])*'/, type: 'CHAR' },
  
  // 4. Identifiers and Keywords (We'll check if the matched identifier is a keyword later)
  { regex: /^[a-zA-Z_]\w*/, type: 'IDENTIFIER' },
  
  // 5. Numbers (Integers and Floats, including scientific notation)
  { regex: /^\d+(\.\d+)?([eE][+-]?\d+)?/, type: 'NUMBER' },
  
  // 6. Operators (Longest match first to catch ++, --, ==, etc. before +, -, =)
  { regex: /^(==|!=|<=|>=|\+\+|--|&&|\|\||<<|>>|[+\-*/=<>!&|^~%])/, type: 'OPERATOR' },
  
  // 7. Punctuation / Symbols
  { regex: /^[(){}\[\];,.:?]/, type: 'PUNCTUATION' }
];

function tokenize(sourceCode) {
  let cursor = 0;
  let line = 1;
  const tokens = [];

  while (cursor < sourceCode.length) {
    const s = sourceCode.slice(cursor);
    let matched = false;

    for (const { regex, type } of TOKEN_SPECS) {
      const match = regex.exec(s);
      if (match) {
        const value = match[0];
        
        // Compute newline characters in the matched value to increment the line counter safely
        const newlines = value.match(/\n/g);
        
        // Push the token if it's not whitespace or a comment
        if (type !== null && type !== 'COMMENT') {
          let finalType = type;
          // Upgrade IDENTIFIER to KEYWORD if applicable
          if (finalType === 'IDENTIFIER' && KEYWORDS.has(value)) {
            finalType = 'KEYWORD';
          }
          
          tokens.push({
            type: finalType,
            value: value,
            line: line
          });
        }
        
        // Update state
        if (newlines) {
          line += newlines.length;
        }
        cursor += value.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // If we hit an unrecognized character, mark it as an ERROR token and move the cursor forward
      const badChar = sourceCode[cursor];
      tokens.push({
        type: 'ERROR',
        value: badChar,
        line: line
      });
      
      if (badChar === '\n') {
        line++;
      }
      cursor++;
    }
  }

  return tokens;
}

module.exports = {
  tokenize,
  KEYWORDS
};
