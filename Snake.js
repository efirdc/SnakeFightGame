class Snake {
    constructor(head, numChildren, distance, headMesh, headMaterial, bodyMesh, bodyMaterial, shader) {
        this.head = head;
        this.distance = distance;
        this.initID = numChildren;

        this.headDir = vec3.create();
        this.tailDir = vec3.create();
        this.velocity = vec3.create();

        if (this.isHead)
            this.gameObject = new GameObject(new Transform().translate([50, 40, 25]), headMesh, headMaterial, shader);
        else
        {
            let randomOffset = vec3.fromValues(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
            vec3.normalize(randomOffset, randomOffset);

            let newTransform = new Transform()
                .translate(head.gameObject.transform.localPosition)
                .translate(randomOffset);
            this.gameObject = new GameObject(newTransform, bodyMesh, bodyMaterial, shader);
            this.gameObject.material.diffuse = vec3.copy(vec3.create(), this.gameObject.material.diffuse)
        }
        this.transform = this.gameObject.transform;

        this.tail = undefined;
        if (numChildren > 0)
            this.tail = new Snake(this, numChildren - 1, distance,
                headMesh, headMaterial, bodyMesh, bodyMaterial, shader);
    }

    get isHead() {
        return this.head === undefined;
    }

    get isTail() {
        return this.tail === undefined;
    }

    update(state, deltaTime, headVelocity=undefined) {
        let timeScale = Math.min(deltaTime, 1 / 20) * 60;
        let currPos = this.gameObject.transform.globalPosition;

        if (this.isHead) {
            let upDirection = vec3.normalize(vec3.create(), this.gameObject.transform.globalPosition);
            let localUpDirection = this.transform.inverseTransformDirection(upDirection);
            let dist = vec3.length(this.gameObject.transform.globalPosition);
            if (dist < state.ground)
                this.transform.rotateTowards2([0, 0, 1], localUpDirection, 0.005);
            else if (dist > state.ceiling)
                this.transform.rotateTowards2([0, 0, -1], localUpDirection, 0.02);
            else
                this.transform.rotateTowards2([0, 0, -1], localUpDirection, 0.0025);

            let t = Date.now() * 0.25;
            let xAngle = Math.sin(3*t + 8) + Math.sin(2*t - 5);
            let yAngle = Math.sin(3*t - 1) + Math.sin(2*t + 6);
            this.transform.rotate([1, 0, 0], xAngle * 0.1 * timeScale);
            this.transform.rotate([0, 1, 0], yAngle * 0.1 * timeScale);

            let targetPos = state.character.transform.globalPosition;
            let deltaTarget = vec3.sub(vec3.create(), targetPos, currPos);
            vec3.normalize(deltaTarget, deltaTarget);
            let localDeltaTarget = this.transform.inverseTransformDirection(deltaTarget);
            this.transform.rotateTowards2([0, 0, 1], localDeltaTarget, 0.015);
            let finalVelocity = vec3.scale(vec3.create(), this.transform.forward, 2 * timeScale);
            this.gameObject.transform.translate(finalVelocity);


            this.headDir = this.transform.back;
            headVelocity = vec3.length(finalVelocity);
        }
        else {
            let coneDir = this.head.headDir;
            let headPos = this.head.gameObject.transform.globalPosition;

            vec3.sub(this.headDir, currPos, headPos);
            vec3.normalize(this.headDir, this.headDir);

            if (vec3.length(this.gameObject.transform.globalPosition) > (state.ground - 0.5)) {
                let minConeAngle = Math.PI * 45 / 180.;
                let maxConeAngle = Math.PI * 45 / 180.;
                let proj = Math.clamp(vec3.dot(coneDir, this.headDir), -1. + 1e-5, 1. - 1e-5);
                let coneAngle = Math.acos(proj);

                this.gameObject.material.diffuse[2] = 0.;
                if (coneAngle > maxConeAngle || coneAngle < minConeAngle) {
                    let rotAngle = 0.;
                    if (coneAngle > maxConeAngle)
                        rotAngle = coneAngle - maxConeAngle;
                    else
                        rotAngle = minConeAngle - coneAngle;
                    let rotAxis = vec3.cross(vec3.create(), coneDir, this.headDir);
                    let rotMatrix = mat4.fromRotation(mat4.create(), -rotAngle * 0.1, rotAxis);
                    vec3.transformMat4(this.headDir, this.headDir, rotMatrix);
                    this.gameObject.material.diffuse[2] = 1.;
                }
            }

            let newPos = vec3.scaleAndAdd(vec3.create(), headPos, this.headDir, this.distance);
            this.gameObject.transform.localPosition = newPos;

        }
        if (!this.isTail) {
            this.tail.update(state, deltaTime, headVelocity);

            if (!this.isHead) {
                let pointyness = (-vec3.dot(this.headDir, this.tail.headDir) + 1.) * 0.5;
                let flatness = 1 - pointyness;
                this.gameObject.material.diffuse[0] = pointyness;
                this.gameObject.material.diffuse[1] = flatness;
            }

            let tangent = vec3.add(vec3.create(), this.headDir, this.tail.headDir);
            let normal = vec3.scaleAndAdd(vec3.create(), this.headDir, this.tail.headDir, -1.);
            vec3.normalize(normal, normal);
            vec3.normalize(tangent, tangent);
            this.gameObject.transform.localRotation = mat4.targetTo(mat4.create(), [0, 0, 0], tangent, normal);
        }
    }

}