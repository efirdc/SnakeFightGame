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
        let timeScale = Math.min(deltaTime, 1 / 20) * 60;
        const acceleration = 0.1;
        const frictionCoeff = -0.5;
        const gravity = -0.01;

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
        vec3.scaleAndAdd(this.velocity, this.velocity, upDirection, gravity * timeScale);

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
        
        if (vec3.length(this.transform1.globalPosition) > 799.0) {
            localVelocity[1] = 0.;
            let newPosition = vec3.normalize(vec3.create(), this.transform1.globalPosition);
            vec3.scale(newPosition, newPosition, 799.);
            this.transform1.localPosition = newPosition;
        }
 
        let tangentVelocity = vec3.fromValues(localVelocity[0], 0., localVelocity[2]);
        let squareVelocity = vec3.dot(tangentVelocity, tangentVelocity);
        let tangentVelocityNormalized = vec3.normalize(tangentVelocity, tangentVelocity);
        let frictionVector = vec3.scale(vec3.create(), tangentVelocityNormalized, squareVelocity * frictionCoeff * timeScale);
        vec3.add(localVelocity, localVelocity, frictionVector);

        vec3.scaleAndAdd(localVelocity, localVelocity, moveAxis, acceleration * timeScale);
        this.velocity = this.transform1.transformVector(localVelocity);

        let scaledVelocity = vec3.scale(vec3.create(), this.velocity, timeScale);
        this.transform1.translate(scaledVelocity);
        this.handleWorldCollision(state);
    }

    handleWorldCollision(state){
        //column collision
        for (let i=0; i<state.columns.length; i++){
            let height=vec3.length(this.transform1.globalPosition);
            let dColumn=vec3.normalize(vec3.create(),vec3.fromValues(state.columns[3*i],state.columns[3*i+1],state.columns[3*i+2]));//get the direction of the column
            let center = vec3.scale(vec3.create(),dColumn,height);
           // vec3.scale(dColumn,dColumn,height);//get the closest centre point
           // vec3.negate(dColumn,dColumn);//the vector between centre and where we are
            vec3.negate(dColumn,center);
            vec3.add(dColumn,dColumn,this.transform1.globalPosition);
            if (vec3.length(dColumn)<10){
                console.log(vec3.length(dColumn)); //indicates it works
                //This position correction works
                vec3.normalize(dColumn,dColumn);
                vec3.scale(dColumn, dColumn, 11);
                vec3.add(center, dColumn, center);
                this.transform1.localPosition = center;
                //still need to correct velocity
            }
        }
    }
}
