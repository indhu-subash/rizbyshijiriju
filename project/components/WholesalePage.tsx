import { Check } from 'lucide-react';
import { WholesaleEnquiryForm } from '@/components/WholesaleEnquiryForm';
import {
  buildWhatsAppUrl,
  WHOLESALE_BENEFITS,
  WHOLESALE_STEPS,
  WHOLESALE_FAQS,
} from '@/lib/wholesaleConfig';

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.403 5.604A9.878 9.878 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zm-6.363 14.53c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a7.878 7.878 0 0 1-1.21-4.36c0-4.38 3.56-7.94 7.95-7.94 2.12 0 4.12.83 5.62 2.33a7.902 7.902 0 0 1 2.33 5.62c0 4.38-3.57 7.94-7.95 7.94zm4.35-5.96c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.09.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"
      />
    </svg>
  );
}

function WhatsAppCta({ url, className = '' }: { url: string | null; className?: string }) {
  // No valid number configured => render nothing rather than a broken link.
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`button ws-whatsapp ${className}`}
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
    >
      <WhatsAppIcon /> Chat with Us on WhatsApp
    </a>
  );
}

export function WholesalePage() {
  // NEXT_PUBLIC_* is inlined at build time. Digits only, international format, no "+" or spaces.
  const waUrl = buildWhatsAppUrl(process.env.NEXT_PUBLIC_WHOLESALE_WHATSAPP_NUMBER);

  return (
    <main className="ws-page">
      {/* 1. Hero */}
      <section className="ws-hero">
        <div className="container ws-hero-inner">
          <span className="eyebrow">Wholesale</span>
          <h1 className="serif">Wholesale with RIZ</h1>
          <p>
            Discover our collection of elegant everyday jewellery and explore wholesale opportunities with RIZ by Shijiriju.
          </p>
          <div className="ws-hero-actions">
            <a href="#why-wholesale" className="button">Explore Wholesale</a>
            <WhatsAppCta url={waUrl} />
          </div>
        </div>
      </section>

      {/* 2. Why choose RIZ wholesale */}
      <section id="why-wholesale" className="section">
        <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Why RIZ</span>
            <h2>Why Choose RIZ Wholesale?</h2>
          </div>
        </div>
        <ul className="ws-benefits">
          {WHOLESALE_BENEFITS.map((b) => (
            <li key={b.title}>
              <span className="ws-benefit-icon" aria-hidden="true"><Check size={16} /></span>
              <div>
                <h3 className="serif">{b.title}</h3>
                <p>{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
        </div>
      </section>

      {/* 3. How it works */}
      <section className="section section-tinted">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Process</span>
              <h2>How It Works</h2>
            </div>
          </div>
          <ol className="ws-steps">
            {WHOLESALE_STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="ws-step-num serif" aria-hidden="true">{i + 1}</span>
                <h3 className="serif">{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. Enquiry form */}
      <section id="wholesale-enquiry" className="section">
        <div className="container ws-enquiry">
          <div className="ws-enquiry-intro">
            <span className="eyebrow">Enquiry</span>
            <h2 className="serif">Send a Wholesale Enquiry</h2>
            <p>Tell us a little about your business and we will get back to you with the details.</p>
            {waUrl && (
              <div className="ws-enquiry-wa">
                <p>Prefer to talk? Message us directly.</p>
                <WhatsAppCta url={waUrl} />
              </div>
            )}
          </div>
          <div className="ws-form-card">
            <WholesaleEnquiryForm />
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="section section-tinted">
        <div className="container ws-faq">
          <div className="section-head">
            <div>
              <span className="eyebrow">FAQ</span>
              <h2>Frequently Asked Questions</h2>
            </div>
          </div>
          {WHOLESALE_FAQS.map((f) => (
            <details key={f.q} className="ws-faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
