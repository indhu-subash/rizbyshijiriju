'use client';

import { usePathname } from 'next/navigation';

export function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <a
      className="whatsapp"
      href="https://wa.me/919072308686"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <svg
        className="whatsapp-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm5.82 14.07c-.24.68-1.22 1.25-1.68 1.29-.44.04-.86.21-2.9-0.67-2.46-1.06-4.06-3.54-4.18-3.7-.12-.17-1.01-1.34-1.01-2.55 0-1.21.63-1.8 0.85-2.05.22-.25.49-.31.65-.31.16 0 .33 0 .47.01.15.01.35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.27.02.43-.08.16-.12.26-.24.4-.12.15-.26.33-.37.44-.12.12-.25.26-.11.5.14.25.64 1.05 1.37 1.7 0.94.84 1.73 1.1 1.98 1.22.25.12.39.1.53-.06.14-.16.61-.71.77-.95.16-.24.33-.2.55-.12.22.08 1.41.67 1.65.79.24.12.4.18.46.28.06.1.06.59-.18 1.27z"
        />
      </svg>
      <span className="whatsapp-text">Chat with us</span>
    </a>
  );
}
