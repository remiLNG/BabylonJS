class Dude {
  constructor(dudeMesh, speed) {
    this.dudeMesh = dudeMesh;

    if (speed) this.speed = speed;
    else this.speed = 1;

    // in case, attach the instance to the mesh itself, in case we need to retrieve
    // it after a scene.getMeshByName that would return the Mesh
    // SEE IN RENDER LOOP !
    dudeMesh.Dude = this;
  }
 
}
