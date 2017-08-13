if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(function(reg) {
            console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch(function(error) {
        console.log('Registration failed with ' + error);
    });
}

require([
    'scripts/sudokusolver'
], function(SudokuSolver) {

    var sudoku = new SudokuSolver();
    showSudokuGrid(sudoku);
});