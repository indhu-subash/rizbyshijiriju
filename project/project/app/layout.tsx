import type { Metadata } from 'next';
import { StoreProvider } from '@/components/StoreProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import './globals.css';

export const metadata: Metadata = { title: { default: 'Riz by Shijiriju — Jewellery made for every chapter', template: '%s | Riz by Shijiriju' }, description: 'Contemporary jewellery designed to become part of your everyday.', openGraph: { title: 'Riz by Shijiriju', description: 'Affordable luxury jewellery for every chapter.' } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><StoreProvider><Header />{children}<Footer /><WhatsAppButton /></StoreProvider></body></html>; }
