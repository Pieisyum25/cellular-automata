
const games = [];

function insertLifeGame(){

    for (let i = 0; i < 2; i++){
        const setup = function(){
            this.grid = new Grid(new Vector2D(25, 25), 20, (i == 0)? Grid.RuleSet.SIMPLE_LIFE : Grid.RuleSet.COMPLEX_LIFE);
        }

        const update = function(){
            this.grid.update();
        }

        const draw = function(){
            this.grid.draw(this.context);
        }

        const onClick = function(x, y){
            const pos = new Vector2D(x, y);
            this.grid.onClick(pos);
        }

        games.push(new Game(new Vector2D(500, 500), 50, 5, setup, update, draw, onClick, (i == 0)? "simple-life" : "complex-life"));
    }
}

function toggleGameOne(){ toggleGame(0); }
function toggleGameTwo(){ toggleGame(1); }

function toggleGame(index){
    const game = games[index];
    game.playing = !game.playing;
    if (game.playing) game.setInterval(game.playFps);
    else game.setInterval(game.pauseFps);
    game.grid.togglePlaying();
}


class Game {

    static count = 1;

    constructor(size, pauseFps, playFps, setup, update, draw, onClick, containerId){
        this.id = Game.count++;
        this.size = size;
        this.playing = false;
        this.pauseFps = pauseFps;
        this.playFps = playFps;
        this.canvas = document.createElement("canvas");
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        document.getElementById(containerId).appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");

        // Set up callbacks:
        this.initEventListeners(this);
        this.update = update;
        this.draw = draw;
        this.onClick = onClick;

        // Start game:
        this.setup = setup;
        this.setup();
        
        // Set frame rate:
        this.setInterval(pauseFps); 
    }

    setInterval(fps){
        const self = this;
        if (this.interval !== undefined) clearInterval(this.interval);
        if (fps > 0) this.interval = setInterval(function(){ self.tick(self) }, 1000 / fps); 
    }

    initEventListeners(){
        const self = this;

        // On releasing click or touch:
        this.canvas.addEventListener("mouseup", function(event){ self.onClick(event.offsetX, event.offsetY); });
        this.canvas.addEventListener("touchend", function(event){ self.onTouch(self, event); });
        this.canvas.addEventListener("touchcancel", function(event){ self.onTouch(self, event); });
    }

    onTouch(self, event){
        const touch = event.targetTouches[0];
        const rect = self.canvas.getBoundingClientRect();
        self.onClick(touch.clientX - rect.left, touch.clientY - rect.top); 
    }

    onClick(absoluteX, absoluteY){
        this.mousePos.set(absoluteX, absoluteY);
    }

    clearCanvas(){
        this.context.clearRect(0, 0, this.size.x, this.size.y);
    }

    tick(self){
        self.clearCanvas();
        self.update();
        self.draw();
    }


}