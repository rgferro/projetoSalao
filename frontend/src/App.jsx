import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import CashRegister from './pages/CashRegister';
import Financial from './pages/Financial';
import Professionals from './pages/Professionals';
import Services from './pages/Services';
import WhatsAppModule from './pages/WhatsAppModule';
import BackupSettings from './pages/BackupSettings';
import Subscription from './pages/Subscription';
import Manual from './pages/Manual';
import MasterAdmin from './pages/MasterAdmin';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Invite from './pages/Invite';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import SistemaSalao from './pages/SistemaSalao';
import SistemaBarbearia from './pages/SistemaBarbearia';
import SistemaEstetica from './pages/SistemaEstetica';
import SistemaEsmalteria from './pages/SistemaEsmalteria';
import SistemaLash from './pages/SistemaLash';
import PageTourModal from './components/PageTourModal';
import { 
  ShortcutsModal, 
  CashManagementModal, 
  NewAppointmentModal, 
  NewClientModal 
} from './components/QuickActionsModal';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  ShoppingBag, 
  Menu as MenuIcon 
} from 'lucide-react';
import { api } from './services/api';

function MainApp() {
  const { user, isAuthenticated, logout, defaultTab } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('bella_theme') === 'dark';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determinar visualização baseada no pathname
  const getViewFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    if (params.get('token') && path.includes('convite')) return 'invite';
    if (path === '/login') return 'login';
    if (path === '/cadastro') return 'register';
    if (path === '/convite') return 'invite';
    if (path === '/sobre') return 'sobre';
    if (path === '/contato') return 'contato';
    if (path === '/termos') return 'termos';
    if (path === '/privacidade') return 'privacidade';
    if (path === '/sistema-para-salao-de-beleza') return 'sistema-salao';
    if (path === '/sistema-para-barbearia') return 'sistema-barbearia';
    if (path === '/sistema-para-estetica' || path === '/sistema-para-estetica-e-esmalteria') return 'sistema-estetica';
    if (path === '/sistema-para-esmalteria-e-unhas' || path === '/sistema-para-esmalteria') return 'sistema-esmalteria';
    if (path === '/sistema-para-lash-designer-e-sobrancelhas' || path === '/sistema-para-lash-designer') return 'sistema-lash';
    if (path === '/master-admin' && user?.isMaster) return 'app_master';

    const savedUser = localStorage.getItem('bella_user');
    if (path === '/dashboard' || (savedUser && path === '/')) return 'app';

    return 'landing';
  };

  const [currentView, setCurrentView] = useState(getViewFromPath);
  const [activeTab, setActiveTab] = useState(defaultTab || 'dashboard');
  const [cashStatus, setCashStatus] = useState(null);
  const [waStatus, setWaStatus] = useState('connected');

  // Proteção: não permitir acesso à aba master-admin para usuários de demonstração ou comuns
  useEffect(() => {
    if (activeTab === 'master-admin' && !user?.isMaster) {
      setActiveTab('dashboard');
    }
  }, [activeTab, user]);

  // Modals state
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [activeTour, setActiveTour] = useState(null);

  // Escutar mudanças de navegação pelo histórico
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Navegador helper
  const navigateTo = (view, path = '/') => {
    window.history.pushState({}, '', path);
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  // Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bella_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bella_theme', 'light');
    }
  }, [darkMode]);

  // Load Initial Statuses
  const refreshGlobalState = async () => {
    try {
      const [cash, wa] = await Promise.all([
        api.getCurrentCash().catch(() => null),
        api.getWhatsAppStatus().catch(() => ({ status: 'connected' }))
      ]);
      if (cash) setCashStatus(cash);
      if (wa) setWaStatus(wa.status);
    } catch (e) {
      console.warn('Erro ao atualizar status global:', e);
    }
  };

  useEffect(() => {
    if (currentView === 'app' || currentView === 'app_master') {
      refreshGlobalState();
      const interval = setInterval(refreshGlobalState, 30000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Global Keyboard Shortcuts (F1, F2, F3, F4, ESC)
  useEffect(() => {
    if (currentView !== 'app' && currentView !== 'app_master') return;

    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setShowAppointmentModal(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('cash-register');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowClientModal(true);
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setShowCashModal(false);
        setShowAppointmentModal(false);
        setShowClientModal(false);
        setActiveTour(null);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView]);

  // Roteamento de Páginas Institucionais & Landing Pages
  if (currentView === 'sobre') return <About />;
  if (currentView === 'contato') return <Contact />;
  if (currentView === 'termos') return <Terms />;
  if (currentView === 'privacidade') return <Privacy />;
  if (currentView === 'sistema-salao') return <SistemaSalao />;
  if (currentView === 'sistema-barbearia') return <SistemaBarbearia />;
  if (currentView === 'sistema-estetica') return <SistemaEstetica />;
  if (currentView === 'sistema-esmalteria') return <SistemaEsmalteria />;
  if (currentView === 'sistema-lash') return <SistemaLash />;

  // 1. Landing Page View
  if (currentView === 'landing') {
    return (
      <LandingPage
        onNavigateLogin={() => navigateTo('login', '/login')}
        onNavigateRegister={() => navigateTo('register', '/cadastro')}
        onEnterDemo={() => navigateTo('app', '/dashboard')}
      />
    );
  }

  // 2. Register View (Onboarding Multi-Tenant)
  if (currentView === 'register') {
    return (
      <Register
        onNavigateLogin={() => navigateTo('login', '/login')}
        onNavigateLanding={() => navigateTo('landing', '/')}
        onRegisteredSuccess={() => navigateTo('app', '/dashboard')}
      />
    );
  }

  // 3. Login View
  if (currentView === 'login') {
    return (
      <Login
        onNavigateRegister={() => navigateTo('register', '/cadastro')}
        onNavigateLanding={() => navigateTo('landing', '/')}
        onLoginSuccess={() => navigateTo('app', '/dashboard')}
      />
    );
  }

  // 4. Invite View (Staff Password Setup)
  if (currentView === 'invite') {
    return (
      <Invite
        onNavigateLogin={() => navigateTo('login', '/login')}
      />
    );
  }

  // 5. Authenticated App View
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors overflow-x-hidden">
      
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        cashStatus={cashStatus}
        waStatus={waStatus}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        onOpenNewAppointment={() => setShowAppointmentModal(true)}
        onOpenPDV={() => setActiveTab('cash-register')}
        onOpenNewClient={() => setShowClientModal(true)}
        onOpenCashModal={() => setShowCashModal(true)}
        onLogout={() => {
          logout();
          navigateTo('landing', '/');
        }}
        onStartTour={() => setActiveTour(activeTab === 'dashboard' ? 'dashboard' : activeTab === 'appointments' ? 'agenda' : activeTab === 'clients' ? 'clients' : activeTab === 'cash-register' ? 'pdv' : activeTab === 'whatsapp' ? 'whatsapp' : 'dashboard')}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0">
        
        {/* Sidebar with RBAC Filtering (Desktop + Mobile Drawer) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenHelp={() => setShowShortcutsModal(true)}
          onStartTour={() => setActiveTour(activeTab === 'dashboard' ? 'dashboard' : activeTab === 'appointments' ? 'agenda' : activeTab === 'clients' ? 'clients' : activeTab === 'cash-register' ? 'pdv' : activeTab === 'whatsapp' ? 'whatsapp' : 'dashboard')}
        />

        {/* Page Content View */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto max-w-full">
          {activeTab === 'master-admin' && user?.isMaster && (
            <MasterAdmin />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              onOpenNewAppointment={() => setShowAppointmentModal(true)}
              onOpenNewClient={() => setShowClientModal(true)}
              onOpenPDV={() => setActiveTab('cash-register')}
              onOpenCashModal={() => setShowCashModal(true)}
            />
          )}

          {activeTab === 'appointments' && (
            <Appointments
              onOpenNewAppointment={() => setShowAppointmentModal(true)}
              onOpenPDV={() => setActiveTab('cash-register')}
            />
          )}

          {activeTab === 'clients' && (
            <Clients
              onOpenNewClient={() => setShowClientModal(true)}
            />
          )}

          {activeTab === 'cash-register' && (
            <CashRegister
              onOpenCashModal={() => setShowCashModal(true)}
            />
          )}

          {activeTab === 'financial' && (
            <Financial />
          )}

          {activeTab === 'professionals' && (
            <Professionals />
          )}

          {activeTab === 'services' && (
            <Services />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppModule />
          )}

          {activeTab === 'subscription' && (
            <Subscription />
          )}

          {activeTab === 'manual' && (
            <Manual
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'backup' && (
            <BackupSettings />
          )}
        </main>

      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for Mobile Screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around pb-safe shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${
            activeTab === 'dashboard'
              ? 'text-pink-600 dark:text-pink-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span className="text-[10px]">Início</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${
            activeTab === 'appointments'
              ? 'text-pink-600 dark:text-pink-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CalendarDays className={`w-5 h-5 mb-0.5 ${activeTab === 'appointments' ? 'scale-110' : ''}`} />
          <span className="text-[10px]">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${
            activeTab === 'clients'
              ? 'text-pink-600 dark:text-pink-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className={`w-5 h-5 mb-0.5 ${activeTab === 'clients' ? 'scale-110' : ''}`} />
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          onClick={() => setActiveTab('cash-register')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${
            activeTab === 'cash-register'
              ? 'text-pink-600 dark:text-pink-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingBag className={`w-5 h-5 mb-0.5 ${activeTab === 'cash-register' ? 'scale-110' : ''}`} />
          <span className="text-[10px]">PDV</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition ${
            isMobileMenuOpen || !['dashboard', 'appointments', 'clients', 'cash-register'].includes(activeTab)
              ? 'text-pink-600 dark:text-pink-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <MenuIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Mais</span>
        </button>
      </nav>

      {/* Quick Action Modals */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <CashManagementModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        cashStatus={cashStatus}
        onRefresh={refreshGlobalState}
      />

      <NewAppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onCreated={refreshGlobalState}
      />

      <NewClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onCreated={refreshGlobalState}
      />

      {/* Modal de Tour Guiado Interativo */}
      <PageTourModal
        tourKey={activeTour}
        isOpen={!!activeTour}
        onClose={() => setActiveTour(null)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
