function createTable(parent, inner, xpos, ypos) {
    var table = parent.appendChild(document.createElement('table'));
    table.cellPadding = table.cellSpacing = 0;
    var tbody = table.appendChild(document.createElement('tbody'));
    for(var y=0;y<3;y++) {
        var tr = tbody.appendChild(document.createElement('tr'));
        for(var x=0;x<3;x++) {
            var td = tr.appendChild(document.createElement('td'));
            if(!inner) {
                createTable(td, true, x, y);
            } else {
                td.id = 'id_'+(xpos*3 + x + 1)+"_"+(ypos*3+y + 1);
                td.setAttribute('x', (xpos*3 + x + 1));
                td.setAttribute('y', (ypos*3 + y + 1));
                td.classList.add('cell');
                td.addEventListener("click", clickCell);
            }
        }
    }
    return table;
}

function clickCell(e) {
    var cell = e.currentTarget;
    var x = cell.getAttribute('x');
    var y = cell.getAttribute('y');

    var digit = parseInt(grid[y][x]);
    if(isValid(digit)) {
        digit++;
        if(digit>9) {
            digit = 0;
        }
    } else {
        digit = 1;
    }

    grid[y][x] = digit ? digit : null;
    colorizeGrid(grid, 'fixed-cell', 'blank-cell');
    showGrid(grid);
    cancelLastSolution = true;
    //solve();
}

function isValid(digit) {
    digit = parseFloat(digit);
    if(isNaN(digit)) {
        return false;
    }
    if(Math.floor(digit) !== digit) {
        return false;
    }
    return 1<=digit&&digit<=9;
}

function deserializeGrid(grid) {
    var result = [null];
    for(var l=0;l<grid.length;l++) {
        var line = grid[l];
        if(!line.match(/-+/)) {
            result.push((' '+line.split('|').join('')).split('').map(function(c) {
                return isValid(c)?parseInt(c):null;
            }));
        }
    }
    return result;
}

function colorizeGrid(grid, setClass, blankClass) {
    for(var y=1;y<=9;y++) {
        for(var x=1;x<=9;x++) {
            var value = grid[y][x];
            var cell = document.getElementById('id_'+x+'_'+y);
            cell.classList.add(isValid(value) ? setClass : blankClass);
            cell.classList.remove(isValid(value) ? blankClass : setClass);
        }
    }
}


var cells = null;
var valueCache = null;
function showGrid(grid) {
    if(!cells) {
        cells = [];
        valueCache = [];
        for(var y=1;y<=9;y++) {
            cells[y] = [];
            valueCache[y] = [];
            for(var x=1;x<=9;x++) {
                cells[y][x] = document.getElementById('id_'+x+'_'+y);
                valueCache[y][x] = '';
            }
        }
    }
    for(var y=1;y<=9;y++) {
        for(var x=1;x<=9;x++) {
            var value = grid[y][x];
            value = isNaN(value)?'':value;
            if(valueCache[y][x] !== value) {
                valueCache[y][x] = value;
                var cell = cells[y][x];
                cell.textContent = value;
            }
        }
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
//*/

var worker = new Worker('scripts/solveworker.js');
worker.addEventListener('message', handleMessageFromWorker);

function handleMessageFromWorker(msg) {
    if(msg.data.grid && !cancelLastSolution) {
        showGrid(msg.data.grid);
    }
    cancelLastSolution = false;
    working = false;
}
var working = false, cancelLastSolution = false;
var message = {
    grid: null,
};
function solveGrid() {
    if(!working) {
        working = true;
        message.grid = grid;
        worker.postMessage(message);
    }

}

createTable(document.getElementById('container'));


colorizeGrid(grid, 'fixed-cell', 'blank-cell');

showGrid(grid);
function solve() {
    solveGrid();
    requestAnimationFrame(solve);
}

solve();