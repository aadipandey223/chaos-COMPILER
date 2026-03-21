#ifndef AST_H
#define AST_H

typedef enum {
    NODE_PROGRAM, NODE_FUNC_DECL, NODE_BLOCK,
    NODE_RETURN, NODE_IF, NODE_WHILE,
    NODE_VAR_DECL, NODE_EXPR_STMT,
    NODE_BINARY_OP, NODE_UNARY_OP, NODE_ASSIGN,
    NODE_NUMBER, NODE_STRING, NODE_IDENT, NODE_CALL
} NodeType;

typedef struct Node {
    NodeType type;
    char* value;
    struct Node* left;
    struct Node* right;
    struct Node* cond;
    struct Node** children;
    int child_count;
    int line;
    int col;
} Node;

Node* node_make(NodeType type, const char* value, int line, int col);
void node_add_child(Node* parent, Node* child);
void node_free(Node* node);
void node_print(Node* node, int depth);
void ast_print_json(Node* node);

#endif
