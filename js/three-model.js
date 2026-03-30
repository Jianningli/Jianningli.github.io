/* =============================================================
   three-model.js — 3D "MedShapeNet" text widget
   Uses Three.js r128 (already loaded in main.html via CDN)
   ============================================================= */

(function () {

  // ── Wait for DOM ────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', initMedShapeNet);

  function initMedShapeNet() {
    const container = document.getElementById('threeContainer');
    if (!container) return;

    const W = container.clientWidth  || 400;
    const H = container.clientHeight || 300;

    // ── Scene ───────────────────────────────────────────────
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d14);

    // ── Camera ──────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0, 14);

    // ── Renderer ────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const dirLight = new THREE.DirectionalLight(0xffd580, 1.2);
    dirLight.position.set(5, 10, 8);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.5);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    // ── Build "MedShapeNet" from bevelled letter meshes ──────
    // Three.js r128 does not bundle FontLoader/TextGeometry in the
    // minified CDN build, so we construct the text from individual
    // 3D shapes that spell out the letters using simple geometries.
    // Each letter is a thin extruded box-based approximation, which
    // gives a clean tech look without needing an external font file.

    const group = new THREE.Group();
    scene.add(group);

    // Gold material for letters
    const matGold = new THREE.MeshPhongMaterial({
      color    : 0xc9a84c,
      emissive : 0x3a2800,
      shininess: 80,
      specular : 0xffe0a0,
    });

    // Subtle wireframe overlay for depth
    const matWire = new THREE.MeshBasicMaterial({
      color    : 0xffe0a0,
      wireframe: true,
      opacity  : 0.08,
      transparent: true,
    });

    // Build the text as a single sprite-like 3D plane with punched geometry
    // using a canvas texture — this works perfectly with r128 CDN build
    const canvas  = document.createElement('canvas');
    canvas.width  = 1024;
    canvas.height = 256;
    const ctx     = canvas.getContext('2d');

    // Background transparent
    ctx.clearRect(0, 0, 1024, 256);

    // Draw text
    ctx.font         = 'bold 140px "Arial Black", Arial, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Gold gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0,   '#ffe080');
    grad.addColorStop(0.5, '#c9a84c');
    grad.addColorStop(1,   '#7a5c1a');
    ctx.fillStyle = grad;
    ctx.fillText('MedShapeNet', 512, 128);

    const texture  = new THREE.CanvasTexture(canvas);
    const planeGeo = new THREE.PlaneGeometry(12, 3);

    const planeMat = new THREE.MeshBasicMaterial({
      map        : texture,
      transparent: true,
      depthWrite : false,
      side       : THREE.DoubleSide,  // ← add this line
    });

    const textPlane = new THREE.Mesh(planeGeo, planeMat);
    group.add(textPlane);

    // ── Add floating particles around the text ───────────────
    const particleCount = 300;
    const positions     = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color      : 0xc9a84c,
      size       : 0.06,
      transparent: true,
      opacity    : 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // ── Add a subtle grid plane below the text ───────────────
    const gridHelper = new THREE.GridHelper(20, 20, 0x2a2010, 0x1a1408);
    gridHelper.position.y = -2.5;
    group.add(gridHelper);

    // ── Mouse / touch drag controls ─────────────────────────
    let isDragging  = false;
    let prevX = 0, prevY = 0;
    let rotX  = 0, rotY  = 0;
    let velX  = 0, velY  = 0;

    const el = renderer.domElement;

    el.addEventListener('mousedown',  e => { isDragging = true;  prevX = e.clientX; prevY = e.clientY; });
    el.addEventListener('mousemove',  e => {
      if (!isDragging) return;
      velY = (e.clientX - prevX) * 0.005;
      velX = (e.clientY - prevY) * 0.005;
      prevX = e.clientX; prevY = e.clientY;
    });
    el.addEventListener('mouseup',    () => { isDragging = false; });
    el.addEventListener('mouseleave', () => { isDragging = false; });

    el.addEventListener('touchstart', e => {
      isDragging = true;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    });
    el.addEventListener('touchmove', e => {
      if (!isDragging) return;
      velY = (e.touches[0].clientX - prevX) * 0.005;
      velX = (e.touches[0].clientY - prevY) * 0.005;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
      e.preventDefault();
    }, { passive: false });
    el.addEventListener('touchend', () => { isDragging = false; });

    // ── Scroll to zoom ───────────────────────────────────────
    el.addEventListener('wheel', e => {
      camera.position.z = Math.max(5, Math.min(25, camera.position.z + e.deltaY * 0.02));
      e.preventDefault();
    }, { passive: false });

    // ── Resize handler ───────────────────────────────────────
    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    // ── Animation loop ───────────────────────────────────────
    let frame = 0;
    function animate() {
      requestAnimationFrame(animate);
      frame++;

      // Apply drag velocity with damping
      rotY += velY;
      rotX += velX;
      velY *= 0.9;
      velX *= 0.9;

      // Slow auto-rotation when not dragging
      if (!isDragging) {
        velY += 0.0005;
      }

      group.rotation.y = rotY;
      group.rotation.x = Math.max(-0.5, Math.min(0.5, rotX)); // clamp vertical

      // Gently pulse particles
      particles.rotation.y = frame * 0.001;

      renderer.render(scene, camera);
    }

    animate();
  }

})();