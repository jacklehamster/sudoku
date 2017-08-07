self.importScripts('sudokuc.js');

const resultGrid = [];
let gridPtr = null;
const workingSeeds = [];
let workingSeedsHash = {};

function makeGridFromResult() {
    for(let i=0, y=1; y<=9; y++) {
        for(let x=1; x<=9; x++) {
            resultGrid[y][x] = Module.HEAPU32[(gridPtr / Uint32Array.BYTES_PER_ELEMENT) + i];
            i++;
        }
    }
    return resultGrid;
}

function solveGrid(grid, Module) {
    if (!gridPtr) {
        return;
    }
    for(let i=0, y=1; y<=9; y++) {
        for(let x=1; x<=9; x++) {
            Module.HEAPU32[(gridPtr / Uint32Array.BYTES_PER_ELEMENT) + i] = grid[y][x];
            i++;
        }
    }
    let seed = Date.now();
    let solved = Module.ccall('solveSudoku', 'bool', ['number', 'number'], [gridPtr, seed]);
    if(solved) {
        if(!workingSeedsHash[seed] && workingSeeds.length<30) {
            workingSeedsHash[seed] = workingSeeds.length;
            workingSeeds.push(seed);
        }
    } else if(workingSeeds.length) {
        seed = workingSeeds[Math.floor(Math.random()*workingSeeds.length)];
        solved = Module.ccall('solveSudoku', 'bool', ['number', 'number'], [gridPtr, seed]);
    }

    if(solved) {
        return makeGridFromResult();
    } else {
        return grid;
    }
}

function initialize() {
    gridPtr = Module._malloc(9*9 * Uint32Array.BYTES_PER_ELEMENT);
    for(let y=1;y<=9;y++) {
        resultGrid[y] = [];
    }
}

function destroy() {
    Module._free(gridPtr);
}

if(typeof(Module)!=='undefined') {
    Module.onRuntimeInitialized = initialize;
}

