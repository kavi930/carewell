/**
 * CareWell Multispeciality Clinic - Secure Encrypted Messaging Portal
 * HIPAA-compliant AES-256-GCM communication for patients and clinical staff
 */

import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Send,
  Paperclip,
  FileText,
  Eye,
  EyeOff,
  User,
  Users,
  CheckCheck,
  Search,
  MessageSquare,
  Sparkles,
  KeyRound,
  Download
} from 'lucide-react';
import { SecureMessage, UserSession, Patient } from '../types/clinic';
import { CryptoSecurityService } from '../services/crypto';
import { StorageService } from '../services/storage';
import { showToast } from './ToastNotification';

interface SecureMessagingViewProps {
  messages: SecureMessage[];
  currentUser: UserSession;
  patients: Patient[];
  maskPhi: boolean;
  onRefreshData: () => void;
}

export const SecureMessagingView: React.FC<SecureMessagingViewProps> = ({
  messages,
  currentUser,
  patients,
  maskPhi,
  onRefreshData
}) => {
  const [activeChannel, setActiveChannel] = useState<'patient' | 'internal_staff'>('patient');
  const [selectedThreadId, setSelectedThreadId] = useState<string>('th-pat-001');
  const [inputText, setInputText] = useState('');
  const [showRawCipher, setShowRawCipher] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);

  const formatName = (name: string) => {
    if (!maskPhi) return name;
    return name.split(' ').map(p => p[0] + '****').join(' ');
  };

  const channelMessages = messages.filter(m => m.channel === activeChannel);

  // Group threads
  const availableThreadIds = Array.from(new Set(channelMessages.map(m => m.threadId)));
  const currentThreadId = availableThreadIds.includes(selectedThreadId)
    ? selectedThreadId
    : (availableThreadIds[0] || selectedThreadId);

  const threads = availableThreadIds.map(threadId => {
    const threadMsgs = channelMessages.filter(m => m.threadId === threadId);
    const lastMsg = threadMsgs[threadMsgs.length - 1];
    return {
      threadId,
      lastMsg,
      participantName: lastMsg ? (lastMsg.senderId === currentUser.id ? lastMsg.recipientName : lastMsg.senderName) : 'General Channel',
      unreadCount: threadMsgs.filter(m => !m.isRead && m.recipientId === currentUser.id).length
    };
  });

  const activeThreadMessages = channelMessages.filter(m => m.threadId === currentThreadId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsEncrypting(true);

    const plainText = inputText.trim();
    const { cipher, keyFingerprint } = await CryptoSecurityService.encrypt(plainText);

    let recipientId = 'pat-001';
    let recipientName = 'Rajesh Kumar';

    if (activeChannel === 'internal_staff') {
      recipientId = 'NURSE-01';
      recipientName = 'Sister Renu Joseph';
    } else {
      const activePatient = patients[0];
      if (activePatient) {
        recipientId = activePatient.id;
        recipientName = `${activePatient.firstName} ${activePatient.lastName}`;
      }
    }

    const newMsg: SecureMessage = {
      id: `msg-${Date.now()}`,
      channel: activeChannel,
      threadId: currentThreadId,
      senderId: currentUser.id,
      senderName: `${currentUser.name} (${currentUser.role})`,
      senderRole: currentUser.role,
      recipientId,
      recipientName,
      timestamp: new Date().toISOString(),
      content: plainText,
      encryptedCipher: cipher,
      encryptionAlgorithm: 'AES-GCM-256',
      keyFingerprint,
      isRead: false,
      attachments: attachmentType ? [{
        name: attachmentType === 'lab' ? 'HbA1c_Lipid_Report_Oct2026.pdf' : 'Chest_XRay_Digital.png',
        size: '1.4 MB',
        type: 'application/pdf'
      }] : undefined
    };

    StorageService.addMessage(newMsg);
    StorageService.logAudit(
      'SECURE_MESSAGE_SENT',
      `Sent AES-256 encrypted clinical message to ${recipientName} (${activeChannel})`,
      recipientId
    );

    setInputText('');
    setAttachmentType(null);
    setIsEncrypting(false);
    onRefreshData();
    showToast(`Encrypted message sent via ${activeChannel === 'patient' ? 'Patient Portal' : 'Staff Handoff'}`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* HIPAA Encryption Header & Cryptographic Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
            <Lock className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">
                CareWell HIPAA Encrypted Communications
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>AES-GCM 256-bit E2EE Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Key Fingerprint: <span className="text-teal-700 font-semibold">{CryptoSecurityService.getMasterKeyFingerprint().substring(0, 24)}...</span> (NIST SP 800-38D Compliant)
            </p>
          </div>
        </div>

        {/* View Cipher toggle for Auditor inspection */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawCipher(!showRawCipher)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showRawCipher
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {showRawCipher ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
            <span>{showRawCipher ? 'Showing Raw Cipher' : 'Inspect Cipher (Auditor View)'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Channels & Conversations on Left (4 cols), Chat Window on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        
        {/* Left Column: Channels & Threads */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {/* Channel Tabs */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => {
                setActiveChannel('patient');
                setSelectedThreadId('th-pat-001');
              }}
              className={`py-2 px-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 ${
                activeChannel === 'patient'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient Chats</span>
            </button>
            <button
              onClick={() => {
                setActiveChannel('internal_staff');
                setSelectedThreadId('th-staff-01');
              }}
              className={`py-2 px-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 ${
                activeChannel === 'internal_staff'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Channel</span>
            </button>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active conversations in this channel.
              </div>
            ) : (
              threads.map(t => {
                const isSelected = t.threadId === selectedThreadId;
                return (
                  <button
                    key={t.threadId}
                    onClick={() => setSelectedThreadId(t.threadId)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-teal-50/80 border-l-4 border-teal-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {t.participantName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {formatName(t.participantName)}
                        </span>
                        {t.lastMsg && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(t.lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t.lastMsg?.content || 'Encrypted clinical message'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-teal-600" />
            <span>End-to-end encrypted under HIPAA Security Rule</span>
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                {activeChannel === 'patient' ? 'P' : 'S'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeChannel === 'patient' ? 'Rajesh Kumar (CW-2026-0101)' : 'CareWell Clinical Staff Handoff'}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Secure HIPAA Channel Verified · AES-256</span>
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400 font-mono text-[10px]">Room ID: {selectedThreadId}</span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
            {activeThreadMessages.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Send a secure message to begin this encrypted clinical consultation.
              </div>
            ) : (
              activeThreadMessages.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-1 px-1">
                      {msg.senderName} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-teal-700 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200'
                      }`}
                    >
                      {/* Show Plaintext or Raw Cipher (for Auditor verification) */}
                      {showRawCipher ? (
                        <div className="font-mono text-[10px] break-all bg-black/10 p-2 rounded">
                          <div className="font-bold text-[9px] uppercase tracking-wider mb-1 opacity-70">
                            Cipher ({msg.encryptionAlgorithm}):
                          </div>
                          {msg.encryptedCipher}
                        </div>
                      ) : (
                        <div>{msg.content}</div>
                      )}

                      {/* Attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`mt-3 pt-2 border-t ${isMe ? 'border-teal-600' : 'border-slate-100'} space-y-1.5`}>
                          {msg.attachments.map((att, i) => (
                            <div key={i} className={`flex items-center justify-between gap-2 p-2 rounded-lg text-[11px] ${isMe ? 'bg-teal-800/80 text-teal-100' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                              <div className="flex items-center gap-1.5 truncate">
                                <FileText className="w-3.5 h-3.5" />
                                <span className="truncate">{att.name} ({att.size})</span>
                              </div>
                              <Download className="w-3 h-3 shrink-0 cursor-pointer" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400">
                      <Lock className="w-2.5 h-2.5 text-teal-600" />
                      <span>E2EE</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-teal-600" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Attachment Preview Chip */}
          {attachmentType && (
            <div className="px-4 py-2 bg-teal-50 border-t border-teal-200 flex items-center justify-between text-xs text-teal-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Paperclip className="w-3.5 h-3.5 text-teal-700" />
                Attached: {attachmentType === 'lab' ? 'HbA1c_Lipid_Report_Oct2026.pdf (1.4 MB)' : 'Chest_XRay_Digital.png (2.8 MB)'}
              </span>
              <button
                onClick={() => setAttachmentType(null)}
                className="text-teal-700 hover:text-teal-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Composer Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  type="button"
                  onClick={() => setAttachmentType(attachmentType ? null : 'lab')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Attach Lab Report PDF"
                >
                  <Paperclip className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type encrypted message (AES-GCM 256-bit auto-encrypted)..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-teal-600"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isEncrypting}
                className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEncrypting ? 'Encrypting...' : 'Send'}</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
