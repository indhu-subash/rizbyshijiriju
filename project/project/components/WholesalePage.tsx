'use client';

import { MessageCircle, CheckCircle2 } from 'lucide-react';

const WHATSAPP_BASE_URL = 'https://wa.me/919072308686';

function getWhatsAppLink() {
  const message = "Hi RIZ by Shijiriju, I'm interested in becoming a wholesale customer. Please share your wholesale details.";
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}

export function WholesalePage() {
  const whatsappUrl = getWhatsAppLink();

  return (
    <main className="wholesale-page-wrapper">
      <section className="wholesale-hero">
        <div className="container">
          <span className="eyebrow">RIZ BY SHIJIRIJU</span>
          <h1 className="serif">Wholesale Enquiries</h1>
          <p className="wholesale-hero-text">
            Riz by Shijiriju welcomes wholesale partners and stockists. We offer thoughtfully made, anti-tarnish everyday jewellery. Connect directly with our team to discuss wholesale details.
          </p>
          <div className="wholesale-hero-actions" style={{ marginTop: '24px' }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="button primary-whatsapp-cta"
            >
              <MessageCircle size={18} style={{ marginRight: 8 }} />
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="wholesale-info-section">
        <div className="container">
          <div className="wholesale-info-grid">
            <div className="wholesale-info-card">
              <CheckCircle2 size={24} style={{ color: 'var(--sage)', marginBottom: '12px' }} />
              <h3 className="serif">Direct Wholesale Enquiries</h3>
              <p>Connect directly with our team on WhatsApp to request catalogue details and availability.</p>
            </div>
            <div className="wholesale-info-card">
              <CheckCircle2 size={24} style={{ color: 'var(--sage)', marginBottom: '12px' }} />
              <h3 className="serif">Anti-Tarnish Jewellery</h3>
              <p>Explore our anti-tarnish jewellery collection for wholesale opportunities.</p>
            </div>
            <div className="wholesale-info-card">
              <CheckCircle2 size={24} style={{ color: 'var(--sage)', marginBottom: '12px' }} />
              <h3 className="serif">Personalised Assistance</h3>
              <p>Our team is available to assist stockists and retail partners with orders and product guidance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="wholesale-cta-section container">
        <div className="wholesale-cta-card">
          <span className="eyebrow">BECOME A STOCKIST</span>
          <h2 className="serif">Ready to partner with Riz?</h2>
          <p>Get in touch with us on WhatsApp to receive complete details and explore wholesale opportunities.</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="button primary-whatsapp-cta"
            style={{ display: 'inline-flex', marginTop: '20px' }}
          >
            <MessageCircle size={18} style={{ marginRight: 8 }} />
            Enquire on WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
