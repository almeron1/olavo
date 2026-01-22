
import React, { useState, useEffect, useRef } from 'react';
import { Course, User, ContentStatus, Role, Contract, ContractTemplate, SystemSettings, SystemNotification, Module, Lesson, LessonType } from '../types';
import { supabase } from '../supabaseClient';

// Defining the Structure Hierarchy
const PROGRAM_STRUCTURE: Record<string, { areas: string[], subjects: Record<string, string[]> }> = {
  'Enem': {
    areas: ['Ciências da Natureza', 'Ciências Humanas', 'Linguagens e Códigos', 'Matemática'],
    subjects: {
      'Ciências da Natureza': ['Física', 'Química', 'Biologia'],
      'Ciências Humanas': ['História', 'Geografia', 'Filosofia', 'Sociologia'],
      'Linguagens e Códigos': ['Português', 'Literatura', 'Redação', 'Inglês', 'Espanhol'],
      'Matemática': ['Matemática']
    }
  },
  'Concursos': {
    areas: ['Direito', 'Conhecimentos Gerais', 'Administração'],
    subjects: {
      'Direito': ['Direito Constitucional', 'Direito Administrativo', 'Direito Penal'],
      'Conhecimentos Gerais': ['Português', 'Raciocínio Lógico', 'Informática'],
      'Administração': ['Administração Geral', 'Gestão de Pessoas']
    }
  },
  'Vestibulares': {
    areas: ['Geral'],
    subjects: {
      'Geral': ['Obras Literárias', 'Atualidades']
    }
  }
};

interface DashboardAdminProps {
  currentView: string;
  courses: Course[];
  users: User[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  notifications?: SystemNotification[];
  onSendNotification?: (n: SystemNotification) => void;
  onClearFeed?: () => void;
  onDeleteFeedback?: (notifId: string, interactionIdx: number) => void;
}

const DashboardAdmin: React.FC<DashboardAdminProps> = ({ 
  currentView, courses, users, setCourses, setUsers, settings, setSettings,
  notifications = [], onSendNotification, onClearFeed, onDeleteFeedback
}) => {
  // --- Global State ---
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false); 

  // --- Notification State ---
  const [notifText, setNotifText] = useState('');
  const [notifTargetType, setNotifTargetType] = useState<'ALL' | 'PROFESSORS' | 'SPECIFIC'>('ALL');
  const [notifTargetUser, setNotifTargetUser] = useState('');

  // --- User Management State ---
  const [userFilterRole, setUserFilterRole] = useState<'ALL' | Role>('ALL');
  const [blockingUser, setBlockingUser] = useState<{id: string, name: string, isBlocking: boolean} | null>(null);
  const [blockReason, setBlockReason] = useState('');
  
  // Generic User Edit Modal (Non-Student)
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [simpleUserFormData, setSimpleUserFormData] = useState<{id: string, name: string, email: string, role: Role}>({ id: '', name: '', email: '', role: Role.STUDENT });

  // --- Professor Management State ---
  const [isProfessorFormOpen, setIsProfessorFormOpen] = useState(false);
  const [profFormData, setProfFormData] = useState({ id: '', name: '', email: '', specialty: '', subjects: '', avatarUrl: '' });
  const profFileInputRef = useRef<HTMLInputElement>(null);

  // --- Student Registration State ---
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null); 
  const [studentFormData, setStudentFormData] = useState({
    // Student Personal
    name: '', cpf: '', rg: '', birthDate: '', email: '', phone: '',
    // Student Address
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', uf: '',
    // Guardian Personal
    gName: '', gCpf: '', gRg: '', gRel: '', gEmail: '', gPhone: '',
    // Guardian Address
    gCep: '', gStreet: '', gNumber: '', gComplement: '', gNeighborhood: '', gCity: '', gUf: ''
  });

  // --- Contract Management State ---
  const [contractView, setContractView] = useState<'LIST' | 'TEMPLATES'>('LIST');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([
    { id: 't1', title: 'Contrato Padrão de Matrícula', content: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS\n\nCONTRATANTE: {{aluno_nome}}...', createdAt: '01/01/2024' }
  ]);
  
  const [showContractGenModal, setShowContractGenModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showContractPreviewModal, setShowContractPreviewModal] = useState<Contract | null>(null);
  const [previewContract, setPreviewContract] = useState<{content: string, studentId: string, courseId: string, templateId: string} | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [tempTemplateTitle, setTempTemplateTitle] = useState('');
  const [tempTemplateContent, setTempTemplateContent] = useState('');

  const [genSelectedStudent, setGenSelectedStudent] = useState('');
  const [genSelectedCourse, setGenSelectedCourse] = useState('');
  const [genSelectedTemplate, setGenSelectedTemplate] = useState('');

  // --- EFFECT: Load Contracts ---
  useEffect(() => {
      const fetchContracts = async () => {
          const { data } = await supabase.from('contracts').select('*');
          if (data) {
              const mapped = data.map((c:any) => ({
                  ...c,
                  studentId: c.student_id,
                  studentName: c.student_name,
                  courseId: c.course_id,
                  courseName: c.course_name,
                  templateId: 't1', // Assuming for now
                  createdAt: new Date(c.created_at).toLocaleDateString()
              }));
              setContracts(mapped);
          }
      };
      fetchContracts();
  }, []);

  // --- EFFECT: Close modals on navigation change ---
  useEffect(() => {
    setIsCourseModalOpen(false);
    setShowContractGenModal(false);
    setShowTemplateModal(false);
    setShowContractPreviewModal(null);
    setPreviewContract(null);
    setIsStudentFormOpen(false); 
    setIsProfessorFormOpen(false);
    setBlockingUser(null);
    setIsUserEditModalOpen(false);
    setIsFormDirty(false);
  }, [currentView]);

  const checkUnsavedChanges = (callback: () => void) => {
    if (isFormDirty) {
      if (window.confirm("Você tem alterações não salvas. Tem certeza que deseja sair e descartar?")) {
        setIsFormDirty(false);
        callback();
      }
    } else {
      callback();
    }
  };

  // Helper functions for Course
  const handleToggleStatus = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const newStatus = course.status === ContentStatus.PUBLISHED ? ContentStatus.INACTIVE : ContentStatus.PUBLISHED;
    
    // Update local
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus } : c));
    
    // Update DB
    await supabase.from('courses').update({ status: newStatus }).eq('id', courseId);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm("ATENÇÃO: Tem certeza que deseja excluir este curso permanentemente?")) {
      // Update local
      setCourses(prev => prev.filter(c => c.id !== courseId));
      // Update DB
      await supabase.from('courses').delete().eq('id', courseId);
    }
  };

  const handleCreateCourse = () => {
    const newCourse: Course = {
      id: `new-${Date.now()}`, // Temporary ID
      title: '', description: '', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
      status: ContentStatus.DRAFT, professorId: 'danelize', price: 0, modules: [], showInStore: false, program: '', category: '', subject: ''
    };
    setSelectedCourse(newCourse);
    setIsCourseModalOpen(true);
    setIsFormDirty(true);
  };

  const saveCourseToDB = async () => {
      if (!selectedCourse) return;
      
      const coursePayload = {
          title: selectedCourse.title,
          description: selectedCourse.description,
          thumbnail: selectedCourse.thumbnail,
          status: selectedCourse.status,
          professor_id: selectedCourse.professorId,
          price: selectedCourse.price,
          program: selectedCourse.program,
          category: selectedCourse.category,
          subject: selectedCourse.subject,
          show_in_store: selectedCourse.showInStore
      };

      if (selectedCourse.id.startsWith('new-')) {
          // Insert
          const { data, error } = await supabase.from('courses').insert([coursePayload]).select().single();
          if (data && !error) {
              // Update local state with real ID
              const realCourse = { ...selectedCourse, id: data.id };
              setCourses(prev => [...prev, realCourse]);
              alert("Curso criado com sucesso!");
          }
      } else {
          // Update
          const { error } = await supabase.from('courses').update(coursePayload).eq('id', selectedCourse.id);
          if (!error) {
              setCourses(prev => prev.map(c => c.id === selectedCourse.id ? selectedCourse : c));
              alert("Curso atualizado!");
          }
      }
      setIsCourseModalOpen(false);
      setIsFormDirty(false);
  };

  const handleUpdateCourse = (updated: Course) => {
    setSelectedCourse(updated);
    setIsFormDirty(true);
  };

  // Helper functions for Users
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.")) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      await supabase.from('users').delete().eq('id', userId);
    }
  };

  const openBlockModal = (user: User) => {
    setBlockingUser({ id: user.id, name: user.name, isBlocking: user.status !== 'blocked' });
    setBlockReason(user.blockedReason || '');
  };

  const confirmBlockUser = async () => {
    if (!blockingUser) return;
    if (blockingUser.isBlocking && !blockReason.trim()) { alert("Por favor, digite o motivo do bloqueio."); return; }
    
    const newStatus = blockingUser.isBlocking ? 'blocked' : 'active';
    
    setUsers(prev => prev.map(u => u.id === blockingUser.id ? { ...u, status: newStatus as any, blockedReason: blockingUser.isBlocking ? blockReason : undefined } : u));
    
    // DB Update
    await supabase.from('users').update({ status: newStatus }).eq('id', blockingUser.id);

    setBlockingUser(null);
    setBlockReason('');
  };

  // --- PROFESSOR MANAGEMENT ---
  const handleOpenProfessorForm = (prof?: User) => {
    if (prof) {
      setProfFormData({ id: prof.id, name: prof.name, email: prof.email, specialty: prof.specialty || '', subjects: prof.subjects ? prof.subjects.join(', ') : '', avatarUrl: prof.avatar });
    } else {
      setProfFormData({ id: '', name: '', email: '', specialty: '', subjects: '', avatarUrl: '' });
    }
    setIsProfessorFormOpen(true);
    setIsFormDirty(false);
  };

  const handleSaveProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectsArray = profFormData.subjects.split(',').map(s => s.trim()).filter(s => s);
    
    const profPayload = {
        name: profFormData.name,
        email: profFormData.email,
        role: Role.PROFESSOR,
        specialty: profFormData.specialty,
        subjects: subjectsArray,
        avatar: profFormData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profFormData.name}`
    };

    if (profFormData.id) {
        // Update
        setUsers(prev => prev.map(u => u.id === profFormData.id ? { ...u, ...profPayload } : u));
        await supabase.from('users').update(profPayload).eq('id', profFormData.id);
    } else {
        // Create - Direct insert into 'users' table
        const newProfPayload = {
            ...profPayload,
            password: '123', // Default password for new profs in prototype
            status: 'active',
            enrolled_courses: []
        };
        const { data, error } = await supabase.from('users').insert([newProfPayload]).select().single();
        if (data) {
             setUsers(prev => [...prev, { ...data, enrolledCourses: [] }]);
             alert("Professor cadastrado com senha padrão '123'.");
        }
    }
    setIsProfessorFormOpen(false);
    setIsFormDirty(false);
  };

  const handleEditGenericUser = (user: User) => {
    if (user.role === Role.STUDENT) { openStudentEdit(user); } else { setSimpleUserFormData({ id: user.id, name: user.name, email: user.email, role: user.role }); setIsUserEditModalOpen(true); setIsFormDirty(false); }
  };

  const saveGenericUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(prev => prev.map(u => u.id === simpleUserFormData.id ? { ...u, name: simpleUserFormData.name, email: simpleUserFormData.email, role: simpleUserFormData.role } : u));
    
    await supabase.from('users').update({
        name: simpleUserFormData.name,
        email: simpleUserFormData.email,
        role: simpleUserFormData.role
    }).eq('id', simpleUserFormData.id);

    setIsUserEditModalOpen(false);
    setIsFormDirty(false);
    alert("Usuário atualizado!");
  };

  // --- STUDENT REGISTRATION LOGIC ---
  const fetchAddress = async (cepValue: string, type: 'student' | 'guardian') => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setStudentFormData(prev => {
          setIsFormDirty(true);
          if (type === 'student') return { ...prev, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, uf: data.uf };
          else return { ...prev, gStreet: data.logradouro, gNeighborhood: data.bairro, gCity: data.localidade, gUf: data.uf };
        });
      }
    } catch (error) { console.error("Erro ao buscar CEP", error); }
  };

  const openStudentEdit = (user: User) => {
    setEditingUserId(user.id);
    setStudentFormData({
      name: user.name, cpf: user.cpf || '', rg: user.rg || '', birthDate: user.birthDate || '', email: user.email, phone: user.phone || '',
      cep: user.address?.cep || '', street: user.address?.street || '', number: user.address?.number || '', complement: user.address?.complement || '', neighborhood: user.address?.neighborhood || '', city: user.address?.city || '', uf: user.address?.uf || '',
      gName: user.guardian?.name || '', gCpf: user.guardian?.cpf || '', gRg: user.guardian?.rg || '', gRel: user.guardian?.relationship || '', gEmail: user.guardian?.email || '', gPhone: user.guardian?.phone || '',
      gCep: user.guardian?.address.cep || '', gStreet: user.guardian?.address.street || '', gNumber: user.guardian?.address.number || '', gComplement: user.guardian?.address.complement || '', gNeighborhood: user.guardian?.address.neighborhood || '', gCity: user.guardian?.address.city || '', gUf: user.guardian?.address.uf || ''
    });
    setIsStudentFormOpen(true);
    setIsFormDirty(false);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormData.name || !studentFormData.email) return;

    const userData: any = {
        name: studentFormData.name,
        email: studentFormData.email,
        role: Role.STUDENT,
        cpf: studentFormData.cpf,
        rg: studentFormData.rg,
        birth_date: studentFormData.birthDate || null, 
        phone: studentFormData.phone,
        address: {
            cep: studentFormData.cep, street: studentFormData.street, number: studentFormData.number, complement: studentFormData.complement, neighborhood: studentFormData.neighborhood, city: studentFormData.city, uf: studentFormData.uf
        },
        guardian: {
            name: studentFormData.gName, cpf: studentFormData.gCpf, rg: studentFormData.gRg, relationship: studentFormData.gRel, email: studentFormData.gEmail, phone: studentFormData.gPhone,
            address: { cep: studentFormData.gCep, street: studentFormData.gStreet, number: studentFormData.gNumber, complement: studentFormData.gComplement, neighborhood: studentFormData.gNeighborhood, city: studentFormData.gCity, uf: studentFormData.gUf }
        }
    };

    if (editingUserId) {
       // Update existing
       const { error } = await supabase.from('users').update(userData).eq('id', editingUserId);
       if (!error) {
           setUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, ...userData } as User : u));
           alert('Dados do aluno atualizados!');
       }
    } else {
       // Create new student
       const newUserPayload = {
           ...userData,
           password: '123', // Default password
           avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentFormData.name}`,
           status: 'active',
           enrolled_courses: []
       };

       const { data, error } = await supabase.from('users').insert([newUserPayload]).select().single();
       if (data) {
           setUsers(prev => [...prev, { ...data, enrolledCourses: [] }]);
           alert('Aluno cadastrado com sucesso. Senha padrão: "123".');
       }
    }
    setEditingUserId(null);
    setStudentFormData({ name: '', cpf: '', rg: '', birthDate: '', email: '', phone: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', uf: '', gName: '', gCpf: '', gRg: '', gRel: '', gEmail: '', gPhone: '', gCep: '', gStreet: '', gNumber: '', gComplement: '', gNeighborhood: '', gCity: '', gUf: '' });
    setIsFormDirty(false);
    setIsStudentFormOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudentFormData(prev => ({ ...prev, [name]: value }));
    setIsFormDirty(true);
    
    // Auto-fetch CEP
    if (name === 'cep' && value.length === 8) fetchAddress(value, 'student');
    if (name === 'gCep' && value.length === 8) fetchAddress(value, 'guardian');
  };

  // --- CONTRACT LOGIC ---
  const handleSaveTemplate = () => {
    if (!tempTemplateTitle || !tempTemplateContent) return;
    if (editingTemplate) { setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, title: tempTemplateTitle, content: tempTemplateContent } : t)); } 
    else { setTemplates(prev => [...prev, { id: `t-${Date.now()}`, title: tempTemplateTitle, content: tempTemplateContent, createdAt: new Date().toLocaleDateString() }]); }
    setShowTemplateModal(false); setEditingTemplate(null); setTempTemplateTitle(''); setTempTemplateContent('');
  };

  const handleDeleteTemplate = (id: string) => { if (window.confirm("Excluir modelo?")) setTemplates(prev => prev.filter(t => t.id !== id)); };

  const prepareContractPreview = () => {
    const student = users.find(u => u.id === genSelectedStudent);
    const course = courses.find(c => c.id === genSelectedCourse);
    const template = templates.find(t => t.id === genSelectedTemplate);
    if (!student || !course || !template) { alert("Selecione todos os campos."); return; }
    let content = template.content.replace(/{{aluno_nome}}/g, student.name).replace(/{{aluno_cpf}}/g, student.cpf || '---').replace(/{{aluno_rg}}/g, student.rg || '---').replace(/{{aluno_endereco}}/g, student.address ? `${student.address.street}, ${student.address.number}, ${student.address.city}/${student.address.uf}` : '').replace(/{{curso_nome}}/g, course.title).replace(/{{curso_valor}}/g, course.price.toFixed(2)).replace(/{{data_atual}}/g, new Date().toLocaleDateString());
    setPreviewContract({ content, studentId: student.id, courseId: course.id, templateId: template.id });
  };

  const confirmGenerateContract = async () => {
     if (!previewContract) return;
     const student = users.find(u => u.id === previewContract.studentId);
     const course = courses.find(c => c.id === previewContract.courseId);
     
     const contractPayload = {
         student_id: previewContract.studentId,
         student_name: student?.name,
         course_id: previewContract.courseId,
         course_name: course?.title,
         content: previewContract.content,
         status: 'PENDING',
         url: '#'
     };

     const { data, error } = await supabase.from('contracts').insert([contractPayload]).select().single();

     if (data && !error) {
         const newContract = {
             ...data,
             id: data.id,
             studentId: data.student_id,
             studentName: data.student_name,
             courseId: data.course_id,
             courseName: data.course_name,
             templateId: 't1',
             createdAt: new Date(data.created_at).toLocaleDateString()
         };
         setContracts([newContract, ...contracts]); 
         setPreviewContract(null); 
         setShowContractGenModal(false); 
         setContractView('LIST'); 
         alert("Contrato gerado!");
     }
  };

  const handleDownloadPDF = async (contract: Contract) => {
     if (contract.status === 'SIGNED' && contract.url && contract.url !== '#') {
         // Logic to download the stored file
         const link = document.createElement('a');
         link.href = contract.url;
         link.download = `CONTRATO_ASSINADO_${contract.studentName.replace(/\s/g, '_')}_${contract.id}`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         return;
     }
     if (isGeneratingPdf) return;
     setIsGeneratingPdf(true);
     try {
       const element = document.createElement('div');
       element.style.width = '210mm'; element.style.minHeight = '297mm'; element.style.padding = '20mm'; element.style.fontFamily = "'Times New Roman', Times, serif"; element.style.backgroundColor = 'white'; element.style.color = 'black'; element.style.position = 'fixed'; element.style.top = '-9999px';
       element.innerHTML = `<div style="font-size:12pt;line-height:1.5;text-align:justify;"><h1 style="text-align:center;margin-bottom:30px;">CONTRATO</h1><div style="white-space:pre-wrap;">${contract.content}</div></div>`;
       document.body.appendChild(element);
       if (window.html2canvas && window.jspdf) {
          const canvas = await window.html2canvas(element, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'mm', 'a4');
          pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
          pdf.save(`Contrato_${contract.id}.pdf`);
       }
       document.body.removeChild(element);
     } catch (err) { console.error(err); alert("Erro ao gerar PDF."); } finally { setIsGeneratingPdf(false); }
  };

  const handleUploadSigned = (id: string) => {
     const fileInput = document.createElement('input');
     fileInput.type = 'file'; fileInput.accept = '.pdf, .jpg, .png';
     fileInput.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
            // In real app, upload to storage bucket
            const fakeUrl = URL.createObjectURL(file);
            await supabase.from('contracts').update({ status: 'SIGNED', url: fakeUrl }).eq('id', id);
            
            setContracts(prev => prev.map(c => c.id === id ? { ...c, status: 'SIGNED', url: fakeUrl, createdAt: new Date().toLocaleDateString() } : c));
            alert("Contrato assinado armazenado com sucesso!");
        }
     };
     fileInput.click();
  };

  const handleSendNotificationLocal = () => {
    // ... existing notification logic (local state for now)
    if (!notifText.trim() || !onSendNotification) return;
    const newNotif: SystemNotification = {
        id: `n-${Date.now()}`,
        title: 'Aviso da Coordenação',
        message: notifText,
        targetType: notifTargetType,
        targetUserId: notifTargetUser,
        sentAt: 'Agora',
        author: 'Administração',
        interactions: []
    };
    onSendNotification(newNotif);
    setNotifText('');
    alert("Notificação enviada com sucesso!");
  };

  const StatCard = ({ label, val, color }: { label: string, val: string, color: string }) => (
    <div className={`p-8 bg-white/5 border border-white/5 rounded-[30px] flex flex-col justify-between h-40 hover:border-${color} transition-all group`}>
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">{label}</p>
       <p className="text-5xl font-black italic tracking-tighter text-white group-hover:scale-110 origin-left transition-transform">{val}</p>
    </div>
  );

  return (
    <div className="animate-fade-in min-h-screen bg-[#02040e]">
      <header className="px-6 md:px-12 py-8 border-b border-white/5 bg-[#02040e]">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Olavo Digital</h1>
      </header>

      <div className="px-6 md:px-12 py-8">
        <main className="min-w-0">
          {/* DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <StatCard label="Alunos" val={users.filter(u => u.role === Role.STUDENT).length.toString()} color="primary" />
                 <StatCard label="Cursos" val={courses.length.toString()} color="green-500" />
                 <StatCard label="Receita" val="R$ --" color="primary" />
                 <StatCard label="Contratos" val={contracts.length.toString()} color="blue-500" />
              </div>
              {/* ... Rest of Dashboard ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 rounded-[30px] p-8">
                   <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Alertas do Sistema</h3>
                   <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                         <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                         <p className="text-xs font-bold text-red-400">{contracts.filter(c => c.status === 'PENDING').length} contratos aguardando assinatura</p>
                      </div>
                   </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-[30px] p-8">
                   <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Acesso Rápido</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <button onClick={handleCreateCourse} className="p-4 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">Criar Curso</button>
                      <button onClick={() => { setIsStudentFormOpen(true); setEditingUserId(null); setIsFormDirty(false); }} className="p-4 bg-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all">Novo Aluno</button>
                      <button onClick={() => setShowContractGenModal(true)} className="p-4 bg-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all">Gerar Contrato</button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* ... COURSES VIEW ... */}
          {currentView === 'courses' && (
            <div className="space-y-8 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Gestão de Catálogo</h2>
                  <button onClick={handleCreateCourse} className="bg-primary text-black px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">Novo Curso</button>
               </div>
               <div className="grid gap-4">
                  {courses.map(course => (
                    <div key={course.id} className="p-6 bg-white/5 border border-white/5 rounded-[30px] flex items-center justify-between group hover:bg-white/10 transition-all">
                       <div className="flex items-center gap-6">
                          <img src={course.thumbnail} className="w-20 h-14 object-cover rounded-xl" alt="" />
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-black uppercase bg-white/10 px-2 py-0.5 rounded text-white/60">{course.program}</span>
                                <span className="text-[8px] font-black uppercase bg-white/10 px-2 py-0.5 rounded text-white/60">{course.category}</span>
                             </div>
                             <h4 className="font-black italic uppercase text-lg">{course.title}</h4>
                             <div className="flex gap-3 mt-1">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${course.status === ContentStatus.PUBLISHED ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/40'}`}>{course.status}</span>
                                <span className="text-[8px] font-black uppercase text-white/30 px-2 py-0.5">{course.modules.length} Módulos</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => { setSelectedCourse(course); setIsCourseModalOpen(true); setIsFormDirty(false); }} className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Editar</button>
                          <button onClick={() => handleToggleStatus(course.id)} className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-all">
                             {course.status === ContentStatus.PUBLISHED ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          </button>
                          <button onClick={() => handleDeleteCourse(course.id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* PROFESSORS AND USERS VIEWS (Similar structure to previous, mapped to state) */}
          {currentView === 'professors' && (
             <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter">Corpo Docente</h2>
                   <button onClick={() => handleOpenProfessorForm()} className="bg-primary text-black px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">Novo Professor</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                   {users.filter(u => u.role === Role.PROFESSOR).map(prof => (
                      <div key={prof.id} className="group bg-white/5 rounded-3xl border border-white/5 overflow-hidden hover:border-primary/50 transition-all flex flex-col">
                         <div className="aspect-[3/4] relative overflow-hidden">
                            <img src={prof.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={prof.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => handleOpenProfessorForm(prof)} className="p-2 bg-white text-black rounded-full hover:bg-primary transition-all shadow-xl"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                               <button onClick={() => handleDeleteUser(prof.id)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-xl"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                               <h3 className="text-white font-black uppercase italic leading-tight text-lg drop-shadow-md">{prof.name}</h3>
                               <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1 truncate">{prof.specialty || 'Sem Especialidade'}</p>
                            </div>
                         </div>
                         <div className="p-4 bg-white/5 flex-1">
                            <div className="flex flex-wrap gap-1.5">
                               {prof.subjects?.slice(0, 3).map((subj, i) => <span key={i} className="text-[8px] font-black uppercase bg-black/40 text-white/70 px-2 py-1 rounded border border-white/5">{subj}</span>)}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {currentView === 'users' && (
             <div className="space-y-8 animate-fade-in">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Base de Usuários (Geral)</h2>
                <div className="bg-white/5 rounded-[30px] overflow-hidden border border-white/5">
                   <table className="w-full text-left">
                      <thead className="bg-black/20 text-[9px] font-black uppercase tracking-widest text-white/30"><tr><th className="p-6">Nome</th><th className="p-6">Função</th><th className="p-6">Status</th><th className="p-6 text-right">Ações</th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                         {users.filter(u => userFilterRole === 'ALL' || u.role === userFilterRole).map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-all">
                               <td className="p-6 flex items-center gap-3"><img src={u.avatar} className="w-8 h-8 rounded-full" alt="" /><div><p className="text-sm font-bold text-white">{u.name}</p><p className="text-[10px] text-white/40">{u.email}</p></div></td>
                               <td className="p-6"><span className="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase">{u.role}</span></td>
                               <td className="p-6"><span className="text-[9px] font-black uppercase text-green-500">{u.status}</span></td>
                               <td className="p-6 text-right flex justify-end gap-2">
                                  <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-white/40 hover:text-red-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {currentView === 'students-new' && (
            <div className="space-y-8 animate-fade-in relative">
               {!isStudentFormOpen ? (
                 <>
                   <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter">Matrículas Ativas</h2>
                      <button 
                        onClick={() => { setIsStudentFormOpen(true); setEditingUserId(null); setIsFormDirty(false); }}
                        className="w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all absolute top-0 right-0 z-10"
                      >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      </button>
                   </div>
                   
                   <div className="bg-white/5 rounded-[30px] overflow-hidden border border-white/5 mt-8">
                      <table className="w-full text-left">
                         <thead className="bg-black/20 text-[9px] font-black uppercase tracking-widest text-white/30">
                            <tr><th className="p-6">Aluno</th><th className="p-6">Documento</th><th className="p-6">Responsável</th><th className="p-6 text-right">Ações</th></tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                            {users.filter(u => u.role === Role.STUDENT).map(u => (
                               <tr key={u.id} className="hover:bg-white/5 transition-all">
                                  <td className="p-6 flex items-center gap-3">
                                     <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-black uppercase">{u.name[0]}</div>
                                     <div><p className="text-sm font-bold text-white">{u.name}</p><p className="text-[10px] text-white/40">{u.email}</p></div>
                                  </td>
                                  <td className="p-6"><p className="text-[10px] font-bold text-white">{u.cpf || '---'}</p><p className="text-[9px] text-white/30 uppercase">CPF</p></td>
                                  <td className="p-6"><p className="text-[10px] font-bold text-white">{u.guardian?.name || '---'}</p><p className="text-[9px] text-white/30 uppercase">{u.guardian?.phone || ''}</p></td>
                                  <td className="p-6 text-right flex justify-end gap-2">
                                     <button onClick={() => openStudentEdit(u)} className="text-primary text-[10px] font-black uppercase hover:underline">Ver Detalhes</button>
                                     <button onClick={() => handleDeleteUser(u.id)} className="text-red-500/50 hover:text-red-500 p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                 </>
               ) : (
                 <div className="animate-fade-in max-w-5xl mx-auto">
                    {/* ... Existing Student Form Markup, updated with handleSaveStudent ... */}
                    <header className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                       <div>
                          <h2 className="text-3xl font-black italic uppercase tracking-tighter">{editingUserId ? 'Editar Cadastro' : 'Ficha de Matrícula'}</h2>
                          <p className="text-white/40 font-medium text-xs mt-1">Preencha todos os campos obrigatórios.</p>
                       </div>
                       <button onClick={() => checkUnsavedChanges(() => setIsStudentFormOpen(false))} className="p-3 bg-white/5 rounded-full hover:text-red-500 transition-all">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                    </header>
                    <form onSubmit={handleSaveStudent} className="space-y-8">
                       
                       {/* 1. DADOS PESSOAIS DO ALUNO */}
                       <section className="bg-white/5 border border-white/5 rounded-[30px] p-8">
                          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-6">Dados do Aluno</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             <div className="lg:col-span-2 space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Nome Completo</label>
                                <input required name="name" value={studentFormData.name} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">E-mail</label>
                                <input type="email" required name="email" value={studentFormData.email} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             {/* ... other fields ... */}
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Telefone / WhatsApp</label>
                                <input name="phone" value={studentFormData.phone} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Data de Nascimento</label>
                                <input type="date" name="birthDate" value={studentFormData.birthDate} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">CPF</label>
                                <input name="cpf" value={studentFormData.cpf} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">RG</label>
                                <input name="rg" value={studentFormData.rg} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                          </div>
                       </section>

                       {/* 2. ENDEREÇO DO ALUNO */}
                       <section className="bg-white/5 border border-white/5 rounded-[30px] p-8">
                          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-6">Endereço do Aluno</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             {/* ... Address fields (same as previous) ... */}
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">CEP (Busca Auto)</label>
                                <input name="cep" value={studentFormData.cep} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="lg:col-span-2 space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Rua / Logradouro</label>
                                <input name="street" value={studentFormData.street} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Número</label>
                                <input name="number" value={studentFormData.number} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Complemento</label>
                                <input name="complement" value={studentFormData.complement} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Bairro</label>
                                <input name="neighborhood" value={studentFormData.neighborhood} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Cidade</label>
                                <input name="city" value={studentFormData.city} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Estado</label>
                                <input name="uf" value={studentFormData.uf} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                          </div>
                       </section>

                       {/* 3. DADOS DO RESPONSÁVEL */}
                       <section className="bg-white/5 border border-white/5 rounded-[30px] p-8">
                          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-6">Dados do Responsável (Se menor)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             {/* ... Guardian fields ... */}
                             <div className="lg:col-span-2 space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Nome Completo</label>
                                <input name="gName" value={studentFormData.gName} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">E-mail</label>
                                <input type="email" name="gEmail" value={studentFormData.gEmail} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Telefone / WhatsApp</label>
                                <input name="gPhone" value={studentFormData.gPhone} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">CPF</label>
                                <input name="gCpf" value={studentFormData.gCpf} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">RG</label>
                                <input name="gRg" value={studentFormData.gRg} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-white/30 pl-2">Grau de Parentesco</label>
                                <input name="gRel" value={studentFormData.gRel} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                             </div>
                          </div>
                          
                          <div className="mt-8 pt-8 border-t border-white/5">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">Endereço do Responsável</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* ... Guardian Address fields ... */}
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black uppercase text-white/30 pl-2">CEP (Busca Auto)</label>
                                   <input name="gCep" value={studentFormData.gCep} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                                </div>
                                <div className="lg:col-span-2 space-y-2">
                                   <label className="text-[9px] font-black uppercase text-white/30 pl-2">Rua / Logradouro</label>
                                   <input name="gStreet" value={studentFormData.gStreet} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black uppercase text-white/30 pl-2">Número</label>
                                   <input name="gNumber" value={studentFormData.gNumber} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black uppercase text-white/30 pl-2">Complemento</label>
                                   <input name="gComplement" value={studentFormData.gComplement} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black uppercase text-white/30 pl-2">Bairro</label>
                                   <input name="gNeighborhood" value={studentFormData.gNeighborhood} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black uppercase text-white/30 pl-2">Cidade</label>
                                   <input name="gCity" value={studentFormData.gCity} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black uppercase text-white/30 pl-2">Estado</label>
                                   <input name="gUf" value={studentFormData.gUf} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white text-sm font-bold focus:border-primary outline-none" />
                                </div>
                             </div>
                          </div>
                       </section>

                       <div className="flex justify-end pt-4 gap-4">
                          <button type="button" onClick={() => checkUnsavedChanges(() => setIsStudentFormOpen(false))} className="px-8 py-5 rounded-full text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">Cancelar</button>
                          <button type="submit" className="bg-primary text-black px-16 py-5 rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                             {editingUserId ? 'Salvar Alterações' : 'Confirmar Matrícula'}
                          </button>
                       </div>
                    </form>
                 </div>
               )}
            </div>
          )}

          {/* ... Other Views ... */}
          
          {/* COURSE EDITOR MODAL */}
          {isCourseModalOpen && selectedCourse && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-y-auto animate-fade-in">
               <div className="max-w-6xl mx-auto p-8 md:p-16 space-y-12">
                  <header className="flex justify-between items-center border-b border-white/10 pb-8">
                     <div><p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2">Editor de Curso</p><h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">{selectedCourse.id.startsWith('new-') ? 'Novo Curso' : 'Editar Curso'}</h2></div>
                     <div className="flex gap-4">
                        <button onClick={() => checkUnsavedChanges(() => setIsCourseModalOpen(false))} className="p-4 rounded-full border border-white/10 text-white/40 hover:text-white hover:bg-red-500/20 transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        <button onClick={saveCourseToDB} className="px-8 py-3 rounded-full bg-primary text-black uppercase text-[10px] font-black tracking-widest shadow-xl hover:scale-105 transition-all">Salvar Alterações</button>
                     </div>
                  </header>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white/60">Estrutura Hierárquica</h3>
                        <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Programa / Tipo</label><select value={selectedCourse.program} onChange={(e) => handleUpdateCourse({...selectedCourse, program: e.target.value, category: '', subject: ''})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary"><option value="">Selecione...</option>{Object.keys(PROGRAM_STRUCTURE).map(prog => <option key={prog} value={prog}>{prog}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Área de Conhecimento</label><select value={selectedCourse.category} onChange={(e) => handleUpdateCourse({...selectedCourse, category: e.target.value, subject: ''})} disabled={!selectedCourse.program} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary disabled:opacity-50"><option value="">Selecione...</option>{selectedCourse.program && PROGRAM_STRUCTURE[selectedCourse.program]?.areas.map(area => <option key={area} value={area}>{area}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Matéria Específica</label><select value={selectedCourse.subject} onChange={(e) => handleUpdateCourse({...selectedCourse, subject: e.target.value})} disabled={!selectedCourse.category} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary disabled:opacity-50"><option value="">Selecione...</option>{selectedCourse.category && PROGRAM_STRUCTURE[selectedCourse.program]?.subjects[selectedCourse.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}</select></div>
                     </div>
                     <div className="space-y-8">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white/60">Detalhes do Curso</h3>
                        <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Título do Curso / Tópico</label><input type="text" value={selectedCourse.title} onChange={(e) => handleUpdateCourse({...selectedCourse, title: e.target.value})} placeholder="Ex: Leis de Newton" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary" /></div>
                        <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Descrição</label><textarea value={selectedCourse.description} onChange={(e) => handleUpdateCourse({...selectedCourse, description: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-medium outline-none focus:border-primary h-32 resize-none" /></div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* ... Rest of modals (Generic User Edit, Block User, Contract Modals) same as provided before but using new state/handlers ... */}
          
          {/* Include missing Modals here from previous step (Block, Generic Edit, Contract Gen, Template, PDF Preview) - keeping them for completeness */}
          {/* MODAL: BLOCK USER (NEW) */}
          {blockingUser && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
               <div className="w-full max-w-md bg-[#0a1024] rounded-[40px] border border-white/10 p-10 space-y-6 relative text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">{blockingUser.isBlocking ? 'Bloquear Acesso' : 'Desbloquear Acesso'}</h2>
                     <p className="text-xs text-white/60 mt-2 font-medium">Você está prestes a alterar o status de <span className="text-white font-bold">{blockingUser.name}</span>.</p>
                  </div>
                  
                  {blockingUser.isBlocking && (
                     <div className="text-left space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Motivo do Bloqueio</label>
                        <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ex: Pagamento pendente" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-red-500" />
                     </div>
                  )}

                  <div className="flex gap-4 pt-4">
                     <button onClick={() => setBlockingUser(null)} className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancelar</button>
                     <button onClick={confirmBlockUser} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all ${blockingUser.isBlocking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                        {blockingUser.isBlocking ? 'Confirmar Bloqueio' : 'Liberar Acesso'}
                     </button>
                  </div>
               </div>
            </div>
          )}

          {/* MODAL: GENERIC USER EDIT (NEW) */}
          {isUserEditModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
               <div className="w-full max-w-lg bg-[#0a1024] rounded-[40px] border border-white/10 p-10 space-y-8 relative">
                  <button onClick={() => setIsUserEditModalOpen(false)} className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <header>
                     <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2">Administração</p>
                     <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Editar Usuário</h2>
                  </header>
                  <form onSubmit={saveGenericUser} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Nome</label>
                        <input required type="text" value={simpleUserFormData.name} onChange={(e) => setSimpleUserFormData({...simpleUserFormData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Email</label>
                        <input required type="email" value={simpleUserFormData.email} onChange={(e) => setSimpleUserFormData({...simpleUserFormData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Função</label>
                        <select value={simpleUserFormData.role} onChange={(e) => setSimpleUserFormData({...simpleUserFormData, role: e.target.value as Role})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary">
                           <option value={Role.STUDENT}>Aluno</option>
                           <option value={Role.PROFESSOR}>Professor</option>
                           <option value={Role.ADMIN}>Administrador</option>
                        </select>
                     </div>
                     <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary text-black px-12 py-4 rounded-full font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all">Salvar Alterações</button>
                     </div>
                  </form>
               </div>
            </div>
          )}

          {/* ... Contract Modals (Preview, Gen, Template) remain same as previous step, just ensured they use state correctly ... */}
          {/* CONTRACT GENERATOR MODAL */}
          {showContractGenModal && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
               <div className="w-full max-w-lg bg-[#0a1024] rounded-[40px] border border-white/10 p-10 space-y-8">
                  <header>
                     <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2">Secretaria Virtual</p>
                     <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Emitir Contrato</h2>
                  </header>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Selecionar Aluno</label>
                        <select value={genSelectedStudent} onChange={(e) => setGenSelectedStudent(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary">
                           <option value="">Selecione...</option>
                           {users.filter(u => u.role === Role.STUDENT).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Selecionar Curso</label>
                        <select value={genSelectedCourse} onChange={(e) => setGenSelectedCourse(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary">
                           <option value="">Selecione...</option>
                           {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Modelo de Contrato</label>
                        <select value={genSelectedTemplate} onChange={(e) => setGenSelectedTemplate(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary">
                           <option value="">Selecione...</option>
                           {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setShowContractGenModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancelar</button>
                     <button onClick={previewContract ? confirmGenerateContract : prepareContractPreview} className="flex-1 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl">
                        {previewContract ? 'Confirmar Emissão' : 'Pré-visualizar'}
                     </button>
                  </div>
                  {previewContract && (
                     <div className="p-4 bg-white/5 rounded-2xl max-h-40 overflow-y-auto text-xs text-white/60 whitespace-pre-wrap border border-white/5">
                        {previewContract.content}
                     </div>
                  )}
               </div>
            </div>
          )}

          {/* TEMPLATE EDITOR MODAL */}
          {showTemplateModal && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
               <div className="w-full max-w-2xl bg-[#0a1024] rounded-[40px] border border-white/10 p-10 space-y-8">
                  <header>
                     <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2">Jurídico</p>
                     <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}</h2>
                  </header>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Título do Modelo</label>
                        <input type="text" value={tempTemplateTitle} onChange={(e) => setTempTemplateTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-primary" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Cláusulas (Use variáveis como {'{{aluno_nome}}'})</label>
                        <textarea value={tempTemplateContent} onChange={(e) => setTempTemplateContent(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-medium outline-none focus:border-primary h-60 resize-none" />
                     </div>
                     <div className="flex gap-2 flex-wrap">
                        {['{{aluno_nome}}', '{{aluno_cpf}}', '{{curso_nome}}', '{{curso_valor}}', '{{data_atual}}'].map(tag => (
                           <button key={tag} onClick={() => setTempTemplateContent(prev => prev + tag)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-primary transition-all">{tag}</button>
                        ))}
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setShowTemplateModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancelar</button>
                     <button onClick={handleSaveTemplate} className="flex-1 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl">Salvar Modelo</button>
                  </div>
               </div>
            </div>
          )}

          {/* PDF PREVIEW MODAL */}
          {showContractPreviewModal && (
             <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
                <div className="w-full max-w-3xl bg-white text-black rounded-[20px] overflow-hidden flex flex-col max-h-[90vh]">
                   <div className="flex-1 p-12 overflow-y-auto font-serif space-y-6">
                      <h1 className="text-center font-bold text-xl uppercase border-b-2 border-black pb-4 mb-8">Contrato de Prestação de Serviços</h1>
                      <div className="whitespace-pre-wrap leading-relaxed text-sm text-justify">
                         {showContractPreviewModal.content}
                      </div>
                      <div className="mt-16 flex justify-between pt-8">
                         <div className="w-[45%] border-t border-black text-center pt-2 text-xs">Assinatura do Responsável</div>
                         <div className="w-[45%] border-t border-black text-center pt-2 text-xs">Olavo Digital Ensino LTDA</div>
                      </div>
                   </div>
                   <div className="bg-gray-100 p-4 flex justify-end gap-4 border-t border-gray-300">
                      <button onClick={() => setShowContractPreviewModal(null)} className="px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 rounded-lg transition-all">Fechar</button>
                      <button onClick={() => handleDownloadPDF(showContractPreviewModal)} disabled={isGeneratingPdf} className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2">
                         {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
                      </button>
                      {showContractPreviewModal.status !== 'SIGNED' && (
                         <button onClick={() => handleUploadSigned(showContractPreviewModal.id)} className="px-6 py-2 bg-green-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-green-700 transition-all">
                            Upload Assinado
                         </button>
                      )}
                   </div>
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;
