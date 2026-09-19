import Link from 'next/link';

interface Section {
  [0]: string;
  [1]: string;
}

interface PageConfig {
  eyebrow: string;
  title: string;
  intro: string;
  sections: [string, string][];
  extra?: 'wholesale' | 'account';
}

const pages: Record<string, PageConfig> = {
  about: {
    eyebrow: 'The Riz story',
    title: 'Jewellery that feels like you.',
    intro: 'Riz by Shijiriju is built around the idea that jewellery should feel personal, effortless and timeless.',
    sections: [
      ['Our story', 'Riz by Shijiriju began with a simple love for the quiet glow of everyday jewellery. We wanted pieces that felt considered, wearable and true to the warmth of where we come from.'],
      ['Our philosophy', 'We believe jewellery should live with you — not be saved for special occasions alone. Each piece is designed to be reached for, layered and lived in.'],
      ['Crafted with care', 'Every piece is made with attention to the details that matter: considered finishes, wearable silhouettes and materials chosen for everyday comfort.'],
      ['Kerala inspired', 'Rooted in a love for warm light, familiar rituals and the richness of South Indian craft, Riz keeps tradition close while making space for the now.'],
      ['Everyday jewellery', 'From your first day at a new job to the dinner you have been looking forward to, our pieces are designed to move with you. Small details, soft gold and a quiet kind of confidence.']
    ]
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
      ['Put jewellery on after makeup', 'Makeup, perfume and hair products can leave a film. Always make jewellery the last thing you put on.']
    ]
  },
  faq: {
    eyebrow: 'Need to know',
    title: 'Frequently asked.',
    intro: 'Everything you need to feel good about your Riz order.',
    sections: [
      ['How long does delivery take?', 'Orders are packed within 1–2 working days and delivered in 3–5 working days across India.'],
      ['Do you offer COD?', 'Yes, cash on delivery is available on eligible orders.'],
      ['Are the pieces anti-tarnish?', 'Selected pieces have an anti-tarnish finish, noted clearly on their product page.'],
      ['How should I care for my jewellery?', 'Keep it dry, avoid perfumes and chemicals, store separately and clean gently with a soft cloth.'],
      ['Do you accept returns?', 'Unused pieces in original packaging can be returned within 7 days.'],
      ['How can I track my order?', 'Use your order ID on our Order Tracking page.'],
      ['Do you offer wholesale?', 'Yes. Visit our wholesale page to send an enquiry.'],
      ['How can I contact you?', 'Message us on WhatsApp or email — we usually reply within a few hours.']
    ]
  },
  shipping: {
    eyebrow: 'The details',
    title: 'Shipping & delivery',
    intro: 'A calm, considered delivery experience from our door to yours.',
    sections: [
      ['Dispatch', 'Orders are packed within 1–2 working days. You will receive an update when your order leaves us.'],
      ['Delivery times', 'Most orders arrive within 3–5 working days. Remote locations may take a little longer.'],
      ['Free shipping', 'Enjoy complimentary shipping on orders above ₹999.'],
      ['Need help?', 'Message us on WhatsApp and we will be happy to help with your order.']
    ]
  },
  returns: {
    eyebrow: 'The details',
    title: 'Returns & exchange',
    intro: 'We want you to love your Riz. If something is not quite right, we are here.',
    sections: [
      ['7-day returns', 'Unused pieces in their original condition and packaging can be returned within 7 days of delivery.'],
      ['Exchange', 'We can help arrange an exchange for a different piece of equal value, subject to availability.'],
      ['Start a return', 'Contact us with your order ID and a quick note about what you would like to return.']
    ]
  },
  privacy: {
    eyebrow: 'The fine print',
    title: 'Privacy policy',
    intro: 'Your trust matters to us. This placeholder policy is ready to be edited with your final legal wording.',
    sections: [
      ['Information we collect', 'We collect the details needed to fulfil orders, answer questions and improve your shopping experience.'],
      ['How we use it', 'Your information is used to provide services you request and communicate important order updates.']
    ]
  },
  terms: {
    eyebrow: 'The fine print',
    title: 'Terms & conditions',
    intro: 'A simple overview of using the Riz by Shijiriju store.',
    sections: [
      ['Orders', 'All orders are subject to availability and confirmation.'],
      ['Products', 'Colours and finishes may vary slightly due to screen settings and the nature of the materials.'],
      ['Contact', 'Reach out before ordering if you need help with sizing, care or delivery.']
    ]
  },
  account: {
    eyebrow: 'Your account',
    title: 'Welcome back.',
    intro: 'Sign in to track orders, save favourites and check out faster.',
    sections: []
  },
  login: {
    eyebrow: 'Your account',
    title: 'Welcome back.',
    intro: 'Sign in to track orders, save favourites and check out faster.',
    sections: []
  },
  signup: {
    eyebrow: 'Join Riz',
    title: 'Create your account.',
    intro: 'Save favourites, track orders and check out faster.',
    sections: []
  },
  wholesale: {
    eyebrow: 'For retailers',
    title: 'Jewellery for your store.',
    intro: 'Partner with Riz by Shijiriju for thoughtfully made jewellery your customers will love.',
    sections: [
      ['Bulk ordering', 'Order in quantities that suit your store, with flexible minimums across our everyday and festive collections.'],
      ['Wholesale pricing', 'Enjoy tiered wholesale pricing designed to keep your margins healthy while staying accessible to your customers.'],
      ['Minimum order', 'Our minimum wholesale order is ₹15,000. Reach out and we will share our latest catalogue and price list.'],
      ['Retailer benefits', 'Dedicated account support, early access to new drops and marketing materials to help your store tell the Riz story.']
    ],
    extra: 'wholesale'
  }
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
                <button className="button" type="submit">
                  Send enquiry
                </button>
              </form>
              <a href="https://wa.me/919999999999" className="button secondary wholesale-whatsapp">
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
                <button className="button" type="submit">
                  {type === 'login' ? 'Sign in' : 'Create account'}
                </button>
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
                  <button className="button" type="submit">
                    Save changes
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
