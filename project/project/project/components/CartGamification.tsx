'use client';

import React from 'react';
import { Gift, Truck, Check, Sparkles } from 'lucide-react';

export function CartGamification({
  subtotal,
  compact = false,
}: {
  subtotal: number;
  compact?: boolean;
}) {
  const GIFT_THRESHOLD = 249;
  const SHIPPING_THRESHOLD = 599;

  const hasGift = subtotal >= GIFT_THRESHOLD;
  const hasShipping = subtotal >= SHIPPING_THRESHOLD;

  // 2-segment progress formula:
  // 0 -> 249 maps to 0% -> 50%
  // 249 -> 599 maps to 50% -> 100%
  let progressPercent = 0;
  if (subtotal <= 0) {
    progressPercent = 0;
  } else if (subtotal < GIFT_THRESHOLD) {
    progressPercent = (subtotal / GIFT_THRESHOLD) * 50;
  } else if (subtotal < SHIPPING_THRESHOLD) {
    const range = SHIPPING_THRESHOLD - GIFT_THRESHOLD;
    const progressInRange = subtotal - GIFT_THRESHOLD;
    progressPercent = 50 + (progressInRange / range) * 50;
  } else {
    progressPercent = 100;
  }
  progressPercent = Math.min(100, Math.max(0, Math.round(progressPercent)));

  const remainingForGift = Math.max(0, GIFT_THRESHOLD - subtotal);
  const remainingForShipping = Math.max(0, SHIPPING_THRESHOLD - subtotal);

  return (
    <div className={`gamification-card ${compact ? 'compact' : ''}`}>
      <style>{`
        .gamification-card {
          background: #ffffff;
          border: 1px solid #e9dfd1;
          border-radius: 12px;
          padding: 16px 18px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(51, 76, 61, 0.04);
          position: relative;
        }
        .gamification-card.compact {
          padding: 12px 14px;
          margin-bottom: 16px;
          border-radius: 10px;
        }
        .gamification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .gamification-message {
          font-size: 0.88rem;
          color: #2b2520;
          line-height: 1.4;
          font-weight: 500;
          flex: 1;
          min-width: 200px;
        }
        .gamification-card.compact .gamification-message {
          font-size: 0.82rem;
        }
        .gamification-message strong {
          color: #334c3d;
          font-weight: 700;
        }
        .gamification-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 3px 8px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .gamification-badge.complete {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
        .gamification-badge.progress {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        /* Progress Bar Track */
        .gamification-bar-wrapper {
          position: relative;
          margin: 18px 24px 34px 24px;
        }
        .gamification-card.compact .gamification-bar-wrapper {
          margin: 14px 20px 30px 20px;
        }
        .gamification-track {
          height: 7px;
          background: #f1ede7;
          border-radius: 10px;
          position: relative;
          overflow: hidden;
        }
        .gamification-fill {
          height: 100%;
          background: linear-gradient(90deg, #d4af37 0%, #334c3d 100%);
          border-radius: 10px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gamification-fill.shimmer {
          background: linear-gradient(90deg, #334c3d 0%, #16a34a 50%, #334c3d 100%);
          background-size: 200% 100%;
          animation: barShimmer 2.5s infinite linear;
        }
        @keyframes barShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Milestone Markers */
        .gamification-pin {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: default;
          z-index: 2;
        }
        .gamification-pin-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #d5c7b7;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8c7e72;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }
        .gamification-pin.unlocked .gamification-pin-icon {
          background: #334c3d;
          border-color: #334c3d;
          color: #ffffff;
          box-shadow: 0 0 0 3px rgba(51, 76, 61, 0.15);
        }
        .gamification-pin.gift {
          left: 50%;
        }
        .gamification-pin.shipping {
          left: 100%;
        }

        /* Milestone Labels - Centered for Gift, Right-anchored for Shipping to prevent clipping */
        .gamification-pin-label {
          position: absolute;
          top: 30px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #716558;
          white-space: nowrap;
        }
        .gamification-pin.gift .gamification-pin-label {
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }
        .gamification-pin.shipping .gamification-pin-label {
          right: 0;
          left: auto;
          transform: none;
          text-align: right;
        }
        .gamification-card.compact .gamification-pin-label {
          font-size: 0.68rem;
          top: 28px;
        }
        .gamification-pin.unlocked .gamification-pin-label {
          color: #166534;
          font-weight: 700;
        }

        /* Rewards Mini Badges Strip - Stacked on Mobile/Compact to prevent text cut-off */
        .gamification-perks {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #e9dfd1;
        }
        @media (min-width: 600px) {
          .gamification-card:not(.compact) .gamification-perks {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
        }
        .gamification-perk {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          padding: 8px 12px;
          border-radius: 6px;
          background: #faf8f5;
          border: 1px solid #f0e9df;
          color: #716558;
          transition: all 0.25s ease;
          min-width: 0;
        }
        .gamification-perk.unlocked {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
          font-weight: 600;
        }
        .gamification-perk-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          background: #e5ded4;
          color: #716558;
          flex-shrink: 0;
        }
        .gamification-perk.unlocked .gamification-perk-check {
          background: #16a34a;
          color: #ffffff;
        }
        .gamification-perk span:last-child {
          white-space: normal;
          line-height: 1.35;
          word-break: break-word;
        }
      `}</style>

      {/* Header Message */}
      <div className="gamification-header">
        <div className="gamification-message">
          {hasShipping ? (
            <span>
              🎉 <strong>Congratulations!</strong> You’ve unlocked <strong>FREE GIFT</strong> + <strong>FREE DELIVERY</strong>!
            </span>
          ) : hasGift ? (
            <span>
              🎁 <strong>Free Gift unlocked!</strong> Add <strong>₹{remainingForShipping.toLocaleString('en-IN')}</strong> more for <strong>FREE DELIVERY</strong>!
            </span>
          ) : (
            <span>
              🎁 Add <strong>₹{remainingForGift.toLocaleString('en-IN')}</strong> more to unlock a <strong>FREE GIFT</strong>!
            </span>
          )}
        </div>
        <div>
          {hasShipping ? (
            <span className="gamification-badge complete">
              <Sparkles size={11} /> All Perks Unlocked
            </span>
          ) : hasGift ? (
            <span className="gamification-badge progress">
              <Gift size={11} /> 1/2 Unlocked
            </span>
          ) : (
            <span className="gamification-badge progress">
              0/2 Unlocked
            </span>
          )}
        </div>
      </div>

      {/* Interactive Milestone Progress Bar */}
      <div className="gamification-bar-wrapper">
        <div className="gamification-track">
          <div
            className={`gamification-fill ${hasShipping ? 'shimmer' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Milestone 1: Free Gift (at 50% / ₹249) */}
        <div className={`gamification-pin gift ${hasGift ? 'unlocked' : ''}`}>
          <div className="gamification-pin-icon" title="₹249 Milestone: Free Gift">
            {hasGift ? <Check size={14} strokeWidth={3} /> : <Gift size={12} />}
          </div>
          <span className="gamification-pin-label">
            {hasGift ? '✓ Free Gift' : '₹249 Free Gift'}
          </span>
        </div>

        {/* Milestone 2: Free Delivery (at 100% / ₹599) */}
        <div className={`gamification-pin shipping ${hasShipping ? 'unlocked' : ''}`}>
          <div className="gamification-pin-icon" title="₹599 Milestone: Free Delivery">
            {hasShipping ? <Check size={14} strokeWidth={3} /> : <Truck size={12} />}
          </div>
          <span className="gamification-pin-label">
            {hasShipping ? '✓ Free Delivery' : '₹599 Free Delivery'}
          </span>
        </div>
      </div>

      {/* Bottom Perks Status Cards */}
      <div className="gamification-perks">
        <div className={`gamification-perk ${hasGift ? 'unlocked' : ''}`}>
          <span className="gamification-perk-check">
            {hasGift ? '✓' : '•'}
          </span>
          <span>🎁 Free Surprise Gift on orders ₹249+</span>
        </div>
        <div className={`gamification-perk ${hasShipping ? 'unlocked' : ''}`}>
          <span className="gamification-perk-check">
            {hasShipping ? '✓' : '•'}
          </span>
          <span>🚚 Free Express Delivery on orders ₹599+</span>
        </div>
      </div>
    </div>
  );
}
