/**
 * CareWell Multispeciality Clinic - Header Component
 * Matches clinic brand visual identity, offline sync controls, and role switcher
 */

import React, { useState } from 'react';
import {
  Activity,
  Phone,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ChevronDown,
  Smartphone,
  Plus,
  ShieldCheck,
  Zap,
  Stethoscope
} from 'lucide-react';
import { UserSession } from '../types/clinic';
import { DEFAULT_USERS, StorageService } from '../services/storage';

interface HeaderProps {
  currentUser: UserSession;
  onUserChange: (user: UserSession) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingSyncCount: number;
  onSyncNow: () => void;
  onLockTerminal: () => void;
  maskPhi: boolean;
  onToggleMaskPhi: () => void;
  onOpenPhoneSimulator: () => void;
  onOpenNewPrescription: () => void;
  onOpenNewPatient: () => void;
  onOpenWhatsAppBot?: () => void;
  onOpenServicesEnquiry?: () => void;
  onOpenAutomationCenter?: () => void;
  unreadSmsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  isOnline,
  onToggleOnline,
  pendingSyncCount,
  onSyncNow,
  onLockTerminal,
  maskPhi,
  onToggleMaskPhi,
  onOpenPhoneSimulator,
  onOpenNewPrescription,
  onOpenNewPatient,
  onOpenWhatsAppBot,
  onOpenServicesEnquiry,
  onOpenAutomationCenter,
  unreadSmsCount = 0
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSyncNow();
      setIsSyncing(false);
    }, 600);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Clinical Strip: Contact, Hours, Specialties */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-medium">+91 98765 43210</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 hidden sm:inline">Appointments & Automated SMS Gateway</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>123, Health Care Road, Green Park, New Delhi - 110016</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Mon - Sat: 9:00 AM - 8:00 PM · Sun: 9:00 AM - 2:00 PM</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium text-[11px]">HIPAA Compliant · AES-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar: CareWell Logo, Quick Actions, Offline & Security Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Clinic Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#004b75] to-[#0ea5e9] text-white flex items-center justify-center shadow-md relative group">
              <Activity className="w-6 h-6 text-white" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-[#004b75] flex items-center gap-1.5">
                  CAREWELL
                  <span className="text-xs font-bold uppercase tracking-widest text-teal-600 px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200">
                    Multispeciality Clinic
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                YOUR HEALTH OUR PRIORITY · GENERAL MEDICINE & EHR
              </p>
            </div>
          </div>

          {/* Action Center: Offline status, Lock, Phone simulator, User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            
            {/* Quick Action Buttons */}
            <button
              onClick={onOpenNewPatient}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>New Patient</span>
            </button>

            <button
              onClick={onOpenNewPrescription}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Prescribe & SMS</span>
            </button>

            {/* Services Enquiry Option */}
            {onOpenServicesEnquiry && (
              <button
                onClick={onOpenServicesEnquiry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold shadow-xs transition-colors"
                title="Explore CareWell Clinical Services, Doctors, Fees & Inquire"
              >
                <Stethoscope className="w-3.5 h-3.5 text-sky-700" />
                <span>Services Enquiry</span>
              </button>
            )}

            {/* WhatsApp Booking Chatbot Button */}
            {onOpenWhatsAppBot && (
              <button
                onClick={onOpenWhatsAppBot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                title="Open WhatsApp Booking Chatbot (+91 98765 43210)"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.9-0.787-3.123-2.73-3.218-2.855-.094-.125-.768-1.021-.768-1.947 0-.925.484-1.381.656-1.569.172-.188.375-.234.5-.234.125 0 .25.002.359.006.115.004.269-.044.421.323.156.375.531 1.297.578 1.391.047.094.078.203.016.328-.063.125-.094.203-.188.312-.094.109-.198.244-.282.328-.094.094-.192.197-.083.385.109.188.484.798 1.038 1.292.714.636 1.316.834 1.504.928.188.094.297.078.406-.047.109-.125.469-.547.594-.734.125-.188.25-.156.422-.094.172.063 1.094.516 1.281.609.188.094.313.141.359.219.047.078.047.453-.097.858zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.98-1.399C8.423 21.498 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                <span>WhatsApp Bot</span>
              </button>
            )}

            {/* Automated Reminders 24/7 Active Engine Indicator */}
            {onOpenAutomationCenter && (
              <button
                onClick={onOpenAutomationCenter}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors"
                title="View 24/7 Automated Reminders & Follow-up Daemon"
              >
                <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                <span>Auto-Reminders Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </button>
            )}

            {/* Live Phone SMS Simulator Button */}
            <button
              onClick={onOpenPhoneSimulator}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title="Open Live Patient SMS Simulator"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Patient SMS Phone</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            {/* Offline Status & Sync Badge */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
              <button
                onClick={onToggleOnline}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isOnline
                    ? 'text-emerald-700 hover:bg-emerald-50'
                    : 'bg-amber-100 text-amber-900 font-semibold'
                }`}
                title={isOnline ? 'Online - Click to test offline mode' : 'Offline Mode Active - Click to reconnect'}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden xl:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                    <span>Offline</span>
                  </>
                )}
              </button>

              {pendingSyncCount > 0 && (
                <button
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors ml-0.5"
                  title="Synchronize offline local queue with central server"
                >
                  <RefreshCw className={`w-3 h-3 text-teal-700 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync ({pendingSyncCount})</span>
                </button>
              )}
            </div>

            {/* HIPAA PHI Masking Toggle */}
            <button
              onClick={onToggleMaskPhi}
              className={`p-2 rounded-lg border text-xs transition-colors ${
                maskPhi
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={maskPhi ? 'PHI is Masked (Safe Mode)' : 'Mask PHI for Public Demo'}
            >
              {maskPhi ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* HIPAA Exam Room Lock Button */}
            <button
              onClick={onLockTerminal}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs transition-colors"
              title="Lock Exam Room Terminal (HIPAA)"
            >
              <Lock className="w-4 h-4 text-slate-600" />
            </button>

            {/* Role & User Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors"
              >
                <div className={`w-6 h-6 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-[10px]`}>
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-semibold text-slate-900 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">Switch Clinical User Role</p>
                    <p className="text-[11px] text-slate-500">Test role-based access control (RBAC)</p>
                  </div>
                  <div className="py-1">
                    {DEFAULT_USERS.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onUserChange(u);
                          setShowUserDropdown(false);
                          StorageService.logAudit('TERMINAL_UNLOCKED', `Switched session to ${u.name} (${u.role})`);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                          currentUser.id === u.id ? 'bg-teal-50/60 font-semibold text-teal-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full ${u.avatarColor} text-white flex items-center justify-center text-[10px]`}>
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </span>
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[10px] text-slate-400">{u.licenseNumber}</div>
                          </div>
                        </div>
                        {currentUser.id === u.id && <UserCheck className="w-3.5 h-3.5 text-teal-700" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
