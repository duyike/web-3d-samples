import * as THREE from "three";
import { Cloth } from "./components/cloth";
import { OrbitControls } from "./components/OrbitControls";

// params

// force

let container;
let scene, camera, renderer;
let cloth;
const loader = new THREE.TextureLoader();

window.addEventListener("resize", onWindowResize);
init();
anitmate(0);

function init() {
  // container
  container = document.createElement("div");
  document.body.appendChild(container);

  // scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce0ff);
  //   scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);

  // camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(900, 1000, 1500);

  initLights();
  initGround();
  initPoles();
  initFlag();

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;

  container.appendChild(renderer.domElement);

  // controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI - Math.PI / 4;
  controls.maxDistance = 5000;
  controls.target.set(0, 500, 0);
  controls.saveState();
  controls.reset();

  function initLights() {
    scene.add(new THREE.AmbientLight(0x666666));

    const light = new THREE.DirectionalLight(0xdfebff, 1);
    light.position.set(50, 200, 100);
    light.position.multiplyScalar(1.9);
    light.castShadow = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    const d = 300;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 1000;
    scene.add(light);
  }

  function initGround() {
    const groundTexture = loader.load("textures/terrain/grasslight-big.jpg");
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(25, 25);
    groundTexture.anisotropy = 16;
    groundTexture.encoding = THREE.sRGBEncoding;

    const groundMaterial = new THREE.MeshLambertMaterial({
      map: groundTexture,
    });

    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20000, 20000),
      groundMaterial
    );
    groundMesh.position.y = -250;
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
  }

  function initPoles() {
    const polesMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 800, 5));
    polesMesh.position.set(0, 800 / 2 - 250, 0);
    polesMesh.receiveShadow = true;
    polesMesh.castShadow = true;
    scene.add(polesMesh);
  }

  function initFlag() {
    cloth = new Cloth(0.1, 10, 6);
    // flag
    const flagTexture = loader.load(
      "textures/patterns/demon-days-gorillaz.jpeg"
    );
    flagTexture.anisotropy = 16;
    flagTexture.encoding = THREE.sRGBEncoding;

    const flagMaterial = new THREE.MeshLambertMaterial({
      map: flagTexture,
      side: THREE.DoubleSide,
    });

    const flagGeometry = new THREE.ParametricBufferGeometry(
      cloth.clothFunction,
      cloth.w,
      cloth.h
    );
    const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
    flagMesh.position.set(120, 350, 0);
    flagMesh.receiveShadow = true;
    flagMesh.castShadow = true;
    scene.add(flagMesh);

    // gravity
    const GRAVITY = 981 * 0.1;
    const gravity = new THREE.Vector3(0, -GRAVITY, 0);
    cloth.gravity = gravity;
    cloth.clothGeometry = flagGeometry;
    let pins = [];
    for (let i = 0; i < 6; i++) {
      pins.push(i * 11);
    }
    cloth.pins = pins;
  }
}

function anitmate(now) {
  requestAnimationFrame(anitmate);
  cloth.simulate(now);
  cloth.render();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
