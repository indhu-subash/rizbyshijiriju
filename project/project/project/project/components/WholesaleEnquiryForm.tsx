'use client';

import { useRef, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

type Fields = {
  fullName: string;
  businessName: string;
  email: string;
  whatsappNumber: string;
  location: string;
  estimatedQuantity: string;
  message: string;
};

const EMPTY: Fields = { fullName: '', businessName: '', email: '', whatsappNumber: '', location: '', estimatedQuantity: '', message: '' };

// Mirrors the server-side rules in backend/src/utils/wholesaleValidation.ts
function validate(f: Fields): Partial<Record<keyof Fields, string>> {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
  if (f.businessName.trim().length < 2) e.businessName = 'Please enter your business or store name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Please enter a valid email address.';
  if (!/^\+?\d{8,15}$/.test(f.whatsappNumber.replace(/[\s\-().]/g, ''))) e.whatsappNumber = 'Enter a valid number with country code, e.g. +91 98765 43210.';
  if (f.location.trim().length < 2) e.location = 'Please enter your location.';
  if (!/^\d{1,7}$/.test(f.estimatedQuantity.trim()) || Number(f.estimatedQuantity) < 1) e.estimatedQuantity = 'Enter a whole number of pieces (1 or more).';
  if (f.message.trim().length > 0 && f.message.trim().length < 3) e.message = 'Message is too short.';
  return e;
}

export function WholesaleEnquiryForm() {
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const lock = useRef(false); // synchronous guard against double-clicks / double-submits

  const set = (k: keyof Fields) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: ev.target.value }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    if (status === 'success' || status === 'error') setStatus('idle');
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (lock.current) return;
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setStatus('error');
      setFeedback('Please correct the highlighted fields.');
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(`ws-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in el && typeof (el as any).focus === 'function') {
          (el as any).focus({ preventScroll: true });
        }
      }
      return;
    }
    lock.current = true;
    setStatus('submitting');
    setFeedback('');
    try {
      const res = await api.wholesale.submitEnquiry({
        fullName: values.fullName,
        businessName: values.businessName,
        email: values.email,
        whatsappNumber: values.whatsappNumber,
        location: values.location,
        estimatedQuantity: Number(values.estimatedQuantity),
        message: values.message,
        website: honeypot,
      });
      setStatus('success');
      setFeedback(res?.message || 'Thank you! Your enquiry has been received.');
      setValues(EMPTY);
    } catch (err: any) {
      setStatus('error');
      setFeedback(err?.message || 'Something went wrong. Please try again or chat with us on WhatsApp.');
    } finally {
      lock.current = false;
    }
  };

  const busy = status === 'submitting';
  const field = (k: keyof Fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="ws-field">
      <span>{label}</span>
      <input
        id={`ws-${k}`}
        value={values[k]}
        onChange={set(k)}
        disabled={busy}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `ws-${k}-err` : undefined}
        {...props}
      />
      {errors[k] && <em id={`ws-${k}-err`} className="ws-field-error" role="alert">{errors[k]}</em>}
    </label>
  );

  return (
    <form className="ws-form" onSubmit={onSubmit} noValidate aria-busy={busy}>
      <div className="ws-form-grid">
        {field('fullName', 'Full Name', { autoComplete: 'name', maxLength: 100, placeholder: 'Your full name' })}
        {field('businessName', 'Business / Store Name', { autoComplete: 'organization', maxLength: 150, placeholder: 'Your business or store name' })}
        {field('email', 'Email Address', { type: 'email', autoComplete: 'email', maxLength: 254, placeholder: 'you@example.com' })}
        {field('whatsappNumber', 'WhatsApp Number', { type: 'tel', autoComplete: 'tel', maxLength: 30, placeholder: '+91 98765 43210' })}
        {field('location', 'Location', { autoComplete: 'address-level2', maxLength: 150, placeholder: 'City, State / Country' })}
        {field('estimatedQuantity', 'Estimated Order Quantity', { type: 'number', inputMode: 'numeric', min: 1, max: 1000000, placeholder: 'Approx. number of pieces' })}
      </div>
      <label className="ws-field">
        <span>Message <small>(optional)</small></span>
        <textarea
          rows={4}
          value={values.message}
          onChange={set('message')}
          disabled={busy}
          maxLength={2000}
          placeholder="Tell us about your business and what you are looking for"
          aria-invalid={!!errors.message}
        />
        {errors.message && <em className="ws-field-error" role="alert">{errors.message}</em>}
      </label>

      {/* Honeypot - hidden from people and assistive tech; bots tend to fill it. */}
      <div className="ws-hp" aria-hidden="true">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      <button type="submit" className="button ws-submit" disabled={busy}>
        {busy ? (<><Loader2 size={16} className="ws-spin" /> Sending…</>) : 'Send Enquiry'}
      </button>

      <div className="ws-status" role="status" aria-live="polite">
        {status === 'success' && <p className="ws-msg ws-msg-ok"><CheckCircle2 size={16} /> {feedback}</p>}
        {status === 'error' && <p className="ws-msg ws-msg-err"><AlertCircle size={16} /> {feedback}</p>}
      </div>
    </form>
  );
}
