import React, { useState, useEffect } from 'react';
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
import { 
  ShortcutsModal, 
  CashManagementModal, 
  NewAppointmentModal, 
  NewClientModal 
} from './components/QuickActionsModal';
import { api } from './services/api';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('bella_theme') === 'dark';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [cashStatus, setCashStatus] = useState(null);
  const [waStatus, setWaStatus] = useState('connected');

  // Modals state
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Apply Dark Mode Class
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
    refreshGlobalState();
    const interval = setInterval(refreshGlobalState, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcuts (F1, F2, F3, F4, ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F1: Help / Shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
      // F2: New Appointment
      else if (e.key === 'F2') {
        e.preventDefault();
        setShowAppointmentModal(true);
      }
      // F3: PDV / Caixa
      else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('cash-register');
      }
      // F4: New Client
      else if (e.key === 'F4') {
        e.preventDefault();
        setShowClientModal(true);
      }
      // ESC: Close open modals
      else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setShowCashModal(false);
        setShowAppointmentModal(false);
        setShowClientModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        cashStatus={cashStatus}
        waStatus={waStatus}
        onOpenNewAppointment={() => setShowAppointmentModal(true)}
        onOpenPDV={() => setActiveTab('cash-register')}
        onOpenNewClient={() => setShowClientModal(true)}
        onOpenCashModal={() => setShowCashModal(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenHelp={() => setShowShortcutsModal(true)}
        />

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
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

          {activeTab === 'backup' && (
            <BackupSettings />
          )}
        </main>

      </div>

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

    </div>
  );
}
