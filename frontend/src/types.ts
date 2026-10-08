export type AppMode = 'MANUAL' | 'CAMERA';

export type CameraState =
  | 'CAMERA_OFF'
  | 'CAMERA_LOADING'
  | 'CAMERA_ACTIVE'
  | 'HAND_NOT_DETECTED'
  | 'HAND_DETECTED'
  | 'GESTURE_DETECTED'
  | 'CAMERA_ERROR';

export type CalculationStatus = 'IDLE' | 'CALCULATING' | 'COMPLETED' | 'ERROR';

export type GraphStatus = 'HIDDEN' | 'READY';

export interface Point3D {
  x: number;
  y: number;
  z: number;
  segment?: number;
}

export interface Particle3D {
  x: number;
  y: number;
  z: number;
  type: string;
}

export interface GraphData {
  curve_points: Point3D[];
  particles: Particle3D[];
  requirement_visuals: any;
}

export interface CalculationResults {
  [key: string]: any;
}

export interface HistoryItem {
  id: string;
  time: string;
  text: string;
  type: 'function' | 'gesture' | 'requirement' | 'system' | 'error';
}

export interface AppState {
  functionExpression: string;
  functionType: string;
  isValidFunction: boolean;
  validationError: string | null;
  mode: AppMode;
  cameraStatus: CameraState;
  statusMessage: string;
  handDetected: boolean;
  twoHandsWarning: boolean;
  detectedFingers: number;
  confirmedFingers: number;
  requirement: number; // 0 = sin requisito, 1..5
  calculationStatus: CalculationStatus;
  results: CalculationResults | null;
  coordinates: { X: string; Y: string; Z: string };
  graphStatus: GraphStatus;
  graphData: GraphData | null;
  error: string | null;
  history: HistoryItem[];
}
