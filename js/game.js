

function insertSeekAndFleeGames(){

    const setup = function(){
        this.vehicles = [];
        for (let i = 1; i <= 3; i++) this.vehicles.push(new Vehicle(100 * i, 100 * i, 20, Vehicle.BorderBehaviour.BOUNCE));
        this.target = new Target(this.size.x / 2, this.size.y / 2, 10, 4, 1);
    }

    const update = function(){
        this.vehicles.forEach(vehicle => {
            const steering = (this.id == 1)? vehicle.seek(this.target.pos) : vehicle.flee(this.target.pos);
            vehicle.applyForce(steering);
            vehicle.update(this.size);
        });
        
        this.target.update(this.size, this.mousePos);
    }

    const draw = function(){
        this.vehicles.forEach(vehicle => {
            vehicle.draw(this.context);
        });
        this.target.draw(this.context);
    }

    for (let i = 0; i < 2; i++){
        new Game(new Vector2D(500, 500), 50, setup, update, draw, (i == 0)? "seek" : "flee");
    }    
}


function insertPursueAndEvadeGames(){

    const setup = function(){
        this.vehicle = new Vehicle(100, 100, 20, Vehicle.BorderBehaviour.BOUNCE);
        this.target = new Target(this.size.x / 2, this.size.y / 2, 10, 6, 2);
    }

    const update = function(){
        const steering = (this.id == 1)? this.vehicle.pursue(this.target, this.context) : this.vehicle.evade(this.target, this.context);
        this.vehicle.applyForce(steering);
        this.vehicle.update(this.size);
        this.target.update(this.size, this.mousePos);
    }

    const draw = function(){
        this.vehicle.draw(this.context);
        this.target.draw(this.context);
    }

    for (let i = 0; i < 2; i++){
        new Game(new Vector2D(500, 500), 50, setup, update, draw, (i == 0)? "pursue" : "evade");
    }    
}


function insertArriveGame(){
    const setup = function(){
        this.vehicle = new Vehicle(100, 100, 20, Vehicle.BorderBehaviour.BOUNCE);
        this.target = new Target(this.size.x / 2, this.size.y / 2, 10, 0, 0);
    }

    const update = function(){
        const steering = this.vehicle.arrive(this.target.pos);
        this.vehicle.applyForce(steering);
        this.vehicle.update(this.size);
        this.target.update(this.size, this.mousePos);

        if (Vector2D.distanceSquared(this.vehicle.pos, this.target.pos) < 1){
            const r = max(this.vehicle.radius, this.target.radius);
            this.target.pos.set(rand(r, this.size.x - r), rand(r, this.size.y - r));
        }
    }

    const draw = function(){
        this.vehicle.draw(this.context);
        this.target.draw(this.context);
    }

    new Game(new Vector2D(500, 500), 50, setup, update, draw, "arrive");
}


function insertWanderGame(){
    const setup = function(){
        this.vehicle = new Vehicle(100, 100, 20, Vehicle.BorderBehaviour.WRAP);
        this.vehicle.setMaxSpeed(5);
        this.vehicle.setPathLength(100);
    }

    const update = function(){
        if (this.mousePos.isValid()){
            this.vehicle.applyForce(this.vehicle.seek(this.mousePos));
            this.vehicle.wanderDir = 0;
        }
        else this.vehicle.wander(this.context);
        this.vehicle.update(this.size);
    }

    const draw = function(){
        this.vehicle.draw(this.context);
    }

    new Game(new Vector2D(500, 500), 50, setup, update, draw, "wander");
}


function insertFollowGame(){
    insertSimpleFollowGame();
    insertComplexFollowGame();
}

function insertSimpleFollowGame(){
    const setup = function(){
        this.vehicles = [];
        for (let i = 1; i <= 3; i++){
            this.vehicles.push(new Vehicle(150 * i, 150 * i, 20, Vehicle.BorderBehaviour.WRAP));
            this.vehicles[i-1].setMaxSpeed(7);
        }
        const pathY = this.size.y / 2;
        this.path = new Path(new Vector2D(0, pathY), new Vector2D(this.size.x, pathY), 20);
    }

    const update = function(){
        if (this.mousePos.isValid()) this.path.end.y = this.mousePos.y;
        this.context.lineCap = "round";
        this.path.draw(this.context);

        this.vehicles.forEach(vehicle => {
            vehicle.applyForce(vehicle.follow(this.path, this.context));
            vehicle.update(this.size);
        });
    }

    const draw = function(){
        this.vehicles.forEach(vehicle => {
            vehicle.draw(this.context);
        });
    }

    new Game(new Vector2D(500, 500), 50, setup, update, draw, "simple-follow");
}

function insertComplexFollowGame(){
    const setup = function(){
        
        // Zig-zag path:
        this.path = new ComplexPath([new Vector2D(400, 100), new Vector2D(100, 100), new Vector2D(100, 250), new Vector2D(400, 250), new Vector2D(400, 400), new Vector2D(100, 400)], 20, true);
        
        // Random loop:
        // const points = [];
        // const n = randInt(4, 9);
        // for (let i = 0; i < n; i++) points.push(Vector2D.randomRange(50, 450, 50, 450));
        // this.path = new ComplexPath(points, 20, true);

        this.vehicles = [];
        this.vehicles.push(new Vehicle(0, 0, 20));
        this.vehicles.push(new Vehicle(500, 500, 20));
        this.vehicles.forEach(vehicle => vehicle.setMaxSpeed(7));
    }

    const update = function(){
        this.path.draw(this.context);

        this.vehicles.forEach(vehicle => {
            if (this.mousePos.isValid()) vehicle.applyForce(vehicle.seek(this.mousePos));
            else vehicle.applyForce(vehicle.follow(this.path, this.context));
            vehicle.update(this.size);
        });
    }

    const draw = function(){
        this.vehicles.forEach(vehicle => vehicle.draw(this.context));
    }

    new Game(new Vector2D(500, 500), 50, setup, update, draw, "complex-follow");
}


function insertBoidsGame(){
    const setup = function(){
        this.boids = [];
        for (let i = 0; i < 75; i++){
            const boid = new Vehicle(rand(0, this.size.x), rand(0, this.size.y), 10, Vehicle.BorderBehaviour.WRAP);
            boid.setVelocity(Vector2D.randomDirection().mul(rand(2, 4)));
            boid.setMaxForce(1);
            boid.setMaxSpeed(4);
            this.boids.push(boid);
        }
    }

    const update = function(){
        for (let boid of this.boids){
            if (this.mousePos.isValid()) boid.applyForce(boid.seek(this.mousePos));
            else boid.flock(this.boids, 100);
            boid.update(this.size);
        }
    }

    const draw = function(){
        for (let boid of this.boids) boid.draw(this.context);
    }

    new Game(new Vector2D(500, 500), 50, setup, update, draw, "boids");
}


class Game {

    static count = 1;

    constructor(size, fps, setup, update, draw, containerId){
        const self = this;
        this.id = Game.count++;
        this.size = size;
        this.canvas = document.createElement("canvas");
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        document.getElementById(containerId).appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");

        // Set up callbacks:
        this.initEventListeners(this);
        this.update = update;
        this.draw = draw;

        // Start game:
        this.setup = setup;
        this.setup();
        
        // Set frame rate:
        if (fps > 0) this.interval = setInterval(function(){ self.tick(self) }, 1000 / fps);        
    }

    initEventListeners(){
        const self = this;
        this.mousePos = new Vector2D().setInvalid();

        // Keep track of whether the mouse/touch is currently on the canvas:
        this.canvas.addEventListener("mouseout", function(event){ self.mousePos.setInvalid(); });
        this.canvas.addEventListener("touchend", function(event){ self.mousePos.setInvalid(); });
        this.canvas.addEventListener("touchcancel", function(event){ self.mousePos.setInvalid(); });

        // Keep track of mouse/touch position:
        this.canvas.addEventListener("mousemove", function(event){ 
            self.updateMousePos(event.offsetX, event.offsetY); 
        });
        this.canvas.addEventListener("touchmove", function(event){
            const touch = event.targetTouches[0];
            const rect = self.canvas.getBoundingClientRect();
            self.updateMousePos(touch.clientX - rect.left, touch.clientY - rect.top); 
        });
    }

    updateMousePos(absoluteX, absoluteY){
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