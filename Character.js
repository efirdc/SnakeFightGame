class Character {
    constructor(position) {
        // transform1 handles character translation and left/right look
        this.transform1 = new Transform().translate(position);

        // transform2 is a child of transform1, and handles up/down look
        this.transform2 = new Transform().translate(position);
        this.transform2.setParent(this.transform1);
    }

    get transform() {
        return this.transform2;
    }

    update(state, deltaTime) {
        // Handle inputs
        let inputHandler = state.inputHandler;
        let moveAxis = vec3.fromValues(
            inputHandler.isKeyHeld("KeyD") - inputHandler.isKeyHeld("KeyA"),
            inputHandler.isKeyHeld("Space") - inputHandler.isKeyHeld("ShiftLeft"),
            inputHandler.isKeyHeld("KeyS") - inputHandler.isKeyHeld("KeyW"),
        );
        vec3.normalize(moveAxis, moveAxis);
        let deltaMouse = inputHandler.deltaMouse;

        // Left/right look
        this.transform1.rotate([0, 1, 0], deltaMouse[0] * Math.PI * -0.001, Space.WORLD);

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

        // Translation
        let moveVector = this.transform1.transformDirection(moveAxis);
        moveVector = vec3.scale(vec3.create(), moveVector, 6. * deltaTime);
        this.transform1.translate(moveVector);
    }
}