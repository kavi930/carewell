/**
 * CareWell Multispeciality Clinic - Clinical Dashboard View
 * Intuitive overview of today's queue, follow-up reminders, refill approvals, and vitals alerts
 */

import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Pill,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PhoneCall,
  Activity,
  Heart,
  Baby,
  Stethoscope,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Check,
  MapPin,
  ClipboardList,
  HeartHandshake,
  Phone,
  Zap
} from 'lucide-react';
import { Patient, Appointment, RefillRequest, Prescription, UserSession } from '../types/clinic';
import { SmsService } from '../services/smsService';
import { StorageService } from '../services/storage';

interface DashboardViewProps {
  patients: Patient[];
  appointments: Appointment[];
  refills: RefillRequest[];
  prescriptions: Prescription[];
  currentUser: UserSession;
  maskPhi: boolean;
  onNavigateTab: (tab: string, param?: string) => void;
  onOpenNewPrescription: (patientId?: string) => void;
  onOpenNewAppointment: (patientId?: string) => void;
  onOpenWhatsAppBot?: () => void;
  onOpenServicesEnquiry?: () => void;
  onRefreshData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  appointments,
  refills,
  prescriptions,
  currentUser,
  maskPhi,
  onNavigateTab,
  onOpenNewPrescription,
  onOpenNewAppointment,
  onOpenWhatsAppBot,
  onOpenServicesEnquiry,
  onRefreshData
}) => {
  const [bulkSmsSending, setBulkSmsSending] = useState(false);
  const [bulkSmsSuccess, setBulkSmsSuccess] = useState(false);

  // Helper for PHI masking
  const formatName = (name: string) => {
    if (!maskPhi) return name;
    const parts = name.split(' ');
    return parts.map(p => p[0] + '****').join(' ');
  };

  const formatPhone = (phone: string) => {
    if (!maskPhi) return phone;
    return phone.substring(0, 6) + '*****' + phone.substring(phone.length - 2);
  };

  const todayStr = '2026-10-19'; // Matches the local environment timeline
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const pendingRefills = refills.filter(r => r.status === 'pending');
  const criticalPatients = patients.filter(p => p.status === 'Critical Follow-up' || p.allergies.length > 0);

  // Send bulk SMS reminders for today's scheduled consultations
  const handleSendAllTodayReminders = async () => {
    setBulkSmsSending(true);
    for (const appt of todayAppointments) {
      if (!appt.reminderSent) {
        const text = SmsService.generateAppointmentReminderText(appt);
        await SmsService.dispatchSms({
          mobileNumber: appt.patientMobile,
          patientName: appt.patientName,
          messageType: 'APPOINTMENT_REMINDER',
          text
        });
        appt.reminderSent = true;
        appt.reminderSentAt = new Date().toISOString();
        appt.reminderStatus = 'Delivered';
        StorageService.saveAppointment(appt);
        StorageService.logAudit('APPOINTMENT_SCHEDULED', `Dispatched automated SMS reminder to ${appt.patientName} (${appt.patientMobile})`, appt.patientId);
      }
    }
    setBulkSmsSending(false);
    setBulkSmsSuccess(true);
    onRefreshData();
    setTimeout(() => setBulkSmsSuccess(false), 4000);
  };

  const handleSendSingleReminder = async (appt: Appointment) => {
    const text = SmsService.generateAppointmentReminderText(appt);
    await SmsService.dispatchSms({
      mobileNumber: appt.patientMobile,
      patientName: appt.patientName,
      messageType: 'APPOINTMENT_REMINDER',
      text
    });
    appt.reminderSent = true;
    appt.reminderSentAt = new Date().toISOString();
    appt.reminderStatus = 'Delivered';
    StorageService.saveAppointment(appt);
    StorageService.logAudit('APPOINTMENT_SCHEDULED', `Dispatched automated SMS reminder to ${appt.patientName} (${appt.patientMobile})`, appt.patientId);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Authentic CareWell Multispeciality Clinic Poster & Hero Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        
        {/* Top Section: Clinic Logo, Slogan, and Active Doctor Session */}
        <div className="p-6 md:p-8 bg-gradient-to-b from-sky-50/50 via-white to-white border-b border-slate-100">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Left: Official CareWell Logo & Slogan */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
              {/* Dual-Color Medical Cross with Heart & Heartbeat (from Poster) */}
              <div className="relative w-16 h-16 shrink-0 shadow-md rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#003d66] to-[#006699]">
                {/* Left navy half, right emerald half */}
                <div className="absolute inset-0 grid grid-cols-2">
                  <div className="bg-[#00426b]"></div>
                  <div className="bg-[#5cb82e]"></div>
                </div>
                {/* Center White Heart with ECG heartbeat */}
                <div className="relative z-10 w-11 h-11 bg-white rounded-xl shadow-xs flex items-center justify-center p-1">
                  <Heart className="w-8 h-8 text-[#008ba3] fill-[#e0f7fa]" />
                  <Activity className="w-5 h-5 text-[#00426b] absolute" />
                </div>
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#00385e] leading-none uppercase font-sans">
                  CAREWELL
                </h1>
                <h2 className="text-base md:text-lg font-extrabold tracking-wide text-[#00708f] uppercase mt-0.5">
                  MULTISPECIALITY CLINIC
                </h2>
                
                {/* Slogan with Dividers (from Poster) */}
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-500 tracking-widest mt-1.5 uppercase">
                  <span className="w-6 h-px bg-slate-300"></span>
                  <span className="text-[#004b75]">YOUR HEALTH OUR PRIORITY</span>
                  <span className="w-6 h-px bg-slate-300"></span>
                </div>
              </div>
            </div>

            {/* Right: Physician OPD Census & Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
              <div className="text-center sm:text-right px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-auto">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{currentUser.name}</span>
                  <span className="text-slate-400 font-normal">({currentUser.role.toUpperCase()})</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Today's OPD: <span className="font-bold text-teal-800">{todayAppointments.length} Consultations</span> ·{' '}
                  <span className="font-bold text-amber-800">{pendingRefills.length} Refills</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-center flex-wrap">
                {onOpenServicesEnquiry && (
                  <button
                    onClick={onOpenServicesEnquiry}
                    className="px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                    title="View all 6 Clinic Specialties, Doctor Fees, Diagnostics & Inquire"
                  >
                    <Stethoscope className="w-4 h-4 text-sky-700" />
                    <span>Services & Enquiry</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenNewPrescription()}
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
                >
                  <Pill className="w-4 h-4" />
                  <span>Prescribe & SMS</span>
                </button>
                <button
                  onClick={() => onOpenNewAppointment()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span>Book Follow-up</span>
                </button>
              </div>
            </div>

          </div>

          {/* Center Strip: The 5 Poster Specialty Circles */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Departments & Services
              </span>
              {onOpenServicesEnquiry && (
                <button
                  onClick={onOpenServicesEnquiry}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
                >
                  <span>Explore All Services & Consultation Fees →</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 md:gap-6 text-center">
              
              {/* 1. General Physician */}
              <div
                onClick={() => onOpenServicesEnquiry ? onOpenServicesEnquiry() : onNavigateTab('appointments')}
                className="flex flex-col items-center group cursor-pointer"
                title="Click to view General Physician details & fees"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md ring-4 ring-sky-100 group-hover:scale-105 group-hover:bg-sky-600 transition-all">
                  <Stethoscope className="w-7 h-7 text-white stroke-[2.2]" />
                </div>
                <span className="mt-2.5 text-xs md:text-sm font-extrabold text-slate-800 tracking-tight leading-tight">
                  General<br />Physician
                </span>
                <span className="text-[10px] text-sky-700 font-medium mt-0.5">Active OPD · ₹500</span>
              </div>

              {/* 2. Child Care */}
              <div
                onClick={() => onOpenServicesEnquiry ? onOpenServicesEnquiry() : onNavigateTab('patients')}
                className="flex flex-col items-center group cursor-pointer"
                title="Click to view Child Care (Pediatrics) & Vaccination details"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md ring-4 ring-pink-100 group-hover:scale-105 group-hover:bg-pink-600 transition-all">
                  <Baby className="w-7 h-7 text-white stroke-[2.2]" />
                </div>
                <span className="mt-2.5 text-xs md:text-sm font-extrabold text-slate-800 tracking-tight leading-tight">
                  Child<br />Care
                </span>
                <span className="text-[10px] text-pink-700 font-medium mt-0.5">Pediatrics · ₹600</span>
              </div>

              {/* 3. Women's Health */}
              <div
                onClick={() => onOpenServicesEnquiry ? onOpenServicesEnquiry() : onNavigateTab('patients')}
                className="flex flex-col items-center group cursor-pointer"
                title="Click to view Women's Health & PCOS wellness details"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md ring-4 ring-purple-100 group-hover:scale-105 group-hover:bg-purple-700 transition-all">
                  {/* Venus Symbol Representation */}
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="9" r="6" />
                    <line x1="12" y1="15" x2="12" y2="21" />
                    <line x1="9" y1="18" x2="15" y2="18" />
                  </svg>
                </div>
                <span className="mt-2.5 text-xs md:text-sm font-extrabold text-slate-800 tracking-tight leading-tight">
                  Women's<br />Health
                </span>
                <span className="text-[10px] text-purple-700 font-medium mt-0.5">Wellness · ₹600</span>
              </div>

              {/* 4. Heart Care */}
              <div
                onClick={() => onOpenServicesEnquiry ? onOpenServicesEnquiry() : onNavigateTab('patients')}
                className="flex flex-col items-center group cursor-pointer"
                title="Click to view Heart Care & Hypertension details"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md ring-4 ring-rose-100 group-hover:scale-105 group-hover:bg-rose-700 transition-all">
                  <Heart className="w-7 h-7 text-white stroke-[2.2] fill-white/20" />
                </div>
                <span className="mt-2.5 text-xs md:text-sm font-extrabold text-slate-800 tracking-tight leading-tight">
                  Heart<br />Care
                </span>
                <span className="text-[10px] text-rose-700 font-medium mt-0.5">Cardio & BP · ₹500</span>
              </div>

              {/* 5. Bone & Joint Care */}
              <div
                onClick={() => onOpenServicesEnquiry ? onOpenServicesEnquiry() : onNavigateTab('patients')}
                className="flex flex-col items-center group cursor-pointer col-span-2 sm:col-span-1"
                title="Click to view Bone & Joint Care details"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-4 ring-emerald-100 group-hover:scale-105 group-hover:bg-emerald-700 transition-all">
                  <Activity className="w-7 h-7 text-white stroke-[2.2]" />
                </div>
                <span className="mt-2.5 text-xs md:text-sm font-extrabold text-slate-800 tracking-tight leading-tight">
                  Bone & Joint<br />Care
                </span>
                <span className="text-[10px] text-emerald-700 font-medium mt-0.5">Orthopedics · ₹600</span>
              </div>

            </div>
          </div>

          {/* The 4 Features & "Because Your Health Matters" Callout */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* The 4 Core Feature Cards (from Poster) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto flex-1">
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 flex items-center gap-2.5 text-slate-800">
                <Users className="w-5 h-5 text-sky-700 shrink-0" />
                <span className="font-bold text-xs leading-tight">All Age Groups</span>
              </div>
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 flex items-center gap-2.5 text-slate-800">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="font-bold text-xs leading-tight">Preventive Care</span>
              </div>
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 flex items-center gap-2.5 text-slate-800">
                <ClipboardList className="w-5 h-5 text-teal-700 shrink-0" />
                <span className="font-bold text-xs leading-tight">Accurate Diagnosis</span>
              </div>
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 flex items-center gap-2.5 text-slate-800">
                <HeartHandshake className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-bold text-xs leading-tight">Personalized Treatment</span>
              </div>
            </div>

            {/* Poster Tagline Callout */}
            <div className="text-center lg:text-right shrink-0">
              <div className="font-serif italic text-xl md:text-2xl font-bold text-[#00385e] leading-none">
                Because Your Health Matters
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-rose-500 to-pink-400 rounded-full mx-auto lg:ml-auto mt-1"></div>
            </div>

          </div>

        </div>

        {/* Bottom Contact & Timings Ribbon (Dark Blue Gradient from Poster) */}
        <div className="bg-gradient-to-r from-[#002d4d] via-[#004770] to-[#002d4d] text-white px-6 py-3.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            
            {/* For Appointments Phone & WhatsApp Booking Button */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Phone className="w-4 h-4 fill-white" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <span>For Appointments & WhatsApp Bot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold font-mono text-white tracking-wide">
                    +91 98765 43210
                  </span>
                  {onOpenWhatsAppBot && (
                    <button
                      onClick={onOpenWhatsAppBot}
                      className="px-2.5 py-1 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-md text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                      title="Open WhatsApp Slot Booking Assistant"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.9-0.787-3.123-2.73-3.218-2.855-.094-.125-.768-1.021-.768-1.947 0-.925.484-1.381.656-1.569.172-.188.375-.234.5-.234.125 0 .25.002.359.006.115.004.269-.044.421.323.156.375.531 1.297.578 1.391.047.094.078.203.016.328-.063.125-.094.203-.188.312-.094.109-.198.244-.282.328-.094.094-.192.197-.083.385.109.188.484.798 1.038 1.292.714.636 1.316.834 1.504.928.188.094.297.078.406-.047.109-.125.469-.547.594-.734.125-.188.25-.156.422-.094.172.063 1.094.516 1.281.609.188.094.313.141.359.219.047.078.047.453-.097.858zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.98-1.399C8.423 21.498 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                      </svg>
                      <span>Book Slot</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-white">123, Health Care Road,</span><br />
                <span className="text-slate-300 text-[11px]">Green Park, New Delhi - 110016</span>
              </div>
            </div>

            {/* Clinic Timings */}
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-white">
                  Mon - Sat : <span className="text-amber-300">9:00 AM - 8:00 PM</span>
                </div>
                <div className="text-slate-300 text-[11px]">
                  Sunday : <span className="text-amber-200">9:00 AM - 2:00 PM</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Mint Green Strip (from Poster) */}
        <div className="bg-gradient-to-r from-[#00d285] via-[#00c9a7] to-[#00d285] text-[#00385e] py-1.5 px-4 text-center font-black tracking-widest text-[11px] uppercase select-none">
          CONSULTATION &nbsp;|&nbsp; DIAGNOSIS &nbsp;|&nbsp; TREATMENT &nbsp;|&nbsp; BETTER HEALTHIER TOMORROW
        </div>

      </div>

      {/* Operational Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Today's OPD Queue</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">{todayAppointments.length}</div>
            <div className="text-xs text-emerald-700 font-medium">9:00 AM - 8:00 PM</div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{todayAppointments.filter(a => a.status === 'Completed').length} Completed · {todayAppointments.filter(a => a.status === 'Confirmed' || a.status === 'Scheduled').length} Remaining</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigateTab('patients')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Active Patient Records</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">{patients.length}</div>
            <div className="text-xs text-sky-700 font-medium font-mono">CW-EHR</div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <span>Registered with mobile for SMS Rx</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateTab('refills')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Refills Pending Review</span>
            <Pill className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">{pendingRefills.length}</div>
            <div className="text-xs text-amber-700 font-medium">Action Required</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span>Metformin, Atorvastatin, BP meds</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateTab('prescriptions')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Prescriptions Issued</span>
            <Send className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900">{prescriptions.length}</div>
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>SMS Dispatched</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span>100% automated delivery to mobile</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Today's OPD Schedule & Clinical Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Today's Patient Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Today's General Physician OPD Schedule</span>
              </h3>
              <p className="text-xs text-slate-500">
                19 October 2026 · CareWell Consultation Rooms
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Auto-Reminders Daemon: ACTIVE</span>
              </span>

              <button
                onClick={handleSendAllTodayReminders}
                disabled={bulkSmsSending}
                className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Trigger immediate automated dispatch cycle"
              >
                {bulkSmsSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-700" />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                    <span>{bulkSmsSending ? 'Dispatched...' : 'Run Auto-Scan Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No consultations scheduled for today.
              </div>
            ) : (
              todayAppointments.map(appt => {
                const patient = patients.find(p => p.id === appt.patientId);
                return (
                  <div key={appt.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-14 text-center shrink-0">
                        <span className="block font-bold text-sm text-slate-900 font-mono">{appt.timeSlot}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Slot</span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigateTab('patients', appt.patientId)}
                            className="font-bold text-slate-900 text-sm hover:text-teal-700 text-left"
                          >
                            {formatName(appt.patientName)}
                          </button>
                          <span className="text-xs text-slate-500">
                            {appt.patientAge}y · {appt.patientGender}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          <span className="font-medium text-slate-700">{appt.type}</span>: {appt.reasonForVisit}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="font-mono text-[11px] text-slate-600 flex items-center gap-1">
                            <PhoneCall className="w-3 h-3 text-slate-400" />
                            {formatPhone(appt.patientMobile)}
                          </span>
                          <span>·</span>
                          <span className="text-slate-500">{appt.doctorName}</span>
                          {patient?.allergies && patient.allergies.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-rose-600 font-medium text-[11px]">
                                Allergy: {patient.allergies.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!appt.reminderSent ? (
                        <button
                          onClick={() => handleSendSingleReminder(appt)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                          title="Send instant SMS reminder to registered mobile"
                        >
                          <Send className="w-3 h-3 text-slate-500" />
                          <span>SMS Reminder</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>SMS Sent</span>
                        </span>
                      )}

                      <button
                        onClick={() => onOpenNewPrescription(appt.patientId)}
                        className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Pill className="w-3.5 h-3.5" />
                        <span>Prescribe</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>Clinic Timings: Mon-Sat 9AM-8PM, Sun 9AM-2PM</span>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-teal-700 font-medium hover:underline flex items-center gap-1"
            >
              <span>View Full Calendar & Follow-up Grid</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): Refill Queue & Critical Alerts */}
        <div className="space-y-6">
          
          {/* Pending Prescription Refills Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Prescription Refill Requests</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {pendingRefills.length} Pending
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingRefills.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No pending medication refills.
                </div>
              ) : (
                pendingRefills.slice(0, 3).map(refill => (
                  <div key={refill.id} className="p-4 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{formatName(refill.patientName)}</span>
                      <span className="text-[11px] text-slate-500">{refill.requestedDate}</span>
                    </div>
                    <div className="font-medium text-teal-800">
                      {refill.medicineName} ({refill.dosage})
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Refills remaining: <span className="font-semibold text-slate-700">{refill.refillsRemaining}</span> · Ph: {formatPhone(refill.patientMobile)}
                    </p>
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onNavigateTab('refills')}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs"
                      >
                        Review & Send SMS
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => onNavigateTab('refills')}
                className="text-xs text-teal-700 font-semibold hover:underline"
              >
                Manage All Refill Requests →
              </button>
            </div>
          </div>

          {/* Clinical Alerts & Chronic Patient Follow-ups */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Chronic Care & Vitals Alerts</h3>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {criticalPatients.slice(0, 3).map(p => (
                <div key={p.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onNavigateTab('patients', p.id)}
                      className="font-bold text-slate-900 hover:text-teal-700"
                    >
                      {formatName(p.firstName + ' ' + p.lastName)}
                    </button>
                    <span className="text-[10px] font-mono text-slate-500">{p.mrn}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-medium text-rose-800">Conditions: </span>
                    {p.chronicConditions.join(', ') || 'Under evaluation'}
                  </div>
                  {p.allergies.length > 0 && (
                    <div className="text-rose-700 font-medium text-[11px]">
                      ⚠️ Allergy warning: {p.allergies.join(', ')}
                    </div>
                  )}
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Follow-up: {p.nextFollowUpDate || 'None set'}</span>
                    <button
                      onClick={() => onOpenNewPrescription(p.id)}
                      className="text-teal-700 font-semibold hover:underline"
                    >
                      Quick Rx
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HIPAA & Offline Safety Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-800 mb-0.5">HIPAA Safe Exam Room Terminal</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All patient demographic viewing and prescription dispatches are cryptographically logged in the immutable audit trail.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
