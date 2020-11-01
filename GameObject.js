class GameObject {
    static All = [];

    constructor(transform, mesh, material, shader) {
        this.transform = transform;
        this.mesh = mesh;
        this.material = Object.assign({}, material);
        this.shader = shader;
        GameObject.All.push(this);
    }
}