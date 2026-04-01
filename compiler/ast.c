#include "ast.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

Node* node_make(NodeType type, const char* value, int line, int col) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->type = type;
    if (value) {
        n->value = strdup(value);
    } else {
        n->value = NULL;
    }
    n->left = NULL;
    n->right = NULL;
    n->cond = NULL;
    n->children = NULL;
    n->child_count = 0;
    n->line = line;
    n->col = col;
    return n;
}

void node_add_child(Node* parent, Node* child) {
    if (!child) return;
    parent->child_count++;
    parent->children = (Node**)realloc(parent->children, parent->child_count * sizeof(Node*));
    parent->children[parent->child_count - 1] = child;
}

void node_free(Node* node) {
    if (!node) return;
    if (node->value) free(node->value);
    node_free(node->left);
    node_free(node->right);
    node_free(node->cond);
    for (int i = 0; i < node->child_count; i++) {
        node_free(node->children[i]);
    }
    if (node->children) free(node->children);
    free(node);
}

void node_print(Node* node, int depth) {
    if (!node) return;
    for (int i = 0; i < depth; i++) printf("  ");
    printf("Type: %d, Value: %s\n", node->type, node->value ? node->value : "null");
    if (node->left) {
        for (int i = 0; i < depth; i++) printf("  ");
        printf("Left:\n");
        node_print(node->left, depth + 1);
    }
    if (node->right) {
        for (int i = 0; i < depth; i++) printf("  ");
        printf("Right:\n");
        node_print(node->right, depth + 1);
    }
    if (node->cond) {
        for (int i = 0; i < depth; i++) printf("  ");
        printf("Cond:\n");
        node_print(node->cond, depth + 1);
    }
    for (int i = 0; i < node->child_count; i++) {
        node_print(node->children[i], depth + 1);
    }
}

static const char* node_type_to_string(NodeType type) {
    switch (type) {
        case NODE_PROGRAM: return "Program";
        case NODE_FUNC_DECL: return "FunctionDeclaration";
        case NODE_BLOCK: return "BlockStatement";
        case NODE_RETURN: return "ReturnStatement";
        case NODE_IF: return "IfStatement";
        case NODE_WHILE: return "WhileStatement";
        case NODE_FOR: return "ForStatement";
        case NODE_VAR_DECL: return "VariableDeclaration";
        case NODE_EXPR_STMT: return "ExpressionStatement";
        case NODE_BINARY_OP: return "BinaryExpression";
        case NODE_UNARY_OP: return "UnaryExpression";
        case NODE_ASSIGN: return "AssignmentExpression";
        case NODE_NUMBER: return "NumericLiteral";
        case NODE_STRING_LITERAL: return "StringLiteral";
        case NODE_IDENT: return "Identifier";
        case NODE_CALL: return "CallExpression";
        case NODE_POINTER_DECL: return "PointerDeclaration";
        case NODE_ADDRESS_OF: return "AddressOfExpression";
        case NODE_DEREF: return "DereferenceExpression";
        case NODE_ARRAY_DECL: return "ArrayDeclaration";
        case NODE_ARRAY_ACCESS: return "ArrayAccess";
        case NODE_STRUCT_DECL: return "StructDeclaration";
        case NODE_MEMBER_ACCESS: return "MemberAccess";
        case NODE_CAST_EXPR: return "CastExpression";
        default: return "Unknown";
    }
}

static void escape_string(const char* str) {
    if (!str) {
        printf("null");
        return;
    }
    printf("\"");
    while (*str) {
        if (*str == '"') printf("\\\"");
        else if (*str == '\\') printf("\\\\");
        else if (*str == '\n') printf("\\n");
        else if (*str == '\r') printf("\\r");
        else if (*str == '\t') printf("\\t");
        else printf("%c", *str);
        str++;
    }
    printf("\"");
}

static void print_json_recursive(Node* node) {
    if (!node) {
        printf("null");
        return;
    }
    printf("{\"type\":\"%s\"", node_type_to_string(node->type));
    if (node->value) {
        printf(",\"value\":");
        escape_string(node->value);
    }
    printf(",\"line\":%d,\"col\":%d", node->line, node->col);

    if (node->cond) {
        printf(",\"cond\":");
        print_json_recursive(node->cond);
    }
    if (node->left) {
        printf(",\"left\":");
        print_json_recursive(node->left);
    }
    if (node->right) {
        printf(",\"right\":");
        print_json_recursive(node->right);
    }
    
    if (node->children || node->child_count > 0 || node->type == NODE_PROGRAM || node->type == NODE_BLOCK || node->type == NODE_CALL) {
        printf(",\"children\":[");
        for (int i = 0; i < node->child_count; i++) {
            print_json_recursive(node->children[i]);
            if (i < node->child_count - 1) printf(",");
        }
        printf("]");
    }
    printf("}");
}

void ast_print_json(Node* node) {
    if (!node) {
        printf("null\n");
        return;
    }
    print_json_recursive(node);
    printf("\n");
}
