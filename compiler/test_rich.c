int add(int a, int b) {
    return a + b;
}
int main() {
    int x = 10;
    int y = 20;
    if (x < y) {
        x = x + 1;
    }
    return add(x, y);
}
