/**
 * CareWell Clinic - Live Mobile Phone SMS Simulator
 * Shows real-time interactive preview of SMS notifications received on patient's device
 */

import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, X, CheckCheck, Bell, Shield, Send, Sparkles } from 'lucide-react';
import { SmsLogRecord, SmsService } from '../services/smsService';

interface PhoneSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: SmsLogRecord | null;
}

export const PhoneSimulatorModal: React.FC<PhoneSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialMessage
}) => {
  const [messages, setMessages] = useState<SmsLogRecord[]>([]);
  const [selectedMobile, setSelectedMobile] = useState<string>('+91 98101 23456');
  const [replyText, setReplyText] = useState('');
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestNotification, setLatestNotification] = useState<SmsLogRecord | null>(null);

  const loadMessages = () => {
    const logs = SmsService.getSmsLogs();
    setMessages(logs);
  };

  useEffect(() => {
    loadMessages();

    // Listen to custom event dispatched by SmsService
    const handleSmsEvent = (e: CustomEvent<SmsLogRecord>) => {
      const newMsg = e.detail;
      setMessages(prev => [newMsg, ...prev.filter(m => m.id !== newMsg.id)]);
      setLatestNotification(newMsg);
      setSelectedMobile(newMsg.recipientMobile);
      setShowNotificationPopup(true);

      // Play subtle chime safely
      try {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioClass) {
          const audioCtx = new AudioClass();
          if (audioCtx.state === 'running') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
            setTimeout(() => {
              audioCtx.close().catch(() => {});
            }, 500);
          } else {
            audioCtx.close().catch(() => {});
          }
        }
      } catch {
        // audio context optional in sandbox environments
      }

      setTimeout(() => {
        setShowNotificationPopup(false);
      }, 5000);
    };

    window.addEventListener('carewell-sms-received' as unknown as keyof WindowEventMap, handleSmsEvent as EventListener);
    return () => {
      window.removeEventListener('carewell-sms-received' as unknown as keyof WindowEventMap, handleSmsEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (initialMessage) {
      setSelectedMobile(initialMessage.recipientMobile);
    }
  }, [initialMessage]);

  if (!isOpen) return null;

  // Filter messages for current mobile
  const activeChat = messages.filter(m => m.recipientMobile === selectedMobile);
  const uniqueMobiles = Array.from(new Set(messages.map(m => m.recipientMobile)));
  if (!uniqueMobiles.includes('+91 98101 23456')) {
    uniqueMobiles.unshift('+91 98101 23456');
  }

  const handleSimulatePatientReply = () => {
    if (!replyText.trim()) return;
    const patientMsg: SmsLogRecord = {
      id: `SMS-PAT-${Date.now()}`,
      recipientMobile: selectedMobile,
      recipientName: 'Patient (You)',
      messageType: 'FOLLOWUP_ALERT',
      text: replyText.trim(),
      status: 'Delivered',
      dispatchedAt: new Date().toISOString(),
      gatewayMessageId: 'CW-PAT-INBOUND',
      carrier: 'Patient Mobile Inbound'
    };
    setMessages(prev => [patientMsg, ...prev]);
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Device Selection & SMS Gateway Info */}
        <div className="w-full md:w-1/2 p-6 bg-slate-50 border-r border-slate-200 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Patient SMS Simulator</h3>
                  <p className="text-xs text-slate-500">Live preview of automated prescription & reminder texts</p>
                </div>
              </div>
            </div>

            {/* Carrier & Gateway Info */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl mb-5 text-xs text-teal-900">
              <div className="flex items-center gap-1.5 font-semibold text-teal-800 mb-1">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>CareWell DLT-Registered Telecom Gateway</span>
              </div>
              <p className="text-teal-700 leading-relaxed">
                SMS sender header: <span className="font-mono font-medium text-teal-950">VK-CWCLINIC</span>.
                Patients receive immediate delivery with medicine dosage, frequency, and emergency contact details.
              </p>
            </div>

            {/* Select Recipient Mobile */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Patient Phone Number
              </label>
              <div className="space-y-1.5">
                {uniqueMobiles.map(mob => {
                  const patientMsg = messages.find(m => m.recipientMobile === mob);
                  const isCurrent = mob === selectedMobile;
                  return (
                    <button
                      key={mob}
                      onClick={() => setSelectedMobile(mob)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-sm transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium font-mono text-xs">{mob}</div>
                        <div className={`text-xs ${isCurrent ? 'text-teal-100' : 'text-slate-500'}`}>
                          {patientMsg?.recipientName || 'Registered Patient'}
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded ${isCurrent ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {messages.filter(m => m.recipientMobile === mob).length} SMS
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dispatch Manual Test SMS */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
              <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Automated Trigger Triggers:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Creating a Prescription automatically dispatches dosage instructions.</li>
                <li>Booking or confirming an appointment dispatches date/time reminders.</li>
                <li>Approving a medication refill sends instant pickup alert.</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>DLT Template ID: 170716982001</span>
            <span className="text-emerald-700 font-medium">Gateway: Active (24x7)</span>
          </div>
        </div>

        {/* Right Side: High Fidelity Mobile Screen Mockup */}
        <div className="w-full md:w-1/2 p-6 bg-slate-900 flex flex-col items-center justify-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Close Simulator"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Smartphone Frame */}
          <div className="w-[320px] h-[580px] bg-slate-950 rounded-[40px] border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-slate-800">
            {/* Top Speaker / Dynamic Island */}
            <div className="h-6 bg-slate-950 flex items-center justify-center pt-1 shrink-0 z-20">
              <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-800 mr-2"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-950"></div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="px-6 py-1 flex items-center justify-between text-[11px] text-slate-300 font-medium select-none shrink-0 bg-slate-900/60 backdrop-blur-md">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <span className="w-4 h-2 border border-slate-300 rounded-sm inline-block relative after:absolute after:left-0 after:top-0 after:h-full after:w-3/4 after:bg-slate-300"></span>
              </div>
            </div>

            {/* Notification Banner Overlay */}
            {showNotificationPopup && latestNotification && (
              <div className="absolute top-8 left-3 right-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-teal-200 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    CW
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900">CareWell Clinic</span>
                      <span className="text-[10px] text-slate-600">now</span>
                    </div>
                    <p className="text-[11px] text-slate-700 truncate leading-tight">
                      {latestNotification.text.split('\n')[0]}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SMS Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                  CW
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>CAREWELL CLINIC</span>
                    <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-[10px] text-teal-400 font-mono">+91 98765 43210 (Verified)</div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">SMS</span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950 text-xs">
              <div className="text-center my-1">
                <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-full">
                  Today · High Priority Healthcare SMS
                </span>
              </div>

              {activeChat.length === 0 ? (
                <div className="text-center text-slate-500 pt-16 px-4">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs text-slate-400 font-medium">No messages yet for this number.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Prescriptions & appointment reminders will appear here automatically.</p>
                </div>
              ) : (
                [...activeChat].reverse().map(msg => {
                  const isPatientReply = msg.gatewayMessageId === 'CW-PAT-INBOUND';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isPatientReply ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed whitespace-pre-line shadow-md ${
                          isPatientReply
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/80'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1 text-[9px] text-slate-500">
                        <span>{new Date(msg.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!isPatientReply && (
                          <>
                            <span>·</span>
                            <span className="text-teal-400">{msg.status}</span>
                            <CheckCheck className="w-2.5 h-2.5 text-teal-400" />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom SMS Input Box (Simulate Patient Replying) */}
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 shrink-0">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSimulatePatientReply();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Simulate patient reply..."
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-500 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="text-[9px] text-center text-slate-600 mt-1">
                DLT Compliant 160-char SMS Channel
              </div>
            </div>

            {/* Bottom Home Indicator */}
            <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
              <div className="w-28 h-1 bg-slate-600 rounded-full"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
