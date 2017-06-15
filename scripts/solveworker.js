function PossibilityMap(grid) {
    var possible;
    var solved;
    var invalid;

    var types = ['col','row','box'];

    this.initialize = function() {
        invalid = false;
        solved = false;
        possible = {};
        this.possible = possible;
        types.forEach(function(type) {
            possible[type] = [];
            for(var pos=1; pos<=9; pos++) {
                possible[type][pos] = [];
                for(var digit=1; digit<=9; digit++) {
                    possible[type][pos][digit] = [];
                    for(var i=1;i<=9;i++) {
                        possible[type][pos][digit][i] = 1;
                        //  means for type-pos, digit at position [i] is possible
                    }
                }
            }
        });
    };

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

    this.solved = function() {
        return solved;
    };

    this.invalid  = function() {
        return invalid;
    }

    function boxAt(x,y) {
        return Math.floor((y-1)/3)*3 + Math.floor((x-1)/3)+1;
    }

    function boxPos(x,y) {
        return ((y-1)%3)*3 + ((x-1)%3)+1;
    }

    function boxX(box,pos) {
        return ((box-1)%3) * 3 + (pos-1)%3 + 1;
    }

    function boxY(box,pos) {
        return Math.floor((box-1)/3) * 3 + Math.floor((pos-1)/3) + 1;
    }

    this.confirmCell = function(x,y,digit) {
        var didChange = false, value;
        for(var d=1; d<=9; d++) {
            for(var i=1; i<=9; i++) {
                if(i===y && d===digit || i!==y && d!==digit) {
                } else if(removePossibility('col',x,d,i)) {
                    didChange = true;
                }

                if(i===x && d===digit || i!==x && d!==digit) {
                } else if(removePossibility('row',y,d,i)) {
                    didChange = true;
                }
                var box = boxAt(x,y);
                var boxi = boxPos(x,y);
                if(i===boxi && d===digit || i!==boxi && d!==digit) {
                } else if(removePossibility('box',box,d,i)) {
                    didChange = true;
                }
            }
        }
        return didChange;
    };

    function removePossibility(type,pos,digit,bit) {
        if(possible[type][pos][digit][bit]) {
            possible[type][pos][digit][bit] = 0;

            if(countPossibilities(type,pos,digit) === 0) {
                invalid = true;
            }

            return true;
        }
        return false;
    }

    function removePossibilityXY(x,y,digit) {
        var box = boxAt(x,y); var boxi = boxPos(x,y);
        var didChange =
            removePossibility('box', box, digit, boxi)
            || removePossibility('col', x, digit, y)
            || removePossibility('row', y, digit, x);
        return didChange;
    }

    function countPossibilities(type, pos, digit) {
        var count = 0;
        for(var i=1; i<=9; i++) {
            if(possible[type][pos][digit][i]) {
                count++;
            }
        }
        return count;
    }

    this.checkCrossPossibilities = function(type, pos, digit) {
        var didChange = false;
        var x,y,box;
        var uniquePossibility = countPossibilities(type, pos, digit) === 1;

        for(var i=1; i<=9; i++) {
            switch (type) {
                case 'col':
                    x = pos; y = i;
                    box = boxAt(x,y);
                    break;
                case 'row':
                    x = i; y = pos;
                    box = boxAt(x,y);
                    break;
                case 'box':
                    box = pos;
                    x = boxX(box, i);
                    y = boxY(box, i);
                    break;
            }

            if(!possible[type][pos][digit][i]) {
                if (removePossibility('row',y,digit,x)) {
                    didChange = true;
                }
                if (removePossibility('col',x,digit,y)) {
                    didChange = true;
                }
                if (removePossibility('box',box,digit,boxPos(x,y))) {
                    didChange = true;
                }
            } else if(uniquePossibility) {
                if(this.confirmCell(x,y,digit)) {
                    didChange = true;
                }
            }
        }
        return didChange;
    };

    function clean(obj) {
        for(var i in obj) {
            delete obj[i];
        }
        return obj;
    }

    var the = {
        box:0,
        row:0,
        col:0,
    };
    this.checkSingleGroupOccupation = function(type, pos, digit) {
        the.box = the.row = the.col = 0;
        for(var i=1; i<=9; i++) {
            switch (type) {
                case 'col':
                    x = pos; y = i;
                    box = boxAt(x,y);
                    break;
                case 'row':
                    x = i; y = pos;
                    box = boxAt(x,y);
                    break;
                case 'box':
                    box = pos;
                    x = boxX(box, i);
                    y = boxY(box, i);
                    break;
            }
            if(possible[type][pos][digit][i]) {
                if(!the.box) {
                    the.box = box;
                } else {
                    the.box = -1;
                }
                if(!the.col) {
                    the.col = x;
                } else {
                    the.col = -1;
                }
                if(!the.row) {
                    the.row = y;
                } else {
                    the.row = -1;
                }
            }
        }
        if(the.box>0 && (the.row>0 || the.col>0)) {
            //  this means that:
            //  - within one row/col, the digit is isolated to one box
            //  - within one box, the digit is isolated to one row/col
            return isolateBox(the.box, the.col, the.row, digit);
        }
        return false;
    };

    function sameBoxRow(box1, box2) {
        return Math.floor((box1-1)/3) === Math.floor((box2-1)/3);
    }

    function sameBoxColumn(box1, box2) {
        return ((box1-1)%3) === ((box2-1)%3);
    }

    function isolateBox(box, x, y, digit) {
        var i, didChange = false;
        //  clean current box
        for(i=1; i<=9; i++) {
            var bx = boxX(box, i), by = boxY(box,i);
            if(x>0 && bx!==x || y>0 && by!==y) {
                if(removePossibilityXY(bx, by, digit)) {
                    didChange = true;
                }
            }
        }

        if(y>0) {
            //  clean row
            for(i=1; i<=9; i++) {
                if(boxAt(i,y) !== box) {
                    if(removePossibilityXY(i, y, digit)) {
                        didChange = true;
                    }
                }
            }
        }

        if(x>0) {
            //  clean col
            for(i=1; i<=9; i++) {
                if(boxAt(x,i) !== box) {
                    if(removePossibilityXY(x, i, digit)) {
                        didChange = true;
                    }
                }
            }
        }
        return didChange;
    }

    this.combPossibilities = function() {
        var didChange = false;
        for(var d=1; d<=9; d++) {
            for(var i=1; i<=9; i++) {
                if(this.checkCrossPossibilities('col',i,d)) {
                    didChange = true;
                }
                if(this.checkCrossPossibilities('row',i,d)) {
                    didChange = true;
                }
                if(this.checkCrossPossibilities('box',i,d)) {
                    didChange = true;
                }
                if(this.checkSingleGroupOccupation('col',i,d)) {
                    didChange = true;
                }
                if(this.checkSingleGroupOccupation('row',i,d)) {
                    didChange = true;
                }
                if(this.checkSingleGroupOccupation('box',i,d)) {
                    didChange = true;
                }
            }
        }
        return didChange;
    };

    this.setGrid = function(grid) {
        this.initialize();
        this.applyGrid(grid);
        while(this.combPossibilities()) {
            //  keep combing
        }
    };

    this.applyGrid = function(grid) {
        this.grid = grid;
        for(var y=1;y<=9;y++) {
            for(var x=1;x<=9;x++) {
                var digit = parseInt(grid[y][x]);
                if(isValid(digit)) {
                    this.confirmCell(x,y,digit);
                }
            }
        }
    };

    function isDigitPossible(x,y,digit,randomGrid) {
        if(!possible.col[x][digit][y]) {
            return false;
        }
        if(!possible.row[y][digit][x]) {
            return false;
        }
        var box = boxAt(x,y);
        var boxi = boxPos(x,y);
        if(!possible.box[box][digit][boxi]) {
            return false;
        }

        if(randomGrid) {
            for(var i=1;i<=9;i++) {
                //  check row
                if(x !== i && randomGrid[y][i]===digit) {
                    return false;
                }
                //  check column
                if(y !== i && randomGrid[i][x]===digit) {
                    return false;
                }
                //  check box
                if(i !== boxi && randomGrid[boxY(box,i)][boxX(box,i)]===digit) {
                    return false;
                }
            }
        }

        return true;
    }

    function onlyPossibility(x,y) {
        var digit = nextPossible(x,y);
        return nextPossible(x,y,digit)===digit ? digit : null;
    }

    function nextPossible(x,y,digit) {
        if(!digit) {
            if(isDigitPossible(x,y,1)) {
                return 1;
            }
            digit = 1;
        }
        for(var d=digit%9+1; d!==digit; d=d%9+1) {
            if(isDigitPossible(x,y,d)) {
                return d;
            }
        }
        return digit;
    }

    this.nextPossible = nextPossible;

    function shuffle(array) {
        for(var i=0;i<array.length;i++) {
            var swapIndex = Math.floor(Math.random()*array.length);
            var tmp = array[swapIndex];
            array[swapIndex] = array[i];
            array[i] = tmp;
        }
        return array;
    }

    var tempGrid = [];
    function initializeTempGrid() {
        for(var y=1;y<=9;y++) {
            if(!tempGrid[y])
                tempGrid[y] = [];
            for (var x = 1; x <= 9; x++) {
                tempGrid[y][x] = null;
            }
        }
        return tempGrid;
    }

    function initializeOrder() {
        var order = [];
        for(var y = 1;y <= 9; y++) {
            for (var x = 1; x <= 9; x++) {
                order.push({x:x,y:y});
            }
        }
        return order;
    }

    this.createBestGuess = function() {
        var grid = initializeTempGrid();
        for(var y = 1;y <= 9; y++) {
            for (var x = 1; x <= 9; x++) {
                var digit = onlyPossibility(x,y);
                if(digit) {
                    grid[y][x] = digit;
                }
            }
        }
        return grid;
    };

    this.createSolutionGrid = function() {
        var solution = this.recurseSolution();
        if(this.solved()) {
            return solution;
        }
        return this.grid;
//            return this.createBestGuess();
//            return this.createRandomGrid();
    };

    var point = {x:0,y:0};
    function firstEmptyCell(grid) {
        for(var y=1;y<=9;y++) {
            for(var x=1;x<=9;x++) {
                if(!isValid(grid[y][x])) {
                    point.x = x;
                    point.y = y;
                    return point;
                }
            }
        }
        return null;
    }

    function anyEmptyCell(grid) {
        var positions = shuffle(order);
        for(var i=0; i<positions.length; i++) {
            var pos = positions[i];
            if(!isValid(grid[pos.x][pos.y])) {
                return pos;
            }
        }
        return null;
    }

    function print(grid) {
        var str = "";
        for(var y=1;y<=9;y++) {
            for(var x=1;x<=9;x++) {
                if(isValid(grid[y][x])) {
                    str += grid[y][x];
                } else {
                    str += '.';
                }
            }
            str += "\n";
        }
        str += "\n";
        return str;
    }

    this.recurseSolution = function() {
        var bestGuess = this.createBestGuess();
        if(this.invalid()) {
            return bestGuess;
        }

        var emptyPos = firstEmptyCell(bestGuess);
        if(!emptyPos) {
            solved = true;
            return bestGuess;
        } else {
            shuffle(digits);
            for(var i=0;i<digits.length;i++) {
                var digit = digits[i];
                if(isDigitPossible(emptyPos.x, emptyPos.y, digit)) {
                    bestGuess[emptyPos.y][emptyPos.x] = digit;
                    var map = new PossibilityMap(bestGuess);
                    var solution = map.recurseSolution();
                    if(map.solved()) {
                        this.applyGrid(solution);
                        solved = true;
                        return solution;
                    }
                    bestGuess[emptyPos.y][emptyPos.x] = null;
                }
            }
        }
        return bestGuess;
    };

    var order = initializeOrder();
    var digits = [1,2,3,4,5,6,7,8,9];
    this.createRandomGrid = function() {
        var randomGrid = initializeTempGrid();
        var fullSolution = true;

        shuffle(order).forEach(function(pos) {
            var foundDigit = false;
            shuffle(digits).forEach(function(digit) {
                if(isDigitPossible(pos.x,pos.y,digit,randomGrid)) {
                    randomGrid[pos.y][pos.x] = digit;
                    foundDigit = true;
                }
            });
            if(!foundDigit) {
                fullSolution = false;
            }
        });

        if(fullSolution) {
            for(var y=1;y<=9;y++) {
                for (var x = 1; x <= 9; x++) {
                    this.confirmCell(x,y,randomGrid[y][x]);
                }
            }
            solved = true;
        }

        return randomGrid;
    };

    this.initialize();
    if(grid) {
        this.setGrid(grid);
    }
}

var map = new PossibilityMap();


var msgBack = {
    grid:null,
};
self.onmessage = function (msg) {
    map.setGrid(msg.data.grid);
    msgBack.grid = map.createSolutionGrid();
    msgBack.orgGrid = msg.data.grid;
    self.postMessage(msgBack);
};

