/**
 * CareWell Multispeciality Clinic - Clinical Services & Inquiries Portal
 * Comprehensive directory of clinic specialties, diagnostic procedures, doctors,
 * with instant WhatsApp inquiry and automated SMS callback submission.
 */

import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  Baby,
  Heart,
  Activity,
  Sparkles,
  Phone,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  MessageSquare,
  ChevronRight,
  ClipboardList,
  Calendar,
  Info
} from 'lucide-react';
import { SmsService } from '../services/smsService';
import { StorageService } from '../services/storage';
import { showToast } from './ToastNotification';

interface ServicesEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsAppBooking: () => void;
}

export interface ClinicServiceItem {
  id: string;
  department: string;
  title: string;
  description: string;
  doctor: string;
  consultationFee: string;
  features: string[];
  diagnosticSupport: string[];
  badgeColor: string;
  badgeBg: string;
  iconName: 'stethoscope' | 'baby' | 'heart' | 'joint' | 'lab';
}

export const CLINIC_SERVICES: ClinicServiceItem[] = [
  {
    id: 'srv-gp',
    department: 'General Physician & Family Medicine',
    title: 'General Physician OPD & Acute Illness Care',
    description: 'Diagnosis and treatment for viral fevers, seasonal infections, dengue, typhoid, respiratory illnesses, gastrointestinal disorders, and migraine.',
    doctor: 'Dr. Amit Sharma (MBBS, MD - General Medicine)',
    consultationFee: '₹500 / consultation',
    features: [
      'Comprehensive physical examination',
      'Infectious disease diagnosis & treatment',
      'Nebulization for acute bronchitis/asthma',
      'Prescriptions with automated SMS dosage schedules',
      'Preventive health counseling'
    ],
    diagnosticSupport: ['Complete Blood Count (CBC)', 'Dengue NS1/IgM', 'Typhoid Serology', 'Urine Routine'],
    badgeColor: 'text-sky-800',
    badgeBg: 'bg-sky-50 border-sky-200',
    iconName: 'stethoscope'
  },
  {
    id: 'srv-chronic',
    department: 'Cardiometabolic & Lifestyle Clinic',
    title: 'Hypertension & Diabetes Mellitus Management',
    description: 'Long-term glycemic and blood pressure stabilization, organ protection, medication optimization, and lifestyle modification.',
    doctor: 'Dr. Amit Sharma (MD - General Medicine)',
    consultationFee: '₹500 (Includes in-clinic glucose & BP check)',
    features: [
      'Automated BP monitoring & 7-day logbook review',
      'Customized oral hypoglycemic & insulin protocols',
      'Diabetic foot and peripheral neuropathy screening',
      'Automated medication refill reminder service',
      'Cardiovascular risk stratification'
    ],
    diagnosticSupport: ['HbA1c Glycated Hemoglobin', 'Lipid Profile', 'Kidney Function Test (KFT)', 'Serum Electrolytes'],
    badgeColor: 'text-rose-800',
    badgeBg: 'bg-rose-50 border-rose-200',
    iconName: 'heart'
  },
  {
    id: 'srv-peds',
    department: 'Child Care (Pediatrics)',
    title: 'Pediatric Care & Immunization Clinic',
    description: 'Holistic health care for infants, children, and adolescents, including developmental milestones and full immunization coverage.',
    doctor: 'Dr. Kavita Verma (MBBS, DCH, MD)',
    consultationFee: '₹600 / consultation',
    features: [
      'National & IAP Immunization Schedule vaccinations',
      'Growth & developmental milestone tracking',
      'Pediatric asthma & respiratory allergy care',
      'Childhood nutritional assessment & diet advice',
      'Gentle child-friendly exam environment'
    ],
    diagnosticSupport: ['Pediatric blood screening', 'Peak expiratory flow', 'Allergy panels'],
    badgeColor: 'text-pink-800',
    badgeBg: 'bg-pink-50 border-pink-200',
    iconName: 'baby'
  },
  {
    id: 'srv-women',
    department: "Women's Health & Wellness",
    title: "Women's Preventive Health & Hormonal Care",
    description: 'Comprehensive care for polycystic ovarian syndrome (PCOS/PCOD), thyroid disorders, anemia screening, and menopausal wellness.',
    doctor: 'Dr. Kavita Verma (MD)',
    consultationFee: '₹600 / consultation',
    features: [
      'PCOS/PCOD management & metabolic balancing',
      'Hypothyroidism & hyperthyroidism stabilization',
      'Anemia detection & therapeutic iron protocols',
      'Routine breast and cervical health guidance',
      'Perimenopause and postmenopausal support'
    ],
    diagnosticSupport: ['TSH / Free T3 & T4', 'Serum Ferritin & Iron Studies', 'Pelvic Ultrasound Referral', 'Vitamin D3/B12'],
    badgeColor: 'text-purple-800',
    badgeBg: 'bg-purple-50 border-purple-200',
    iconName: 'stethoscope'
  },
  {
    id: 'srv-ortho',
    department: 'Bone & Joint Care',
    title: 'Musculoskeletal, Arthritis & Spine Clinic',
    description: 'Non-surgical management of osteoarthritis, osteoporosis, lumbar spondylosis, neck pain, sciatica, and chronic joint stiffness.',
    doctor: 'Dr. Amit Sharma / Orthopedic Visiting Consultant',
    consultationFee: '₹600 / consultation',
    features: [
      'Knee & hip osteoarthritis non-operative care',
      'Bone mineral density (DEXA) evaluation',
      'Cervical and lumbar posture therapy recommendations',
      'Uric acid & gout acute attack management',
      'Local pain relief & joint mobilization advice'
    ],
    diagnosticSupport: ['Digital X-Ray Referrals', 'Serum Uric Acid', 'Calcium & Vitamin D', 'RA Factor / Anti-CCP'],
    badgeColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    iconName: 'joint'
  },
  {
    id: 'srv-diagnostics',
    department: 'In-Clinic Diagnostics & Procedures',
    title: 'Digital ECG & Emergency Day-Care Services',
    description: 'Instant on-site diagnostic testing, 12-lead ECG reporting, nebulization, rapid sugar checks, and sterile wound dressings.',
    doctor: 'CareWell Clinical Nursing & Physician Team',
    consultationFee: 'Varies by test (ECG: ₹300, Glucose: ₹50)',
    features: [
      '12-Lead Digital ECG with immediate doctor interpretation',
      'Instant capillary blood glucose (Glucometer)',
      'Oxygen saturation (SpO2) and vitals triage',
      'Nebulizer sessions for wheezing / respiratory distress',
      'Sterile dressing, bandaging, and suture removal'
    ],
    diagnosticSupport: ['Instant 12-Lead ECG Report', 'Point-of-Care Glucometry', 'Rapid Strep/Flu Swabs'],
    badgeColor: 'text-teal-800',
    badgeBg: 'bg-teal-50 border-teal-200',
    iconName: 'lab'
  }
];

export const ServicesEnquiryModal: React.FC<ServicesEnquiryModalProps> = ({
  isOpen,
  onClose,
  onOpenWhatsAppBooking
}) => {
  const [selectedService, setSelectedService] = useState<ClinicServiceItem>(CLINIC_SERVICES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  
  // Quick Enquiry Form State
  const [enquiryForm, setEnquiryForm] = useState({
    patientName: '',
    mobileNumber: '+91 ',
    queryText: 'I would like to inquire about consultation fees, timing, and appointment slot for this service.'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredServices = CLINIC_SERVICES.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.title.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.features.some(f => f.toLowerCase().includes(q))
    );
  });

  const handleServiceSelect = (service: ClinicServiceItem) => {
    setSelectedService(service);
    setEnquiryForm(prev => ({
      ...prev,
      queryText: `Inquiring about ${service.title} (${service.department}) with ${service.doctor}.`
    }));
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.patientName.trim() || !enquiryForm.mobileNumber.trim()) {
      showToast('Please provide your name and mobile number for enquiry response.', 'warning');
      return;
    }

    setIsSubmitting(true);

    // Dispatch automated confirmation SMS to patient's mobile number
    const confirmSms = `[CAREWELL CLINIC] Thank you ${enquiryForm.patientName}! We have received your service inquiry regarding "${selectedService.title}". Our reception team will call or reply on WhatsApp (+91 98765 43210) shortly. Clinic: Green Park, New Delhi.`;
    
    await SmsService.dispatchSms({
      mobileNumber: enquiryForm.mobileNumber,
      patientName: enquiryForm.patientName,
      messageType: 'FOLLOWUP_ALERT',
      text: confirmSms
    });

    // Log to HIPAA Audit Trail
    StorageService.logAudit(
      'PATIENT_RECORD_VIEWED',
      `Service Enquiry submitted by ${enquiryForm.patientName} (${enquiryForm.mobileNumber}) for "${selectedService.title}"`
    );

    setIsSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowEnquiryForm(false);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#003859] via-[#004f7b] to-[#0284c7] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  CareWell Clinical Services & Inquiries
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-[10px] font-bold uppercase">
                  Verified Specialties
                </span>
              </div>
              <p className="text-xs text-slate-200">
                Explore treatments, consultation fees, and doctor timings · Direct WhatsApp & SMS Inquiry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Top Guidance Strip */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search services (e.g. Fever, Diabetes, Blood Pressure, Child Vaccination, ECG, Joints)..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onClose();
                onOpenWhatsAppBooking();
              }}
              className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.9-0.787-3.123-2.73-3.218-2.855-.094-.125-.768-1.021-.768-1.947 0-.925.484-1.381.656-1.569.172-.188.375-.234.5-.234.125 0 .25.002.359.006.115.004.269-.044.421.323.156.375.531 1.297.578 1.391.047.094.078.203.016.328-.063.125-.094.203-.188.312-.094.109-.198.244-.282.328-.094.094-.192.197-.083.385.109.188.484.798 1.038 1.292.714.636 1.316.834 1.504.928.188.094.297.078.406-.047.109-.125.469-.547.594-.734.125-.188.25-.156.422-.094.172.063 1.094.516 1.281.609.188.094.313.141.359.219.047.078.047.453-.097.858zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.98-1.399C8.423 21.498 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
              <span>Inquire via WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Main Content Split: Services List on Left (5 cols), Details & Enquiry on Right (7 cols) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Services List (5 cols) */}
          <div className="lg:col-span-5 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-1.5">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Departments & Specialities ({filteredServices.length})
            </div>

            {filteredServices.map(service => {
              const isSelected = selectedService.id === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/90 border-teal-500 shadow-xs ring-1 ring-teal-500'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${service.badgeBg} ${service.badgeColor}`}>
                      {service.department}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {service.consultationFee.split('(')[0].trim()}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1.5">
                    {service.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                    {service.description}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{service.doctor.split('(')[0].trim()}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Service Details & Enquiry Form (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/40">
            
            {/* Top Detail Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${selectedService.badgeBg} ${selectedService.badgeColor}`}>
                  {selectedService.department}
                </span>
                <span className="font-bold text-sm text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {selectedService.consultationFee}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedService.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {selectedService.description}
                </p>
              </div>

              {/* Physician Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs">
                <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  MD
                </div>
                <div>
                  <div className="font-bold text-slate-900">{selectedService.doctor}</div>
                  <div className="text-[11px] text-slate-500">
                    Consultation Hours: Mon - Sat (9:00 AM - 8:00 PM) · OPD Room 1 & 2
                  </div>
                </div>
              </div>

              {/* What is Included */}
              <div>
                <h5 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
                  <span>Clinical Scope & Treatments Provided:</span>
                </h5>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedService.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Diagnostic Support Available */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  On-Site Diagnostics & Laboratory Tests:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedService.diagnosticSupport.map((test, i) => (
                    <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Inquiry */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setShowEnquiryForm(!showEnquiryForm)}
                className="flex-1 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{showEnquiryForm ? 'Hide Inquiry Form' : 'Submit Callback / SMS Inquiry'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenWhatsAppBooking();
                }}
                className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask on WhatsApp Bot</span>
              </button>
            </div>

            {/* Quick Enquiry Submission Form */}
            {showEnquiryForm && (
              <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-teal-600" />
                    <span>Submit Service Inquiry for {selectedService.title}</span>
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Instant SMS Confirmation
                  </span>
                </div>

                {submitSuccess ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-900 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="font-bold">Inquiry Received Successfully!</p>
                    <p className="text-[11px] text-emerald-700">
                      An automated confirmation SMS has been dispatched to {enquiryForm.mobileNumber}. Our care coordinator will connect with you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitEnquiry} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          value={enquiryForm.patientName}
                          onChange={e => setEnquiryForm({ ...enquiryForm, patientName: e.target.value })}
                          placeholder="e.g. Ankit Verma"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Mobile Number (for SMS & Call) *</label>
                        <input
                          type="tel"
                          required
                          value={enquiryForm.mobileNumber}
                          onChange={e => setEnquiryForm({ ...enquiryForm, mobileNumber: e.target.value })}
                          placeholder="+91 98765 00000"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Your Questions / Notes</label>
                      <textarea
                        rows={2}
                        value={enquiryForm.queryText}
                        onChange={e => setEnquiryForm({ ...enquiryForm, queryText: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Sending Inquiry...' : 'Send Inquiry & Trigger SMS Confirmation'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Clinic Contact Strip */}
            <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-700" />
                <span className="font-bold text-slate-800">+91 98765 43210</span>
                <span>· Green Park, New Delhi</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Mon - Sat: 9AM - 8PM | Sun: 9AM - 2PM
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-teal-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>CareWell Multispeciality Clinic · Direct Patient Services</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
