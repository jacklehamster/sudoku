define(function() {
    function setGrid(x,y,digit) {
        grid[y][x] = digit ? digit : null;
        showGrid(grid);
        skipLast = true;
        solveGrid();
    }

    function isValid(digit) {
        digit = parseFloat(digit);
        if (isNaN(digit)) {
            return false;
        }
        if (Math.floor(digit) !== digit) {
            return false;
        }
        return 1 <= digit && digit <= 9;
    }

    function deserializeGrid(grid) {
        var result = [null];
        for (var l = 0; l < grid.length; l++) {
            var line = grid[l];
            if (!line.match(/-+/)) {
                result.push((' ' + line.split('|').join('')).split('').map(function (c) {
                    return isValid(c) ? parseInt(c) : null;
                }));
            }
        }
        return result;
    }


    var cells = null;
    var valueCache = null;

    function showGrid(numberGrid) {
        for(var i=0;i<updatesCallbacks.length;i++) {
            updatesCallbacks[i](numberGrid,grid);
        }
    }


    /*
     var grid = deserializeGrid([
     '...|.6.|.5.',
     '8.1|..7|2..',
     '27.|8..|...',
     '-----------',
     '...|5..|..2',
     '.6.|...|.8.',
     '9..|..1|..6',
     '-----------',
     '...|..3|.15',
     '..5|7..|6.3',
     '.8.|.9.|...',
     ]);
     /*/


    /*
     var grid = deserializeGrid([
     '...|...|...',
     '8..|.2.|..5',
     '...|..6|24.',
     '-----------',
     '.38|..7|1..',
     '2.4|...|3.9',
     '..7|4..|52.',
     '-----------',
     '.72|5..|...',
     '6..|.8.|..1',
     '...|...|...',
     ]);
     /*/
    var grid = deserializeGrid([
        '...|...|...',
        '...|...|...',
        '...|...|...',
        '-----------',
        '...|...|...',
        '...|...|...',
        '...|...|...',
        '-----------',
        '...|...|...',
        '...|...|...',
        '...|...|...',
    ]);

    var worker = new Worker('scripts/solveworker.js');
    worker.addEventListener('message', handleMessageFromWorker);

    function handleMessageFromWorker(msg) {
        if (msg.data.grid && !skipLast) {
            showGrid(msg.data.grid);
        }
        skipLast = false;
        working = false;
    }

    var working = false, skipLast = false;
    var message = {
        grid: null,
    };

    function solveGrid() {
        if (!working) {
            working = true;
            message.grid = grid;
            worker.postMessage(message);
        }

    }

    var started = false;
    function startSolver() {
        if(!started) {
            return;
        }
        solveGrid();
        requestAnimationFrame(startSolver);
    }

    function start() {
        started = true;
        startSolver();
    }

    function stop() {
        started = false;
    }

    const updatesCallbacks = [];
    function addUpdateCallback(callback) {
        updatesCallbacks.push(callback);
    }

    function SudokuSolver() {
    }
    SudokuSolver.prototype.start = start;
    SudokuSolver.prototype.stop = stop;
    SudokuSolver.prototype.setGrid = setGrid;
    SudokuSolver.prototype.addUpdateCallback = addUpdateCallback;
    SudokuSolver.prototype.grid = grid;

    return SudokuSolver;
});