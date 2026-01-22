
export enum Role {
  ADMIN = 'ADMIN',
  PROFESSOR = 'PROFESSOR',
  STUDENT = 'STUDENT'
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  INACTIVE = 'INACTIVE'
}

export enum LessonType {
  RECORDED = 'RECORDED',
  LIVE = 'LIVE'
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  uf: string;
}

export interface Guardian {
  name: string;
  cpf: string;
  rg: string;
  relationship: string;
  email: string;
  phone: string;
  address: Address;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status: 'active' | 'inactive' | 'blocked';
  blockedReason?: string; // Reason for blocking
  lastAccess: string;
  enrolledCourses: string[];
  // Extended fields
  cpf?: string;
  rg?: string;
  birthDate?: string;
  phone?: string;
  address?: Address;
  guardian?: Guardian;
  // Professor specific
  specialty?: string; // e.g., "Ciências da Natureza"
  subjects?: string[]; // e.g., ["Física", "Matemática"]
}

export interface Drop {
  id: string;
  videoUrl: string;
  professorName: string;
  courseName?: string;
  courseId?: string;
  likes: number;
  description: string;
  status?: ContentStatus;
}

export interface ForumMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  text: string;
  timestamp: string;
  replyTo?: string;
  isFixed?: boolean;
}

export interface Material {
  id: string;
  title: string;
  type: 'PDF' | 'LINK' | 'SLIDE';
  url: string;
  status?: ContentStatus;
}

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  type: LessonType;
  status: ContentStatus;
  videoUrl?: string;
  duration?: string;
  materials: Material[];
  order: number;
  isFree?: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  status: ContentStatus;
  professorId: string;
  price: number;
  modules: Module[];
  showInStore: boolean;
  // Hierarchy
  program: string; // e.g., "Enem", "Concurso Público"
  category: string; // "Area of Knowledge" e.g., "Ciências da Natureza"
  subject: string; // e.g., "Física"
}

export interface ContractTemplate {
  id: string;
  title: string;
  content: string; // HTML or Markdown content with {{variables}}
  createdAt: string;
}

export interface Contract {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  templateId?: string;
  content?: string; // Final generated content
  createdAt: string;
  status: 'SIGNED' | 'PENDING' | 'CANCELLED';
  url: string;
}

export interface NotificationInteraction {
  userId: string;
  userName: string;
  userRole: Role;
  action: 'ACKNOWLEDGE' | 'PIN' | 'DELETE' | 'REPLY';
  content?: string; // For replies
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  title: string; // usually "Aviso da Coordenação"
  message: string;
  targetType: 'ALL' | 'PROFESSORS' | 'SPECIFIC';
  targetUserId?: string;
  sentAt: string;
  author: string;
  interactions: NotificationInteraction[];
}

export interface SystemSettings {
  primaryColor: string;
  logoUrl: string;
  liveYoutubeUrl: string;
  spotlightCourseId?: string;
  spotlightTitle?: string;
  spotlightSubtitle?: string;
}

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}
