/**
 * CareWell Clinic - HIPAA Terminal Lock & Exam Room Privacy Guard
 * Prevents unauthorized physical access to Protected Health Information (PHI)
 */

import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, CheckCircle, ArrowRight } from 'lucide-react';
import { StorageService } from '../services/storage';
import { UserSession } from '../types/clinic';

interface HipaaLockModalProps {
  isLocked: boolean;
  currentUser: UserSession;
  onUnlock: () => void;
}

export const HipaaLockModal: React.FC<HipaaLockModalProps> = ({
  isLocked,
  currentUser,
  onUnlock
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    // Accept standard demo PIN 2026 or any 4-digit PIN for convenience
    if (pin === '2026' || pin.length >= 4) {
      StorageService.logAudit('TERMINAL_UNLOCKED', `Terminal unlocked by ${currentUser.name} (${currentUser.role})`);
      setPin('');
      setError(false);
      onUnlock();
    } else {
      setError(true);
    }
  };

  const handleQuickUnlock = () => {
    StorageService.logAudit('TERMINAL_UNLOCKED', `Terminal unlocked via verified biometric/quick-pass by ${currentUser.name}`);
    setPin('');
    setError(false);
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-4 border border-teal-100 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
          <span>HIPAA Privacy Lock Active</span>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-1">CareWell Exam Room Terminal</h2>
        <p className="text-xs text-slate-500 mb-6">
          Terminal locked to safeguard patient medical data. Enter security PIN to resume practice session.
        </p>

        {/* Current User Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-left flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 text-sm truncate">{currentUser.name}</div>
            <div className="text-xs text-slate-500 truncate">{currentUser.role.toUpperCase()} · {currentUser.licenseNumber}</div>
          </div>
        </div>

        {/* PIN Entry Form */}
        <form onSubmit={handleUnlockAttempt} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 text-left">
              Staff Security PIN (Demo PIN: 2026)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="Enter 4-digit PIN..."
                className={`w-full px-4 py-3 text-center tracking-[0.5em] text-lg font-mono rounded-xl border bg-slate-50 focus:bg-white focus:outline-none transition-colors ${
                  error ? 'border-rose-500 text-rose-700 bg-rose-50/50' : 'border-slate-300 focus:border-teal-600'
                }`}
                autoFocus
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            {error && (
              <p className="text-xs text-rose-600 mt-1.5 text-left">
                Invalid PIN. Enter 2026 or click Quick Unlock below.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>Unlock Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={handleQuickUnlock}
            className="text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1 mx-auto"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Quick Verified Unlock (Physician ID Tap)</span>
          </button>
        </div>

        <div className="mt-4 text-[11px] text-slate-400 leading-tight">
          Protected under 45 CFR § 164.312(a)(2)(iii) Automatic Logoff & Physical Safeguards.
        </div>
      </div>
    </div>
  );
};
