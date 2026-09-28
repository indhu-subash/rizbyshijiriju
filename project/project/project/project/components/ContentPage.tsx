import Link from 'next/link';

const pages: Record<
  string,
  {
    eyebrow: string;
    title: string;
    intro: string;
    sections: [string, string][];
    extra?: 'wholesale' | 'account';
  }
> = {
  about: {
    eyebrow: 'The Riz story',
    title: 'Jewellery that feels like you.',
    intro: 'Riz by Shijiriju is built around the idea that jewellery should feel personal, effortless and timeless.',
    sections: [
      [
        'Our story',
        'Riz by Shijiriju began with a simple love for the quiet glow of everyday jewellery. We wanted pieces that felt considered, wearable and true to the warmth of where we come from.',
      ],
      [
        'Our philosophy',
        'We believe jewellery should live with you — not be saved for special occasions alone. Each piece is designed to be reached for, layered and lived in.',
      ],
      [
        'Crafted with care',
        'Every piece is made with attention to the details that matter: considered finishes, wearable silhouettes and materials chosen for everyday comfort.',
      ],
      [
        'Kerala inspired',
        'Rooted in a love for warm light, familiar rituals and the richness of South Indian craft, Riz keeps tradition close while making space for the now.',
      ],
      [
        'Everyday jewellery',
        'From your first day at a new job to the dinner you have been looking forward to, our pieces are designed to move with you. Small details, soft gold and a quiet kind of confidence.',
      ],
    ],
  },
  care: {
    eyebrow: 'Care guide',
    title: 'Care for your jewellery.',
    intro: 'A little care goes a long way. Follow these simple rituals to keep your pieces beautiful.',
    sections: [
      ['Keep it dry', 'Remove pieces before showers, swimming or exercise. Moisture is the quickest way to dull a finish.'],
      ['Avoid perfumes', 'Apply fragrance and let it dry before putting on your jewellery.'],
      ['Avoid chemicals', 'Keep pieces away from lotions, sanitisers and cleaning products.'],
      ['Store separately', 'Keep each piece in its Riz pouch or a soft-lined box so chains do not tangle and surfaces stay scratch-free.'],
      ['Clean gently', 'Use a soft, dry cloth after wearing. Avoid abrasive cleaners and polishing cloths made for solid gold.'],
      ['Put jewellery on after makeup', 'Makeup, perfume and hair products can leave a film. Always make jewellery the last thing you put on.'],
    ],
  },
  faq: {
    eyebrow: 'Need to know',
    title: 'Frequently asked.',
    intro: 'Everything you need to feel good about your Riz order.',
    sections: [
      ['How long does delivery take?', 'Orders are packed within 1–2 working days and delivered in 3–5 working days across India.'],
      ['What payment methods do you accept?', 'We accept secure online payments via Instant UPI (GPay, PhonePe, Paytm), Credit Cards, Debit Cards, and Net Banking powered by Razorpay.'],
      ['Are the pieces anti-tarnish?', 'Selected pieces have an anti-tarnish finish, noted clearly on their product page.'],
      ['How should I care for my jewellery?', 'Keep it dry, avoid perfumes and chemicals, store separately and clean gently with a soft cloth.'],
      ['Do you accept returns?', 'We accept return and refund requests for eligible order issues (such as damaged or wrong items) within 7 days of delivery. Approved refunds are processed within 5–7 working days.'],
      ['How can I track my order?', 'Use your order ID on our Order Tracking page.'],
      ['Do you offer wholesale?', 'Yes. Visit our wholesale page to send an enquiry.'],
      ['How can I contact you?', 'Message us on WhatsApp (+91 9072308686) or email rizbyshijiriju@gmail.com — we reply promptly.'],
    ],
  },
  shipping: {
    eyebrow: 'The details',
    title: 'Shipping & delivery',
    intro: 'A calm, considered delivery experience from our door to yours.',
    sections: [
      ['Dispatch', 'Orders are packed and dispatched within 1–2 working days. You will receive tracking details via email or SMS as soon as your order leaves us.'],
      ['Delivery times', 'Standard delivery across India usually takes 3–5 working days. Remote locations or international shipping times may vary based on local logistics.'],
      ['Free shipping', 'Free shipping is available on eligible Indian orders with a subtotal of ₹2,000 or more. Standard shipping rates apply for orders below ₹2,000.'],
      ['Need help?', 'Message us on WhatsApp (+91 9072308686) or email rizbyshijiriju@gmail.com for any assistance with your delivery status.'],
    ],
  },
  returns: {
    eyebrow: 'The details',
    title: 'Returns & refund policy',
    intro: 'We want you to love your Riz. If something is not quite right with your order, we are here to help.',
    sections: [
      ['7-Day Return Policy', 'We accept return and refund requests within 7 days of delivery for eligible order-related issues, including receiving a damaged product, receiving the wrong product, shipping issues, or a product mismatch with your order.'],
      ['How to request a return', 'If you experience an issue with your purchase, please contact us within 7 days of delivery with your order ID, a summary of the issue, and supporting photos or videos so our support team can assist you.'],
      ['Exchanges', 'Where applicable and subject to stock availability, we can arrange an exchange for a replacement piece of equal value.'],
      ['Refund timeline', 'Approved refunds will be processed within 5–7 working days through the original payment method. Please note that the time taken for the refunded amount to reflect in your account may vary depending on your bank or payment provider.'],
      ['Customer Support', 'Contact us via email at rizbyshijiriju@gmail.com or WhatsApp at +91 9072308686 with your order details for return assistance.'],
    ],
  },
  privacy: {
    eyebrow: 'The fine print',
    title: 'Privacy policy',
    intro: 'At Riz by Shijiriju, your privacy and trust are paramount. This policy explains how we handle your personal information when you shop with us.',
    sections: [
      ['Information we collect', 'We collect information necessary to fulfill your orders and provide customer support, including your name, email address, phone number, shipping address, and order details.'],
      ['How we use your information', 'Your information is used strictly to process and deliver your orders, send order status updates, respond to inquiries, and improve our services.'],
      ['Payment processing', 'Online payments are processed securely through Razorpay. We do not store or process your credit card numbers, CVVs, net banking credentials, or UPI PINs on our servers.'],
      ['Information sharing', 'We share customer information only with trusted third-party logistics partners and payment gateways essential to fulfilling your orders. We do not sell or rent customer data to third parties.'],
      ['Contact & Privacy Requests', 'For any privacy inquiries or updates to your details, please reach out to us at rizbyshijiriju@gmail.com.'],
    ],
  },
  terms: {
    eyebrow: 'The fine print',
    title: 'Terms & conditions',
    intro: 'Welcome to Riz by Shijiriju. By accessing or using our website, you agree to these terms.',
    sections: [
      ['Orders & Availability', 'All orders placed on our website are subject to product availability and acceptance. We reserve the right to cancel or limit orders if an item becomes unavailable.'],
      ['Product Information', 'We make every effort to display product colors, details, and finishes accurately. Small variations may occur due to screen settings or handcrafted material characteristics.'],
      ['Pricing & Payment', 'Prices are displayed in Indian Rupees (INR). Payments must be completed online via Razorpay (Instant UPI or Credit/Debit Cards).'],
      ['Shipping & Delivery', 'Delivery timelines and shipping charges are governed by our Shipping Policy. Free shipping applies to eligible Indian orders of ₹2,000 or more.'],
      ['Returns & Refunds', 'Return and refund requests are handled according to our 7-day Return & Refund Policy for eligible order issues.'],
      ['Customer Support', 'If you have any questions regarding these terms, please email us at rizbyshijiriju@gmail.com or WhatsApp +91 9072308686.'],
    ],
  },
  account: {
    eyebrow: 'Your account',
    title: 'Welcome back.',
    intro: 'Sign in to track orders, save favourites and check out faster.',
    sections: [],
  },
  login: {
    eyebrow: 'Your account',
    title: 'Welcome back.',
    intro: 'Sign in to track orders, save favourites and check out faster.',
    sections: [],
  },
  signup: {
    eyebrow: 'Join Riz',
    title: 'Create your account.',
    intro: 'Save favourites, track orders and check out faster.',
    sections: [],
  },
  wholesale: {
    eyebrow: 'For retailers',
    title: 'Jewellery for your store.',
    intro: 'Partner with Riz by Shijiriju for thoughtfully made jewellery your customers will love.',
    sections: [
      ['Bulk ordering', 'Order in quantities that suit your store across our everyday and festive collections.'],
      ['Direct Wholesale Enquiries', 'Reach out via WhatsApp and our team will share our latest catalogue and wholesale details.'],
      ['Anti-Tarnish Jewellery', 'Offer your customers premium anti-tarnish everyday jewellery crafted for durability and lasting shine.'],
      ['Retailer benefits', 'Dedicated account support, early access to new drops and marketing materials to help your store tell the Riz story.'],
    ],
    extra: 'wholesale',
  },
};

export function ContentPage({ type }: { type: string }) {
  const page = pages[type] || pages.about;
  return (
    <main>
      <div className="content-hero container">
        <span className="eyebrow">{page.eyebrow}</span>
        <h1 className="serif">{page.title}</h1>
        <p>{page.intro}</p>
      </div>
      {page.extra === 'wholesale' ? (
        <section className="wholesale-layout container">
          <div className="content-body">
            {page.sections.map(([heading, text]) => (
              <article key={heading}>
                <h2 className="serif">{heading}</h2>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <aside>
            <div className="wholesale-form-card">
              <span className="eyebrow">Send an enquiry</span>
              <h2 className="serif">Become a stockist.</h2>
              <form>
                <label>
                  Store name
                  <input required placeholder="Your store name" />
                </label>
                <label>
                  Your name
                  <input required placeholder="Your full name" />
                </label>
                <label>
                  Email
                  <input required type="email" placeholder="you@example.com" />
                </label>
                <label>
                  Phone
                  <input required type="tel" placeholder="Your mobile number" />
                </label>
                <label>
                  Message
                  <textarea required rows={4} placeholder="Tell us about your store..." />
                </label>
                <button className="button">Send enquiry</button>
              </form>
              <a href="https://wa.me/919072308686" target="_blank" rel="noreferrer" className="button secondary wholesale-whatsapp">
                Chat on WhatsApp
              </a>
            </div>
          </aside>
        </section>
      ) : (
        <section className="content-body container">
          {page.sections.map(([heading, text]) => (
            <article key={heading}>
              <h2 className="serif">{heading}</h2>
              <p>{text}</p>
            </article>
          ))}
          {type === 'faq' && (
            <Link href="/contact" className="button">
              Still have a question?
            </Link>
          )}
          {(type === 'login' || type === 'signup') && (
            <div className="auth-form">
              <form>
                <label>
                  Email
                  <input required type="email" placeholder="you@example.com" />
                </label>
                <label>
                  Password
                  <input required type="password" placeholder="Your password" />
                </label>
                <button className="button">{type === 'login' ? 'Sign in' : 'Create account'}</button>
              </form>
              {type === 'login' ? (
                <p>
                  New to Riz? <Link href="/signup">Create an account</Link>
                </p>
              ) : (
                <p>
                  Already have an account? <Link href="/login">Sign in</Link>
                </p>
              )}
            </div>
          )}
          {type === 'account' && (
            <div className="account-dashboard">
              <div className="account-nav">
                <Link href="/account" className="active">
                  Profile
                </Link>
                <Link href="/track-order">Orders</Link>
                <Link href="/wishlist">Wishlist</Link>
                <Link href="/login">Logout</Link>
              </div>
              <div className="account-panel">
                <h2 className="serif">Your profile</h2>
                <p className="muted">Manage your details and saved pieces.</p>
                <form>
                  <label>
                    Name
                    <input required placeholder="Your name" />
                  </label>
                  <label>
                    Email
                    <input required type="email" placeholder="you@example.com" />
                  </label>
                  <label>
                    Phone
                    <input required type="tel" placeholder="Your mobile number" />
                  </label>
                  <button className="button">Save changes</button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
