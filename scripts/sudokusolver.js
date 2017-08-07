define(function() {
    function setGrid(x,y,digit) {
        grid[y][x] = digit ? digit : null;
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

    function handleMessageFromWorker(msg) {
        if (msg.data.grid) {
            showGrid(msg.data.grid);
        }
        working = false;
    }

    function createWorker() {
        var worker = new Worker('scripts/solveworker.js');
        worker.addEventListener('message', handleMessageFromWorker);
        return worker;
    }

    var message = {
        grid: null,
        updated: 0,
    };

    var lastUpdate = 0;
    var worker = createWorker();
    var working = false;

    function solveGrid(updated) {
        if(working && !updated) {
            return;
        }

        if(updated && lastUpdate !== updated) {
            lastUpdate = updated;
        }
        working = true;
        message.updated = updated || lastUpdate;
        message.grid = grid;
        worker.postMessage(message);
    }
    message.grid = grid;
    worker.postMessage(message);

    function send() {
        solveGrid(Date.now());
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
    SudokuSolver.prototype.send = send;

    return SudokuSolver;
});