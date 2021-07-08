let canvas;
let engine;
let scene;
let canJump = true;
let canCrouch = true;
let score = 0;

window.onload = startGame;

function startGame() {
  canvas = document.getElementById("canvas");
  engine = new BABYLON.Engine(canvas, true);
  scene = createScene();

  // Press space to jump
  window.addEventListener(
    "keyup",
    function (event) {
      switch (event.keyCode) {
        case 32:
          if (canJump) {
            jump();
          }
          break;
      }
    },
    false
  );

  // press c to crouch
  let keyDown = false;
  document.addEventListener(
    "keydown",
    function () {
      if (keyDown) return;
      keyDown = true;
      switch (event.keyCode) {
        case 67:
          if (canCrouch) {
            crouch();
          }
          break;
      }
    },
    false
  );

  document.addEventListener(
    "keyup",
    function () {
      keyDown = false;
    },
    false
  );

  // Add background sound
  const sound = new BABYLON.Sound(
    "Background music",
    "../sound/music.mp3",
    scene,
    null,
    {
      loop: true,
      autoplay: true,
    }
  );
  sound.setVolume(0.05);
}


function createScene() {
  let scene = new BABYLON.Scene(engine);

  // load the map
  BABYLON.SceneLoader.Load(
    "",
    "../assets/map.babylon",
    engine,
    function (scene) {
      scene.clearColor = new BABYLON.Color3(1, 1, 1);
      scene.ambientColor = new BABYLON.Color3.White();
      scene.gravity = new BABYLON.Vector3(0, -0.5, 0);
      createLight(scene);
      createParticule(scene);
      createGunCamera(scene);
      createHeroDude(scene);

      // Check Collision
      scene.collisionsEnabled = true;
      scene.getNodeByName("Ground").checkCollisions = true;

      // set collision for all houses, trees and christmas
      for (let i = 0; i < scene.meshes.length; i++) {
        let mesh = scene.meshes[i];
        if (mesh.name.indexOf("House") > -1) {
          mesh.checkCollisions = true;
        }
        if (mesh.name.indexOf("Tree") > -1) {
          mesh.checkCollisions = true;
        }
        if (mesh.name.indexOf("Christmas") > -1) {
          mesh.checkCollisions = true;
        }
      }

      // set the collision for the movement bounds mesh of the map
      // and set visibility to zero
      scene.getNodeByName("Bounds").visibility = 0.0;
      scene.getNodeByName("Bounds").checkCollisions = true;

      // Add fog
      scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
      scene.fogColor = scene.clearColor;
      scene.fogStart = 50.0;
      scene.fogEnd = 120.0;


      // add glow to emissive meshes (the houses)
      let glow = new BABYLON.GlowLayer("glow", scene);
      glow.intensity = 0.7;

      engine.runRenderLoop(function () {
        scene.render();
        moveOtherDudes();
      });

      window.addEventListener("resize", function () {
        engine.resize();
      });
    }
  );

  return scene;
}

// move the dudes
function moveOtherDudes() {
  if (scene.dudes) {
    for (let i = 0; i < scene.dudes.length; i++) {
      scene.dudes[i].Dude.move(scene);
    }
  }
}

// create light
function createLight(scene) {
  let light = new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  light.diffuse = new BABYLON.Color3(0.4, 0.76, 0.97);
  light.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5);
}

// create snow particule
function createParticule(scene) {
  let myParticleSystem;

  if (BABYLON.GPUParticleSystem.IsSupported) {
    myParticleSystem = new BABYLON.ParticleHelper.CreateDefault(
      new BABYLON.Vector3(0, 26, 0),
      1000000,
      scene,
      true
    );
    myParticleSystem.activeParticleCount = 200000;
    myParticleSystem.emitRate = 10000;
  } else {
    myParticleSystem = new BABYLON.ParticleSystem("particles", 50000, scene);
    myParticleSystem.emitRate = 4000;
  }

  // set the size of the particules
  myParticleSystem.minEmitBox = new BABYLON.Vector3(-100, 0, -100); // minimum box dimensions
  myParticleSystem.maxEmitBox = new BABYLON.Vector3(100, 0, 100); // maximum box dimensions

  myParticleSystem.minSize = 0.07;
  myParticleSystem.maxSize = 0.08;
  myParticleSystem.minLifeTime = 20;
  myParticleSystem.maxLifeTime = 20;

  myParticleSystem.minEmitPower = -2;
  myParticleSystem.maxEmitPower = -3;
  myParticleSystem.applyGravity = true;

  // add movement noise to the particles
  let noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, scene);
  noiseTexture.animationSpeedFactor = 5;
  noiseTexture.persistence = 2;
  noiseTexture.brightness = 0.5;
  noiseTexture.octaves = 5;
  myParticleSystem.noiseTexture = noiseTexture;
  myParticleSystem.noiseStrength = new BABYLON.Vector3(1, 0.03, 1);

  myParticleSystem.start();
}

// create fps camera with gun
function createGunCamera(scene) {
  let camera = new BABYLON.FreeCamera(
    "FreeCamera",
    new BABYLON.Vector3(9, -20, -21),
    scene
  );
  camera.attachControl(canvas, true);
  camera.setTarget(new BABYLON.Vector3(10, -20, -18.1));
  camera.ellipsoid = new BABYLON.Vector3(1, 1.9, 1);
  camera._needMoveForGravity = true;

  // Collisions
  camera.checkCollisions = true;
  camera.applyGravity = true;

  // Movements
  camera.keysUp.push(90); // z
  camera.keysDown.push(83); // s
  camera.keysLeft.push(81); // q
  camera.keysRight.push(68); // d
  camera.speed = 0.75;
  camera.inertia = 0.75;

  // Camera jump
  jump = function () {
    canJump = false;
    setTimeout(function () {
      canJump = true;
    }, 500);

    let animation = new BABYLON.Animation(
      "jump",
      "position.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    let keys = [
      {
        frame: 0,
        value: camera.position.y,
      },
      {
        frame: 30,
        value: camera.position.y + 3,
      },
    ];
    animation.setKeys(keys);

    let easingFunction = new BABYLON.SineEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    animation.setEasingFunction(easingFunction);

    camera.animations.push(animation);
    scene.beginAnimation(camera, 0, 30, false, 2);
    let jumpSound = new BABYLON.Sound(
      "jump",
      "../sound/quake-jump.mp3",
      scene,
      function () {
        jumpSound.play(), jumpSound.setVolume(0.1);
      }
    );
  };

  // Camera crouch
  crouch = function () {
    canCrouch = false;
    setTimeout(function () {
      canCrouch = true;
    }, 1500);
    let animation = new BABYLON.Animation(
      "crouch",
      "position.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    let keys = [
      {
        frame: 0,
        value: camera.position.y,
      },
      {
        frame: 30,
        value: camera.position.y - 1,
      },
    ];
    animation.setKeys(keys);

    let easingFunction = new BABYLON.SineEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    animation.setEasingFunction(easingFunction);

    camera.animations.push(animation);
    scene.beginAnimation(camera, 0, 30, false, 2);
    let crouchSound = new BABYLON.Sound(
      "crouch",
      "../sound/crouch.mp3",
      scene,
      function () {
        crouchSound.play(), crouchSound.setVolume(0.1);
      }
    );
  };

  createCrosshair(scene, camera)

  // Create gun 

  let gun = BABYLON.Mesh.CreateBox("box", 6.0, scene);
  let barrel = new BABYLON.TransformNode("barrel", scene);
  barrel.visibility = 0.5;
  barrel.position.z = 3;
  barrel.setParent(gun);
  gun.scaling.set(0.1, 0.1, 0.5);
  gun.lookAt(new BABYLON.Vector3(-0.1, 0.1, 1));
  gun.position.set(1, -1, 3);
  gun.parent = camera;



  // create projectile and spark of the projectile
  let orbTexture = new BABYLON.Texture(
    "../assets/orbe.png",
    scene
  );
  let orbMesh = BABYLON.MeshBuilder.CreatePlane("orb", { size: 1 }, scene);
  let orbMat = new BABYLON.StandardMaterial("orbMat", scene);
  orbMat.disableLighting = true;
  orbMat.emissiveTexture = orbTexture;
  orbMat.opacityTexture = orbTexture;
  orbMesh.material = orbMat;
  orbMesh.scaling.scaleInPlace(1.2);

  let sparkMesh = BABYLON.MeshBuilder.CreatePlane(
    "orb",
    { size: 1, sideOrientation: BABYLON.VertexData.DOUBLESIDE },
    scene
  );
  let sparkMat = new BABYLON.StandardMaterial("sparkMat", scene);
  sparkMat.disableLighting = true;
  sparkMesh.material = sparkMat;

  sparkMesh.position.x = -0.5;
  sparkMesh.bakeCurrentTransformIntoVertices();
  sparkMesh.rotation.y = Math.PI / 2;
  sparkMesh.bakeCurrentTransformIntoVertices();

  sparkMesh.lookAt(BABYLON.Vector3.UpReadOnly);

  orbMesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  orbMesh.isVisible = false;
  sparkMesh.isVisible = false;

  scene.onPointerDown = function () {
    let engine = this.getEngine();
    if (!engine.isPointerLock) {
      engine.enterPointerlock();
    }
    let pickResult = this.pick(
      engine.getRenderWidth() / 2,
      engine.getRenderHeight() / 2
    );
    if (pickResult.hit) {
      makeRayMesh(
        barrel.getAbsolutePosition(),
        pickResult.pickedPoint,
        sparkMesh,
        orbMesh
      );
    }
    let fireSound = new BABYLON.Sound(
      "fire",
      "../sound/fire.mp3",
      scene,
      function () {
        fireSound.play(), fireSound.setVolume(0.1);
      }
    );
  };
}

// create trace for the projectile
function makeRayMesh(org, dest, sparkMesh, orbMesh) {
  let dist = BABYLON.Vector3.Distance(org, dest);
  let orb1 = orbMesh.clone('orb1');
  let orb2 = orbMesh.clone('orb2');

  orb1.isVisible = true;
  orb2.isVisible = true;

  let spark1 = sparkMesh.clone('spark');
  spark1.material.emissiveTexture = getSparkTexture(256, 128);
  spark1.material.opacityTexture = spark1.material.emissiveTexture;
  spark1.isVisible = true;
  spark1.scaling.z = dist;
  spark1.position = org.clone();
  spark1.lookAt(dest);

  spark1.registerBeforeRender(function () {
    orb1.visibility -= 0.015;
    orb2.visibility -= 0.015;
    spark1.visibility -= 0.015;
    if (spark1.visibility <= 0) {
      orb1.dispose();
      orb2.dispose();
      spark1.dispose();
    }
  });

  orb1.position = dest.clone();
  orb2.position = org.clone();
}

// draw the trace of the projectile
function getSparkTexture(width, height) {
  let texture = new BABYLON.DynamicTexture(
    "spark",
    { width: width, height: height },
    scene
  );
  let ctx = texture.getContext();
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#5767AF";
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.moveTo(0, height / 2);
  let s = 25;
  for (let i = 0; i < 1000; i++) {
    ctx.lineTo(
      (i / 99) * width,
      height / 2 + Math.random() * s - Math.random() * s);
  }
  ctx.stroke();

  //ctx.beginPath();
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.moveTo(0, height / 2);
  for (let i = 0; i < 1000; i++) {
    ctx.lineTo(
      (i / 99) * width,
      height / 2 + Math.random() * 4 - Math.random() * 4
    );
  }
  ctx.stroke();
  texture.update();
  return texture;
}

function createHeroDude(scene) {
  // load the Dude 3D animated model
  // name, folder, skeleton name
  BABYLON.SceneLoader.ImportMesh(
    null,
    "../assets/models/Mouse/",
    "Mouse.babylon",
    scene,
    (newMeshes, particleSystems, skeletons) => {
      let heroDude = newMeshes[0];
      heroDude.position = new BABYLON.Vector3(0, -50, 0);
      heroDude.showBoundingBox = true;
      // make it smaller
      heroDude.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
      // give it a name so that we can query the scene to get it by name
      heroDude.name = "heroDude";
      // make clones
      scene.dudes = [];
      let randomDude = Math.floor(Math.random() * 20) + 10;
      for (let i = 0; i < randomDude; i++) {
        scene.dudes[i] = doClone(heroDude, skeletons, i, scene);
        scene.beginAnimation(scene.dudes[i].skeleton, 0, 120, true, 1);

        const interval = setInterval(function () {
          let projectile = scene.getMeshByName("spark");
          if (scene.getMeshByName("clone_" + i) != undefined && projectile) {
            if (projectile.intersectsMesh(scene.getMeshByName("clone_" + i))) {
              score += 100;
              console.log( "score = " + score);
              scene.getMeshByName("clone_" + i).dispose();
              clearInterval(interval);
            }
          }
        }, 100);
      }
    }
  );
}

// create others dudes
function doClone(originalMesh, skeletons, id, scene) {
  let myClone;
  let xrand = Math.floor(Math.random() * -20) - 10;
  let zrand = Math.floor(Math.random() * -20);

  myClone = originalMesh.clone("clone_" + id);
  myClone.position = new BABYLON.Vector3(xrand, -22.5, zrand);
  myClone.rotation.y = -190;

  scene.registerBeforeRender(function () {
    myClone.position.x += 0.005;
  });

  if (!skeletons) return myClone;

  // The mesh has at least one skeleton
  if (!originalMesh.getChildren()) {
    myClone.skeleton = skeletons[0].clone("clone_" + id + "_skeleton");
    return myClone;
  } else {
    if (skeletons.length === 1) {
      // the skeleton controls/animates all children, like in the Dude model
      let clonedSkeleton = skeletons[0].clone("clone_" + id + "_skeleton");
      myClone.skeleton = clonedSkeleton;
      let nbChildren = myClone.getChildren().length;

      for (let i = 0; i < nbChildren; i++) {
        myClone.getChildren()[i].skeleton = clonedSkeleton;
      }
      return myClone;
    } else if (skeletons.length === originalMesh.getChildren().length) {
      // each child has its own skeleton
      for (let i = 0; i < myClone.getChildren().length; i++) {
        myClone.getChildren()[i].skeleton() = skeletons[i].clone(
          "clone_" + id + "_skeleton_" + i
        );
      }
      return myClone;
    }
  }

  return myClone;
}

// add crosshair
function createCrosshair(scene, camera) {
  let crossHair = new BABYLON.Mesh.CreateBox("crossHair", 0.1, scene);
  crossHair.parent = camera;
  crossHair.position.z += 3;
  crossHair.material = new BABYLON.StandardMaterial("crossHair", scene);
  crossHair.material.diffuseTexture = new BABYLON.Texture(
    "../assets/gunsight.png",
    scene
  );
  crossHair.material.diffuseTexture.hasAlpha = true;
  crossHair.isPickable = false;
}
