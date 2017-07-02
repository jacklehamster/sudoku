require([
    'sudokusolver',
], function(SudokuSolver) {

    var sudoku = new SudokuSolver();
    sudoku.start(container);
});