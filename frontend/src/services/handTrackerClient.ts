import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export interface HandTrackerResult {
  handDetected: boolean;
  twoHandsWarning: boolean;
  detectedFingers: number;
  confirmedFingers: number;
  landmarks: Array<{ x: number; y: number; z: number }>;
  pointerCoords?: { x: number; y: number };
}

const HAND_CONNECTIONS = [
  // Pulgar
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Índice
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Medio
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Anular
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Meñique
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Base de la palma
  [5, 9], [9, 13], [13, 17],
];

export class ClientHandTracker {
  private landmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private fingerHistory: number[] = [];
  private historyLength = 5;
  private minConfirmCount = 3;
  private onResultCallback: ((result: HandTrackerResult) => void) | null = null;

  public async init(): Promise<void> {
    if (this.landmarker || this.isInitializing) return;
    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } finally {
      this.isInitializing = false;
    }
  }

  public async start(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement | null,
    onResult: (result: HandTrackerResult) => void
  ): Promise<void> {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
    this.onResultCallback = onResult;

    if (!this.landmarker) {
      await this.init();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('La API de cámara (getUserMedia) no está disponible en este navegador.');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
    });

    this.videoElement.srcObject = this.stream;
    await this.videoElement.play();

    this.startDetectionLoop();
  }

  private startDetectionLoop() {
    let lastVideoTime = -1;

    const detect = () => {
      if (!this.videoElement || !this.landmarker) return;

      if (this.videoElement.currentTime !== lastVideoTime && this.videoElement.readyState >= 2) {
        lastVideoTime = this.videoElement.currentTime;
        const now = performance.now();
        const results = this.landmarker.detectForVideo(this.videoElement, now);

        if (results && results.landmarks && results.landmarks.length > 0) {
          const numHands = results.landmarks.length;
          const twoHands = numHands > 1;
          const firstHandLandmarks = results.landmarks[0];

          const instantFingers = this.countFingers(firstHandLandmarks);
          const confirmedFingers = this.stabilizeGesture(instantFingers);

          const indexTip = firstHandLandmarks[8];
          const pointerCoords = indexTip ? { x: 1.0 - indexTip.x, y: indexTip.y } : undefined;

          // Dibujar landmarks y esqueleto en el canvas
          this.drawLandmarks(firstHandLandmarks);

          if (this.onResultCallback) {
            this.onResultCallback({
              handDetected: true,
              twoHandsWarning: twoHands,
              detectedFingers: instantFingers,
              confirmedFingers: confirmedFingers,
              landmarks: firstHandLandmarks,
              pointerCoords,
            });
          }
        } else {
          this.fingerHistory = [];
          this.clearCanvas();
          if (this.onResultCallback) {
            this.onResultCallback({
              handDetected: false,
              twoHandsWarning: false,
              detectedFingers: 0,
              confirmedFingers: 0,
              landmarks: [],
            });
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(detect);
    };

    this.animationFrameId = requestAnimationFrame(detect);
  }

  private drawLandmarks(landmarks: Array<{ x: number; y: number; z: number }>) {
    if (!this.canvasElement || !this.videoElement) return;

    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Asegurar dimensiones del canvas
    if (canvas.width !== this.videoElement.videoWidth || canvas.height !== this.videoElement.videoHeight) {
      canvas.width = this.videoElement.videoWidth || 640;
      canvas.height = this.videoElement.videoHeight || 480;
    }

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Espejar horizontalmente igual que el video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-w, 0);

    // 1. Dibujar conexiones óseas (líneas cian / verde neón)
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 6;

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    }

    // 2. Dibujar articulaciones y puntas de dedos (21 puntos)
    const tipIndices = new Set([4, 8, 12, 16, 20]);

    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p) continue;

      const px = p.x * w;
      const py = p.y * h;
      const isTip = tipIndices.has(i);

      ctx.beginPath();
      if (isTip) {
        // Puntas de dedos: Círculo grande amarillo/dorado con halo
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else {
        // Articulaciones intermedias: Puntos esmeralda
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 4;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private clearCanvas() {
    if (!this.canvasElement) return;
    const ctx = this.canvasElement.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }

  private countFingers(landmarks: Array<{ x: number; y: number; z: number }>): number {
    let fingers = 0;

    // Dedos largos (Índice 8 vs 6, Medio 12 vs 10, Anular 16 vs 14, Meñique 20 vs 18)
    const tipsPips = [
      [8, 6],
      [12, 10],
      [16, 14],
      [20, 18],
    ];

    for (const [tip, pip] of tipsPips) {
      if (landmarks[tip].y < landmarks[pip].y) {
        fingers += 1;
      }
    }

    // Pulgar: distancia al centro de la palma
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    const palmCenterX = (wrist.x + indexMcp.x + pinkyMcp.x) / 3.0;
    const palmDistTip = Math.abs(thumbTip.x - palmCenterX);
    const palmDistIp = Math.abs(thumbIp.x - palmCenterX);

    if (palmDistTip > palmDistIp + 0.02 && thumbTip.y < landmarks[2].y + 0.1) {
      fingers += 1;
    }

    return Math.min(5, Math.max(0, fingers));
  }

  private stabilizeGesture(instantaneous: number): number {
    this.fingerHistory.push(instantaneous);
    if (this.fingerHistory.length > this.historyLength) {
      this.fingerHistory.shift();
    }

    // Contar frecuencias
    const counts: Record<number, number> = {};
    for (const val of this.fingerHistory) {
      counts[val] = (counts[val] || 0) + 1;
    }

    let dominantVal = instantaneous;
    let maxCount = 0;
    for (const [valStr, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantVal = Number(valStr);
      }
    }

    if (maxCount >= this.minConfirmCount) {
      return dominantVal;
    }
    return instantaneous;
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.clearCanvas();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.fingerHistory = [];
  }
}

export const clientHandTracker = new ClientHandTracker();
