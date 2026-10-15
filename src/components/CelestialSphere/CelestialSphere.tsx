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

// Global in-memory cache across component lifecycles for instant zero-latency texture restores
const globalTextureCache = new Map<string, THREE.Texture>();
const globalVideoCache = new Map<string, HTMLVideoElement>();

// Verified initial projects from Supabase admin board to enable 0ms instant mount
const INITIAL_PROJECTS: SupabaseProject[] = [
  {
    id: 'avenor-landingpage',
    title: 'AVENOR - Real Estate Landing Page',
    subtitle: 'A luxury real estate landing page designed in Figma and prototyped in Jitter.',
    hero_image: 'https://res.cloudinary.com/adfxi8js/video/upload/v1791915317/projects/xqhh6vxyqqrpeqy5pc06.mp4',
    is_case_study: true,
    layout_type: 'standard',
    category_tags: ['Websites', 'Real Estate', 'Landing Page', 'Case Study'],
    is_featured: true,
    display_order: 0,
    grid_layout: 'standard',
  },
  {
    id: 'wagestream-redesign',
    title: 'WageStream Onboarding Redesign',
    subtitle: "A UX-driven onboarding redesign that transforms WageStream's first-time experience from feature-focused to trust-focused.",
    hero_image: 'https://res.cloudinary.com/adfxi8js/image/upload/v1791918523/projects/giljpuzculsd1iqqrhaf.webp',
    is_case_study: true,
    layout_type: 'standard',
    category_tags: ['Mobile Apps', 'Fintech', 'UI/UX Strategy', 'Casestudy'],
    is_featured: true,
    display_order: 3,
    grid_layout: 'standard',
  },
  {
    id: 'wayve---app-store-screenshot',
    title: 'Wayve AppScreenshot Redesign',
    subtitle: "I redesigned Wayve’s App Store and Google Play screenshots to communicate the product’s value within the few seconds",
    hero_image: 'https://res.cloudinary.com/adfxi8js/video/upload/v1791925442/projects/qhgj0v0csrykldtsodgi.mp4',
    is_case_study: true,
    layout_type: 'standard',
    category_tags: ['Product Design', 'UI/UX', 'Appscreenshot'],
    is_featured: true,
    display_order: 3,
    grid_layout: 'standard',
  },
  {
    id: 'wysa-health-chat-redesign',
    title: 'Wysa - Mental Health Chat Redesign',
    subtitle: "A redesign of Wysa's chat experience, reducing visual clutter and creating a calmer, more supportive conversation interface for emotionally vulnerable users.",
    hero_image: 'https://res.cloudinary.com/adfxi8js/image/upload/v1791925995/projects/og2yexpzoedtkrtbxgro.jpg',
    is_case_study: true,
    layout_type: 'standard',
    category_tags: ['Healthcare', 'Product Design', 'Mobileapp'],
    is_featured: true,
    display_order: 4,
    grid_layout: 'standard',
  },
  {
    id: 'xoria-webredesign',
    title: 'Website Redesign for Xoria',
    subtitle: "UX Audit & Redesigned Xoria's website to improve product presentation and communication.",
    hero_image: 'https://res.cloudinary.com/adfxi8js/image/upload/v1791926472/projects/fc0imy7uxe4qsqzzdlqn.png',
    is_case_study: true,
    layout_type: 'standard',
    category_tags: ['Product Design', 'UX Design', 'SAAS', 'AI'],
    is_featured: true,
    display_order: 5,
    grid_layout: 'standard',
  },
  {
    id: 'hit-webredesign',
    title: 'Health In Tech - Website Redesign',
    subtitle: "Concept redesign of Health In Tech's website, transforming a feature-heavy experience into a trust-driven digital presence",
    hero_image: 'https://res.cloudinary.com/adfxi8js/video/upload/v1791927409/projects/gjpii1z9acxyxevgyyzn.mp4',
    is_case_study: true,
    layout_type: 'standard',
    category_tags: ['HealthTech', 'UX Design', 'Redesign'],
    is_featured: true,
    display_order: 6,
    grid_layout: 'standard',
  },
  {
    id: '1p-algo',
    title: '1P Algorithms',
    subtitle: 'Hero section redesign for an AI trading platform, shifting from a text-heavy page to a product-led experience that builds trust instantly.',
    hero_image: 'https://res.cloudinary.com/adfxi8js/video/upload/v1791927912/projects/ypw8dioexjbk0leojqgx.mp4',
    is_case_study: true,
    layout_type: 'standard',
    category_tags: ['Fintech', 'Redesign', 'UX Audit'],
    is_featured: true,
    display_order: 7,
    grid_layout: 'standard',
  },
];

export const CelestialSphere: React.FC<CelestialSphereProps> = ({
  viewMode = 'sphere',
  onSelectProject,
  onHoverProject,
  isOverlayActive = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<SupabaseProject[]>(INITIAL_PROJECTS);
  const [focusedProject, setFocusedProject] = useState<SupabaseProject | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState<boolean>(false);
  const [focusedCardIdx, setFocusedCardIdx] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const texturesLoadedCount = useRef(0);
  const hasRevealedRef = useRef(false);
  const mountTimeRef = useRef(Date.now());

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
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const touchDownPos = useRef({ x: 0, y: 0 });
  const rotVelocity = useRef({ x: 0, y: 0 });
  const isAligningToCard = useRef(false);

  // Grid Layout Constants (2 columns on mobile, 3 columns on desktop + Endless Wrap Spacing)
  const totalTiles = 48;
  const loopHeightRef = useRef(45.6);
  const halfLoopHeightRef = useRef(22.8);

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

  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  // Hyperspace zoom arrival & deceleration when switching from overlays to Projects
  const prevOverlayActive = useRef(isOverlayActive);
  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.defaultMuted = true;
      bgVideoRef.current.muted = true;
      if (isOverlayActive) {
        bgVideoRef.current.pause();
      } else {
        bgVideoRef.current.play().catch(() => {});
      }
    }

    const handleResume = () => {
      if (bgVideoRef.current && !isOverlayActive) {
        bgVideoRef.current.defaultMuted = true;
        bgVideoRef.current.muted = true;
        if (bgVideoRef.current.paused) {
          bgVideoRef.current.play().catch(() => {});
        }
      }
    };
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('pointerdown', handleResume, { passive: true, once: true });
    window.addEventListener('touchstart', handleResume, { passive: true, once: true });

    if (prevOverlayActive.current && !isOverlayActive) {
      if (cameraRef.current && globeGroupRef.current) {
        // Hyperspace zoom arrival: camera rushes in from close-up / sphere blooms in
        const isMobile = window.innerWidth <= 768;
        const targetScale = isMobile ? 0.72 : 1.0;
        const targetZ = viewModeRef.current === 'grid' ? (isMobile ? 16.5 : 14.5) : (isMobile ? 17.0 : 16.5);

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
      window.removeEventListener('pointerdown', handleResume);
      window.removeEventListener('touchstart', handleResume);
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
    const initialCamZ = isMobile ? 17.0 : 16.5;
    const initialGlobeScale = isMobile ? 0.72 : 1.0;

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

    // 3. Globe / Card Master Group — starts hidden until triggerReveal
    const globeGroup = new THREE.Group();
    globeGroup.scale.set(0.18, 0.18, 0.18);
    globeGroup.position.set(0, 0, -10);
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

    const cardWidth = 2.4;
    const cardHeight = 1.6;
    const cardAspect = cardWidth / cardHeight; // 1.5 aspect ratio

    const cardGeo = createCurvedCardGeometry(cardWidth, cardHeight, sphereRadius);

    // Prevents cards from being crushed vertically: scales and center-crops UVs like CSS object-fit: cover
    const applyCoverToTexture = (texture: THREE.Texture, mediaAspect: number) => {
      if (!mediaAspect || !isFinite(mediaAspect) || mediaAspect <= 0) return;
      if (mediaAspect > cardAspect) {
        // Media is wider than card -> crop horizontal edges, keep full vertical height intact
        const repeatX = cardAspect / mediaAspect;
        texture.repeat.set(repeatX, 1);
        texture.offset.set((1 - repeatX) / 2, 0);
      } else {
        // Media is taller than card -> crop vertical edges, keep full horizontal width intact (never crushed vertically!)
        const repeatY = mediaAspect / cardAspect;
        texture.repeat.set(1, repeatY);
        texture.offset.set(0, (1 - repeatY) / 2);
      }
      texture.needsUpdate = true;
    };

    // Soft sky placeholder canvas so cards never render black WebGL pixels while loading
    const createSkyPlaceholder = (): HTMLCanvasElement => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 42;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#e2ecf8';
        ctx.fillRect(0, 0, 64, 42);
      }
      return c;
    };
    const skyPlaceholder = createSkyPlaceholder();

    const uniqueMediaCount = new Set(projects.map((p) => p.hero_image).filter(Boolean)).size;
    const requiredMediaThreshold = Math.max(1, Math.min(uniqueMediaCount, 5));

    const triggerReveal = () => {
      if (hasRevealedRef.current) return;
      hasRevealedRef.current = true;
      setIsLoaded(true);

      camera.position.z = 7.0;
      globeGroup.scale.set(0.22, 0.22, 0.22);
      globeGroup.position.set(0, 0, 0);
      globeGroup.rotation.y = 1.6;

      gsap.to(camera.position, {
        z: initialCamZ,
        duration: 1.5,
        ease: 'expo.out',
      });

      gsap.to(globeGroup.scale, {
        x: initialGlobeScale,
        y: initialGlobeScale,
        z: initialGlobeScale,
        duration: 1.4,
        ease: 'expo.out',
      });

      gsap.to(globeGroup.rotation, {
        y: 0,
        duration: 1.5,
        ease: 'expo.out',
      });

      // Ensure all card videos are actively playing
      globalVideoCache.forEach((vid) => {
        vid.defaultMuted = true;
        vid.muted = true;
        if (vid.paused) {
          vid.play().catch(() => {});
        }
      });
    };

    // Deliberate pacing: ensures assets have at least 2.5s to stream in before revealing
    const tryReveal = () => {
      if (hasRevealedRef.current) return;
      const elapsed = Date.now() - mountTimeRef.current;
      const minDisplayTime = 2500;
      if (elapsed < minDisplayTime) {
        setTimeout(() => {
          triggerReveal();
        }, minDisplayTime - elapsed);
      } else {
        triggerReveal();
      }
    };

    const onMediaLoaded = () => {
      texturesLoadedCount.current++;
      if (texturesLoadedCount.current >= requiredMediaThreshold && !hasRevealedRef.current) {
        tryReveal();
      }
    };

    // Safety timeout: 4.5s max so slow networks get ample time, but never hang indefinitely
    const safetyTimeout = setTimeout(() => {
      triggerReveal();
    }, 4500);

    const getTextureForMedia = (mediaUrl: string): THREE.Texture => {
      const resolvedUrl = mediaUrl || '';

      if (globalTextureCache.has(resolvedUrl)) {
        setTimeout(onMediaLoaded, 0);
        const cachedVideo = globalVideoCache.get(resolvedUrl);
        if (cachedVideo) {
          cachedVideo.defaultMuted = true;
          cachedVideo.muted = true;
          if (cachedVideo.paused) {
            cachedVideo.play().catch(() => {});
          }
        }
        return globalTextureCache.get(resolvedUrl)!;
      }

      if (resolvedUrl.match(/\.(mp4|webm|mov)$/i)) {
        let video = globalVideoCache.get(resolvedUrl);
        if (!video) {
          video = document.createElement('video');
          video.src = resolvedUrl;
          video.crossOrigin = 'anonymous';
          video.loop = true;
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          video.preload = 'auto';
          video.setAttribute('muted', '');
          video.setAttribute('playsinline', '');
          video.setAttribute('autoplay', '');
          globalVideoCache.set(resolvedUrl, video);
        }

        video.defaultMuted = true;
        video.muted = true;
        if (video.paused) {
          video.play().catch(() => {});
        }

        const videoTex = new THREE.VideoTexture(video);
        videoTex.colorSpace = THREE.SRGBColorSpace;
        videoTex.minFilter = THREE.LinearFilter;
        videoTex.magFilter = THREE.LinearFilter;
        videoTex.generateMipmaps = false;

        const updateVideoCover = () => {
          if (video && video.videoWidth && video.videoHeight) {
            applyCoverToTexture(videoTex, video.videoWidth / video.videoHeight);
          }
        };

        if (video.readyState >= 1) {
          updateVideoCover();
          setTimeout(onMediaLoaded, 0);
        } else {
          video.addEventListener('loadedmetadata', updateVideoCover, { once: true });
          video.addEventListener('loadeddata', onMediaLoaded, { once: true });
        }

        globalTextureCache.set(resolvedUrl, videoTex);
        return videoTex;
      } else {
        // Initialize with soft sky placeholder so card is immediately light & clean
        const tex = new THREE.Texture(skyPlaceholder);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;

        if (resolvedUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = resolvedUrl;
          img.onload = () => {
            const aspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
            applyCoverToTexture(tex, aspect);
            (tex as any).image = img;
            tex.needsUpdate = true;
            onMediaLoaded();
          };
          img.onerror = () => {
            onMediaLoaded();
          };
        }
        globalTextureCache.set(resolvedUrl, tex);
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
      const ys = sphereRadius * Math.cos(phi);
      const zs = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const spherePos = new THREE.Vector3(xs, ys, zs);

      dummy.position.copy(spherePos);
      dummy.lookAt(xs * 2, ys * 2, zs * 2);
      const sphereQuat = dummy.quaternion.clone();

      // B) Responsive Grid Target Calculation (2 Columns on Mobile, 3 Columns on Desktop)
      const cols = isMobile ? 2 : 3;
      const spX = isMobile ? 4.0 : 4.45;
      const spY = isMobile ? 2.65 : 2.85;
      const initialNumRows = Math.ceil(totalTiles / cols);
      const initialLoopH = initialNumRows * spY;
      const initialHalfLoopH = initialLoopH / 2;
      loopHeightRef.current = initialLoopH;
      halfLoopHeightRef.current = initialHalfLoopH;

      const col = i % cols;
      const row = Math.floor(i / cols);
      const xg = (col - (cols - 1) / 2) * spX;
      const yg = -row * spY + (initialHalfLoopH - spY);
      const zg = 0;
      const gridPos = new THREE.Vector3(xg, yg, zg);
      const gridQuat = new THREE.Quaternion(0, 0, 0, 1); // Identity facing forward

      // C) Mesh & Container Setup — crisp light card material
      const texture = getTextureForMedia(project.hero_image);
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

    // Dynamic recalculation of grid coordinates for mobile (2-col) vs desktop (3-col)
    const updateGridLayout = (isMobileLayout: boolean) => {
      const cols = isMobileLayout ? 2 : 3;
      const spX = isMobileLayout ? 4.0 : 4.45;
      const spY = isMobileLayout ? 2.65 : 2.85;
      const rows = Math.ceil(totalTiles / cols);
      const lHeight = rows * spY;
      const halfLHeight = lHeight / 2;
      loopHeightRef.current = lHeight;
      halfLoopHeightRef.current = halfLHeight;

      const cards = cardDataRef.current;
      for (let i = 0; i < cards.length; i++) {
        const item = cards[i];
        const c = i % cols;
        const r = Math.floor(i / cols);
        const xg = (c - (cols - 1) / 2) * spX;
        const yg = -r * spY + (halfLHeight - spY);
        item.gridPos.set(xg, yg, 0);
      }
    };

    // Initial sphere setup — smoothly blooms forward when triggerReveal fires
    camera.position.z = 7.0;
    globeGroup.scale.set(0.22, 0.22, 0.22);
    globeGroup.position.set(0, 0, 0);
    globeGroup.rotation.y = 1.6;

    // 6. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();
    let hasMoved = false;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (isOverlayActiveRef.current || isZoomedInRef.current) return;
      if (globeGroupRef.current) {
        gsap.killTweensOf(globeGroupRef.current.rotation);
      }
      isDragging.current = true;
      hasMoved = false;
      isAligningToCard.current = false;
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
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
        const totalDist = Math.hypot(
          clientX - pointerDownPos.current.x,
          clientY - pointerDownPos.current.y
        );
        if (totalDist > 14) {
          hasMoved = true;
        }

        if (viewModeRef.current === 'grid') {
          // Endless vertical scrolling on drag (unbounded)
          targetScrollY.current -= dy * 0.022;
        } else if (globeGroupRef.current) {
          // Dragging rotates the 3D sphere smoothly with direct finger/cursor tracking
          globeGroupRef.current.rotation.y += dx * 0.0046;
          globeGroupRef.current.rotation.x += dy * 0.0028;
          globeGroupRef.current.rotation.x = Math.max(-1.15, Math.min(1.15, globeGroupRef.current.rotation.x));
          // Fluid throw velocity accumulation with enjoyable spin momentum
          const targetVx = dy * 0.0028;
          const targetVy = dx * 0.0052;
          rotVelocity.current.x = rotVelocity.current.x * 0.30 + targetVx * 0.70;
          rotVelocity.current.y = rotVelocity.current.y * 0.30 + targetVy * 0.70;
          rotVelocity.current.y = Math.max(-0.068, Math.min(0.068, rotVelocity.current.y));
          rotVelocity.current.x = Math.max(-0.032, Math.min(0.032, rotVelocity.current.x));
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
      if (globeGroupRef.current) {
        gsap.killTweensOf(globeGroupRef.current.rotation);
      }
      isAligningToCard.current = false;

      if (e.touches.length === 1) {
        isDragging.current = true;
        hasMoved = false;
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
              current: isMobile ? 17.0 : 16.5,
              duration: 0.85,
              ease: 'power3.out',
            });
          }
        }

        lastTapTime.current = now;
        lastTapPos.current = { x: t.clientX, y: t.clientY };
        touchDownPos.current = { x: t.clientX, y: t.clientY };
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
        const totalDist = Math.hypot(
          t.clientX - touchDownPos.current.x,
          t.clientY - touchDownPos.current.y
        );

        if (totalDist > 14) {
          hasMoved = true;
        }

        if (viewModeRef.current === 'grid') {
          targetScrollY.current -= dy * 0.022;
        } else if (globeGroupRef.current) {
          // Touch drag tracks finger naturally with tactile responsiveness
          globeGroupRef.current.rotation.y += dx * 0.0052;
          globeGroupRef.current.rotation.x += dy * 0.0030;
          globeGroupRef.current.rotation.x = Math.max(-1.15, Math.min(1.15, globeGroupRef.current.rotation.x));

          const targetVx = dy * 0.0030;
          const targetVy = dx * 0.0055;
          rotVelocity.current.x = rotVelocity.current.x * 0.30 + targetVx * 0.70;
          rotVelocity.current.y = rotVelocity.current.y * 0.30 + targetVy * 0.70;
          rotVelocity.current.y = Math.max(-0.068, Math.min(0.068, rotVelocity.current.y));
          rotVelocity.current.x = Math.max(-0.032, Math.min(0.032, rotVelocity.current.x));
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

          if (globeGroupRef.current && cardDataRef.current[idx]) {
            const pos = cardDataRef.current[idx].spherePos;
            const azimuth = Math.atan2(pos.x, pos.z);
            const rawElevation = Math.asin(Math.max(-0.95, Math.min(0.95, pos.y / sphereRadius)));
            const elevation = Math.max(-0.55, Math.min(0.55, rawElevation));

            // Shortest angular distance around Y so it rotates directly to the target
            const curY = globeGroupRef.current.rotation.y;
            let diffY = (-azimuth - (curY % (Math.PI * 2))) % (Math.PI * 2);
            if (diffY > Math.PI) diffY -= Math.PI * 2;
            if (diffY < -Math.PI) diffY += Math.PI * 2;
            const targetY = curY + diffY;

            isAligningToCard.current = true;
            rotVelocity.current = { x: 0, y: 0 };

            gsap.killTweensOf(globeGroupRef.current.rotation);
            gsap.to(globeGroupRef.current.rotation, {
              x: elevation,
              y: targetY,
              z: 0,
              duration: 0.95,
              ease: 'power3.out',
              onComplete: () => {
                isAligningToCard.current = false;
              },
            });
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
        const s = isMobileNow ? 0.72 : 1.0;
        globeGroupRef.current.scale.set(s, s, s);
        updateGridLayout(isMobileNow);
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
          globeGroupRef.current.rotation.z *= 0.92;

          // 2. Silky physical inertia decay (rotates freely for ~3-4s with true momentum before softly settling)
          rotVelocity.current.y *= 0.982;
          rotVelocity.current.x *= 0.970;

          // 3. Gentle perpetual celestial idle drift
          const idleDrift = 0.0007 * (1.0 - m);
          if (Math.abs(rotVelocity.current.y) < idleDrift) {
            rotVelocity.current.y = THREE.MathUtils.lerp(rotVelocity.current.y, idleDrift, 0.04);
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
      const targetGridScale = isMobile ? 1.48 : 1.76;
      const cardScale = THREE.MathUtils.lerp(1.0, targetGridScale, m);

      // Interpolate each card between Sphere position/rotation and Responsive Endless Grid
      const cards = cardDataRef.current;
      const loopH = loopHeightRef.current;
      const halfLoopH = halfLoopHeightRef.current;

      for (let i = 0; i < cards.length; i++) {
        const item = cards[i];

        // Endless loop wrapping calculation:
        // Raw vertical position with continuous scroll
        const rawY = item.gridPos.y + gridScrollY.current;
        // Modulo wrap around loopHeight [-halfLoopHeight, +halfLoopHeight]
        const wrappedY = ((rawY + halfLoopH) % loopH + loopH) % loopH - halfLoopH;

        tempGridVec.set(item.gridPos.x, wrappedY, item.gridPos.z);

        // Smoothly position, orient, and scale card
        item.container.position.lerpVectors(item.spherePos, tempGridVec, m);
        item.container.quaternion.slerpQuaternions(item.sphereQuat, item.gridQuat, m);
        item.container.scale.setScalar(cardScale);
      }

      // Camera position interpolation (responsive to mobile zoom & grid view)
      const baseCamZ = viewModeRef.current === 'grid' ? (isMobile ? 16.5 : 14.5) : targetCamZ.current;
      const finalCamZ = isZoomedInRef.current ? (isMobile ? 12.0 : 10.5) : baseCamZ;
      camera.position.z += (finalCamZ - camera.position.z) * 0.08;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const resumeAllVideos = () => {
      globalVideoCache.forEach((vid: HTMLVideoElement) => {
        vid.defaultMuted = true;
        vid.muted = true;
        if (vid.paused) {
          vid.play().catch(() => {});
        }
      });
    };
    window.addEventListener('pointerdown', resumeAllVideos, { passive: true });
    window.addEventListener('touchstart', resumeAllVideos, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', resumeAllVideos);
      window.removeEventListener('touchstart', resumeAllVideos);
      container.removeEventListener('pointerdown', handlePointerDown as EventListener);
      window.removeEventListener('pointermove', handlePointerMove as EventListener);
      window.removeEventListener('pointerup', handlePointerUp as EventListener);
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      window.removeEventListener('touchmove', handleTouchMove as EventListener);
      window.removeEventListener('touchend', handleTouchEnd as EventListener);
      window.removeEventListener('touchcancel', handleTouchEnd as EventListener);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);

      cardGeo.dispose();
      renderer.dispose();
      clearTimeout(safetyTimeout);
    };
  }, [projects]); // Only rebuilds when projects load

  const handleExitZoom = () => {
    setIsZoomedIn(false);
  };

  return (
    <div className="celestial-sky-stage">
      {/* ── SMOOTH LOADING OVERLAY — covers screen until data & textures load ── */}
      <div className={`celestial-loading-veil ${isLoaded ? 'loaded' : ''}`}>
        <div className="celestial-loading-content">
          <div className="celestial-loading-spinner" />
          <span className="celestial-loading-text">Loading portfolio</span>
        </div>
      </div>

      {/* ── 1. LIVING BACKGROUND VIDEO ── */}
      <div className="sky-daylight-backdrop" aria-hidden="true">
        <video
          ref={(el) => {
            bgVideoRef.current = el;
            if (el) {
              el.defaultMuted = true;
              el.muted = true;
              if (!isOverlayActive && el.paused) {
                el.play().catch(() => {});
              }
            }
          }}
          className="sky-bg-video"
          src="/assets/bg-video-new.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => {
            if (bgVideoRef.current && !isOverlayActive) {
              bgVideoRef.current.defaultMuted = true;
              bgVideoRef.current.muted = true;
              bgVideoRef.current.play().catch(() => {});
            }
          }}
          onCanPlay={() => {
            if (bgVideoRef.current && !isOverlayActive) {
              bgVideoRef.current.defaultMuted = true;
              bgVideoRef.current.muted = true;
              bgVideoRef.current.play().catch(() => {});
            }
          }}
          onWaiting={() => {
            if (bgVideoRef.current && !isOverlayActive) {
              bgVideoRef.current.play().catch(() => {});
            }
          }}
          onEnded={() => {
            if (bgVideoRef.current) {
              bgVideoRef.current.currentTime = 0;
              bgVideoRef.current.play().catch(() => {});
            }
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
        <div
          className="celestial-focused-banner"
          onClick={() => setIsZoomedIn(true)}
          role="button"
          tabIndex={0}
          title="Click to dive into project"
        >
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
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomedIn(true);
            }}
          >
            <span className="celestial-btn-text-desktop">Inspect Project</span>
            <span className="celestial-btn-text-mobile">View</span>
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
                  className="celestial-action-btn primary"
                  onClick={() => {
                    handleExitZoom();
                    onSelectProject(focusedProject);
                  }}
                >
                  <span>{focusedProject.is_case_study ? 'View Case Study' : 'View Project'}</span>
                  <ArrowUpRight size={16} />
                </button>
                <button
                  type="button"
                  className="celestial-action-btn secondary"
                  onClick={handleExitZoom}
                >
                  <span className="celestial-btn-text-desktop">
                    {viewMode === 'grid' ? 'Back to Grid' : 'Back to Globe'}
                  </span>
                  <span className="celestial-btn-text-mobile">Back</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
