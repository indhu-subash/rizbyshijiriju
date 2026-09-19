'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <a
      className="whatsapp"
      href="https://wa.me/919999999999"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={21} />
      <span>Chat with us</span>
    </a>
  );
}
