main();

Math.clamp = function (x, minValue, maxValue) {
    return Math.min(Math.max(x, minValue), maxValue);
};

function main() {
    const canvas = document.querySelector("#mainCanvas");

    let gl = canvas.getContext("webgl2");
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    let state = {
        character: new Character(vec3.fromValues(0.25, 0.3, 2.5)),
        inputHandler: new InputHandler(),
        canvas: canvas,
    };

    let shader = transformShader(gl);

    let cubeMesh = new Mesh(gl, assets.meshes.cube);
    let planeMesh = new Mesh(gl, assets.meshes.quad, mat4.fromScaling(mat4.create(), [10000, 1, 10000]));

    let coolCube = new GameObject(new Transform().translate([0, 0.5, 0]), cubeMesh, assets.materials.red, shader);
    let ground = new GameObject(new Transform(), planeMesh, assets.materials.green, shader);

    let headMesh = new Mesh(gl, assets.meshes.cube, mat4.fromScaling(mat4.create(), [4, 4, 4]));

    let bodyMat = mat4.create();
    mat4.scale(bodyMat, bodyMat, [3., 3., 8]);
    mat4.rotate(bodyMat, bodyMat, Math.PI / 4., [1, 1, 0.]);
    let bodyMesh = new Mesh(gl, assets.meshes.cube, bodyMat);
    state["snake"] = new Snake(undefined, 200, 6.,
        headMesh, assets.materials.red, bodyMesh, assets.materials.purple, shader);

    let then = 0.0;
    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
        drawScene(gl, deltaTime, state);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function drawScene(gl, deltaTime, state) {
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    state.character.update(state, deltaTime);
    state.snake.update(state, deltaTime);

    let projectionMatrix = mat4.create();
    let aspect = state.canvas.clientWidth / state.canvas.clientHeight;
    mat4.perspective(projectionMatrix, 60.0 * Math.PI / 180.0, aspect, 0.1, 10000.);

    GameObject.All.forEach(object => {
        gl.useProgram(object.shader.id);

        gl.uniformMatrix4fv(object.shader.uniformLocations.uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(object.shader.uniformLocations.uViewMatrix, false, state.character.transform.worldToLocalMatrix);
        gl.uniformMatrix4fv(object.shader.uniformLocations.uModelMatrix, false, object.transform.localToWorldMatrix);
        gl.uniformMatrix4fv(object.shader.uniformLocations.uNormalMatrix, false, object.transform.normalMatrix);

        gl.uniform3fv(object.shader.uniformLocations.diffuse, object.material.diffuse);
        gl.uniform3fv(object.shader.uniformLocations.lightPos, state.character.transform.globalPosition);

        gl.uniform3fv(object.shader.uniformLocations.ambient, object.material.ambient);
        gl.uniform3fv(object.shader.uniformLocations.specular, object.material.specular);
        gl.uniform3fv(object.shader.uniformLocations.camPos, state.character.transform1.globalPosition);
        gl.uniform1f(object.shader.uniformLocations.nCoeff, object.material.n);

        gl.bindVertexArray(object.mesh.VAO);
        gl.drawArrays(gl.TRIANGLES, 0, object.mesh.numVertices);
    });

    state.inputHandler.update();
}


function transformShader(gl) {
    const vsSource =
        `#version 300 es
    in vec3 aPosition;
    in vec3 aNormal;
    
    out vec4 fragPos;
    out vec3 N;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uNormalMatrix;
 
    void main() {
        N = mat3(uNormalMatrix) * aNormal;
        fragPos = uModelMatrix * vec4(aPosition, 1.0);
        gl_Position =  uProjectionMatrix * uViewMatrix * fragPos;
        
    }
    `;

    const fsSource =
        `#version 300 es
    precision highp float;

    out vec4 fragColor;
    in vec3 N;
    in vec4 fragPos;
    
    uniform vec3 diffuse;
    uniform vec3 lightPos;
    uniform vec3 ambient;
    uniform vec3 specular;
    uniform float nCoeff;
    uniform vec3 camPos;

    void main() {

        //ambient term
        vec3 aTerm = ambient;
        //diffuse term
        vec3 L = normalize(lightPos - fragPos.xyz);
        float N_dot_L = abs(dot(N, L));
        vec3 dTerm = diffuse*N_dot_L;
        //specular term
        vec3 H = L + normalize(camPos-fragPos.xyz);
        H = normalize(H);
        float spec = pow(max(dot(H,N),0.0),nCoeff);
        vec3 sTerm = spec*specular*30.0;
        fragColor = vec4((aTerm + dTerm + sTerm), 1.0);
        
      //  fragColor = vec4(diffuse * N_dot_L, 1.0);
    }
    `;

    const id = initShaderProgram(gl, vsSource, fsSource);
    const shader = {
        id: id,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(id, 'aPosition'),
            normalPosition: gl.getAttribLocation(id, 'aNormal'),
        },
        uniformLocations: {
            "uProjectionMatrix": gl.getUniformLocation(id, "uProjectionMatrix"),
            "uViewMatrix": gl.getUniformLocation(id, "uViewMatrix"),
            "uModelMatrix": gl.getUniformLocation(id, "uModelMatrix"),
            "uNormalMatrix": gl.getUniformLocation(id, "uNormalMatrix"),

            "diffuse": gl.getUniformLocation(id, "diffuse"),
            "lightPos": gl.getUniformLocation(id, "lightPos"),
            "ambient": gl.getUniformLocation(id, "ambient"),
            "specular": gl.getUniformLocation(id, "specular"),
            "nCoeff": gl.getUniformLocation(id, "nCoeff"),
            "camPos": gl.getUniformLocation(id, "camPos"),
        },
    };

    for (let attribute in shader.attribLocations) {
        let location = shader.attribLocations[attribute];
        if (location === -1)
            printError('Shader Location Error', `attribute variable ${attribute} could not be located'`);
    }
    for (let uniform in shader.uniformLocations) {
        let location = shader.uniformLocations[uniform];
        if (location === -1)
            printError('Shader Location Error', `uniform variable ${uniform} could not be located'`);
    }

    return shader;
}
