# WhatsApp Meta Cloud API Template: Admin Wholesale Enquiry Notification

This document specifies the WhatsApp template required to deliver real-time notifications to the store owner whenever a customer submits a wholesale enquiry on the RIZ by Shijiriju website.

## 1. Template Overview

- **Template Name:** `riz_admin_new_wholesale_enquiry`
- **Category:** `UTILITY`
- **Language:** `en` (English)
- **Header:** None
- **Footer:** None
- **Buttons:** None (or optional URL button linking to admin dashboard)

## 2. Template Body (for Meta Business Manager)

```text
*New Wholesale Enquiry Received*

*Enquiry ID:* {{1}}
*Date:* {{2}}

*Customer:* {{3}}
*Business:* {{4}}
*WhatsApp:* {{5}}
*Email:* {{6}}
*Location:* {{7}}
*Est. Quantity:* {{8}}

*Message:*
{{9}}

Please review this enquiry in your RIZ Admin Dashboard.
```

## 3. Parameter Mapping (9 positional parameters)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `{{1}}` | Wholesale Enquiry ID | `550e8400-e29b-41d4-a716-446655440000` |
| `{{2}}` | Date & Time (IST) | `18 Nov 2026, 02:30 pm IST` |
| `{{3}}` | Contact Person Name | `Rajesh Sharma` |
| `{{4}}` | Business / Store Name | `Sharma Fine Jewels` |
| `{{5}}` | Customer WhatsApp Number | `+91 98765 43210` |
| `{{6}}` | Customer Email | `rajesh@example.com` |
| `{{7}}` | Location | `Kochi, Kerala` |
| `{{8}}` | Estimated Quantity | `500 pcs` |
| `{{9}}` | Enquiry Message | `Looking for daily wear silver rings in bulk.` |

## 4. Configuration

The template name defaults to `riz_admin_new_wholesale_enquiry`. If your approved template in Meta has a different name, override it using the environment variable:

```env
WHATSAPP_WHOLESALE_TEMPLATE_NAME=your_approved_template_name
```
