self.importScripts('sudokucsolver.js');

var msgBack = {
    grid:null,
    updated: 0,
};
self.onmessage = function (msg) {
    if(lastUpdate !== msg.data.updated) {
        lastUpdate = msg.data.updated;
        workingSeedsHash = {};
        workingSeeds.length = 0;
    }
    msgBack.updated = msg.data.updated;
    msgBack.grid = solveGrid(msg.data.grid, Module);
    self.postMessage(msgBack);
};