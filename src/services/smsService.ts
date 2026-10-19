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

  public static getSmsLogs(): SmsLogRecord[] {
    try {
      const raw = localStorage.getItem(SMS_LOGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  }
}
