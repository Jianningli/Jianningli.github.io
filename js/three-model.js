// ============================================
// THREE-MODEL.JS — Interactive 3D models
// Uses Three.js r128
// ============================================

(function () {
  const container = document.getElementById('threeContainer');
  if (!container) return;

  // Scene setup
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 4.5);
  container.appendChild(renderer.domElement);
  resize();
  window.addEventListener('resize', resize);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xc8974a, 1.2);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x4a8cb4, 0.8);
  dirLight2.position.set(-3, -2, -2);
  scene.add(dirLight2);

  const pointLight = new THREE.PointLight(0xe8b870, 0.6, 20);
  pointLight.position.set(0, 2, 2);
  scene.add(pointLight);

  // Material palette
  const matWireframe = new THREE.MeshBasicMaterial({
    color: 0xc8974a, wireframe: true, transparent: true, opacity: 0.25
  });

  const matSolid = new THREE.MeshPhongMaterial({
    color: 0x1a1a2e,
    emissive: 0x0a0a14,
    specular: 0xc8974a,
    shininess: 80,
    transparent: true, opacity: 0.92
  });

  const matAccent = new THREE.MeshPhongMaterial({
    color: 0xc8974a,
    emissive: 0x4a2a00,
    specular: 0xffffff,
    shininess: 120,
    transparent: true, opacity: 0.85
  });

  const matBlue = new THREE.MeshPhongMaterial({
    color: 0x1a3a5c,
    emissive: 0x050e1a,
    specular: 0x4a8cb4,
    shininess: 80,
  });

  // ---- MODEL BUILDERS ----

  function buildBrain() {
    const group = new THREE.Group();

    // Main sphere (brain base)
    const brainGeo = new THREE.SphereGeometry(1, 32, 32);
    const brain = new THREE.Mesh(brainGeo, matSolid.clone());
    group.add(brain);

    const wireGeo = new THREE.SphereGeometry(1.02, 16, 16);
    const wire = new THREE.Mesh(wireGeo, matWireframe.clone());
    group.add(wire);

    // Gyri (ridges) - tubes along arcs
    const ridgeCount = 18;
    for (let i = 0; i < ridgeCount; i++) {
      const t = i / ridgeCount;
      const theta = Math.PI * 2 * t;
      const phi = Math.PI * 0.15 + Math.PI * 0.7 * (i % 3) / 2;

      const points = [];
      const segments = 20;
      for (let s = 0; s <= segments; s++) {
        const st = s / segments;
        const angle = theta + st * (Math.PI * 0.6 - Math.random() * 0.3);
        const r = 1.0 + 0.05 * Math.sin(st * Math.PI * 4);
        const x = r * Math.sin(phi + st * 0.4 - 0.2) * Math.cos(angle);
        const y = r * Math.cos(phi + st * 0.4 - 0.2);
        const z = r * Math.sin(phi + st * 0.4 - 0.2) * Math.sin(angle);
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.025, 6, false);
      const tube = new THREE.Mesh(tubeGeo, matAccent.clone());
      group.add(tube);
    }

    // Particle cloud around brain
    const partGeo = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < 200; i++) {
      const r = 1.5 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    partGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({ color: 0xc8974a, size: 0.04, transparent: true, opacity: 0.5 });
    group.add(new THREE.Points(partGeo, partMat));

    return group;
  }

  function buildDNA() {
    const group = new THREE.Group();
    const turns = 3.5;
    const height = 3;
    const radius = 0.8;
    const steps = 120;

    const strand1Points = [];
    const strand2Points = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * height;
      strand1Points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      strand2Points.push(new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius));
    }

    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const curve2 = new THREE.CatmullRomCurve3(strand2Points);

    const strandMat = new THREE.MeshPhongMaterial({ color: 0xc8974a, emissive: 0x3a2000, shininess: 100 });
    const strandMat2 = new THREE.MeshPhongMaterial({ color: 0x4a8cb4, emissive: 0x001a30, shininess: 100 });

    const tube1 = new THREE.Mesh(new THREE.TubeGeometry(curve1, 100, 0.04, 8), strandMat);
    const tube2 = new THREE.Mesh(new THREE.TubeGeometry(curve2, 100, 0.04, 8), strandMat2);
    group.add(tube1, tube2);

    // Rungs
    const rungCount = 22;
    for (let i = 0; i < rungCount; i++) {
      const t = i / (rungCount - 1);
      const p1 = curve1.getPoint(t);
      const p2 = curve2.getPoint(t);

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dir = p2.clone().sub(p1);
      const len = dir.length();

      const rungGeo = new THREE.CylinderGeometry(0.025, 0.025, len, 6);
      const rungMat = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0xe8b870 : 0x6aadd4,
        emissive: i % 2 === 0 ? 0x2a1800 : 0x001a2a,
        shininess: 80
      });
      const rung = new THREE.Mesh(rungGeo, rungMat);
      rung.position.copy(mid);
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      group.add(rung);

      // Spheres at joints
      const sphereGeo = new THREE.SphereGeometry(0.07, 10, 10);
      const s1 = new THREE.Mesh(sphereGeo, strandMat.clone());
      const s2 = new THREE.Mesh(sphereGeo, strandMat2.clone());
      s1.position.copy(p1);
      s2.position.copy(p2);
      group.add(s1, s2);
    }

    return group;
  }

  function buildAbstract() {
    const group = new THREE.Group();

    // Main torus knot
    const knotGeo = new THREE.TorusKnotGeometry(0.8, 0.2, 150, 20, 3, 5);
    const knot = new THREE.Mesh(knotGeo, matAccent.clone());
    group.add(knot);

    // Outer ring
    const ringGeo = new THREE.TorusGeometry(1.4, 0.03, 8, 80);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshPhongMaterial({ color: 0x4a8cb4, emissive: 0x001a2a, shininess: 100, transparent: true, opacity: 0.6 }));
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Small orbiting spheres
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0xe8b870, emissive: 0x3a2000, shininess: 120 })
      );
      sphere.position.set(Math.cos(angle) * 1.4, 0, Math.sin(angle) * 1.4);
      group.add(sphere);
    }

    // Wireframe overlay
    const wireGeo = new THREE.TorusKnotGeometry(0.82, 0.22, 60, 10, 3, 5);
    const wf = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({ color: 0xc8974a, wireframe: true, transparent: true, opacity: 0.1 }));
    group.add(wf);

    return group;
  }

  // ---- State ----
  let currentModel = null;
  let currentType = 'brain';
  let isAnimating = true;
  let animId;

  function clearScene() {
    while (scene.children.length > 0) {
      const obj = scene.children[0];
      if (obj.isLight) { scene.remove(obj); return clearScene(); }
      scene.remove(obj);
    }
    scene.add(ambient, dirLight, dirLight2, pointLight);
  }

  window.setModel = function (type) {
    clearScene();
    currentType = type;

    // Button states
    document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + type);
    if (btn) btn.classList.add('active');

    if (type === 'brain') currentModel = buildBrain();
    else if (type === 'dna') currentModel = buildDNA();
    else currentModel = buildAbstract();

    scene.add(currentModel);
  };

  // Initial model
  setModel('brain');

  // ---- Mouse interaction ----
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let rotVel = { x: 0, y: 0 };

  container.addEventListener('mousedown', e => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging || !currentModel) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    rotVel.y += dx * 0.008;
    rotVel.x += dy * 0.008;
    prevMouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch support
  container.addEventListener('touchstart', e => {
    isDragging = true;
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });

  container.addEventListener('touchmove', e => {
    if (!isDragging || !currentModel) return;
    const dx = e.touches[0].clientX - prevMouse.x;
    const dy = e.touches[0].clientY - prevMouse.y;
    rotVel.y += dx * 0.008;
    rotVel.x += dy * 0.008;
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });

  container.addEventListener('touchend', () => { isDragging = false; });

  // Scroll to zoom
  container.addEventListener('wheel', e => {
    e.preventDefault();
    camera.position.z = Math.max(2.5, Math.min(8, camera.position.z + e.deltaY * 0.005));
  }, { passive: false });

  // ---- Animation loop ----
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (currentModel) {
      // Auto-rotate (slow)
      if (!isDragging) {
        currentModel.rotation.y += 0.003;
        if (currentType === 'dna') {
          currentModel.rotation.y += 0.003;
        }
      }

      // Apply velocity
      currentModel.rotation.y += rotVel.y;
      currentModel.rotation.x += rotVel.x;
      rotVel.x *= 0.9;
      rotVel.y *= 0.9;

      // Breathing
      const breathe = 1 + 0.015 * Math.sin(t * 0.8);
      currentModel.scale.setScalar(breathe);

      // For abstract — orbiting spheres
      if (currentType === 'torus') {
        currentModel.children.forEach((child, i) => {
          if (i >= 2 && i < 8) {
            const baseAngle = (i - 2) / 6 * Math.PI * 2;
            const angle = baseAngle + t * 0.5;
            child.position.set(Math.cos(angle) * 1.4, 0.1 * Math.sin(t + i), Math.sin(angle) * 1.4);
          }
        });
      }
    }

    // Animate point light
    pointLight.position.x = Math.sin(t * 0.4) * 2;
    pointLight.position.z = Math.cos(t * 0.4) * 2;

    renderer.render(scene, camera);
  }

  animate();
})();
