/**
 * CareWell Multispeciality Clinic - Appointments & Follow-up Management
 * Seamless scheduling, automated reminder SMS dispatch, and clinic timing slot management
 */

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Send,
  CheckCircle2,
  Phone,
  Filter,
  User,
  AlertCircle,
  X,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles
} from 'lucide-react';
import { Appointment, Patient, UserSession } from '../types/clinic';
import { StorageService } from '../services/storage';
import { SmsService } from '../services/smsService';
import { showToast } from './ToastNotification';

interface AppointmentsViewProps {
  appointments: Appointment[];
  patients: Patient[];
  currentUser: UserSession;
  maskPhi: boolean;
  onOpenNewPrescription: (patientId: string) => void;
  onRefreshData: () => void;
}

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM'
];

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  patients,
  currentUser,
  maskPhi,
  onOpenNewPrescription,
  onRefreshData
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-10-19');
  const [filterType, setFilterType] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

  // New Appointment Form State
  const [newAppt, setNewAppt] = useState<{
    patientId: string;
    doctorId: string;
    date: string;
    timeSlot: string;
    type: Appointment['type'];
    reasonForVisit: string;
    notes: string;
  }>({
    patientId: patients[0]?.id || '',
    doctorId: currentUser.id,
    date: '2026-10-19',
    timeSlot: '10:00 AM',
    type: 'Follow-up',
    reasonForVisit: 'General Physician Follow-up review',
    notes: ''
  });

  const formatName = (name: string) => {
    if (!maskPhi) return name;
    return name.split(' ').map(p => p[0] + '****').join(' ');
  };

  const formatPhone = (phone: string) => {
    if (!maskPhi) return phone;
    return phone.substring(0, 6) + '*****' + phone.substring(phone.length - 2);
  };

  // Filter appointments for the selected date or all
  const filteredAppointments = appointments.filter(a => {
    if (selectedDate && a.date !== selectedDate) return false;
    if (filterType !== 'ALL' && a.status !== filterType) return false;
    return true;
  });

  // Timezone-safe Shift date helper
  const handleShiftDate = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    const year = parts[0] || 2026;
    const month = (parts[1] || 1) - 1;
    const day = parts[2] || 1;
    const current = new Date(year, month, day);
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Dispatch reminder SMS for an appointment
  const handleSendReminderSms = async (appt: Appointment) => {
    setSendingSmsId(appt.id);
    const smsText = SmsService.generateAppointmentReminderText(appt);
    await SmsService.dispatchSms({
      mobileNumber: appt.patientMobile,
      patientName: appt.patientName,
      messageType: 'APPOINTMENT_REMINDER',
      text: smsText
    });

    appt.reminderSent = true;
    appt.reminderSentAt = new Date().toISOString();
    appt.reminderStatus = 'Delivered';
    StorageService.saveAppointment(appt);
    StorageService.logAudit('APPOINTMENT_SCHEDULED', `Dispatched automated SMS reminder to ${appt.patientName} (${appt.patientMobile}) for ${appt.date} ${appt.timeSlot}`, appt.patientId);
    
    setSendingSmsId(null);
    onRefreshData();
    showToast(`Automated SMS reminder dispatched to ${appt.patientMobile}`, 'success');
  };

  // Update appointment status
  const handleUpdateStatus = (appt: Appointment, newStatus: Appointment['status']) => {
    appt.status = newStatus;
    StorageService.saveAppointment(appt);
    StorageService.logAudit('APPOINTMENT_SCHEDULED', `Updated appointment status to ${newStatus} for ${appt.patientName}`, appt.patientId);
    onRefreshData();
  };

  // Create new appointment
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === newAppt.patientId) || patients[0];
    if (!patient) {
      showToast('Please register a patient before scheduling an appointment.', 'warning');
      return;
    }

    const created: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMobile: patient.mobileNumber,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      date: newAppt.date,
      timeSlot: newAppt.timeSlot,
      type: newAppt.type,
      status: 'Scheduled',
      reasonForVisit: newAppt.reasonForVisit,
      notes: newAppt.notes,
      reminderSent: true,
      reminderSentAt: new Date().toISOString(),
      reminderStatus: 'Delivered'
    };

    StorageService.saveAppointment(created);
    StorageService.logAudit('APPOINTMENT_SCHEDULED', `Booked ${created.type} for ${created.patientName} on ${created.date} at ${created.timeSlot}`, created.patientId);

    // Send confirmation SMS automatically to patient's registered mobile number!
    const smsText = SmsService.generateAppointmentReminderText(created);
    await SmsService.dispatchSms({
      mobileNumber: created.patientMobile,
      patientName: created.patientName,
      messageType: 'APPOINTMENT_REMINDER',
      text: smsText
    });

    // Update patient next follow up
    patient.nextFollowUpDate = created.date;
    StorageService.savePatient(patient);

    onRefreshData();
    setShowNewModal(false);
    showToast(`Appointment scheduled & SMS reminder dispatched to ${created.patientMobile}`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* 24/7 Automated Follow-up & Reminder Engine Strip */}
      <div className="p-4 bg-gradient-to-r from-[#003859] via-[#00517d] to-[#0284c7] text-white rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-400/20 text-teal-300 border border-teal-300/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-teal-300 fill-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">24/7 Automated Follow-up & Reminder Engine</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>RUNNING AUTOMATICALLY</span>
              </span>
            </div>
            <p className="text-slate-200 text-xs mt-0.5">
              All upcoming consultation reminders (24h prior) and scheduled follow-up recalls are dispatched to patients' registered mobile numbers automatically without manual clicks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-slate-100 font-mono text-[11px]">
            Engine Cycle: Every 20s
          </span>
        </div>
      </div>

      {/* Top Filter and Date Navigation Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Date Selector & Nav */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-xs font-bold text-slate-800 font-mono">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <button
              onClick={() => handleShiftDate(1)}
              className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:border-teal-600"
          />

          <button
            onClick={() => setSelectedDate('2026-10-19')}
            className="px-2.5 py-1.5 text-xs text-teal-700 hover:bg-teal-50 rounded-lg font-medium transition-colors"
          >
            Today
          </button>
        </div>

        {/* Status Filters & Book Button */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('Scheduled')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'Scheduled' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setFilterType('Confirmed')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'Confirmed' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilterType('Completed')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'Completed' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Book Follow-up & Send SMS</span>
          </button>
        </div>

      </div>

      {/* Appointment Slots & Patient Cards */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Appointments for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredAppointments.length} Booked Slots · Clinic Hours: 9:00 AM – 8:00 PM
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No appointments scheduled for this date.</p>
              <p className="text-slate-400 mt-1">Click "Book Follow-up & Send SMS" to schedule a patient consultation.</p>
            </div>
          ) : (
            filteredAppointments.map(appt => (
              <div key={appt.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  
                  {/* Time Badge */}
                  <div className="w-20 text-center shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <span className="block font-extrabold text-sm text-slate-900 font-mono">{appt.timeSlot}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">{appt.type}</span>
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-slate-900 text-base">
                        {formatName(appt.patientName)}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {appt.patientAge}y · {appt.patientGender}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        appt.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : appt.status === 'Confirmed'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="font-medium text-slate-800">Reason: </span>
                      {appt.reasonForVisit}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-mono text-teal-700 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-teal-600" />
                        {formatPhone(appt.patientMobile)}
                      </span>
                      <span>·</span>
                      <span>Consultant: {appt.doctorName}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px]">{appt.appointmentNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Send Reminder SMS, Consult, Status */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                  
                  {/* Automated SMS Reminder Status / Trigger */}
                  {appt.reminderSent ? (
                    <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>SMS Sent</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendReminderSms(appt)}
                      disabled={sendingSmsId === appt.id}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Send instant SMS appointment reminder to registered phone"
                    >
                      <Send className="w-3.5 h-3.5 text-teal-600" />
                      <span>{sendingSmsId === appt.id ? 'Sending...' : 'Send SMS Reminder'}</span>
                    </button>
                  )}

                  {/* Status Dropdown */}
                  <select
                    value={appt.status}
                    onChange={e => handleUpdateStatus(appt, e.target.value as Appointment['status'])}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => onOpenNewPrescription(appt.patientId)}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Prescribe & SMS
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Book New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Schedule Follow-up Appointment</h3>
                <p className="text-xs text-slate-500">
                  Automated reminder SMS will be sent to patient's registered mobile
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  value={newAppt.patientId}
                  onChange={e => setNewAppt({ ...newAppt, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrn}) · Mobile: {p.mobileNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={newAppt.date}
                    onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={newAppt.timeSlot}
                    onChange={e => setNewAppt({ ...newAppt, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Consultation Type</label>
                <select
                  value={newAppt.type}
                  onChange={e => setNewAppt({ ...newAppt, type: e.target.value as Appointment['type'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                >
                  <option value="Follow-up">Follow-up Consultation</option>
                  <option value="General Consultation">General Consultation</option>
                  <option value="Chronic Care Review">Chronic Care Review</option>
                  <option value="Prescription Refill">Prescription Refill</option>
                  <option value="Urgent Care">Urgent Care</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Visit / Follow-up Objective *</label>
                <input
                  type="text"
                  required
                  value={newAppt.reasonForVisit}
                  onChange={e => setNewAppt({ ...newAppt, reasonForVisit: e.target.value })}
                  placeholder="e.g. Check blood pressure response to Telmisartan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-teal-700" />
                  <span>Automated SMS Trigger Active</span>
                </div>
                <p className="text-[11px] text-teal-800">
                  Booking this slot will automatically dispatch an SMS reminder to the patient's registered mobile number with clinic directions and contact number +91 98765 43210.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Confirm & Send SMS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
