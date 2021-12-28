
class Path {

    constructor(start, end, radius){
        this.start = start.copy();
        this.end = end.copy();
        this.radius = radius;
    }

    draw(c){
        c.lineWidth = this.radius * 2;
        c.strokeStyle = "maroon";
        line(c, this.start.x, this.start.y, this.end.x, this.end.y);

        c.lineWidth = 5;
        c.strokeStyle = "white";
        line(c, this.start.x, this.start.y, this.end.x, this.end.y);

        c.lineWidth = 1;
    }
}

// /**
//  * Path following Catmull-Rom curves.
//  * Converts the Catmull-Rom control points to Bezier control points before drawing with the Bezier function.
//  * Conversion formula adapted from: https://arxiv.org/pdf/2011.08232.pdf
//  * Requires at least 4 control points!!!
//  */
// class CurvedPath {

//     /** 
//      * Looping determines if the start and end points should connect.
//      * Tension should be between 0.0 and 1.0.
//      */
//     constructor(points, radius, looping = false){
//         this.points = points;
//         this.radius = radius;
//         this.looping = looping;

//         // Conversion from Catmull-Rom control points to Bezier control points:
//         this.bezierCurves = [];

//         let startingCurveIndex = 0;
//         let totalCurves = points.length;
//         if (!looping){
//             startingCurveIndex = points.length-1;
//             totalCurves--;
//         }

//         let count = 0;
//         let i = startingCurveIndex;
//         while (count < totalCurves){
//             const p = [];
//             for (let j = 0; j < 4; j++) p.push(points[(i + j) % points.length]);

//             const bezierPoints = [];
//             bezierPoints.push(p[1]);
//             bezierPoints.push(Vector2D.add(p[1], Vector2D.sub(p[2], p[0]).div(6 * tension)));
//             bezierPoints.push(Vector2D.sub(p[2], Vector2D.sub(p[3], p[1]).div(6 * tension)));
//             bezierPoints.push(p[2]);

//             this.bezierCurves.push(bezierPoints);
//             i++;
//             i %= points.length;
//             count++;
//         }
//     }

//     draw(c){
//         // Bezier curves:
//         this.bezierCurves.forEach(p => {
//             c.lineWidth = this.radius * 2;
//             c.strokeStyle = "maroon";
//             bezierCurve(c, p[0], p[1], p[2], p[3]);
    
//             c.lineWidth = 5;
//             c.strokeStyle = "white";
//             bezierCurve(c, p[0], p[1], p[2], p[3]);
//         });

//         c.lineWidth = 1;

//         // Squares on Catmull-Rom control points:
//         this.points.forEach(p => {
//             c.fillStyle = "white";
//             rectangle(c, p.x - this.radius / 2, p.y - this.radius / 2, this.radius, this.radius);
//         });
//     }
// }


/**
 * Heavy inspiration from: https://qroph.github.io/2018/07/30/smooth-paths-using-catmull-rom-splines.html
 */
class ComplexPath {

    constructor(points, radius, looping = false, tension = 0.0){
        this.radius = radius;

        const pCopy = points.slice();
        const n = points.length;

        if (looping){
            pCopy.push(points[0]);
            pCopy.push(points[1]);
            pCopy.splice(0, 0, points[n - 1])
        }
        else {
            const first = Vector2D.mul(points[0], 2).sub(points[1]);
            const last = Vector2D.mul(points[n - 1], 2).sub(points[n - 2]);
            pCopy.splice(0, 0, first);
            pCopy.push(last);
        }

        // Create curves and measure their start lengths (length of the path before that specific curve starts):
        this.curves = [];
        this.startLengths = new Map();
        this.totalLength = 0.0;
        for (let i = 1; i < pCopy.length - 2; i++) {
            const curve = new CatmullRomCurve(pCopy[i-1], pCopy[i], pCopy[i+1], pCopy[i+2], tension);
            this.curves.push(curve);
            this.startLengths.set(curve, this.totalLength);
            this.totalLength += curve.curveLength;
        }
    }

    projectionScalar(p){
        let closestCurve = this.curves[0];
        let closestT = 0.0;
        let closestDist = Number.MAX_VALUE;

        this.curves.forEach(curve => {
            const t = curve.projectionScalar(p);
            const point = curve.interpolate(t);
            const dist = Vector2D.distanceSquared(p, point);

            if (dist < closestDist){
                closestDist = dist;
                closestT = t;
                closestCurve = curve;
            }
        });

        // Determine the t value along the entire path:
        const currentLength = this.startLengths.get(closestCurve) + (closestCurve.curveLength * closestT);
        const t = currentLength / this.totalLength;

        return t;
    }

    interpolate(t){
        const currentLength = t * this.totalLength;
        let currentCurve = this.curves[0];

        this.curves.find(curve => {
            const startLength = this.startLengths.get(curve);
            if (startLength <= currentLength){
                currentCurve = curve;
                return false;
            }
            return true;
        });

        const curveT = (currentLength - this.startLengths.get(currentCurve)) / currentCurve.curveLength;
        return currentCurve.interpolate(curveT);
    }

    draw(c){
        c.lineCap = "round";

        c.lineWidth = this.radius * 2;
        c.strokeStyle = "maroon";
        this.curves.forEach(curve => curve.draw(c));

        c.lineWidth = 5;
        c.strokeStyle = "white";
        this.curves.forEach(curve => curve.draw(c));

        c.lineWidth = 1;
    }
}

class CatmullRomCurve {

    static Parameterization = {
        UNIFORM: 0.0,
        CENTRIPETAL: 0.5,
        CHORDAL: 1.0
    }

    constructor(p0, p1, p2, p3, tension = 0.0, alpha = CatmullRomCurve.Parameterization.CENTRIPETAL, maxLineOffset = 0.2){
        this.p = [p0, p1, p2, p3];
        this.tension = tension;
        this.alpha = alpha;
        this.maxLineOffset = maxLineOffset;

        this.updatePoints();
    }

    updatePoints(){
        // Precalculate coefficients of polynomial so later interpolation is efficient:
        const p = this.p;

        const t0 = 0;
        const t1 = t0 + Math.pow(Vector2D.distance(p[0], p[1]), this.alpha);
        const t2 = t1 + Math.pow(Vector2D.distance(p[1], p[2]), this.alpha);
        const t3 = t2 + Math.pow(Vector2D.distance(p[2], p[3]), this.alpha);

        const mFactor = (1 - this.tension) * (t2 - t1);
        const m1 = Vector2D.sub(p[0], p[1]).div(t0 - t1).sub(Vector2D.sub(p[0], p[2]).div(t0 - t2)).add(Vector2D.sub(p[1], p[2]).div(t1 - t2)).mul(mFactor);
        const m2 = Vector2D.sub(p[1], p[2]).div(t1 - t2).sub(Vector2D.sub(p[1], p[3]).div(t1 - t3)).add(Vector2D.sub(p[2], p[3]).div(t2 - t3)).mul(mFactor);

        this.a = Vector2D.mul(p[1], 2).sub(Vector2D.mul(p[2], 2)).add(m1).add(m2);
        this.b = Vector2D.mul(p[1], -3).add(Vector2D.mul(p[2], 3)).sub(Vector2D.mul(m1, 2)).sub(m2);
        this.c = m1;
        this.d = p[1];

        // Determine which points/vertices to draw line segments between:
        this.determineSegments();

        // Determine the depth when binary searching for the closest t value:
        this.curveLength = this.calculateLength();
        this.searchDepth = Math.ceil(this.curveLength / 30 + 4);
    }

    determineSegments(){
        this.vertices = [];
        this.vertices.push({ pos: this.p[1], t: 0.0 });
        this.vertices.push({ pos: this.p[2], t: 1.0 });
        this.evaluateSegment(this.vertices[0], this.vertices[1], 1);
    }

    evaluateSegment(startVertex, endVertex, depth){
        const midpointPos = Vector2D.midpoint(startVertex.pos, endVertex.pos);
        const midpointT = (startVertex.t + endVertex.t) / 2;
        const actualPos = this.interpolate(midpointT);

        // If the midpoint's position is too far from where it should be (actualPos), divide the line segment
        // into two, add the new vertex, and call this method recursively on each of the new segments:
        const offset = Vector2D.distanceSquared(midpointPos, actualPos);

        if (depth < 2 || offset > Math.pow(this.maxLineOffset, 2)){
            const midpointIndex = this.vertices.indexOf(startVertex) + 1;
            const midpointVertex = { pos: actualPos, t: midpointT };
            this.vertices.splice(midpointIndex, 0, midpointVertex);

            this.evaluateSegment(startVertex, midpointVertex, depth + 1);
            this.evaluateSegment(midpointVertex, endVertex, depth + 1);
        }
    }

    calculateLength(){
        let lengthSquared = 0.0;
        for (let i = 0; i < this.vertices.length - 1; i++){
            const p0 = this.vertices[i].pos;
            const p1 = this.vertices[i+1].pos;
            lengthSquared += Vector2D.distanceSquared(p0, p1);
        }
        return Math.sqrt(lengthSquared);
    }

    interpolate(t){
        return Vector2D.mul(this.a, t*t*t).add(Vector2D.mul(this.b, t*t)).add(Vector2D.mul(this.c, t)).add(this.d);
    }

    projectionScalar(p){
        return this.findT(p, 0.0, 1.0, this.searchDepth);
    }

    findT(p, startT, endT, depthRemaining){
        const quarterDeltaT = (endT - startT) / 4;
        const quarterT = startT + quarterDeltaT;
        const halfT = quarterT + quarterDeltaT;
        const threeQuartersT = halfT + quarterDeltaT;

        const quarterP = this.interpolate(quarterT);
        const threeQuartersP = this.interpolate(threeQuartersT);

        if (Vector2D.distanceSquared(p, quarterP) <= Vector2D.distanceSquared(p, threeQuartersP)){
            if (depthRemaining <= 1) return quarterT;
            return this.findT(p, startT, halfT, depthRemaining - 1);
        }
        else {
            if (depthRemaining <= 1) return threeQuartersT;
            return this.findT(p, halfT, endT, depthRemaining - 1);
        }
    }

    draw(c){
        for (let i = 0; i < this.vertices.length - 1; i++){
            const p0 = this.vertices[i].pos;
            const p1 = this.vertices[i+1].pos;
            line(c, p0.x, p0.y, p1.x, p1.y);
        }
    }
}