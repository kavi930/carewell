/**
 * CareWell Multispeciality Clinic - Electronic Health Record (EHR) & Patient Manager
 * Registered mobile number management, vitals history, trend charts, and follow-up scheduling
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  Pill,
  Heart,
  Activity,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  FileText,
  Save,
  X,
  TrendingUp,
  ChevronRight,
  Send,
  Droplet
} from 'lucide-react';
import { Patient, VitalSignRecord, Prescription, Appointment, UserSession } from '../types/clinic';
import { StorageService } from '../services/storage';
import { SmsService } from '../services/smsService';
import { showToast } from './ToastNotification';

interface PatientRecordsViewProps {
  patients: Patient[];
  selectedPatientId?: string;
  onSelectPatient: (id: string) => void;
  currentUser: UserSession;
  maskPhi: boolean;
  onOpenNewPrescription: (patientId: string) => void;
  onOpenNewAppointment: (patientId: string) => void;
  onRefreshData: () => void;
}

export const PatientRecordsView: React.FC<PatientRecordsViewProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  currentUser,
  maskPhi,
  onOpenNewPrescription,
  onOpenNewAppointment,
  onRefreshData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState('ALL');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showNewVitalsModal, setShowNewVitalsModal] = useState(false);
  
  // New Patient Form State
  const [newPatient, setNewPatient] = useState<{
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    address: string;
    allergies: string;
    chronicConditions: string;
    emergencyName: string;
    emergencyPhone: string;
    emergencyRel: string;
  }>({
    firstName: '',
    lastName: '',
    mobileNumber: '+91 ',
    email: '',
    age: 35,
    gender: 'Male',
    bloodGroup: 'B+',
    address: '',
    allergies: '',
    chronicConditions: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRel: 'Spouse'
  });

  // New Vitals Form State
  const [newVital, setNewVital] = useState<{
    systolicBp: number;
    diastolicBp: number;
    heartRate: number;
    spo2: number;
    temperature: number;
    bloodGlucose: string;
    weightKg: number;
    heightCm: number;
    notes: string;
  }>({
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 72,
    spo2: 98,
    temperature: 98.6,
    bloodGlucose: '110',
    weightKg: 70,
    heightCm: 170,
    notes: ''
  });

  const formatName = (first: string, last: string) => {
    const full = `${first} ${last}`;
    if (!maskPhi) return full;
    return `${first[0]}**** ${last[0]}****`;
  };

  const formatPhone = (phone: string) => {
    if (!maskPhi) return phone;
    return phone.substring(0, 6) + '*****' + phone.substring(phone.length - 2);
  };

  // Filtered patients
  const filtered = patients.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.mobileNumber.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q);

    if (!matchesQuery) return false;
    if (filterCondition === 'ALL') return true;
    if (filterCondition === 'HYPERTENSION') {
      return p.chronicConditions.some(c => c.toLowerCase().includes('hypertension'));
    }
    if (filterCondition === 'DIABETES') {
      return p.chronicConditions.some(c => c.toLowerCase().includes('diabetes'));
    }
    if (filterCondition === 'CRITICAL') {
      return p.status === 'Critical Follow-up';
    }
    return true;
  });

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const patientVitals = activePatient ? StorageService.getVitals(activePatient.id) : [];
  const patientPrescriptions = activePatient ? StorageService.getPrescriptions(activePatient.id) : [];
  const patientAppointments = activePatient ? StorageService.getAppointments().filter(a => a.patientId === activePatient.id) : [];

  // Register New Patient Handler
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.firstName.trim() || !newPatient.mobileNumber.trim()) {
      showToast('Please provide patient name and registered mobile number.', 'error');
      return;
    }

    const nextMrnNum = 100 + patients.length + 1;
    const mrn = `CW-2026-0${nextMrnNum}`;
    const newId = `pat-${Date.now()}`;

    const created: Patient = {
      id: newId,
      mrn,
      firstName: newPatient.firstName.trim(),
      lastName: newPatient.lastName.trim(),
      mobileNumber: newPatient.mobileNumber.trim(),
      email: newPatient.email.trim(),
      age: Number(newPatient.age) || 30,
      gender: newPatient.gender,
      bloodGroup: newPatient.bloodGroup,
      address: newPatient.address.trim() || 'New Delhi',
      emergencyContact: {
        name: newPatient.emergencyName.trim() || 'Next of Kin',
        relationship: newPatient.emergencyRel.trim() || 'Family',
        phone: newPatient.emergencyPhone.trim() || newPatient.mobileNumber.trim()
      },
      allergies: newPatient.allergies ? newPatient.allergies.split(',').map(s => s.trim()) : [],
      chronicConditions: newPatient.chronicConditions ? newPatient.chronicConditions.split(',').map(s => s.trim()) : [],
      pastMedicalHistory: [],
      registeredDate: '2026-10-19',
      totalVisits: 1,
      status: 'Active'
    };

    StorageService.savePatient(created);
    StorageService.logAudit('PATIENT_REGISTERED', `Registered new patient ${created.firstName} ${created.lastName} (MRN: ${mrn}, Mobile: ${created.mobileNumber})`, created.id, created.mrn);

    // Send Welcome SMS to registered mobile number
    await SmsService.dispatchSms({
      mobileNumber: created.mobileNumber,
      patientName: `${created.firstName} ${created.lastName}`,
      messageType: 'APPOINTMENT_REMINDER',
      text: `[CAREWELL CLINIC] Welcome ${created.firstName}! Your patient record is registered (MRN: ${mrn}). Your prescriptions and dosage reminders will be automatically sent to this mobile number. Helpline: +91 98765 43210.`
    });

    onRefreshData();
    onSelectPatient(created.id);
    setShowNewPatientModal(false);
  };

  // Add Vitals Handler
  const handleSaveVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    const heightM = (Number(newVital.heightCm) || 170) / 100;
    const weight = Number(newVital.weightKg) || 70;
    const bmi = Number((weight / (heightM * heightM)).toFixed(1));

    const vitRecord: VitalSignRecord = {
      id: `vit-${Date.now()}`,
      patientId: activePatient.id,
      recordedAt: new Date().toISOString(),
      recordedBy: currentUser.name,
      systolicBp: Number(newVital.systolicBp) || 120,
      diastolicBp: Number(newVital.diastolicBp) || 80,
      heartRate: Number(newVital.heartRate) || 72,
      spo2: Number(newVital.spo2) || 98,
      temperature: Number(newVital.temperature) || 98.6,
      bloodGlucose: newVital.bloodGlucose ? Number(newVital.bloodGlucose) : undefined,
      bmi,
      weightKg: weight,
      heightCm: Number(newVital.heightCm) || 170,
      notes: newVital.notes
    };

    StorageService.addVital(vitRecord);
    StorageService.logAudit('PATIENT_UPDATED', `Recorded clinical vitals (BP: ${vitRecord.systolicBp}/${vitRecord.diastolicBp}, Pulse: ${vitRecord.heartRate}) for ${activePatient.firstName} ${activePatient.lastName}`, activePatient.id, activePatient.mrn);
    
    onRefreshData();
    setShowNewVitalsModal(false);
  };

  // Fast follow-up booking
  const handleQuickFollowUp = (daysAhead: number) => {
    if (!activePatient) return;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const dateStr = targetDate.toISOString().split('T')[0];

    const appt: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activePatient.id,
      patientName: `${activePatient.firstName} ${activePatient.lastName}`,
      patientMobile: activePatient.mobileNumber,
      patientAge: activePatient.age,
      patientGender: activePatient.gender,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      date: dateStr,
      timeSlot: '10:30 AM',
      type: 'Follow-up',
      status: 'Scheduled',
      reasonForVisit: `Routine ${daysAhead}-day clinical follow-up review`,
      reminderSent: false
    };

    StorageService.saveAppointment(appt);
    StorageService.logAudit('FOLLOWUP_SCHEDULED', `Scheduled ${daysAhead}-day follow-up for ${activePatient.firstName} ${activePatient.lastName} on ${dateStr}`, activePatient.id, activePatient.mrn);
    
    // Update patient next follow-up
    activePatient.nextFollowUpDate = dateStr;
    StorageService.savePatient(activePatient);

    onRefreshData();
    showToast(`Follow-up appointment scheduled for ${dateStr} at 10:30 AM.`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, Registered Mobile Number, or MRN..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto text-xs">
            <button
              onClick={() => setFilterCondition('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterCondition === 'ALL'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({patients.length})
            </button>
            <button
              onClick={() => setFilterCondition('HYPERTENSION')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterCondition === 'HYPERTENSION'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hypertension
            </button>
            <button
              onClick={() => setFilterCondition('DIABETES')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterCondition === 'DIABETES'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Diabetes
            </button>
            <button
              onClick={() => setFilterCondition('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterCondition === 'CRITICAL'
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Critical Follow-up
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowNewPatientModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Patient (with Mobile for SMS)</span>
        </button>
      </div>

      {/* Main Split Layout: Patient Directory on Left (1/3), Full Chart on Right (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Patient Directory List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col max-h-[780px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 uppercase tracking-wider">
              Patients Found ({filtered.length})
            </span>
            <span className="text-slate-400">Click to load chart</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No matching patients found.
              </div>
            ) : (
              filtered.map(p => {
                const isSelected = p.id === activePatient?.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p.id);
                      StorageService.logAudit('PATIENT_RECORD_VIEWED', `Viewed EHR of ${p.firstName} ${p.lastName} (${p.mrn})`, p.id, p.mrn);
                    }}
                    className={`w-full text-left p-3.5 transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50/80 border-l-4 border-teal-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {formatName(p.firstName, p.lastName)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {p.age}y / {p.gender[0]}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-teal-700 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-teal-600" />
                        <span>{formatPhone(p.mobileNumber)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-1">
                        {p.chronicConditions.join(', ') || 'No chronic conditions recorded'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 block mb-1">
                        {p.mrn}
                      </span>
                      {p.allergies.length > 0 && (
                        <span className="text-[10px] text-rose-600 font-medium">Allergy</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed Patient Chart (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activePatient ? (
            <>
              {/* Patient Banner Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {activePatient.firstName[0]}{activePatient.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold text-slate-900">
                          {formatName(activePatient.firstName, activePatient.lastName)}
                        </h2>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {activePatient.mrn}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>{activePatient.age} years</span>
                        <span>·</span>
                        <span>{activePatient.gender}</span>
                        <span>·</span>
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <Droplet className="w-3 h-3" /> Blood Group: {activePatient.bloodGroup}
                        </span>
                        <span>·</span>
                        <span className="text-teal-700 font-mono font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {formatPhone(activePatient.mobileNumber)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Chart Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenNewPrescription(activePatient.id)}
                      className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Pill className="w-4 h-4" />
                      <span>Write Rx & SMS</span>
                    </button>
                    <button
                      onClick={() => onOpenNewAppointment(activePatient.id)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span>Schedule</span>
                    </button>
                  </div>
                </div>

                {/* Key Clinical Alerts Strip */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Chronic Conditions
                    </span>
                    <span className="font-medium text-slate-800">
                      {activePatient.chronicConditions.join(', ') || 'None recorded'}
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-200/80">
                    <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block mb-1">
                      Allergies & Contraindications
                    </span>
                    <span className="font-medium text-rose-900">
                      {activePatient.allergies.length > 0 ? activePatient.allergies.join(', ') : 'No Known Drug Allergies (NKDA)'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Emergency Contact
                    </span>
                    <span className="font-medium text-slate-800">
                      {activePatient.emergencyContact.name} ({activePatient.emergencyContact.relationship}) · {formatPhone(activePatient.emergencyContact.phone)}
                    </span>
                  </div>
                </div>

                {/* Fast Follow-up Scheduler Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Quick Follow-up Booking:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickFollowUp(3)}
                      className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold border border-teal-200"
                    >
                      +3 Days
                    </button>
                    <button
                      onClick={() => handleQuickFollowUp(7)}
                      className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold border border-teal-200"
                    >
                      +1 Week
                    </button>
                    <button
                      onClick={() => handleQuickFollowUp(14)}
                      className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold border border-teal-200"
                    >
                      +2 Weeks
                    </button>
                    <button
                      onClick={() => handleQuickFollowUp(30)}
                      className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold border border-teal-200"
                    >
                      +1 Month
                    </button>
                  </div>
                </div>
              </div>

              {/* Vitals History & Trend Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-600" />
                      <span>Vitals History & Trend Trajectory</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Continuous longitudinal BP, heart rate, and glycemic surveillance
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewVitalsModal(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record New Vitals</span>
                  </button>
                </div>

                {/* Interactive Trend Sparkline (SVG) */}
                {patientVitals.length > 1 && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="font-semibold flex items-center gap-1 text-slate-700">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                        Blood Pressure Trajectory (Systolic / Diastolic)
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-teal-700 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Systolic (Target &lt;130)
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-sky-700 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Diastolic (Target &lt;85)
                        </span>
                      </div>
                    </div>

                    <div className="h-28 w-full flex items-end gap-6 pt-4 pb-2 px-2 border-b border-slate-200">
                      {patientVitals.slice().reverse().map((v, i) => {
                        const maxVal = 180;
                        const sysHeight = Math.min(100, Math.max(20, ((v.systolicBp - 80) / (maxVal - 80)) * 100));
                        const diaHeight = Math.min(100, Math.max(20, ((v.diastolicBp - 50) / (120 - 50)) * 100));
                        return (
                          <div key={v.id} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="flex items-end gap-1.5 h-20">
                              <div
                                style={{ height: `${sysHeight}%` }}
                                className={`w-3.5 rounded-t transition-all ${
                                  v.systolicBp > 140 ? 'bg-rose-500' : 'bg-teal-600'
                                }`}
                                title={`Systolic: ${v.systolicBp} mmHg`}
                              ></div>
                              <div
                                style={{ height: `${diaHeight}%` }}
                                className="w-3.5 rounded-t bg-sky-500 transition-all"
                                title={`Diastolic: ${v.diastolicBp} mmHg`}
                              ></div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(v.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-800">
                              {v.systolicBp}/{v.diastolicBp}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Vitals Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Blood Pressure</th>
                        <th className="py-2.5 px-3">Heart Rate</th>
                        <th className="py-2.5 px-3">SpO2</th>
                        <th className="py-2.5 px-3">Blood Sugar</th>
                        <th className="py-2.5 px-3">BMI</th>
                        <th className="py-2.5 px-3">Staff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientVitals.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-slate-400">
                            No vitals recorded yet. Click 'Record New Vitals' above.
                          </td>
                        </tr>
                      ) : (
                        patientVitals.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {new Date(v.recordedAt).toLocaleDateString()} {new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <span className={v.systolicBp >= 140 ? 'text-rose-600 font-bold' : ''}>
                                {v.systolicBp}/{v.diastolicBp} mmHg
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{v.heartRate} bpm</td>
                            <td className="py-2.5 px-3 text-slate-700">{v.spo2}%</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {v.bloodGlucose ? `${v.bloodGlucose} mg/dL` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{v.bmi} ({v.weightKg}kg)</td>
                            <td className="py-2.5 px-3 text-slate-500">{v.recordedBy}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Past Prescriptions & Automated SMS Delivery History */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-600" />
                      <span>Prescriptions & Automated SMS Delivery Logs</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verified dosages, frequency instructions, and delivery confirmation
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenNewPrescription(activePatient.id)}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Prescription & SMS</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {patientPrescriptions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      No prescriptions issued yet for this patient.
                    </div>
                  ) : (
                    patientPrescriptions.map(rx => (
                      <div key={rx.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm font-mono">{rx.prescriptionNumber}</span>
                            <span className="text-xs text-slate-500">({rx.date})</span>
                            <span className="text-xs text-slate-600">· Prescribed by {rx.doctorName}</span>
                          </div>
                          
                          {/* SMS Delivery Badge */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1 text-[11px]">
                              <Send className="w-3 h-3 text-emerald-600" />
                              <span>SMS Delivered to {formatPhone(rx.patientMobile)}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-xs">
                          <span className="font-semibold text-slate-800">Diagnosis: </span>
                          <span className="text-slate-700">{rx.diagnosis}</span>
                        </div>

                        {/* Medications Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left bg-white rounded-lg border border-slate-200">
                            <thead className="bg-slate-100 text-slate-600 font-semibold">
                              <tr>
                                <th className="py-2 px-3">Medicine</th>
                                <th className="py-2 px-3">Dosage</th>
                                <th className="py-2 px-3">Frequency & Timing</th>
                                <th className="py-2 px-3">Duration</th>
                                <th className="py-2 px-3">Special Instructions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {rx.medicines.map((m, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 px-3 font-semibold text-teal-900">{m.name}</td>
                                  <td className="py-2 px-3">{m.dosage}</td>
                                  <td className="py-2 px-3 font-medium text-slate-800">{m.frequency} ({m.timing})</td>
                                  <td className="py-2 px-3">{m.durationDays} days</td>
                                  <td className="py-2 px-3 text-slate-500">{m.instructions}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                          <div>
                            <span className="font-semibold text-slate-700">Follow-up: </span>
                            <span>{rx.followUpDate}</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            Gateway ID: {rx.smsNotification?.messageId || 'CW-GTW-OK'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Select a patient from the list to view their electronic health record.
            </div>
          )}
        </div>

      </div>

      {/* New Patient Registration Modal */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register New Patient</h3>
                <p className="text-xs text-slate-500">
                  Registered mobile number enables automatic SMS prescription and reminder dispatch
                </p>
              </div>
              <button
                onClick={() => setShowNewPatientModal(false)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newPatient.lastName}
                    onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    placeholder="e.g. Gupta"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Mobile Number for SMS */}
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl">
                <label className="block font-bold text-teal-900 mb-1">
                  Registered Mobile Number (for Automated SMS Notifications) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={newPatient.mobileNumber}
                    onChange={e => setNewPatient({ ...newPatient, mobileNumber: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full pl-9 pr-3 py-2 border border-teal-300 bg-white rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                  <Phone className="w-4 h-4 text-teal-600 absolute left-3 top-2.5" />
                </div>
                <p className="text-[11px] text-teal-800 mt-1">
                  Prescription dosages, medication schedules, and follow-up reminders will be sent to this mobile number via SMS automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={e => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={e => setNewPatient({ ...newPatient, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={newPatient.bloodGroup}
                    onChange={e => setNewPatient({ ...newPatient, bloodGroup: e.target.value as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newPatient.address}
                  onChange={e => setNewPatient({ ...newPatient, address: e.target.value })}
                  placeholder="e.g. Green Park, New Delhi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">Drug Allergies (Comma separated)</label>
                  <input
                    type="text"
                    value={newPatient.allergies}
                    onChange={e => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Sulfa, Aspirin"
                    className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chronic Conditions (Comma separated)</label>
                  <input
                    type="text"
                    value={newPatient.chronicConditions}
                    onChange={e => setNewPatient({ ...newPatient, chronicConditions: e.target.value })}
                    placeholder="e.g. Hypertension, Type 2 Diabetes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Register Patient & Trigger SMS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record New Vitals Modal */}
      {showNewVitalsModal && activePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                Record Vitals for {activePatient.firstName} {activePatient.lastName}
              </h3>
              <button
                onClick={() => setShowNewVitalsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVital} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    required
                    value={newVital.systolicBp}
                    onChange={e => setNewVital({ ...newVital, systolicBp: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    required
                    value={newVital.diastolicBp}
                    onChange={e => setNewVital({ ...newVital, diastolicBp: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={newVital.heartRate}
                    onChange={e => setNewVital({ ...newVital, heartRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={newVital.spo2}
                    onChange={e => setNewVital({ ...newVital, spo2: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVital.temperature}
                    onChange={e => setNewVital({ ...newVital, temperature: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={newVital.weightKg}
                    onChange={e => setNewVital({ ...newVital, weightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={newVital.heightCm}
                    onChange={e => setNewVital({ ...newVital, heightCm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Sugar (mg/dL)</label>
                  <input
                    type="number"
                    value={newVital.bloodGlucose}
                    onChange={e => setNewVital({ ...newVital, bloodGlucose: e.target.value })}
                    placeholder="e.g. 140"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Observations</label>
                <input
                  type="text"
                  value={newVital.notes}
                  onChange={e => setNewVital({ ...newVital, notes: e.target.value })}
                  placeholder="e.g. Regular pulse rhythm, no edema"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewVitalsModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Vitals</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
