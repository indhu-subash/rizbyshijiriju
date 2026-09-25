import * as nodemailer from 'nodemailer';

const STORE_NAME = 'RIZ by Shijiriju';
const STORE_EMAIL = process.env.EMAIL_FROM || process.env.MAIL_FROM || 'rizbyshijiriju@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rizbyshijiriju@gmail.com';
const STORE_WHATSAPP = '+91 9072308686';

function getSmtpCredentials() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER || STORE_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS || '';
  return { host, port, secure, user, pass };
}

export function createSmtpTransporter() {
  const creds = getSmtpCredentials();
  console.log(`[EMAIL] Transporter initialized: host=${creds.host}, port=${creds.port}, secure=${creds.secure}, userConfigured=${!!creds.user}, passConfigured=${!!creds.pass}`);
  
  return nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.secure,
    auth: {
      user: creds.user,
      pass: creds.pass,
    },
  });
}

export async function verifySmtpTransporter(): Promise<boolean> {
  const creds = getSmtpCredentials();
  if (!creds.pass) {
    console.warn(`[EMAIL] SMTP password missing. Set SMTP_PASS or EMAIL_PASS in Railway environment variables.`);
    return false;
  }
  try {
    const transporter = createSmtpTransporter();
    await transporter.verify();
    console.log(`[EMAIL] SMTP Transporter connection verified successfully.`);
    return true;
  } catch (err: any) {
    console.error(`[EMAIL] SMTP Transporter verification failed:`, err?.message || err);
    return false;
  }
}

export async function sendOrderConfirmationEmail(order: any): Promise<void> {
  try {
    const customerEmail = order.shippingEmail;
    console.log(`[EMAIL] Processing order confirmation email for order=${order.orderId}, recipient=${customerEmail || 'NONE'}`);

    if (!customerEmail) {
      console.warn(`[EMAIL] Warning: No recipient shipping email found for order ${order.orderId}`);
      return;
    }

    const creds = getSmtpCredentials();
    console.log(`[EMAIL] Recipient configured=true | Customer=${customerEmail} | Admin BCC=${ADMIN_EMAIL}`);

    const itemsListHtml = (order.items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong> ${item.color ? `<span style="color: #666; font-size: 12px;">(Color: ${item.color})</span>` : ''}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
      `
      )
      .join('');

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf9f6; padding: 24px; border: 1px solid #e5dfd5; border-radius: 8px; color: #334c3d;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e5dfd5;">
          <h1 style="margin: 0; font-size: 26px; letter-spacing: 0.1em; color: #334c3d;">RIZ by Shijiriju</h1>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #a9895b; text-transform: uppercase; letter-spacing: 0.15em;">Contemporary Jewellery</p>
        </div>

        <div style="padding: 24px 0;">
          <h2 style="font-size: 20px; margin-top: 0; color: #334c3d;">Thank you for your purchase!</h2>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            Dear <strong>${order.shippingName}</strong>,<br/>
            Your order <strong>#${order.orderId}</strong> has been confirmed and is being processed with extreme care.
          </p>

          <div style="background: #ffffff; border: 1px solid #eae5dd; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #a9895b;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f7f3ed; color: #555; text-align: left;">
                  <th style="padding: 8px 12px;">Item</th>
                  <th style="padding: 8px 12px; text-align: center;">Qty</th>
                  <th style="padding: 8px 12px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsListHtml}
              </tbody>
            </table>

            <div style="margin-top: 16px; border-top: 1px solid #eee; padding-top: 12px; font-size: 14px; line-height: 1.8;">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>₹${(order.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              ${
                order.discount
                  ? `
              <div style="display: flex; justify-content: space-between; color: #596759;">
                <span>Discount (${order.couponCode || 'Coupon'}):</span>
                <span>-₹${(order.discount || 0).toLocaleString('en-IN')}</span>
              </div>`
                  : ''
              }
              <div style="display: flex; justify-content: space-between;">
                <span>Shipping Charge:</span>
                <span>${order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 6px; border-top: 1px solid #ddd; padding-top: 6px; color: #334c3d;">
                <span>Total Paid:</span>
                <span>₹${(order.total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div style="background: #ffffff; border: 1px solid #eae5dd; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #a9895b;">Delivery Destination</h3>
            <p style="margin: 0; font-size: 13px; color: #444; line-height: 1.6;">
              <strong>${order.shippingName}</strong><br/>
              ${order.shippingAddressLine}, ${order.shippingCity}, ${order.shippingState} - ${order.shippingPincode}<br/>
              Country: ${order.shippingCountry || 'India'}<br/>
              Phone: ${order.shippingPhone}
            </p>
          </div>

          <div style="text-align: center; margin-top: 28px;">
            <a href="https://wa.me/919072308686?text=${encodeURIComponent(
              `Hi RIZ by Shijiriju, I am contacting regarding my confirmed Order #${order.orderId}.`
            )}" style="display: inline-block; background: #596759; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">
              💬 Connect on WhatsApp (${STORE_WHATSAPP})
            </a>
          </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #e5dfd5; padding-top: 16px; font-size: 11px; color: #888;">
          <p style="margin: 0;">Questions? Contact us at <a href="mailto:${STORE_EMAIL}" style="color: #a9895b;">${STORE_EMAIL}</a> or WhatsApp <a href="https://wa.me/919072308686" style="color: #a9895b;">${STORE_WHATSAPP}</a></p>
          <p style="margin: 4px 0 0 0;">© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
        </div>
      </div>
    `;

    if (!creds.pass) {
      console.log(`[EMAIL] Warning: SMTP password not set in environment. Email notification for order=${order.orderId} skipped. Set SMTP_PASS or EMAIL_PASS environment variable.`);
      return;
    }

    const transporter = createSmtpTransporter();

    // Send email to customer & store owner copy
    const mailInfo = await transporter.sendMail({
      from: `"${STORE_NAME}" <${creds.user}>`,
      to: customerEmail,
      bcc: ADMIN_EMAIL,
      subject: `Order Confirmation #${order.orderId} — ${STORE_NAME}`,
      html: emailHtml,
    });

    console.log(`[EMAIL] Send succeeded order=${order.orderId} | messageId=${mailInfo.messageId || 'SENT'} | customer=${customerEmail} | bcc=${ADMIN_EMAIL}`);
  } catch (err: any) {
    // Non-blocking error logging: Email failure MUST NOT throw or reverse order confirmation
    console.error(`[EMAIL] Send failed order=${order.orderId} error=${err?.message || err}`);
  }
}

export async function sendOrderConfirmationWhatsApp(order: any): Promise<void> {
  try {
    const phone = order.shippingPhone;
    if (!phone) return;

    const message = `✨ *${STORE_NAME} — Order Confirmed* ✨\n\nHi *${order.shippingName}*,\nThank you for your order *#${order.orderId}*!\n\n📦 *Order Total:* ₹${(order.total || 0).toLocaleString('en-IN')}\n📍 *Destination:* ${order.shippingCity}, ${order.shippingState}\n\nWe are preparing your items with love. Need quick support? Reply here or email ${STORE_EMAIL}.`;

    console.log(`[WhatsApp Notification Log] Receiver: ${phone} | Message: ${message.replace(/\n/g, ' ')}`);

    if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_KEY) {
      await fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
        },
        body: JSON.stringify({
          to: phone,
          message,
        }),
      });
    }
  } catch (err: any) {
    console.error(`[NotificationService Error] WhatsApp alert error for order ${order.orderId}:`, err?.message || err);
  }
}

