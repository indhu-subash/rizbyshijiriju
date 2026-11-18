# WhatsApp template: admin "new order confirmed" notification

Business-initiated WhatsApp messages (outside the 24-hour customer-service window) must use a
**template approved by Meta**. Create this template in WhatsApp Manager and wait for approval
before enabling the integration.

| Setting | Value |
|---|---|
| Name | `riz_admin_new_order` (override with `WHATSAPP_ORDER_TEMPLATE_NAME`) |
| Category | **Utility** |
| Language | English (`en`) (override with `WHATSAPP_TEMPLATE_LANGUAGE`; must match exactly) |
| Header / Footer / Buttons | none |
| Parameter format | **Positional** (`{{1}}` ... `{{16}}`) |

## Body text (paste exactly)

```
NEW ORDER CONFIRMED!

Order ID: #{{1}}
Placed on: {{2}}

CUSTOMER DETAILS
Name: {{3}}
Phone: {{4}}
Email: {{5}}

ORDER DETAILS
{{6}}

PAYMENT DETAILS
Method: {{7}}
Status: {{8}}
Subtotal: {{9}}
Shipping: {{10}}
Discount: {{11}}
Final amount: {{12}}

DELIVERY DETAILS
Address: {{13}}
City: {{14}}
State: {{15}}
PIN code: {{16}}

Please process this order from the admin dashboard.
```

(The body ends with fixed text because Meta does not allow a template to end with a variable.)

## Parameter mapping (code: `buildWhatsAppParams` in `src/services/adminNotifications/formatters.ts`)

| # | Content | Source |
|---|---|---|
| 1 | Order ID (without `#`) | `Order.orderId` |
| 2 | Order date & time, IST | `Order.createdAt` |
| 3 | Customer name | `Order.shippingName` |
| 4 | Customer phone | `Order.shippingPhone` |
| 5 | Customer email | `Order.shippingEmail` |
| 6 | All items on one line: `1) Name [Colour: x, Size: y] Qty n x ₹price = ₹subtotal | 2) ...` | `OrderItem[]` |
| 7 | Payment method | `Order.paymentMethod` |
| 8 | Payment status | `Order.paymentStatus` |
| 9 | Subtotal | `Order.subtotal` |
| 10 | Shipping charge | `Order.shippingCharge` |
| 11 | Discount | `Order.discount` |
| 12 | Final order amount | `Order.total` |
| 13 | Address line | `Order.shippingAddressLine` |
| 14 | City | `Order.shippingCity` |
| 15 | State | `Order.shippingState` |
| 16 | PIN code | `Order.shippingPincode` |

Meta rules the code already respects: no newlines/tabs and no 5+ consecutive spaces inside a
parameter (items are joined with ` | `), no empty parameters (empty values become `-`), each
parameter capped at 1,024 characters (very long item lists are truncated with "+N more item(s)").

## Sample values to submit with the template (Meta asks for examples)

1 `RIZ-2026-12345` - 2 `17 Nov 2026, 3:45 PM IST` - 3 `Asha Nair` - 4 `+919876543210` - 5 `asha@example.com` -
6 `1) Pearl Drop Earrings [Colour: Gold, Size: Free] Qty 2 x ₹499 = ₹998` - 7 `UPI (Razorpay)` - 8 `Paid` -
9 `₹998` - 10 `₹60` - 11 `₹0` - 12 `₹1,058` - 13 `12 MG Road` - 14 `Kochi` - 15 `Kerala` - 16 `682001`

## Notes

* "Sent" in the dashboard means the WhatsApp Cloud API **accepted** the message (it returned a message ID).
  Final delivery/read receipts would need Meta status webhooks, which are not part of this change.
* While the WhatsApp number is in test mode, Meta only delivers to numbers on the allowed-recipient list.
  Add the admin number there, or complete business verification / go live.
* If you change the body text or variable count, update `buildWhatsAppParams` to match.
