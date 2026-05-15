export enum OpportunityStatus {
  MONITORING = 'monitoring',
  ANALYSIS = 'analysis',
  PREPARATION = 'preparation',
  WON = 'won',
  LOST = 'lost',
  DISQUALIFIED = 'disqualified',
  CANCELED = 'canceled',
}

export enum AnalysisDecision {
  GO = 'aderente',
  NO_GO = 'fora-do-escopo',
  UNDECIDED = 'talvez',
}

export enum DocumentStatus {
  VALID = 'valid',
  EXPIRED = 'expired',
  MISSING = 'missing',
}

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  ownerId: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  companyId: string;
  role: UserRole;
  createdAt: any;
}

export interface Opportunity {
  id: string;
  uasg?: string;
  number: string;
  agency: string;
  object: string;
  openingDate?: string;
  value?: number;
  status: OpportunityStatus;
  portal?: string;
  companyId: string;
  creatorId: string;
  score?: number;
  recommendation?: AnalysisDecision;
  createdAt: any;
  updatedAt: any;
}

export interface Document {
  id: string;
  type: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  companyId: string;
  opportunityId?: string; // Optional: for documents specific to a bid
  ownerId: string;
  createdAt: any;
}

export interface ScoringResult {
  finalScore: number; // 0-100
  dimensions: {
    documentation: number; // 0-100
    technical: number; // 0-100
    regularity: number; // 0-100
    strategic: number; // 0-100
  };
  recommendation: AnalysisDecision;
  justification: string;
}

export interface Analysis {
  id: string;
  opportunityId: string;
  companyId: string;
  
  // Scoring fields
  scoring: ScoringResult;
  
  // Raw inputs for transparency
  inputs: {
    technicalCapacity: number; // 0-10
    estimatedMargin: number; // 0-10
    riskLevel: number; // 0-10
    deadlineFeasibility: number; // 0-10
    hasStrategicInterest: boolean;
  };
  
  authorId: string;
  createdAt: any;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignedTo?: string;
  assignedToName?: string;
  comments?: string;
  companyId: string;
  opportunityId: string;
  creatorId: string;
  createdAt: any;
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
