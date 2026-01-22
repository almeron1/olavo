
import { Role, ContentStatus, LessonType, Course, User } from './types';

export const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Olavo Admin', 
    email: 'admin@olavo.com', 
    role: Role.ADMIN, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 
    status: 'active', 
    lastAccess: 'Agora', 
    enrolledCourses: [], 
    cpf: '000.000.000-00', 
    address: {
      cep: '01001-000',
      street: 'Rua da Administração',
      number: '100',
      neighborhood: 'Centro',
      city: 'São Paulo',
      uf: 'SP'
    }
  },
  { 
    id: 'u2', 
    name: 'Prof. Danelize', 
    email: 'danelize@olavo.com', 
    role: Role.PROFESSOR, 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400', 
    status: 'active', 
    lastAccess: '10min atrás', 
    enrolledCourses: [], 
    cpf: '111.111.111-11',
    specialty: 'Linguagens e Códigos',
    subjects: ['Redação', 'Português', 'Literatura']
  },
  { 
    id: 'u4', 
    name: 'Prof. Raul', 
    email: 'raul@olavo.com', 
    role: Role.PROFESSOR, 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', 
    status: 'active', 
    lastAccess: '1 dia atrás', 
    enrolledCourses: [], 
    cpf: '333.333.333-33',
    specialty: 'Ciências da Natureza',
    subjects: ['Física']
  },
  { 
    id: 'u3', 
    name: 'Lucas Estudante', 
    email: 'lucas@gmail.com', 
    role: Role.STUDENT, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', 
    status: 'active', 
    lastAccess: 'Ontem', 
    enrolledCourses: ['c1', 'c2'], 
    cpf: '222.222.222-22', 
    address: {
      cep: '20000-000',
      street: 'Av. dos Estudos',
      number: '500',
      neighborhood: 'Jardim do Conhecimento',
      city: 'Rio de Janeiro',
      uf: 'RJ'
    }
  }
];

// Helper para gerar cursos em massa
const createCourse = (id: string, title: string, prof: string, program: string, cat: string, subject: string, img: string): Course => ({
  id,
  title,
  description: `Aula completa com o Prof. ${prof} focada nos temas que mais caem.`,
  thumbnail: img,
  status: ContentStatus.PUBLISHED,
  professorId: prof.toLowerCase(),
  price: 197,
  program,
  category: cat,
  subject: subject,
  showInStore: true,
  modules: [
    {
      id: `m-${id}`,
      courseId: id,
      title: 'Módulo Único',
      order: 1,
      lessons: [
        { id: `l-${id}-1`, moduleId: `m-${id}`, courseId: id, title: 'Introdução e Teoria', description: 'Fundamentos básicos.', type: LessonType.RECORDED, status: ContentStatus.PUBLISHED, duration: '12:00', order: 1, materials: [], isFree: true },
        { id: `l-${id}-2`, moduleId: `m-${id}`, courseId: id, title: 'Exercícios Práticos', description: 'Resolução de questões.', type: LessonType.RECORDED, status: ContentStatus.PUBLISHED, duration: '25:00', order: 2, materials: [], isFree: false }
      ]
    }
  ]
});

export const INITIAL_COURSES: Course[] = [
  // REDAÇÃO (Prof. Danelize) - ENEM
  createCourse('c1', 'Estrutura Diamante', 'Danelize', 'Enem', 'Linguagens', 'Redação', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800'),
  createCourse('r2', 'Coesão e Coerência', 'Danelize', 'Enem', 'Linguagens', 'Redação', 'https://images.unsplash.com/photo-1454165833767-027ff33027ef?auto=format&fit=crop&q=80&w=800'),
  
  // FÍSICA (Prof. Raul) - ENEM
  createCourse('c2', 'Leis de Newton', 'Raul', 'Enem', 'Natureza', 'Física', 'https://images.unsplash.com/photo-1636466484841-4f103e2db5ba?auto=format&fit=crop&q=80&w=800'),
  createCourse('e2', 'Termodinâmica', 'Raul', 'Enem', 'Natureza', 'Física', 'https://images.unsplash.com/photo-1532094349884-543bb1198343?auto=format&fit=crop&q=80&w=800'),
  
  // CONCURSO - DIREITO (Exemplo de outra estrutura)
  createCourse('dir1', 'Direito Constitucional', 'Ricardo', 'Concursos', 'Direito', 'Constitucional', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800'),
  
  // HISTÓRIA - ENEM
  createCourse('h1', 'Geopolítica Moderna', 'Ricardo', 'Enem', 'Humanas', 'História', 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800'),
];
