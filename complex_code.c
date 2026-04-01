#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* createNode(int data) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->data = data;
    n->next = NULL;
    return n;
}

int sumList(Node* head) {
    int sum = 0;
    while (head != NULL) {
        sum = sum + head->data;
        head = head->next;
    }
    return sum;
}

int main() {
    Node* head = createNode(10);
    head->next = createNode(20);
    head->next->next = createNode(30);
    printf("%d\n", sumList(head));
    return 0;
}
