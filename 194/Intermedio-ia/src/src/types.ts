export interface DataSource {
  id: string;
  name: string;
  url: string;
  entity: string;
  category: string;
  appToken?: string;
  isActive: boolean;
  description: string;
}

export interface AppSetting {
  id: string;
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  customSystemInstruction: string;
  welcomeMessage: string;
  rateLimitMessages: number;
  sodaDefaultAppToken: string;
}

export interface DataOpeningRequest {
  id: string;
  userId: string;
  userEmail: string;
  datasetName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'closed';
  createdAt: any;
}

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'public' | 'admin';
  status?: 'active' | 'suspended';
  createdAt?: any;
}

export interface AppErrorLog {
  id: string;
  error: string;
  stack?: string | null;
  context: string;
  userId?: string | null;
  userEmail?: string | null;
  createdAt: any;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId?: string | null;
  userEmail?: string | null;
  createdAt: any;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: any;
  updatedAt: any;
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
  }
}

export interface Dataset {
  name: string;
  id: string;
  description: string;
  organization: string;
  url: string;
}

export interface VisualizationData {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  title: string;
  xAxis: string;
  yAxis: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  datasets?: Dataset[];
  visualization?: VisualizationData;
  thinking?: string[];
}

export interface Note {
  id: string;
  messageId: string;
  userId: string;
  content: string;
  messageContext?: string;
  conversationId?: string;
  conversationTitle?: string;
  updatedAt: any;
}
