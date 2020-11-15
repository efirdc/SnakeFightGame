class Character {
    constructor(position) {
        // transform1 handles character translation and left/right look
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
        this.velocity[1] -= 0.025;
//      if (this.transform1.globalPosition[1] < 0.5) {
        if (vec3.length(this.transform1.globalPosition)<50.0){
            this.velocity[1] = 0.0;
        }
        if (inputHandler.isKeyPressed("Space")){
            this.velocity[1] = 0.5;
        }
        
        if (this.velocity[0]!=0.0 || this.velocity[2]!=0.0){
            let friction=vec3.fromValues(-0.02*this.velocity[0],0.0,-0.02*this.velocity[2]);
            vec3.add(this.velocity, this.velocity,friction);
        }


        let moveVector = this.transform1.transformDirection(moveAxis);
        vec3.scaleAndAdd(this.velocity, this.velocity, moveVector, 0.2 * deltaTime);
 
        let curve = vec3.create();
        let forward = vec3.create();
        vec3.negate(curve, this.transform1.up);
        vec3.scale(curve,curve,1/vec3.length(this.transform1.globalPosition));
        vec3.add(forward,this.transform1.forward, curve);

        let sphereVel=vec3.fromValues(0.0,0.0,0.0);
        let tmp1=vec3.fromValues(0.0,0.0,0.0);
        let tmp2=vec3.fromValues(0.0,0.0,0.0);
        vec3.scale(tmp1, this.transform1.up, this.velocity[1]);
        vec3.scale(tmp2, this.transform1.right, this.velocity[0]);
        vec3.scale(sphereVel, forward, this.velocity[2]);
        vec3.add(sphereVel, sphereVel, tmp1);
        vec3.add(sphereVel, sphereVel, tmp2);


        this.transform1.translate(sphereVel);
    }
}
