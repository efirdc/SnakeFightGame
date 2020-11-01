class Snake {
    constructor(next, numChildren, distance, headMesh, headMaterial, bodyMesh, bodyMaterial, shader) {
        this.next = next;
        this.distance = distance;
        this.initID = numChildren;
        this.velocity = vec3.create();

        if (this.isHead)
            this.gameObject = new GameObject(new Transform().translate([50, 40, 25]), headMesh, headMaterial, shader);
        else
        {
            let randomOffset = vec3.fromValues(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
            vec3.normalize(randomOffset, randomOffset);

            let newTransform = new Transform()
                .translate(next.gameObject.transform.localPosition)
                .translate(randomOffset);
            this.gameObject = new GameObject(newTransform, bodyMesh, bodyMaterial, shader);
        }


        this.prev = undefined;
        if (numChildren > 0)
            this.prev = new Snake(this, numChildren - 1, distance,
                headMesh, headMaterial, bodyMesh, bodyMaterial, shader);
    }

    get isHead() {
        return this.next === undefined;
    }

    get isTail() {
        return this.prev === undefined;
    }

    update(state, deltaTime, headVelocity=undefined) {
        let currPos = this.gameObject.transform.globalPosition;

        if (this.isHead) {
            if (currPos[1] > 0.)
                this.velocity[1] -= 0.004;
            else
                this.velocity[1] += 0.008;

            let prevPos = this.prev.gameObject.transform.globalPosition;
            let deltaPrev = vec3.sub(vec3.create(), currPos, prevPos);
            vec3.normalize(deltaPrev, deltaPrev);
            vec3.scaleAndAdd(this.velocity, this.velocity, deltaPrev, 0.001);

            let targetPos = vec3.scale(vec3.create(), state.character.transform.globalPosition, 0.5);
            let deltaTarget = vec3.sub(vec3.create(), targetPos, currPos);
            vec3.normalize(deltaTarget, deltaTarget);
            vec3.scaleAndAdd(this.velocity, this.velocity, deltaTarget, 0.002);

            let sqrMagnitude = vec3.dot(this.velocity, this.velocity);
            let velocityDir = vec3.normalize(vec3.create(), this.velocity);
            vec3.scaleAndAdd(this.velocity, this.velocity, velocityDir, -sqrMagnitude * 0.001);

            let finalVelocity = vec3.scale(vec3.create(), this.velocity, 60.0 * deltaTime);

            this.gameObject.transform.translate(finalVelocity);
            headVelocity = vec3.length(finalVelocity);
        }
        else {
            let nextPos = this.next.gameObject.transform.globalPosition;
            let prevPos = undefined;
            if (this.isTail)
                prevPos = currPos;
            else
                prevPos = this.prev.gameObject.transform.globalPosition;

            let deltaNext = vec3.sub(vec3.create(), currPos, nextPos);
            let deltaPrev = vec3.sub(vec3.create(), currPos, prevPos);
            let tangent = vec3.sub(vec3.create(), nextPos, prevPos);
            vec3.normalize(deltaNext, deltaNext);
            vec3.normalize(deltaPrev, deltaPrev);
            vec3.normalize(tangent, tangent);
            let normal = vec3.add(vec3.create(), deltaNext, deltaPrev);
            vec3.normalize(normal, normal);
            let halfway = vec3.scaleAndAdd(vec3.create(), tangent, normal, 1.);
            vec3.normalize(halfway, halfway);
            let pointyness = (vec3.dot(deltaNext, deltaPrev) + 1.) * 0.5;
            let flatness = 1. - pointyness;

            this.gameObject.material.diffuse = vec3.fromValues(pointyness, flatness, 0.);

            let coolVec = vec3.create();
            vec3.scaleAndAdd(coolVec, coolVec, halfway, -1.25 * pointyness);
            vec3.scaleAndAdd(coolVec, coolVec, tangent, headVelocity * 2.5 - 0.5);

            let newPos = vec3.add(vec3.create(), currPos, coolVec );
            let newDeltaNext = vec3.sub(vec3.create(), newPos, nextPos);
            vec3.normalize(newDeltaNext, newDeltaNext);

            vec3.scaleAndAdd(newPos, nextPos, newDeltaNext, this.distance);

            this.gameObject.transform.localPosition = newPos;
            this.gameObject.transform.localRotation = mat4.targetTo(
                mat4.create(), [0, 0, 0], tangent, normal);
        }
        if (!this.isTail) {
            this.prev.update(state, deltaTime, headVelocity);
        }
    }

}