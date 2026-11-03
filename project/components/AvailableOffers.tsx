import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Clipboard, Check } from 'lucide-react';

interface Coupon {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiryDate?: string;
}

export function AvailableOffers() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    api.coupons
      .public()
      .then((res: any) => {
        if (isMounted) {
          setCoupons(res?.coupons ?? []);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError('Failed to load offers.');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(''), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading offers...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (coupons.length === 0) {
    return null; // render nothing if no active coupons
  }

  return (
    <section className="section container" aria-label="Available Offers">
      <div className="section-head mb-4">
        <h2 className="serif">Available Offers</h2>
        <p className="text-sm text-gray-600">Grab these limited‑time discount codes before they expire.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c) => (
          <div key={c.code} className="border rounded p-4 flex flex-col justify-between">
            <div>
              <div className="font-mono text-lg font-bold mb-2">{c.code}</div>
              <div className="text-sm mb-1">
                {c.discountType === 'percentage'
                  ? `${c.discountValue}% off`
                  : `$${c.discountValue} off`}
              </div>
              {c.minOrderValue && (
                <div className="text-xs text-gray-500">Min order: ${c.minOrderValue}</div>
              )}
              {c.maxDiscount && (
                <div className="text-xs text-gray-500">Max discount: ${c.maxDiscount}</div>
              )}
              {c.expiryDate && (
                <div className="text-xs text-gray-500">Expires: {new Date(c.expiryDate).toLocaleDateString()}</div>
              )}
            </div>
            <button
              onClick={() => handleCopy(c.code)}
              className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              {copied === c.code ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Clipboard size={16} />
              )}
              {copied === c.code ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
