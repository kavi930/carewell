/**
 * CareWell Multispeciality Clinic - Prescription Composer & Automated SMS Dispatcher
 * Automatically formats and dispatches medications, dosages, and instructions to registered mobile numbers
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Send,
  Pill,
  AlertTriangle,
  Printer,
  Calendar,
  CheckCircle,
  Phone,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Patient, Prescription, PrescriptionMedicine, UserSession } from '../types/clinic';
import { StorageService } from '../services/storage';
import { SmsService } from '../services/smsService';
import { showToast } from './ToastNotification';

interface PrescriptionComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  preselectedPatientId?: string;
  currentUser: UserSession;
  onPrescriptionCreated: (rx: Prescription) => void;
}

const COMMON_DRUGS = [
  { name: 'Telmisartan', dosage: '40 mg', form: 'Tablet', frequency: '1-0-0 (Morning)', timing: 'Before Food', durationDays: 30, instructions: 'Take with warm water' },
  { name: 'Metformin Sustained Release', dosage: '500 mg', form: 'Tablet', frequency: '1-0-1 (Morning & Night)', timing: 'After Food', durationDays: 30, instructions: 'Take immediately after food' },
  { name: 'Paracetamol', dosage: '650 mg', form: 'Tablet', frequency: '1-1-1 (Thrice daily)', timing: 'After Food', durationDays: 5, instructions: 'For fever or body pain; SOS' },
  { name: 'Pantoprazole', dosage: '40 mg', form: 'Tablet', frequency: '1-0-0 (Morning)', timing: 'Before Food', durationDays: 14, instructions: 'Take 30 mins before breakfast' },
  { name: 'Amoxicillin + Potassium Clavulanate', dosage: '625 mg', form: 'Tablet', frequency: '1-0-1 (Morning & Night)', timing: 'After Food', durationDays: 7, instructions: 'Complete full 7-day course' },
  { name: 'Atorvastatin', dosage: '20 mg', form: 'Tablet', frequency: '0-0-1 (Night)', timing: 'At Bedtime', durationDays: 30, instructions: 'Take at night' },
  { name: 'Montelukast + Levocetirizine', dosage: '10 mg / 5 mg', form: 'Tablet', frequency: '0-0-1 (Night)', timing: 'At Bedtime', durationDays: 10, instructions: 'Take 30m before sleep' },
  { name: 'Budesonide + Formoterol', dosage: '200 mcg / 6 mcg', form: 'Inhaler', frequency: '1-0-1 (2 Puffs)', timing: 'After Food', durationDays: 15, instructions: 'Rinse mouth after inhalation' }
];

export const PrescriptionComposerModal: React.FC<PrescriptionComposerModalProps> = ({
  isOpen,
  onClose,
  patients,
  preselectedPatientId,
  currentUser,
  onPrescriptionCreated
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    preselectedPatientId || patients[0]?.id || ''
  );
  const [diagnosis, setDiagnosis] = useState('');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [advice, setAdvice] = useState('Maintain proper hydration, balanced light diet, and adequate rest.');
  const [followUpDays, setFollowUpDays] = useState(7);
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      id: `med-${Date.now()}`,
      name: 'Telmisartan',
      dosage: '40 mg',
      form: 'Tablet',
      frequency: '1-0-0 (Morning)',
      timing: 'Before Food',
      durationDays: 30,
      instructions: 'Take daily at 8:00 AM with warm water',
      quantity: 30,
      refillsAllowed: 2
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  // Recalculate follow-up date when followUpDays changes
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + followUpDays);
    setFollowUpDate(d.toISOString().split('T')[0]);
  }, [followUpDays]);

  if (!isOpen) return null;

  const patient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleAddMedicine = () => {
    const newMed: PrescriptionMedicine = {
      id: `med-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: '',
      dosage: '500 mg',
      form: 'Tablet',
      frequency: '1-0-1 (Morning & Night)',
      timing: 'After Food',
      durationDays: 5,
      instructions: 'Take after meals',
      quantity: 10,
      refillsAllowed: 1
    };
    setMedicines([...medicines, newMed]);
  };

  const handleApplyPresetDrug = (index: number, drug: typeof COMMON_DRUGS[0]) => {
    const updated = [...medicines];
    updated[index] = {
      ...updated[index],
      name: drug.name,
      dosage: drug.dosage,
      form: drug.form as PrescriptionMedicine['form'],
      frequency: drug.frequency,
      timing: drug.timing as PrescriptionMedicine['timing'],
      durationDays: drug.durationDays,
      instructions: drug.instructions,
      quantity: drug.durationDays * 2
    };
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof PrescriptionMedicine, value: unknown) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  // Check for allergy contraindications
  const allergyWarning = patient?.allergies.find(allergy => {
    return medicines.some(m => m.name.toLowerCase().includes(allergy.toLowerCase()));
  });

  const handleSaveAndSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    if (medicines.some(m => !m.name.trim())) {
      showToast('Please specify drug names for all prescribed medications.', 'warning');
      return;
    }

    setIsSending(true);

    const rxNumber = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      prescriptionNumber: rxNumber,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMobile: patient.mobileNumber,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      diagnosis: diagnosis || 'General Clinical Consultation',
      symptoms: symptomsInput ? symptomsInput.split(',').map(s => s.trim()) : ['Routine review'],
      medicines,
      advice,
      followUpDate,
      smsNotification: {
        status: 'delivered',
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        messagePreview: '',
        recipientMobile: patient.mobileNumber
      },
      signatureVerified: true
    };

    // Generate formatted SMS
    const smsContent = SmsService.generatePrescriptionSmsText(newRx);
    newRx.smsNotification.messagePreview = smsContent;

    // Dispatch SMS via service
    const smsLog = await SmsService.dispatchSms({
      mobileNumber: patient.mobileNumber,
      patientName: newRx.patientName,
      messageType: 'PRESCRIPTION',
      text: smsContent
    });
    newRx.smsNotification.messageId = smsLog.gatewayMessageId;

    // Save to storage
    StorageService.savePrescription(newRx);

    // Create follow-up appointment if set
    if (followUpDate) {
      const followUpAppt = {
        id: `apt-${Date.now()}`,
        appointmentNumber: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientMobile: patient.mobileNumber,
        patientAge: patient.age,
        patientGender: patient.gender,
        doctorId: currentUser.id,
        doctorName: currentUser.name,
        date: followUpDate,
        timeSlot: '11:00 AM',
        type: 'Follow-up' as const,
        status: 'Scheduled' as const,
        reasonForVisit: `Follow-up review for ${newRx.diagnosis}`,
        reminderSent: false
      };
      StorageService.saveAppointment(followUpAppt);
      patient.nextFollowUpDate = followUpDate;
      StorageService.savePatient(patient);
    }

    // Log to audit trail
    StorageService.logAudit(
      'PRESCRIPTION_SMS_DISPATCHED',
      `Prescribed ${medicines.length} medications and automatically dispatched SMS to ${patient.firstName} ${patient.lastName} (${patient.mobileNumber})`,
      patient.id,
      patient.mrn
    );

    // Create refill records for medications with refillsAllowed > 0
    medicines.forEach(m => {
      if (m.refillsAllowed > 0) {
        const refill = {
          id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientMobile: patient.mobileNumber,
          medicineName: m.name,
          dosage: m.dosage,
          prescribedDate: newRx.date,
          requestedDate: newRx.date,
          status: 'approved' as const,
          refillsRemaining: m.refillsAllowed,
          physicianNotes: `Initial refill batch authorized for ${m.durationDays * m.refillsAllowed} days`,
          lastUpdated: new Date().toISOString()
        };
        StorageService.updateRefill(refill);
      }
    });

    setIsSending(false);
    showToast(`Prescription ${newRx.prescriptionNumber} created & SMS sent to ${patient.mobileNumber}`, 'success');
    onPrescriptionCreated(newRx);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Write Clinical Prescription & Automated SMS
              </h3>
              <p className="text-xs text-slate-500">
                Dosage, timing, and instructions will be sent automatically to the patient's registered mobile number
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Print CareWell Clinic Letterhead Rx"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prescription Form Body */}
        <form onSubmit={handleSaveAndSendSms} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Patient Selection & Registered Mobile Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600 font-medium"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.age}y / {p.gender[0]}) · Mobile: {p.mobileNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Registered Mobile Display */}
            {patient && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>Registered SMS Mobile:</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-teal-950 mt-0.5">
                    {patient.mobileNumber}
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-teal-600 text-white shadow-xs">
                  SMS Gateway Ready
                </span>
              </div>
            )}
          </div>

          {/* Allergy Alert Warning */}
          {allergyWarning && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-3 text-rose-900 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">CRITICAL ALLERGY CONTRAINDICATION: </span>
                <span>
                  Patient is documented allergic to <span className="underline font-semibold">{allergyWarning}</span>! Please review medication choices before prescribing.
                </span>
              </div>
            </div>
          )}

          {/* Diagnosis & Symptoms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diagnosis *</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Essential Hypertension & Grade 1 Dyslipidemia"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chief Symptoms</label>
              <input
                type="text"
                value={symptomsInput}
                onChange={e => setSymptomsInput(e.target.value)}
                placeholder="e.g. Occipital headache, palpitations, fatigue"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Medication List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>Prescribed Medications & Dosage Instructions</span>
                </h4>
                <p className="text-slate-500 text-[11px]">
                  Each drug's dosage, timing (Before/After meals), and frequency will be included in the automated SMS
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMedicine}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            {/* Medicines Form Rows */}
            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div key={med.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      Medication #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Quick preset selector */}
                      <select
                        onChange={e => {
                          const preset = COMMON_DRUGS.find(d => d.name === e.target.value);
                          if (preset) handleApplyPresetDrug(idx, preset);
                        }}
                        defaultValue=""
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600"
                      >
                        <option value="" disabled>Pick Common Rx Drug...</option>
                        {COMMON_DRUGS.map(d => (
                          <option key={d.name} value={d.name}>{d.name} ({d.dosage})</option>
                        ))}
                      </select>

                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-medium mb-1">Drug Name *</label>
                      <input
                        type="text"
                        required
                        value={med.name}
                        onChange={e => handleMedicineChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Telmisartan"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 40 mg"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Form</label>
                      <select
                        value={med.form}
                        onChange={e => handleMedicineChange(idx, 'form', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Inhaler">Inhaler</option>
                        <option value="Drops">Drops</option>
                        <option value="Injection">Injection</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                        <option value="1-0-1 (Morning & Night)">1-0-1 (Morning & Night)</option>
                        <option value="0-0-1 (Night)">0-0-1 (Night)</option>
                        <option value="1-1-1 (Thrice daily)">1-1-1 (Thrice daily)</option>
                        <option value="1-0-0-1 (Morning & Bedtime)">1-0-0-1 (Morning & Bedtime)</option>
                        <option value="PRN (As needed)">PRN (As needed / SOS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Timing</label>
                      <select
                        value={med.timing}
                        onChange={e => handleMedicineChange(idx, 'timing', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value="Before Food">Before Food</option>
                        <option value="After Food">After Food</option>
                        <option value="With Food">With Food</option>
                        <option value="At Bedtime">At Bedtime</option>
                        <option value="As Needed">As Needed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Duration (Days)</label>
                      <input
                        type="number"
                        min={1}
                        value={med.durationDays}
                        onChange={e => handleMedicineChange(idx, 'durationDays', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Authorized Refills</label>
                      <select
                        value={med.refillsAllowed}
                        onChange={e => handleMedicineChange(idx, 'refillsAllowed', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      >
                        <option value={0}>0 Refills</option>
                        <option value={1}>1 Refill</option>
                        <option value={2}>2 Refills</option>
                        <option value={3}>3 Refills</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Special Instructions for Patient</label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)}
                      placeholder="e.g. Take with warm water, avoid milk for 1 hour"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Advice & Follow-up Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Advice / Diet / Activity</label>
              <textarea
                rows={2}
                value={advice}
                onChange={e => setAdvice(e.target.value)}
                placeholder="e.g. Low sodium diet, 30m brisk walk daily, plenty of water"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Follow-up Schedule</label>
              <div className="flex items-center gap-2 mb-2">
                {[3, 7, 14, 30].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setFollowUpDays(days)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                      followUpDays === days
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    +{days} Days
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Live SMS Preview Box */}
          <div className="p-4 bg-slate-900 rounded-xl text-slate-100 text-xs space-y-2">
            <div className="flex items-center justify-between text-teal-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Live SMS Notification Preview (to {patient?.mobileNumber})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">DLT Telecom Approved</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-line border border-slate-800">
              {`[CAREWELL CLINIC] Prescription from ${currentUser.name} for ${patient?.firstName} ${patient?.lastName}:
Diagnosis: ${diagnosis || '[Diagnosis]'}
MEDICATIONS:
${medicines.map((m, i) => `${i + 1}. ${m.name || '[Medicine]'} (${m.dosage}) - ${m.frequency}, ${m.timing} for ${m.durationDays}d.`).join('\n')}
ADVICE: ${advice}
NEXT FOLLOW-UP: ${followUpDate}
Clinic: +91 98765 43210 | Green Park, New Delhi`}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Doctor digital signature: {currentUser.licenseNumber}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Sending SMS to Mobile...' : 'Save & Send SMS to Mobile'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
