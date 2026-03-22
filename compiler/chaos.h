#ifndef CHAOS_H
#define CHAOS_H

#include "ast.h"

#define MUTATE_OPERATOR    (1 << 0)
#define MUTATE_CONDITION   (1 << 1)
#define MUTATE_LITERAL     (1 << 2)
#define MUTATE_RETURN      (1 << 3)
#define MUTATE_DEADCODE    (1 << 4)
#define MUTATE_OFFBYONE    (1 << 5)
#define MUTATE_BOOLEAN     (1 << 6)
#define MUTATE_DELETION    (1 << 7)
#define MUTATE_NULL        (1 << 8)
#define MUTATE_VARSWAP     (1 << 9)
#define MUTATE_LOOPBOUND   (1 << 10)
#define MUTATE_ALL         0x7FF

typedef struct {
    int          count;     /* how many mutations to attempt */
    unsigned int seed;      /* random seed                   */
    int          safe_mode; /* 1 = block risky mutations     */
    int          chain_depth;     /* 1 = single pass (default), 2-5 = chain */
    int          target_mask;     /* 0 = all types, else bitmask of allowed */
    char         excluded_fns[512];  /* comma-separated function names to skip */
    char         excluded_lines[256];/* comma-separated ranges e.g. "1-5,10-12" */
} ChaosConfig;

typedef struct {
    char* type;        /* e.g. "OPERATOR_MUTATION"  */
    int   line;        /* source line of mutated node */
    char* before;      /* value / description before  */
    char* after;       /* value / description after   */
    char* description; /* plain English explanation   */
    int   score;       /* impact score 1-10           */
    int   pass;        /* which chain pass produced this mutation, 1-indexed */
} MutationRecord;

typedef struct {
    MutationRecord* records;
    int             count;
    int             capacity;
} MutationLog;

MutationLog chaos_run(Node* ast, ChaosConfig cfg);
void        chaos_log_free(MutationLog* log);
void        chaos_log_print_json(MutationLog* log);

#endif
