/**
 * CareWell Multispeciality Clinic - Prescription Refill Tracker
 * Streamlines refill approvals, remaining count tracking, and automated patient SMS updates
 */

import React, { useState } from 'react';
import {
  Pill,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Phone,
  Search,
  Plus,
  AlertCircle,
  Filter,
  Check,
  User,
  ShieldAlert
} from 'lucide-react';
import { RefillRequest, Patient, UserSession } from '../types/clinic';
import { StorageService } from '../services/storage';
import { SmsService } from '../services/smsService';

interface RefillsViewProps {
  refills: RefillRequest[];
  patients: Patient[];
  currentUser: UserSession;
  maskPhi: boolean;
  onRefreshData: () => void;
}

export const RefillsView: React.FC<RefillsViewProps> = ({
  refills,
  patients,
  currentUser,
  maskPhi,
  onRefreshData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'approved' | 'rejected'>('ALL');
  const [showNewRefillModal, setShowNewRefillModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // New Refill Form
  const [newRefill, setNewRefill] = useState({
    patientId: patients[0]?.id || '',
    medicineName: 'Metformin SR 500mg',
    dosage: '500 mg (1-0-1)',
    notes: 'Patient requesting 1 month renewal'
  });

  const formatName = (name: string) => {
    if (!maskPhi) return name;
    return name.split(' ').map(p => p[0] + '****').join(' ');
  };

  const formatPhone = (phone: string) => {
    if (!maskPhi) return phone;
    return phone.substring(0, 6) + '*****' + phone.substring(phone.length - 2);
  };

  const filtered = refills.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      r.patientName.toLowerCase().includes(q) ||
      r.medicineName.toLowerCase().includes(q) ||
      r.patientMobile.includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  const handleApprove = async (refill: RefillRequest) => {
    setActionLoadingId(refill.id);
    refill.status = 'approved';
    refill.lastUpdated = new Date().toISOString();
    refill.physicianNotes = `Approved by ${currentUser.name} on ${new Date().toLocaleDateString()}`;
    if (refill.refillsRemaining > 0) {
      refill.refillsRemaining -= 1;
    }
    StorageService.updateRefill(refill);
    StorageService.logAudit(
      'REFILL_REQUEST_APPROVED',
      `Approved refill of ${refill.medicineName} for ${refill.patientName} (${refill.patientMobile})`,
      refill.patientId
    );

    // Send automatic SMS alert
    const text = SmsService.generateRefillAlertText(refill);
    await SmsService.dispatchSms({
      mobileNumber: refill.patientMobile,
      patientName: refill.patientName,
      messageType: 'REFILL_ALERT',
      text
    });

    setActionLoadingId(null);
    onRefreshData();
  };

  const handleReject = async (refill: RefillRequest) => {
    setActionLoadingId(refill.id);
    refill.status = 'rejected';
    refill.lastUpdated = new Date().toISOString();
    refill.physicianNotes = `In-person follow-up required before further refill by ${currentUser.name}`;
    StorageService.updateRefill(refill);
    StorageService.logAudit(
      'REFILL_REQUEST_REJECTED',
      `Refill rejected - in-person visit required for ${refill.medicineName} for ${refill.patientName}`,
      refill.patientId
    );

    // Send automatic SMS alert informing patient to book in-person consultation
    const text = SmsService.generateRefillAlertText(refill);
    await SmsService.dispatchSms({
      mobileNumber: refill.patientMobile,
      patientName: refill.patientName,
      messageType: 'REFILL_ALERT',
      text
    });

    setActionLoadingId(null);
    onRefreshData();
  };

  const handleCreateRefill = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === newRefill.patientId);
    if (!patient) return;

    const created: RefillRequest = {
      id: `ref-${Date.now()}`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMobile: patient.mobileNumber,
      medicineName: newRefill.medicineName,
      dosage: newRefill.dosage,
      prescribedDate: new Date().toISOString().split('T')[0],
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      refillsRemaining: 2,
      physicianNotes: newRefill.notes,
      lastUpdated: new Date().toISOString()
    };

    StorageService.updateRefill(created);
    StorageService.logAudit(
      'REFILL_REQUEST_APPROVED',
      `Logged refill request for ${created.medicineName} for ${created.patientName}`,
      created.patientId
    );

    onRefreshData();
    setShowNewRefillModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search refills by Patient Name, Medicine, or Registered Mobile..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              All ({refills.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Pending ({refills.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'approved' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Approved
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowNewRefillModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Refill Request</span>
        </button>
      </div>

      {/* Refills Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Prescription Refill Review Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500">
              Approving a refill automatically triggers notification SMS to the registered patient mobile
            </p>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            {refills.filter(r => r.status === 'pending').length} Actions Required
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient & Registered Mobile</th>
                <th className="py-3 px-4">Requested Medication & Dosage</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Refills Left</th>
                <th className="py-3 px-4">Physician Notes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No prescription refill requests found matching the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map(refill => (
                  <tr key={refill.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatName(refill.patientName)}
                      </div>
                      <div className="font-mono text-teal-700 flex items-center gap-1 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-teal-600" />
                        <span>{formatPhone(refill.patientMobile)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-sm text-teal-900">
                        {refill.medicineName}
                      </div>
                      <div className="text-slate-500 text-xs">{refill.dosage}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {refill.requestedDate}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 font-mono">
                        {refill.refillsRemaining} remaining
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      {refill.physicianNotes || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        refill.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : refill.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {refill.status === 'approved' && <Check className="w-3 h-3" />}
                        {refill.status === 'pending' && <Clock className="w-3 h-3" />}
                        {refill.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {refill.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(refill)}
                            disabled={actionLoadingId === refill.id}
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                            title="Approve refill and send automated SMS notification"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve & SMS</span>
                          </button>
                          <button
                            onClick={() => handleReject(refill)}
                            disabled={actionLoadingId === refill.id}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                            title="Require in-person consultation"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Require Visit</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Processed {new Date(refill.lastUpdated).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Refill Request Modal */}
      {showNewRefillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">New Prescription Refill Request</h3>
              <button
                onClick={() => setShowNewRefillModal(false)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRefill} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  value={newRefill.patientId}
                  onChange={e => setNewRefill({ ...newRefill, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} · Mobile: {p.mobileNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medication Name *</label>
                <input
                  type="text"
                  required
                  value={newRefill.medicineName}
                  onChange={e => setNewRefill({ ...newRefill, medicineName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dosage & Frequency</label>
                <input
                  type="text"
                  value={newRefill.dosage}
                  onChange={e => setNewRefill({ ...newRefill, dosage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Notes</label>
                <input
                  type="text"
                  value={newRefill.notes}
                  onChange={e => setNewRefill({ ...newRefill, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRefillModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Create Refill Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
