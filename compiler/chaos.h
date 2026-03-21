#ifndef CHAOS_H
#define CHAOS_H

#include "ast.h"

typedef struct {
    int          count;     /* how many mutations to attempt */
    unsigned int seed;      /* random seed                   */
    int          safe_mode; /* 1 = block risky mutations     */
} ChaosConfig;

typedef struct {
    char* type;        /* e.g. "OPERATOR_MUTATION"  */
    int   line;        /* source line of mutated node */
    char* before;      /* value / description before  */
    char* after;       /* value / description after   */
    char* description; /* plain English explanation   */
    int   score;       /* impact score 1-10           */
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
