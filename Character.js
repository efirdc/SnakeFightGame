class Character {
    constructor(gl,shader,position) {
        // transform1 handles character translation, up direction, and left/right look
        this.transform1 = new Transform().translate(position);

        // transform2 is a child of transform1, and handles up/down look
        this.transform2 = new Transform();
        this.transform2.setParent(this.transform1);

        this.velocity = vec3.create();

        //let aMesh = new Mesh(gl, "models/point.obj");
        //this.model = new GameObject(new Transform(), aMesh,assets.materials.white, shader);
        //this.model.transform.translate([-0.5, -0.5, -0.5]);
        //this.model.transform.setParent(this.transform1);

        this.onGround = false;
    }

    get transform() {
        return this.transform2;
    }

    update(state, deltaTime) {
        let timeScale = Math.min(deltaTime, 1 / 20) * 60;
        const acceleration = 0.1;
        const groundedFrictionCoeff = -0.5;
        const aerialFrictionCoeff = -0.075;
        const gravity = -0.01;
        const jumpPower = 0.5;
        const jumpBoost = 2.;

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
        this.transform1.rotate(rotAxis, -angleDifference, Space.WORLD);

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
        if (Math.abs(rotationAmount) > 1e-5){
            this.transform2.rotate([1, 0, 0], rotationAmount);
        }
        let localVelocity = this.transform1.inverseTransformVector(this.velocity);

        if (vec3.length(this.transform1.globalPosition) < state.ground+1) {
            this.onGround = true;
            localVelocity[1] = 0.;
            let newPosition = vec3.normalize(vec3.create(), this.transform1.globalPosition);
            vec3.scale(newPosition, newPosition, state.ground+1);
            this.transform1.localPosition = newPosition;
        }

        if (inputHandler.isKeyHeld("Space") && this.onGround) {
            this.onGround = false;
            localVelocity[1] += jumpPower;
            localVelocity[2] *= jumpBoost;
        }
        
        if (vec3.length(this.transform1.globalPosition) > state.ceiling-1) {
            localVelocity[1] = 0.;
            let newPosition = vec3.normalize(vec3.create(), this.transform1.globalPosition);
            vec3.scale(newPosition, newPosition, state.ceiling-1);
            this.transform1.localPosition = newPosition;
        }
 
        let tangentVelocity = vec3.fromValues(localVelocity[0], 0., localVelocity[2]);
        let squareVelocity = vec3.dot(tangentVelocity, tangentVelocity);
        let tangentVelocityNormalized = vec3.normalize(tangentVelocity, tangentVelocity);
        let frictionCoeff = this.onGround ? groundedFrictionCoeff : aerialFrictionCoeff;
        let frictionVector = vec3.scale(vec3.create(), tangentVelocityNormalized, squareVelocity * frictionCoeff * timeScale);
        vec3.add(localVelocity, localVelocity, frictionVector);

        vec3.scaleAndAdd(localVelocity, localVelocity, moveAxis, acceleration * timeScale);
        this.velocity = this.transform1.transformVector(localVelocity);

        let scaledVelocity = vec3.scale(vec3.create(), this.velocity, timeScale);
        this.transform1.translate(scaledVelocity);
        this.handleWorldCollision(state);
    }

    handleWorldCollision(state){
        this.columnCollision(state);
        this.snakeCollision(state);
    }

    columnCollision(state){
        const columnRadius = 11;

        for (let i=0; i<(state.noc*3); i++){
            let dColumn=vec3.normalize(vec3.create(),vec3.fromValues(state.columns[3*i],state.columns[3*i+1],state.columns[3*i+2]));//get the direction of the column
            let scalarProj = vec3.dot(dColumn,this.transform1.globalPosition);
            let center = vec3.scale(vec3.create(),dColumn, scalarProj);

            let deltaCenter = vec3.sub(dColumn, this.transform1.globalPosition, center);
            let centerDist = vec3.length(deltaCenter);

            if (centerDist < columnRadius){
                let deltaDir = vec3.normalize(vec3.create(), deltaCenter);
                let overlap = columnRadius - centerDist;
                let translationVector = vec3.scale(vec3.create(), deltaDir, overlap);
                this.transform1.translate(translationVector);
            }
        }
    }

    snakeCollision(state){
        let snake = state.snake;
        let position = this.transform1.globalPosition;
        let distance = vec3.create();
        vec3.negate(position,position);
        vec3.add(distance, position, snake.gameObject.transform.globalPosition);
        if (vec3.length(distance)<10){
            console.log("OWW, YA GOT ME");
        }
        snake = snake.tail;
        while (snake){
            vec3.add(distance,position, snake.gameObject.transform.globalPosition);
            if (vec3.length(distance)<10){
                console.log("YOURE TOUCHING THE SNAKES BUTT");
            }
            snake=snake.tail;
        }
    }
}
