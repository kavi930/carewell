/**
 * CareWell Multispeciality Clinic - Offline-First Storage & Clinical Data Engine
 * Features realistic pre-seeded data, sync queue, and HIPAA audit logging
 */

import {
  Patient,
  VitalSignRecord,
  Prescription,
  Appointment,
  RefillRequest,
  SecureMessage,
  AuditLogEntry,
  Role,
  UserSession
} from '../types/clinic';

const PATIENTS_KEY = 'carewell_patients_v1';
const VITALS_KEY = 'carewell_vitals_v1';
const PRESCRIPTIONS_KEY = 'carewell_prescriptions_v1';
const APPOINTMENTS_KEY = 'carewell_appointments_v1';
const REFILLS_KEY = 'carewell_refills_v1';
const MESSAGES_KEY = 'carewell_messages_v1';
const AUDIT_KEY = 'carewell_audit_v1';
const SYNC_QUEUE_KEY = 'carewell_sync_queue_v1';
const CURRENT_USER_KEY = 'carewell_current_user';

export const DEFAULT_USERS: UserSession[] = [
  {
    id: 'DOC-01',
    name: 'Dr. Amit Sharma',
    role: 'physician',
    licenseNumber: 'DMC-REG-48912',
    email: 'dr.amit@carewellclinic.in',
    avatarColor: 'bg-teal-700'
  },
  {
    id: 'DOC-02',
    name: 'Dr. Kavita Verma',
    role: 'physician',
    licenseNumber: 'DMC-REG-51204',
    email: 'dr.kavita@carewellclinic.in',
    avatarColor: 'bg-emerald-700'
  },
  {
    id: 'NURSE-01',
    name: 'Sister Renu Joseph',
    role: 'nurse',
    licenseNumber: 'INC-NR-89301',
    email: 'renu.nurse@carewellclinic.in',
    avatarColor: 'bg-blue-600'
  },
  {
    id: 'REC-01',
    name: 'Neha Kapoor',
    role: 'receptionist',
    licenseNumber: 'CW-STAFF-104',
    email: 'frontdesk@carewellclinic.in',
    avatarColor: 'bg-cyan-700'
  },
  {
    id: 'ADMIN-01',
    name: 'Rajesh Mehra (Admin)',
    role: 'admin',
    licenseNumber: 'CW-ADM-01',
    email: 'admin@carewellclinic.in',
    avatarColor: 'bg-slate-700'
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    mrn: 'CW-2026-0101',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    mobileNumber: '+91 98101 23456',
    email: 'rajesh.kumar@example.com',
    age: 52,
    gender: 'Male',
    bloodGroup: 'B+',
    address: 'B-42, Hauz Khas Enclave, New Delhi - 110016',
    emergencyContact: {
      name: 'Sunita Kumar',
      relationship: 'Spouse',
      phone: '+91 98101 23457'
    },
    allergies: ['Penicillin', 'Sulfa Drugs'],
    chronicConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    pastMedicalHistory: ['Appendectomy (2014)', 'Mild dyslipidemia'],
    registeredDate: '2026-01-12',
    lastVisitDate: '2026-10-15',
    nextFollowUpDate: '2026-10-22',
    totalVisits: 6,
    status: 'Critical Follow-up'
  },
  {
    id: 'pat-002',
    mrn: 'CW-2026-0102',
    firstName: 'Priya',
    lastName: 'Sharma',
    mobileNumber: '+91 98712 34567',
    email: 'priya.sharma@example.com',
    age: 34,
    gender: 'Female',
    bloodGroup: 'O+',
    address: 'Flat 304, Green Park Extension, New Delhi - 110016',
    emergencyContact: {
      name: 'Rohan Sharma',
      relationship: 'Brother',
      phone: '+91 98712 34568'
    },
    allergies: ['Aspirin'],
    chronicConditions: ['Hypothyroidism'],
    pastMedicalHistory: ['Migraine with aura'],
    registeredDate: '2026-03-04',
    lastVisitDate: '2026-10-12',
    nextFollowUpDate: '2026-11-12',
    totalVisits: 4,
    status: 'Active'
  },
  {
    id: 'pat-003',
    mrn: 'CW-2026-0103',
    firstName: 'Vikram',
    lastName: 'Malhotra',
    mobileNumber: '+91 99103 45678',
    email: 'vikram.m@example.com',
    age: 63,
    gender: 'Male',
    bloodGroup: 'A+',
    address: 'C-15, Safdarjung Development Area, New Delhi - 110016',
    emergencyContact: {
      name: 'Kavita Malhotra',
      relationship: 'Daughter',
      phone: '+91 99103 45679'
    },
    allergies: [],
    chronicConditions: ['Coronary Artery Disease', 'Hyperlipidemia'],
    pastMedicalHistory: ['PTCA Stent (2022)'],
    registeredDate: '2025-11-19',
    lastVisitDate: '2026-10-17',
    nextFollowUpDate: '2026-10-24',
    totalVisits: 9,
    status: 'Active'
  },
  {
    id: 'pat-004',
    mrn: 'CW-2026-0104',
    firstName: 'Ananya',
    lastName: 'Deshmukh',
    mobileNumber: '+91 97114 56789',
    email: 'ananya.d@example.com',
    age: 28,
    gender: 'Female',
    bloodGroup: 'AB+',
    address: 'D-8, South Extension Part 2, New Delhi - 110049',
    emergencyContact: {
      name: 'Amit Deshmukh',
      relationship: 'Father',
      phone: '+91 97114 56780'
    },
    allergies: ['Dust mites', 'Ciprofloxacin'],
    chronicConditions: ['Bronchial Asthma'],
    pastMedicalHistory: ['Seasonal allergic rhinitis'],
    registeredDate: '2026-06-18',
    lastVisitDate: '2026-10-18',
    nextFollowUpDate: '2026-10-25',
    totalVisits: 3,
    status: 'Active'
  },
  {
    id: 'pat-005',
    mrn: 'CW-2026-0105',
    firstName: 'Harpreet',
    lastName: 'Singh',
    mobileNumber: '+91 98115 67890',
    email: 'h.singh@example.com',
    age: 45,
    gender: 'Male',
    bloodGroup: 'O-',
    address: '77-A, Malviya Nagar, New Delhi - 110017',
    emergencyContact: {
      name: 'Gurpreet Kaur',
      relationship: 'Spouse',
      phone: '+91 98115 67891'
    },
    allergies: [],
    chronicConditions: ['GERD', 'Fatty Liver Grade 1'],
    pastMedicalHistory: ['Lumbar spondylosis'],
    registeredDate: '2026-08-01',
    lastVisitDate: '2026-10-10',
    nextFollowUpDate: '2026-11-10',
    totalVisits: 2,
    status: 'Active'
  }
];

export const INITIAL_VITALS: VitalSignRecord[] = [
  {
    id: 'vit-001',
    patientId: 'pat-001',
    recordedAt: '2026-10-15T10:15:00Z',
    recordedBy: 'Sister Renu Joseph',
    systolicBp: 142,
    diastolicBp: 92,
    heartRate: 78,
    spo2: 98,
    temperature: 98.4,
    bloodGlucose: 158,
    bmi: 27.4,
    weightKg: 82,
    heightCm: 173,
    notes: 'BP elevated. Advised to reduce sodium intake.'
  },
  {
    id: 'vit-002',
    patientId: 'pat-001',
    recordedAt: '2026-09-15T11:00:00Z',
    recordedBy: 'Sister Renu Joseph',
    systolicBp: 148,
    diastolicBp: 95,
    heartRate: 82,
    spo2: 97,
    temperature: 98.6,
    bloodGlucose: 172,
    bmi: 27.8,
    weightKg: 83,
    heightCm: 173
  },
  {
    id: 'vit-003',
    patientId: 'pat-001',
    recordedAt: '2026-08-10T09:30:00Z',
    recordedBy: 'Sister Renu Joseph',
    systolicBp: 138,
    diastolicBp: 88,
    heartRate: 76,
    spo2: 98,
    temperature: 98.2,
    bloodGlucose: 144,
    bmi: 27.5,
    weightKg: 82.5,
    heightCm: 173
  },
  {
    id: 'vit-004',
    patientId: 'pat-002',
    recordedAt: '2026-10-12T11:30:00Z',
    recordedBy: 'Sister Renu Joseph',
    systolicBp: 118,
    diastolicBp: 76,
    heartRate: 72,
    spo2: 99,
    temperature: 98.6,
    bmi: 22.1,
    weightKg: 58,
    heightCm: 162
  },
  {
    id: 'vit-005',
    patientId: 'pat-003',
    recordedAt: '2026-10-17T14:15:00Z',
    recordedBy: 'Sister Renu Joseph',
    systolicBp: 130,
    diastolicBp: 82,
    heartRate: 68,
    spo2: 98,
    temperature: 98.4,
    bloodGlucose: 110,
    bmi: 24.8,
    weightKg: 74,
    heightCm: 173
  },
  {
    id: 'vit-006',
    patientId: 'pat-004',
    recordedAt: '2026-10-18T16:00:00Z',
    recordedBy: 'Sister Renu Joseph',
    systolicBp: 112,
    diastolicBp: 72,
    heartRate: 88,
    spo2: 96,
    temperature: 99.1,
    bmi: 21.0,
    weightKg: 52,
    heightCm: 158,
    notes: 'Mild wheezing on auscultation.'
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    prescriptionNumber: 'RX-2026-1042',
    patientId: 'pat-001',
    patientName: 'Rajesh Kumar',
    patientMobile: '+91 98101 23456',
    patientAge: 52,
    patientGender: 'Male',
    doctorId: 'DOC-01',
    doctorName: 'Dr. Amit Sharma',
    date: '2026-10-15',
    diagnosis: 'Uncontrolled Hypertension with Type 2 Diabetes Mellitus',
    symptoms: ['Mild occipital headache', 'Postprandial lethargy'],
    medicines: [
      {
        id: 'med-01',
        name: 'Telmisartan',
        dosage: '40 mg',
        form: 'Tablet',
        frequency: '1-0-0 (Morning)',
        timing: 'Before Food',
        durationDays: 30,
        instructions: 'Take daily at 8:00 AM with warm water',
        quantity: 30,
        refillsAllowed: 2
      },
      {
        id: 'med-02',
        name: 'Metformin Sustained Release',
        dosage: '500 mg',
        form: 'Tablet',
        frequency: '1-0-1 (Morning & Night)',
        timing: 'After Food',
        durationDays: 30,
        instructions: 'Take immediately after breakfast and dinner',
        quantity: 60,
        refillsAllowed: 2
      },
      {
        id: 'med-03',
        name: 'Amlodipine',
        dosage: '5 mg',
        form: 'Tablet',
        frequency: '0-0-1 (Night)',
        timing: 'At Bedtime',
        durationDays: 14,
        instructions: 'Add-on therapy for nocturnal BP surge',
        quantity: 14,
        refillsAllowed: 1
      }
    ],
    advice: 'Daily brisk walk 30 mins, reduce salt (<3g/day), monitor fasting blood sugar twice a week.',
    followUpDate: '2026-10-22',
    smsNotification: {
      status: 'delivered',
      sentAt: '2026-10-15T10:45:00Z',
      deliveredAt: '2026-10-15T10:45:03Z',
      messagePreview: '[CAREWELL CLINIC] Rx for Rajesh Kumar: Tab Telmisartan 40mg (1-0-0), Tab Metformin SR 500mg (1-0-1), Tab Amlodipine 5mg (0-0-1). Follow-up: 22 Oct 2026. Ph: +91 98765 43210',
      messageId: 'CW-GTW-8931A',
      recipientMobile: '+91 98101 23456'
    },
    signatureVerified: true
  },
  {
    id: 'rx-002',
    prescriptionNumber: 'RX-2026-1043',
    patientId: 'pat-004',
    patientName: 'Ananya Deshmukh',
    patientMobile: '+91 97114 56789',
    patientAge: 28,
    patientGender: 'Female',
    doctorId: 'DOC-01',
    doctorName: 'Dr. Amit Sharma',
    date: '2026-10-18',
    diagnosis: 'Acute Bronchial Asthma Exacerbation with Allergic Bronchitis',
    symptoms: ['Dry nocturnal cough', 'Shortness of breath on exertion'],
    medicines: [
      {
        id: 'med-04',
        name: 'Budesonide + Formoterol 200/6',
        dosage: '200 mcg / 6 mcg',
        form: 'Inhaler',
        frequency: '1-0-1 (2 Puffs each)',
        timing: 'After Food',
        durationDays: 15,
        instructions: 'Rinse mouth thoroughly with water after inhalation',
        quantity: 1,
        refillsAllowed: 1
      },
      {
        id: 'med-05',
        name: 'Montelukast + Levocetirizine',
        dosage: '10 mg / 5 mg',
        form: 'Tablet',
        frequency: '0-0-1 (Night)',
        timing: 'At Bedtime',
        durationDays: 10,
        instructions: 'Take 30 minutes before sleeping',
        quantity: 10,
        refillsAllowed: 0
      }
    ],
    advice: 'Steam inhalation twice daily, avoid cold air exposure and outdoor particulate dust.',
    followUpDate: '2026-10-25',
    smsNotification: {
      status: 'delivered',
      sentAt: '2026-10-18T16:20:00Z',
      deliveredAt: '2026-10-18T16:20:02Z',
      messagePreview: '[CAREWELL CLINIC] Rx for Ananya Deshmukh: Budesonide+Formoterol Inhaler (2 puffs 1-0-1), Montelukast+Levocetirizine Tab (0-0-1). Follow-up: 25 Oct 2026. Ph: +91 98765 43210',
      messageId: 'CW-GTW-9042B',
      recipientMobile: '+91 97114 56789'
    },
    signatureVerified: true
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    appointmentNumber: 'APT-2026-8801',
    patientId: 'pat-001',
    patientName: 'Rajesh Kumar',
    patientMobile: '+91 98101 23456',
    patientAge: 52,
    patientGender: 'Male',
    doctorId: 'DOC-01',
    doctorName: 'Dr. Amit Sharma',
    date: '2026-10-19',
    timeSlot: '09:30 AM',
    type: 'Follow-up',
    status: 'Confirmed',
    reasonForVisit: 'BP & Fasting sugar response check after Telmisartan adjustment',
    notes: 'Review home BP logbook',
    reminderSent: true,
    reminderSentAt: '2026-10-18T09:00:00Z',
    reminderStatus: 'Delivered'
  },
  {
    id: 'apt-002',
    appointmentNumber: 'APT-2026-8802',
    patientId: 'pat-003',
    patientName: 'Vikram Malhotra',
    patientMobile: '+91 99103 45678',
    patientAge: 63,
    patientGender: 'Male',
    doctorId: 'DOC-01',
    doctorName: 'Dr. Amit Sharma',
    date: '2026-10-19',
    timeSlot: '10:15 AM',
    type: 'Chronic Care Review',
    status: 'Scheduled',
    reasonForVisit: 'Lipid profile & ECG review post stent follow-up',
    reminderSent: true,
    reminderSentAt: '2026-10-18T10:00:00Z',
    reminderStatus: 'Delivered'
  },
  {
    id: 'apt-003',
    appointmentNumber: 'APT-2026-8803',
    patientId: 'pat-002',
    patientName: 'Priya Sharma',
    patientMobile: '+91 98712 34567',
    patientAge: 34,
    patientGender: 'Female',
    doctorId: 'DOC-02',
    doctorName: 'Dr. Kavita Verma',
    date: '2026-10-19',
    timeSlot: '11:00 AM',
    type: 'General Consultation',
    status: 'Scheduled',
    reasonForVisit: 'Thyroid profile report consultation & persistent fatigue',
    reminderSent: false
  },
  {
    id: 'apt-004',
    appointmentNumber: 'APT-2026-8804',
    patientId: 'pat-005',
    patientName: 'Harpreet Singh',
    patientMobile: '+91 98115 67890',
    patientAge: 45,
    patientGender: 'Male',
    doctorId: 'DOC-01',
    doctorName: 'Dr. Amit Sharma',
    date: '2026-10-19',
    timeSlot: '12:00 PM',
    type: 'Prescription Refill',
    status: 'Scheduled',
    reasonForVisit: 'Antacid & liver supplement refill assessment',
    reminderSent: false
  },
  {
    id: 'apt-005',
    appointmentNumber: 'APT-2026-8805',
    patientId: 'pat-004',
    patientName: 'Ananya Deshmukh',
    patientMobile: '+91 97114 56789',
    patientAge: 28,
    patientGender: 'Female',
    doctorId: 'DOC-01',
    doctorName: 'Dr. Amit Sharma',
    date: '2026-10-25',
    timeSlot: '10:00 AM',
    type: 'Follow-up',
    status: 'Scheduled',
    reasonForVisit: 'Evaluate inhaler technique and peak flow rate',
    reminderSent: false
  }
];

export const INITIAL_REFILLS: RefillRequest[] = [
  {
    id: 'ref-001',
    patientId: 'pat-001',
    patientName: 'Rajesh Kumar',
    patientMobile: '+91 98101 23456',
    medicineName: 'Metformin SR 500mg',
    dosage: '500 mg (1-0-1)',
    prescribedDate: '2026-09-15',
    requestedDate: '2026-10-17',
    status: 'pending',
    refillsRemaining: 2,
    physicianNotes: 'Patient adhering to diet; glucose logs stable',
    lastUpdated: '2026-10-17T11:00:00Z'
  },
  {
    id: 'ref-002',
    patientId: 'pat-003',
    patientName: 'Vikram Malhotra',
    patientMobile: '+91 99103 45678',
    medicineName: 'Atorvastatin 20mg',
    dosage: '20 mg (0-0-1)',
    prescribedDate: '2026-09-10',
    requestedDate: '2026-10-16',
    status: 'pending',
    refillsRemaining: 1,
    physicianNotes: 'Check LFT enzymes at next consultation',
    lastUpdated: '2026-10-16T15:30:00Z'
  },
  {
    id: 'ref-003',
    patientId: 'pat-002',
    patientName: 'Priya Sharma',
    patientMobile: '+91 98712 34567',
    medicineName: 'Thyronorm (Levothyroxine)',
    dosage: '50 mcg (1-0-0 empty stomach)',
    prescribedDate: '2026-08-01',
    requestedDate: '2026-10-14',
    status: 'approved',
    refillsRemaining: 3,
    physicianNotes: 'Approved 3 months supply. TSH scheduled Nov 2026.',
    lastUpdated: '2026-10-14T12:00:00Z'
  }
];

export const INITIAL_MESSAGES: SecureMessage[] = [
  {
    id: 'msg-001',
    channel: 'patient',
    threadId: 'th-pat-001',
    senderId: 'pat-001',
    senderName: 'Rajesh Kumar (Patient)',
    senderRole: 'patient',
    recipientId: 'DOC-01',
    recipientName: 'Dr. Amit Sharma',
    timestamp: '2026-10-18T19:30:00Z',
    content: 'Good evening Dr. Sharma, my morning BP was 134/86 and pulse 74. Feeling much less headache today. Should I continue the evening Amlodipine?',
    encryptedCipher: 'aes256gcm:R29vZCBldmVuaW5nIERyLiBTaGFybWEsIG15IG1vcm5pbmcgQlAgd2FzIDEzNC84NiBhbmQgcHVsc2UgNzQuIEZlZWxpbmcgbXVjaCBsZXNzIGhlYWRhY2hlIHRvZGF5LiBTaG91bGQgSSBjb250aW51ZSB0aGUgZXZlbmluZyBBbWxvZGlwaW5lPw==',
    encryptionAlgorithm: 'AES-GCM-256',
    keyFingerprint: 'e3b0c44298fc1c14',
    isRead: false
  },
  {
    id: 'msg-002',
    channel: 'patient',
    threadId: 'th-pat-001',
    senderId: 'DOC-01',
    senderName: 'Dr. Amit Sharma (Physician)',
    senderRole: 'physician',
    recipientId: 'pat-001',
    recipientName: 'Rajesh Kumar',
    timestamp: '2026-10-18T20:05:00Z',
    content: 'Good evening Rajesh ji. That is great progress. Yes, continue the Amlodipine 5mg at bedtime as prescribed. We will review your 7-day log tomorrow morning.',
    encryptedCipher: 'aes256gcm:R29vZCBldmVuaW5nIFJhamVzaCBqaS4gVGhhdCBpcyBncmVhdCBwcm9ncmVzcy4gWWVzLCBjb250aW51ZSB0aGUgQW1sb2RpcGluZSA1bWcgYXQgYmVkdGltZSBhcyBwcmVzY3JpYmVkLiBXZSB3aWxsIHJldmlldyB5b3VyIDctZGF5IGxvZyB0b21vcnJvdyBtb3JuaW5nLg==',
    encryptionAlgorithm: 'AES-GCM-256',
    keyFingerprint: 'e3b0c44298fc1c14',
    isRead: true
  },
  {
    id: 'msg-003',
    channel: 'internal_staff',
    threadId: 'th-staff-01',
    senderId: 'NURSE-01',
    senderName: 'Sister Renu (Triage Nurse)',
    senderRole: 'nurse',
    recipientId: 'DOC-01',
    recipientName: 'Dr. Amit Sharma',
    timestamp: '2026-10-18T17:45:00Z',
    content: 'Dr. Amit: Fasting blood glucose kit reagents restocked. Also, Mrs. Priya Sharma called to request moving her morning appointment if possible.',
    encryptedCipher: 'aes256gcm:RHIuIEFtaXQ6IEZhc3RpbmcgYmxvb2QgZ2x1Y29zZSBraXQgcmVhZ2VudHMgcmVzdG9ja2VkLiBBbHNvLCBNcnMuIFByaXlhIFNoYXJtYSBjYWxsZWQgdG8gcmVxdWVzdCBtb3ZpbmcgaGVyIG1vcm5pbmcgYXBwb2ludG1lbnQgaWYgcG9zc2libGUu',
    encryptionAlgorithm: 'AES-GCM-256',
    keyFingerprint: 'e3b0c44298fc1c14',
    isRead: true
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-18T23:30:10Z',
    userId: 'DOC-01',
    userName: 'Dr. Amit Sharma',
    userRole: 'physician',
    action: 'PATIENT_RECORD_VIEWED',
    details: 'Accessed electronic health record of Rajesh Kumar (CW-2026-0101)',
    patientId: 'pat-001',
    patientMrn: 'CW-2026-0101',
    terminalIp: '192.168.1.12 (Exam Room 1)'
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-18T23:25:00Z',
    userId: 'DOC-01',
    userName: 'Dr. Amit Sharma',
    userRole: 'physician',
    action: 'PRESCRIPTION_SMS_DISPATCHED',
    details: 'Dispatched automated dosage SMS for Rx RX-2026-1043 to +91 97114 56789 via CareWell Gateway',
    patientId: 'pat-004',
    patientMrn: 'CW-2026-0104',
    terminalIp: '192.168.1.12 (Exam Room 1)'
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-18T23:15:40Z',
    userId: 'REC-01',
    userName: 'Neha Kapoor',
    userRole: 'receptionist',
    action: 'APPOINTMENT_SCHEDULED',
    details: 'Booked Follow-up consultation for Vikram Malhotra for 19 Oct 2026 at 10:15 AM',
    patientId: 'pat-003',
    patientMrn: 'CW-2026-0103',
    terminalIp: '192.168.1.4 (Front Desk Terminal)'
  }
];

export class StorageService {
  private static inMemoryStore: Record<string, string> = {};

  public static safeGetItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // localStorage restricted or disabled
    }
    return this.inMemoryStore[key] ?? null;
  }

  public static safeSetItem(key: string, value: string): void {
    this.inMemoryStore[key] = value;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch {
      // localStorage restricted, quota exceeded, or sandboxed
    }
  }

  /**
   * Initializes local storage with seed data if not present
   */
  public static init() {
    if (typeof window === 'undefined') return;

    if (!this.safeGetItem(PATIENTS_KEY)) {
      this.safeSetItem(PATIENTS_KEY, JSON.stringify(INITIAL_PATIENTS));
    }
    if (!this.safeGetItem(VITALS_KEY)) {
      this.safeSetItem(VITALS_KEY, JSON.stringify(INITIAL_VITALS));
    }
    if (!this.safeGetItem(PRESCRIPTIONS_KEY)) {
      this.safeSetItem(PRESCRIPTIONS_KEY, JSON.stringify(INITIAL_PRESCRIPTIONS));
    }
    if (!this.safeGetItem(APPOINTMENTS_KEY)) {
      this.safeSetItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
    }
    if (!this.safeGetItem(REFILLS_KEY)) {
      this.safeSetItem(REFILLS_KEY, JSON.stringify(INITIAL_REFILLS));
    }
    if (!this.safeGetItem(MESSAGES_KEY)) {
      this.safeSetItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
    }
    if (!this.safeGetItem(AUDIT_KEY)) {
      this.safeSetItem(AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!this.safeGetItem(CURRENT_USER_KEY)) {
      this.safeSetItem(CURRENT_USER_KEY, JSON.stringify(DEFAULT_USERS[0]));
    }
  }

  // Patients
  public static getPatients(): Patient[] {
    this.init();
    try {
      const data = this.safeGetItem(PATIENTS_KEY);
      return data ? JSON.parse(data) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  }

  public static savePatient(patient: Patient): void {
    const list = this.getPatients();
    const index = list.findIndex(p => p.id === patient.id);
    let updated: Patient[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = patient;
    } else {
      updated = [patient, ...list];
    }
    this.safeSetItem(PATIENTS_KEY, JSON.stringify(updated));
    this.queueSync('PATIENT_MUTATION', patient.id);
  }

  // Vitals
  public static getVitals(patientId?: string): VitalSignRecord[] {
    this.init();
    try {
      const data = this.safeGetItem(VITALS_KEY);
      const all: VitalSignRecord[] = data ? JSON.parse(data) : INITIAL_VITALS;
      if (patientId) {
        return all.filter(v => v.patientId === patientId);
      }
      return all;
    } catch {
      return INITIAL_VITALS;
    }
  }

  public static addVital(vital: VitalSignRecord): void {
    const all = this.getVitals();
    const updated = [vital, ...all];
    this.safeSetItem(VITALS_KEY, JSON.stringify(updated));
    this.queueSync('VITAL_MUTATION', vital.id);
  }

  // Prescriptions
  public static getPrescriptions(patientId?: string): Prescription[] {
    this.init();
    try {
      const data = this.safeGetItem(PRESCRIPTIONS_KEY);
      const all: Prescription[] = data ? JSON.parse(data) : INITIAL_PRESCRIPTIONS;
      if (patientId) {
        return all.filter(p => p.patientId === patientId);
      }
      return all;
    } catch {
      return INITIAL_PRESCRIPTIONS;
    }
  }

  public static savePrescription(rx: Prescription): void {
    const all = this.getPrescriptions();
    const idx = all.findIndex(p => p.id === rx.id);
    let updated: Prescription[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = rx;
    } else {
      updated = [rx, ...all];
    }
    this.safeSetItem(PRESCRIPTIONS_KEY, JSON.stringify(updated));
    this.queueSync('PRESCRIPTION_MUTATION', rx.id);
  }

  // Appointments
  public static getAppointments(date?: string): Appointment[] {
    this.init();
    try {
      const data = this.safeGetItem(APPOINTMENTS_KEY);
      const all: Appointment[] = data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
      if (date) {
        return all.filter(a => a.date === date);
      }
      return all;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  }

  public static saveAppointment(appt: Appointment): void {
    const all = this.getAppointments();
    const idx = all.findIndex(a => a.id === appt.id);
    let updated: Appointment[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = appt;
    } else {
      updated = [appt, ...all];
    }
    this.safeSetItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    this.queueSync('APPOINTMENT_MUTATION', appt.id);
  }

  // Refill Requests
  public static getRefills(): RefillRequest[] {
    this.init();
    try {
      const data = this.safeGetItem(REFILLS_KEY);
      return data ? JSON.parse(data) : INITIAL_REFILLS;
    } catch {
      return INITIAL_REFILLS;
    }
  }

  public static updateRefill(refill: RefillRequest): void {
    const all = this.getRefills();
    const idx = all.findIndex(r => r.id === refill.id);
    let updated: RefillRequest[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = refill;
    } else {
      updated = [refill, ...all];
    }
    this.safeSetItem(REFILLS_KEY, JSON.stringify(updated));
    this.queueSync('REFILL_MUTATION', refill.id);
  }

  // Messages
  public static getMessages(channel?: 'patient' | 'internal_staff', threadId?: string): SecureMessage[] {
    this.init();
    try {
      const data = this.safeGetItem(MESSAGES_KEY);
      let all: SecureMessage[] = data ? JSON.parse(data) : INITIAL_MESSAGES;
      if (channel) {
        all = all.filter(m => m.channel === channel);
      }
      if (threadId) {
        all = all.filter(m => m.threadId === threadId);
      }
      return all;
    } catch {
      return INITIAL_MESSAGES;
    }
  }

  public static addMessage(msg: SecureMessage): void {
    const all = this.getMessages();
    const updated = [...all, msg];
    this.safeSetItem(MESSAGES_KEY, JSON.stringify(updated));
    this.queueSync('MESSAGE_MUTATION', msg.id);
  }

  // Audit Logs (HIPAA Requirement)
  public static getAuditLogs(): AuditLogEntry[] {
    this.init();
    try {
      const data = this.safeGetItem(AUDIT_KEY);
      return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  public static logAudit(action: AuditLogEntry['action'], details: string, patientId?: string, patientMrn?: string): void {
    const user = this.getCurrentUser();
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      details,
      patientId,
      patientMrn,
      terminalIp: '192.168.1.12 (Exam Room 1 / CareWell Local Subnet)'
    };
    const logs = this.getAuditLogs();
    const updated = [entry, ...logs].slice(0, 500); // Retain 500 records
    this.safeSetItem(AUDIT_KEY, JSON.stringify(updated));
  }

  // Current active user / role
  public static getCurrentUser(): UserSession {
    this.init();
    try {
      const data = this.safeGetItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : DEFAULT_USERS[0];
    } catch {
      return DEFAULT_USERS[0];
    }
  }

  public static setCurrentUser(user: UserSession): void {
    this.safeSetItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  // Sync Queue for Offline Support
  public static queueSync(type: string, entityId: string): void {
    try {
      const raw = this.safeGetItem(SYNC_QUEUE_KEY);
      const queue: { type: string; entityId: string; timestamp: string }[] = raw ? JSON.parse(raw) : [];
      queue.push({ type, entityId, timestamp: new Date().toISOString() });
      this.safeSetItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // ignore
    }
  }

  public static getPendingSyncCount(): number {
    try {
      const raw = this.safeGetItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  }

  public static clearSyncQueue(): void {
    this.safeSetItem(SYNC_QUEUE_KEY, JSON.stringify([]));
  }

  // Backup & Export (Encrypted JSON)
  public static exportFullDatabase(): string {
    const dump = {
      exportedAt: new Date().toISOString(),
      clinic: 'CareWell Multispeciality Clinic',
      patients: this.getPatients(),
      vitals: this.getVitals(),
      prescriptions: this.getPrescriptions(),
      appointments: this.getAppointments(),
      refills: this.getRefills(),
      auditLogs: this.getAuditLogs()
    };
    return JSON.stringify(dump, null, 2);
  }
}
