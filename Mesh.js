class Mesh {
    constructor(gl, meshData, matrix=undefined) {

        let vertices = [];
        let normals = [];
        if (typeof meshData === 'string') {
            meshData = parseOBJFileToJSON(meshData);
//            console.log(meshData);
            for (let i = 0; i < Math.floor(meshData.vertices.length / 3); i++) {
                vertices.push([meshData.vertices[3*i], meshData.vertices[3*i + 1], meshData.vertices[3*i + 2]]);
                normals.push([meshData.normals[3*i], meshData.normals[3*i + 1], meshData.normals[3*i + 2]]);
            }
           // console.log("normals:"+normals);

        } else {
            vertices = meshData.vertices.map(v => [...v]);
            normals = meshData.normals.map(v => [...v]);
        }

        // Apply an optional matrix transformation to the vertices.
        // This transformation is baked into the mesh vertices and only applied once right here
        if (matrix !== undefined) {
            vertices.forEach(vertex => vec3.transformMat4(vertex, vertex, matrix));
            vertices = vertices.map(v => [v[0], v[1], v[2]]);
            let normalMatrix = mat4.invert(mat4.create(), matrix);
            mat4.transpose(normalMatrix, normalMatrix);
            normals.forEach(normal => vec3.transformMat4(normal, normal, normalMatrix));
            normals.forEach(normal => vec3.normalize(normal, normal));
            normals = normals.map(v => [v[0], v[1], v[2]]);
        }

        this.vertexArray = new Float32Array(vertices.flat().flat());
        this.normalArray = new Float32Array(normals.flat().flat());
        this.numVertices = this.vertexArray.length;

        this.VAO = gl.createVertexArray();
        gl.bindVertexArray(this.VAO);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normalArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);
    }
    invertNormals(gl){
        for (let i = 0; i<this.normalArray.length;i++){
            this.normalArray[i] = -this.normalArray[i];
        }
        for (let i=0;i<this.vertexArray.length/3;i++){
            let tmp = this.vertexArray[3*i];
            this.vertexArray[3*i]=this.vertexArray[3*i+1];
            this.vertexArray[3*i+1]=tmp;
        }
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normalArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
    }
}
