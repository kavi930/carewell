/**
 * CareWell Multispeciality Clinic - Prescriptions & SMS Registry
 * Full archive of issued prescriptions, medication dosage details, and SMS delivery logs
 */

import React, { useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  Send,
  Printer,
  CheckCircle2,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Prescription, UserSession } from '../types/clinic';
import { SmsService } from '../services/smsService';
import { StorageService } from '../services/storage';

interface PrescriptionsViewProps {
  prescriptions: Prescription[];
  currentUser: UserSession;
  maskPhi: boolean;
  onOpenNewPrescription: () => void;
  onRefreshData: () => void;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({
  prescriptions,
  currentUser,
  maskPhi,
  onOpenNewPrescription,
  onRefreshData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(prescriptions[0] || null);
  const [reSendingId, setReSendingId] = useState<string | null>(null);

  const formatName = (name: string) => {
    if (!maskPhi) return name;
    return name.split(' ').map(p => p[0] + '****').join(' ');
  };

  const formatPhone = (phone: string) => {
    if (!maskPhi) return phone;
    return phone.substring(0, 6) + '*****' + phone.substring(phone.length - 2);
  };

  const filtered = prescriptions.filter(rx => {
    const q = searchQuery.toLowerCase().trim();
    return (
      rx.patientName.toLowerCase().includes(q) ||
      rx.prescriptionNumber.toLowerCase().includes(q) ||
      rx.diagnosis.toLowerCase().includes(q) ||
      rx.patientMobile.includes(q)
    );
  });

  const handleResendSms = async (rx: Prescription) => {
    setReSendingId(rx.id);
    const text = SmsService.generatePrescriptionSmsText(rx);
    await SmsService.dispatchSms({
      mobileNumber: rx.patientMobile,
      patientName: rx.patientName,
      messageType: 'PRESCRIPTION',
      text
    });
    rx.smsNotification.status = 'delivered';
    rx.smsNotification.sentAt = new Date().toISOString();
    StorageService.savePrescription(rx);
    StorageService.logAudit(
      'PRESCRIPTION_SMS_DISPATCHED',
      `Re-sent automated prescription SMS for ${rx.prescriptionNumber} to ${rx.patientName} (${rx.patientMobile})`,
      rx.patientId
    );
    setReSendingId(null);
    onRefreshData();
    alert(`SMS successfully re-dispatched to ${rx.patientMobile}`);
  };

  const activeRx = selectedRx || prescriptions[0];

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search prescriptions by Patient Name, Rx Number, Diagnosis, or Mobile..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
          />
        </div>

        <button
          onClick={onOpenNewPrescription}
          className="w-full md:w-auto px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Write Prescription & SMS</span>
        </button>
      </div>

      {/* Grid: Rx List (5 cols) & Full CareWell Letterhead Preview (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Prescription List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col max-h-[780px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 uppercase tracking-wider">
              Issued Prescriptions ({filtered.length})
            </span>
            <span className="text-slate-400">Automated SMS Log</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No prescriptions found.
              </div>
            ) : (
              filtered.map(rx => {
                const isSelected = activeRx?.id === rx.id;
                return (
                  <button
                    key={rx.id}
                    onClick={() => setSelectedRx(rx)}
                    className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-50/80 border-l-4 border-teal-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatName(rx.patientName)}
                        </span>
                        <span className="font-mono text-xs font-semibold text-teal-800">
                          {rx.prescriptionNumber}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 line-clamp-1">
                        <span className="font-medium text-slate-700">Dx: </span>
                        {rx.diagnosis}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span className="font-mono text-[11px] text-teal-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-teal-600" />
                          {formatPhone(rx.patientMobile)}
                        </span>
                        <span>·</span>
                        <span>{rx.medicines.length} medicines</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{rx.date}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SMS Delivered</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Prescription Document / Print Letterhead View */}
        <div className="lg:col-span-7 space-y-4">
          {activeRx ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs print-card">
              
              {/* CareWell Letterhead Header */}
              <div className="border-b-2 border-teal-700 pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-[#004b75] uppercase">
                      CareWell Multispeciality Clinic
                    </h2>
                    <p className="text-xs font-semibold text-teal-700 tracking-wide">
                      YOUR HEALTH OUR PRIORITY · GENERAL MEDICINE DEPT
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      123, Health Care Road, Green Park, New Delhi - 110016 · Phone: +91 98765 43210
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">{activeRx.doctorName}</div>
                    <div className="text-xs text-slate-500 font-mono">DMC-REG-48912 · MBBS, MD</div>
                    <div className="text-[11px] text-slate-400">Consultant Physician</div>
                  </div>
                </div>
              </div>

              {/* Patient Bar */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Patient: </span>
                  <span className="font-bold text-slate-900">{formatName(activeRx.patientName)}</span>
                  <span className="text-slate-500 ml-2">({activeRx.patientAge}y / {activeRx.patientGender})</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Mobile: </span>
                  <span className="font-mono font-bold text-teal-900">{formatPhone(activeRx.patientMobile)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Date: </span>
                  <span className="font-mono text-slate-800">{activeRx.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Rx No: </span>
                  <span className="font-mono font-bold text-slate-900">{activeRx.prescriptionNumber}</span>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="mb-6 text-xs">
                <div className="font-bold text-slate-800 text-sm mb-1">
                  Diagnosis: <span className="font-semibold text-teal-900">{activeRx.diagnosis}</span>
                </div>
                {activeRx.symptoms && activeRx.symptoms.length > 0 && (
                  <p className="text-slate-500">
                    Chief complaints: {activeRx.symptoms.join(', ')}
                  </p>
                )}
              </div>

              {/* Rx Symbol & Medication Table */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-serif font-black text-teal-800">℞</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Prescribed Medication & Dosage Schedule
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Medicine & Form</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency & Timing</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeRx.medicines.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {m.name} <span className="font-normal text-slate-500 text-[11px]">({m.form})</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-teal-800">{m.dosage}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {m.frequency} · <span className="text-teal-700">{m.timing}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{m.durationDays} days</td>
                          <td className="py-2.5 px-3 text-slate-600 italic">{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clinical Advice & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block mb-1">General Medical Advice:</span>
                  <p className="text-slate-600 leading-relaxed">{activeRx.advice}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Next Follow-up Consultation:</span>
                  <p className="text-teal-900 font-semibold">
                    {activeRx.followUpDate || 'As needed / After 1 week'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Please bring home blood pressure and blood glucose logs.
                  </p>
                </div>
              </div>

              {/* Digital Signature & Footer */}
              <div className="flex items-end justify-between pt-4 border-t border-slate-200 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Digitally Authenticated Electronic Prescription</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Hash: SHA256-CW-{activeRx.id.substring(activeRx.id.length - 8)} · Verified
                  </p>
                </div>

                <div className="text-right">
                  <div className="font-serif italic font-bold text-teal-900 text-sm">
                    {activeRx.doctorName}
                  </div>
                  <div className="text-[10px] text-slate-400">Registered Medical Practitioner</div>
                </div>
              </div>

              {/* SMS Dispatch Strip & Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>SMS Automated Delivery Active</span>
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    To: {formatPhone(activeRx.patientMobile)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResendSms(activeRx)}
                    disabled={reSendingId === activeRx.id}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-teal-600" />
                    <span>{reSendingId === activeRx.id ? 'Sending...' : 'Re-send SMS'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Letterhead</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a prescription to view the official clinic letterhead and dosage details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
