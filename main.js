/* ============================================
   THREE.JS BACKGROUND ENVIRONMENTS
   Different 3D scenes per section
============================================ */
(function() {
  if (typeof THREE === 'undefined') return;

  const clock = new THREE.Clock();
  const scenes = [];

  // Helper to create a scene wrapper
  function createScene(canvasId, setupFn, renderFn) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    
    // Set initial size
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    const data = setupFn(scene, camera, renderer);

    const obj = { canvas, renderer, scene, camera, renderFn, data };
    scenes.push(obj);
    return obj;
  }

  // 1. HERO - Volumetric Fog & Holographic Shape
  createScene('bg-hero-fog', (scene, camera) => {
    camera.position.z = 5;
    
    // Background Fog Plane
    const fogGeo = new THREE.PlaneGeometry(15, 15, 32, 32);
    const fogMat = new THREE.MeshBasicMaterial({ 
      color: 0x2e1065, 
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const plane = new THREE.Mesh(fogGeo, fogMat);
    plane.rotation.x = -Math.PI / 2.5;
    plane.position.y = -3;
    scene.add(plane);
    
    // The "Holographic Planet" / Core Geometry (on the right side)
    const coreGeo = new THREE.IcosahedronGeometry(2, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(2.5, 0, 0); // Positioned to the right to match grid layout
    scene.add(core);

    // Inner solid core
    const innerGeo = new THREE.IcosahedronGeometry(1.5, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x4338ca,
      transparent: true,
      opacity: 0.3
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    core.add(innerCore);

    // Floating ambient particles
    const pGeo = new THREE.BufferGeometry();
    const pMat = new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.04, transparent: true, opacity: 0.5 });
    const pCount = 300;
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount*3; i++) {
       pPos[i*3] = (Math.random() - 0.5) * 15;
       pPos[i*3+1] = (Math.random() - 0.5) * 15;
       pPos[i*3+2] = (Math.random() - 0.5) * 10 - 2;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    return { plane, core, points };
  }, (data, t, mx, my) => {
    data.plane.rotation.z = t * 0.1;
    data.plane.position.y = -3 + Math.sin(t * 0.5) * 0.5;
    
    data.core.rotation.y = t * 0.2;
    data.core.rotation.x = t * 0.1;
    data.core.position.y = Math.sin(t * 1.5) * 0.2; // Gentle float
    data.core.rotation.y += mx * 0.1; // Mouse react
    data.core.rotation.x += my * 0.1;

    data.points.rotation.y = t * 0.05 + mx * 0.1;
    data.points.rotation.x = t * 0.02 + my * 0.1;
  });

  // 2. ABOUT - Glass Orbs
  createScene('bg-about', (scene, camera) => {
    camera.position.z = 8;
    const orbs = [];
    const geo = new THREE.SphereGeometry(1.2, 32, 32);
    for(let i=0; i<6; i++) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x7c3aed,
        transmission: 0.9,
        opacity: 1,
        metalness: 0.2,
        roughness: 0.1,
        ior: 1.5,
        thickness: 1.5
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*5);
      const speed = Math.random() * 0.3 + 0.1;
      orbs.push({ mesh, speed, offset: Math.random() * Math.PI * 2 });
      scene.add(mesh);
    }
    const light = new THREE.PointLight(0xa78bfa, 3, 50);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x222222));
    return { orbs };
  }, (data, t) => {
    data.orbs.forEach(orb => {
      orb.mesh.position.y += Math.sin(t * orb.speed + orb.offset) * 0.02;
      orb.mesh.rotation.x += 0.005;
      orb.mesh.rotation.y += 0.005;
    });
  });

  // 3. SKILLS - Galaxy Vortex
  createScene('bg-skills', (scene, camera) => {
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    const particleCount = 800;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorInside = new THREE.Color(0xa78bfa);
    const colorOutside = new THREE.Color(0x4338ca);

    for(let i=0; i<particleCount; i++) {
      // Golden ratio spiral
      const r = Math.random() * 10;
      const theta = r * 2.5 + (Math.random()-0.5) * 1.5; // Branches + noise
      
      const x = Math.cos(theta) * r;
      const y = (Math.random() - 0.5) * (1 - r*0.08) * 3; // Thicker at center
      const z = Math.sin(theta) * r;

      pos[i*3] = x;
      pos[i*3+1] = y;
      pos[i*3+2] = z;

      // Color interpolation based on radius
      const mixedColor = colorInside.clone().lerp(colorOutside, r / 10);
      colors[i*3] = mixedColor.r;
      colors[i*3+1] = mixedColor.g;
      colors[i*3+2] = mixedColor.b;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const mat = new THREE.PointsMaterial({ 
      size: 0.12, 
      vertexColors: true, 
      transparent: true, 
      opacity: 0.8,
      blending: THREE.AdditiveBlending 
    });
    
    const galaxy = new THREE.Points(geo, mat);
    scene.add(galaxy);

    return { galaxy };
  }, (data, t, mx, my) => {
    data.galaxy.rotation.y = t * -0.1 + mx * 0.2;
    data.galaxy.rotation.x = my * 0.2;
    data.galaxy.rotation.z = t * 0.05;
  });

  // 4. PROJECTS - Floating Grid
  createScene('bg-projects', (scene, camera) => {
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);
    const grid = new THREE.GridHelper(30, 30, 0x7c3aed, 0x2e1065);
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    scene.add(grid);
    return { grid };
  }, (data, t) => {
    data.grid.position.z = (t * 2) % 1;
  });

  // 5. JOURNEY - Warp Starfield
  createScene('bg-journey', (scene, camera) => {
    camera.position.z = 0;
    const starCount = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    
    for(let i=0; i<starCount; i++) {
      pos[i*3] = (Math.random() - 0.5) * 40;
      pos[i*3+1] = (Math.random() - 0.5) * 40;
      pos[i*3+2] = Math.random() * -50; // Stars deep in screen
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.1, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    return { stars, posArray: pos };
  }, (data, t, mx, my) => {
    const pos = data.stars.geometry.attributes.position.array;
    for(let i=0; i<pos.length/3; i++) {
      pos[i*3+2] += 0.2; // Move forward
      if (pos[i*3+2] > 5) {
         pos[i*3+2] = -50; // Reset deep
         pos[i*3] = (Math.random() - 0.5) * 40;
         pos[i*3+1] = (Math.random() - 0.5) * 40;
      }
    }
    data.stars.geometry.attributes.position.needsUpdate = true;
    data.stars.rotation.z = t * 0.05 + mx * 0.1;
  });

  // 6. CONTACT - Massive 3D Wireframe Torus Knot
  createScene('bg-contact', (scene, camera) => {
    camera.position.z = 12;
    
    // Massive Torus Knot
    const geo = new THREE.TorusKnotGeometry(4, 1.2, 120, 16);
    const mat = new THREE.MeshBasicMaterial({ 
      color: 0x7c3aed, 
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const torus = new THREE.Mesh(geo, mat);
    scene.add(torus);

    // Glowing core inside torus
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x4338ca, transparent: true, opacity: 0.1 });
    const core = new THREE.Mesh(new THREE.TorusKnotGeometry(3.9, 1.1, 64, 8), coreMat);
    torus.add(core);

    // Orbiting particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 300;
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
      pPos[i*3] = (Math.random() - 0.5) * 20;
      pPos[i*3+1] = (Math.random() - 0.5) * 20;
      pPos[i*3+2] = (Math.random() - 0.5) * 20;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.1, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    
    return { torus, particles };
  }, (data, t, mx, my) => {
    data.torus.rotation.x = t * 0.1 + my * 0.3;
    data.torus.rotation.y = t * 0.15 + mx * 0.3;
    data.torus.position.y = Math.sin(t * 0.8) * 0.5;

    data.particles.rotation.y = t * 0.05 + mx * 0.1;
    data.particles.rotation.z = t * 0.02 + my * 0.1;
  });

  // Handle Resize
  window.addEventListener('resize', () => {
    scenes.forEach(s => {
      const w = s.canvas.clientWidth;
      const h = s.canvas.clientHeight;
      if (s.canvas.width !== w || s.canvas.height !== h) {
        s.renderer.setSize(w, h, false);
        s.camera.aspect = w / h;
        s.camera.updateProjectionMatrix();
      }
    });
  });

  // Mouse Tracking
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Render Loop
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    
    scenes.forEach(s => {
      // Only render if canvas is in viewport
      const rect = s.canvas.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        // Handle dynamic resizing
        const w = s.canvas.clientWidth;
        const h = s.canvas.clientHeight;
        if (s.canvas.width !== w || s.canvas.height !== h) {
          s.renderer.setSize(w, h, false);
          s.camera.aspect = w / h;
          s.camera.updateProjectionMatrix();
        }
        
        s.renderFn(s.data, t, mx, my);
        s.renderer.render(s.scene, s.camera);
      }
    });
  }
  animate();
})();

/* ============================================
   CUSTOM CURSOR
============================================ */
(function() {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursor-ring');
  let mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  }, { passive: true });

  (function animRing() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  const sel = 'a, button, .project-card, .float-tag, .social-link, .stat-item, .badge, .timeline-item, .btn';
  document.querySelectorAll(sel).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });
})();

/* ============================================
   NAVBAR SCROLL
============================================ */
(function() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
})();

/* ============================================
   MOBILE MENU
============================================ */
(function() {
  const toggle = document.getElementById('mobile-toggle');
  const menu   = document.getElementById('mobile-menu');
  const close  = document.getElementById('mobile-close');
  toggle.addEventListener('click', () => menu.classList.add('open'));
  close.addEventListener('click',  () => menu.classList.remove('open'));
  document.querySelectorAll('.mobile-nav-link').forEach(l =>
    l.addEventListener('click', () => menu.classList.remove('open'))
  );
})();

/* ============================================
   TYPEWRITER EFFECT
============================================ */
(function() {
  const el = document.getElementById('typewriter');
  const phrases = [
    'Software Development', 'Full-Stack Engineering', 
    'AI & Machine Learning', 'Cloud Architecture', 
    'Scalable Systems', 'Creative Coding'
  ];
  let pi = 0, ci = 0, deleting = false, pause = 0;
  function tick() {
    const word = phrases[pi];
    if (pause > 0) { pause--; setTimeout(tick, 50); return; }
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; pause = 34; }
      setTimeout(tick, 82);
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; pause = 10; }
      setTimeout(tick, 46);
    }
  }
  setTimeout(tick, 1800);
})();

/* ============================================
   SCROLL REVEAL
============================================ */
(function() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .timeline-item').forEach(el => obs.observe(el));
})();

/* ============================================
   MAGNETIC BUTTONS
============================================ */
(function() {
  document.querySelectorAll('.magnetic-wrap').forEach(wrap => {
    const btn = wrap.querySelector('.btn');
    wrap.addEventListener('mousemove', e => {
      const rect = wrap.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) * 0.38;
      const dy = (e.clientY - rect.top  - rect.height/ 2) * 0.38;
      btn.style.transform = `translate(${dx}px, ${dy}px) translateY(-2px)`;
    });
    wrap.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

/* ============================================
   HERO TEXT PARALLAX (subtle cursor follow)
============================================ */
(function() {
  const heroInner = document.querySelector('.hero-inner');
  if (!heroInner) return;
  document.addEventListener('mousemove', e => {
    const rx = (e.clientX / window.innerWidth  - 0.5) * 8;
    const ry = (e.clientY / window.innerHeight - 0.5) * 5;
    heroInner.style.transform = `translate(${rx}px, ${ry}px)`;
  }, { passive: true });
})();

/* ============================================
   FLOATING SKILL TAGS — LOW GRAVITY DRIFT
============================================ */
(function() {
  const tags = document.querySelectorAll('.float-tag');
  const arena = document.getElementById('skills-arena');
  if (!arena) return;

  // Fade in tags staggered
  tags.forEach((tag, i) => {
    setTimeout(() => tag.classList.add('placed'), 300 + i * 80);
  });

  // Ambient slow drift per tag
  tags.forEach((tag, i) => {
    const phaseX = i * 0.73;
    const phaseY = i * 1.13;
    const ampX   = 7 + (i % 4) * 2;
    const ampY   = 5 + (i % 3) * 3;
    const speed  = 0.00022 + (i % 5) * 0.00005;
    let t = 0;
    (function drift() {
      t++;
      const ax = Math.sin(t * speed * 60 + phaseX) * ampX;
      const ay = Math.cos(t * speed * 60 + phaseY) * ampY;
      tag.style.setProperty('--ax', ax + 'px');
      tag.style.setProperty('--ay', ay + 'px');
      requestAnimationFrame(drift);
    })();
  });

  // Cursor proximity pull
  arena.addEventListener('mousemove', e => {
    const rect = arena.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    tags.forEach(tag => {
      const tr = tag.getBoundingClientRect();
      const tx = (tr.left + tr.width / 2)  - rect.left;
      const ty = (tr.top  + tr.height / 2) - rect.top;
      const dist = Math.hypot(cx - tx, cy - ty);
      if (dist < 130) {
        const pull = (1 - dist / 130) * 16;
        const angle = Math.atan2(cy - ty, cx - tx);
        tag.style.setProperty('--px', Math.cos(angle) * pull + 'px');
        tag.style.setProperty('--py', Math.sin(angle) * pull + 'px');
      } else {
        tag.style.removeProperty('--px');
        tag.style.removeProperty('--py');
      }
    });
  });
  arena.addEventListener('mouseleave', () => {
    tags.forEach(tag => { tag.style.removeProperty('--px'); tag.style.removeProperty('--py'); });
  });
})();


/* ============================================
   PROJECT CARD 3D TILT
============================================ */
(function() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2)  / (rect.width / 2);
      const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
      card.style.transform = `translateY(-6px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ============================================
   ACTIVE NAV HIGHLIGHTING
============================================ */
(function() {
  const sections = ['about', 'skills', 'projects', 'journey', 'contact'];
  const links = {};
  sections.forEach(id => { links[id] = document.getElementById('nav-' + id); });
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        Object.values(links).forEach(l => l && l.classList.remove('active'));
        const l = links[e.target.id];
        if (l) l.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
})();

/* ============================================
   CONTACT FORM
============================================ */
(function() {
  const form = document.getElementById('contact-form');
  const btn  = document.getElementById('submit-btn');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    btn.innerHTML = '✓ Message Sent!';
    btn.style.background = 'linear-gradient(135deg,#059669,#10b981)';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = 'Send Message <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 4000);
  });
})();

/* ============================================
   SCROLL PROGRESS GLOW on TIMELINE LINE
============================================ */
(function() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const line = document.createElement('div');
  line.style.cssText = `
    position:absolute; left:20px; top:0; width:1px;
    background: linear-gradient(to bottom, #7c3aed, #a78bfa);
    pointer-events:none; z-index:2; height:0%;
    transition: height 0.1s linear;
    box-shadow: 0 0 8px rgba(124,58,237,0.6);
  `;
  timeline.style.position = 'relative';
  timeline.appendChild(line);

  window.addEventListener('scroll', () => {
    const rect = timeline.getBoundingClientRect();
    const visible = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / rect.height));
    line.style.height = (visible * 100) + '%';
  }, { passive: true });
})();

/* ============================================
   TINY 3D VOXEL CAT
============================================ */
(function() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('tiny-cat-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(120, 120, false);
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 2, 6);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  // Voxel Cat Group
  const cat = new THREE.Group();
  
  const mat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.4 });
  const highlightMat = new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.2 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.8), mat);
  body.position.y = 0.4;
  cat.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), mat);
  head.position.set(0, 1, 0.8);
  cat.add(head);

  // Ears
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.2), highlightMat);
  earL.position.set(-0.3, 1.5, 0.9);
  cat.add(earL);
  
  const earR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.2), highlightMat);
  earR.position.set(0.3, 1.5, 0.9);
  cat.add(earR);

  // Tail
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), highlightMat);
  tail.position.set(0, 0.8, -0.9);
  tail.rotation.x = -Math.PI / 6;
  cat.add(tail);

  scene.add(cat);

  // Rotate entire group so it faces isometric by default
  cat.rotation.y = -Math.PI / 4;

  let isHovered = false;
  let t = 0;
  let targetRotationY = -Math.PI / 4;

  canvas.addEventListener('mouseenter', () => { isHovered = true; targetRotationY += Math.PI * 2; });
  canvas.addEventListener('mouseleave', () => { isHovered = false; targetRotationY = -Math.PI / 4; });
  canvas.addEventListener('click', () => { targetRotationY += Math.PI * 2; });

  function animate() {
    requestAnimationFrame(animate);
    t += 0.05;
    
    // Idle animation
    if (!isHovered) {
      cat.rotation.y += (targetRotationY - cat.rotation.y) * 0.1;
      // Gentle breathing
      cat.position.y = Math.sin(t) * 0.05;
      // Tail wag
      tail.rotation.x = -Math.PI / 6 + Math.sin(t * 1.5) * 0.1;
      tail.rotation.z = Math.sin(t * 2) * 0.1;
    } else {
      // Hover spin & jump
      cat.rotation.y += (targetRotationY - cat.rotation.y) * 0.1;
      cat.position.y = Math.abs(Math.sin(t * 4)) * 0.5; // Jump
      tail.rotation.x = -Math.PI / 6 + Math.sin(t * 10) * 0.5; // Fast wag
    }
    
    renderer.render(scene, camera);
  }
  animate();
})();
