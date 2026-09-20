'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Lock, Globe, MapPin } from 'lucide-react';
import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useStore } from './StoreProvider';
import { api } from '@/lib/api';
import { INTERNATIONAL_COUNTRIES, isIndia, CountryOption } from '@/lib/countries';

export function CheckoutPage() {
  const { cart, subtotal, clearCart, user, isAuthenticated } = useStore();

  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [step, setStep] = useState(1);

  // Delivery Location Mode: 'IN' or 'INTL'
  const [deliveryType, setDeliveryType] = useState<'IN' | 'INTL'>('IN');

  // Shipping Address Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState(''); // India 6-digit pincode

  // International Specific State
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('US');
  const [postalCode, setPostalCode] = useState(''); // International postal/zip code

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Shipping & Totals
  const [shippingCharge, setShippingCharge] = useState(0);
  const [isLocationAvailable, setIsLocationAvailable] = useState<boolean | null>(null);
  const [shippingError, setShippingError] = useState('');
  const [shippingMeta, setShippingMeta] = useState<{
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    estimate?: string;
    source?: string;
    baseCharge?: number;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'card'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Prepopulate form if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setName(user.name);
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);

      const loadDefaultAddress = async () => {
        try {
          const res = await api.auth.getAddresses();
          const defaultAddr = res.addresses.find((addr: any) => addr.isDefault);
          if (defaultAddr) {
            setName(defaultAddr.name);
            setPhone(defaultAddr.phone);
            setEmail(defaultAddr.email);
            setAddressLine(defaultAddr.addressLine);
            setCity(defaultAddr.city);
            setState(defaultAddr.state);

            const isInd = isIndia(defaultAddr.country);
            if (isInd) {
              setDeliveryType('IN');
              setPincode(defaultAddr.pincode || '');
            } else {
              setDeliveryType('INTL');
              setPostalCode(defaultAddr.pincode || '');
              const matchingC = INTERNATIONAL_COUNTRIES.find(
                (c) => c.name.toLowerCase() === (defaultAddr.country || '').toLowerCase()
              );
              if (matchingC) setSelectedCountryCode(matchingC.code);
            }
          }
        } catch (err) {
          console.error('Failed to load saved address:', err);
        }
      };
      loadDefaultAddress();
    }
  }, [isAuthenticated, user]);

  // Client-side discount calculation for summary preview
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      const amt = (subtotal * appliedCoupon.value) / 100;
      return Math.round(amt * 100) / 100;
    }
    return appliedCoupon.value;
  }, [appliedCoupon, subtotal]);

  const discountedSubtotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const selectedCountryObj = useMemo(() => {
    if (deliveryType === 'IN') return { code: 'IN', name: 'India', flag: '🇮🇳' };
    return INTERNATIONAL_COUNTRIES.find((c) => c.code === selectedCountryCode) || INTERNATIONAL_COUNTRIES[0];
  }, [deliveryType, selectedCountryCode]);

  // Query shipping calculation dynamically whenever location inputs change
  useEffect(() => {
    if (deliveryType === 'IN') {
      const cleanPincode = pincode.trim();
      if (cleanPincode.length === 6 && !isNaN(Number(cleanPincode))) {
        const getShipping = async () => {
          try {
            const res = await api.orders.calculateShipping({
              country: 'IN',
              pincode: cleanPincode,
            });

            if (!res.available || res.error) {
              setIsLocationAvailable(false);
              setShippingError(res.error || `Delivery unavailable for pincode ${cleanPincode}.`);
              setShippingCharge(0);
              setShippingMeta(null);
            } else {
              setIsLocationAvailable(true);
              setShippingError('');

              if (res.destination?.city && !city) setCity(res.destination.city);
              if (res.destination?.state && !state) setState(res.destination.state);

              setShippingMeta({
                city: res.destination?.city || res.destination?.district || '',
                district: res.destination?.district || '',
                state: res.destination?.state || '',
                country: 'India',
                estimate: res.estimate || '3–5 working days',
                source: res.source,
                baseCharge: res.shippingCharge,
              });

              // Apply ₹2000 Free Shipping Rule for India
              if (discountedSubtotal >= 2000) {
                setShippingCharge(0);
              } else {
                setShippingCharge(res.shippingCharge);
              }
            }
          } catch (err: any) {
            console.warn('Failed to fetch India shipping rate:', err);
            setIsLocationAvailable(false);
            setShippingError('Failed to check shipping rate for this pincode.');
            setShippingCharge(0);
            setShippingMeta(null);
          }
        };
        getShipping();
      } else {
        setIsLocationAvailable(null);
        setShippingError('');
        setShippingCharge(0);
        setShippingMeta(null);
      }
    } else {
      // International Mode
      const cleanZip = postalCode.trim();
      if (selectedCountryObj && cleanZip.length >= 2) {
        const getInternationalShipping = async () => {
          try {
            const res = await api.orders.calculateShipping({
              country: selectedCountryObj.code,
              postalCode: cleanZip,
              city,
              state,
            });

            if (!res.available || res.error) {
              setIsLocationAvailable(false);
              setShippingError(res.error || `International delivery is unavailable to ${selectedCountryObj.name}.`);
              setShippingCharge(0);
              setShippingMeta(null);
            } else {
              setIsLocationAvailable(true);
              setShippingError('');
              setShippingMeta({
                country: res.destination?.country || selectedCountryObj.name,
                estimate: res.estimate || '7–10 working days',
                source: res.source,
                baseCharge: res.shippingCharge,
              });

              // International orders retain authoritative shipping charge (no automatic ₹2000 free shipping rule)
              setShippingCharge(res.shippingCharge);
            }
          } catch (err: any) {
            console.warn('Failed to fetch international shipping rate:', err);
            setIsLocationAvailable(false);
            setShippingError('Failed to calculate international shipping rate.');
            setShippingCharge(0);
            setShippingMeta(null);
          }
        };
        getInternationalShipping();
      } else {
        setIsLocationAvailable(null);
        setShippingError('');
        setShippingCharge(0);
        setShippingMeta(null);
      }
    }
  }, [deliveryType, pincode, postalCode, selectedCountryCode, city, state, discountedSubtotal, selectedCountryObj]);

  // Load Razorpay SDK Script helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const totalAmount = Math.max(0, discountedSubtotal + shippingCharge);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode) return;

    try {
      const code = couponCode.toUpperCase();
      if (code === 'WELCOME10') {
        if (subtotal < 500) {
          setCouponError('WELCOME10 requires a minimum order of ₹500.');
          return;
        }
        setAppliedCoupon({ code, type: 'percentage', value: 10 });
        setCouponSuccess('Coupon WELCOME10 applied successfully!');
      } else if (code === 'RIZ100') {
        if (subtotal < 999) {
          setCouponError('RIZ100 requires a minimum order of ₹999.');
          return;
        }
        setAppliedCoupon({ code, type: 'fixed', value: 100 });
        setCouponSuccess('Coupon RIZ100 applied successfully!');
      } else {
        setCouponError('Invalid coupon code.');
      }
    } catch (err) {
      setCouponError('Failed to apply coupon.');
    }
  };

  const validateStep1 = () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !addressLine.trim() || !city.trim() || !state.trim()) {
      setCheckoutError('Please fill in all required shipping address fields.');
      return false;
    }

    if (deliveryType === 'IN') {
      if (pincode.trim().length !== 6 || isNaN(Number(pincode.trim()))) {
        setCheckoutError('Please enter a valid 6-digit Indian pincode.');
        return false;
      }
    } else {
      if (!postalCode.trim()) {
        setCheckoutError('Please enter a valid Postal / ZIP code.');
        return false;
      }
    }

    if (isLocationAvailable === false) {
      setCheckoutError(shippingError || 'Delivery is unavailable for the selected destination.');
      return false;
    }

    setCheckoutError('');
    return true;
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep > step) {
      if (!validateStep1()) return;
    }
    setCheckoutError('');
    setStep(targetStep);
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!validateStep1()) return;

    setIsSubmitting(true);

    const shippingAddress = {
      name,
      phone,
      email,
      addressLine,
      city,
      state,
      pincode: deliveryType === 'IN' ? pincode.trim() : postalCode.trim(),
      postalCode: deliveryType === 'IN' ? pincode.trim() : postalCode.trim(),
      country: deliveryType === 'IN' ? 'India' : selectedCountryObj.name,
    };

    const cartItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      color: item.color || null,
    }));

    try {
      // 1. Initialize Order Creation on Backend (Authoritative Rate Calculation)
      const res = await api.payments.checkout({
        items: cartItems,
        shippingAddress,
        couponCode: appliedCoupon?.code,
        paymentMethod,
      });

      const dbOrder = res.order;

      // 2. Handle Mock Payment Checkout
      if (res.paymentMode === 'mock') {
        await api.payments.verify({
          orderId: dbOrder.orderId,
        });
        clearCart();
        setPlacedOrderId(dbOrder.orderId);
        setPlaced(true);
        setIsSubmitting(false);
        return;
      }

      // 4. Handle Razorpay Checkout
      if (res.paymentMode === 'razorpay') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error('Failed to load payment gateway SDK. Please check your internet connection.');
        }

        const options = {
          key: res.razorpayKeyId,
          amount: Math.round(dbOrder.total * 100),
          currency: 'INR',
          name: 'RIZ by Shijiriju',
          description: 'E-commerce Purchase',
          order_id: res.razorpayOrderId,
          handler: async function (response: any) {
            try {
              setIsSubmitting(true);
              const verification = await api.payments.verify({
                orderId: dbOrder.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });

              clearCart();
              setPlacedOrderId(verification.orderId);
              setPlaced(true);
            } catch (err: any) {
              alert(err.message || 'Payment verification failed.');
            } finally {
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: shippingAddress.name,
            email: shippingAddress.email,
            contact: shippingAddress.phone,
          },
          theme: {
            color: '#121212',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'An error occurred during checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (placed) {
    return (
      <main>
        <section className="success-page container">
          <div className="success-icon">
            <Check size={28} />
          </div>
          <span className="eyebrow">Thank you</span>
          <h1 className="serif font-semibold">
            Order placed<br />
            <i>successfully.</i>
          </h1>
          <p>
            Your order <b>{placedOrderId}</b> has been received and is being prepared with care.
          </p>
          <Link href={`/track-order?order=${placedOrderId}`} className="button">
            Track your order
          </Link>
        </section>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main>
        <div className="empty-state checkout-empty">
          <span className="eyebrow">Your bag is empty</span>
          <h2 className="serif">Add something beautiful first.</h2>
          <Link href="/shop" className="button">
            Shop jewellery
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="checkout-head container">
        <Link href="/cart" className="logo brand-mark">
          <Image src="/logo.png" alt="Riz by Shijiriju" width={76} height={58} />
        </Link>
        <span>
          <Lock size={13} /> Secure checkout
        </span>
      </div>
      <section className="checkout-layout container">
        <div>
          <div className="steps">
            {['Address', 'Delivery', 'Payment', 'Review'].map((label, i) => (
              <button
                key={label}
                className={step === i + 1 ? 'active' : ''}
                onClick={() => handleStepClick(i + 1)}
                type="button"
              >
                <b>{i + 1}</b>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handlePlaceOrder} className="checkout-form">
            {checkoutError && <div className="error-banner mb-6">{checkoutError}</div>}

            <div className="checkout-section">
              <h2 className="serif">
                {step === 1
                  ? 'Where should we send it?'
                  : step === 2
                  ? 'Choose delivery'
                  : step === 3
                  ? 'How would you like to pay?'
                  : 'Review your order'}
              </h2>

              {step === 1 && (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {/* Delivery Location Toggle */}
                  <div style={{ background: '#faf9f6', padding: '6px', borderRadius: '8px', border: '1px solid #ede5db', display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType('IN');
                        setShippingError('');
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: deliveryType === 'IN' ? '#334c3d' : 'transparent',
                        color: deliveryType === 'IN' ? '#ffffff' : '#555555',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <MapPin size={16} /> India Delivery (Pincode)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType('INTL');
                        setShippingError('');
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: deliveryType === 'INTL' ? '#334c3d' : 'transparent',
                        color: deliveryType === 'INTL' ? '#ffffff' : '#555555',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Globe size={16} /> International Shipping
                    </button>
                  </div>

                  <div className="form-grid">
                    <label>
                      Full name
                      <input
                        required
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        required
                        type="tel"
                        placeholder="Mobile number with country code"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </label>
                    <label className="wide">
                      Email address
                      <input
                        required
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>
                    <label className="wide">
                      Street address
                      <input
                        required
                        placeholder="House no., building, street address"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                      />
                    </label>

                    {/* Country Selector for International Mode */}
                    {deliveryType === 'INTL' ? (
                      <label className="wide">
                        Country / Region
                        <select
                          value={selectedCountryCode}
                          onChange={(e) => setSelectedCountryCode(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem',
                            background: '#fff',
                          }}
                        >
                          {INTERNATIONAL_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name} ({c.region})
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label className="wide">
                        Country
                        <input value="India 🇮🇳" disabled style={{ background: '#f5f5f5', color: '#666' }} />
                      </label>
                    )}

                    <label>
                      City / Town
                      <input
                        required
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </label>
                    <label>
                      State / Province / Region
                      <input
                        required
                        placeholder="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </label>

                    {deliveryType === 'IN' ? (
                      <label>
                        Pincode
                        <input
                          required
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="6-digit pincode"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                        />
                        {shippingError && (
                          <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                            {shippingError}
                          </span>
                        )}
                      </label>
                    ) : (
                      <label>
                        Postal / ZIP Code
                        <input
                          required
                          placeholder="ZIP or Postal code"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                        />
                        {shippingError && (
                          <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                            {shippingError}
                          </span>
                        )}
                      </label>
                    )}

                    {shippingMeta && isLocationAvailable && (
                      <div style={{ gridColumn: 'span 2', background: '#faf9f6', border: '1px solid #ede5db', borderRadius: '6px', padding: '12px 16px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', fontWeight: 600, display: 'block' }}>
                          Delivery to {deliveryType === 'IN' ? 'India' : selectedCountryObj.name}
                        </span>
                        <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: '#334c3d', fontSize: '0.9rem' }}>
                          {[shippingMeta.city, shippingMeta.district, shippingMeta.state].filter(Boolean).join(', ') || selectedCountryObj.name}
                        </p>
                        <p style={{ margin: '1px 0 0 0', color: '#555', fontSize: '0.85rem' }}>
                          Estimated Delivery: <strong>{shippingMeta.estimate}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="choice-list" style={{ display: 'grid', gap: '12px' }}>
                  {isLocationAvailable === false ? (
                    <div className="error-banner" style={{ background: '#fdf2f2', color: '#d32f2f', padding: '14px', borderRadius: '6px', border: '1px solid #f8d7da', fontSize: '0.88rem' }}>
                      {shippingError || `Delivery is unavailable for the selected location.`}
                    </div>
                  ) : (
                    <div style={{
                      padding: '18px 20px',
                      border: '1.5px solid #334c3d',
                      borderRadius: '8px',
                      background: '#faf9f6',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}>
                      <div>
                        <b style={{ fontSize: '0.95rem', color: '#2a3a2e', display: 'block' }}>
                          {deliveryType === 'IN' ? 'Standard Courier Delivery (India)' : `International Express Air Delivery (${selectedCountryObj.flag} ${selectedCountryObj.name})`}
                        </b>
                        {shippingMeta && (
                          <div style={{ marginTop: '6px', fontSize: '0.83rem', color: '#444' }}>
                            <span style={{ color: '#666' }}>Destination: </span>
                            <strong style={{ color: '#334c3d' }}>
                              {[shippingMeta.city, shippingMeta.district, shippingMeta.state, shippingMeta.country].filter(Boolean).join(', ')}
                            </strong>
                          </div>
                        )}
                        <small style={{ display: 'block', color: '#555', marginTop: '6px', fontSize: '0.82rem' }}>
                          {shippingMeta?.estimate || (deliveryType === 'IN' ? '3–5 working days' : '7–12 working days')}
                        </small>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {deliveryType === 'IN' && discountedSubtotal >= 2000 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{
                              background: '#334c3d',
                              color: '#fff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '4px',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase'
                            }}>
                              FREE DELIVERY
                            </span>
                            <small style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.8rem' }}>
                              ₹{shippingMeta?.baseCharge || 79}
                            </small>
                          </div>
                        ) : (
                          <strong style={{ fontSize: '1.05rem', color: '#111', whiteSpace: 'nowrap' }}>
                            Delivery: ₹{shippingCharge.toLocaleString('en-IN')}
                          </strong>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="choice-list">
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                    />
                    <span>
                      <b>UPI App / Instant Pay</b>
                      <small>Pay securely via GPay, PhonePe, Paytm</small>
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <span>
                      <b>Credit / Debit Card</b>
                      <small>Visa, Mastercard, RuPay, American Express</small>
                    </span>
                  </label>
                </div>
              )}

              {step === 4 && (
                <div className="review-section">
                  <p className="mb-4">
                    Please review your shipping and payment details before completing your purchase:
                  </p>
                  <div className="review-grid border p-4 rounded mb-6" style={{ display: 'grid', gap: '15px' }}>
                    <div>
                      <span className="eyebrow">Shipping Destination</span>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm muted">
                        {addressLine}, {city}, {state} - {deliveryType === 'IN' ? pincode : postalCode}
                      </p>
                      <p className="text-sm muted">
                        Country: <strong>{deliveryType === 'IN' ? 'India 🇮🇳' : `${selectedCountryObj.flag} ${selectedCountryObj.name}`}</strong>
                      </p>
                      <p className="text-sm muted">Phone: {phone}</p>
                    </div>
                    <div>
                      <span className="eyebrow">Payment Method</span>
                      <p className="font-medium">
                        {paymentMethod === 'card' ? 'Credit/Debit Card' : 'UPI / Instant Online Gateway'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-actions">
                {step > 1 && (
                  <button type="button" className="button secondary" onClick={() => handleStepClick(step - 1)}>
                    Back
                  </button>
                )}
                {step < 4 ? (
                  <button type="button" className="button" onClick={() => handleStepClick(step + 1)}>
                    Continue
                  </button>
                ) : (
                  <button className="button" type="submit" disabled={isSubmitting || isLocationAvailable === false}>
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <aside className="summary checkout-summary">
          <h2 className="serif">Your order</h2>
          {cart.map(({ product, quantity, color }) => (
            <div className="mini-item" key={`${product.id}-${color || 'default'}`}>
              <span>
                {product.name}
                {color && (
                  <small style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>
                    Colour: {color}
                  </small>
                )}
                <small>× {quantity}</small>
              </span>
              <b>₹{((product.price || 0) * quantity).toLocaleString('en-IN')}</b>
            </div>
          ))}

          {/* Coupon Entry */}
          <div className="coupon-entry-wrapper border-t pt-4 mt-4">
            <span className="eyebrow">Apply Coupon</span>
            <form onSubmit={applyCoupon} className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="PROMO CODE"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                style={{ textTransform: 'uppercase' }}
              />
              <button type="submit" className="button secondary" style={{ padding: '0 15px' }}>
                Apply
              </button>
            </form>
            {couponError && <p className="text-xs text-red-500 mt-1" style={{ color: '#d32f2f' }}>{couponError}</p>}
            {couponSuccess && <p className="text-xs text-green-600 mt-1" style={{ color: '#2e7d32' }}>{couponSuccess}</p>}
          </div>

          <div className="price-lines border-t pt-4 mt-4" style={{ display: 'grid', gap: '8px' }}>
            <div className="flex justify-between text-sm">
              <span>Bag Subtotal</span>
              <span>₹{(subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600" style={{ color: '#2e7d32' }}>
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>- ₹{(discountAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Shipping Fee ({deliveryType === 'IN' ? 'India' : selectedCountryObj.name})</span>
              <span>
                {isLocationAvailable === false ? (
                  <span style={{ color: '#d32f2f' }}>Unavailable</span>
                ) : deliveryType === 'IN' && shippingCharge === 0 ? (
                  'Free'
                ) : (
                  `₹${(shippingCharge || 0).toLocaleString('en-IN')}`
                )}
              </span>
            </div>
          </div>

          <div className="summary-total border-t pt-4 mt-4">
            <span>Total</span>
            <strong>₹{(totalAmount || 0).toLocaleString('en-IN')}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}
