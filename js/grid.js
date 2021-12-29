
class Grid {

    constructor(size, cellSize){
        this.size = size;
        this.cellSize = cellSize;
        this.dimensions = Vector2D.mul(size, cellSize);
        this.cells = new Array(this.size.y);
        for (let row = 0; row < this.size.y; row++){
            this.cells[row] = new Array(this.size.x);
            this.cells[row].fill(0);
        }

        this.playing = false;
    }

    onClick(pos){
        if (this.playing) return;
        const row = Math.floor(pos.y / this.cellSize);
        const col = Math.floor(pos.x / this.cellSize);
        if (this.outOfBounds(row, col)) return;

        const value = this.cells[row][col];
        if (value == 0) this.cells[row][col] = 1;
        else this.cells[row][col] = 0
    }

    togglePlaying(){
        this.playing = !this.playing;
    }

    update(){
        if (!this.playing) return;

        const cellsCopy = new Array(this.size.y);
        for (let row = 0; row < this.size.y; row++) cellsCopy[row] = new Array(this.size.x);

        for (let row = 0; row < this.size.y; row++){
            for (let col = 0; col < this.size.x; col++){
                const neighbours = this.countNeighbours(row, col);
                let result = this.cells[row][col];

                if (neighbours < 2) result = 0;
                if (neighbours > 3) result = 0;
                if (neighbours == 3) result = 1;
                cellsCopy[row][col] = result;
            }
        }

        this.cells = cellsCopy;
    }

    countNeighbours(row, col){
        let neighbours = 0;

        for (let nrow = row - 1; nrow <= row + 1; nrow++){
            for (let ncol = col - 1; ncol <= col + 1; ncol++){
                if (nrow == row && ncol == col) continue;
                if (!this.outOfBounds(nrow, ncol) && this.cells[nrow][ncol] == 1) neighbours++;
            }
        }
        return neighbours;
    }

    outOfBounds(row, col){
        return (row < 0 || col < 0 || row >= this.size.y || col >= this.size.x);
    }

    draw(c){
        c.strokeStyle = "grey";
        for (let row = 0; row < this.size.y; row++){
            for (let col = 0; col < this.size.x; col++){

                const value = this.cells[row][col];
                if (value == 0) c.fillStyle = "black";
                else c.fillStyle = "white";

                const x = col * this.cellSize;
                const y = row * this.cellSize;
                rectangle(c, x, y, this.cellSize, this.cellSize);
            }
        }
    }
}