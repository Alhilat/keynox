/**
 * Runtime Three.js 3D WebGL Visualizer Engine
 * 
 * Sets up 3D perspective scenes, directional lighting,
 * and mouse/touch drag-orbit controls for technical models.
 */

export const WEBGL_RUNTIME = `
    const active3DScenes = new Map();

    function initThreeScenes(slideEl) {
      if (!window.THREE) return;
      const containers = slideEl.querySelectorAll('.three-container');
      containers.forEach((container) => {
        if (container.dataset.initialized) return;
        container.dataset.initialized = 'true';

        const modelType = container.getAttribute('data-model') || 'quantum-bloch-sphere';
        const width = container.clientWidth || 550;
        const height = container.clientHeight || 320;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1.2, 4.8);

        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch (e) {
          console.warn('WebGL not supported:', e);
          return;
        }

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.className = 'three-canvas';
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        if (modelType.includes('bloch') || modelType.includes('quantum')) {
          const sphereGeo = new THREE.SphereGeometry(1.5, 26, 16);
          const sphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.18 });
          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          rootGroup.add(sphere);

          const eqGeo = new THREE.TorusGeometry(1.5, 0.022, 16, 64);
          const eqMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const eqRing = new THREE.Mesh(eqGeo, eqMat);
          eqRing.rotation.x = Math.PI / 2;
          rootGroup.add(eqRing);

          const merGeo = new THREE.TorusGeometry(1.5, 0.018, 16, 64);
          const merMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
          const merRing = new THREE.Mesh(merGeo, merMat);
          rootGroup.add(merRing);

          const zPoints = [new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(0, 1.8, 0)];
          const zGeo = new THREE.BufferGeometry().setFromPoints(zPoints);
          const zLine = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 }));
          rootGroup.add(zLine);

          const dir = new THREE.Vector3(0.7, 1.1, 0.6).normalize();
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1.5, 0xf59e0b, 0.28, 0.16);
          rootGroup.add(arrow);

          const partGeo = new THREE.BufferGeometry();
          const partCount = 70;
          const posArr = new Float32Array(partCount * 3);
          for (let p = 0; p < partCount * 3; p += 3) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = 1.5 + (Math.random() - 0.5) * 0.12;
            posArr[p] = r * Math.sin(phi) * Math.cos(theta);
            posArr[p + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArr[p + 2] = r * Math.cos(phi);
          }
          partGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
          const partMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.045, transparent: true, opacity: 0.8 });
          rootGroup.add(new THREE.Points(partGeo, partMat));

        } else if (modelType.includes('chip') || modelType.includes('hardware') || modelType.includes('die')) {
          const substrate = new THREE.Mesh(
            new THREE.BoxGeometry(2.8, 0.12, 2.8),
            new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.2, metalness: 0.8 })
          );
          rootGroup.add(substrate);

          const die = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.16, 1.6),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9, emissive: 0x0284c7, emissiveIntensity: 0.3 })
          );
          die.position.y = 0.05;
          rootGroup.add(die);

          for (let p = -1.2; p <= 1.2; p += 0.4) {
            const pin = new THREE.Mesh(
              new THREE.BoxGeometry(0.08, 0.08, 0.4),
              new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 })
            );
            pin.position.set(p, 0.08, -1.2);
            rootGroup.add(pin);
            const pinS = pin.clone();
            pinS.position.z = 1.2;
            rootGroup.add(pinS);
          }
          rootGroup.rotation.x = 0.65;
          rootGroup.rotation.y = -0.45;

        } else {
          const nodePositions = [];
          const nodeMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x818cf8, emissiveIntensity: 0.6 });
          for (let n = 0; n < 14; n++) {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), nodeMat);
            sphere.position.set(
              (Math.random() - 0.5) * 3.2,
              (Math.random() - 0.5) * 2.2,
              (Math.random() - 0.5) * 2.2
            );
            rootGroup.add(sphere);
            nodePositions.push(sphere.position);
          }
          const linePoints = [];
          for (let a = 0; a < nodePositions.length; a++) {
            for (let b = a + 1; b < nodePositions.length; b++) {
              if (nodePositions[a].distanceTo(nodePositions[b]) < 1.6) {
                linePoints.push(nodePositions[a], nodePositions[b]);
              }
            }
          }
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }));
          rootGroup.add(lines);
        }

        let isDragging = false;
        let prevMouseX = 0;
        let prevMouseY = 0;
        let rotSpeedX = 0;
        let rotSpeedY = 0;

        const onDown = (e) => {
          isDragging = true;
          prevMouseX = e.touches ? e.touches[0].clientX : e.clientX;
          prevMouseY = e.touches ? e.touches[0].clientY : e.clientY;
        };

        const onMove = (e) => {
          if (!isDragging) return;
          const curX = e.touches ? e.touches[0].clientX : e.clientX;
          const curY = e.touches ? e.touches[0].clientY : e.clientY;
          rotSpeedY = (curX - prevMouseX) * 0.006;
          rotSpeedX = (curY - prevMouseY) * 0.006;
          rootGroup.rotation.y += rotSpeedY;
          rootGroup.rotation.x += rotSpeedX;
          prevMouseX = curX;
          prevMouseY = curY;
        };

        const onUp = () => { isDragging = false; };

        container.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        container.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);

        const animate = () => {
          requestAnimationFrame(animate);
          if (!isDragging) {
            rootGroup.rotation.y += 0.004;
            rotSpeedX *= 0.94;
            rotSpeedY *= 0.94;
            rootGroup.rotation.x += rotSpeedX;
            rootGroup.rotation.y += rotSpeedY;
          }
          renderer.render(scene, camera);
        };
        animate();
      });
    }
`;
