
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
    }
    
    update(){

    }

    onClick(pos){
        const row = Math.floor(pos.y / this.cellSize);
        const col = Math.floor(pos.x / this.cellSize);
        if (row < 0 || col < 0 || row >= this.size.y || col >= this.size.x) return;

        const value = this.cells[row][col];
        if (value == 0) this.cells[row][col] = 1;
        else this.cells[row][col] = 0
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