/**
 * Chaos Compiler Demo
 * 
 * This program demonstrates the specific language features that
 * the Chaos Compiler supports and transforms:
 * 1. Arithmetic ops (Target for Instruction Substitution)
 * 2. If/Else logic (Target for Opaque Predicates)
 * 3. While loops (Target for Control Flow Flattening)
 * 4. Constants (Target for Number Encoding)
 */

int calculate_power(int base, int exp) {
    int result = 1;
    int i = 0;
    
    // Loop target for Control Flow Flattening
    while (i < exp) {
        result = result * base; // Arithmetic target
        i = i + 1;
    }
    return result;
}

int main() {
    int x = 10; // Constant target for Number Encoding
    int y = 5;
    
    // Arithmetic operations to be substituted
    int sum = x + y;
    int diff = x - y;
    
    // Conditional logic
    if (sum > 10) {
        printf("Sum is large: %d\n", sum);
    } else {
        printf("Sum is small\n");
    }
    
    // Function call
    int power = calculate_power(2, 4);
    printf("2^4 = %d\n", power);
    
    return 0;
}
