class Character {
    constructor(position) {
        // transform1 handles character translation, up direction, and left/right look
        this.transform1 = new Transform().translate(position);

        // transform2 is a child of transform1, and handles up/down look
        this.transform2 = new Transform().translate(position);
        this.transform2.setParent(this.transform1);

        this.velocity = vec3.create();
    }

    get transform() {
        return this.transform2;
    }

    update(state, deltaTime) {
        // Handle inputs
        let inputHandler = state.inputHandler;
        let moveAxis = vec3.fromValues(
            inputHandler.isKeyHeld("KeyD") - inputHandler.isKeyHeld("KeyA"),
            0.,
            inputHandler.isKeyHeld("KeyS") - inputHandler.isKeyHeld("KeyW"),
        );
        vec3.normalize(moveAxis, moveAxis);
        let deltaMouse = inputHandler.deltaMouse;

        let upDirection = vec3.normalize(vec3.create(), this.transform1.globalPosition);
        vec3.scaleAndAdd(this.velocity, this.velocity, upDirection, -0.005);

        let rotAxis = vec3.cross(vec3.create(), upDirection, this.transform1.up);
        let angleDifference = Math.acos(Math.clamp(vec3.dot(upDirection, this.transform1.up), -1., 1.));
        this.transform1.rotate(rotAxis, -angleDifference * 0.005, Space.WORLD);

        // Left/right look
        this.transform1.rotate(upDirection, deltaMouse[0] * Math.PI * -0.001, Space.WORLD);

        // Up/down look
        let rotationAmount = deltaMouse[1] * Math.PI * -0.001;
        let lookAxis = this.transform2.back;
        let altitude = Math.asin(Math.clamp(lookAxis[1], -1., 1.));
        let maxAltitude = Math.PI * 0.5 - 1e-3;
        let maxRotation = maxAltitude - altitude;
        let minRotation = -maxAltitude - altitude;
        rotationAmount = Math.clamp(rotationAmount, minRotation, maxRotation);
        if (Math.abs(rotationAmount) > 1e-5)
            this.transform2.rotate([1, 0, 0], rotationAmount);

        let localVelocity = this.transform1.inverseTransformVector(this.velocity);

        if (vec3.length(this.transform1.globalPosition) < 201.0) {
            localVelocity[1] = 0.;
            let newPosition = vec3.normalize(vec3.create(), this.transform1.globalPosition);
            vec3.scale(newPosition, newPosition, 201.);
            this.transform1.localPosition = newPosition;
        }
        if (inputHandler.isKeyPressed("Space")){
            localVelocity[1] += 0.25;
        }

        let tangentVelocity = vec3.fromValues(localVelocity[0], 0., localVelocity[2]);
        let squareVelocity = vec3.dot(tangentVelocity, tangentVelocity);
        let tangentVelocityNormalized = vec3.normalize(tangentVelocity, tangentVelocity);
        let frictionVector = vec3.scale(vec3.create(), tangentVelocityNormalized, squareVelocity * -2);
        vec3.add(localVelocity, localVelocity, frictionVector);

        /*
        if (this.velocity[0]!=0.0 || this.velocity[2]!=0.0){
            let friction=vec3.fromValues(-0.02*this.velocity[0],0.0,-0.02*this.velocity[2]);
            vec3.add(this.velocity, this.velocity,friction);
        }*/

        vec3.scaleAndAdd(localVelocity, localVelocity, moveAxis, 4 * deltaTime);
        this.velocity = this.transform1.transformVector(localVelocity);

        //let sphereVel=vec3.fromValues(0.0,0.0,0.0);
        //let tmp1=vec3.fromValues(0.0,0.0,0.0);
        //let tmp2=vec3.fromValues(0.0,0.0,0.0);
        //vec3.scale(tmp1, this.transform1.up, this.velocity[1]);
        //vec3.scale(tmp2, this.transform1.right, this.velocity[0]);
        //vec3.scale(sphereVel, forward, this.velocity[2]);
        //vec3.add(sphereVel, sphereVel, tmp1);
        //vec3.add(sphereVel, sphereVel, tmp2);

        //console.log(this.transform.globalPosition);
        this.transform1.translate(this.velocity);
    }
}
