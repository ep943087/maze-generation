import {Transformations, getRectangle, getCircle} from '../transformations/transforms.js';

const LEFT = 1;
const RIGHT = 2;
const UP = 3;
const DOWN = 0;

class Cell{
    constructor(i,j){
        this.i = i;
        this.j = j;
        this.borders = [true,true,true,true];
        this.visitedPoints = 0;
    }
    initNeighbors(grid){
        this.neighbors = [];
        const {i,j} = this;
        if(i > 0){
            this.neighbors.push(grid[i-1][j]);
        }
        if(i < grid.length - 1){
            this.neighbors.push(grid[i+1][j]);
        }
        if(j > 0){
            this.neighbors.push(grid[i][j-1]);
        }
        if(j < grid[0].length - 1){
            this.neighbors.push(grid[i][j+1]);
        }
    }
}

export class Maze{
    constructor(c, rows = 30, cols = 30){
        this.c = c;
        this.ctx = c.getContext('2d');
        this.rows = rows;
        this.cols = cols;
        this.CL = 20; // cell length
        this.transforms = new Transformations(c);
        this.visited = [];
        this.currCell = null;
        this.finished = true;
        this.maxVisitedPoints = 10;
        this.initGrid();
        this.initColors();
        this.initEventListeners();
    }

    initEventListeners(){
        const start = document.querySelector("#start");
        const stop = document.querySelector("#stop");
        start.addEventListener('click',(e)=>{
            this.algo = document.querySelector("#algo").value;
            switch(this.algo){
                case "backtracking":
                    return this.initRecursiveBacktracking();
                case "prims":
                    return this.initPrims();
                case "kruskals":
                    return this.initKruskals();
                case "huntkill":
                    return this.initHuntKill();
            }
        });
        stop.addEventListener('click',(e)=>{
            this.finished = true;
        });
    }

    initColors(){
        this.currentCellColor = "green";
        this.borderCellColor = "lightgreen";
    }
    loopGrid(loopFunc){
        for(let i=0;i<this.rows;i++){
            for(let j=0;j<this.cols;j++){
                loopFunc(i,j);
            }
        } 
    }

    initNeighbors = (i,j) => {
        this.grid[i][j].initNeighbors(this.grid);
    }

    initGrid(){
        this.grid = [];
        for(let i=0;i<this.rows;i++){
            const temp = [];
            for(let j=0;j<this.cols;j++){
                temp.push(new Cell(i,j));
            }
            this.grid.push(temp);
        }
        this.loopGrid(this.initNeighbors);
        this.currCell = this.grid[Math.floor(this.grid.length/2)][Math.floor(this.grid[0].length/2)];
        //this.maxVisitedPoints = this.rows * this.cols * .03;
    }

    inVisited(currCell){
        return !currCell.borders.every(border=>border);
    }

    /* RECURSIVE BACKTRACKING ALGO */
    initRecursiveBacktracking(){
        this.finished = false;
        this.initGrid();
        this.stack = [this.currCell];
    }

    BtGetValidBorders(cell, huntkill = false){
        const {i,j} = cell;
        const borders = [];
        if(huntkill){
            huntkill = !this.inVisited(cell);
        }
        if(i > 0 && (!this.inVisited(this.grid[i-1][j]) || huntkill)){
            borders.push(UP);
        }
        if(i < this.rows - 1 && (!this.inVisited(this.grid[i+1][j]) || huntkill)){
            borders.push(DOWN);
        }
        if(j > 0 && (!this.inVisited(this.grid[i][j-1]) || huntkill)){
            borders.push(LEFT);
        }
        if(j < this.cols - 1 && (!this.inVisited(this.grid[i][j+1]) || huntkill)){
            borders.push(RIGHT);
        }
        return borders;
    }

    BtGetNextCell(cell, huntkill = false){
        const borders = this.BtGetValidBorders(cell, huntkill);        
        if(borders.length === 0){
            return null;
        }
        const dir = borders[Math.floor(borders.length*Math.random())];
        let nextCell;
        const {i,j} = cell;
        if(dir === UP){
            nextCell = this.grid[i-1][j];
            cell.borders[UP] = false;
            nextCell.borders[DOWN] = false;            
        } else if(dir === DOWN){
            nextCell = this.grid[i+1][j];
            cell.borders[DOWN] = false;
            nextCell.borders[UP] = false;
        } else if(dir === LEFT){
            nextCell = this.grid[i][j-1];
            cell.borders[LEFT] = false;
            nextCell.borders[RIGHT] = false;
        } else{
            nextCell = this.grid[i][j+1];
            cell.borders[RIGHT] = false;
            nextCell.borders[LEFT] = false;
        }
        this.stack.push(nextCell);
        return nextCell;
    }

    updateRecursiveBacktracking(){
        if(this.stack.length === 0)
            return this.finished = true;
        this.currCell.visitedPoints = this.maxVisitedPoints;
        this.currCell = this.BtGetNextCell(this.currCell);
        if(this.currCell === null){
            this.stack.pop();
            if(this.stack.length > 0)
                this.currCell = this.stack[this.stack.length-1];
        }
    }

    /* RANDOMIZED PRIM'S ALGO */

    PrGetAdjacentCells = (i,j) => {
        const cell = this.grid[i][j];
        if(!this.inVisited(cell) && cell !== this.currCell) return;
        const nonVisited = [];
        cell.neighbors.forEach(adj=>{
            if(!this.inVisited(adj)){
                nonVisited.push({cell: adj, prev: cell});
            }
        });
        this.adjacentCells = [...this.adjacentCells, ...nonVisited];
    }

    PrGetVisitedCells(){
        this.adjacentCells = [];
        this.loopGrid(this.PrGetAdjacentCells);
    }

    findDirection(cell,prev){
        if(cell.i > prev.i){
            return [DOWN, UP];
        } else if(cell.i < prev.i){
            return [UP, DOWN];
        } else if(cell.j > prev.j){
            return [RIGHT, LEFT];
        } else if(cell.j < prev.j){
            return [LEFT, RIGHT];
        }
    }

    initPrims(){
        this.initGrid();
        this.adjacentCells = [];
        this.PrGetAdjacentCells(this.currCell.i,this.currCell.j);
        const adjacent = this.adjacentCells;
        if(adjacent.length === 0) return;
        const {cell, prev} = adjacent[Math.floor(Math.random()*adjacent.length)];
        const [dir1, dir2] = this.findDirection(cell, prev);

        this.currCell = cell;
        this.currCell.visitedPoints = this.maxVisitedPoints;

        cell.borders[dir2] = false;
        prev.borders[dir1] = false;
        this.finished = false;
    }

    updatePrims(){
        this.PrGetVisitedCells();
        const adjacent = this.adjacentCells;
        if(adjacent.length === 0) return this.finished = true;
        const {cell, prev} = adjacent[Math.floor(Math.random()*adjacent.length)];
        const [dir1, dir2] = this.findDirection(cell, prev);

        this.currCell = cell;
        this.currCell.visitedPoints = this.maxVisitedPoints;

        cell.borders[dir2] = false;
        prev.borders[dir1] = false;
    }

    /* RANDOMIZE KRUSKAL'S ALGO */

    KrAddPossibleNextCell = (i,j) => {
        const cell = this.grid[i][j];
        if(!this.canVisit(cell)) return;
        const neighbors = [];
        cell.neighbors.forEach(adj=>{
            if(!this.inVisited(adj)){
                neighbors.push({cell: adj, prev: cell});
            }
        });
        this.adjacentCells = [...this.adjacentCells, ...neighbors];
    }

    vertexExists(cell1, cell2){
        return this.vertices.some(vertex=>{
            const {cell, prev} = vertex;
            if((cell === cell1 && prev === cell2) ||
               (cell === cell2 && prev === cell1)){
                   return true;
            }
            return false;
        })
    }

    addVertex = (i,j) => {
        const cell = this.grid[i][j];
        cell.neighbors.forEach(adj=>{
            if(!this.vertexExists(cell, adj)){
                this.vertices.push({
                    cell,
                    prev: adj,
                });
            }
        })
    }

    initKruskals(){
        this.initGrid();
        this.vertices = [];
        this.loopGrid(this.addVertex);
        console.log(this.vertices);
        this.finished = false;
    }

    countAdjacentCells(cell){
        let borders = cell.borders.reduce((total, border)=>{
            return border? total + 1 : total;
        },0);

        if(cell.neighbors.length >= 3){

        }
    }


    updateKruskals(){
        this.adjacentCells = [];

        if(this.vertices.length === 0) return this.finished = true;
        const r = Math.floor(Math.random()*this.vertices.length);
        const {cell, prev} = this.vertices[r];
        this.vertices.splice(r, 1);
        const [dir1, dir2] = this.findDirection(cell, prev);

        this.currCell = cell;
        this.currCell.visitedPoints = this.maxVisitedPoints;
        prev.visitedPoints = this.maxVisitedPoints;

        cell.borders[dir2] = false;
        prev.borders[dir1] = false;

    }

    /* HUNT-AND-KILL */

    initHuntKill(){
        this.finished = false;
        this.initGrid();
        this.i = null;
        this.stack = [];
    }

    visitedNeighbors(cell){
        return cell.neighbors.some(neighbor=>{
            return this.inVisited(neighbor);
        })
    }

    updateHuntKill(){
        if(this.i === this.grid.length) return this.finished = true;

        if(this.currCell !== null){
            this.currCell = this.BtGetNextCell(this.currCell, true);
        }
        if(this.currCell === null){
            if(this.i === null)
                this.i = 0;
            let found = false;
            for(let j=0;j<this.grid[0].length;j++){
                const cell = this.grid[j][this.i];
                if(!found && !this.inVisited(cell)){
                    found = true;
                    this.currCell = cell;
                }
                cell.visitedPoints = this.maxVisitedPoints;
            }
            this.i++;
            if(found)
                this.i = null;
        }

    }

    /* UPDATE FUNCTION */
    update(){
        if(this.finished) return;
        
        switch(this.algo){
            case "backtracking":
                return this.updateRecursiveBacktracking();
            case "prims":
                return this.updatePrims();
            case "kruskals":
                return this.updateKruskals();
            case "huntkill":
                return this.updateHuntKill();
        }
    }

    getXY(i,j){
        const x1 = j*this.CL;
        const x2 = x1 + this.CL;
        const y1 = i*this.CL;
        const y2 = y1 + this.CL;
        return {x1,y1,x2,y2};
    }

    drawCell = (i,j) => {
        const cell = this.grid[i][j];
        const {x1,y1,x2,y2} = this.getXY(i,j);
        if(cell.borders[RIGHT]){
            this.transforms.drawLine(this.transforms.createLine(x2,y1,x2,y2),this.borderCellColor,this.lineWidth);
        }
        if(cell.borders[LEFT]){
            this.transforms.drawLine(this.transforms.createLine(x1,y1,x1,y2),this.borderCellColor,this.lineWidth);
        }
        if(cell.borders[UP]){
            this.transforms.drawLine(this.transforms.createLine(x1,y1,x2,y1),this.borderCellColor,this.lineWidth);
        }
        if(cell.borders[DOWN]){
            this.transforms.drawLine(this.transforms.createLine(x1,y2,x2,y2),this.borderCellColor,this.lineWidth);
        }
    }

    drawCellFill(cell,color = "green"){
        if(cell === null) return;
        const {x1,y1} = this.getXY(cell.i,cell.j);
        const rect = getRectangle(x1, y1, this.CL, this.CL);
        this.transforms.translateShape(rect, this.CL/2, this.CL/2);
        this.transforms.drawShape(rect, color, 1);
    }

    drawStackCell = (i,j) => {
        const cell = this.grid[i][j];
        if(this.stack && this.stack.includes(cell)){
            const index = this.stack.findIndex(c=>cell === c);
            this.ctx.globalAlpha = .15 + index / this.stack.length * .5;
            this.drawCellFill(cell,"lightgreen");
            this.ctx.globalAlpha = 1;
        }
    }

    drawVisitedPoints = (i,j) => {
        const cell = this.grid[i][j];
        if(cell.visitedPoints > 0){
            this.ctx.globalAlpha = .75*cell.visitedPoints / this.maxVisitedPoints;
            this.drawCellFill(cell, "lightgreen");
            this.ctx.globalAlpha = 1;
            cell.visitedPoints--;
        }
    }

    draw(){
        this.lineWidth = this.transforms.transformLineWidth(1);
        this.loopGrid(this.drawVisitedPoints);
        this.drawCellFill(this.currCell, this.currentCellColor);
        this.loopGrid(this.drawCell);
    }
}