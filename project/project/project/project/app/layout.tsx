import type { Metadata } from 'next';
import Script from 'next/script';
import { StoreProvider } from '@/components/StoreProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Riz by Shijiriju — Jewellery made for every chapter',
    template: '%s | Riz by Shijiriju',
  },
  description: 'Contemporary jewellery designed to become part of your everyday.',
  openGraph: {
    title: 'Riz by Shijiriju',
    description: 'Affordable luxury jewellery for every chapter.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <Script id="gtm-datalayer" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>

        <Script
          id="gtm-script"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-K5QC5C28"
        />
      </head>

      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K5QC5C28"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <StoreProvider>
          <Header />
          {children}
          <Footer />
          <WhatsAppButton />
        </StoreProvider>
      </body>
    </html>
  );
}