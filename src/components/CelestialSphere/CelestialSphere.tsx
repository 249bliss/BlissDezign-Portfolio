import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { fetchProjectsFromSupabase, SupabaseProject } from '../../services/supabaseClient';
import { ArrowUpRight, X } from 'lucide-react';
import gsap from 'gsap';
import './CelestialSphere.css';

interface CelestialSphereProps {
  viewMode?: 'sphere' | 'grid';
  onSelectProject: (project: SupabaseProject) => void;
  onHoverProject?: (project: SupabaseProject | null) => void;
  onNavigateWorks?: () => void;
  isOverlayActive?: boolean;
}

interface CardEntity {
  container: THREE.Group;
  mesh: THREE.Mesh;
  spherePos: THREE.Vector3;
  sphereQuat: THREE.Quaternion;
  gridPos: THREE.Vector3;
  gridQuat: THREE.Quaternion;
  project: SupabaseProject;
  index: number;
}

export const CelestialSphere: React.FC<CelestialSphereProps> = ({
  viewMode = 'sphere',
  onSelectProject,
  onHoverProject,
  isOverlayActive = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [focusedProject, setFocusedProject] = useState<SupabaseProject | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState<boolean>(false);
  const [focusedCardIdx, setFocusedCardIdx] = useState<number | null>(null);

  // References to keep animation loop & events detached from React re-renders
  const viewModeRef = useRef<'sphere' | 'grid'>('sphere');
  viewModeRef.current = viewMode;

  const isOverlayActiveRef = useRef(isOverlayActive);
  isOverlayActiveRef.current = isOverlayActive;

  const isZoomedInRef = useRef(false);
  isZoomedInRef.current = isZoomedIn;

  const focusedCardIdxRef = useRef<number | null>(null);
  focusedCardIdxRef.current = focusedCardIdx;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cardMeshesRef = useRef<THREE.Mesh[]>([]);
  const cardDataRef = useRef<CardEntity[]>([]);

  // 3D Morph & Endless Looping Scroll Physics
  const morphProgress = useRef(0.0); // 0.0 = Sphere, 1.0 = Grid
  const gridScrollY = useRef(0.0);
  const targetScrollY = useRef(0.0);
  const targetCamZ = useRef(16.5);

  // Drag, Pinch, Twist & Inertial Physics
  const isDragging = useRef(false);
  const isPinching = useRef(false);
  const initialPinchDist = useRef(0);
  const initialPinchAngle = useRef(0);
  const lastTapTime = useRef(0);
  const lastTapPos = useRef({ x: 0, y: 0 });
  const previousMouse = useRef({ x: 0, y: 0 });
  const rotVelocity = useRef({ x: 0, y: 0 });
  const targetQuaternion = useRef(new THREE.Quaternion());
  const isAligningToCard = useRef(false);

  // Grid Layout Constants (Larger cards + Endless Wrap Spacing)
  const totalTiles = 36;
  const numRows = Math.ceil(totalTiles / 3); // 12 rows
  const spacingX = 4.45;
  const spacingY = 2.85;
  const loopHeight = numRows * spacingY; // 34.2 units
  const halfLoopHeight = loopHeight / 2; // 17.1 units

  // Fetch real projects from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    fetchProjectsFromSupabase().then((data) => {
      if (!isMounted) return;
      if (data && data.length > 0) {
        setProjects(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const bgVideoRef = useRef<HTMLVideoElement>(null);

  // Hyperspace zoom arrival & deceleration when switching from overlays to Projects
  const prevOverlayActive = useRef(isOverlayActive);
  useEffect(() => {
    if (bgVideoRef.current) {
      if (isOverlayActive) {
        bgVideoRef.current.pause();
      } else {
        bgVideoRef.current.play().catch(() => {});
      }
    }

    const handleResume = () => {
      if (bgVideoRef.current && !isOverlayActive) {
        bgVideoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    if (prevOverlayActive.current && !isOverlayActive) {
      if (cameraRef.current && globeGroupRef.current) {
        // Hyperspace zoom arrival: camera rushes in from close-up / sphere blooms in
        const isMobile = window.innerWidth <= 768;
        const targetScale = isMobile ? 0.52 : 1.0;
        const targetZ = viewModeRef.current === 'grid' ? (isMobile ? 17.5 : 14.5) : (isMobile ? 18.0 : 16.5);

        cameraRef.current.position.z = 7.0;
        globeGroupRef.current.scale.set(0.25, 0.25, 0.25);
        globeGroupRef.current.rotation.y += 2.0;

        gsap.to(cameraRef.current.position, {
          z: targetZ,
          duration: 1.25,
          ease: 'expo.out',
        });

        gsap.to(globeGroupRef.current.scale, {
          x: targetScale,
          y: targetScale,
          z: targetScale,
          duration: 1.15,
          ease: 'expo.out',
        });
      }
    } else if (!prevOverlayActive.current && isOverlayActive) {
      if (globeGroupRef.current) {
        const isMobile = window.innerWidth <= 768;
        const exitScale = isMobile ? 0.75 : 1.35;
        gsap.to(globeGroupRef.current.scale, {
          x: exitScale,
          y: exitScale,
          z: exitScale,
          duration: 0.35,
          ease: 'power2.in',
        });
      }
      onHoverProject?.(null);
    }
    prevOverlayActive.current = isOverlayActive;
    return () => {
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [isOverlayActive, onHoverProject]);

  // Initialize Three.js Celestial Globe ONCE when projects are loaded
  useEffect(() => {
    if (!mountRef.current || projects.length === 0) return;
    const container = mountRef.current;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const isMobile = container.clientWidth <= 768;
    const initialCamZ = isMobile ? 18.0 : 16.5;
    const initialGlobeScale = isMobile ? 0.52 : 1.0;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, initialCamZ);
    cameraRef.current = camera;
    targetCamZ.current = initialCamZ;

    // 2. High-Performance Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Floating Breeze Particles (warm golden sunlight motes)
    const particleCount = 50;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 28;
      particlePositions[i + 1] = (Math.random() - 0.5) * 18;
      particlePositions[i + 2] = (Math.random() - 0.5) * 22;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.12,
      transparent: true,
      opacity: 0.45,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 4. Globe / Card Master Group
    const globeGroup = new THREE.Group();
    globeGroup.scale.set(initialGlobeScale, initialGlobeScale, initialGlobeScale);
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // 5. Build Cards for 3D Morph (Fibonacci Sphere <-> 3-Column Endless Grid)
    const sphereRadius = 8.6;
    cardMeshesRef.current = [];
    cardDataRef.current = [];

    // Helper: Bends plane geometry along sphere radius
    const createCurvedCardGeometry = (width: number, height: number, radius: number) => {
      const geo = new THREE.PlaneGeometry(width, height, 12, 6);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const zDisplacement = -(x * x) / (2 * radius);
        pos.setZ(i, zDisplacement);
      }
      geo.computeVertexNormals();
      return geo;
    };

    const cardGeo = createCurvedCardGeometry(2.4, 1.5, sphereRadius);

    // Texture & Video Caching
    const textureLoader = new THREE.TextureLoader();
    const textureCache = new Map<string, THREE.Texture>();
    const videoCache = new Map<string, HTMLVideoElement>();

    const createFallbackCardTexture = (title: string, tag: string): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Deep obsidian glass gradient
        const grad = ctx.createLinearGradient(0, 0, 640, 400);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 400);

        // Subtle architectural grid line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 20, 600, 360);

        // Tag badge
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.beginPath();
        ctx.roundRect(40, 45, 160, 36, 18);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText((tag || 'PROJECT').toUpperCase(), 55, 68);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        const displayTitle = title.length > 28 ? title.slice(0, 26) + '...' : title;
        ctx.fillText(displayTitle, 40, 180);

        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '16px sans-serif';
        ctx.fillText('EMMANUEL BLISS // PORTFOLIO', 40, 220);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const getTextureForMedia = (mediaUrl: string, project?: SupabaseProject): THREE.Texture => {
      const resolvedUrl = mediaUrl;

      if (!resolvedUrl) {
        return createFallbackCardTexture(project?.title || 'Project', project?.category_tags?.[0] || 'WORK');
      }

      if (textureCache.has(resolvedUrl)) {
        return textureCache.get(resolvedUrl)!;
      }

      if (resolvedUrl.match(/\.(mp4|webm|mov)$/i)) {
        let video = videoCache.get(resolvedUrl);
        if (!video) {
          video = document.createElement('video');
          video.src = resolvedUrl;
          video.crossOrigin = 'anonymous';
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          video.preload = 'auto';
          video.play().catch(() => {});
          videoCache.set(resolvedUrl, video);
        }
        const videoTex = new THREE.VideoTexture(video);
        videoTex.colorSpace = THREE.SRGBColorSpace;
        videoTex.minFilter = THREE.LinearFilter;
        videoTex.magFilter = THREE.LinearFilter;
        videoTex.generateMipmaps = false;
        textureCache.set(resolvedUrl, videoTex);
        return videoTex;
      } else {
        const fallbackTex = createFallbackCardTexture(project?.title || 'Project', project?.category_tags?.[0] || 'WORK');
        const tex = textureLoader.load(
          resolvedUrl,
          undefined,
          undefined,
          () => {
            // If image fails to load (e.g. 402 or 404), seamlessly swap with fallback card
            tex.image = fallbackTex.image as any;
            tex.needsUpdate = true;
          }
        );
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        textureCache.set(resolvedUrl, tex);
        return tex;
      }
    };

    const dummy = new THREE.Object3D();

    for (let i = 0; i < totalTiles; i++) {
      const project = projects[i % projects.length];

      // A) Fibonacci spherical coordinate calculation
      const phi = Math.acos(-1 + (2 * i + 1) / totalTiles);
      const theta = Math.sqrt(totalTiles * Math.PI) * phi;

      const xs = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const ys = sphereRadius * Math.cos(phi) * 0.92;
      const zs = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const spherePos = new THREE.Vector3(xs, ys, zs);

      dummy.position.copy(spherePos);
      dummy.lookAt(xs * 2, ys * 2, zs * 2);
      const sphereQuat = dummy.quaternion.clone();

      // B) 3-Column Grid Target Calculation (Larger Prominent Scale)
      const col = i % 3; // 0, 1, 2
      const row = Math.floor(i / 3); // 0 to 11
      const xg = (col - 1) * spacingX; // -3.85, 0, +3.85
      const yg = -row * spacingY + (halfLoopHeight - spacingY); // Distributed around origin
      const zg = 0;
      const gridPos = new THREE.Vector3(xg, yg, zg);
      const gridQuat = new THREE.Quaternion(0, 0, 0, 1); // Identity facing forward

      // C) Mesh & Container Setup
      const texture = getTextureForMedia(project.hero_image, project);
      const cardMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: texture,
        side: THREE.DoubleSide,
      });

      const cardContainer = new THREE.Group();
      cardContainer.position.copy(spherePos);
      cardContainer.quaternion.copy(sphereQuat);

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardContainer.add(cardMesh);


      cardMesh.userData = { project, index: i, container: cardContainer };

      globeGroup.add(cardContainer);
      cardMeshesRef.current.push(cardMesh);

      cardDataRef.current.push({
        container: cardContainer,
        mesh: cardMesh,
        spherePos,
        sphereQuat,
        gridPos,
        gridQuat,
        project,
        index: i,
      });
    }

    // 6. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();
    let hasMoved = false;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (isOverlayActiveRef.current || isZoomedInRef.current) return;
      isDragging.current = true;
      hasMoved = false;
      isAligningToCard.current = false;
      previousMouse.current = { x: e.clientX, y: e.clientY };
      rotVelocity.current = { x: 0, y: 0 };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (isOverlayActiveRef.current || isZoomedInRef.current) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (isDragging.current) {
        const dx = clientX - previousMouse.current.x;
        const dy = clientY - previousMouse.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasMoved = true;
        }

        if (viewModeRef.current === 'grid') {
          // Endless vertical scrolling on drag (unbounded)
          targetScrollY.current -= dy * 0.022;
        } else if (globeGroupRef.current) {
          // Dragging rotates the 3D sphere
          globeGroupRef.current.rotation.y += dx * 0.005;
          globeGroupRef.current.rotation.x += dy * 0.003;
          globeGroupRef.current.rotation.x = Math.max(-1.15, Math.min(1.15, globeGroupRef.current.rotation.x));
          // Smooth momentum accumulation with moving average
          const targetVx = dy * 0.0025;
          const targetVy = dx * 0.0055;
          rotVelocity.current.x = rotVelocity.current.x * 0.35 + targetVx * 0.65;
          rotVelocity.current.y = rotVelocity.current.y * 0.35 + targetVy * 0.65;
        }
        previousMouse.current = { x: clientX, y: clientY };
      } else if (!isDragging.current && onHoverProject) {
        const rect = container.getBoundingClientRect();
        mouseCoord.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouseCoord.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseCoord, camera);
        const intersects = raycaster.intersectObjects(cardMeshesRef.current, false);
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          onHoverProject(hit.userData.project as SupabaseProject);
        } else {
          onHoverProject(null);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      isDragging.current = false;
    };

    // Mobile Multi-Touch Gestures: 1-Finger Turn, 2-Finger Pinch to Zoom (Deep In & Out), 2-Finger Twist Roll
    const handleTouchStart = (e: TouchEvent) => {
      if (isOverlayActiveRef.current || isZoomedInRef.current) return;

      if (e.touches.length === 1) {
        isDragging.current = true;
        hasMoved = false;
        isAligningToCard.current = false;
        isPinching.current = false;

        const t = e.touches[0];
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime.current;
        const tapDist = Math.hypot(
          t.clientX - lastTapPos.current.x,
          t.clientY - lastTapPos.current.y
        );

        if (timeSinceLastTap < 320 && tapDist < 35) {
          // Double tap detected: plunge deep into the core or reset back out!
          hasMoved = true;
          const isMobile = window.innerWidth <= 768;
          if (targetCamZ.current > 7.0) {
            // Plunge deep into the globe core!
            gsap.to(targetCamZ, {
              current: 3.5,
              duration: 0.85,
              ease: 'power3.out',
            });
          } else {
            // Zoom back out to overview
            gsap.to(targetCamZ, {
              current: isMobile ? 18.0 : 16.5,
              duration: 0.85,
              ease: 'power3.out',
            });
          }
        }

        lastTapTime.current = now;
        lastTapPos.current = { x: t.clientX, y: t.clientY };
        previousMouse.current = { x: t.clientX, y: t.clientY };
        rotVelocity.current = { x: 0, y: 0 };
      } else if (e.touches.length === 2) {
        // Multi-touch pinch & twist gesture!
        isDragging.current = false;
        isPinching.current = true;
        hasMoved = true;

        const t0 = e.touches[0];
        const t1 = e.touches[1];
        initialPinchDist.current = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        initialPinchAngle.current = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isOverlayActiveRef.current || isZoomedInRef.current) return;

      if (e.touches.length === 2 && isPinching.current) {
        if (e.cancelable) e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const currentAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);

        // Pinch Zoom: spread fingers -> zoom IN (decrease camera z down into the sphere, min 2.5)
        // pinch fingers -> zoom OUT (increase camera z up to 34.0)
        const deltaDist = currentDist - initialPinchDist.current;
        targetCamZ.current -= deltaDist * 0.038;
        targetCamZ.current = Math.max(2.5, Math.min(34.0, targetCamZ.current));
        initialPinchDist.current = currentDist;

        // Twist Roll: twist fingers -> rotate globeGroup.rotation.z
        let deltaAngle = currentAngle - initialPinchAngle.current;
        while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
        while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
        if (globeGroupRef.current) {
          globeGroupRef.current.rotation.z += deltaAngle * 1.1;
        }
        initialPinchAngle.current = currentAngle;
      } else if (e.touches.length === 1 && isDragging.current) {
        if (e.cancelable) e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - previousMouse.current.x;
        const dy = t.clientY - previousMouse.current.y;

        if (Math.hypot(dx, dy) > 3) {
          hasMoved = true;
        }

        if (viewModeRef.current === 'grid') {
          targetScrollY.current -= dy * 0.022;
        } else if (globeGroupRef.current) {
          globeGroupRef.current.rotation.y += dx * 0.007;
          globeGroupRef.current.rotation.x += dy * 0.005;
          globeGroupRef.current.rotation.x = Math.max(-1.15, Math.min(1.15, globeGroupRef.current.rotation.x));

          const targetVx = dy * 0.004;
          const targetVy = dx * 0.007;
          rotVelocity.current.x = rotVelocity.current.x * 0.35 + targetVx * 0.65;
          rotVelocity.current.y = rotVelocity.current.y * 0.35 + targetVy * 0.65;
        }

        previousMouse.current = { x: t.clientX, y: t.clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching.current = false;
      }
      if (e.touches.length === 0) {
        isDragging.current = false;
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (isOverlayActiveRef.current || isZoomedInRef.current) return;
      if (hasMoved) return; // Prevent click after drag motion
      const rect = container.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(cardMeshesRef.current, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const proj = hit.userData.project as SupabaseProject;
        const idx = hit.userData.index as number;
        const cardCont = hit.userData.container as THREE.Group;

        // IN BOTH GRID & SPHERE MODES: Clicking zooms in and shows the preview modal first!
        if (viewModeRef.current === 'grid') {
          setFocusedProject(proj);
          setFocusedCardIdx(idx);
          setIsZoomedIn(true);
          return;
        }

        // In Sphere mode: 1st click centers card, 2nd click dives in
        if (focusedCardIdxRef.current === idx) {
          setIsZoomedIn(true);
        } else {
          setFocusedProject(proj);
          setFocusedCardIdx(idx);
          isAligningToCard.current = true;

          const worldPos = new THREE.Vector3();
          cardCont.getWorldPosition(worldPos);

          if (globeGroupRef.current) {
            const currentQuat = globeGroupRef.current.quaternion.clone();
            const invQuat = currentQuat.clone().invert();
            const localPos = worldPos.clone().applyQuaternion(invQuat).normalize();
            const forward = new THREE.Vector3(0, 0, 1);
            targetQuaternion.current.setFromUnitVectors(localPos, forward);
          }
        }
      }
    };

    // 7. Mouse Wheel Scroll (Endless Grid Scroll or Sphere Camera Zoom)
    const handleWheel = (e: WheelEvent) => {
      if (isOverlayActiveRef.current || isZoomedInRef.current) return;
      e.preventDefault();
      if (viewModeRef.current === 'grid') {
        // Endless continuous scroll without boundaries
        targetScrollY.current += e.deltaY * 0.008;
      } else {
        // Zoom in/out of the 3D globe (supports deep plunge down to 2.5 and far overview up to 34.0)
        targetCamZ.current += e.deltaY * 0.006;
        targetCamZ.current = Math.max(2.5, Math.min(34.0, targetCamZ.current));
      }
    };

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      if (globeGroupRef.current && !isZoomedInRef.current && !isOverlayActiveRef.current) {
        const isMobileNow = width <= 768;
        const s = isMobileNow ? 0.52 : 1.0;
        globeGroupRef.current.scale.set(s, s, s);
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', handleResize);
    container.addEventListener('pointerdown', handlePointerDown as EventListener);
    window.addEventListener('pointermove', handlePointerMove as EventListener);
    window.addEventListener('pointerup', handlePointerUp as EventListener);
    container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    window.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    window.addEventListener('touchend', handleTouchEnd as EventListener);
    window.addEventListener('touchcancel', handleTouchEnd as EventListener);
    container.addEventListener('click', handleClick);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 9. 60FPS Render & Physics Loop (Handles 3D Morph & Endless Continuous Scroll)
    let animId: number;
    const tempGridVec = new THREE.Vector3();

    const animate = () => {
      // If an overlay or modal is active, pause WebGL rendering to keep GPU/CPU 100% free for silky smooth scrolling
      if (isOverlayActiveRef.current) {
        animId = requestAnimationFrame(animate);
        return;
      }

      // Morph progress interpolation (0 = Sphere, 1 = Grid)
      const targetMorphVal = viewModeRef.current === 'grid' ? 1.0 : 0.0;
      morphProgress.current += (targetMorphVal - morphProgress.current) * 0.07;
      const m = morphProgress.current;

      // Smooth grid scroll momentum lerp
      gridScrollY.current += (targetScrollY.current - gridScrollY.current) * 0.09;

      if (m < 0.92) {
        // Sphere Mode Dynamics: Natural inertial coasting & smooth blend into gentle idle drift
        if (!isDragging.current && !isAligningToCard.current && globeGroupRef.current) {
          // 1. Coast smoothly with user throw momentum
          globeGroupRef.current.rotation.y += rotVelocity.current.y * (1.0 - m);
          globeGroupRef.current.rotation.x += rotVelocity.current.x * (1.0 - m);
          globeGroupRef.current.rotation.x = Math.max(-1.15, Math.min(1.15, globeGroupRef.current.rotation.x));

          // 2. Exponential friction damping (silky smooth deceleration)
          rotVelocity.current.y *= 0.948;
          rotVelocity.current.x *= 0.948;

          // 3. Gentle perpetual idle drift seamlessly maintained without sudden halt
          const idleDrift = 0.0014 * (1.0 - m);
          if (Math.abs(rotVelocity.current.y) < idleDrift) {
            rotVelocity.current.y = THREE.MathUtils.lerp(rotVelocity.current.y, idleDrift, 0.06);
          }
        }

        if (isAligningToCard.current && globeGroupRef.current) {
          globeGroupRef.current.quaternion.slerp(targetQuaternion.current, 0.08);
          if (globeGroupRef.current.quaternion.angleTo(targetQuaternion.current) < 0.01) {
            isAligningToCard.current = false;
          }
        }
      } else {
        // Grid Mode: Gently settle globe group rotation flush to camera
        if (globeGroupRef.current) {
          globeGroupRef.current.rotation.x *= 0.88;
          globeGroupRef.current.rotation.y *= 0.88;
          globeGroupRef.current.rotation.z *= 0.88;
        }
      }

      // Card scale increases in Grid mode to make designs larger and more prominent (both desktop and mobile)
      const isMobile = window.innerWidth <= 768;
      const targetGridScale = isMobile ? 1.62 : 1.76;
      const cardScale = THREE.MathUtils.lerp(1.0, targetGridScale, m);

      // Interpolate each card between Sphere position/rotation and Endless 3-Column Grid
      const cards = cardDataRef.current;
      for (let i = 0; i < cards.length; i++) {
        const item = cards[i];

        // Endless loop wrapping calculation:
        // Raw vertical position with continuous scroll
        const rawY = item.gridPos.y + gridScrollY.current;
        // Modulo wrap around loopHeight [-halfLoopHeight, +halfLoopHeight]
        const wrappedY = ((rawY + halfLoopHeight) % loopHeight + loopHeight) % loopHeight - halfLoopHeight;

        tempGridVec.set(item.gridPos.x, wrappedY, item.gridPos.z);

        // Smoothly position, orient, and scale card
        item.container.position.lerpVectors(item.spherePos, tempGridVec, m);
        item.container.quaternion.slerpQuaternions(item.sphereQuat, item.gridQuat, m);
        item.container.scale.setScalar(cardScale);
      }

      // Floating breeze particles drift
      const posAttr = particleGeo.attributes.position;
      for (let i = 1; i < particleCount * 3; i += 3) {
        posAttr.array[i] += 0.006;
        if (posAttr.array[i] > 10) {
          posAttr.array[i] = -10;
        }
      }
      posAttr.needsUpdate = true;

      // Camera position interpolation (responsive to mobile zoom & grid view)
      const baseCamZ = viewModeRef.current === 'grid' ? (isMobile ? 17.5 : 14.5) : targetCamZ.current;
      const finalCamZ = isZoomedInRef.current ? (isMobile ? 12.0 : 10.5) : baseCamZ;
      camera.position.z += (finalCamZ - camera.position.z) * 0.08;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown as EventListener);
      window.removeEventListener('pointermove', handlePointerMove as EventListener);
      window.removeEventListener('pointerup', handlePointerUp as EventListener);
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      window.removeEventListener('touchmove', handleTouchMove as EventListener);
      window.removeEventListener('touchend', handleTouchEnd as EventListener);
      window.removeEventListener('touchcancel', handleTouchEnd as EventListener);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);

      videoCache.forEach((vid) => {
        vid.pause();
        vid.src = '';
        vid.load();
      });
      videoCache.clear();
      textureCache.forEach((tex) => tex.dispose());
      textureCache.clear();
      cardGeo.dispose();
      renderer.dispose();
    };
  }, [projects]); // Only rebuilds when projects load

  const handleExitZoom = () => {
    setIsZoomedIn(false);
  };

  return (
    <div className="celestial-sky-stage">
      {/* ── 1. LIVING BACKGROUND VIDEO ── */}
      <div className="sky-daylight-backdrop" aria-hidden="true">
        <video
          ref={bgVideoRef}
          className="sky-bg-video"
          src="/assets/bg-video-new.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => {
            bgVideoRef.current?.play().catch(() => {});
          }}
          onWaiting={() => {
            bgVideoRef.current?.play().catch(() => {});
          }}
          onEnded={() => {
            bgVideoRef.current?.play().catch(() => {});
          }}
        />
      </div>

      {/* ── 2. THREE.JS 3D CANVAS (SPHERE ⟷ 3-COLUMN ENDLESS GRID MORPH) ── */}
      <div
        ref={mountRef}
        className="celestial-globe-canvas"
        style={{
          cursor: isDragging.current ? 'grabbing' : 'grab',
          opacity: isOverlayActive ? 0 : 1,
          pointerEvents: isOverlayActive ? 'none' : 'auto',
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* ── 3. FOCUSED CARD HINT / QUICK ACTION (Sphere Mode) ── */}
      {!isOverlayActive && viewMode === 'sphere' && focusedProject && !isZoomedIn && (
        <div className="celestial-focused-banner">
          <div className="celestial-focused-text">
            <span className="celestial-focused-eyebrow">CLICK TO DIVE IN</span>
            <h3 className="celestial-focused-title">{focusedProject.title}</h3>
            {focusedProject.subtitle && (
              <p className="celestial-focused-sub">{focusedProject.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            className="celestial-focused-btn"
            onClick={() => setIsZoomedIn(true)}
          >
            <span>Inspect Project</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      )}

      {/* ── 4. DIVE-IN PREVIEW MODAL (Used in Both Sphere & Grid Modes) ── */}
      {isZoomedIn && focusedProject && (
        <div className="celestial-divein-overlay" onClick={handleExitZoom}>
          <div className="celestial-divein-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="celestial-divein-close"
              onClick={handleExitZoom}
              title="Return to View"
            >
              <X size={20} />
            </button>

            <div className="celestial-divein-media">
              {focusedProject.hero_image.endsWith('.mp4') ? (
                <video
                  src={focusedProject.hero_image}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={focusedProject.hero_image}
                  alt={focusedProject.title}
                />
              )}
            </div>

            <div className="celestial-divein-footer">
              <div className="celestial-divein-info">
                <span className="celestial-divein-tag">
                  {focusedProject.category_tags?.join(' • ') || 'Selected Work'}
                </span>
                <h2 className="celestial-divein-heading">{focusedProject.title}</h2>
                {focusedProject.subtitle && (
                  <p className="celestial-divein-desc">{focusedProject.subtitle}</p>
                )}
              </div>

              <div className="celestial-divein-actions">
                <button
                  type="button"
                  className="celestial-action-btn secondary"
                  onClick={handleExitZoom}
                >
                  {viewMode === 'grid' ? 'Back to Grid' : 'Back to Globe'}
                </button>
                <button
                  type="button"
                  className="celestial-action-btn primary"
                  onClick={() => {
                    handleExitZoom();
                    onSelectProject(focusedProject);
                  }}
                >
                  <span>{focusedProject.is_case_study ? 'View Full Case Study' : 'View Project'}</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
