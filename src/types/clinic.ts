/**
 * CareWell Multispeciality Clinic - Types
 * HIPAA-compliant General Physician Practice Suite
 */

export type Role = 'physician' | 'nurse' | 'receptionist' | 'admin';

export interface UserSession {
  id: string;
  name: string;
  role: Role;
  licenseNumber: string;
  email: string;
  avatarColor: string;
}

export interface VitalSignRecord {
  id: string;
  patientId: string;
  recordedAt: string;
  recordedBy: string;
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  heartRate: number; // bpm
  spo2: number; // %
  temperature: number; // °F
  bloodGlucose?: number; // mg/dL
  bmi: number;
  weightKg: number;
  heightCm: number;
  notes?: string;
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  dosage: string; // e.g. "500 mg"
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Inhaler' | 'Drops';
  frequency: string; // e.g. "1-0-1 (Morning & Night)"
  timing: 'Before Food' | 'After Food' | 'With Food' | 'At Bedtime' | 'As Needed';
  durationDays: number;
  instructions: string; // e.g. "Drink plenty of warm water"
  quantity: number;
  refillsAllowed: number;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string; // e.g. "RX-2026-1042"
  patientId: string;
  patientName: string;
  patientMobile: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  symptoms: string[];
  medicines: PrescriptionMedicine[];
  advice: string;
  followUpDate: string;
  smsNotification: {
    status: 'unsent' | 'queued' | 'sent' | 'delivered';
    sentAt?: string;
    deliveredAt?: string;
    messagePreview: string;
    messageId?: string;
    recipientMobile: string;
  };
  signatureVerified: boolean;
}

export interface RefillRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  medicineName: string;
  dosage: string;
  prescribedDate: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  refillsRemaining: number;
  physicianNotes?: string;
  lastUpdated: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  type: 'General Consultation' | 'Follow-up' | 'Chronic Care Review' | 'Prescription Refill' | 'Urgent Care';
  status: 'Scheduled' | 'Confirmed' | 'In Consultation' | 'Completed' | 'Cancelled' | 'Follow-up Needed';
  reasonForVisit: string;
  notes?: string;
  reminderSent: boolean;
  reminderSentAt?: string;
  reminderStatus?: 'Delivered' | 'Pending' | 'Failed';
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number e.g. "CW-2026-0042"
  firstName: string;
  lastName: string;
  mobileNumber: string; // Registered primary mobile for SMS notifications
  email?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: string[];
  chronicConditions: string[];
  pastMedicalHistory: string[];
  registeredDate: string;
  lastVisitDate?: string;
  nextFollowUpDate?: string;
  totalVisits: number;
  status: 'Active' | 'Discharged' | 'Critical Follow-up';
}

export interface SecureMessage {
  id: string;
  channel: 'patient' | 'internal_staff';
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  timestamp: string;
  content: string; // Plaintext when decrypted
  encryptedCipher: string; // Simulated/real AES-256-GCM cipher
  encryptionAlgorithm: 'AES-GCM-256';
  keyFingerprint: string;
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
  isRead: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: 
    | 'PATIENT_RECORD_VIEWED'
    | 'PATIENT_REGISTERED'
    | 'PATIENT_UPDATED'
    | 'PRESCRIPTION_CREATED'
    | 'PRESCRIPTION_SMS_DISPATCHED'
    | 'APPOINTMENT_SCHEDULED'
    | 'FOLLOWUP_SCHEDULED'
    | 'REFILL_REQUEST_APPROVED'
    | 'REFILL_REQUEST_REJECTED'
    | 'SECURE_MESSAGE_SENT'
    | 'AUDIT_LOG_EXPORTED'
    | 'OFFLINE_CACHE_SYNCED'
    | 'TERMINAL_LOCKED'
    | 'TERMINAL_UNLOCKED';
  details: string;
  patientId?: string;
  patientMrn?: string;
  terminalIp: string;
}

export interface ClinicStats {
  totalPatients: number;
  todayAppointments: number;
  pendingRefills: number;
  scheduledFollowUps: number;
  smsSentToday: number;
  adherenceRate: number;
}
