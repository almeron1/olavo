
import React, { useState, useEffect } from 'react';
import { Role, User, Course, SystemSettings, SystemNotification, NotificationInteraction } from './types';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import Store from './pages/Store';
import Search from './pages/Search';
import CourseDetails from './pages/CourseDetails';
import Player from './pages/Player';
import Live from './pages/Live';
import Profile from './pages/Profile';
import Login from './pages/Login';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardProfessor from './pages/DashboardProfessor';
import Drops from './pages/Drops';
import Forums from './pages/Forums';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Used for admin view
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('login');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'n1',
      title: 'Aviso da Coordenação',
      message: 'Bem-vindo ao novo sistema integrado.',
      targetType: 'ALL',
      sentAt: 'Agora',
      author: 'Sistema',
      interactions: []
    }
  ]);

  const [settings, setSettings] = useState<SystemSettings>({
    primaryColor: '#EAB308', 
    logoUrl: '',
    liveYoutubeUrl: 'https://www.youtube.com/embed/vR2fidoDrb8',
    spotlightCourseId: 'c1',
    spotlightTitle: 'Redação: Estrutura Diamante',
    spotlightSubtitle: 'Aulas cinematográficas com os professores mais renomados do país.'
  });

  // --- 1. Auth & Initial Load (Custom Logic) ---
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const storedUser = localStorage.getItem('olavo_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Verify if user still exists in DB
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', parsedUser.id)
          .single();
        
        if (data && !error) {
           const userData: User = { ...data, enrolledCourses: data.enrolled_courses || [] };
           setUser(userData);
           fetchCourses();
           
           if (userData.role === Role.ADMIN) {
               fetchAllUsers();
           }
           
           if (currentPage === 'login') {
             setCurrentPage(userData.role === Role.ADMIN ? 'admin-dashboard' : 'home');
           }
        } else {
           // User deleted or invalid
           handleLogout();
        }
      } catch (e) {
        handleLogout();
      }
    } else {
      setCurrentPage('login');
    }
    setIsLoading(false);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
      localStorage.setItem('olavo_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      fetchCourses();
      
      if (loggedInUser.role === Role.ADMIN) {
          fetchAllUsers();
          setCurrentPage('admin-dashboard');
      } else {
          setCurrentPage('home');
      }
  };

  // --- 2. Data Fetching ---
  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`*, modules (*, lessons (*))`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (coursesData) {
        const formattedCourses = coursesData.map((c: any) => ({
            ...c,
            professorId: c.professor_id,
            showInStore: c.show_in_store,
            modules: c.modules?.sort((a: any, b: any) => a.order - b.order).map((m: any) => ({
                ...m,
                courseId: m.course_id,
                lessons: m.lessons?.sort((a: any, b: any) => a.order - b.order).map((l: any) => ({
                    ...l,
                    moduleId: l.module_id,
                    courseId: l.course_id,
                    videoUrl: l.video_url,
                    isFree: l.is_free
                }))
            }))
        }));
        setCourses(formattedCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAllUsers = async () => {
      const { data } = await supabase.from('users').select('*');
      if (data) {
          const mappedUsers = data.map((u: any) => ({
              ...u,
              enrolledCourses: u.enrolled_courses || []
          }));
          setUsers(mappedUsers);
      }
  };

  const handleSelectCourse = (courseId: string, lessonId?: string) => {
    setSelectedCourseId(courseId);
    if (lessonId) {
      setActiveLessonId(lessonId);
      setCurrentPage('player');
    } else {
      setCurrentPage('course-details');
    }
  };

  const handleSendNotification = (notif: SystemNotification) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const handleInteractNotification = (notifId: string, interaction: NotificationInteraction) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === notifId) {
        return {
          ...n,
          interactions: [interaction, ...n.interactions]
        };
      }
      return n;
    }));
  };

  const handleClearFeed = () => {
    if(window.confirm("Tem certeza que deseja limpar todo o histórico de retornos?")) {
      setNotifications(prev => prev.map(n => ({ ...n, interactions: [] })));
    }
  };

  const handleDeleteFeedback = (notifId: string, interactionIdx: number) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === notifId) {
        const newInteractions = [...n.interactions];
        newInteractions.splice(interactionIdx, 1);
        return { ...n, interactions: newInteractions };
      }
      return n;
    }));
  };

  const handleLogout = async () => {
      localStorage.removeItem('olavo_user');
      setUser(null);
      setCurrentPage('login');
  };

  if (isLoading) {
      return <div className="min-h-screen bg-[#02040e] flex items-center justify-center text-white">Carregando Olavo Digital...</div>;
  }

  const renderPage = () => {
    if (!user) return <Login users={[]} onLogin={handleLoginSuccess} />; 

    // --- ADMIN ROUTES ---
    if (user.role === Role.ADMIN) {
      if (currentPage === 'drops') return <Drops userRole={Role.ADMIN} onBack={() => setCurrentPage('admin-dashboard')} />;
      if (currentPage === 'forums') return <Forums userRole={Role.ADMIN} onBack={() => setCurrentPage('admin-dashboard')} />;
      if (currentPage === 'profile') return <Profile user={user} onUpdateUser={setUser} onLogout={handleLogout} />;
      
      let adminView = 'dashboard';
      if (currentPage === 'admin-courses') adminView = 'courses';
      if (currentPage === 'admin-users') adminView = 'users';
      if (currentPage === 'admin-professors') adminView = 'professors'; 
      if (currentPage === 'admin-students') adminView = 'students-new';
      if (currentPage === 'admin-cms') adminView = 'cms';
      if (currentPage === 'admin-contracts') adminView = 'contracts';
      if (currentPage === 'admin-notifications') adminView = 'notifications';
      
      return (
        <DashboardAdmin 
          currentView={adminView}
          courses={courses} 
          users={users} 
          setCourses={setCourses} 
          setUsers={setUsers} 
          settings={settings} 
          setSettings={setSettings}
          notifications={notifications}
          onSendNotification={handleSendNotification}
          onClearFeed={handleClearFeed}
          onDeleteFeedback={handleDeleteFeedback}
        />
      );
    }

    // --- PROFESSOR ROUTES ---
    if (currentPage === 'home' && user.role === Role.PROFESSOR) {
      return (
        <DashboardProfessor 
          user={user} 
          courses={courses} 
          notifications={notifications}
          onInteractNotification={handleInteractNotification}
          onSelectCourse={handleSelectCourse}
          onNavigate={setCurrentPage}
        />
      );
    }

    // --- STUDENT / SHARED ROUTES ---
    switch (currentPage) {
      case 'home':
        const spotlightCourse = courses.find(c => c.id === settings.spotlightCourseId) || courses[0];
        const organizedCourses = spotlightCourse ? [spotlightCourse, ...courses.filter(c => c.id !== spotlightCourse.id)] : courses;
        return <Home user={user} courses={organizedCourses} onSelectCourse={(id) => handleSelectCourse(id)} />;
      case 'store':
        return <Store user={user} courses={courses} onEnroll={() => {}} onSelectCourse={(id) => handleSelectCourse(id)} />;
      case 'search':
        return <Search user={user} courses={courses} onSelectCourse={(id) => handleSelectCourse(id)} />;
      case 'drops':
        return <Drops userRole={user.role} onBack={() => setCurrentPage('home')} />;
      case 'forums':
        return <Forums userRole={user.role} onBack={() => setCurrentPage('home')} />;
      case 'live':
        return <Live settings={settings} onBack={() => setCurrentPage('home')} />;
      case 'course-details':
        const course = courses.find(c => c.id === selectedCourseId);
        return <CourseDetails user={user} course={course || null} onEnroll={() => {}} onStartLesson={(cid, lid) => { setSelectedCourseId(cid); setActiveLessonId(lid || null); setCurrentPage('player'); }} />;
      case 'player':
        const pCourse = courses.find(c => c.id === selectedCourseId);
        return <Player user={user} course={pCourse || null} activeLessonId={activeLessonId} onSelectLesson={setActiveLessonId} onBack={() => setCurrentPage('course-details')} />;
      case 'profile':
        return <Profile user={user} onUpdateUser={setUser} onLogout={handleLogout} />;
      default:
        return <Home user={user} courses={courses} onSelectCourse={(id) => handleSelectCourse(id)} />;
    }
  };

  const isFullscreenPage = currentPage === 'player' || currentPage === 'live' || currentPage === 'forums' || currentPage === 'drops';

  return (
    <Layout 
      role={user?.role || Role.STUDENT} 
      currentPage={currentPage} 
      onNavigate={setCurrentPage} 
      user={user} 
      onLogout={handleLogout} 
      settings={settings}
      isInPlayer={isFullscreenPage}
      systemNotifications={notifications}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
