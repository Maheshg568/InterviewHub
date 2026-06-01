import { useState } from 'react';
import { HelpCircle, Calendar, CreditCard, Video, Wrench, Phone, Mail, ChevronDown, ChevronUp, RefreshCw, XCircle, RotateCcw } from 'lucide-react';

function AccordionItem({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="liquid-glass-panel overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-white/20 transition">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-sky-600" />}
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
      </button>
      {open && <div className="px-4 pb-4 pt-0 space-y-3">{children}</div>}
    </div>
  );
}

function InfoNote({ children, type = 'info' }) {
  const styles = {
    warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300',
    danger: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300',
    info: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700 text-sky-800 dark:text-sky-300',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
  };
  return <div className={`rounded-xl p-3 text-sm border ${styles[type] || styles.info}`}>{children}</div>;
}

export default function Help() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4"><HelpCircle size={48} className="text-sky-600" /></div>
        <h1 className="text-3xl font-bold text-slate-900">Help Center</h1>
        <p className="text-slate-600 mt-2">Find answers to common questions and get support.</p>
      </div>

      {/* Booking Help */}
      <AccordionItem title="How to Book an Interview" icon={Calendar} defaultOpen>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <p className="text-slate-700">Select your preferred interviewer from the dashboard.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <p className="text-slate-700">Choose available date and time slots that work for you.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <p className="text-slate-700">Complete payment and upload the proof screenshot.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
            <p className="text-slate-700">Wait for the interviewer to confirm your request.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">5</span>
            <p className="text-slate-700">Attend the interview using the shared Zoom/Google Meet link.</p>
          </div>
          <InfoNote type="warning">
            <strong>Important:</strong> Your booking is <em>not confirmed</em> until the interviewer approves it. You will receive a notification once approved.
          </InfoNote>
          <InfoNote type="info">
            If the interviewer is unavailable, alternate slots may be suggested. Please book interviews at least a few hours in advance to allow time for confirmation.
          </InfoNote>
        </div>
      </AccordionItem>

      {/* Payment Help */}
      <AccordionItem title="Payment Process" icon={CreditCard}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <p className="text-slate-700">Scan the QR code provided on the booking page.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <p className="text-slate-700">Complete payment using UPI, PhonePe, or Google Pay.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <p className="text-slate-700">Upload the payment screenshot clearly.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
            <p className="text-slate-700">Wait for payment verification by the admin.</p>
          </div>
          <InfoNote type="danger">
            <strong>Warning:</strong> Blurry screenshots may delay verification. Upload only proof of successful payments. If payment fails, try again after refreshing the page.
          </InfoNote>
          <InfoNote type="warning">
            <strong>Payment Issues?</strong> Contact Admin for further assistance. If payment was deducted but the booking was not updated, reach out immediately with the transaction details.
          </InfoNote>
        </div>
      </AccordionItem>

      {/* Interview Process */}
      <AccordionItem title="Interview Process" icon={Video}>
        <div className="space-y-3">
          <div className="space-y-2">
            {[
              'Join the meeting 5 minutes early to test your audio and video.',
              'Keep your camera and microphone ready and working.',
              'Maintain professional communication throughout the session.',
              'Be prepared with your resume and a basic self-introduction.'
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center text-xs mt-0.5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </span>
                <p className="text-slate-700">{tip}</p>
              </div>
            ))}
          </div>
          <InfoNote type="info">
            <strong>Meeting Link:</strong> The interviewer will share the Zoom or Google Meet link after confirming your booking. If the link doesn't appear or fails to open, contact the interviewer directly.
          </InfoNote>
          <InfoNote type="success">
            <strong>Feedback Reminder:</strong> After your interview, the interviewer will submit feedback and performance scores. You can view these on your student dashboard once the session is marked as completed.
          </InfoNote>
        </div>
      </AccordionItem>

      {/* Cancellation Policy */}
      <AccordionItem title="Cancellation Policy" icon={XCircle}>
        <div className="space-y-3">
          <InfoNote type="danger">
            <strong>Amount will not be refunded</strong> after interview booking cancellation. Please ensure your schedule is clear before confirming a booking.
          </InfoNote>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-rose-100 text-rose-700 rounded flex items-center justify-center text-xs mt-0.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </span>
            <p className="text-slate-700 text-sm">If you cancel, the booking is immediately closed and cannot be reinstated.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-rose-100 text-rose-700 rounded flex items-center justify-center text-xs mt-0.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </span>
            <p className="text-slate-700 text-sm">The interviewer will be notified automatically of the cancellation.</p>
          </div>
          <InfoNote type="info">
            <strong>Reassignment Option:</strong> If your interviewer cancelled or did not respond within 6 hours, you can reassign to another interviewer from your student dashboard. No additional payment is needed.
          </InfoNote>
        </div>
      </AccordionItem>

      {/* Reassignment Help */}
      <AccordionItem title="Reassigning an Interviewer" icon={RefreshCw}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <p className="text-slate-700">Go to your Student Dashboard and look for the "Reassign Alternative Interviewer" section.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <p className="text-slate-700">This section appears only when your original interviewer cancelled or did not respond within 6 hours.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <p className="text-slate-700">Select a new interviewer from the available list.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
            <p className="text-slate-700">Choose your preferred slot(s) for the new interview.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">5</span>
            <p className="text-slate-700">Confirm the reassignment. Your previous payment remains valid.</p>
          </div>
          <InfoNote type="warning">
            <strong>Payment Remains Valid:</strong> No new payment is required during reassignment. Your original payment covers the new booking.
          </InfoNote>
          <InfoNote type="info">
            The new interviewer will receive your reassignment request and can confirm one of your selected slots.
          </InfoNote>
        </div>
      </AccordionItem>

      {/* Rescheduling Help */}
      <AccordionItem title="Rescheduling an Interview" icon={RotateCcw}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center text-xs mt-0.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </span>
            <p className="text-slate-700 text-sm">If your interviewer requests a reschedule, you'll receive a notification on your dashboard.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center text-xs mt-0.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </span>
            <p className="text-slate-700 text-sm">Contact the interviewer directly to agree on a new time slot.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center text-xs mt-0.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </span>
            <p className="text-slate-700 text-sm">Once agreed, you can cancel the existing booking and create a new one with the updated slots.</p>
          </div>
          <InfoNote type="warning">
            <strong>Note:</strong> Cancelling and rebooking may be subject to the cancellation policy. Please plan ahead to avoid last-minute changes.
          </InfoNote>
        </div>
      </AccordionItem>

      {/* Technical Support */}
      <AccordionItem title="Technical Support" icon={Wrench}>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-slate-700 mb-2">Common Issues:</p>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• Page not loading</li>
              <li>• Login issues</li>
              <li>• Booking not updating</li>
              <li>• File upload problems</li>
              <li>• Dashboard not refreshing</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-2">Quick Fixes:</p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Refresh the page and try again.</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Log out and log back in to your account.</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Check your internet connection.</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Try using a different browser (Chrome, Firefox, Edge).</li>
            </ul>
          </div>
          <InfoNote type="info">
            If the issue persists, please contact the admin or technician using the contact details below.
          </InfoNote>
        </div>
      </AccordionItem>

      {/* Contact Support */}
      <div className="liquid-glass-panel p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Phone size={20} className="text-sky-600" />
          Contact Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/70 rounded-xl p-4 border border-white/60">
            <p className="text-sm font-semibold text-slate-700 mb-1">Admin Support</p>
            <p className="text-sm text-slate-600">Phone: <a href="tel:8095846864" className="text-sky-600 hover:underline">+91 8095846864</a></p>
            <p className="text-xs text-slate-500 mt-1">For payment, booking, and general issues.</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4 border border-white/60">
            <p className="text-sm font-semibold text-slate-700 mb-1">Technical Support</p>
            <p className="text-sm text-slate-600">Phone: <a href="tel:6363563195" className="text-sky-600 hover:underline">+91 6363563195</a></p>
            <p className="text-xs text-slate-500 mt-1">For technical issues and account problems.</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4 border border-white/60 md:col-span-2">
            <p className="text-sm font-semibold text-slate-700 mb-1">Email Support</p>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Mail size={16} className="text-sky-600" />
              <a href="mailto:supportinterviewhub@gmail.com" className="text-sky-600 hover:underline">supportinterviewhub@gmail.com</a>
            </p>
            <p className="text-xs text-slate-500 mt-1">For personal support and detailed issues. We respond within 24 hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
}