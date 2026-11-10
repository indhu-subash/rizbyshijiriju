'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, Copy, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

interface Coupon {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiryDate?: string | null;
}

// Fallback verified store offer in case API response is empty or offline
const FALLBACK_OFFERS: Coupon[] = [
  {
    code: 'RIZ',
    discountType: 'percentage',
    discountValue: 5,
    minOrderValue: 0,
    maxDiscount: undefined,
    expiryDate: null,
  },
];

export function AvailableOffers() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function loadCoupons() {
      try {
        const res = await api.coupons.public();
        if (isMounted) {
          const list = Array.isArray(res?.coupons) && res.coupons.length > 0 ? res.coupons : FALLBACK_OFFERS;
          setCoupons(list);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Could not load dynamic public coupons, using standard offers:', err);
        if (isMounted) {
          setCoupons(FALLBACK_OFFERS);
          setLoading(false);
        }
      }
    }

    loadCoupons();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      // Fallback
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2500);
    }
  };

  if (loading) {
    return (
      <section className="section-sm container" aria-label="Available Offers Loading">
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <span className="eyebrow" style={{ color: '#a9895b' }}>SPECIAL OFFERS</span>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '6px' }}>Curating active promotions for you...</p>
        </div>
      </section>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile-responsive styles */}
      <style>{`
        .offers-section {
          padding-top: clamp(24px, 4vw, 40px);
          padding-bottom: clamp(36px, 5vw, 52px);
        }
        .offers-head-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: clamp(20px, 3vw, 28px);
        }
        .offers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
          gap: clamp(14px, 2.5vw, 20px);
        }
        .offers-card {
          background: #ffffff;
          border: 1px solid #e9dfd1;
          border-radius: 12px;
          padding: clamp(18px, 3vw, 24px) clamp(16px, 2.5vw, 22px);
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          box-shadow: 0 4px 18px rgba(51, 76, 61, 0.04);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .offers-card:hover {
          box-shadow: 0 8px 24px rgba(51, 76, 61, 0.08);
          border-color: #dfcebd;
        }
        .offers-pill-row {
          background: #faf9f6;
          border: 1.5px dashed #d5c7b7;
          border-radius: 8px;
          padding: 8px 10px 8px 12px;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .offers-copy-btn {
          border: none;
          cursor: pointer;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          white-space: nowrap;
          min-height: 38px;
        }
        @media (max-width: 640px) {
          .offers-head-wrapper {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .offers-grid {
            grid-template-columns: 1fr;
          }
          .offers-card {
            border-radius: 10px;
          }
          .offers-pill-row {
            padding: 8px 10px;
          }
          .offers-copy-btn {
            flex: 1 1 auto;
            width: 100%;
          }
        }
      `}</style>

      <section
        className="section-sm container offers-section"
        aria-label="Available Offers & Discounts"
      >
        {/* Section Header */}
        <div className="offers-head-wrapper">
          <div>
            <span
              className="eyebrow"
              style={{
                color: '#a9895b',
                letterSpacing: '0.18em',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} style={{ color: '#a9895b', flexShrink: 0 }} />
              EXCLUSIVE PROMOTIONS
            </span>
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(1.55rem, 3.5vw, 2.3rem)',
                color: '#334c3d',
                fontWeight: 600,
                margin: '6px 0 4px',
                lineHeight: 1.15,
              }}
            >
              Available Offers & Coupons
            </h2>
            <p style={{ color: '#666', fontSize: 'clamp(0.85rem, 2vw, 0.92rem)', margin: 0, maxWidth: '580px', lineHeight: 1.45 }}>
              Copy your code and apply it during checkout to enjoy instant savings on your jewellery.
            </p>
          </div>

          <Link
            href="/shop"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334c3d',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderBottom: '1.5px solid #a9895b',
              paddingBottom: '2px',
              flexShrink: 0,
            }}
          >
            Explore Shop <ArrowRight size={13} />
          </Link>
        </div>

        {/* Responsive Coupons Grid */}
        <div className="offers-grid">
          {coupons.map((coupon) => {
            const isCopied = copiedCode === coupon.code;
            const isPercentage = coupon.discountType === 'percentage';
            const discountHeadline = isPercentage
              ? `${coupon.discountValue}% OFF`
              : `₹${coupon.discountValue.toLocaleString('en-IN')} OFF`;

            const minSpendText =
              coupon.minOrderValue && coupon.minOrderValue > 0
                ? `On orders above ₹${coupon.minOrderValue.toLocaleString('en-IN')}`
                : 'No minimum purchase required';

            const maxDiscountText =
              coupon.maxDiscount && coupon.maxDiscount > 0
                ? `Max discount ₹${coupon.maxDiscount.toLocaleString('en-IN')}`
                : null;

            const expiryText = coupon.expiryDate
              ? `Valid till ${new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}`
              : 'Limited period offer';

            return (
              <div key={coupon.code} className="offers-card">
                {/* Decorative top accent line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #334c3d 0%, #a9895b 100%)',
                  }}
                />

                {/* Card Body */}
                <div>
                  {/* Top Badge & Validity */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '10px',
                    }}
                  >
                    <span
                      style={{
                        background: '#faf9f6',
                        border: '1px solid #ede5db',
                        color: '#a9895b',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Tag size={11} />
                      INSTANT SAVINGS
                    </span>

                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: '#777',
                        fontWeight: 500,
                      }}
                    >
                      {expiryText}
                    </span>
                  </div>

                  {/* Big Discount Headline */}
                  <h3
                    className="serif"
                    style={{
                      fontSize: 'clamp(1.6rem, 4.5vw, 1.95rem)',
                      fontWeight: 700,
                      color: '#334c3d',
                      margin: '0 0 6px 0',
                      lineHeight: 1.1,
                    }}
                  >
                    {discountHeadline}
                  </h3>

                  {/* Terms / Minimums */}
                  <p
                    style={{
                      fontSize: 'clamp(0.82rem, 2vw, 0.88rem)',
                      color: '#555',
                      margin: '0 0 4px 0',
                      lineHeight: 1.4,
                    }}
                  >
                    {minSpendText}
                    {maxDiscountText ? ` (${maxDiscountText})` : ''}
                  </p>

                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: '#888',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ShieldCheck size={13} style={{ color: '#2e7d32', flexShrink: 0 }} />
                    Valid across all jewellery collections
                  </p>
                </div>

                {/* Coupon Code Pill and Copy Button */}
                <div className="offers-pill-row">
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.64rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#888',
                        fontWeight: 600,
                      }}
                    >
                      COUPON CODE
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace, var(--sans)',
                        fontSize: 'clamp(1.05rem, 3.5vw, 1.15rem)',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        color: '#334c3d',
                        userSelect: 'all',
                      }}
                    >
                      {coupon.code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className="offers-copy-btn"
                    style={{
                      background: isCopied ? '#2e7d32' : '#334c3d',
                      boxShadow: isCopied
                        ? '0 2px 8px rgba(46, 125, 50, 0.3)'
                        : '0 2px 8px rgba(51, 76, 61, 0.2)',
                    }}
                    title="Click to copy coupon code"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        Copied! ✨
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
