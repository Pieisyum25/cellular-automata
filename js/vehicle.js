

class Vehicle {

    static BorderBehaviour = {
        NONE: 'none',
        BOUNCE: 'bounce',
        WRAP: 'wrap'
    }

    static count = 1;

    constructor(x, y, radius, borderBehaviour = Vehicle.BorderBehaviour.NONE) {
        this.id = Vehicle.count++;
        this.pos = new Vector2D(x + radius, y + radius);
        this.vel = new Vector2D(0, 0);
        this.acc = new Vector2D(0, 0);
        this.maxSpeed = 10;
        this.maxForce = 0.3;
        this.radius = radius;
        this.borderBehaviour = borderBehaviour;

        this.wanderDir = 0;

        this.pathPoints = [];
        this.pathLength = 0;
    }

    setPosition(pos){ this.pos = pos; }
    setVelocity(vel){ this.vel = vel; }
    setAcceleration(acc){ this.acc = acc; }
    setMaxSpeed(speed){ this.maxSpeed = speed; }
    setMaxForce(force){ this.maxForce = force; }
    setPathLength(length){ this.pathLength = length; }

    seek(targetPos, arrival = false){
        const force = Vector2D.sub(targetPos, this.pos);
        let desiredSpeed = this.maxSpeed;

        // If doing arrival, slow down when near target:
        if (arrival){
            const slowRadius = 0.5 * this.maxSpeed * (this.maxSpeed / this.maxForce + 1);
            const distance = force.getMag();
            if (distance < slowRadius) desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
        }
        force.setMag(desiredSpeed);
        force.sub(this.vel);
        force.limitMag(this.maxForce);
        return force;
    }

    flee(targetPos){
        return this.seek(targetPos).invert();
    }

    pursue(target, c){
        // Increase the length between the target and its future position prediction proportionate to
        // the distance of the vehicle from the target:
        const distComponent = 0.07 * Vector2D.distance(this.pos, target.pos);
        const movePrediction = Vector2D.mul(target.vel, distComponent);
        const posPrediction = Vector2D.add(target.pos, movePrediction);

        // Increase the length between the target and its future position prediction proportionate to
        // how off the vehicle's current velocity is from the target's velocity:
        const velComponent = 0.1 * Vector2D.sub(target.vel, this.vel).getMag();
        posPrediction.add(Vector2D.mul(target.vel, velComponent));

        // Draw predicted position of target:
        if (c !== undefined){
            c.fillStyle = "yellow";
            c.strokeStyle = "orange";
            line(c, target.pos.x, target.pos.y, posPrediction.x, posPrediction.y);
            circle(c, posPrediction.x, posPrediction.y, 5);
        }

        return this.seek(posPrediction);
    }

    evade(target, c){
        return this.pursue(target, c).invert();
    }

    arrive(targetPos){
        return this.seek(targetPos, true);
    }

    wander(c){
        // Small circle in front/centre:
        const wanderPoint = this.vel.copy();
        wanderPoint.setMag(this.radius * 8);
        wanderPoint.add(this.pos);
        c.fillStyle = "white";
        c.strokeStyle = "transparent";
        circle(c, wanderPoint.x, wanderPoint.y, this.radius / 2);

        // Big outer circle and line to centre:
        const wanderRadius = this.radius * 4;
        c.fillStyle = "transparent";
        c.strokeStyle = "white";
        circle(c, wanderPoint.x, wanderPoint.y, wanderRadius);
        line(c, this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);

        // Calculate the current angle along the outer circle, adjusting for vehicle's current direction:
        const theta = this.wanderDir + this.vel.direction();

        // Small coloured circle on the outer circle that vehicle will steer towards, and line to it:
        const x = wanderRadius * Math.cos(theta);
        const y = wanderRadius * Math.sin(theta);
        wanderPoint.add(new Vector2D(x, y));
        c.fillStyle = "yellow";
        c.strokeStyle = "transparent";
        circle(c, wanderPoint.x, wanderPoint.y, this.radius / 2);
        c.strokeStyle = "white";
        line(c, this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);

        // Steer towards coloured circle:
        const steer = wanderPoint.sub(this.pos);
        steer.setMag(this.maxForce);
        this.applyForce(steer);

        // Move coloured circle along outer circle by random displacement:
        const displaceRange = 0.2;
        this.wanderDir += rand(-displaceRange, displaceRange);
    }

    follow(path, c){
        if (path instanceof Path) return this.simpleFollow(path, c);
        else if (path instanceof ComplexPath) return this.complexFollow(path, c);
    }

    simpleFollow(path, c){
        // Calculate future pos:
        const future = this.vel.copy();
        future.mul(10).add(this.pos);
        
        // Calculate projection point (normalPoint):
        const normalPoint = future.projectionPoint(path.start, path.end);

        // Calculate target (along path from normal point):
        const progressSegment = Vector2D.sub(path.end, path.start).setMag(this.radius * 2); // determines direction
        const target = Vector2D.add(normalPoint, progressSegment);

        // Draw points:
        c.strokeStyle = "white";
        line(c, future.x, future.y, normalPoint.x, normalPoint.y);
        c.fillStyle = "yellow";
        c.strokeStyle = "transparent";
        circle(c, future.x, future.y, this.radius / 2);
        c.fillStyle = "white";
        circle(c, normalPoint.x, normalPoint.y, this.radius / 4);
        circle(c, target.x, target.y, this.radius / 2);

        // Steer towards target if future pos is off the path
        const dist = Vector2D.distance(future, normalPoint);
        if (dist > path.radius) return this.seek(target);
        return Vector2D.ZERO;
    }

    complexFollow(path, c){
        // Calculate future pos:
        const future = this.vel.copy();
        future.mul(10).add(this.pos);
        
        // Calculate projection point (normalPoint):
        const normalPoint = path.interpolate(path.projectionScalar(future));

        // Calculate target (along path from normal point):
        //const progressSegment = Vector2D.sub(path.end, path.start).setMag(this.radius * 2); // determines direction
        //const target = Vector2D.add(normalPoint, progressSegment);

        // Draw points:
        c.strokeStyle = "white";
        line(c, future.x, future.y, normalPoint.x, normalPoint.y);
        c.fillStyle = "yellow";
        c.strokeStyle = "transparent";
        circle(c, future.x, future.y, this.radius / 2);
        c.fillStyle = "white";
        circle(c, normalPoint.x, normalPoint.y, this.radius / 4);
        //circle(c, target.x, target.y, this.radius / 2);

        // Steer towards target if future pos is off the path
        const dist = Vector2D.distance(future, normalPoint);
        //if (dist > path.radius) return this.seek(target);
        if (dist > path.radius) return this.seek(normalPoint);
        return Vector2D.ZERO;
    }


    /** Inspired by: https://github.com/CodingTrain/website/blob/main/CodingChallenges/CC_124_Flocking_Boids/P5/boid.js */
    flock(boids, perceptionRadius = 50){
        const perceptionSquared = Math.pow(perceptionRadius, 2);
        const localBoids = boids.filter(boid => (Vector2D.distanceSquared(this.pos, boid.pos) <= perceptionSquared && this != boid));

        const alignment = this.alignment(localBoids);
        const separation = this.separation(localBoids);
        const cohesion = this.cohesion(localBoids);
        const force = Vector2D.add(alignment, separation, cohesion);
        this.applyForce(force.limitMag(this.maxForce));
    }

    alignment(localBoids){
        const steering = new Vector2D();
        let count = 0;

        for (let boid of localBoids){
            steering.add(boid.vel);
            count++;
        }
        if (count > 0){
            steering.div(count);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limitMag(this.maxForce);
        }

        return steering;
    }

    cohesion(localBoids){
        const steering = new Vector2D();
        let count = 0;

        for (let boid of localBoids){
            steering.add(boid.pos);
            count++;
        }
        if (count > 0){
            steering.div(count);
            steering.sub(this.pos);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limitMag(this.maxForce);
        }

        return steering;
    }

    separation(localBoids){
        const steering = new Vector2D();
        let count = 0;
        let colliding = false;


        for (let boid of localBoids){
            const diff = Vector2D.sub(this.pos, boid.pos);
            const distSquared = Vector2D.distanceSquared(this.pos, boid.pos);
            diff.div(distSquared);
            if (distSquared < this.radius) colliding = true; // prevent overlap of boids
            steering.add(diff);
            count++;
        }
        if (count > 0){
            steering.div(count);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            if (!colliding) steering.limitMag(this.maxForce);
        }

        return steering;
    }


    applyForce(force){ this.acc.add(force); }

    applyBorder(canvasSize){
        const left = this.pos.x - this.radius;
        const top = this.pos.y - this.radius;
        const right = this.pos.x + this.radius;
        const bottom = this.pos.y + this.radius;

        if (this.borderBehaviour == Vehicle.BorderBehaviour.BOUNCE){
            if (left <= 0){
                this.pos.setX(this.radius);
                this.vel.invertX();
                this.vel.mul(0.8);
            } 
            else if (right >= canvasSize.x){
                this.pos.setX(canvasSize.x - this.radius);
                this.vel.invertX();
                this.vel.mul(0.8);
            }
            if (top <= 0){
                this.pos.setY(this.radius);
                this.vel.invertY();
                this.vel.mul(0.8);
            }
            else if (bottom >= canvasSize.y){
                this.pos.setY(canvasSize.y - this.radius);
                this.vel.invertY();
                this.vel.mul(0.8);
            }
        }
        else { // wrap:
            let wrapped = false;
            if (left >= canvasSize.x){
                this.pos.setX(-this.radius);
                wrapped = true;
            }
            else if (right <= 0){
                this.pos.setX(canvasSize.x + this.radius);
                wrapped = true;
            }
            if (top >= canvasSize.y){
                this.pos.setY(-this.radius);
                wrapped = true;
            }
            else if (bottom <= 0){
                this.pos.setY(canvasSize.y + this.radius);
                wrapped = true;
            }

            if (wrapped && this.pathLength > 0){
                this.pathPoints.push(undefined);
                while (this.pathPoints.length > this.pathLength) this.pathPoints.shift();   
            }
        }
    }

    update(canvasSize){
        this.vel.add(this.acc);
        this.vel.limitMag(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.set(0, 0);
        if (this.borderBehaviour != Vehicle.BorderBehaviour.NONE) this.applyBorder(canvasSize);

        if (this.pathLength > 0){
            this.pathPoints.push(this.pos.copy());
            while (this.pathPoints.length > this.pathLength) this.pathPoints.shift();
        }
    }

    draw(c){
        if (this.pathLength > 0){
            c.strokeStyle = "orange";
            for (let i = 0; i < this.pathPoints.length-1; i++){
                const p0 = this.pathPoints[i];
                const p1 = this.pathPoints[i+1];
                if (typeof p0 === "undefined" || typeof p1 === "undefined") continue;
                line(c, p0.x, p0.y, p1.x, p1.y);
            }
        }

        c.translate(this.pos.x, this.pos.y);
        const dir = this.vel.direction()
        c.rotate(dir);

        c.fillStyle = "red";
        c.strokeStyle = "maroon";
        triangle(c, -this.radius, -this.radius/2, -this.radius, this.radius/2, this.radius, 0);

        c.rotate(-dir);
        c.translate(-this.pos.x, -this.pos.y);
    }

    toString(){
        return "Vehicle "+this.id+": "+this.pos.toString();
    }

}



class Target extends Vehicle {

    constructor(x, y, radius, speedX, speedY){
        super(x, y, radius, Vehicle.BorderBehaviour.WRAP);
        this.defaultVel = new Vector2D(speedX, speedY);
    }

    update(canvasSize, mousePos){
        // If mouse on canvas, move target towards mouse pos:
        if (mousePos.isValid()) this.vel = Vector2D.sub(mousePos, this.pos).mul(0.5);
        // Else make target travel at default velocity:
        else this.vel = this.defaultVel;

        super.update(canvasSize);
    }

    draw(c){
        c.translate(this.pos.x, this.pos.y);

        c.fillStyle = "red";
        c.strokeStyle = "maroon";
        circle(c, 0, 0, this.radius);

        c.translate(-this.pos.x, -this.pos.y);
    }
}