const assets = {
    meshes: { 
    quad: {
    vertices: [
              [-0.5, 0.0, -0.5],[0.5, 0.0, 0.5],[0.5, 0.0, -0.5],
              [-0.5, 0.0, -0.5],[-0.5, 0.0, 0.5],[0.5, 0.0, 0.5]
    ],
    triangles: [
        [0, 1, 2],
        [3, 4, 5]
    ],
    normals: [
        [0.0, 1.0, 0.0],[0.0, 1.0, 0.0],[0.0, 1.0, 0.0],
        [0.0, 1.0, 0.0],[0.0, 1.0, 0.0],[0.0, 1.0, 0.0]
    ],
    },
    },
    materials: {
        purple: {ambient: [0.0,0.0,0.0], diffuse: [1,0.0,1], specular: [1, 1, 1], n: 12.0},
        red: {ambient: [0.0, 0.0, 0.0], diffuse: [1,0.0,0.0], specular: [1, 1, 1], n:5.0},
        green: {ambient: [0.0,0.0,0.0], diffuse: [0.0,1,0.0], specular: [1, 1, 1], n: 20.0},
        white: {ambient: [0.0,0.0,0.0], diffuse: [0.9,0.9,0.9], specular: [1, 1, 1], n: 60.0},
        black: {ambient: [0.0,0.0,0.0], diffuse: [0.01,0.01,0.01], specular: [1, 1, 1], n: 5.0},
        beige:{ambient: [0.05,0.05,0.03], diffuse: [105/255,75/255,0/255], specular: [0.2,0.2,0.15], n:2.0 }
    }
};
