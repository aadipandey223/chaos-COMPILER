#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "lexer.h"
#include "parser.h"
#include "chaos.h"
#include "codegen.h"

// Mock source if no file provided
const char* DEFAULT_SOURCE = "int main() { int x = 10; int y = 20; int z = x + y; return z; }";

int main(int argc, char** argv) {
    const char* source = DEFAULT_SOURCE;
    int enable_chaos = 0;

    // Argument parsing
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--chaos") == 0) {
            enable_chaos = 1;
        }
        // Could add file reading logic here
    }

    // 1. Lexer
    init_lexer(source);

    // 2. Parser -> IR
    IRProgram prog;
    init_ir(&prog);
    parse_program(&prog);

    printf("--- Original IR ---\n");
    print_ir(&prog);
    printf("\n");

    // 3. Chaos Engine
    if (enable_chaos) {
        printf("--- Applying Chaos ---\n");
        apply_chaos(&prog);
        printf("--- Chaotic IR ---\n");
        print_ir(&prog);
        printf("\n");
    }

    // 4. Code Generation
    printf("--- Assembly ---\n");
    generate_assembly(&prog);

    // Cleanup
    free_ir(&prog);

    return 0;
}
