#include "lexer.h"
#include "parser.h"
#include "ast.h"
#include "chaos.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

char* read_file(const char* path) {
    FILE* file = fopen(path, "rb");
    if (!file) {
        fprintf(stderr, "Could not open file \"%s\".\n", path);
        exit(1);
    }
    fseek(file, 0L, SEEK_END);
    size_t file_size = ftell(file);
    rewind(file);

    char* buffer = (char*)malloc(file_size + 1);
    if (!buffer) {
        fprintf(stderr, "Not enough memory to read \"%s\".\n", path);
        exit(1);
    }
    size_t bytes_read = fread(buffer, sizeof(char), file_size, file);
    if (bytes_read < file_size) {
        fprintf(stderr, "Could not read file \"%s\".\n", path);
        exit(1);
    }
    buffer[bytes_read] = '\0';
    fclose(file);
    return buffer;
}

int main(int argc, char** argv) {
    if (argc < 2) {
        fprintf(stderr,
            "Usage: %s <file> [--json] [--mutate] "
            "[--intensity low|medium|high] [--seed <n>] "
            "[--count <n>] [--safe]\n",
            argv[0]);
        return 1;
    }

    const char* path      = argv[1];
    int  use_json         = 0;
    int  use_mutate       = 0;
    const char* intensity = "low";
    unsigned int seed     = (unsigned int)time(NULL);
    int seed_set          = 0;
    int count_flag        = -1;  /* -1 means use intensity */
    int safe_mode         = 0;

    /* Parse flags */
    for (int i = 2; i < argc; i++) {
        if (strcmp(argv[i], "--json") == 0) {
            use_json = 1;
        } else if (strcmp(argv[i], "--mutate") == 0) {
            use_mutate = 1;
        } else if (strcmp(argv[i], "--intensity") == 0 && i + 1 < argc) {
            intensity = argv[++i];
        } else if (strcmp(argv[i], "--seed") == 0 && i + 1 < argc) {
            seed     = (unsigned int)atoi(argv[++i]);
            seed_set = 1;
        } else if (strcmp(argv[i], "--count") == 0 && i + 1 < argc) {
            int c = atoi(argv[++i]);
            if (c < 1)  c = 1;
            if (c > 20) c = 20;
            count_flag = c;
        } else if (strcmp(argv[i], "--safe") == 0) {
            safe_mode = 1;
        }
    }

    /* Intensity → mutation count */
    int mut_count = 1;
    if (strcmp(intensity, "medium") == 0) mut_count = 3;
    else if (strcmp(intensity, "high") == 0) mut_count = 6;

    char* source = read_file(path);
    lexer_init(source);
    parser_init();

    Node* ast = parse_program();

    if (use_mutate) {
        ChaosConfig cfg;
        cfg.count     = mut_count;
        cfg.seed      = seed_set ? seed : (unsigned int)time(NULL);
        cfg.safe_mode = safe_mode;
        /* Use --count if provided, else use intensity */
        if (count_flag >= 0) cfg.count = count_flag;

        MutationLog log = chaos_run(ast, cfg);

        if (use_json) {
            /* Combined JSON: {"ast":...,"mutations":[...]} */
            printf("{\"ast\":");
            ast_print_json(ast);
            printf(",\"mutations\":");
            chaos_log_print_json(&log);
            printf("}\n");
        } else {
            node_print(ast, 0);
            printf("\n--- Mutations (%d) ---\n", log.count);
            for (int i = 0; i < log.count; i++) {
                MutationRecord* r = &log.records[i];
                printf("[%s] line %d: '%s' → '%s'\n",
                    r->type, r->line, r->before, r->after);
            }
        }
        chaos_log_free(&log);
    } else {
        if (use_json) {
            /* Wrap in same combined shape for consistency */
            printf("{\"ast\":");
            ast_print_json(ast);
            printf(",\"mutations\":[]}\n");
        } else {
            node_print(ast, 0);
        }
    }

    node_free(ast);
    free(source);
    return 0;
}
