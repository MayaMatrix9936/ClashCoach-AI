export type GoalType = 'Three Star / Destruction' | 'Loot Resources' | 'Trophy Push' | 'Safe Two Star';

export interface AttackPlanRequest {
  armyImage: File;
  baseImage: File;
  goal: string;
}

export interface AttackStep {
  phaseName: string;
  description: string;
  troopsUsed: string[]; // List of troops used in this step
}

export interface AttackPlanResponse {
  armyAnalysis: string;
  baseWeaknesses: string;
  criticalAdvice: string;
  armyAdjustments: string;
  steps: AttackStep[];
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
