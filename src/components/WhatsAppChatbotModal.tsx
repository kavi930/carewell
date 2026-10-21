/**
 * CareWell Multispeciality Clinic - WhatsApp Appointment Booking Chatbot
 * Supports both NEW PATIENT registration and EXISTING PATIENT lookup,
 * checks live slot availability, registers mobile for automated SMS Rx, and confirms bookings.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Calendar,
  Clock,
  Check,
  CheckCheck,
  Phone,
  User,
  UserPlus,
  ShieldCheck,
  Sparkles,
  MapPin,
  ChevronRight,
  RefreshCw,
  Search,
  FileText,
  Stethoscope,
  Info,
  HelpCircle
} from 'lucide-react';
import { Appointment, Patient, UserSession } from '../types/clinic';
import { StorageService } from '../services/storage';
import { SmsService } from '../services/smsService';
import { showToast } from './ToastNotification';

interface WhatsAppChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  currentUser: UserSession;
  onAppointmentBooked: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  options?: {
    label: string;
    action: () => void;
    highlight?: boolean;
    disabled?: boolean;
  }[];
  isSlotGrid?: boolean;
  availableSlots?: { time: string; available: boolean }[];
  selectedDate?: string;
  isNewPatientForm?: boolean;
}

const ALL_TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM'
];

export const WhatsAppChatbotModal: React.FC<WhatsAppChatbotModalProps> = ({
  isOpen,
  onClose,
  patients: propPatients,
  currentUser,
  onAppointmentBooked
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Patient In-Chat Registration State
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '+91 ',
    age: '30',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    reasonForVisit: 'General Consultation & Health Check'
  });

  // Booking Flow In-memory State
  const [bookingContext, setBookingContext] = useState<{
    date: string;
    slot: string;
    patientId?: string;
    patientName?: string;
    patientMobile?: string;
    patientAge?: number;
    patientGender?: 'Male' | 'Female' | 'Other';
    type: Appointment['type'];
    reason: string;
    doctorName: string;
    isNewPatient: boolean;
  }>({
    date: '2026-10-19',
    slot: '10:00 AM',
    type: 'General Consultation',
    reason: 'Clinical Consultation',
    doctorName: 'Dr. Amit Sharma (General Physician)',
    isNewPatient: false
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      initChatbot();
    }
  }, [isOpen]);

  // Calculate live slot availability for a specific date
  const getSlotAvailabilityForDate = (dateStr: string) => {
    const booked = StorageService.getAppointments(dateStr);
    const bookedSlots = booked
      .filter(a => a.status !== 'Cancelled')
      .map(a => a.timeSlot.trim());

    const isSunday = new Date(dateStr + 'T00:00:00').getDay() === 0;
    const allowedSlots = isSunday
      ? ALL_TIME_SLOTS.slice(0, 8) // 9:00 AM - 2:00 PM on Sunday
      : ALL_TIME_SLOTS;

    return allowedSlots.map(time => ({
      time,
      available: !bookedSlots.includes(time.trim())
    }));
  };

  const initChatbot = () => {
    const today = '2026-10-19';
    const tomorrow = '2026-10-20';
    const slotsToday = getSlotAvailabilityForDate(today);
    const availableCountToday = slotsToday.filter(s => s.available).length;

    const initialBotMessage: ChatMessage = {
      id: 'msg-init',
      sender: 'bot',
      text: `👋 Namaste! Welcome to *CareWell Multispeciality Clinic* WhatsApp Assistant.\n\nI can help you explore our clinical services, check doctor consultation fees & timings, and book appointments for new and registered patients.\n\n📍 *Clinic:* 123 Health Care Rd, Green Park, New Delhi\n🕒 *Timings:* Mon-Sat: 9:00 AM - 8:00 PM | Sun: 9:00 AM - 2:00 PM\n📞 *Helpline:* +91 98765 43210\n\nPlease select an option to proceed:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: [
        {
          label: `ℹ️ Enquire About Clinic Services & Fees (All 6 Specialties)`,
          action: () => handleServicesEnquiryInChat(),
          highlight: true
        },
        {
          label: `🆕 New Patient Registration (First Time Booking)`,
          action: () => handlePromptNewPatientRegistration(),
          highlight: true
        },
        {
          label: `📅 Check Available Slots for Today (${availableCountToday} Open)`,
          action: () => handleSelectDate(today)
        },
        {
          label: `📅 Check Slots for Tomorrow (20 Oct)`,
          action: () => handleSelectDate(tomorrow)
        },
        {
          label: `👤 Existing Patient Lookup (Search by Mobile)`,
          action: () => handlePromptSearchMobile()
        }
      ]
    };

    setMessages([initialBotMessage]);
    setBookingContext({
      date: '2026-10-19',
      slot: '10:00 AM',
      type: 'General Consultation',
      reason: 'Clinical Consultation',
      doctorName: 'Dr. Amit Sharma (General Physician)',
      isNewPatient: false
    });
  };

  const appendBotMessage = (
    text: string,
    options?: ChatMessage['options'],
    extra?: {
      isSlotGrid?: boolean;
      availableSlots?: { time: string; available: boolean }[];
      selectedDate?: string;
      isNewPatientForm?: boolean;
    }
  ) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options,
          ...extra
        }
      ]);
    }, 500);
  };

  // Step 1: Select Date
  const handleSelectDate = (dateStr: string) => {
    const slots = getSlotAvailabilityForDate(dateStr);
    const availableSlots = slots.filter(s => s.available);

    setBookingContext(prev => ({
      ...prev,
      date: dateStr
    }));

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `Check available slots for ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    appendBotMessage(
      `📅 *Live Slot Availability for ${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}:*\n\n` +
      `🩺 *Doctor:* Dr. Amit Sharma (General Physician)\n` +
      `🟢 *Status:* ${availableSlots.length} open slots available out of ${slots.length}.\n\n` +
      `Please tap your preferred time slot below:`,
      undefined,
      {
        isSlotGrid: true,
        availableSlots: slots,
        selectedDate: dateStr
      }
    );
  };

  // Step 2: Select Slot -> Ask: New Patient vs Existing Patient
  const handleSelectSlot = (slot: string) => {
    setBookingContext(prev => ({
      ...prev,
      slot
    }));

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `I select the ${slot} slot.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    appendBotMessage(
      `✅ Slot *${slot}* on *${bookingContext.date}* is selected!\n\n` +
      `Are you visiting CareWell Clinic for the first time as a *New Patient*, or are you an *Existing Registered Patient*?`,
      [
        {
          label: `🆕 I am a New Patient (Quick First-Time Registration)`,
          action: () => handlePromptNewPatientRegistration(),
          highlight: true
        },
        {
          label: `👤 I am an Existing Registered Patient`,
          action: () => handlePromptExistingPatientList()
        },
        {
          label: `ℹ️ Enquire About Consultation Fees & Scope`,
          action: () => handleServicesEnquiryInChat()
        },
        {
          label: `🔄 Pick a different time slot`,
          action: () => handleSelectDate(bookingContext.date)
        }
      ]
    );
  };

  // New Patient Registration Option
  const handlePromptNewPatientRegistration = () => {
    setBookingContext(prev => ({ ...prev, isNewPatient: true }));

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `I want to register as a New Patient.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    appendBotMessage(
      `📝 *New Patient Registration Form*\n\n` +
      `Welcome to CareWell Clinic! Please enter your details below. Your registered mobile number will receive automatic prescription dosages and appointment reminders via SMS.`,
      undefined,
      { isNewPatientForm: true }
    );
  };

  // Submit New Patient In-Chat Form
  const handleSubmitNewPatientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientForm.firstName.trim()) {
      showToast('Please enter your first name.', 'warning');
      return;
    }
    if (!newPatientForm.mobileNumber.trim() || newPatientForm.mobileNumber.trim().length < 8) {
      showToast('Please enter a valid mobile number for automated SMS notifications.', 'warning');
      return;
    }

    const currentPatients = StorageService.getPatients();
    const nextNum = 100 + currentPatients.length + 1;
    const mrn = `CW-2026-0${nextNum}`;
    const newPatId = `pat-${Date.now()}`;

    const createdPatient: Patient = {
      id: newPatId,
      mrn,
      firstName: newPatientForm.firstName.trim(),
      lastName: newPatientForm.lastName.trim() || '',
      mobileNumber: newPatientForm.mobileNumber.trim(),
      email: '',
      age: Number(newPatientForm.age) || 30,
      gender: newPatientForm.gender,
      bloodGroup: 'B+',
      address: 'Green Park, New Delhi',
      emergencyContact: {
        name: newPatientForm.firstName.trim() + ' Family',
        relationship: 'Family',
        phone: newPatientForm.mobileNumber.trim()
      },
      allergies: [],
      chronicConditions: [],
      pastMedicalHistory: [],
      registeredDate: '2026-10-19',
      lastVisitDate: '2026-10-19',
      nextFollowUpDate: bookingContext.date,
      totalVisits: 1,
      status: 'Active'
    };

    // Save newly created patient into persistent EHR storage
    StorageService.savePatient(createdPatient);
    StorageService.logAudit(
      'PATIENT_REGISTERED',
      `New patient registered via WhatsApp Chatbot: ${createdPatient.firstName} ${createdPatient.lastName} (${createdPatient.mobileNumber}, MRN: ${mrn})`,
      createdPatient.id,
      createdPatient.mrn
    );

    setBookingContext(prev => ({
      ...prev,
      patientId: createdPatient.id,
      patientName: `${createdPatient.firstName} ${createdPatient.lastName}`.trim(),
      patientMobile: createdPatient.mobileNumber,
      patientAge: createdPatient.age,
      patientGender: createdPatient.gender,
      reason: newPatientForm.reasonForVisit
    }));

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `Submitted Details: ${createdPatient.firstName} ${createdPatient.lastName}, Mobile: ${createdPatient.mobileNumber}, Age: ${createdPatient.age}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Present final confirmation summary with 100% accurate information
    appendBotMessage(
      `🎉 *New Patient Profile Created Successfully!*\n\n` +
      `📋 *APPOINTMENT SUMMARY FOR CONFIRMATION:*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Patient:* ${createdPatient.firstName} ${createdPatient.lastName}\n` +
      `🔖 *Medical Record No (MRN):* ${mrn}\n` +
      `📱 *Registered Mobile:* ${createdPatient.mobileNumber}\n` +
      `🩺 *Consulting Physician:* ${bookingContext.doctorName}\n` +
      `📅 *Date:* ${bookingContext.date}\n` +
      `⏰ *Time Slot:* ${bookingContext.slot}\n` +
      `🏥 *Clinic Location:* 123 Health Care Road, Green Park, New Delhi - 110016\n` +
      `💬 *Chief Complaint:* ${newPatientForm.reasonForVisit}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `An automated SMS will be sent immediately to *${createdPatient.mobileNumber}*. Tap below to confirm:`,
      [
        {
          label: `✅ Confirm & Book Appointment Now`,
          action: () => handleFinalizeBooking(createdPatient),
          highlight: true
        },
        {
          label: `🔄 Change Time Slot`,
          action: () => handleSelectDate(bookingContext.date)
        }
      ]
    );
  };

  // Existing Patient Options
  const handlePromptExistingPatientList = () => {
    const currentPatients = StorageService.getPatients();

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `I am an existing patient.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const patientOptions = currentPatients.map(p => ({
      label: `👤 ${p.firstName} ${p.lastName} (${p.mobileNumber})`,
      action: () => handleSelectExistingPatient(p)
    }));

    patientOptions.push({
      label: `🆕 I am not in this list (Register as New Patient)`,
      action: () => handlePromptNewPatientRegistration()
    });

    appendBotMessage(
      `👤 *Select your existing patient profile:*\n\n` +
      `Tap your name below or type your 10-digit mobile number in the chat:`,
      patientOptions
    );
  };

  const handleSelectExistingPatient = (patient: Patient) => {
    setBookingContext(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMobile: patient.mobileNumber,
      patientAge: patient.age,
      patientGender: patient.gender,
      reason: 'Routine Follow-up & Consultation',
      isNewPatient: false
    }));

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `Book for ${patient.firstName} ${patient.lastName} (${patient.mobileNumber})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    appendBotMessage(
      `📋 *CONFIRM APPOINTMENT DETAILS:*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Patient:* ${patient.firstName} ${patient.lastName} (${patient.age}y / ${patient.gender})\n` +
      `🔖 *MRN:* ${patient.mrn}\n` +
      `📱 *Registered Mobile:* ${patient.mobileNumber}\n` +
      `🩺 *Doctor:* ${bookingContext.doctorName}\n` +
      `📅 *Date:* ${bookingContext.date}\n` +
      `⏰ *Time Slot:* ${bookingContext.slot}\n` +
      `🏥 *Clinic Address:* 123 Health Care Road, Green Park, New Delhi - 110016\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Shall I confirm this slot and dispatch your automated SMS reminder?`,
      [
        {
          label: `✅ Confirm & Book Appointment`,
          action: () => handleFinalizeBooking(patient),
          highlight: true
        },
        {
          label: `🔄 Pick a different slot`,
          action: () => handleSelectDate(bookingContext.date)
        }
      ]
    );
  };

  // Finalize booking into EHR Storage and dispatch SMS
  const handleFinalizeBooking = async (patient: Patient) => {
    const apptId = `apt-${Date.now()}`;
    const apptNumber = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAppt: Appointment = {
      id: apptId,
      appointmentNumber: apptNumber,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMobile: patient.mobileNumber,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId: currentUser.id || 'DOC-01',
      doctorName: 'Dr. Amit Sharma',
      date: bookingContext.date,
      timeSlot: bookingContext.slot,
      type: bookingContext.isNewPatient ? 'General Consultation' : 'Follow-up',
      status: 'Confirmed',
      reasonForVisit: bookingContext.reason || 'Booked via WhatsApp Assistant',
      notes: `Automated booking via CareWell WhatsApp Assistant for ${bookingContext.isNewPatient ? 'New Patient' : 'Follow-up'}.`,
      reminderSent: true,
      reminderSentAt: new Date().toISOString(),
      reminderStatus: 'Delivered'
    };

    // Save into EHR persistent records
    StorageService.saveAppointment(newAppt);
    StorageService.logAudit(
      'APPOINTMENT_SCHEDULED',
      `Confirmed appointment ${apptNumber} for ${newAppt.patientName} (${newAppt.patientMobile}) on ${newAppt.date} at ${newAppt.timeSlot} via WhatsApp Assistant`,
      patient.id,
      patient.mrn
    );

    // Update patient next follow-up date
    patient.nextFollowUpDate = newAppt.date;
    StorageService.savePatient(patient);

    // Dispatch automated confirmation SMS to patient's registered mobile number!
    const smsContent = SmsService.generateAppointmentReminderText(newAppt);
    await SmsService.dispatchSms({
      mobileNumber: patient.mobileNumber,
      patientName: newAppt.patientName,
      messageType: 'APPOINTMENT_REMINDER',
      text: smsContent
    });

    onAppointmentBooked();

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `Confirm booking`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    appendBotMessage(
      `🎉 *BOOKING OFFICIALLY CONFIRMED!* 🎉\n\n` +
      `Your appointment has been registered in the CareWell Clinic EHR system:\n\n` +
      `🔖 *Appointment ID:* ${apptNumber}\n` +
      `👤 *Patient:* ${patient.firstName} ${patient.lastName} (${patient.mrn})\n` +
      `📅 *Date:* ${newAppt.date} (${new Date(newAppt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })})\n` +
      `⏰ *Time Slot:* ${newAppt.timeSlot}\n` +
      `🩺 *Doctor:* Dr. Amit Sharma (General Physician, MD)\n` +
      `📍 *Clinic:* 123, Health Care Road, Green Park, New Delhi - 110016\n` +
      `📞 *Clinic Contact:* +91 98765 43210\n\n` +
      `📲 *Automated SMS Alert Sent:* A formal confirmation SMS with directions has been dispatched to *${patient.mobileNumber}*.\n\n` +
      `What would you like to do next?`,
      [
        {
          label: `📅 Book Another Appointment`,
          action: () => initChatbot()
        },
        {
          label: `📋 View My Existing Bookings`,
          action: () => handleShowMyBookings()
        },
        {
          label: `📲 Open Live SMS Phone Simulator`,
          action: () => {
            onClose();
          }
        }
      ]
    );
  };

  const handlePromptSearchMobile = () => {
    appendBotMessage(
      `🔍 *Search by Registered Mobile Number:*\n\n` +
      `Please type your 10-digit mobile number in the message input box below (e.g. *98101 23456*), and I will look up your record instantly.`
    );
  };

  const handleServicesEnquiryInChat = () => {
    appendBotMessage(
      `🏥 *CAREWELL CLINICAL SERVICES & DOCTOR DIRECTORY:*\n` +
      `_"Your Health Our Priority" · 123 Health Care Rd, Green Park, New Delhi_\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `1️⃣ *General Physician OPD* — Dr. Amit Sharma (MBBS, MD)\n` +
      `   • Viral fevers, seasonal infections, dengue, typhoid, cough, asthma\n` +
      `   • Consultation Fee: *₹500* (OPD Room 1)\n\n` +
      `2️⃣ *Hypertension & Diabetes Mellitus Clinic*\n` +
      `   • Blood pressure, HbA1c control, organ protection, diet plan\n` +
      `   • Consultation Fee: *₹500* (Includes complimentary BP & blood glucose check)\n\n` +
      `3️⃣ *Child Care (Pediatrics)* — Dr. Kavita Verma (MBBS, DCH, MD)\n` +
      `   • National Immunization Schedule vaccines, child health, nebulization\n` +
      `   • Consultation Fee: *₹600* (OPD Room 2)\n\n` +
      `4️⃣ *Women's Health & Wellness* — Dr. Kavita Verma (MD)\n` +
      `   • PCOS/PCOD, thyroid disorders, anemia screening, hormonal balance\n` +
      `   • Consultation Fee: *₹600*\n\n` +
      `5️⃣ *Bone & Joint Care (Orthopedic OPD)*\n` +
      `   • Osteoarthritis, knee & back pain, uric acid/gout, posture therapy\n` +
      `   • Consultation Fee: *₹600*\n\n` +
      `6️⃣ *Digital ECG & Day-Care Diagnostics*\n` +
      `   • On-site 12-lead ECG (*₹300*), Glucometer (*₹50*), Nebulizer session (*₹200*)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🕒 *Timings:* Mon - Sat: 9:00 AM - 8:00 PM | Sun: 9:00 AM - 2:00 PM\n` +
      `📞 *Appointments Helpline:* +91 98765 43210\n\n` +
      `Select a department below for full treatment scope or book your slot:`,
      [
        {
          label: `📅 Book Available Consultation Slot`,
          action: () => handleSelectDate('2026-10-19'),
          highlight: true
        },
        {
          label: `🆕 Register as New Patient`,
          action: () => handlePromptNewPatientRegistration(),
          highlight: true
        },
        {
          label: `🩺 General Physician (Dr. Amit Sharma - ₹500)`,
          action: () => handleDetailGeneralPhysician()
        },
        {
          label: `👶 Child Care & Vaccines (Dr. Kavita Verma - ₹600)`,
          action: () => handleDetailPediatrics()
        },
        {
          label: `🌸 Women's Health & PCOS (Dr. Kavita Verma - ₹600)`,
          action: () => handleDetailWomensHealth()
        },
        {
          label: `🦴 Bone & Joint Care (₹600)`,
          action: () => handleDetailJoints()
        },
        {
          label: `⚡ Digital ECG & Diagnostics (₹300)`,
          action: () => handleDetailDiagnostics()
        }
      ]
    );
  };

  const handleDetailGeneralPhysician = () => {
    appendBotMessage(
      `🩺 *General Physician & Acute Care Details:*\n\n` +
      `👨‍⚕️ *Physician:* Dr. Amit Sharma (MBBS, MD - General Medicine)\n` +
      `💰 *Consultation Fee:* ₹500\n` +
      `🕒 *OPD Timings:* Mon - Sat (9:00 AM - 8:00 PM) · OPD Room 1\n` +
      `📋 *Clinical Scope:*\n` +
      `• High viral fevers, typhoid, dengue, seasonal malaria\n` +
      `• Acute bronchitis, asthma wheezing & nebulization\n` +
      `• Gastrointestinal infections, reflux, migraine\n` +
      `• Automated SMS prescriptions with precise medicine dosages\n` +
      `🧪 *Diagnostics:* Dengue NS1, Typhoid Serology, Complete Blood Count, Urine Routine.\n\n` +
      `Would you like to book a slot with Dr. Amit Sharma?`,
      [
        {
          label: `📅 Book Slot with Dr. Amit Sharma`,
          action: () => {
            setBookingContext(prev => ({
              ...prev,
              doctorName: 'Dr. Amit Sharma (General Physician)',
              type: 'General Consultation',
              reason: 'General Physician Consultation'
            }));
            handleSelectDate('2026-10-19');
          },
          highlight: true
        },
        {
          label: `🆕 Register as New Patient`,
          action: () => handlePromptNewPatientRegistration()
        },
        {
          label: `🔙 Back to All Services`,
          action: () => handleServicesEnquiryInChat()
        }
      ]
    );
  };

  const handleDetailPediatrics = () => {
    appendBotMessage(
      `👶 *Child Care & Pediatrics Details:*\n\n` +
      `👩‍⚕️ *Pediatrician:* Dr. Kavita Verma (MBBS, DCH, MD - Pediatrics)\n` +
      `💰 *Consultation Fee:* ₹600\n` +
      `🕒 *Timings:* Mon - Sat (10:00 AM - 6:00 PM) · OPD Room 2\n` +
      `📋 *Services Included:*\n` +
      `• National Immunization Schedule vaccines (Birth to 16 years)\n` +
      `• Growth & developmental milestone assessment\n` +
      `• Pediatric asthma & respiratory allergy care\n` +
      `• Childhood nutrition and feeding guidance\n` +
      `💉 *Vaccinations Available:* BCG, OPV, Pentavalent, Rotavirus, MMR, Typhoid Conjugate, Influenza.\n\n` +
      `Would you like to book a pediatric appointment?`,
      [
        {
          label: `📅 Book Pediatric Slot with Dr. Kavita Verma`,
          action: () => {
            setBookingContext(prev => ({
              ...prev,
              doctorName: 'Dr. Kavita Verma (Pediatrics & Child Care)',
              type: 'General Consultation',
              reason: 'Pediatric Care & Child Immunization'
            }));
            handleSelectDate('2026-10-19');
          },
          highlight: true
        },
        {
          label: `🆕 Register Child as New Patient`,
          action: () => handlePromptNewPatientRegistration()
        },
        {
          label: `🔙 Back to All Services`,
          action: () => handleServicesEnquiryInChat()
        }
      ]
    );
  };

  const handleDetailWomensHealth = () => {
    appendBotMessage(
      `🌸 *Women's Health & Wellness Clinic Details:*\n\n` +
      `👩‍⚕️ *Physician:* Dr. Kavita Verma (MD)\n` +
      `💰 *Consultation Fee:* ₹600\n` +
      `🕒 *Timings:* Mon - Sat (10:00 AM - 6:00 PM)\n` +
      `📋 *Services Included:*\n` +
      `• PCOS/PCOD metabolic balancing & menstrual regularity\n` +
      `• Hypothyroidism & hyperthyroidism stabilization\n` +
      `• Anemia screening & therapeutic iron protocols\n` +
      `• Perimenopause and postmenopausal guidance\n` +
      `🧪 *Diagnostic Support:* TSH, Free T3/T4, Ferritin, Pelvic Ultrasound Referral.\n\n` +
      `Would you like to schedule an appointment?`,
      [
        {
          label: `📅 Book Women's Health Slot`,
          action: () => {
            setBookingContext(prev => ({
              ...prev,
              doctorName: 'Dr. Kavita Verma (Women\'s Health)',
              type: 'General Consultation',
              reason: 'Women\'s Health & Wellness Consultation'
            }));
            handleSelectDate('2026-10-19');
          },
          highlight: true
        },
        {
          label: `🆕 Register as New Patient`,
          action: () => handlePromptNewPatientRegistration()
        },
        {
          label: `🔙 Back to All Services`,
          action: () => handleServicesEnquiryInChat()
        }
      ]
    );
  };

  const handleDetailJoints = () => {
    appendBotMessage(
      `🦴 *Bone & Joint Care Details:*\n\n` +
      `👨‍⚕️ *Consultant:* Dr. Amit Sharma / Visiting Orthopedic Specialist\n` +
      `💰 *Consultation Fee:* ₹600\n` +
      `📋 *Clinical Scope:*\n` +
      `• Knee and hip osteoarthritis non-surgical care\n` +
      `• Bone mineral density (osteoporosis) evaluation\n` +
      `• Cervical and lumbar posture therapy recommendations\n` +
      `• Uric acid & acute gout flare-up management\n` +
      `🧪 *Diagnostics:* Digital X-Ray Referrals, Serum Uric Acid, Calcium & Vitamin D3.\n\n` +
      `Would you like to book a bone and joint consultation?`,
      [
        {
          label: `📅 Book Bone & Joint Slot`,
          action: () => {
            setBookingContext(prev => ({
              ...prev,
              doctorName: 'Dr. Amit Sharma (Bone & Joint Care)',
              type: 'General Consultation',
              reason: 'Joint and Musculoskeletal Consultation'
            }));
            handleSelectDate('2026-10-19');
          },
          highlight: true
        },
        {
          label: `🆕 Register as New Patient`,
          action: () => handlePromptNewPatientRegistration()
        },
        {
          label: `🔙 Back to All Services`,
          action: () => handleServicesEnquiryInChat()
        }
      ]
    );
  };

  const handleDetailDiagnostics = () => {
    appendBotMessage(
      `⚡ *Digital ECG & In-Clinic Diagnostics:*\n\n` +
      `🔬 *Available On-Site Tests & Day-Care:*\n` +
      `• 12-Lead Digital ECG: *₹300* (Instant report interpretation by physician)\n` +
      `• Random Blood Sugar (Glucometer): *₹50*\n` +
      `• Oxygen Saturation (SpO2) & Blood Pressure: *Free with consultation*\n` +
      `• In-Clinic Nebulizer session: *₹200*\n` +
      `• Sterile wound dressing & bandage: *₹250*\n\n` +
      `Walk-ins are welcome for emergency ECG or glucose checks during clinic hours!`,
      [
        {
          label: `📅 Book Consultation with ECG`,
          action: () => handleSelectDate('2026-10-19'),
          highlight: true
        },
        {
          label: `🔙 Back to All Services`,
          action: () => handleServicesEnquiryInChat()
        }
      ]
    );
  };

  const handleShowClinicInfo = () => {
    handleServicesEnquiryInChat();
  };

  const handleShowMyBookings = () => {
    const all = StorageService.getAppointments();
    const upcoming = all.filter(a => a.status !== 'Cancelled').slice(0, 4);

    if (upcoming.length === 0) {
      appendBotMessage(`You currently have no scheduled appointments. Would you like to book one now?`, [
        { label: `📅 Book a Slot`, action: () => handleSelectDate('2026-10-19'), highlight: true }
      ]);
      return;
    }

    const listText = upcoming
      .map(
        (a, i) =>
          `${i + 1}. *${a.patientName}* (Ref: ${a.appointmentNumber})\n   📅 ${a.date} at *${a.timeSlot}*\n   🩺 Doctor: ${a.doctorName}\n   Status: ${a.status}`
      )
      .join('\n\n');

    appendBotMessage(`📋 *Upcoming Appointments at CareWell Clinic:* \n\n${listText}`, [
      { label: `📅 Book Another Slot`, action: () => handleSelectDate('2026-10-19'), highlight: true },
      { label: `🆕 New Patient Registration`, action: () => handlePromptNewPatientRegistration() }
    ]);
  };

  // Natural Language & Mobile Search Handler
  const handleUserSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const query = inputText.trim();
    setInputText('');

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const lower = query.toLowerCase();
    const cleanDigits = query.replace(/\D/g, '');

    // Check if user entered a phone number
    if (cleanDigits.length >= 8) {
      const allPatients = StorageService.getPatients();
      const match = allPatients.find(p => p.mobileNumber.replace(/\D/g, '').includes(cleanDigits));

      if (match) {
        appendBotMessage(
          `🔍 *Record Found!*\n\n` +
          `👤 *Patient:* ${match.firstName} ${match.lastName}\n` +
          `🔖 *MRN:* ${match.mrn}\n` +
          `📱 *Mobile:* ${match.mobileNumber}\n\n` +
          `Would you like to book a slot for ${match.firstName}?`,
          [
            {
              label: `📅 Book Slot for ${match.firstName}`,
              action: () => {
                setBookingContext(prev => ({
                  ...prev,
                  patientId: match.id,
                  patientName: `${match.firstName} ${match.lastName}`,
                  patientMobile: match.mobileNumber,
                  patientAge: match.age,
                  patientGender: match.gender,
                  isNewPatient: false
                }));
                handleSelectDate(bookingContext.date || '2026-10-19');
              },
              highlight: true
            },
            {
              label: `🆕 Register as a Different / New Patient`,
              action: () => handlePromptNewPatientRegistration()
            }
          ]
        );
        return;
      } else {
        appendBotMessage(
          `⚠️ We could not find an existing patient record matching "*${query}*".\n\n` +
          `Since this number is not registered yet, would you like to register as a *New Patient*?`,
          [
            {
              label: `🆕 Register as New Patient`,
              action: () => {
                setNewPatientForm(prev => ({ ...prev, mobileNumber: query }));
                handlePromptNewPatientRegistration();
              },
              highlight: true
            },
            {
              label: `👤 Pick from Existing Patient List`,
              action: () => handlePromptExistingPatientList()
            }
          ]
        );
        return;
      }
    }

    // Keyword detection
    if (lower.includes('service') || lower.includes('enquiry') || lower.includes('inquiry') || lower.includes('fee') || lower.includes('cost') || lower.includes('price') || lower.includes('charge') || lower.includes('treatment') || lower.includes('scope')) {
      handleServicesEnquiryInChat();
    } else if (lower.includes('child') || lower.includes('pediatric') || lower.includes('vaccin') || lower.includes('baby') || lower.includes('infant')) {
      handleDetailPediatrics();
    } else if (lower.includes('women') || lower.includes('female') || lower.includes('pcos') || lower.includes('pcod') || lower.includes('period') || lower.includes('pregnancy')) {
      handleDetailWomensHealth();
    } else if (lower.includes('joint') || lower.includes('bone') || lower.includes('ortho') || lower.includes('knee') || lower.includes('arthritis') || lower.includes('back pain')) {
      handleDetailJoints();
    } else if (lower.includes('ecg') || lower.includes('glucose') || lower.includes('sugar') || lower.includes('test') || lower.includes('lab') || lower.includes('diagnostic')) {
      handleDetailDiagnostics();
    } else if (lower.includes('general') || lower.includes('fever') || lower.includes('cough') || lower.includes('cold') || lower.includes('dengue') || lower.includes('typhoid') || lower.includes('dr amit') || lower.includes('amit sharma')) {
      handleDetailGeneralPhysician();
    } else if (lower.includes('doctor') || lower.includes('specialist') || lower.includes('kavita') || lower.includes('sharma')) {
      handleServicesEnquiryInChat();
    } else if (lower.includes('new') || lower.includes('register') || lower.includes('first time') || lower.includes('fresh')) {
      handlePromptNewPatientRegistration();
    } else if (lower.includes('existing') || lower.includes('old') || lower.includes('already') || lower.includes('previous')) {
      handlePromptExistingPatientList();
    } else if (lower.includes('today') || lower.includes('now')) {
      handleSelectDate('2026-10-19');
    } else if (lower.includes('tomorrow')) {
      handleSelectDate('2026-10-20');
    } else if (lower.includes('slot') || lower.includes('book') || lower.includes('appointment')) {
      handleSelectDate('2026-10-19');
    } else if (lower.includes('time') || lower.includes('timing') || lower.includes('hour') || lower.includes('open')) {
      handleServicesEnquiryInChat();
    } else {
      appendBotMessage(
        `I understand you're inquiring: "${query}".\n\nHow can I help you right now?`,
        [
          { label: `ℹ️ Enquire About Services & Fees`, action: () => handleServicesEnquiryInChat(), highlight: true },
          { label: `🆕 I am a New Patient`, action: () => handlePromptNewPatientRegistration(), highlight: true },
          { label: `📅 Book Available Slot for Today`, action: () => handleSelectDate('2026-10-19') },
          { label: `👤 I am an Existing Patient`, action: () => handlePromptExistingPatientList() }
        ]
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#efeae2] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col h-[680px] max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* WhatsApp Top Bar */}
        <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            {/* CareWell Clinic DP */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white text-[#004b75] font-black flex items-center justify-center text-sm shadow-xs border-2 border-emerald-400">
                CW
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#075e54]"></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
                <span>CareWell Clinic</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </span>
              </div>
              <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                <span>Official Booking Assistant ·</span>
                <span className="text-white font-mono font-medium">+91 98765 43210</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={initChatbot}
              className="p-1.5 rounded-full hover:bg-white/15 text-white/90 hover:text-white transition-colors"
              title="Restart Conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/15 text-white/90 hover:text-white transition-colors"
              title="Close WhatsApp"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* End-to-End Encryption Notice Banner */}
        <div className="bg-[#ffeecd] border-b border-[#ffe2a8] px-3 py-1 text-center text-[10px] text-amber-900 flex items-center justify-center gap-1 shrink-0 font-medium">
          <ShieldCheck className="w-3 h-3 text-amber-800" />
          <span>Messages are end-to-end encrypted. CareWell EHR Slot Gateway active.</span>
        </div>

        {/* Direct Action Switcher Bar: New Patient | Existing Patient | Services Enquiry */}
        <div className="bg-[#f0f2f5] border-b border-slate-300 px-3 py-2 flex items-center justify-between gap-1.5 text-xs font-semibold shrink-0">
          <button
            onClick={handlePromptNewPatientRegistration}
            className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-teal-900 hover:bg-emerald-50 flex items-center justify-center gap-1 shadow-xs transition-all text-[11px]"
            title="Register as a first-time patient"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>🆕 New Patient</span>
          </button>
          <button
            onClick={handlePromptExistingPatientList}
            className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 shadow-xs transition-all text-[11px]"
            title="Book for an existing registered patient"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>👤 Existing</span>
          </button>
          <button
            onClick={handleServicesEnquiryInChat}
            className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-sky-300 hover:border-sky-500 text-sky-900 hover:bg-sky-50 flex items-center justify-center gap-1 shadow-xs transition-all text-[11px]"
            title="Enquire about clinic services, consultation fees & doctor timings"
          >
            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
            <span>ℹ️ Services & Fees</span>
          </button>
        </div>

        {/* Chat Conversation Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          
          {/* Timestamp Pill */}
          <div className="text-center my-1">
            <span className="bg-white/90 text-slate-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
              TODAY
            </span>
          </div>

          {messages.map(msg => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs shadow-xs relative leading-relaxed whitespace-pre-line ${
                    isBot
                      ? 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/60'
                      : 'bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-[#c4f3bd]'
                  }`}
                >
                  <div>{msg.text}</div>

                  {/* Interactive Slot Grid inside message if active */}
                  {msg.isSlotGrid && msg.availableSlots && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                        <span>Select an Available Time Slot:</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          {msg.availableSlots.filter(s => s.available).length} Open
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-50/80 rounded-lg border border-slate-200">
                        {msg.availableSlots.map(slot => (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => handleSelectSlot(slot.time)}
                            className={`px-2 py-1.5 rounded text-[11px] font-semibold transition-all flex items-center justify-between ${
                              slot.available
                                ? 'bg-white border border-emerald-500 text-emerald-800 hover:bg-emerald-600 hover:text-white shadow-xs cursor-pointer'
                                : 'bg-slate-200/80 text-slate-400 border border-slate-200 cursor-not-allowed line-through'
                            }`}
                          >
                            <span>{slot.time}</span>
                            {slot.available ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <span className="text-[9px] text-slate-400">Booked</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Patient Registration In-Chat Form */}
                  {msg.isNewPatientForm && (
                    <div className="mt-3 pt-3 border-t border-slate-200 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 text-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-2 text-xs">
                        <UserPlus className="w-4 h-4 text-emerald-700" />
                        <span>New Patient Registration Form</span>
                      </div>

                      <form onSubmit={handleSubmitNewPatientForm} className="space-y-2.5 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">First Name *</label>
                            <input
                              type="text"
                              required
                              value={newPatientForm.firstName}
                              onChange={e => setNewPatientForm({ ...newPatientForm, firstName: e.target.value })}
                              placeholder="e.g. Vikram"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Last Name</label>
                            <input
                              type="text"
                              value={newPatientForm.lastName}
                              onChange={e => setNewPatientForm({ ...newPatientForm, lastName: e.target.value })}
                              placeholder="e.g. Malhotra"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-emerald-950 mb-0.5">
                            Registered Mobile Number (for SMS Prescriptions & Reminders) *
                          </label>
                          <input
                            type="tel"
                            required
                            value={newPatientForm.mobileNumber}
                            onChange={e => setNewPatientForm({ ...newPatientForm, mobileNumber: e.target.value })}
                            placeholder="+91 98765 00000"
                            className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Age</label>
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={newPatientForm.age}
                              onChange={e => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Gender</label>
                            <select
                              value={newPatientForm.gender}
                              onChange={e => setNewPatientForm({ ...newPatientForm, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600 font-medium"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Reason for Visit / Symptoms</label>
                          <input
                            type="text"
                            value={newPatientForm.reasonForVisit}
                            onChange={e => setNewPatientForm({ ...newPatientForm, reasonForVisit: e.target.value })}
                            placeholder="e.g. Blood pressure review, fever, health checkup"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div className="pt-1.5">
                          <button
                            type="submit"
                            className="w-full py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Save Profile & Confirm {bookingContext.slot} Slot</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* WhatsApp Quick Reply Options Chips */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={opt.action}
                          disabled={opt.disabled}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                            opt.highlight
                              ? 'bg-[#25D366] text-white hover:bg-[#128C7E] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Read Receipts */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {!isBot && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl text-slate-400 text-xs w-20 shadow-xs border border-slate-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-2.5 bg-[#f0f2f5] border-t border-slate-300 shrink-0">
          <form onSubmit={handleUserSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type mobile number, 'new patient', or ask question..."
              className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#25D366] text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-[#075e54] hover:bg-[#128C7E] text-white flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-center text-slate-500 mt-1">
            Real-time OPD Slot Engine · Auto-syncs with CareWell EHR appointments
          </div>
        </div>

      </div>
    </div>
  );
};
