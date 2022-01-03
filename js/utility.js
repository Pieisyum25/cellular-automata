
// Shape Functions:

function line(context, x0, y0, x1, y1){
    with (context){
        beginPath();
        moveTo(x0, y0);
        lineTo(x1, y1);
        stroke();
    }
}

function bezierCurve(context, p0, p1, p2, p3){
    with (context){
        beginPath();
        moveTo(p0.x, p0.y);
        bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        stroke();
    }
}

function rectangle(context, left, top, width, height){
    with (context){
        fillRect(left, top, width, height);
        strokeRect(left, top, width, height);
    }
}

function triangle(context, x0, y0, x1, y1, x2, y2){
    with (context){
        beginPath();
        moveTo(x0, y0);
        lineTo(x1, y1);
        lineTo(x2, y2);
        closePath();
        fill();
        stroke();
    }
}

function circle(context, centreX, centreY, radius){
    with (context){
        beginPath();
        arc(centreX, centreY, radius, 0, 2 * Math.PI);
        fill();
        stroke();
    }
}


// Utility Functions:

function min(a, b){
    return (a < b)? a : b;
}

function max(a, b){
    return (a > b)? a : b;
}

function map(value, oldMin, oldMax, newMin, newMax){
    if (value <= oldMin) return newMin;
    if (value >= oldMax) return newMax;
    const progress = (value - oldMin) / (oldMax - oldMin);
    return interpolate(progress, newMin, newMax);
}

function interpolate(progress, min, max){
    if (progress <= 0) return min;
    if (progress >= 1) return max;
    return min + (progress * (max - min));
}

function rand(min, max){
    return (Math.random() * (max - min)) + min;
}

function randInt(min, max){
    return Math.floor(rand(min, max));
}

function restrict(value, minBound, maxBound){
    return min(maxBound, max(minBound, value));
}

// Vector2D:

class Vector2D {

    constructor(x = 0.0, y = 0.0){
        this.x = x;
        this.y = y;
    }

    set(x, y){
        this.x = x;
        this.y = y;
        return this;
    }

    setX(x){
        this.x = x;
        return this;
    }

    setY(y){
        this.y = y;
        return this;
    }

    setInvalid(){
        this.x = NaN;
        this.y = NaN;
        return this;
    }

    isValid(){
        return !isNaN(this.x) && !isNaN(this.y);
    }

    invert(){
        return this.mul(-1);
    }

    invertX(){
        this.x *= -1;
        return this;
    }

    invertY(){
        this.y *= -1;
        return this;
    }

    add(vector){
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    sub(vector){
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    mul(scalar){
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    div(scalar){
        const reciprocal = 1 / scalar;
        return this.mul(reciprocal);
    }

    getMag(){ return Math.sqrt(this.getMagSquared()); }
    getMagSquared(){ return (this.x * this.x) + (this.y * this.y); }

    setMag(m){ 
        this.unit();
        this.x *= m;
        this.y *= m;
        return this;
    }

    limitMag(m){ 
        if (m < this.getMag()) this.setMag(m);
        return this;
    }

    unit(){
        const m = this.getMag();
        if (m == 0.0) return this;
        else return this.div(m);
    }

    projectionVector(vector){
        const dotProduct = Vector2D.dotProduct(this, vector);
        const vMag = vector.getMag();
        const factor = dotProduct / Math.pow(vMag, 2);
        return Vector2D.mul(vector, factor);
    }

    projectionScalar(vector){
        const dotProduct = Vector2D.dotProduct(this, vector);
        const vMag = vector.getMag();
        return dotProduct / vMag;
    }

    projectionPoint(origin, vector){
        const va = Vector2D.sub(this, origin);
        const vb = Vector2D.sub(vector, origin);
        const sp = va.projectionScalar(vb);
        return vb.setMag(sp).add(origin);
    }

    direction(){ return Math.atan2(this.y, this.x); }

    copy(){ return new Vector2D(this.x, this.y); }

    toString(){ return "(" + this.x + ", " + this.y + ")"; }

    static add(){
        const sum = new Vector2D();
        for (let arg of arguments) sum.add(arg);
        return sum;
    }
    static sub(a, b){ return new Vector2D(a.x - b.x, a.y - b.y); }
    static mul(vector, scalar){ return new Vector2D(vector.x * scalar, vector.y * scalar); }
    static div(vector, scalar){ 
        const reciprocal = 1 / scalar;
        return Vector2D.mul(vector, reciprocal);
    }

    static distanceSquared(a, b){ return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2); }
    static distance(a, b){ return Math.sqrt(this.distanceSquared(a, b)); }

    static dotProduct(a, b){ return ((a.x * b.x) + (a.y * b.y)); }

    static fromAngle(rads, mag = 1.0){ return new Vector2D(mag * Math.cos(rads), mag * Math.sin(rads)); }

    static midpoint(a, b){ return Vector2D.add(a, b).div(2); }

    static randomRange(minX, maxX, minY, maxY){ return new Vector2D(rand(minX, maxX), rand(minY, maxY)); }
    static randomDirection(minAngle = 0, maxAngle = (2 * Math.PI), mag = 1.0){ return Vector2D.fromAngle(rand(minAngle, maxAngle), mag); }

    static get ZERO(){ return ZERO; }
    static get INVALID(){ return INVALID; }

}

const ZERO = new Vector2D(0, 0);
const INVALID = new Vector2D(NaN, NaN);