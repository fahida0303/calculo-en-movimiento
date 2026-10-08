import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GraphControls } from './GraphControls';
import type { GraphData, Point3D } from '../types';

interface Graph3DProps {
  graphData: GraphData | null;
  requirement: number;
  coordinates: { X: string; Y: string; Z: string };
  functionExpression: string;
}

/* ─────────────────────────────────────────────────────────────
   HELPERS & MATH UTILITIES
   ───────────────────────────────────────────────────────────── */

/** Formatea números matemáticos de forma limpia sin precisión excesiva ni ceros redundantes */
function formatMathNum(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  if (!Number.isFinite(val)) return 'No definida';
  if (Math.abs(val) < 1e-10) return '0';
  if (Number.isInteger(val)) return val.toString();
  const rounded = Math.round(val * 1000) / 1000;
  return rounded.toString();
}

/** Genera una textura circular suave con antialiasing para partículas matemáticas */
function createCircleParticleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)');
  grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Crea una etiqueta de texto en Canvas de alta resolución (2x DPI)
 * con diseño académico minimalista: cápsula compacta, fondo oscuro translúcido y borde sutil.
 */
function makeTextSprite(
  text: string,
  opts: {
    fontSize?: number;
    color?: string;
    bgColor?: string;
    borderColor?: string;
    borderWidth?: number;
    bold?: boolean;
    scale?: number;
    paddingX?: number;
    paddingY?: number;
    borderRadius?: number;
    noBox?: boolean;
  } = {}
): THREE.Sprite {
  const fontSize = opts.fontSize ?? (opts.noBox ? 22 : 24);
  const color = opts.color ?? '#f8fafc';
  const bold = opts.bold ?? true;
  const scale = opts.scale ?? (opts.noBox ? 0.22 : 0.36);
  const px = opts.paddingX ?? (opts.noBox ? 2 : 12);
  const py = opts.paddingY ?? (opts.noBox ? 2 : 6);
  const radius = opts.borderRadius ?? 6;

  // Renderizado a 2x de resolución para nitidez absoluta en 3D
  const dpi = 2;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const fontStr = `${bold ? '600' : '500'} ${fontSize * dpi}px "Inter", "JetBrains Mono", sans-serif`;
  ctx.font = fontStr;
  const metrics = ctx.measureText(text);

  const cssW = Math.max(Math.ceil(metrics.width / dpi) + px * 2, opts.noBox ? 16 : 32);
  const cssH = Math.max(fontSize + py * 2, opts.noBox ? 16 : 26);

  canvas.width = cssW * dpi;
  canvas.height = cssH * dpi;

  // Restaurar contexto tras cambio de dimensiones
  ctx.font = fontStr;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (!opts.noBox) {
    // Fondo oscuro translúcido (estilo software matemático moderno)
    ctx.fillStyle = opts.bgColor || 'rgba(9, 14, 26, 0.90)';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, radius * dpi);
    ctx.fill();

    // Borde fino de alta precisión
    ctx.strokeStyle = opts.borderColor || '#38bdf8';
    ctx.lineWidth = (opts.borderWidth ?? 1) * dpi;
    ctx.beginPath();
    ctx.roundRect(
      ctx.lineWidth / 2,
      ctx.lineWidth / 2,
      canvas.width - ctx.lineWidth,
      canvas.height - ctx.lineWidth,
      radius * dpi
    );
    ctx.stroke();
  }

  // Texto nítido
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);
  const aspect = cssW / cssH;
  sprite.scale.set(scale * aspect, scale, 1);
  return sprite;
}

/**
 * Crea una etiqueta anclada con línea de guía (leader line) fina y discreta.
 * Evita que las etiquetas floten en el vacío o se amontonen sobre las curvas.
 */
function makeCalloutBadge(
  text: string,
  opts: {
    color: string;
    borderColor?: string;
    scale?: number;
    lineOffset: THREE.Vector3;
    fontSize?: number;
    showAnchorDot?: boolean;
  }
): THREE.Group {
  const group = new THREE.Group();
  const colorNum = parseInt(opts.color.replace('#', '0x'), 16) || 0x38bdf8;

  // Línea guía sutil y fina desde (0, 0, 0) hasta lineOffset
  const lineGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    opts.lineOffset,
  ]);
  const lineMat = new THREE.LineDashedMaterial({
    color: colorNum,
    dashSize: 0.12,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.55,
  });
  const line = new THREE.Line(lineGeom, lineMat);
  line.computeLineDistances();
  group.add(line);

  // Pequeño marcador en el punto de contacto
  if (opts.showAnchorDot !== false) {
    const dotGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: colorNum });
    group.add(new THREE.Mesh(dotGeom, dotMat));
  }

  // Sprite compacto de la etiqueta en el extremo de la guía
  const sprite = makeTextSprite(text, {
    fontSize: opts.fontSize ?? 22,
    color: '#f8fafc',
    bgColor: 'rgba(9, 14, 26, 0.92)',
    borderColor: opts.borderColor || opts.color,
    borderWidth: 1.0,
    bold: true,
    scale: opts.scale ?? 0.36,
    borderRadius: 5,
    paddingX: 10,
    paddingY: 5,
  });
  sprite.position.copy(opts.lineOffset);
  group.add(sprite);

  return group;
}

/** Crea un sutil anillo pulsante alrededor de puntos importantes */
function makeGlowRing(
  innerR: number,
  outerR: number,
  color: number,
  opacity: number = 0.45
): THREE.Mesh {
  const geom = new THREE.RingGeometry(innerR, outerR, 32);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Mesh(geom, mat);
}

/** Punta de flecha cónica para los ejes */
function makeArrowCone(color: number, height: number = 0.35): THREE.Mesh {
  const geom = new THREE.ConeGeometry(0.09, height, 16);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.5,
  });
  return new THREE.Mesh(geom, mat);
}

/* ─────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
   ───────────────────────────────────────────────────────────── */

export const Graph3D: React.FC<Graph3DProps> = ({
  graphData,
  requirement,
  coordinates,
  functionExpression: _functionExpression,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const glowRingsRef = useRef<THREE.Mesh[]>([]);

  // Textura circular reutilizable para partículas matemáticas
  const circleTexRef = useRef<THREE.Texture | null>(null);

  // Actualizador de partículas matemáticas dinámicas (animaciones conceptuales)
  const mathParticleUpdaterRef = useRef<((time: number) => void) | null>(null);

  // Ángulo de cámara orbital:
  // Inicialmente frontal con una sutil elevación y rotación que permite apreciar
  // la profundidad 3D (capas Z) de manera natural, académica y sin deformación.
  const DEFAULT_THETA = 0.12; // ~7° de rotación lateral (perspectiva sutil)
  const DEFAULT_PHI = 1.48;   // ~85° (visión principalmente frontal, ligeramente elevada)
  const DEFAULT_RADIUS = 18;

  const cameraAngleRef = useRef({
    theta: DEFAULT_THETA,
    phi: DEFAULT_PHI,
    radius: DEFAULT_RADIUS,
  });
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));

  const [telemetry, setTelemetry] = useState({ azimuth: 7, elevation: 5 });
  const [is2DView, setIs2DView] = useState(false);

  // Actualizar la posición y el objetivo de la cámara
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta) + targetRef.current.x;
    const y = radius * Math.cos(phi) + targetRef.current.y;
    const z = radius * Math.sin(phi) * Math.cos(theta) + targetRef.current.z;
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetRef.current);

    // Calcular telemetría en grados para el panel de controles
    const azDeg = Math.round((theta * 180) / Math.PI) % 360;
    const elDeg = Math.round(((Math.PI / 2 - phi) * 180) / Math.PI);
    setTelemetry({ azimuth: azDeg, elevation: elDeg });
  }, []);

  // Encuadre automático centrado en la región matemática de interés
  const autoFrameMathRegion = useCallback(() => {
    if (!graphData?.curve_points || graphData.curve_points.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Calcular límites de la curva (filtrando asíntotas y extremos fuera de rango)
    graphData.curve_points.forEach((p) => {
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
        if (Math.abs(p.x) <= 12 && Math.abs(p.y) <= 12) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
      }
    });

    const visuals = graphData.requirement_visuals || {};
    if (visuals.point) {
      minX = Math.min(minX, visuals.point.x);
      maxX = Math.max(maxX, visuals.point.x);
      minY = Math.min(minY, visuals.point.y);
      maxY = Math.max(maxY, visuals.point.y);
    }
    if (visuals.point_a && visuals.point_b) {
      minX = Math.min(minX, visuals.point_a.x, visuals.point_b.x);
      maxX = Math.max(maxX, visuals.point_a.x, visuals.point_b.x);
      minY = Math.min(minY, visuals.point_a.y, visuals.point_b.y);
      maxY = Math.max(maxY, visuals.point_a.y, visuals.point_b.y);
    }

    if (minX !== Infinity && maxX !== -Infinity) {
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = requirement === 3 ? 1.2 : 0; // En requisito 3, centrar entre las capas Z (0 a 3)

      targetRef.current.set(centerX, centerY, centerZ);

      // Calcular radio ideal de la cámara según la envergadura de las funciones
      const spanX = Math.max(maxX - minX, 4);
      const spanY = Math.max(maxY - minY, 4);
      const maxSpan = Math.max(spanX, spanY * 1.1);

      if (cameraRef.current) {
        const fovRad = (cameraRef.current.fov * Math.PI) / 180;
        const fitRadius = (maxSpan / 2) / Math.tan(fovRad / 2) * 1.35;
        cameraAngleRef.current.radius = Math.max(12, Math.min(32, fitRadius));
      }
    }

    updateCameraPosition();
  }, [graphData, requirement, updateCameraPosition]);

  // Controles de cámara
  const handleResetView = () => {
    cameraAngleRef.current.theta = DEFAULT_THETA;
    cameraAngleRef.current.phi = DEFAULT_PHI;
    setIs2DView(false);
    autoFrameMathRegion();
  };

  const handleZoomIn = () => {
    cameraAngleRef.current.radius = Math.max(6, cameraAngleRef.current.radius - 2.5);
    updateCameraPosition();
  };

  const handleZoomOut = () => {
    cameraAngleRef.current.radius = Math.min(48, cameraAngleRef.current.radius + 2.5);
    updateCameraPosition();
  };

  const handleTopView = () => {
    cameraAngleRef.current.theta = 0;
    cameraAngleRef.current.phi = Math.PI / 2;
    setIs2DView(true);
    updateCameraPosition();
  };

  const handlePerspectiveView = () => {
    cameraAngleRef.current.theta = 0.35; // ~20° vista 3D elegante
    cameraAngleRef.current.phi = 1.35;   // ~77° elevación natural
    setIs2DView(false);
    updateCameraPosition();
  };

  /* =============================================================
     INICIALIZACIÓN DE LA ESCENA THREE.JS
     ============================================================= */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // ── 1. Textura de partículas circulares ──
    circleTexRef.current = createCircleParticleTexture();

    // ── 2. Escena con fondo oscuro académico y limpio ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c16);
    sceneRef.current = scene;

    // ── 3. Iluminación profesional y equilibrada (sin glare excesivo) ──
    const ambientLight = new THREE.AmbientLight(0xf1f5f9, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    keyLight.position.set(12, 20, 18);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.5);
    rimLight.position.set(-15, -8, -12);
    scene.add(rimLight);

    // ── 4. Cámara con perspectiva natural y sin distorsión ──
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 300);
    cameraRef.current = camera;
    updateCameraPosition();

    // ── 5. Renderizador WebGL con alta precisión ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── 6. Cuadrículas sutiles y discretas (NO compiten con las funciones) ──
    // Cuadrícula en el suelo XZ
    const floorGrid = new THREE.GridHelper(26, 26, 0x1e293b, 0x0f172a);
    floorGrid.position.y = -6;
    (floorGrid.material as THREE.Material).transparent = true;
    (floorGrid.material as THREE.Material).opacity = 0.12;
    scene.add(floorGrid);

    // Cuadrícula sutil en el plano XY (donde vive f(x))
    const xyGrid = new THREE.GridHelper(24, 24, 0x334155, 0x1e293b);
    xyGrid.rotation.x = Math.PI / 2;
    xyGrid.position.set(0, 0, -0.02);
    (xyGrid.material as THREE.Material).transparent = true;
    (xyGrid.material as THREE.Material).opacity = 0.14;
    scene.add(xyGrid);

    // ── 7. Ejes Cartesianos Limpios y Precisos ──
    const axesGroup = new THREE.Group();
    const AXIS_LEN = 11;
    const TICK_SIZE = 0.14;

    const addAxisLine = (from: THREE.Vector3, to: THREE.Vector3, color: number) => {
      const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
      });
      axesGroup.add(new THREE.Line(geom, mat));
    };

    // Eje X (Azul Cielo / Cyan discreto)
    addAxisLine(new THREE.Vector3(-AXIS_LEN, 0, 0), new THREE.Vector3(AXIS_LEN, 0, 0), 0x38bdf8);
    const xArrow = makeArrowCone(0x38bdf8);
    xArrow.position.set(AXIS_LEN + 0.2, 0, 0);
    xArrow.rotation.z = -Math.PI / 2;
    axesGroup.add(xArrow);
    const xLabel = makeTextSprite('X', { fontSize: 24, color: '#38bdf8', bold: true, scale: 0.28, noBox: true });
    xLabel.position.set(AXIS_LEN + 0.6, 0.25, 0);
    axesGroup.add(xLabel);

    // Eje Y (Violeta / f(x))
    addAxisLine(new THREE.Vector3(0, -AXIS_LEN, 0), new THREE.Vector3(0, AXIS_LEN, 0), 0xa78bfa);
    const yArrow = makeArrowCone(0xa78bfa);
    yArrow.position.set(0, AXIS_LEN + 0.2, 0);
    axesGroup.add(yArrow);
    const yLabel = makeTextSprite('Y', { fontSize: 24, color: '#a78bfa', bold: true, scale: 0.28, noBox: true });
    yLabel.position.set(0.35, AXIS_LEN + 0.45, 0);
    axesGroup.add(yLabel);

    // Eje Z (Esmeralda discreto)
    addAxisLine(new THREE.Vector3(0, 0, -0.5), new THREE.Vector3(0, 0, 5), 0x34d399);
    const zArrow = makeArrowCone(0x34d399);
    zArrow.position.set(0, 0, 5.2);
    zArrow.rotation.x = Math.PI / 2;
    axesGroup.add(zArrow);
    const zLabel = makeTextSprite('Z', { fontSize: 22, color: '#34d399', bold: true, scale: 0.26, noBox: true });
    zLabel.position.set(0.2, 0.2, 5.4);
    axesGroup.add(zLabel);

    // Marcas de graduación en ejes X e Y (espaciadas, números pequeños y sin saturar)
    const tickIntervals = [-10, -8, -6, -4, -2, 2, 4, 6, 8, 10];
    for (const i of tickIntervals) {
      // Tick en X
      const tickGeomX = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, -TICK_SIZE, 0),
        new THREE.Vector3(i, TICK_SIZE, 0),
      ]);
      const tickMatX = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.5 });
      axesGroup.add(new THREE.Line(tickGeomX, tickMatX));

      // Mostrar número en múltiplos de 4
      if (Math.abs(i) % 4 === 0) {
        const numSprite = makeTextSprite(i.toString(), {
          fontSize: 18,
          color: '#64748b',
          scale: 0.18,
          noBox: true,
        });
        numSprite.position.set(i, -0.35, 0);
        axesGroup.add(numSprite);
      }

      // Tick en Y
      const tickGeomY = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-TICK_SIZE, i, 0),
        new THREE.Vector3(TICK_SIZE, i, 0),
      ]);
      const tickMatY = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.5 });
      axesGroup.add(new THREE.Line(tickGeomY, tickMatY));

      if (Math.abs(i) % 4 === 0) {
        const numSprite = makeTextSprite(i.toString(), {
          fontSize: 18,
          color: '#64748b',
          scale: 0.18,
          noBox: true,
        });
        numSprite.position.set(-0.42, i, 0);
        axesGroup.add(numSprite);
      }
    }

    scene.add(axesGroup);

    // ── 8. Grupo dinámico para curvas, áreas, puntos y partículas matemáticas ──
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    // ── 9. Interacción de órbita y paneo con el ratón ──
    let isDragging = false;
    let isPanning = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isDragging = true;
      if (e.button === 2) isPanning = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      if (isDragging) {
        cameraAngleRef.current.theta -= dx * 0.007;
        // Limitar phi para evitar que la escena se vuelque de cabeza
        cameraAngleRef.current.phi = Math.max(
          0.15,
          Math.min(Math.PI / 2 - 0.04, cameraAngleRef.current.phi - dy * 0.007)
        );
        updateCameraPosition();
      } else if (isPanning) {
        targetRef.current.x -= dx * 0.018;
        targetRef.current.y += dy * 0.018;
        updateCameraPosition();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      isPanning = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(
        6,
        Math.min(60, cameraAngleRef.current.radius + e.deltaY * 0.018)
      );
      updateCameraPosition();
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('contextmenu', onContextMenu);

    // ── 10. Bucle de animación (Render loop) ──
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      // Pulsación suave de los anillos de puntos destacados
      glowRingsRef.current.forEach((ring) => {
        const pulse = 1.0 + 0.06 * Math.sin(t * 2.0);
        ring.scale.set(pulse, pulse, 1);
      });

      // Actualizar partículas matemáticas significativas
      if (mathParticleUpdaterRef.current) {
        mathParticleUpdaterRef.current(t);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [updateCameraPosition]);

  /* =============================================================
     ACTUALIZACIÓN DE ELEMENTOS DINÁMICOS (CURVAS, ÁREAS, LABELS)
     ============================================================= */
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    // Limpiar elementos dinámicos previos
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }
    glowRingsRef.current = [];
    mathParticleUpdaterRef.current = null;

    if (!graphData || !graphData.curve_points || graphData.curve_points.length === 0) return;

    const visuals = graphData.requirement_visuals || {};
    const particleTex = circleTexRef.current || createCircleParticleTexture();

    /* ─────────────────────────────────────────────────────────
       1. CURVA PRINCIPAL f(x) (Acabado sólido, uniforme y nítido)
       ───────────────────────────────────────────────────────── */
    const segments: Record<number, Point3D[]> = {};
    graphData.curve_points.forEach((pt) => {
      const segId = pt.segment || 0;
      if (!segments[segId]) segments[segId] = [];
      segments[segId].push(pt);
    });

    Object.values(segments).forEach((pts) => {
      if (pts.length < 2) return;
      const curveVectors = pts.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const curve = new THREE.CatmullRomCurve3(curveVectors, false);
      const tubeDivs = Math.min(pts.length * 3, 260);

      // Tubo de grosor moderado y uniforme (radio 0.045) sin glow exagerado
      const tubeGeom = new THREE.TubeGeometry(curve, tubeDivs, 0.045, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        roughness: 0.25,
        metalness: 0.3,
      });
      group.add(new THREE.Mesh(tubeGeom, tubeMat));
    });

    /* ─────────────────────────────────────────────────────────
       2. REQUISITO 1: EVALUACIÓN, TANGENTE Y LÍMITE DE LA DERIVADA
       ───────────────────────────────────────────────────────── */
    if (requirement === 1 && visuals.point) {
      const pt = visuals.point;
      const slope = visuals.slope ?? 0;
      const slopeNum = typeof slope === 'number' ? slope : parseFloat(slope);

      // Punto evaluado P(a, f(a))
      const sphereGeom = new THREE.SphereGeometry(0.18, 20, 20);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.6,
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(pt.x, pt.y, pt.z);
      group.add(sphere);

      // Anillo sutil alrededor del punto P
      const haloRing = makeGlowRing(0.26, 0.36, 0xfbbf24, 0.5);
      haloRing.position.copy(sphere.position);
      haloRing.rotation.x = Math.PI / 2;
      group.add(haloRing);
      glowRingsRef.current.push(haloRing);

      // Línea guía vertical hasta el eje X
      const vertGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pt.x, pt.y, pt.z),
        new THREE.Vector3(pt.x, 0, pt.z),
      ]);
      const vertMat = new THREE.LineDashedMaterial({
        color: 0x818cf8,
        dashSize: 0.15,
        gapSize: 0.08,
        transparent: true,
        opacity: 0.6,
      });
      const vertLine = new THREE.Line(vertGeom, vertMat);
      vertLine.computeLineDistances();
      group.add(vertLine);

      // Etiqueta compacta para el punto P con línea guía sin estorbar
      const ptCallout = makeCalloutBadge(
        `P(${formatMathNum(pt.x)}, ${formatMathNum(pt.y)})`,
        {
          color: '#fbbf24',
          borderColor: '#f59e0b',
          scale: 0.36,
          lineOffset: new THREE.Vector3(-1.4, 0.9, 0),
        }
      );
      ptCallout.position.set(pt.x, pt.y, pt.z);
      group.add(ptCallout);

      // Recta Tangente
      if (visuals.tangent_points && visuals.tangent_points.length > 1) {
        const tPts = visuals.tangent_points.map((p: any) => new THREE.Vector3(p.x, p.y, p.z));
        const tCurve = new THREE.CatmullRomCurve3(tPts, false);
        const tTubeGeom = new THREE.TubeGeometry(tCurve, 40, 0.038, 10, false);
        const tTubeMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.45,
          roughness: 0.25,
          metalness: 0.4,
        });
        group.add(new THREE.Mesh(tTubeGeom, tTubeMat));

        // Etiqueta de la recta tangente posicionada discretamente a lo largo de la recta
        const tangentEqText = visuals.tangent_equation || visuals.tangent_equation_simplified || 'y = m·x + b';
        const tangentBadge = makeCalloutBadge(`Tangente: ${tangentEqText}`, {
          color: '#10b981',
          borderColor: '#059669',
          scale: 0.36,
          lineOffset: new THREE.Vector3(1.8, 0.8, 0),
        });
        tangentBadge.position.set(pt.x, pt.y, pt.z);
        group.add(tangentBadge);
      }

      // Triángulo de Pendiente (Δy / Δx)
      const runDelta = 1.2;
      if (Number.isFinite(slopeNum) && Math.abs(slopeNum) > 1e-4) {
        const riseDelta = slopeNum * runDelta;
        const pBase = new THREE.Vector3(pt.x, pt.y, 0);
        const pCorner = new THREE.Vector3(pt.x + runDelta, pt.y, 0);
        const pTop = new THREE.Vector3(pt.x + runDelta, pt.y + riseDelta, 0);

        const triGeom = new THREE.BufferGeometry();
        triGeom.setFromPoints([pBase, pCorner, pTop]);
        triGeom.computeVertexNormals();
        const triMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide,
        });
        group.add(new THREE.Mesh(triGeom, triMat));

        const addSlopeDashedLine = (from: THREE.Vector3, to: THREE.Vector3, col: number) => {
          const lGeom = new THREE.BufferGeometry().setFromPoints([from, to]);
          const lMat = new THREE.LineDashedMaterial({ color: col, dashSize: 0.1, gapSize: 0.06 });
          const lMesh = new THREE.Line(lGeom, lMat);
          lMesh.computeLineDistances();
          group.add(lMesh);
        };
        addSlopeDashedLine(pBase, pCorner, 0x38bdf8); // Base Δx
        addSlopeDashedLine(pCorner, pTop, 0xec4899);   // Altura Δy
      }

      // Badge: Pendiente m
      const slopeDisplay = typeof visuals.slope === 'number' ? formatMathNum(visuals.slope) : (visuals.slope || 'No definida');
      const slopeBadge = makeTextSprite(`m = f'(a) = ${slopeDisplay}`, {
        fontSize: 20,
        color: '#fbbf24',
        bgColor: 'rgba(9, 14, 26, 0.9)',
        borderColor: '#f59e0b',
        borderWidth: 1.0,
        bold: true,
        scale: 0.32,
      });
      slopeBadge.position.set(pt.x + runDelta / 2, pt.y - 0.45, 0);
      group.add(slopeBadge);

      // ── PARTÍCULAS MATEMÁTICAS REQUISITO 1: PROCESO LÍMITE h -> 0 ──
      // Partículas a lo largo de la curva convergiendo hacia el punto P(a, f(a))
      // representando la definición analítica de la derivada como límite de rectas secantes.
      const pCount = 20;
      const pGeom = new THREE.BufferGeometry();
      const pPositions = new Float32Array(pCount * 3);
      const pColors = new Float32Array(pCount * 3);

      const hOffsets = new Float32Array(pCount);
      const hSpeeds = new Float32Array(pCount);
      const hSides = new Float32Array(pCount); // -1 para izquierda, +1 para derecha

      for (let i = 0; i < pCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        hSides[i] = side;
        hOffsets[i] = (i / pCount) * 2.2 + 0.15;
        hSpeeds[i] = 0.006 + Math.random() * 0.004;

        pColors[i * 3] = 0.98;
        pColors[i * 3 + 1] = 0.75;
        pColors[i * 3 + 2] = 0.14;
      }

      pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      pGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

      const pMat = new THREE.PointsMaterial({
        size: 0.22,
        map: particleTex,
        transparent: true,
        opacity: 0.75,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const pointsMesh = new THREE.Points(pGeom, pMat);
      group.add(pointsMesh);

      // Función de evaluación rápida basada en la pendiente local
      mathParticleUpdaterRef.current = () => {
        const pos = pGeom.attributes.position.array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          // Desplazamiento progresivo hacia h = 0
          hOffsets[i] -= hSpeeds[i];
          if (hOffsets[i] <= 0.08) {
            hOffsets[i] = 2.0; // Reinicio suave al extremo exterior
          }

          const curX = pt.x + hSides[i] * hOffsets[i];
          // Aproximación de orden cuadrático suave alrededor de P
          const curY = pt.y + slopeNum * (curX - pt.x);

          pos[i * 3] = curX;
          pos[i * 3 + 1] = curY;
          pos[i * 3 + 2] = 0;
        }
        pGeom.attributes.position.needsUpdate = true;
      };
    }

    /* ─────────────────────────────────────────────────────────
       3. REQUISITO 2: SECANTE, ÁREA BAJO LA CURVA Y LÍMITES
       ───────────────────────────────────────────────────────── */
    if (requirement === 2 && visuals.point_a && visuals.point_b) {
      const pA = visuals.point_a;
      const pB = visuals.point_b;
      const rateOfChange = visuals.rate_of_change ?? 0;

      // Marcador A
      const markA = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 18, 18),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6 })
      );
      markA.position.set(pA.x, pA.y, pA.z);
      group.add(markA);

      const ringA = makeGlowRing(0.24, 0.32, 0x10b981, 0.4);
      ringA.position.copy(markA.position);
      ringA.rotation.x = Math.PI / 2;
      group.add(ringA);
      glowRingsRef.current.push(ringA);

      const calloutA = makeCalloutBadge(`A(${formatMathNum(pA.x)}, ${formatMathNum(pA.y)})`, {
        color: '#10b981',
        scale: 0.36,
        lineOffset: new THREE.Vector3(-1.2, 0.9, 0),
      });
      calloutA.position.set(pA.x, pA.y, pA.z);
      group.add(calloutA);

      // Marcador B
      const markB = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 18, 18),
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.6 })
      );
      markB.position.set(pB.x, pB.y, pB.z);
      group.add(markB);

      const ringB = makeGlowRing(0.24, 0.32, 0xec4899, 0.4);
      ringB.position.copy(markB.position);
      ringB.rotation.x = Math.PI / 2;
      group.add(ringB);
      glowRingsRef.current.push(ringB);

      const calloutB = makeCalloutBadge(`B(${formatMathNum(pB.x)}, ${formatMathNum(pB.y)})`, {
        color: '#ec4899',
        scale: 0.36,
        lineOffset: new THREE.Vector3(1.2, 0.9, 0),
      });
      calloutB.position.set(pB.x, pB.y, pB.z);
      group.add(calloutB);

      // Recta Secante
      if (visuals.secant_points && visuals.secant_points.length > 1) {
        const sPts = visuals.secant_points.map((p: any) => new THREE.Vector3(p.x, p.y, p.z));
        const sCurve = new THREE.CatmullRomCurve3(sPts, false);
        const sTubeGeom = new THREE.TubeGeometry(sCurve, 30, 0.034, 10, false);
        const sTubeMat = new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xbe123c,
          emissiveIntensity: 0.45,
        });
        group.add(new THREE.Mesh(sTubeGeom, sTubeMat));

        // Etiqueta de la ecuación secante
        if (visuals.secant_equation) {
          const secEqBadge = makeCalloutBadge(`Secante: ${visuals.secant_equation}`, {
            color: '#fda4af',
            borderColor: '#f43f5e',
            scale: 0.36,
            lineOffset: new THREE.Vector3(1.4, -0.9, 0),
          });
          secEqBadge.position.set((pA.x + pB.x) / 2, (pA.y + pB.y) / 2, 0);
          group.add(secEqBadge);
        }
      }

      // ── ÁREA MATEMÁTICA VISUAL ENTRE INTERVALO [a, b] Y EL EJE X ──
      // Superficie limpia, semitransparente, sin opacar las funciones
      const minX = Math.min(pA.x, pB.x);
      const maxX = Math.max(pA.x, pB.x);
      const areaIntervalPts = graphData.curve_points.filter(
        (pt) => pt.x >= minX - 0.05 && pt.x <= maxX + 0.05
      );

      if (areaIntervalPts.length >= 2) {
        const areaGeom = new THREE.BufferGeometry();
        const areaVerts: number[] = [];

        for (let i = 0; i < areaIntervalPts.length - 1; i++) {
          const p1 = areaIntervalPts[i];
          const p2 = areaIntervalPts[i + 1];

          // Dos triángulos por sección trapezoidal (x1, 0) a (x2, y2)
          areaVerts.push(p1.x, 0, 0);
          areaVerts.push(p1.x, p1.y, 0);
          areaVerts.push(p2.x, p2.y, 0);

          areaVerts.push(p1.x, 0, 0);
          areaVerts.push(p2.x, p2.y, 0);
          areaVerts.push(p2.x, 0, 0);
        }

        areaGeom.setAttribute('position', new THREE.Float32BufferAttribute(areaVerts, 3));
        areaGeom.computeVertexNormals();

        const areaMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        group.add(new THREE.Mesh(areaGeom, areaMat));

        // Líneas límite en x = a y x = b (ordenadas verticales)
        const addLimitOrdinate = (xVal: number, yVal: number, col: number) => {
          const ordGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xVal, 0, 0),
            new THREE.Vector3(xVal, yVal, 0),
          ]);
          const ordMat = new THREE.LineDashedMaterial({ color: col, dashSize: 0.12, gapSize: 0.08 });
          const ordMesh = new THREE.Line(ordGeom, ordMat);
          ordMesh.computeLineDistances();
          group.add(ordMesh);
        };
        addLimitOrdinate(pA.x, pA.y, 0x10b981);
        addLimitOrdinate(pB.x, pB.y, 0xec4899);
      }

      // ── PARTÍCULAS MATEMÁTICAS REQUISITO 2: ÁREA & LÍMITE DE SECANTE A TANGENTE ──
      // Distribución regular de 28 partículas dentro del área (simulando sumas de Riemann)
      // y corriente de límite desplazándose de B hacia A
      const areaParticleCount = 30;
      const apGeom = new THREE.BufferGeometry();
      const apPos = new Float32Array(areaParticleCount * 3);
      const apColors = new Float32Array(areaParticleCount * 3);

      const apData: { x: number; minY: number; maxY: number; yFrac: number }[] = [];

      for (let i = 0; i < areaParticleCount; i++) {
        const u = (i + 0.5) / areaParticleCount;
        const curX = minX + u * (maxX - minX);
        // Interpolar Y correspondiente en la curva
        const curY = pA.y + ((curX - pA.x) / (pB.x - pA.x || 1)) * (pB.y - pA.y);
        const yMin = 0;
        const yMax = curY;

        apData.push({ x: curX, minY: yMin, maxY: yMax, yFrac: 0.2 + (i % 4) * 0.2 });

        apColors[i * 3] = 0.02;
        apColors[i * 3 + 1] = 0.71;
        apColors[i * 3 + 2] = 0.83;
      }

      apGeom.setAttribute('position', new THREE.BufferAttribute(apPos, 3));
      apGeom.setAttribute('color', new THREE.BufferAttribute(apColors, 3));

      const apMat = new THREE.PointsMaterial({
        size: 0.20,
        map: particleTex,
        transparent: true,
        opacity: 0.7,
        vertexColors: true,
        depthWrite: false,
      });
      group.add(new THREE.Points(apGeom, apMat));

      // Secante: Badge de razón de cambio
      const midSecX = (pA.x + pB.x) / 2;
      const midSecY = (pA.y + pB.y) / 2;
      const secBadge = makeTextSprite(`Razón Media m = ${formatMathNum(rateOfChange)}`, {
        fontSize: 20,
        color: '#fda4af',
        bgColor: 'rgba(9, 14, 26, 0.92)',
        borderColor: '#f43f5e',
        borderWidth: 1.0,
        bold: true,
        scale: 0.32,
      });
      secBadge.position.set(midSecX, midSecY + 0.6, 0);
      group.add(secBadge);

      mathParticleUpdaterRef.current = (t) => {
        const pos = apGeom.attributes.position.array as Float32Array;
        for (let i = 0; i < areaParticleCount; i++) {
          const item = apData[i];
          const pulseY = item.yFrac + 0.08 * Math.sin(t * 1.5 + i);
          pos[i * 3] = item.x;
          pos[i * 3 + 1] = item.minY + (item.maxY - item.minY) * pulseY;
          pos[i * 3 + 2] = 0;
        }
        apGeom.attributes.position.needsUpdate = true;
      };
    }

    /* ─────────────────────────────────────────────────────────
       4. REQUISITO 3: DERIVADAS f'(x) Y f''(x) (Diferenciación nítida)
       ───────────────────────────────────────────────────────── */
    if (requirement === 3) {
      // 1ª Derivada f'(x) en violeta luminoso
      if (visuals.d1_points && visuals.d1_points.length > 1) {
        const d1Pts = visuals.d1_points.map((p: any) => new THREE.Vector3(p.x, p.y, p.z));
        const d1Curve = new THREE.CatmullRomCurve3(d1Pts, false);
        const d1Geom = new THREE.TubeGeometry(d1Curve, 180, 0.038, 10, false);
        const d1Mat = new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x7c3aed,
          emissiveIntensity: 0.45,
          roughness: 0.25,
          metalness: 0.3,
        });
        group.add(new THREE.Mesh(d1Geom, d1Mat));

        // Etiqueta anclada con línea guía en punto despejado de f'(x)
        const d1AnchorIdx = Math.floor(d1Pts.length * 0.25);
        const d1AnchorPt = d1Pts[d1AnchorIdx];
        const d1Badge = makeCalloutBadge("f'(x) 1ª Derivada", {
          color: '#c4b5fd',
          borderColor: '#a855f7',
          scale: 0.36,
          lineOffset: new THREE.Vector3(-1.6, 0.9, 0),
        });
        d1Badge.position.copy(d1AnchorPt);
        group.add(d1Badge);
      }

      // 2ª Derivada f''(x) en verde esmeralda
      if (visuals.d2_points && visuals.d2_points.length > 1) {
        const d2Pts = visuals.d2_points.map((p: any) => new THREE.Vector3(p.x, p.y, p.z));
        const d2Curve = new THREE.CatmullRomCurve3(d2Pts, false);
        const d2Geom = new THREE.TubeGeometry(d2Curve, 180, 0.034, 10, false);
        const d2Mat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.45,
          roughness: 0.25,
          metalness: 0.3,
        });
        group.add(new THREE.Mesh(d2Geom, d2Mat));

        // Etiqueta anclada con línea guía en punto despejado de f''(x)
        const d2AnchorIdx = Math.floor(d2Pts.length * 0.75);
        const d2AnchorPt = d2Pts[d2AnchorIdx];
        const d2Badge = makeCalloutBadge("f''(x) 2ª Derivada", {
          color: '#6ee7b7',
          borderColor: '#10b981',
          scale: 0.36,
          lineOffset: new THREE.Vector3(1.6, 0.9, 0),
        });
        d2Badge.position.copy(d2AnchorPt);
        group.add(d2Badge);
      }

      // Etiqueta de la curva base f(x)
      const basePts = graphData.curve_points;
      if (basePts.length > 10) {
        const fAnchorIdx = Math.floor(basePts.length * 0.5);
        const fAnchorPt = new THREE.Vector3(basePts[fAnchorIdx].x, basePts[fAnchorIdx].y, 0);
        const fBadge = makeCalloutBadge("f(x) Función Base", {
          color: '#38bdf8',
          borderColor: '#0284c7',
          scale: 0.36,
          lineOffset: new THREE.Vector3(0, -1.2, 0),
        });
        fBadge.position.copy(fAnchorPt);
        group.add(fBadge);
      }

      // ── PARTÍCULAS MATEMÁTICAS REQUISITO 3: CORRESPONDENCIA DIFERENCIAL ──
      // Partículas y líneas conectoras que proyectan las raíces de f'(x) hacia los extremos de f(x)
      const corrCount = 18;
      const corrGeom = new THREE.BufferGeometry();
      const corrPos = new Float32Array(corrCount * 3);
      const corrColors = new Float32Array(corrCount * 3);

      for (let i = 0; i < corrCount; i++) {
        corrColors[i * 3] = 0.65;
        corrColors[i * 3 + 1] = 0.55;
        corrColors[i * 3 + 2] = 0.98;
      }
      corrGeom.setAttribute('position', new THREE.BufferAttribute(corrPos, 3));
      corrGeom.setAttribute('color', new THREE.BufferAttribute(corrColors, 3));

      const corrMat = new THREE.PointsMaterial({
        size: 0.22,
        map: particleTex,
        transparent: true,
        opacity: 0.65,
        vertexColors: true,
        depthWrite: false,
      });
      group.add(new THREE.Points(corrGeom, corrMat));

      mathParticleUpdaterRef.current = (t) => {
        const pos = corrGeom.attributes.position.array as Float32Array;
        // Desplazamiento sutil a lo largo de las capas de profundidad Z (0 -> 1.5 -> 3.0)
        for (let i = 0; i < corrCount; i++) {
          const prg = (t * 0.2 + i / corrCount) % 1.0;
          const sampleX = -3 + prg * 6;
          pos[i * 3] = sampleX;
          pos[i * 3 + 1] = Math.sin(sampleX);
          pos[i * 3 + 2] = prg * 3.0; // Desplaza a través del eje Z diferenciador
        }
        corrGeom.attributes.position.needsUpdate = true;
      };
    }

    /* ─────────────────────────────────────────────────────────
       5. REQUISITO 4: PUNTOS CRÍTICOS CON GUÍA Y ENTORNO
       ───────────────────────────────────────────────────────── */
    if (requirement === 4 && visuals.critical_points) {
      visuals.critical_points.forEach((cp: any) => {
        const isMax = cp.classification === 'Máximo local';
        const color = isMax ? 0xf43f5e : 0x10b981;
        const colorHex = isMax ? '#f43f5e' : '#10b981';
        const labelText = isMax ? 'MÁX' : 'MÍN';

        // Esfera discreta
        const cpGeom = new THREE.SphereGeometry(0.18, 20, 20);
        const cpMat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.8,
          roughness: 0.15,
          metalness: 0.6,
        });
        const cpMesh = new THREE.Mesh(cpGeom, cpMat);
        cpMesh.position.set(cp.x, cp.y, cp.z);
        group.add(cpMesh);

        // Anillo pulsante
        const ring = makeGlowRing(0.28, 0.38, color, 0.4);
        ring.position.copy(cpMesh.position);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        glowRingsRef.current.push(ring);

        // Etiqueta anclada con orientación opuesta a la curva para evitar solapamientos
        const vertOffset = isMax ? 1.2 : -1.2;
        const cpCallout = makeCalloutBadge(
          `${labelText} (${formatMathNum(cp.x)}, ${formatMathNum(cp.y)})`,
          {
            color: colorHex,
            scale: 0.38,
            lineOffset: new THREE.Vector3(0, vertOffset, 0),
          }
        );
        cpCallout.position.set(cp.x, cp.y, cp.z);
        group.add(cpCallout);
      });

      // Partículas en el entorno ε de los puntos críticos
      const critPts = visuals.critical_points;
      if (critPts.length > 0) {
        const cpCount = critPts.length * 10;
        const cGeom = new THREE.BufferGeometry();
        const cPos = new Float32Array(cpCount * 3);
        cGeom.setAttribute('position', new THREE.BufferAttribute(cPos, 3));

        const cMat = new THREE.PointsMaterial({
          size: 0.18,
          map: particleTex,
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        });
        group.add(new THREE.Points(cGeom, cMat));

        mathParticleUpdaterRef.current = (t) => {
          const pos = cGeom.attributes.position.array as Float32Array;
          let idx = 0;
          critPts.forEach((cp: any) => {
            for (let j = 0; j < 10; j++) {
              const delta = (Math.sin(t * 1.8 + j) * 0.8);
              pos[idx * 3] = cp.x + delta;
              pos[idx * 3 + 1] = cp.y;
              pos[idx * 3 + 2] = 0;
              idx++;
            }
          });
          cGeom.attributes.position.needsUpdate = true;
        };
      }
    }

    /* ─────────────────────────────────────────────────────────
       6. REQUISITO 5: DESAFÍO APLICADO (CINEMÁTICA / TRAYECTORIA)
       ───────────────────────────────────────────────────────── */
    if (requirement === 5 && visuals.target_point) {
      const tp = visuals.target_point;
      const tpMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 20, 20),
        new THREE.MeshStandardMaterial({
          color: 0x22d3ee,
          emissive: 0x0891b2,
          emissiveIntensity: 0.8,
          roughness: 0.2,
          metalness: 0.6,
        })
      );
      tpMesh.position.set(tp.x, tp.y, tp.z || 0);
      group.add(tpMesh);

      const tpRing = makeGlowRing(0.28, 0.38, 0x22d3ee, 0.45);
      tpRing.position.copy(tpMesh.position);
      tpRing.rotation.x = Math.PI / 2;
      group.add(tpRing);
      glowRingsRef.current.push(tpRing);

      const label = visuals.target_label || `P(${formatMathNum(tp.x)}, ${formatMathNum(tp.y)})`;
      const calloutBp = makeCalloutBadge(label, {
        color: '#22d3ee',
        scale: 0.38,
        lineOffset: new THREE.Vector3(0, 1.2, 0),
      });
      calloutBp.position.set(tp.x, tp.y, tp.z || 0);
      group.add(calloutBp);
    }

    // Encuadre automático al actualizar datos matemáticos
    autoFrameMathRegion();
  }, [graphData, requirement, autoFrameMathRegion]);

  /* =============================================================
     DATOS TELEMÉTRICOS DE LA CABECERA (HUD)
     ============================================================= */
  const requirementLabels: Record<number, string> = {
    1: 'Evaluación y Pendiente Tangente',
    2: 'Secante, Límites y Razón de Cambio',
    3: 'Función y Derivadas',
    4: 'Puntos Críticos',
    5: 'Desafío Aplicado',
  };

  const visuals = graphData?.requirement_visuals || {};
  let hudPointText = '—';
  let hudSlopeText = '—';
  let hudConcavityText = '—';

  if (requirement === 1) {
    hudPointText = visuals.point
      ? `P(${formatMathNum(visuals.point.x)}, ${formatMathNum(visuals.point.y)})`
      : `x = ${formatMathNum(visuals.a)}`;
    hudSlopeText =
      visuals.slope !== undefined
        ? `m = ${formatMathNum(visuals.slope)} (${Math.abs(visuals.slope) < 1e-6 ? 'Horizontal' : 'Inclinada'})`
        : 'm = 0';
    hudConcavityText = "f''(x) Curvatura Analítica";
  } else if (requirement === 2) {
    hudPointText = visuals.point_a
      ? `A(${formatMathNum(visuals.point_a.x)}, ${formatMathNum(visuals.point_a.y)}) · B(${formatMathNum(visuals.point_b?.x)}, ${formatMathNum(visuals.point_b?.y)})`
      : `[${formatMathNum(visuals.a)}, ${formatMathNum(visuals.b)}]`;
    hudSlopeText =
      visuals.rate_of_change !== undefined
        ? `m = ${formatMathNum(visuals.rate_of_change)} (Razón Media)`
        : '—';
    hudConcavityText = `Δx = ${formatMathNum(visuals.delta_x)}`;
  } else if (requirement === 3) {
    hudPointText = 'f(x) en z=0';
    hudSlopeText = "f'(x) en z=1.5";
    hudConcavityText = "f''(x) en z=3.0";
  } else if (requirement === 4) {
    const cp = visuals.critical_points?.[0];
    hudPointText = cp
      ? `(${formatMathNum(cp.x)}, ${formatMathNum(cp.y)})`
      : 'Búsqueda en [-10, 10]';
    hudSlopeText = "f'(c) = 0 (Fermat)";
    hudConcavityText = cp
      ? `${cp.classification} (f''=${formatMathNum(cp.f_double_prime)})`
      : 'Sin raíces en rango';
  } else if (requirement === 5) {
    hudPointText = 'Cinemática Aplicada';
    hudSlopeText = "Velocidad v(t) = f'(t)";
    hudConcavityText = "Aceleración a(t) = f''(t)";
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '480px',
        borderRadius: 'var(--radius-md, 8px)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#080c16',
        boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8), 0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* ─── Tarjetas de Telemetría Superior (HUD Académico) ─── */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {/* Card 1: Punto / Abscisa */}
        <div
          style={{
            background: 'rgba(9, 14, 26, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              fontSize: '0.60rem',
              color: '#fbbf24',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            PUNTO / ABSCISA
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              color: '#f8fafc',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {hudPointText}
          </span>
        </div>

        {/* Card 2: Pendiente Instantánea */}
        <div
          style={{
            background: 'rgba(9, 14, 26, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              fontSize: '0.60rem',
              color: '#10b981',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            PENDIENTE INSTANTÁNEA
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              color: '#f8fafc',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {hudSlopeText}
          </span>
        </div>

        {/* Card 3: Curvatura / Segunda Derivada */}
        <div
          style={{
            background: 'rgba(9, 14, 26, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              fontSize: '0.60rem',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            CURVATURA f''(x)
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              color: '#f8fafc',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {hudConcavityText}
          </span>
        </div>

        {/* Card 4: Gesto Confirmado */}
        <div
          style={{
            background: 'rgba(9, 14, 26, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              fontSize: '0.60rem',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            REQUISITO ACTIVO
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              color: '#f8fafc',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {requirement > 0
              ? `${requirement} (${requirementLabels[requirement]})`
              : 'En Espera'}
          </span>
        </div>
      </div>

      {/* Controles de cámara flotantes */}
      <GraphControls
        onResetView={handleResetView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onTopView={handleTopView}
        onPerspectiveView={handlePerspectiveView}
        is2DView={is2DView}
        azimuth={telemetry.azimuth}
        elevation={telemetry.elevation}
      />

      {/* Coordenadas HUD (inferior izquierda) */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '14px',
          zIndex: 10,
          background: 'rgba(9, 14, 26, 0.88)',
          backdropFilter: 'blur(10px)',
          padding: '8px 14px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.76rem',
          display: 'flex',
          gap: '14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <div>
          <span style={{ color: '#38bdf8', fontSize: '0.65rem', fontWeight: 700 }}>X</span>{' '}
          <strong style={{ color: '#f8fafc' }}>{coordinates.X}</strong>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div>
          <span style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 700 }}>Y</span>{' '}
          <strong style={{ color: '#f8fafc' }}>{coordinates.Y}</strong>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div>
          <span style={{ color: '#a78bfa', fontSize: '0.65rem', fontWeight: 700 }}>Z</span>{' '}
          <strong style={{ color: '#f8fafc' }}>{coordinates.Z}</strong>
        </div>
      </div>

      {/* Requisito activo (inferior derecha) */}
      {requirement > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            right: '14px',
            zIndex: 10,
            background: 'rgba(9, 14, 26, 0.88)',
            backdropFilter: 'blur(10px)',
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(167, 139, 250, 0.25)',
            fontSize: '0.70rem',
            color: '#c4b5fd',
            fontFamily: '"JetBrains Mono", monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            textAlign: 'right',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: '0.62rem', letterSpacing: '0.08em' }}>
            MODO CÁLCULO
          </span>
          <span style={{ color: '#f8fafc', fontWeight: 600 }}>
            {requirementLabels[requirement]}
          </span>
        </div>
      )}
    </div>
  );
};
