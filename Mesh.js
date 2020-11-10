class Mesh {
    constructor(gl, meshData, matrix=undefined) {
        let vertices = meshData.vertices.map(v => [...v]);
        let triangles = meshData.triangles;
        let normals = meshData.normals.map(v => [...v]);

        // Apply an optional matrix transformation to the vertices.
        // This transformation is baked into the mesh vertices and only applied once right here
        if (matrix !== undefined) {
            vertices.forEach(vertex => vec3.transformMat4(vertex, vertex, matrix));
            vertices = vertices.map(v => [v[0], v[1], v[2]]);
        }

        // Switch from index triangle representation to separate triangle representation
  //      let allVertices = triangles.map(triangleIDs => triangleIDs.map(i => vertices[i]));
        // Compute vertex normals
        /*
        let allNormals = allVertices.map(triangle => {
            let A = vec3.fromValues(...triangle[0]);
            let B = vec3.fromValues(...triangle[1]);
            let C = vec3.fromValues(...triangle[2]);
            let AB = vec3.sub(vec3.create(), B, A);
            let AC = vec3.sub(vec3.create(), C, A);
            let N = vec3.cross(vec3.create(), AB, AC);
            vec3.normalize(N, N);
            return [N[0], N[1], N[2]];
        }).map(N => [N, N, N]);
*/
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
}
