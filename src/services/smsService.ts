/**
 * CareWell Multispeciality Clinic - SMS Notification Gateway
 * Automatically dispatches prescription medicine, dosage instructions & follow-ups to registered mobile numbers
 */

import { Prescription, Appointment, RefillRequest } from '../types/clinic';

export interface SmsLogRecord {
  id: string;
  recipientMobile: string;
  recipientName: string;
  messageType: 'PRESCRIPTION' | 'APPOINTMENT_REMINDER' | 'REFILL_ALERT' | 'FOLLOWUP_ALERT';
  text: string;
  status: 'Delivered' | 'Sent' | 'Failed';
  dispatchedAt: string;
  gatewayMessageId: string;
  carrier: string;
}

const SMS_LOGS_KEY = 'carewell_sms_logs';

export class SmsService {
  /**
   * Generates formatted prescription SMS text containing medicine, dosage, timing, and follow-up
   */
  public static generatePrescriptionSmsText(rx: Prescription): string {
    const medList = rx.medicines
      .map((m, idx) => `${idx + 1}. ${m.name} (${m.dosage}) - ${m.frequency}, ${m.timing} for ${m.durationDays}d.`)
      .join('\n');

    return `[CAREWELL CLINIC] Prescription from ${rx.doctorName} for ${rx.patientName} (Rx: ${rx.prescriptionNumber}):
Diagnosis: ${rx.diagnosis}
MEDICATIONS:
${medList}
ADVICE: ${rx.advice || 'Drink adequate fluids and rest.'}
NEXT FOLLOW-UP: ${rx.followUpDate || 'As advised'}
Clinic: +91 98765 43210 | 123 Health Care Rd, Green Park, New Delhi`;
  }

  /**
   * Generates Appointment Reminder SMS
   */
  public static generateAppointmentReminderText(appt: Appointment): string {
    return `[CAREWELL CLINIC] Reminder: Dear ${appt.patientName}, your appointment with ${appt.doctorName} is scheduled on ${appt.date} at ${appt.timeSlot}.
Type: ${appt.type}
Clinic: 123 Health Care Rd, Green Park, New Delhi
For reschedule/queries: +91 98765 43210. Reply CANCEL if unable to attend.`;
  }

  /**
   * Generates Refill Status SMS
   */
  public static generateRefillAlertText(refill: RefillRequest): string {
    if (refill.status === 'approved') {
      return `[CAREWELL CLINIC] Refill Approved: Dear ${refill.patientName}, your refill request for ${refill.medicineName} (${refill.dosage}) has been approved by your physician. You may collect it or order from our dispensary. Clinic Contact: +91 98765 43210.`;
    } else {
      return `[CAREWELL CLINIC] Refill Update: Dear ${refill.patientName}, your refill request for ${refill.medicineName} requires an in-person follow-up consultation before renewal. Please call +91 98765 43210 to book a slot.`;
    }
  }

  /**
   * Simulates immediate dispatch via SMS gateway (e.g. Twilio / Gupshup / Exotel)
   */
  public static async dispatchSms(params: {
    mobileNumber: string;
    patientName: string;
    messageType: 'PRESCRIPTION' | 'APPOINTMENT_REMINDER' | 'REFILL_ALERT' | 'FOLLOWUP_ALERT';
    text: string;
  }): Promise<SmsLogRecord> {
    const newLog: SmsLogRecord = {
      id: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientMobile: params.mobileNumber,
      recipientName: params.patientName,
      messageType: params.messageType,
      text: params.text,
      status: 'Delivered',
      dispatchedAt: new Date().toISOString(),
      gatewayMessageId: `CW-GTW-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      carrier: 'Airtel / Jio Healthcare SMS Hub'
    };

    // Store in SMS logs
    const currentLogs = this.getSmsLogs();
    const updated = [newLog, ...currentLogs];
    try {
      localStorage.setItem(SMS_LOGS_KEY, JSON.stringify(updated.slice(0, 100)));
    } catch {
      // ignore
    }

    // Trigger custom window event for the live Mobile Phone Simulator
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('carewell-sms-received', {
          detail: newLog
        })
      );
    }

    return newLog;
  }

  private static readonly INITIAL_SMS_LOGS: SmsLogRecord[] = [
    {
      id: 'SMS-INIT-01',
      recipientMobile: '+91 98101 23456',
      recipientName: 'Rajesh Kumar',
      messageType: 'PRESCRIPTION',
      text: `[CAREWELL CLINIC] Prescription from Dr. Amit Sharma for Rajesh Kumar (Rx: RX-2026-1042):
Diagnosis: Uncontrolled Hypertension with Type 2 Diabetes Mellitus
MEDICATIONS:
1. Telmisartan (40 mg) - 1-0-0 (Morning), Before Food for 30d.
2. Metformin SR (500 mg) - 1-0-1 (Twice Daily), After Meals for 30d.
3. Amlodipine (5 mg) - 0-0-1 (Night), Bedtime for 30d.
ADVICE: Maintain 7-day home BP and morning fasting blood glucose log.
NEXT FOLLOW-UP: 2026-10-22
Clinic: +91 98765 43210 | Green Park, New Delhi`,
      status: 'Delivered',
      dispatchedAt: new Date(Date.now() - 3600000).toISOString(),
      gatewayMessageId: 'CW-GTW-INIT01',
      carrier: 'Airtel / Jio Healthcare SMS Hub'
    },
    {
      id: 'SMS-INIT-02',
      recipientMobile: '+91 98101 23456',
      recipientName: 'Rajesh Kumar',
      messageType: 'APPOINTMENT_REMINDER',
      text: `[CAREWELL CLINIC] Reminder: Dear Rajesh Kumar, your follow-up consultation with Dr. Amit Sharma is scheduled today at 10:00 AM.
Type: Follow-up
Clinic: 123 Health Care Rd, Green Park, New Delhi
For queries/rescheduling: +91 98765 43210.`,
      status: 'Delivered',
      dispatchedAt: new Date(Date.now() - 7200000).toISOString(),
      gatewayMessageId: 'CW-GTW-INIT02',
      carrier: 'Airtel / Jio Healthcare SMS Hub'
    }
  ];

  public static getSmsLogs(): SmsLogRecord[] {
    try {
      const raw = localStorage.getItem(SMS_LOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return this.INITIAL_SMS_LOGS;
  }
}
