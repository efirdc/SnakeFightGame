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
        purple: {albedo: [1,0.0,1], metallic: 0.5, roughness: 0.5},
        red: {albedo: [1,0.0,0.0], metallic: 0.8, roughness: 0.3},
        green: {albedo: [0.0,1,0.0], metallic: 0.2, roughness: 0.7},
        white: {albedo: [0.9,0.9,0.9], metallic: 0.3, roughness: 0.2},
        black: {albedo: [0.1,0.1,0.1], metallic: 0.9, roughness: 0.3},
        beige:{albedo: [105/255,75/255,0/255], metallic: 0.2, roughness: 0.8},
    }
};
