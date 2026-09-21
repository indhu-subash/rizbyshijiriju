'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Mail, MessageCircle, Facebook } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link href="/" className="logo footer-logo brand-mark">
              <Image src="/logo.png" alt="Riz by Shijiriju" width={92} height={70} />
            </Link>
            <p className="footer-intro">
              Jewellery made for every chapter.
              <br />
              Contemporary pieces, thoughtfully made.
            </p>
            <div className="socials">
              <a href="https://www.instagram.com/rizbyshijiriju?stkn=bnducXZ3MGFsd3ZA0" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram size={17} />
              </a>
              <a href="https://wa.me/919072308686" target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <MessageCircle size={17} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook size={17} />
              </a>
              <a href="mailto:rizbyshijiriju@gmail.com" aria-label="Email">
                <Mail size={17} />
              </a>
            </div>
          </div>
          <FooterColumn
            title="Shop"
            links={[
              ['All jewellery', '/shop'],
              ['New arrivals', '/new-arrivals'],
              ['Bestsellers', '/best-sellers'],
              ['Anti-tarnish', '/collections/anti-tarnish'],
              ['Traditional', '/collections/traditional'],
              ["Men's", '/collections/mens'],
              ['Kids', '/collections/kids'],
              ['Wholesale', '/wholesale'],
            ]}
          />
          <FooterColumn
            title="Categories"
            links={[
              ['Earrings', '/shop?category=Earrings'],
              ['Rings', '/shop?category=Rings'],
              ['Necklaces', '/shop?category=Necklaces'],
              ['Bracelets', '/shop?category=Bracelets'],
              ['Nose pins', '/shop?category=Nose%20Pins'],
              ['Second studs', '/shop?category=Second%20Studs'],
            ]}
          />
          <FooterColumn
            title="Help"
            links={[
              ['Contact', '/contact'],
              ['FAQ', '/faq'],
              ['Shipping', '/shipping'],
              ['Returns', '/returns'],
              ['Track order', '/track-order'],
              ['Jewellery care', '/care'],
            ]}
          />
          <FooterColumn
            title="About"
            links={[
              ['Our story', '/about'],
              ['Our philosophy', '/about'],
              ['Privacy', '/privacy'],
              ['Terms', '/terms'],
              ['Refund policy', '/returns'],
            ]}
          />
        </div>
        <div className="footer-bottom">
          <span>© 2026 Riz by Shijiriju</span>
          <span>Secure checkout · Made with intention</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h4>{title}</h4>
      {links.map(([label, href]) => (
        <Link key={`${title}-${href}-${label}`} href={href}>
          {label}
        </Link>
      ))}
    </div>
  );
}
