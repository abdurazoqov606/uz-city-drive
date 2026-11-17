import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Sahna, kamera va renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 60, 260);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 2. Yorug'lik (Quyosh va osmon)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.3);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
scene.add(dirLight);

// 3. Shahar ko'chalari va binolarini generatsiya qilish
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({ color: 0x2e7d32 }) // Yashil maysa
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const roadMat = new THREE.MeshStandardMaterial({ color: 0x262626 });
const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const buildingColors = [0xd1d5db, 0xfde68a, 0xbae6fd, 0xfecaca, 0xe5e7eb];

// Kvadrat shahar kvartallari va asfalt yo'llar
for (let x = -240; x <= 240; x += 60) {
  const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(14, 600), roadMat);
  roadZ.rotation.x = -Math.PI / 2;
  roadZ.position.set(x, 0.02, 0);
  scene.add(roadZ);

  const roadX = new THREE.Mesh(new THREE.PlaneGeometry(600, 14), roadMat);
  roadX.rotation.x = -Math.PI / 2;
  roadX.position.set(0, 0.03, x);
  scene.add(roadX);
}

// Kvartallar ichiga binolar qo'yish
for (let x = -210; x <= 210; x += 60) {
  for (let z = -210; z <= 210; z += 60) {
    if (Math.abs(x) < 40 && Math.abs(z) < 40) continue; // Markaziy yo'l bo'sh tursin
    const h = 12 + Math.random() * 28;
    const bMat = new THREE.MeshStandardMaterial({
      color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
    });
    const building = new THREE.Mesh(new THREE.BoxGeometry(34, h, 34), bMat);
    building.position.set(x, h / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  }
}

// 4. Malibu 3D modelini yuklash
const carContainer = new THREE.Group();
scene.add(carContainer);

let wheels = [];
const loader = new GLTFLoader();
loader.load(
  '/malibu.glb',
  (gltf) => {
    const model = gltf.scene;

    // Model o'lchamini avtomatik normallashtirish (uzunligi ~4.8 metr bo'ladi)
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4.8 / maxDim;
    model.scale.setScalar(scale);

    // G'ildiraklarni yerga tekkizib markazlashtirish
    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = scaledBox.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -scaledBox.min.y, -center.z);

    // G'ildirak tugunlarini topish (aylantirish uchun)
    model.traverse((child) => {
      if (child.name.toLowerCase().includes('wheel')) {
        wheels.push(child);
      }
    });

    carContainer.add(model);
    document.getElementById('loading').style.display = 'none';
  },
  (xhr) => {
    if (xhr.total) {
      const percent = Math.round((xhr.loaded / xhr.total) * 100);
      document.getElementById('progress').innerText = percent + '%';
    }
  },
  (err) => {
    document.getElementById('progress').innerText = 'Xatolik: malibu.glb topilmadi!';
    console.error(err);
  }
);

// 5. Boshqaruv (Telefon tugmalari + Klaviatura)
const keys = { forward: false, backward: false, left: false, right: false };

const bindBtn = (id, key) => {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
  el.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
  el.addEventListener('mousedown', () => keys[key] = true);
  el.addEventListener('mouseup', () => keys[key] = false);
};

bindBtn('gas', 'forward');
bindBtn('brake', 'backward');
bindBtn('left', 'left');
bindBtn('right', 'right');

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') keys.forward = true;
  if (e.key === 'ArrowDown' || e.key === 's') keys.backward = true;
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') keys.forward = false;
  if (e.key === 'ArrowDown' || e.key === 's') keys.backward = false;
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});

// 6. Harakat fizikasi va o'yin sikli
let speed = 0;
const maxSpeed = 0.85;
const speedEl = document.getElementById('speed');

function animate() {
  requestAnimationFrame(animate);

  // Gaz va tormoz
  if (keys.forward) {
    speed = Math.min(speed + 0.015, maxSpeed);
  } else if (keys.backward) {
    speed = Math.max(speed - 0.025, -0.35);
  } else {
    speed *= 0.97; // Tabiiy sekinlashish
  }

  // Rul boshqaruvi (faqat mashina harakatlanayotganda buriladi)
  if (Math.abs(speed) > 0.01) {
    const dir = speed > 0 ? 1 : -1;
    if (keys.left) carContainer.rotation.y += 0.032 * dir;
    if (keys.right) carContainer.rotation.y -= 0.032 * dir;
  }

  // Mashinani oldinga siljitish
  carContainer.position.x += Math.sin(carContainer.rotation.y) * speed;
  carContainer.position.z += Math.cos(carContainer.rotation.y) * speed;

  // G'ildiraklarni aylantirish
  wheels.forEach((w) => {
    w.rotation.x += speed * 0.8;
  });

  // Spidometrni yangilash
  speedEl.innerText = Math.abs(Math.round(speed * 180));

  // Kamera mashina ortidan silliq ergashadi
  const idealOffset = new THREE.Vector3(0, 3.4, -7.8);
  idealOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), carContainer.rotation.y);
  idealOffset.add(carContainer.position);
  camera.position.lerp(idealOffset, 0.12);

  const lookTarget = carContainer.position.clone().add(new THREE.Vector3(0, 1.3, 0));
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
  
