import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export interface HandTrackerResult {
  handDetected: boolean;
  twoHandsWarning: boolean;
  detectedFingers: number;
  confirmedFingers: number;
  landmarks: Array<{ x: number; y: number; z: number }>;
  pointerCoords?: { x: number; y: number };
}

export class ClientHandTracker {
  private landmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private videoElement: HTMLVideoElement | null = null;
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
    onResult: (result: HandTrackerResult) => void
  ): Promise<void> {
    this.videoElement = videoEl;
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
