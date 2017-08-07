self.importScripts('sudokucsolver.js');

var lastUpdate = 0;
var msgBack = {
    grid:null,
    updated: 0,
};
self.onmessage = function (msg) {
    if(lastUpdate !== msg.data.updated) {
        workingSeedsHash = {};
        workingSeeds.length = 0;
        lastUpdate = msg.data.updated;
    }
    msgBack.grid = solveGrid(msg.data.grid, Module);
    msgBack.updated = msg.data.updated;
    self.postMessage(msgBack);
};
