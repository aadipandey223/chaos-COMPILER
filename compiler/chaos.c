#include "chaos.h"
#include "ast.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static int       remaining;
static MutationLog* glog;
static int       cfg_safe_mode    = 0;
static char*     current_function = NULL;
static NodeType  grandparent_type = 0;

/* ── helpers ─────────────────────────────────────────────────────────── */

static int is_safe_mutation(const char* type) {
    if (strcmp(type, "STATEMENT_DELETION") == 0) return 0;
    if (strcmp(type, "NULL_INJECTION")     == 0) return 0;
    return 1;
}

static int compute_score(const char* type,
                         NodeType parent_type,
                         int has_parent,
                         int depth) {
    int score = 5;
    if (has_parent) {
        if (parent_type == NODE_RETURN)                     score += 3;
        if (parent_type == NODE_IF || parent_type == NODE_WHILE) score += 2;
    }
    if (strcmp(type, "OPERATOR_MUTATION")  == 0) score += 2;
    if (strcmp(type, "CONDITION_FLIP")     == 0) score += 2;
    if (strcmp(type, "BOOLEAN_INVERSION")  == 0) score += 2;
    if (strcmp(type, "DEAD_CODE_INJECT")   == 0) score -= 2;
    if (strcmp(type, "LITERAL_SHIFT")      == 0 &&
        has_parent &&
        parent_type != NODE_IF &&
        parent_type != NODE_WHILE)               score -= 1;
    if (depth <= 3) score += 1;
    if (depth >= 7) score -= 1;
    if (score < 1)  score = 1;
    if (score > 10) score = 10;
    return score;
}

static char* make_description(const char* type,
                               const char* before,
                               const char* after,
                               int line) {
    char buf[512];
    const char* fn = current_function ? current_function : "this scope";

    if (strcmp(type, "OPERATOR_MUTATION") == 0)
        snprintf(buf, sizeof(buf),
            "Changed operator '%s' to '%s' on line %d inside %s. "
            "Every expression using this operator will now compute "
            "the opposite result.",
            before, after, line, fn);
    else if (strcmp(type, "CONDITION_FLIP") == 0)
        snprintf(buf, sizeof(buf),
            "Inverted the condition on line %d inside %s. "
            "The branch that executed when '%s' was true "
            "will now execute when it is false.",
            line, fn, before);
    else if (strcmp(type, "LITERAL_SHIFT") == 0)
        snprintf(buf, sizeof(buf),
            "Shifted numeric literal from %s to %s on line %d "
            "inside %s. Any logic depending on the exact value %s "
            "will now receive %s — a classic off-by-one.",
            before, after, line, fn, before, after);
    else if (strcmp(type, "RETURN_SWAP") == 0)
        snprintf(buf, sizeof(buf),
            "Flipped return value from %s to %s on line %d inside "
            "%s. This function now signals the opposite "
            "success/failure status to its callers.",
            before, after, line, fn);
    else if (strcmp(type, "DEAD_CODE_INJECT") == 0)
        snprintf(buf, sizeof(buf),
            "Inserted unreachable if(0){} block on line %d inside "
            "%s. This never executes but changes the AST structure "
            "and may confuse static analysis tools.",
            line, fn);
    else if (strcmp(type, "OFF_BY_ONE") == 0)
        snprintf(buf, sizeof(buf),
            "Shifted loop or condition bound from %s to %s on line "
            "%d inside %s. This loop or branch will now trigger one "
            "iteration sooner or later — a fence-post error.",
            before, after, line, fn);
    else if (strcmp(type, "BOOLEAN_INVERSION") == 0)
        snprintf(buf, sizeof(buf),
            "Changed logical operator '%s' to '%s' on line %d "
            "inside %s. Conditions that required ALL parts to be "
            "true now only require ANY part (or vice versa).",
            before, after, line, fn);
    else if (strcmp(type, "STATEMENT_DELETION") == 0)
        snprintf(buf, sizeof(buf),
            "Deleted a %s statement on line %d inside %s. "
            "If this statement had side effects or set a variable "
            "used later, behaviour will change silently.",
            before, line, fn);
    else
        snprintf(buf, sizeof(buf),
            "Applied %s on line %d inside %s.",
            type, line, fn);

    return strdup(buf);
}

static void log_mutation(const char* type, int line,
                         const char* before, const char* after) {
    if (glog->count >= glog->capacity) {
        glog->capacity = glog->capacity == 0 ? 8 : glog->capacity * 2;
        glog->records  = (MutationRecord*)realloc(
            glog->records, glog->capacity * sizeof(MutationRecord));
    }
    MutationRecord* r = &glog->records[glog->count++];
    r->type        = strdup(type);
    r->line        = line;
    r->before      = strdup(before ? before : "");
    r->after       = strdup(after  ? after  : "");
    r->description = make_description(type, before ? before : "", after ? after : "", line);
    r->score       = 5; /* placeholder — updated by caller */
}

static int random_chance(double probability) {
    return (rand() % 100) < (int)(probability * 100);
}

static const char* op_swap(const char* op) {
    if (!op) return NULL;
    if (strcmp(op, "+")  == 0) return "-";
    if (strcmp(op, "-")  == 0) return "+";
    if (strcmp(op, "*")  == 0) return "/";
    if (strcmp(op, "/")  == 0) return "*";
    if (strcmp(op, "==") == 0) return "!=";
    if (strcmp(op, "!=") == 0) return "==";
    if (strcmp(op, "<")  == 0) return ">";
    if (strcmp(op, ">")  == 0) return "<";
    if (strcmp(op, "<=") == 0) return ">=";
    if (strcmp(op, ">=") == 0) return "<=";
    return NULL;
}

/* ── walker ──────────────────────────────────────────────────────────── */

static void walk(Node* n, Node* parent, int depth) {
    if (!n) return;

    /* ── track which function we are inside ──────────────────────── */
    if (n->type == NODE_FUNC_DECL) {
        char* prev_fn    = current_function;
        current_function = n->value;
        for (int i = 0; i < n->child_count; i++)
            walk(n->children[i], n, depth + 1);
        walk(n->left,  n, depth + 1);
        walk(n->right, n, depth + 1);
        current_function = prev_fn;
        return;
    }

    /* ── attempt one mutation on this node ────────────────────────── */
    if (remaining > 0 && random_chance(0.3)) {

        if (n->type == NODE_BINARY_OP && n->value) {
            const char* new_op = op_swap(n->value);
            if (new_op) {
                char before[32];
                strncpy(before, n->value, sizeof(before) - 1);
                before[sizeof(before) - 1] = '\0';
                free(n->value);
                n->value = strdup(new_op);
                log_mutation("OPERATOR_MUTATION", n->line, before, new_op);
                glog->records[glog->count-1].score =
                    compute_score("OPERATOR_MUTATION",
                                  parent ? parent->type : 0,
                                  parent != NULL, depth);
                remaining--;
                return;
            }

        } else if ((n->type == NODE_IF || n->type == NODE_WHILE) && n->cond) {
            Node* neg  = node_make(NODE_UNARY_OP, "!", n->line, n->col);
            neg->left  = n->cond;
            n->cond    = neg;
            log_mutation("CONDITION_FLIP", n->line, "<condition>", "!<condition>");
            glog->records[glog->count-1].score =
                compute_score("CONDITION_FLIP",
                              parent ? parent->type : 0,
                              parent != NULL, depth);
            remaining--;

        } else if (n->type == NODE_NUMBER && n->value) {
            int  v  = atoi(n->value);
            char before[32], after[32];
            strncpy(before, n->value, sizeof(before) - 1);
            before[sizeof(before) - 1] = '\0';

            /* OFF_BY_ONE: NUMBER inside a comparison that is the cond of IF/WHILE.
               Detect by checking grandparent_type is IF or WHILE AND
               parent is a comparison BinaryOp. */
            int is_cond_ctx = parent && parent->type == NODE_BINARY_OP &&
                              (grandparent_type == NODE_IF   ||
                               grandparent_type == NODE_WHILE ||
                               grandparent_type == NODE_BINARY_OP); /* nested && / || */
            if (is_cond_ctx) {
                int nv = (rand() % 2 == 0) ? v + 1 : v - 1;
                snprintf(after, sizeof(after), "%d", nv);
                free(n->value);
                n->value = strdup(after);
                log_mutation("OFF_BY_ONE", n->line, before, after);
                glog->records[glog->count-1].score =
                    compute_score("OFF_BY_ONE",
                                  parent ? parent->type : 0,
                                  parent != NULL, depth);
            } else {
                int nv = v + 1;
                snprintf(after, sizeof(after), "%d", nv);
                free(n->value);
                n->value = strdup(after);
                log_mutation("LITERAL_SHIFT", n->line, before, after);
                glog->records[glog->count-1].score =
                    compute_score("LITERAL_SHIFT",
                                  parent ? parent->type : 0,
                                  parent != NULL, depth);
            }
            remaining--;
            return;

        } else if (n->type == NODE_RETURN
                   && n->left
                   && n->left->type == NODE_NUMBER
                   && n->left->value) {
            int  v   = atoi(n->left->value);
            int  nv  = (v == 0) ? 1 : 0;
            char after[32];
            snprintf(after, sizeof(after), "%d", nv);
            log_mutation("RETURN_SWAP", n->line, n->left->value, after);
            glog->records[glog->count-1].score =
                compute_score("RETURN_SWAP",
                              parent ? parent->type : 0,
                              parent != NULL, depth);
            free(n->left->value);
            n->left->value = strdup(after);
            remaining--;
            return;
        }
    }

    /* ── BOOLEAN_INVERSION ───────────────────────────────────────── */
    if (remaining > 0 &&
        n->type == NODE_BINARY_OP && n->value &&
        (strcmp(n->value, "&&") == 0 || strcmp(n->value, "||") == 0) &&
        random_chance(0.3)) {

        if (!cfg_safe_mode || is_safe_mutation("BOOLEAN_INVERSION")) {
            const char* new_op = (strcmp(n->value, "&&") == 0) ? "||" : "&&";
            char old_op[4];
            strncpy(old_op, n->value, sizeof(old_op) - 1);
            old_op[sizeof(old_op) - 1] = '\0';
            log_mutation("BOOLEAN_INVERSION", n->line, old_op, new_op);
            glog->records[glog->count-1].score =
                compute_score("BOOLEAN_INVERSION",
                              parent ? parent->type : 0,
                              parent != NULL, depth);
            free(n->value);
            n->value = strdup(new_op);
            remaining--;
            return;
        }
    }

    /* ── STATEMENT_DELETION (safe_mode blocks this) ──────────────── */
    if (remaining > 0 &&
        !cfg_safe_mode &&
        n->type == NODE_BLOCK &&
        n->child_count > 1 &&
        random_chance(0.25)) {

        int idx = rand() % n->child_count;
        Node* deleted = n->children[idx];
        const char* type_names[] = {
            "PROGRAM","FUNC_DECL","BLOCK","RETURN","IF","WHILE",
            "VAR_DECL","EXPR_STMT","BINARY_OP","UNARY_OP","ASSIGN",
            "NUMBER","STRING","IDENT","CALL"
        };
        const char* tname = (deleted->type < 15) ? type_names[deleted->type] : "STMT";
        log_mutation("STATEMENT_DELETION", deleted->line, tname, "(removed)");
        glog->records[glog->count-1].score =
            compute_score("STATEMENT_DELETION",
                          parent ? parent->type : 0,
                          parent != NULL, depth);
        node_free(deleted);
        for (int i = idx; i < n->child_count - 1; i++)
            n->children[i] = n->children[i + 1];
        n->child_count--;
        remaining--;
    }

    /* ── recurse named children ──────────────────────────────────── */
    NodeType saved_gp = grandparent_type;
    grandparent_type  = n->type;

    walk(n->cond,  n, depth + 1);
    walk(n->left,  n, depth + 1);
    walk(n->right, n, depth + 1);

    for (int i = 0; i < n->child_count; i++)
        walk(n->children[i], n, depth + 1);

    grandparent_type = saved_gp;

    /* ── dead-code injection: after all children are walked ──────── */
    if (n->type == NODE_BLOCK
        && remaining > 0
        && n->child_count > 0
        && random_chance(0.25)) {

        Node* zero = node_make(NODE_NUMBER, "0", n->line, n->col);
        Node* body = node_make(NODE_BLOCK,  NULL, n->line, n->col);
        Node* dead = node_make(NODE_IF,     NULL, n->line, n->col);
        dead->cond = zero;
        dead->left = body;

        int pos = rand() % (n->child_count + 1);
        n->child_count++;
        n->children = (Node**)realloc(n->children,
                                      n->child_count * sizeof(Node*));
        for (int i = n->child_count - 1; i > pos; i--)
            n->children[i] = n->children[i - 1];
        n->children[pos] = dead;

        log_mutation("DEAD_CODE_INJECT", n->line, "", "if(0){}");
        glog->records[glog->count-1].score =
            compute_score("DEAD_CODE_INJECT",
                          parent ? parent->type : 0,
                          parent != NULL, depth);
        remaining--;
    }
}

/* ── public API ──────────────────────────────────────────────────────── */

MutationLog chaos_run(Node* ast, ChaosConfig cfg) {
    srand(cfg.seed);
    remaining     = cfg.count;
    cfg_safe_mode = cfg.safe_mode;

    MutationLog log;
    log.records  = NULL;
    log.count    = 0;
    log.capacity = 0;
    glog = &log;

    walk(ast, NULL, 0);
    return log;
}

void chaos_log_free(MutationLog* log) {
    for (int i = 0; i < log->count; i++) {
        free(log->records[i].type);
        free(log->records[i].before);
        free(log->records[i].after);
        free(log->records[i].description);
    }
    free(log->records);
    log->count    = 0;
    log->capacity = 0;
    log->records  = NULL;
}

static void escape_json_str(const char* s) {
    if (!s) { printf("\"\""); return; }
    printf("\"");
    while (*s) {
        if      (*s == '"')  printf("\\\"");
        else if (*s == '\\') printf("\\\\");
        else if (*s == '\n') printf("\\n");
        else if (*s == '\r') printf("\\r");
        else if (*s == '\t') printf("\\t");
        else                 printf("%c", *s);
        s++;
    }
    printf("\"");
}

void chaos_log_print_json(MutationLog* log) {
    printf("[");
    for (int i = 0; i < log->count; i++) {
        if (i > 0) printf(",");
        printf("{\"type\":");
        escape_json_str(log->records[i].type);
        printf(",\"line\":%d,\"before\":", log->records[i].line);
        escape_json_str(log->records[i].before);
        printf(",\"after\":");
        escape_json_str(log->records[i].after);
        printf(",\"description\":");
        escape_json_str(log->records[i].description);
        printf(",\"score\":%d}", log->records[i].score);
    }
    printf("]");
}
