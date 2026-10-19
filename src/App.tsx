/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CareWell Multispeciality Clinic
 * General Physician Practice Suite & Electronic Health Records (EHR)
 * HIPAA Compliant · Offline Data Access · Automated SMS Prescription Notifications
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Phone,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
  Stethoscope
} from 'lucide-react';

import {
  Patient,
  Appointment,
  Prescription,
  RefillRequest,
  SecureMessage,
  AuditLogEntry,
  UserSession
} from './types/clinic';

import { StorageService, DEFAULT_USERS } from './services/storage';
import { SmsService, SmsLogRecord } from './services/smsService';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PatientRecordsView } from './components/PatientRecordsView';
import { AppointmentsView } from './components/AppointmentsView';
import { PrescriptionsView } from './components/PrescriptionsView';
import { RefillsView } from './components/RefillsView';
import { SecureMessagingView } from './components/SecureMessagingView';
import { AnalyticsView } from './components/AnalyticsView';
import { HipaaAuditView } from './components/HipaaAuditView';
import { HipaaLockModal } from './components/HipaaLockModal';
import { PhoneSimulatorModal } from './components/PhoneSimulatorModal';
import { PrescriptionComposerModal } from './components/PrescriptionComposerModal';
import { WhatsAppChatbotModal } from './components/WhatsAppChatbotModal';
import { ServicesEnquiryModal } from './components/ServicesEnquiryModal';
import { AutomationEngine } from './services/automationEngine';
import { AutomationControlCenterModal } from './components/AutomationControlCenterModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'patients' | 'appointments' | 'prescriptions' | 'refills' | 'messages' | 'analytics' | 'audit'
  >('dashboard');

  // Application Data States
  const [currentUser, setCurrentUser] = useState<UserSession>(DEFAULT_USERS[0]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [refills, setRefills] = useState<RefillRequest[]>([]);
  const [messages, setMessages] = useState<SecureMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Modals & Controls State
  const [isLocked, setIsLocked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [maskPhi, setMaskPhi] = useState(false);
  const [showPhoneSimulator, setShowPhoneSimulator] = useState(false);
  const [showPrescriptionComposer, setShowPrescriptionComposer] = useState(false);
  const [showWhatsAppBot, setShowWhatsAppBot] = useState(false);
  const [showServicesEnquiry, setShowServicesEnquiry] = useState(false);
  const [showAutomationCenter, setShowAutomationCenter] = useState(false);
  const [composerPatientId, setComposerPatientId] = useState<string | undefined>(undefined);
  const [latestSmsNotification, setLatestSmsNotification] = useState<SmsLogRecord | null>(null);

  // Load all records from offline storage
  const loadData = () => {
    StorageService.init();
    setPatients(StorageService.getPatients());
    setAppointments(StorageService.getAppointments());
    setPrescriptions(StorageService.getPrescriptions());
    setRefills(StorageService.getRefills());
    setMessages(StorageService.getMessages());
    setAuditLogs(StorageService.getAuditLogs());
    setCurrentUser(StorageService.getCurrentUser());
    setPendingSyncCount(StorageService.getPendingSyncCount());
  };

  useEffect(() => {
    loadData();

    // Start 24/7 Background Automation Engine (Daemon) for reminders & follow-ups
    AutomationEngine.startDaemon(() => {
      loadData();
    });

    // Inactivity timer for automatic HIPAA logoff simulation (e.g. 15 minutes in production; demo safe)
    let inactivityTimeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(inactivityTimeout);
      // Demo: 30 minutes to prevent disturbing testing
      inactivityTimeout = setTimeout(() => {
        setIsLocked(true);
      }, 30 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    // Listen to real-time SMS events
    const handleSmsEvent = (e: CustomEvent<SmsLogRecord>) => {
      setLatestSmsNotification(e.detail);
      // Auto open simulator or show quick badge
    };
    window.addEventListener('carewell-sms-received' as unknown as keyof WindowEventMap, handleSmsEvent as EventListener);

    return () => {
      AutomationEngine.stopDaemon();
      clearTimeout(inactivityTimeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('carewell-sms-received' as unknown as keyof WindowEventMap, handleSmsEvent as EventListener);
    };
  }, []);

  // Offline Sync Execution
  const handleSyncNow = () => {
    StorageService.logAudit('OFFLINE_CACHE_SYNCED', `Synchronized ${pendingSyncCount} queued local mutations to CareWell primary cloud repository`);
    StorageService.clearSyncQueue();
    setPendingSyncCount(0);
    loadData();
    alert('Synchronization complete! All offline clinical notes and prescriptions are now securely synced.');
  };

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (!nextState) {
      StorageService.logAudit('OFFLINE_CACHE_SYNCED', 'Clinical terminal switched to Offline Mode. Local storage active.');
    } else {
      StorageService.logAudit('OFFLINE_CACHE_SYNCED', 'Clinical terminal reconnected to online network.');
    }
  };

  // Quick navigation helper
  const handleNavigateTab = (tab: string, param?: string) => {
    if (tab === 'patients' && param) {
      setSelectedPatientId(param);
    }
    setActiveTab(tab as typeof activeTab);
  };

  // Open Prescription Composer with specific patient
  const handleOpenNewPrescription = (patientId?: string) => {
    setComposerPatientId(patientId);
    setShowPrescriptionComposer(true);
  };

  // Open Appointment scheduler with specific patient
  const handleOpenNewAppointment = (patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
    setActiveTab('appointments');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
      
      {/* HIPAA Terminal Lock Modal */}
      <HipaaLockModal
        isLocked={isLocked}
        currentUser={currentUser}
        onUnlock={() => setIsLocked(false)}
      />

      {/* Real-time Patient Mobile SMS Simulator */}
      <PhoneSimulatorModal
        isOpen={showPhoneSimulator}
        onClose={() => setShowPhoneSimulator(false)}
        initialMessage={latestSmsNotification}
      />

      {/* Prescription Composer Modal */}
      <PrescriptionComposerModal
        isOpen={showPrescriptionComposer}
        onClose={() => setShowPrescriptionComposer(false)}
        patients={patients}
        preselectedPatientId={composerPatientId}
        currentUser={currentUser}
        onPrescriptionCreated={(newRx) => {
          loadData();
          setShowPhoneSimulator(true); // Automatically show patient phone receiving the SMS!
        }}
      />

      {/* WhatsApp Appointment Booking Chatbot Modal */}
      <WhatsAppChatbotModal
        isOpen={showWhatsAppBot}
        onClose={() => setShowWhatsAppBot(false)}
        patients={patients}
        currentUser={currentUser}
        onAppointmentBooked={loadData}
      />

      {/* Services & Treatment Enquiry Portal Modal */}
      <ServicesEnquiryModal
        isOpen={showServicesEnquiry}
        onClose={() => setShowServicesEnquiry(false)}
        onOpenWhatsAppBooking={() => {
          setShowServicesEnquiry(false);
          setShowWhatsAppBot(true);
        }}
      />

      {/* 24/7 Automation Control Center Modal */}
      <AutomationControlCenterModal
        isOpen={showAutomationCenter}
        onClose={() => setShowAutomationCenter(false)}
        onRefreshData={loadData}
      />

      {/* Main Header with Clinic Branding & Security Controls */}
      <Header
        currentUser={currentUser}
        onUserChange={(u) => {
          setCurrentUser(u);
          StorageService.setCurrentUser(u);
        }}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        pendingSyncCount={pendingSyncCount}
        onSyncNow={handleSyncNow}
        onLockTerminal={() => {
          setIsLocked(true);
          StorageService.logAudit('TERMINAL_LOCKED', `Terminal manually locked by ${currentUser.name}`);
        }}
        maskPhi={maskPhi}
        onToggleMaskPhi={() => setMaskPhi(!maskPhi)}
        onOpenPhoneSimulator={() => setShowPhoneSimulator(true)}
        onOpenNewPrescription={() => handleOpenNewPrescription()}
        onOpenNewPatient={() => {
          setActiveTab('patients');
        }}
        onOpenWhatsAppBot={() => setShowWhatsAppBot(true)}
        onOpenServicesEnquiry={() => setShowServicesEnquiry(true)}
        onOpenAutomationCenter={() => setShowAutomationCenter(true)}
      />

      {/* Secondary Navigation Bar (CareWell Clinical Tabs) */}
      <nav className="bg-white border-b border-slate-200 sticky top-[95px] z-30 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none text-xs">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                activeTab === 'patients'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Patient Records (EHR)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'patients' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {patients.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                activeTab === 'appointments'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments & Reminders</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'appointments' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {appointments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                activeTab === 'prescriptions'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Prescriptions & SMS</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'prescriptions' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {prescriptions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('refills')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                activeTab === 'refills'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Prescription Refills</span>
              {refills.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                activeTab === 'messages'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Encrypted Messages</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'messages' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
              }`}>
                AES-256
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>HIPAA Audit & Offline</span>
            </button>

            <button
              onClick={() => setShowServicesEnquiry(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 ml-auto shadow-2xs"
              title="Explore all 6 Clinic Specialties, Doctor Fees & Inquire"
            >
              <Stethoscope className="w-4 h-4 text-sky-700" />
              <span>Services & Enquiry</span>
            </button>

          </div>
        </div>
      </nav>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            patients={patients}
            appointments={appointments}
            refills={refills}
            prescriptions={prescriptions}
            currentUser={currentUser}
            maskPhi={maskPhi}
            onNavigateTab={handleNavigateTab}
            onOpenNewPrescription={handleOpenNewPrescription}
            onOpenNewAppointment={handleOpenNewAppointment}
            onOpenWhatsAppBot={() => setShowWhatsAppBot(true)}
            onOpenServicesEnquiry={() => setShowServicesEnquiry(true)}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'patients' && (
          <PatientRecordsView
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            currentUser={currentUser}
            maskPhi={maskPhi}
            onOpenNewPrescription={handleOpenNewPrescription}
            onOpenNewAppointment={handleOpenNewAppointment}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsView
            appointments={appointments}
            patients={patients}
            currentUser={currentUser}
            maskPhi={maskPhi}
            onOpenNewPrescription={handleOpenNewPrescription}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsView
            prescriptions={prescriptions}
            currentUser={currentUser}
            maskPhi={maskPhi}
            onOpenNewPrescription={() => handleOpenNewPrescription()}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'refills' && (
          <RefillsView
            refills={refills}
            patients={patients}
            currentUser={currentUser}
            maskPhi={maskPhi}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'messages' && (
          <SecureMessagingView
            messages={messages}
            currentUser={currentUser}
            patients={patients}
            maskPhi={maskPhi}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            patients={patients}
            appointments={appointments}
            prescriptions={prescriptions}
            refills={refills}
            maskPhi={maskPhi}
          />
        )}

        {activeTab === 'audit' && (
          <HipaaAuditView
            auditLogs={auditLogs}
            currentUser={currentUser}
            isOnline={isOnline}
            onToggleOnline={handleToggleOnline}
            pendingSyncCount={pendingSyncCount}
            onSyncNow={handleSyncNow}
            maskPhi={maskPhi}
          />
        )}
      </main>

      {/* Clinical Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 mt-auto text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#004b75]">CAREWELL MULTISPECIALITY CLINIC</span>
            <span>·</span>
            <span>General Physician Practice EHR</span>
            <span>·</span>
            <span className="text-teal-700 font-mono font-medium">+91 98765 43210</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>123 Health Care Rd, Green Park, New Delhi - 110016</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">HIPAA Compliant · AES-256</span>
            <span>·</span>
            <button
              onClick={() => setShowPhoneSimulator(true)}
              className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Open Patient Mobile SMS</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Services Enquiry & WhatsApp Chatbot Persistent Floating Widget */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 sm:gap-3 no-print">
        {/* Services & Enquiry Quick Access Button */}
        <button
          onClick={() => setShowServicesEnquiry(true)}
          className="group flex items-center gap-2 bg-[#004b75] hover:bg-[#003859] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-sky-300/40"
          title="CareWell Clinic Services, Doctor Fees & Quick Enquiry"
        >
          <div className="relative">
            <Stethoscope className="w-5 h-5 text-sky-200" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-300"></span>
          </div>
          <span className="font-bold text-xs tracking-wide">
            Services & Enquiry
          </span>
          <span className="text-[10px] bg-sky-800/80 text-sky-100 px-1.5 py-0.5 rounded-full font-mono hidden md:inline">
            Fees & Doctors
          </span>
        </button>

        {/* WhatsApp Chatbot Button */}
        <button
          onClick={() => setShowWhatsAppBot(true)}
          className="group flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-emerald-300/40"
          title="Open CareWell WhatsApp Appointment Chatbot (+91 98765 43210)"
        >
          <div className="relative">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.9-0.787-3.123-2.73-3.218-2.855-.094-.125-.768-1.021-.768-1.947 0-.925.484-1.381.656-1.569.172-.188.375-.234.5-.234.125 0 .25.002.359.006.115.004.269-.044.421.323.156.375.531 1.297.578 1.391.047.094.078.203.016.328-.063.125-.094.203-.188.312-.094.109-.198.244-.282.328-.094.094-.192.197-.083.385.109.188.484.798 1.038 1.292.714.636 1.316.834 1.504.928.188.094.297.078.406-.047.109-.125.469-.547.594-.734.125-.188.25-.156.422-.094.172.063 1.094.516 1.281.609.188.094.313.141.359.219.047.078.047.453-.097.858zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.98-1.399C8.423 21.498 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-200 border-2 border-[#25D366] animate-ping"></span>
          </div>
          <span className="hidden sm:inline font-bold text-xs">
            Book on WhatsApp
          </span>
        </button>
      </div>

    </div>
  );
}
