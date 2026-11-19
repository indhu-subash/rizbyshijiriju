'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Lock, Globe, MapPin, HelpCircle, Search } from 'lucide-react';
import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useStore } from './StoreProvider';
import { api } from '@/lib/api';
import { INTERNATIONAL_COUNTRIES, isIndia } from '@/lib/countries';

const INDIAN_STATES = [
  'Kerala',
  'Tamil Nadu',
  'Karnataka',
  'Maharashtra',
  'Delhi',
  'Andhra Pradesh',
  'Telangana',
  'Gujarat',
  'Goa',
  'Rajasthan',
  'Uttar Pradesh',
  'West Bengal',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Bihar',
  'Odisha',
  'Assam',
  'Chandigarh',
  'Puducherry',
  'Jammu & Kashmir',
  'Himachal Pradesh',
  'Uttarakhand',
  'Jharkhand',
  'Chhattisgarh',
];

export function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, clearCart, user, isAuthenticated } = useStore();

  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  // Delivery Location Mode: 'IN' or 'INTL'
  const [deliveryType, setDeliveryType] = useState<'IN' | 'INTL'>('IN');

  // Customer Contact & Shipping Address State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Kerala');
  const [pincode, setPincode] = useState(''); // India 6-digit pincode

  // International Specific State
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('US');
  const [postalCode, setPostalCode] = useState(''); // International postal/zip code

  // Save address information for next time (enabled by default)
  const [saveInfo, setSaveInfo] = useState(true);

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

  // 1. Auto-load saved address details from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('riz_saved_checkout_data');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.email) setEmail(d.email);
        if (d.phone) setPhone(d.phone);
        if (d.firstName) setFirstName(d.firstName);
        if (d.lastName) setLastName(d.lastName);
        if (d.addressLine) setAddressLine(d.addressLine);
        if (d.city) setCity(d.city);
        if (d.state) setState(d.state);
        if (d.pincode) setPincode(d.pincode);
        if (d.postalCode) setPostalCode(d.postalCode);
        if (d.deliveryType) setDeliveryType(d.deliveryType);
        if (d.selectedCountryCode) setSelectedCountryCode(d.selectedCountryCode);
      }
    } catch (e) {
      console.warn('Could not read saved checkout details from local storage:', e);
    }
  }, []);

  // 2. Prepopulate form if logged in with user profile and saved account addresses
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
      if (user.name) {
        const parts = user.name.trim().split(' ');
        if (!firstName) setFirstName(parts[0] || '');
        if (!lastName) setLastName(parts.slice(1).join(' ') || '');
      }

      const loadDefaultAddress = async () => {
        try {
          const res = await api.auth.getAddresses();
          const defaultAddr = res.addresses?.find((addr: any) => addr.isDefault) || res.addresses?.[0];
          if (defaultAddr) {
            const parts = (defaultAddr.name || '').trim().split(' ');
            if (parts[0]) setFirstName(parts[0]);
            if (parts.length > 1) setLastName(parts.slice(1).join(' '));
            if (defaultAddr.phone) setPhone(defaultAddr.phone);
            if (defaultAddr.email) setEmail(defaultAddr.email);
            if (defaultAddr.addressLine) setAddressLine(defaultAddr.addressLine);
            if (defaultAddr.city) setCity(defaultAddr.city);
            if (defaultAddr.state) setState(defaultAddr.state);

            const isInd = isIndia(defaultAddr.country);
            if (isInd) {
              setDeliveryType('IN');
              if (defaultAddr.pincode) setPincode(defaultAddr.pincode);
            } else {
              setDeliveryType('INTL');
              if (defaultAddr.pincode) setPostalCode(defaultAddr.pincode);
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
              state: state || 'Kerala',
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

              // Inside Kerala rate: ₹60 (Kerala pin prefixes: 67, 68, 69 or selected/fetched state)
              const isKerala =
                res.destination?.state?.toLowerCase().includes('kerala') ||
                state?.toLowerCase().includes('kerala') ||
                ['67', '68', '69'].includes(cleanPincode.substring(0, 2));

              const resolvedCharge = isKerala ? 60 : res.shippingCharge;
              const resolvedEstimate = isKerala ? '2–4 working days' : (res.estimate || '3–5 working days');

              setShippingMeta({
                city: res.destination?.city || res.destination?.district || '',
                district: res.destination?.district || '',
                state: isKerala ? 'Kerala' : (res.destination?.state || ''),
                country: 'India',
                estimate: resolvedEstimate,
                source: res.source,
                baseCharge: resolvedCharge,
              });

              // Apply ₹599 Free Shipping Rule for India
              if (discountedSubtotal >= 599) {
                setShippingCharge(0);
              } else {
                setShippingCharge(resolvedCharge);
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
      const res = await api.payments.validateCoupon({ couponCode, subtotal });
      if (res.valid) {
        setAppliedCoupon({
          code: res.coupon.code,
          type: res.coupon.type,
          value: res.coupon.value,
        });
        setCouponSuccess('Coupon applied successfully!');
      } else {
        setCouponError('Invalid coupon code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon.');
    }
  };

  // Helper to persist address into localStorage and backend profile so customer never enters again
  const persistAddressData = (shippingAddress: any) => {
    if (saveInfo) {
      try {
        localStorage.setItem(
          'riz_saved_checkout_data',
          JSON.stringify({
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            firstName,
            lastName,
            addressLine: shippingAddress.addressLine,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: deliveryType === 'IN' ? shippingAddress.pincode : '',
            postalCode: deliveryType === 'INTL' ? shippingAddress.postalCode : '',
            deliveryType,
            selectedCountryCode,
          })
        );
      } catch (e) {
        console.warn('Failed to save checkout address to localStorage:', e);
      }

      if (isAuthenticated) {
        api.auth
          .addAddress({
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            email: shippingAddress.email,
            addressLine: shippingAddress.addressLine,
            city: shippingAddress.city,
            state: shippingAddress.state,
            pincode: shippingAddress.pincode || shippingAddress.postalCode,
            country: shippingAddress.country,
            isDefault: true,
          })
          .catch(() => {});
      }
    }
  };

  const validateForm = () => {
    const computedName = `${firstName} ${lastName}`.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanAddress = addressLine.trim();
    const cleanCity = city.trim();
    const cleanState = state.trim();

    if (!cleanEmail) {
      setCheckoutError('Please enter a valid email address or phone number for order updates.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setCheckoutError('Please enter a valid email address (e.g., name@example.com).');
      return false;
    }

    if (!lastName.trim() && !firstName.trim()) {
      setCheckoutError('Please enter your name.');
      return false;
    }

    if (!cleanAddress) {
      setCheckoutError('Please enter your delivery street address.');
      return false;
    }

    if (!cleanCity) {
      setCheckoutError('Please enter your City.');
      return false;
    }

    if (!cleanState) {
      setCheckoutError('Please select or enter your State.');
      return false;
    }

    if (deliveryType === 'IN') {
      if (pincode.trim().length !== 6 || isNaN(Number(pincode.trim()))) {
        setCheckoutError('Please enter a valid 6-digit Indian PIN code.');
        return false;
      }
    } else {
      if (!postalCode.trim()) {
        setCheckoutError('Please enter a valid Postal / ZIP code.');
        return false;
      }
    }

    if (!cleanPhone) {
      setCheckoutError('Please enter your mobile phone number for courier delivery updates.');
      return false;
    }

    const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      setCheckoutError('Please enter a valid 10-digit mobile phone number.');
      return false;
    }

    if (isLocationAvailable === false) {
      setCheckoutError(shippingError || 'Delivery is unavailable for the selected destination.');
      return false;
    }

    setCheckoutError('');
    return true;
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    const computedName = `${firstName} ${lastName}`.trim() || 'Customer';

    const shippingAddress = {
      name: computedName,
      phone: phone.trim(),
      email: email.trim(),
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: deliveryType === 'IN' ? pincode.trim() : postalCode.trim(),
      postalCode: deliveryType === 'IN' ? pincode.trim() : postalCode.trim(),
      country: deliveryType === 'IN' ? 'India' : selectedCountryObj.name,
    };

    // Auto-save address details so customer never needs to enter again!
    persistAddressData(shippingAddress);

    const cartItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      color: item.color || null,
      size: item.size || null,
    }));

    try {
      // 1. Initialize Order Creation on Backend
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
        router.push(`/thankyou?orderId=${encodeURIComponent(dbOrder.orderId)}`);
        return;
      }

      // 3. Handle Razorpay Checkout
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
              const confirmedId = verification.orderId || dbOrder.orderId;
              setPlacedOrderId(confirmedId);
              setPlaced(true);
              router.push(`/thankyou?orderId=${encodeURIComponent(confirmedId)}`);
            } catch (err: any) {
              alert(err.message || 'Payment verification failed.');
              await api.payments.cancel({ orderId: dbOrder.orderId });
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: async function () {
              try {
                await api.payments.cancel({ orderId: dbOrder.orderId });
              } catch (e) {
                console.error('Failed to mark unpaid order as cancelled:', e);
              }
              setCheckoutError('Payment was not completed or was cancelled. Your order has been marked as cancelled.');
              setIsSubmitting(false);
            },
          },
          prefill: {
            name: shippingAddress.name,
            email: shippingAddress.email,
            contact: shippingAddress.phone,
          },
          theme: {
            color: '#334c3d',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', async function (resp: any) {
          try {
            await api.payments.cancel({ orderId: dbOrder.orderId });
          } catch (e) {}
          setCheckoutError(resp.error?.description || 'Payment failed. Please try again.');
          setIsSubmitting(false);
        });
        rzp.open();
        return;
      }

      // 4. Handle Cash on Delivery (COD) Checkout
      if (res.paymentMode === 'cod') {
        clearCart();
        setPlacedOrderId(dbOrder.orderId);
        setPlaced(true);
        setIsSubmitting(false);
        router.push(`/thankyou?orderId=${encodeURIComponent(dbOrder.orderId)}`);
        return;
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'An error occurred during checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (placed) {
    const waText = encodeURIComponent(
      `Hi RIZ by Shijiriju, I have placed Order #${placedOrderId}. Please process my order!`
    );

    return (
      <main>
        <section className="success-page container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="success-icon" style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: '#334c3d', color: '#fff', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
            <Check size={32} />
          </div>
          <span className="eyebrow" style={{ color: '#a9895b', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.82rem', fontWeight: 600 }}>Order Confirmed</span>
          <h1 className="serif font-semibold" style={{ fontSize: '2.4rem', margin: '12px 0' }}>
            Thank you for your purchase.<br />
            <i style={{ fontWeight: 400, color: '#334c3d' }}>Your order is confirmed.</i>
          </h1>
          <p style={{ color: '#555', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 24px' }}>
            Your order <strong>#{placedOrderId}</strong> has been received and verified. Confirmation details have been sent to your email (<strong>{email}</strong>).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', maxWidth: '420px', margin: '0 auto 30px' }}>
            <a
              href={`https://wa.me/919072308686?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                padding: '14px 20px',
                background: '#25D366',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
              }}
            >
              📲 Connect & Track on WhatsApp (+91 9072308686)
            </a>

            <Link href={`/track-order?order=${placedOrderId}`} className="button" style={{ width: '100%', textAlign: 'center' }}>
              Track order status
            </Link>
          </div>
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
        {/* Left Column: Clean 1-Page Express Form (Shopify Style) */}
        <div>
          <form onSubmit={handlePlaceOrder} className="shopify-checkout-card">
            {checkoutError && (
              <div className="error-banner" style={{ background: '#fdf2f2', color: '#d32f2f', padding: '12px 16px', borderRadius: '6px', fontSize: '0.88rem', border: '1px solid #f8d7da' }}>
                {checkoutError}
              </div>
            )}

            {/* 1. Contact Section */}
            <div className="shopify-section">
              <div className="shopify-section-head">
                <h2>Contact</h2>
                {!isAuthenticated && (
                  <Link href="/login?redirect=/checkout" className="shopify-signin-link">
                    Sign in
                  </Link>
                )}
              </div>
              <div className="shopify-field-wrap">
                <input
                  type="email"
                  className="shopify-input"
                  placeholder="Email or mobile phone number"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="shopify-field-icon" title="Used for order confirmation receipts">
                  <HelpCircle size={16} />
                </div>
              </div>
            </div>

            {/* 2. Delivery Section */}
            <div className="shopify-section">
              <h2>Delivery</h2>

              {/* Country / Region */}
              <div className="shopify-field-wrap">
                <select
                  className="shopify-select"
                  value={deliveryType === 'IN' ? 'IN' : selectedCountryCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'IN') {
                      setDeliveryType('IN');
                    } else {
                      setDeliveryType('INTL');
                      setSelectedCountryCode(val);
                    }
                    setShippingError('');
                  }}
                >
                  <option value="IN">India 🇮🇳</option>
                  <optgroup label="International Countries">
                    {INTERNATIONAL_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} {c.flag}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* First Name & Last Name */}
              <div className="shopify-grid-2">
                <input
                  type="text"
                  className="shopify-input"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  type="text"
                  className="shopify-input"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              {/* Street Address */}
              <div className="shopify-field-wrap">
                <input
                  type="text"
                  className="shopify-input"
                  placeholder="Address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  required
                />
                <div className="shopify-field-icon">
                  <Search size={16} />
                </div>
              </div>

              {/* City, State, PIN code (3 columns) */}
              <div className="shopify-grid-3">
                <input
                  type="text"
                  className="shopify-input"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />

                {deliveryType === 'IN' ? (
                  <select
                    className="shopify-select"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="shopify-input"
                    placeholder="State / Region"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                )}

                {deliveryType === 'IN' ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="shopify-input"
                    placeholder="PIN code"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                ) : (
                  <input
                    type="text"
                    className="shopify-input"
                    placeholder="ZIP / Postal code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Phone number */}
              <div className="shopify-field-wrap">
                <input
                  type="tel"
                  className="shopify-input"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <div className="shopify-field-icon" title="In case we need to contact you regarding delivery">
                  <HelpCircle size={16} />
                </div>
              </div>

              {/* Save Information Checkbox */}
              <label className="shopify-checkbox-row">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                />
                <span>Save this information for next time</span>
              </label>
            </div>

            {/* 3. Shipping method Section */}
            <div className="shopify-section">
              <h2>Shipping method</h2>
              {isLocationAvailable ? (
                <div className="shopify-shipping-box">
                  <div>
                    <b style={{ fontSize: '0.92rem', color: '#1a1a1a', display: 'block' }}>
                      {deliveryType === 'IN'
                        ? (shippingMeta?.state?.toLowerCase().includes('kerala') || state?.toLowerCase().includes('kerala')
                            ? 'Kerala Standard Delivery'
                            : 'Standard Courier Delivery (India)')
                        : `International Air Delivery (${selectedCountryObj.name})`}
                    </b>
                    <small style={{ color: '#666', fontSize: '0.82rem' }}>
                      {shippingMeta?.estimate || (deliveryType === 'IN' ? '2–4 working days' : '7–12 working days')}
                    </small>
                  </div>
                  <div>
                    {deliveryType === 'IN' && discountedSubtotal >= 599 ? (
                      <span style={{ background: '#334c3d', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        FREE
                      </span>
                    ) : (
                      <strong style={{ fontSize: '0.95rem', color: '#111' }}>
                        ₹{shippingCharge.toLocaleString('en-IN')}
                      </strong>
                    )}
                  </div>
                </div>
              ) : (
                <div className="shopify-shipping-empty">
                  Enter your shipping address to view available shipping methods.
                </div>
              )}
            </div>

            {/* 4. Payment Section */}
            <div className="shopify-section">
              <div className="shopify-section-head">
                <h2>Payment</h2>
              </div>
              <p className="shopify-section-sub">All transactions are secure and encrypted.</p>

              <div className="shopify-payment-list">
                <label className={`shopify-payment-item ${paymentMethod === 'UPI' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                  />
                  <div>
                    <b style={{ fontSize: '0.92rem', color: '#1a1a1a', display: 'block' }}>UPI App / Instant Pay</b>
                    <small style={{ color: '#666', fontSize: '0.82rem' }}>Pay instantly via Google Pay, PhonePe, Paytm, or QR</small>
                  </div>
                </label>

                <label className={`shopify-payment-item ${paymentMethod === 'card' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <div>
                    <b style={{ fontSize: '0.92rem', color: '#1a1a1a', display: 'block' }}>Credit / Debit Card</b>
                    <small style={{ color: '#666', fontSize: '0.82rem' }}>Visa, Mastercard, RuPay, American Express</small>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="shopify-pay-btn"
              disabled={isSubmitting || isLocationAvailable === false}
            >
              {isSubmitting ? (
                'Processing Order...'
              ) : (
                `Complete Order · ₹${(totalAmount || 0).toLocaleString('en-IN')}`
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <aside className="summary checkout-summary">
          <h2 className="serif">Your order</h2>
          {cart.map(({ product, quantity, color, size }) => (
            <div className="mini-item" key={`${product.id}-${color || 'default'}-${size || 'default'}`}>
              <span>
                {product.name}
                {(color || size) && (
                  <small style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>
                    {[color ? `Colour: ${color}` : null, size ? `Size: ${size}` : null].filter(Boolean).join(' | ')}
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

          <p className="summary-note" style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: '#777' }}>
            🔒 Guaranteed 256-bit Encrypted Checkout
          </p>
        </aside>
      </section>
    </main>
  );
}
