int f(int a, int b) {
    while (a > 0 && b < 10) {
        a = a - 1;
        b = b + 1;
    }
    if (a > 0 || b == 0) {
        return a + b;
    }
    return 0;
}
