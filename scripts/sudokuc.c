#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>

/*
    SUDOKU Solver

    Compile using emcc:
    emcc -o sudokuc.js sudokuc.c -s WASM=1 -s EXPORTED_FUNCTIONS="['_solveSudoku','_main']"
*/


const int SIZE = (100000 + 1)*4;
const int FULL_F = -1;  // = 0xfff.... no matter the type
int countCodeHashPossibilities_cache[512];
bool didChange;
typedef enum { COL=1, ROW=2, BOX=3} Type;
typedef bool Possibilities[9][9][10] ;
typedef struct { int x,y,digit; } Choice;

bool solveSudokuHelper(int grid[], int recurse);

int main(int argc, char ** argv) {
  printf("Greetings my friend, I'm a Sudoku solver!\n\n");
  printf("I was written in C and compiled to Web Assembly to run on the web.\n");
  printf("To pass a grid to solve, call solveSudoku(int grid[], int seed).\n");
  printf("- grid[] is an array of integer, representing each cell. Each index respresent x + y*9\n");
  printf("- seed is an integer to randomize the solution if there are many.\n");
  printf("Sometimes, if I cannot find a solution, you have to change the seed. To randomize it, just pass the time in milliseconds.\n");
  printf("Some Sudoku puzzles take longer to crack, like this one: http://www.telegraph.co.uk/news/science/science-news/9359579/Worlds-hardest-sudoku-can-you-crack-it.html.\n");
  printf("But now I can solve it with this seed: 1502059836283.\n");
  memset(countCodeHashPossibilities_cache, 0, sizeof(countCodeHashPossibilities_cache));
}

int countCodeHashPossibilities(int bit) {
    if(!bit || countCodeHashPossibilities_cache[bit]) {
        return countCodeHashPossibilities_cache[bit];
    }

    int count = 0;
    for(int i=0; i<9; i++) {
        if((1<<i) & bit) {
            count++;
        }
    }
    countCodeHashPossibilities_cache[bit] = count;
    return count;
}



void removePossibility(
    Possibilities possibilities,
    int digit,
    int col,
    int row
) {
    if(possibilities[col][row][digit]) {
        possibilities[col][row][digit] = false;
        didChange = true;
    }
}

int cellId(int x,int y) {
    return x + y*9;
}

int getCol(int x,int y) {
    return x;
}

int getRow(int x,int y) {
    return y;
}

int getBoxId(int x, int y) {
    int boxX = x/3;
    int boxY = y/3;
    return boxX + boxY * 3;
}

void getFromBoxId(int boxId, int* x, int* y) {
    *x = boxId % 3;
    *y = boxId / 3;
}

void confirm(int digit,int x,int y, Possibilities possibilities) {
    int currentRow = getRow(x,y);
    int currentCol = getCol(x,y);
    int currentBoxId = getBoxId(x,y);

    //  no other digits can claim that spot
    for(int d=1;d<=9;d++) {
        if(d != digit) {
            removePossibility(possibilities, d, currentCol, currentRow);
        }
    }
    //  that digit can't be on any other spot on the same row, col and box
    for(int row=0;row<9;row++) {
        for(int col=0;col<9;col++) {
            if(col==x && row==y) {
                continue;
            }

            if(col == x || row == y || getBoxId(col,row)==currentBoxId) {
                removePossibility(possibilities, digit, col, row);
            }
        }
    }
}

void applyGrid(int* grid, Possibilities possibilities) {
    for(int y=0; y<9; y++) {
        for(int x=0; x<9; x++) {
            int digit = grid[y*9 + x];
            if(digit) {
                confirm(digit, x, y, possibilities);
            }
        }
    }
}

int countRowPossibilities(int digit, int row, Possibilities possibilities, int result[9]) {
    int count = 0;
    for(int col=0; col<9; col++) {
        if(possibilities[col][row][digit]) {
            result[count] = col;
            count++;
        }
    }
    return count;
}

int countColPossibilities(int digit, int col, Possibilities possibilities, int result[9]) {
    int count = 0;
    for(int row=0; row<9; row++) {
        if(possibilities[col][row][digit]) {
            result[count] = row;
            count++;
        }
    }
    return count;
}

int countBoxPossibilities(int digit, int boxX, int boxY, Possibilities possibilities, int boxResult[9][2]) {
    int count = 0;
    for(int x=0;x<3;x++) {
        for(int y=0;y<3;y++) {
            if(possibilities[boxX*3+x][boxY*3+y][digit]) {
                boxResult[count][0] = boxX*3+x;
                boxResult[count][1] = boxY*3+y;
                count++;
            }
        }
    }
    return count;
}

int uniqueBox(int result[9], int count) {
    int box = result[0] / 3;
    for(int j=1; j<count; j++) {
        if(box != result[j]/3) {
            return -1;
        }
    }
    return box;
}

bool checkDigitOccupancy(int digit, Possibilities possibilities) {
    for(int i=0; i<9; i++) {
        int result[9];
        int count, row, col;

        row = i;
        count = countRowPossibilities(digit, row, possibilities, result);
        if (!count) {
            return false;
        } else if(count == 1) { //  one col possible on this row. Confirm position
            confirm(digit, result[0], row, possibilities);
        } else if(count <= 3) {
            int boxX = uniqueBox(result, count);
            if(boxX >= 0) {   //  within this row, digit is isolated to one box. Clean that box
                int boxY = row / 3;
                for(int y=0; y<3; y++) {
                    for(int x=0; x<3; x++) {
                        if(boxY*3 + y != row) {
                            removePossibility(possibilities, digit, boxX*3 + x, boxY*3 + y);
                        }
                    }
                }
            }
        }

        col = i;
        count = countColPossibilities(digit, col, possibilities, result);
        if (!count) {
            return false;
        } else if(count == 1) { //  one row possible on this col. Confirm position
            confirm(digit, col, result[0], possibilities);
        } else if(count <= 3) {
            int boxY = uniqueBox(result, count);
            if(boxY >= 0) {   //  within this column, digit is isolated to one box. Clean that box
                int boxX = col / 3;
                for(int y=0; y<3; y++) {
                    for(int x=0; x<3; x++) {
                        if(boxX*3 + x != col) {
                            removePossibility(possibilities, digit, boxX*3 + x, boxY*3 + y);
                        }
                    }
                }
            }
        }
    }
    for(int boxX=0;boxX<3;boxX++) {
        for(int boxY=0;boxY<3;boxY++) {
            int boxResult[9][2];
            int count = countBoxPossibilities(digit, boxX, boxY, possibilities, boxResult);
            if (!count) {
                return false;
            } else if(count == 1) { // one position on this box. Confirm position
                confirm(digit, boxResult[0][0], boxResult[0][1], possibilities);
            } else if(count <= 3) {
                int uniqueCol = boxResult[0][0];
                int uniqueRow = boxResult[0][1];
                for(int j=1; j<count; j++) {
                    if(uniqueCol != boxResult[j][0]) {
                        uniqueCol = -1;
                    }
                    if(uniqueRow != boxResult[j][1]) {
                        uniqueRow = -1;
                    }
                }
                int col, row;
                if(uniqueCol>=0) {
                    int col = uniqueCol;
                    //  within this box, digit is isolated on one column. Clean that column
                    for(int row=0; row<9; row++) {
                        if(row/3 != boxY) {
                            removePossibility(possibilities, digit, col, row);
                        }
                    }
                }
                if(uniqueRow>=0) {
                    int row = uniqueRow;
                    //  within this box, digit is isolated on one row. Clean that row
                    for(int col=0; col<9; col++) {
                        if(col/3 != boxX) {
                            removePossibility(possibilities, digit, col, row);
                        }
                    }
                }
            }
        }
    }
    return true;
}

int occupancyBitCode(int digit, Type type, int pos, Possibilities possibilities) {
    int bits = 0;
    for(int i=0; i<9; i++) {
        bool possible = false;
        switch(type) {
            case COL: possible = possibilities[pos][i][digit]; break;
            case ROW: possible = possibilities[i][pos][digit]; break;
            case BOX: {
                int boxX, boxY;
                getFromBoxId(pos, &boxX, &boxY);
                possible = possibilities[boxX*3+i%3][boxY*3+i/3][digit];
            } break;
            default: break;
        }
        if(possible) {
            bits |= 1<<i;
        }
    }
    return (1<<12) * pos | (1<<10) * type | bits;
}

void clearOccupation(Type type, int pos, int shortCode, int digitHash[], Possibilities possibilities) {
    //  the number of spots match the number of digits that fit there
    //  then no other digits can fit in
    for(int i=0;i<9;i++) {
        if((1<<i) & shortCode) {
            for(int digit=1; digit<=9; digit++) {
                if(digitHash[digit] != shortCode) {
                    int col,row;
                    switch(type) {
                        case COL:
                            col = pos; row = i;
                            break;
                        case ROW:
                            col = i; row = pos;
                            break;
                        case BOX: {
                                int boxX, boxY;
                                getFromBoxId(pos, &boxX, &boxY);
                                col = boxX*3 + (i%3); row = boxY*3 + (i/3);
                            }
                            break;
                    }
                    removePossibility(possibilities, digit, col, row);
                }
            }
        }
    }
}

bool checkGroupOccupancyForType(Type type, Possibilities possibilities) {
    for(int pos=0; pos<9; pos++) {
        int digitHash[10];
        int codeHashCount[512];
        memset(codeHashCount, 0, sizeof(codeHashCount));

        //  count occupancies
        for(int digit=1; digit<=9; digit++) {
            int bitCode = occupancyBitCode(digit, type, pos, possibilities);
            int shortCode = bitCode % (1<<10);
            digitHash[digit] = shortCode;
            codeHashCount[shortCode]++;
        }

        //  check for exact occupancies
        for(int digit=1; digit<=9; digit++) {
            int shortCode = digitHash[digit];
            if(countCodeHashPossibilities(shortCode)<codeHashCount[shortCode]) {
                return false;
            } else if(countCodeHashPossibilities(shortCode)==codeHashCount[shortCode]) {
                //  full occupation, remove digits that don't belong
                for(int d=1; d<=9; d++) {
                    if(digitHash[d] != shortCode) {
                        clearOccupation(type, pos, shortCode, digitHash, possibilities);
                    }
                }
            }
        }
    }
    return true;
}

bool checkGroupOccupancy(Possibilities possibilities) {
    //  within one area (one row, one column or one box)
    //  if digit1 can occupy only 2 positions and digit2 can occupy only those 2 same positions
    //  then no other digits can occupy these positions
    //  (Note this also works when digit1,digit2,digit3 occupying only 3 positions)
    //  ex:
    //  On row0
    //  |=>col0,col1 [dig2, dig3] // dig2 and dig3 only occupy [0,0] and [1,0]
    //  |=>col0,col1,col3 [dig1] //  dig1 occupy [0,0], [1,0] and [3,0]
    //  |=>...
    //  dig2 and dig3 cannot go anywhere else than [0,0] and [1,0] on row0,
    //  therefore, dig1 must be removed from [0,0] and [1,0].
    //  In this particular case, dig1 is forced to [3,0].

    return checkGroupOccupancyForType(COL, possibilities)
        && checkGroupOccupancyForType(ROW, possibilities)
        && checkGroupOccupancyForType(BOX, possibilities);
}

void showPossibilities(Possibilities possibilities) {
    for(int y=0; y<9; y++) {
        for(int x=0; x<9; x++) {
            printf("%i,%i:", x, y);
            for(int digit=1; digit<=9;digit++) {
                if(possibilities[x][y][digit]) {
                    printf(" %i", digit);
                }
            }
            printf("\n");
        }
    }
}

void insertInCodes(int digit, int codeLine[10]) {
    codeLine[digit] = 1;
}

void displayCode(int codeLine[10]) {
    for(int digit=1; digit<=9; digit++) {
        if(codeLine[digit]) {
            printf(" %i", digit);
        }
    }
}

void displayBitCode(int bitCode) {
    int pos = bitCode / (1<<12);
    int type = (bitCode >> 10) & 3;
    switch(type) {
        case ROW: printf("ROW"); break;
        case COL: printf("COL"); break;
        case BOX: printf("BOX"); break;
        default: break;
    }
    printf("%i-", pos);
    for(int i=0;i<9;i++) {
        if(bitCode & (1<<i)) {
            printf("%i",i);
        }
    }
    printf(": ");
}

void insertOccupancyCodes(
    Type type,
    Possibilities possibilities,
    int codes[][10],
    int* p_count,
    int codeHash[],
    int codeHashList[]
) {
    for(int pos=0; pos<9; pos++) {
        for(int digit=1; digit<=9;digit++) {
            int bitCode = occupancyBitCode(digit, type, pos, possibilities);
            if(codeHash[bitCode] < 1) {
                codeHash[bitCode] = *p_count;
                codeHashList[codeHash[bitCode]] = bitCode;
                (*p_count)++;
            }
            insertInCodes(digit, codes[codeHash[bitCode]]);
        }
    }
}

void showBitCodes(Possibilities possibilities) {
    int codes[3*9*9][10];
    int count = 0;
    int codeHash[40960];
    int codeHashList[3*9*9];
    memset(codeHash, FULL_F, sizeof(codeHash));
    memset(codes,0,sizeof(codes));

    insertOccupancyCodes(ROW, possibilities, codes, &count, codeHash, codeHashList);
    insertOccupancyCodes(COL, possibilities, codes, &count, codeHash, codeHashList);
    insertOccupancyCodes(BOX, possibilities, codes, &count, codeHash, codeHashList);

    for(int i=0; i<count; i++) {
        int bitCode = codeHashList[i];
        if(codeHash[bitCode] >= 0) {
            displayBitCode(bitCode);
            displayCode(codes[codeHash[bitCode]]);
            printf("\n");
        }
    }
}

int getPossibleDigits(int x,int y,int result[9], Possibilities possibilities) {
    int count = 0;
    for(int digit=1; digit<=9; digit++) {
        if(possibilities[x][y][digit]) {
            result[count++] = digit;
        }
    }
    return count;
}

void shuffleChoices(Choice choices[], int count) {
    Choice temp;
//    for(int i=0; i<count; i++) {
    int i = rand()%count;
        int j = rand()%count;
        if(j != i) {
            memcpy(&temp, choices+i, sizeof(Choice));
            memcpy(choices+i, choices+j, sizeof(Choice));
            memcpy(choices+j, &temp, sizeof(Choice));
        }
//    }
}

int getAllPossibleChoices(Possibilities possibilities, Choice choices[]) {
    int count = 0;
    int result[9];
    for(int y=0; y<9; y++) {
        for(int x=0; x<9; x++) {
            int possibleCount = getPossibleDigits(x, y, result, possibilities);
            if(possibleCount > 1) {
                int iniCount = count;
                for(int i=0; i<possibleCount; i++) {
                    choices[count].x = x;
                    choices[count].y = y;
                    choices[count].digit = result[i];
                    count++;
                }
            }
        }
    }
    return count;
}

void printGrid(int grid[]) {
    for(int y=0; y<9; y++) {
        for(int x=0; x<9; x++) {
            if(grid[x + y*9]) {
                printf("%i", grid[x+y*9]);
            } else {
                printf(" ");
            }
        }
        printf("\n");
    }
}

bool checkDigitOccupancies(Possibilities possibilities) {
    for(int digit=1; digit<=9; digit++) {
        if(!checkDigitOccupancy(digit, possibilities)) {
            return false;
        }
    }
    return true;
}

bool solveHelper(Possibilities possibilities) {
    do {
        didChange = false;
        if(!checkDigitOccupancies(possibilities) || !checkGroupOccupancy(possibilities)) {
            return false;
        }
    } while(didChange);
    return true;
}



bool tryChoices(Choice choices[], int count, int grid[], int recurse) {
    int subgrid[9*9];
    memcpy(subgrid, grid, sizeof(subgrid));

    while(count > 0) {
        int i = rand()%count;
        subgrid[choices[i].x + choices[i].y*9] = choices[i].digit;
        if(solveSudokuHelper(subgrid, recurse+1)) {
            memcpy(grid, subgrid, sizeof(subgrid));
            return true;
        }
        subgrid[choices[i].x + choices[i].y*9] = 0;
        choices[i] = choices[count-1];
        count--;
        break;
    }
    return false;
}

void makeSolutionGrid(Possibilities possibilities, int grid[]) {
    int result[9];
    for(int y=0; y<9; y++) {
        for(int x=0; x<9; x++) {
            getPossibleDigits(x, y, result, possibilities);
            grid[x + y*9] = result[0];
        }
    }
}

int maxDepth;

bool solveSudokuHelper(int grid[], int recurse) {
    if(recurse > maxDepth) {
        maxDepth = recurse;
    }

    Possibilities possibilities;
    memset(possibilities, FULL_F, sizeof(possibilities));
    applyGrid(grid, possibilities);

    bool possible = solveHelper(possibilities);
    if (!possible) {
        return false;
    }

    Choice choices[9*9*9];
    int choiceCount = getAllPossibleChoices(possibilities, choices);
    if(choiceCount) {
        return tryChoices(choices, choiceCount, grid, recurse);
    } else {
        makeSolutionGrid(possibilities, grid);
    }

    return true;
}

bool solveSudoku(int grid[], int seed) {
    srand(seed);
    maxDepth = 0;
    return solveSudokuHelper(grid,0);
}
