require([
    'scripts/sudokusolver'
], function(SudokuSolver) {

    var sudoku = new SudokuSolver();
    showSudokuGrid(sudoku);
});