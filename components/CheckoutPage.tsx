'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Lock } from 'lucide-react';
import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useStore } from './StoreProvider';
import { api } from '@/lib/api';

export function CheckoutPage() {
  const { cart, subtotal, clearCart, user, isAuthenticated } = useStore();
  
  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [step, setStep] = useState(1);
  
  // Shipping Address Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Shipping & Totals
  const [shippingCharge, setShippingCharge] = useState(79);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'card' | 'cod'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Prepopulate form if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setName(user.name);
      setEmail(user.email);
      if (user.phone) setPhone(user.phone);

      // Load saved addresses and default it
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
            setPincode(defaultAddr.pincode);
          }
        } catch (err) {
          console.error('Failed to load saved address:', err);
        }
      };
      loadDefaultAddress();
    }
  }, [isAuthenticated, user]);

  // Query shipping rate when pincode changes
  useEffect(() => {
    if (pincode.length === 6 && !isNaN(Number(pincode))) {
      const getShipping = async () => {
        try {
          const res = await api.orders.checkShipping(pincode);
          // Free shipping above 999
          if (subtotal >= 999) {
            setShippingCharge(0);
          } else {
            setShippingCharge(res.shippingCharge);
          }
        } catch (err) {
          console.warn('Failed to fetch shipping rate, using default:', err);
          setShippingCharge(subtotal >= 999 ? 0 : 79);
        }
      };
      getShipping();
    }
  }, [pincode, subtotal]);

  // Load Razorpay Script helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Calculate discount client-side for summary preview
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      const amt = (subtotal * appliedCoupon.value) / 100;
      return Math.round(amt * 100) / 100;
    }
    return appliedCoupon.value;
  }, [appliedCoupon, subtotal]);

  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCharge);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode) return;

    try {
      // We will perform a checkout dry-run or mock validate by calling checkout order calculation mock
      // Since there is no standalone public validate-coupon endpoint, we can test it directly:
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

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCheckoutError('');

    const shippingAddress = {
      name,
      phone,
      email,
      addressLine,
      city,
      state,
      pincode,
      country: 'India',
    };

    const cartItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      color: item.color || null,
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

      // 2. Handle Cash on Delivery (COD) Checkout
      if (paymentMethod === 'cod') {
        clearCart();
        setPlacedOrderId(dbOrder.orderId);
        setPlaced(true);
        setIsSubmitting(false);
        return;
      }

      // 3. Handle Mock Payment Checkout
      if (res.paymentMode === 'mock') {
        // Automatically verify mock payment on backend
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
          throw new Error('Failed to load payment gateway SDK. Please check connection.');
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

  const useSavedAddress = (addr: any) => {
    setName(addr.name);
    setPhone(addr.phone);
    setEmail(addr.email);
    setAddressLine(addr.addressLine);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setStep(2);
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
                onClick={() => setStep(i + 1)}
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
                    Phone
                    <input
                      required
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                  <label className="wide">
                    Email
                    <input
                      required
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="wide">
                    Address
                    <input
                      required
                      placeholder="House no., street, area"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                    />
                  </label>
                  <label>
                    City
                    <input
                      required
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </label>
                  <label>
                    State
                    <input
                      required
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </label>
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
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="choice-list">
                  <label>
                    <input type="radio" name="delivery" defaultChecked />
                    <span>
                      <b>Standard delivery</b>
                      <small>3–5 working days · Free above ₹999</small>
                    </span>
                    <strong>{shippingCharge === 0 ? 'Free' : `₹${shippingCharge}`}</strong>
                  </label>
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
                      <b>UPI App</b>
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
                      <small>Visa, Mastercard, RuPay</small>
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <span>
                      <b>Cash on Delivery (COD)</b>
                      <small>Available on eligible orders</small>
                    </span>
                  </label>
                </div>
              )}

              {step === 4 && (
                <div className="review-section">
                  <p className="mb-4">
                    Please review your shipping and payment details before completing the checkout:
                  </p>
                  <div className="review-grid border p-4 rounded mb-6" style={{ display: 'grid', gap: '15px' }}>
                    <div>
                      <span className="eyebrow">Shipping Address</span>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm muted">{addressLine}, {city}, {state} - {pincode}</p>
                      <p className="text-sm muted">Phone: {phone}</p>
                    </div>
                    <div>
                      <span className="eyebrow">Payment Method</span>
                      <p className="font-medium">
                        {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod === 'card' ? 'Credit/Debit Card' : 'UPI Payment'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-actions">
                {step > 1 && (
                  <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>
                    Back
                  </button>
                )}
                {step < 4 ? (
                  <button type="button" className="button" onClick={() => setStep(step + 1)}>
                    Continue
                  </button>
                ) : (
                  <button className="button" type="submit" disabled={isSubmitting}>
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
              <b>₹{(product.price * quantity).toLocaleString('en-IN')}</b>
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
            {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            {couponSuccess && <p className="text-xs text-green-600 mt-1">{couponSuccess}</p>}
          </div>

          <div className="price-lines border-t pt-4 mt-4" style={{ display: 'grid', gap: '8px' }}>
            <div className="flex justify-between text-sm">
              <span>Bag Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Shipping Fee</span>
              <span>{shippingCharge === 0 ? 'Free' : `₹${shippingCharge}`}</span>
            </div>
          </div>

          <div className="summary-total border-t pt-4 mt-4">
            <span>Total</span>
            <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}
