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
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
