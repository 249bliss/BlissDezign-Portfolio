import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PROJECTS, ProjectData } from '../../data/projectsData';
import { PerspectiveSpatialGallery } from './PerspectiveSpatialGallery';

export type SpatialMode = 'RINGS' | 'SPIRAL' | 'SPHERE' | 'FLOW';

interface SpatialSceneProps {
  mode: SpatialMode;
  onSelectProject: (project: ProjectData) => void;
  onHoverProject: (project: ProjectData | null, index: number) => void;
  activeProject?: ProjectData | null;
}

const isWebGLAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

export const SpatialScene: React.FC<SpatialSceneProps> = ({
  mode,
  onSelectProject,
  onHoverProject,
}) => {
  const [webglSupported] = useState<boolean>(() => isWebGLAvailable());
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cardsGroupRef = useRef<THREE.Group | null>(null);
  const centerEmblemRef = useRef<THREE.Mesh | null>(null);
  const cardMeshesRef = useRef<{ mesh: THREE.Mesh; project: ProjectData; index: number }[]>([]);

  const rotationTarget = useRef({ x: 0, y: 0 });
  const rotationCurrent = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const autoRotateSpeed = useRef(0.0015);
  const hoveredIndexRef = useRef<number | null>(null);

  const getCardTargetTransform = (index: number, total: number, currentMode: SpatialMode) => {
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();

    if (currentMode === 'RINGS') {
      const isOuter = index % 2 === 0;
      const ringIndex = Math.floor(index / 2);
      const ringCount = Math.ceil(total / 2);
      const angle = (ringIndex / ringCount) * Math.PI * 2 + (isOuter ? 0 : Math.PI / ringCount);
      const radius = isOuter ? 9.5 : 6.8;
      const yOffset = isOuter ? -0.6 : 0.8;

      position.x = Math.sin(angle) * radius;
      position.z = Math.cos(angle) * radius;
      position.y = yOffset + Math.sin(angle * 2) * 0.4;

      rotation.y = angle + Math.PI;
      rotation.x = isOuter ? -0.08 : 0.08;
    } else if (currentMode === 'SPIRAL') {
      const angle = (index / total) * Math.PI * 3.5;
      const radius = 7.5;
      const heightStep = 1.3;
      const startY = -((total * heightStep) / 2) + 1.2;

      position.x = Math.sin(angle) * radius;
      position.z = Math.cos(angle) * radius;
      position.y = startY + index * heightStep;

      rotation.y = angle + Math.PI;
      rotation.x = -0.1;
      rotation.z = Math.sin(angle) * 0.05;
    } else if (currentMode === 'SPHERE') {
      const phi = Math.acos(-1 + (2 * index) / total);
      const theta = Math.sqrt(total * Math.PI) * phi;
      const radius = 8.2;

      position.x = radius * Math.cos(theta) * Math.sin(phi);
      position.y = radius * Math.sin(theta) * Math.sin(phi);
      position.z = radius * Math.cos(phi);

      const targetLook = new THREE.Vector3(0, 0, 0);
      const dummy = new THREE.Object3D();
      dummy.position.copy(position);
      dummy.lookAt(targetLook);
      rotation.copy(dummy.rotation);
      rotation.y += Math.PI;
    } else {
      const span = 18;
      const x = ((index - (total - 1) / 2) / total) * span;
      const z = -Math.cos((x / span) * Math.PI) * 4.5 + 4.5;
      const y = Math.sin((index / total) * Math.PI * 2) * 0.6;

      position.set(x, y, z - 2);
      rotation.set(0, -(x / span) * 0.8, 0);
    }

    return { position, rotation };
  };

  useEffect(() => {
    if (!webglSupported) return;
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0xffffff, 0.02);

    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 14.5);
    cameraRef.current = camera;

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting (Bright, high-contrast studio environment)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(10, 15, 12);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf4f4f5, 1.5);
    fillLight.position.set(-12, -8, -10);
    scene.add(fillLight);

    // Cylindrical fine architectural wireframe grid cage
    const gridGroup = new THREE.Group();
    const cylinderGeo = new THREE.CylinderGeometry(13.5, 13.5, 24, 36, 16, true);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xd4d4d8,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const cylinderCage = new THREE.Mesh(cylinderGeo, wireframeMat);
    gridGroup.add(cylinderCage);
    scene.add(gridGroup);

    // Center Chrome Sculpture
    const geom = new THREE.TorusKnotGeometry(1.6, 0.48, 128, 32, 2, 3);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const centerMesh = new THREE.Mesh(geom, mat);
    centerMesh.scale.set(0.85, 0.85, 0.85);
    scene.add(centerMesh);
    centerEmblemRef.current = centerMesh;

    // Cards
    const cardsGroup = new THREE.Group();
    cardsGroupRef.current = cardsGroup;
    scene.add(cardsGroup);

    const textureLoader = new THREE.TextureLoader();
    cardMeshesRef.current = [];

    PROJECTS.forEach((project, index) => {
      const cardWidth = 2.7;
      const cardHeight = 3.6;
      const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight, 16, 16);
      const cardMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        side: THREE.DoubleSide,
      });

      textureLoader.load(
        project.thumbnail,
        (loadedTex) => {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          cardMat.map = loadedTex;
          cardMat.needsUpdate = true;
        },
        undefined,
        () => {}
      );

      const mesh = new THREE.Mesh(cardGeo, cardMat);
      mesh.userData = { project, index };

      const target = getCardTargetTransform(index, PROJECTS.length, mode);
      mesh.position.copy(target.position);
      mesh.rotation.copy(target.rotation);

      cardsGroup.add(mesh);
      cardMeshesRef.current.push({ mesh, project, index });
    });

    // Interaction
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = container.getBoundingClientRect();
      mouseCoord.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging.current) {
        const deltaX = clientX - previousMousePosition.current.x;
        const deltaY = clientY - previousMousePosition.current.y;

        rotationTarget.current.y += deltaX * 0.006;
        rotationTarget.current.x += deltaY * 0.003;
        rotationTarget.current.x = Math.max(-0.6, Math.min(0.6, rotationTarget.current.x));

        previousMousePosition.current = { x: clientX, y: clientY };
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      rotationTarget.current.y += e.deltaY * 0.0012;
      rotationTarget.current.x += e.deltaX * 0.0006;
      rotationTarget.current.x = Math.max(-0.6, Math.min(0.6, rotationTarget.current.x));
    };

    const handleClick = () => {
      if (!cameraRef.current || !cardsGroupRef.current) return;
      raycaster.setFromCamera(mouseCoord, cameraRef.current);
      const meshes = cardMeshesRef.current.map((c) => c.mesh);
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const hitData = cardMeshesRef.current.find((c) => c.mesh === hitMesh);
        if (hitData) {
          onSelectProject(hitData.project);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElement.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: true });
    domElement.addEventListener('click', handleClick);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (!isDragging.current) {
        rotationTarget.current.y += autoRotateSpeed.current;
      }
      rotationCurrent.current.x += (rotationTarget.current.x - rotationCurrent.current.x) * 0.06;
      rotationCurrent.current.y += (rotationTarget.current.y - rotationCurrent.current.y) * 0.06;

      if (cardsGroupRef.current) {
        cardsGroupRef.current.rotation.y = rotationCurrent.current.y;
        cardsGroupRef.current.rotation.x = rotationCurrent.current.x;
      }

      if (centerEmblemRef.current) {
        centerEmblemRef.current.rotation.x = elapsedTime * 0.4 + rotationCurrent.current.x;
        centerEmblemRef.current.rotation.y = elapsedTime * 0.6 + rotationCurrent.current.y * 0.5;
        centerEmblemRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.25;
      }

      if (cameraRef.current && cardsGroupRef.current) {
        raycaster.setFromCamera(mouseCoord, cameraRef.current);
        const meshes = cardMeshesRef.current.map((c) => c.mesh);
        const intersects = raycaster.intersectObjects(meshes, false);

        let currentHoveredIndex: number | null = null;
        if (intersects.length > 0 && !isDragging.current) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const hitData = cardMeshesRef.current.find((c) => c.mesh === hitMesh);
          if (hitData) {
            currentHoveredIndex = hitData.index;
          }
        }

        if (currentHoveredIndex !== hoveredIndexRef.current) {
          hoveredIndexRef.current = currentHoveredIndex;
          if (currentHoveredIndex !== null) {
            onHoverProject(PROJECTS[currentHoveredIndex], currentHoveredIndex);
            domElement.style.cursor = 'pointer';
          } else {
            onHoverProject(null, -1);
            domElement.style.cursor = isDragging.current ? 'grabbing' : 'grab';
          }
        }

        cardMeshesRef.current.forEach(({ mesh, index }) => {
          const isHovered = hoveredIndexRef.current === index;
          const targetScale = isHovered ? 1.12 : 1.0;
          mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.1);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElement.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('click', handleClick);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [webglSupported]);

  if (!webglSupported) {
    return (
      <PerspectiveSpatialGallery
        mode={mode}
        onSelectProject={onSelectProject}
        onHoverProject={onHoverProject}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className="spatial-canvas-container"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        touchAction: 'none',
        background: '#ffffff',
      }}
    />
  );
};
