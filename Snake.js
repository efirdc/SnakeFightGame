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
        let currPos = this.gameObject.transform.globalPosition;

        if (this.isHead) {
            let upDirection = vec3.normalize(vec3.create(), this.gameObject.transform.globalPosition);
            if (vec3.length(this.gameObject.transform.globalPosition) > 200.)
                vec3.scaleAndAdd(this.velocity, this.velocity, upDirection, -0.001);
            else
                vec3.scaleAndAdd(this.velocity, this.velocity, upDirection, 0.003);

            vec3.sub(this.tailDir, currPos, this.tail.gameObject.transform.globalPosition);
            vec3.normalize(this.tailDir, this.tailDir);
            //vec3.scaleAndAdd(this.velocity, this.velocity, this.tailDir, 0.0005);

            let targetPos = vec3.scale(vec3.create(), state.character.transform.globalPosition, 0.5);
            let deltaTarget = vec3.sub(vec3.create(), targetPos, currPos);
            vec3.normalize(deltaTarget, deltaTarget);
            vec3.scaleAndAdd(this.velocity, this.velocity, deltaTarget, 0.003);

            let sqrMagnitude = vec3.dot(this.velocity, this.velocity);
            let velocityDir = vec3.normalize(vec3.create(), this.velocity);
            //vec3.scaleAndAdd(this.velocity, this.velocity, velocityDir, -sqrMagnitude * 0.005);

            let finalVelocity = vec3.scale(vec3.create(), this.velocity, 40.0 * deltaTime);
            this.gameObject.transform.translate(finalVelocity);

            vec3.normalize(this.headDir, this.velocity);
            vec3.scale(this.headDir, this.headDir, -1.);
            headVelocity = vec3.length(finalVelocity);
        }
        else {
            let coneDir = this.head.headDir;
            let headPos = this.head.gameObject.transform.globalPosition;

            vec3.sub(this.headDir, currPos, headPos);
            vec3.normalize(this.headDir, this.headDir);

            if (vec3.length(this.gameObject.transform.globalPosition) > 195.) {
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