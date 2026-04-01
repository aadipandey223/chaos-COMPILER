#include "ast_from_json.h"
#include "cJSON.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static NodeType map_type_string(const char* str) {
    if (strcmp(str, "Program") == 0) return NODE_PROGRAM;
    if (strcmp(str, "FuncDecl") == 0) return NODE_FUNC_DECL;
    if (strcmp(str, "Block") == 0) return NODE_BLOCK;
    if (strcmp(str, "Return") == 0) return NODE_RETURN;
    if (strcmp(str, "If") == 0) return NODE_IF;
    if (strcmp(str, "While") == 0) return NODE_WHILE;
    if (strcmp(str, "VarDecl") == 0) return NODE_VAR_DECL;
    if (strcmp(str, "BinaryOp") == 0) return NODE_BINARY_OP;
    if (strcmp(str, "UnaryOp") == 0) return NODE_UNARY_OP;
    if (strcmp(str, "Assign") == 0) return NODE_ASSIGN;
    if (strcmp(str, "Number") == 0) return NODE_NUMBER;
    if (strcmp(str, "String") == 0) return NODE_STRING_LITERAL;
    if (strcmp(str, "Ident") == 0) return NODE_IDENT;
    if (strcmp(str, "Call") == 0) return NODE_CALL;
    return NODE_EXPR_STMT;
}

static Node* json_to_node(cJSON* obj) {
    if (!obj || !cJSON_IsObject(obj)) return NULL;

    cJSON* typeJ  = cJSON_GetObjectItem(obj, "type");
    cJSON* valJ   = cJSON_GetObjectItem(obj, "value");
    cJSON* lineJ  = cJSON_GetObjectItem(obj, "line");
    cJSON* colJ   = cJSON_GetObjectItem(obj, "col");
    cJSON* leftJ  = cJSON_GetObjectItem(obj, "left");
    cJSON* rightJ = cJSON_GetObjectItem(obj, "right");
    cJSON* condJ  = cJSON_GetObjectItem(obj, "cond");
    cJSON* chJ    = cJSON_GetObjectItem(obj, "children");

    const char* typeStr = (typeJ && cJSON_IsString(typeJ)) ? typeJ->valuestring : "ExprStmt";
    const char* valStr  = (valJ && cJSON_IsString(valJ)) ? valJ->valuestring : NULL;
    int line = (lineJ && cJSON_IsNumber(lineJ)) ? lineJ->valueint : 0;
    int col  = (colJ && cJSON_IsNumber(colJ))  ? colJ->valueint  : 0;

    Node* n = node_make(map_type_string(typeStr), valStr, line, col);

    n->left  = json_to_node(leftJ);
    n->right = json_to_node(rightJ);
    n->cond  = json_to_node(condJ);

    if (cJSON_IsArray(chJ)) {
        cJSON* child;
        cJSON_ArrayForEach(child, chJ) {
            Node* cn = json_to_node(child);
            if (cn) node_add_child(n, cn);
        }
    }

    return n;
}

Node* ast_from_json_file(const char* path) {
    FILE* f = fopen(path, "rb");
    if (!f) return NULL;
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    rewind(f);
    char* buf = malloc(sz + 1);
    fread(buf, 1, sz, f);
    buf[sz] = '\0';
    fclose(f);

    cJSON* root = cJSON_Parse(buf);
    free(buf);
    if (!root) return NULL;

    Node* ast = json_to_node(root);
    cJSON_Delete(root);
    return ast;
}