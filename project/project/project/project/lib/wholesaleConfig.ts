/**
 * Wholesale page configuration.
 * All copy that depends on business policy lives here so it can be edited in one place.
 * No MOQ, discount or pricing figures are stated - those are shared by the RIZ team directly.
 */

export const WHOLESALE_WHATSAPP_MESSAGE = `Hello RIZ by Shijiriju!

I'm interested in your wholesale jewellery programme.

I would like to know more about:
- Wholesale pricing.
- Minimum order quantity.
- Available designs.
- Bulk purchasing options.

Please share the details.

Thank you!`;

/**
 * Builds an official WhatsApp click-to-chat URL: https://wa.me/<number>?text=<encoded message>
 * The number must be international format, digits only (no +, spaces or dashes).
 * Returns null when no valid number is configured, so callers can hide the button instead of
 * rendering a dead link.
 */
export function buildWhatsAppUrl(rawNumber: string | undefined, message: string = WHOLESALE_WHATSAPP_MESSAGE): string | null {
  const digits = (rawNumber || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  const encoded = encodeURIComponent(message).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  return `https://wa.me/${digits}?text=${encoded}`;
}

export const WHOLESALE_BENEFITS: { title: string; text: string }[] = [
  { title: 'Curated jewellery collections', text: 'Elegant everyday designs chosen with care for modern wearers.' },
  { title: 'Bulk purchasing opportunities', text: 'Enquire about ordering in larger quantities for your store or business.' },
  { title: 'Dedicated business support', text: 'Our team is available to answer your questions and guide you through the process.' },
  { title: 'Wholesale pricing information', text: 'Share your requirements and we will send you the wholesale details.' },
  { title: 'Assistance with product selection', text: 'Not sure what suits your customers? We will help you choose.' },
];

export const WHOLESALE_STEPS: { title: string; text: string }[] = [
  { title: 'Send an Enquiry', text: 'Fill in the form or message us on WhatsApp.' },
  { title: 'Discuss Your Requirements', text: 'Tell us about your business and what you are looking for.' },
  { title: 'Receive Wholesale Details', text: 'We share the relevant wholesale information with you.' },
  { title: 'Confirm Your Bulk Order', text: 'Once you are happy, we confirm your bulk order together.' },
];

export const WHOLESALE_FAQS: { q: string; a: string }[] = [
  {
    q: 'How can I become a wholesale customer?',
    a: 'Send us an enquiry using the form on this page or message us on WhatsApp. Our team will get in touch with you to discuss your requirements.',
  },
  {
    q: 'Is there a minimum order quantity?',
    a: 'Minimum order quantities are shared directly by our team when you enquire. Please send an enquiry or chat with us on WhatsApp to get the current details.',
  },
  {
    q: 'How can I receive wholesale pricing?',
    a: 'Wholesale pricing details are shared after you send an enquiry. Tell us about your business and the quantities you are considering, and we will respond with the relevant information.',
  },
  {
    q: 'Can I discuss bulk orders through WhatsApp?',
    a: 'Yes. Use the "Chat with Us on WhatsApp" button on this page to start a conversation with our team about bulk orders.',
  },
  {
    q: 'How can I contact RIZ?',
    a: 'You can reach us through the wholesale enquiry form, on WhatsApp, or via the Contact page on our website.',
  },
];
