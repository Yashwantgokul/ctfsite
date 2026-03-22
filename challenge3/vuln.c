#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void win() {
    char flag[128];
    FILE *f = fopen("flag.txt", "r");
    if (f == NULL) {
        printf("Flag file not found. Please contact admin.\n");
        exit(1);
    }
    fgets(flag, sizeof(flag), f);
    printf("Congratulations! Here is your flag: %s\n", flag);
    fclose(f);
    exit(0);
}

void vuln() {
    char buffer[64];
    printf("Welcome to Stack Smash Starter!\n");
    printf("Enter your payload: ");
    fflush(stdout);
    gets(buffer); // Intentional vulnerability
    printf("You entered: %s\n", buffer);
}

int main() {
    // Disable buffering for clean network interaction
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    vuln();
    
    printf("Normal execution completed. Try harder!\n");
    return 0;
}
