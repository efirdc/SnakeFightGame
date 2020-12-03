main();

function main() {
    const canvas = document.querySelector("#mainCanvas");

    let gl = canvas.getContext("webgl2");
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    let state = {
        character: new Character(vec3.fromValues(0.0, 200.5, 0.5)),
        inputHandler: new InputHandler(),
        canvas: canvas,
        lights: new Float32Array(42 * 3),
        lColor: new Float32Array(42 * 3),
        lStrength: new Float32Array(42),
        nol: 0,
        columns: new Float32Array(30),
    };

    // Setting up the lights, in a beautiful circle
    state.nol = 1; // Number Of Lights
    for (var i=0;i<state.nol;i++){
        state.lights[3*i] = 500.0*Math.cos(2*i*Math.PI/state.nol);//x values
        state.lights[1+3*i] = 510.;
        state.lights[2+3*i] = 500.0*Math.sin(2*i*Math.PI/state.nol);
        state.lColor[3*i]=0//1.0-i/3;//red values
        state.lColor[1+3*i]=0.0;//-i/3;//green values
        state.lColor[2+3*i]=1.0//i/3;//blue values
        state.lStrength[i]=1.0;//strength values
    }

    let shader = transformShader(gl);
    let cubeMesh = new Mesh(gl, "models/cube.obj");
    let sphereMesh = new Mesh(gl,"models/sphere8.obj", mat4.fromScaling(mat4.create(),[200.0,200.0,200.0]));
    let cylinderMesh = new Mesh(gl, "models/Cylinder.obj", mat4.fromScaling(mat4.create(),[10.0,600.0,10.0]));

    for (i = 0; i < 10; i++) {
        let dir = vec3.fromValues(normalRandom(), normalRandom(), normalRandom());
        vec3.normalize(dir, dir);
        state.columns[3*i]=dir[0];state.columns[3*i+1]=dir[1];state.columns[3*i+2]=dir[2];
        let pos = vec3.scale(vec3.create(), dir, 600);
        let t1 = new Transform();
        t1.localPosition = pos;
        t1.rotateTowards([0, 1, 0], dir);
        let cylinder = new GameObject(t1, cylinderMesh, assets.materials.white, shader);
    }

    let coolCube = new GameObject(new Transform().translate([0, 0.5, 0]), cubeMesh, assets.materials.red, shader);
    let outerSphere = new Mesh(gl,"models/sphere8.obj", mat4.fromScaling(mat4.create(),[800.0,800.0,800.0]));
    outerSphere.invertNormals(gl);
    let ground = new GameObject(new Transform(), sphereMesh, assets.materials.white, shader);
    let ceiling = new GameObject(new Transform(), outerSphere, assets.materials.white, shader);
    let headMesh = new Mesh(gl, "models/cube.obj", mat4.fromScaling(mat4.create(), [4, 4, 4]));
    let bodyMat = mat4.create();
    mat4.scale(bodyMat, bodyMat, [3., 3., 8]);
    mat4.rotate(bodyMat, bodyMat, Math.PI / 4., [1, 1, 0.]);
    let bodyMesh = new Mesh(gl, "models/smoothCube.obj", bodyMat);
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
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    state.character.update(state, deltaTime);
    state.snake.update(state, deltaTime);

    //update last light as current character position
    state.lights[3*state.nol] = state.character.transform1.globalPosition[0];
    state.lights[1+3*state.nol] = state.character.transform1.globalPosition[1];
    state.lights[2+3*state.nol] = state.character.transform1.globalPosition[2];
    state.lColor[3*state.nol]=0.0;
    state.lColor[1+3*state.nol]=1.0;
    state.lColor[2+3*state.nol]=0.0;
    state.lStrength[state.nol]=1.0;

    //we can have a light on the snakes head! :D
    state.lights[3*state.nol+3] = state.snake.gameObject.transform.globalPosition[0];
    state.lights[4+3*state.nol] = state.snake.gameObject.transform.globalPosition[1];
    state.lights[5+3*state.nol] = state.snake.gameObject.transform.globalPosition[2];
    state.lColor[3*state.nol+3]=1.0;
    state.lColor[4+3*state.nol]=0.0;
    state.lColor[5+3*state.nol]=0.0;
    state.lStrength[state.nol+1]=1.0;

    let projectionMatrix = mat4.create();
    let aspect = state.canvas.clientWidth / state.canvas.clientHeight;
    mat4.perspective(projectionMatrix, 60.0 * Math.PI / 180.0, aspect, 0.1, 10000.);

    GameObject.All.forEach(object => {
        gl.useProgram(object.shader.id);

        let m1 = state.character.transform.worldToLocalMatrix;
        let m2 = object.transform.localToWorldMatrix;
        let m3 = object.transform.normalMatrix
        gl.uniformMatrix4fv(object.shader.uniformLocations.uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(object.shader.uniformLocations.uViewMatrix, false, m1);
        gl.uniformMatrix4fv(object.shader.uniformLocations.uModelMatrix, false, m2);
        gl.uniformMatrix4fv(object.shader.uniformLocations.uNormalMatrix, false, m3);
        gl.uniform3fv(object.shader.uniformLocations.diffuse, object.material.diffuse);
        gl.uniform3fv(object.shader.uniformLocations.ambient, object.material.ambient);
        gl.uniform3fv(object.shader.uniformLocations.specular, object.material.specular);
        gl.uniform3fv(object.shader.uniformLocations.camPos, state.character.transform1.globalPosition);
        gl.uniform1f(object.shader.uniformLocations.nCoeff, object.material.n);
        gl.uniform3fv(object.shader.uniformLocations.lightPos, state.lights);
        gl.uniform3fv(object.shader.uniformLocations.lColor, state.lColor);
        gl.uniform1fv(object.shader.uniformLocations.lStrength, state.lStrength);
        gl.uniform1i(object.shader.uniformLocations.nLights, state.nol+2);//+1 for the character light

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
    uniform vec3 ambient;
    uniform vec3 specular;
    uniform float nCoeff;
    uniform vec3 camPos;
    uniform int nLights;
    uniform vec3[42] lightPos;
    uniform vec3[42] lColor;
    uniform float[42] lStrength;

    vec3 combineLights(){
        vec3 outColor = vec3(0);
        for (int i=0;i<nLights;i++) {
            //ambient term
            vec3 aTerm = ambient*lColor[i]*lStrength[i];
            
            //diffuse term
            vec3 L = normalize(lightPos[i] - fragPos.xyz);
            float N_dot_L = max(dot(N, L), 0.0);
            vec3 dTerm = diffuse * N_dot_L * lColor[i];
            
            //specular term
            vec3 H = L + normalize(camPos-fragPos.xyz);
            H = normalize(H);
            float spec = pow(max(dot(H,N),0.0),nCoeff);
            vec3 sTerm = spec*specular*lColor[i];
            
            outColor += aTerm + sTerm + dTerm;
        }
        return outColor;
    }

    void main() {
       fragColor = vec4(combineLights(),1.0);
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
            "lColor": gl.getUniformLocation(id,"lColor"),
            "nLights": gl.getUniformLocation(id, "nLights"),
            "lStrength": gl.getUniformLocation(id, "lStrength"),
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
