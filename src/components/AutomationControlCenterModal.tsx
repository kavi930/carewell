/**
 * CareWell Multispeciality Clinic - Automation Control Center
 * Displays the 24/7 background automation daemon, rule toggles, and live dispatch audit logs.
 */

import React, { useState } from 'react';
import {
  Zap,
  X,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  RefreshCw,
  Bell,
  Play,
  Settings,
  Sparkles,
  Calendar,
  Pill
} from 'lucide-react';
import { AutomationEngine, AutomationRule, AutomationRunLog } from '../services/automationEngine';

interface AutomationControlCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const AutomationControlCenterModal: React.FC<AutomationControlCenterModalProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [rules, setRules] = useState<AutomationRule[]>(AutomationEngine.getRules());
  const [logs, setLogs] = useState<AutomationRunLog[]>(AutomationEngine.getLogs());
  const [isRunningCycle, setIsRunningCycle] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (id: string, current: boolean) => {
    AutomationEngine.updateRule(id, !current);
    setRules(AutomationEngine.getRules());
  };

  const handleRunCycle = async () => {
    setIsRunningCycle(true);
    await AutomationEngine.triggerImmediateBatch(() => {
      onRefreshData();
    });
    setLogs(AutomationEngine.getLogs());
    setIsRunningCycle(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Automated Reminders & Follow-up Daemon
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>ACTIVE (24/7)</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                All appointment reminders, prescription follow-ups, and refill notifications run automatically
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Active Daemon Status Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-300 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-teal-300" />
                <span>Zero-Click Background Automation</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed max-w-lg">
                The CareWell clinical engine automatically detects scheduled appointments, upcoming follow-up dates, and expiring medications to dispatch SMS notifications without requiring staff to click manual buttons.
              </p>
            </div>

            <button
              onClick={handleRunCycle}
              disabled={isRunningCycle}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningCycle ? 'animate-spin' : ''}`} />
              <span>{isRunningCycle ? 'Scanning Engine...' : 'Run Scan Cycle Now'}</span>
            </button>
          </div>

          {/* Active Rules List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-teal-600" />
              <span>Automated Rules & Dispatch Triggers</span>
            </h4>

            <div className="space-y-2.5">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex items-start justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{rule.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {rule.channel}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{rule.description}</p>
                    <p className="text-[10px] text-teal-700 font-medium">Trigger: {rule.trigger}</p>
                  </div>

                  <button
                    onClick={() => handleToggle(rule.id, rule.enabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.enabled ? 'bg-teal-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        rule.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Automated Execution Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Live Automated Dispatch Audit Trail ({logs.length} logged)</span>
              </h4>
              <span className="text-[11px] text-slate-500">Auto-refreshed by background daemon</span>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Automated engine running. Dispatches will appear here in real time.
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.patientName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-teal-700 font-semibold">{log.ruleName}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-500">{log.patientMobile}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{log.status}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono line-clamp-1 bg-white p-1.5 rounded border border-slate-100">
                      {log.messageDispatched}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Automated Clinical Delivery Engine · CareWell Telecom DLT</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
