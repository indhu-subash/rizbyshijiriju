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
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm5.82 14.07c-.24.68-1.22 1.25-1.68 1.29-.44.04-.86.21-2.9-0.67-2.46-1.06-4.06-3.54-4.18-3.7-.12-.17-1.01-1.34-1.01-2.55 0-1.21.63-1.8 0.85-2.05.22-.25.49-.31.65-.31.16 0 .33 0 .47.01.15.01.35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.27.02.43-.08.16-.12.26-.24.4-.12.15-.26.33-.37.44-.12.12-.25.26-.11.5.14.25.64 1.05 1.37 1.7 0.94.84 1.73 1.1 1.98 1.22.25.12.39.1.53-.06.14-.16.61-.71.77-.95.16-.24.33-.2.55-.12.22.08 1.41.67 1.65.79.24.12.4.18.46.28.06.1.06.59-.18 1.27z"
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
