import type { TemplateName } from './schemas'

export type RenderedEmail = {
  subject: string
  html: string
  text: string
}

// ─── Mustache-style substitution ─────────────────────────────────────────────

function sub(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = data[key]
    if (val === undefined || val === null) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'number' || typeof val === 'boolean') return val.toString()
    if (typeof val === 'object') return JSON.stringify(val)
    return ''
  })
}

// ─── HTML wrapper ────────────────────────────────────────────────────────────

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a}
  .wrap{max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)}
  .hdr{background:#F9A931;padding:28px 24px;text-align:center}
  .hdr h1{margin:0;font-size:22px;color:#fff;font-weight:700}
  .body{padding:28px 24px;font-size:15px;line-height:1.6;color:#333}
  .body p{margin:0 0 16px}
  .btn{display:inline-block;background:#F9A931;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:700;font-size:14px;margin:8px 0}
  .ftr{background:#f5f5f5;padding:16px 24px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0}
  .mono{font-family:monospace;font-size:12px;color:#999;word-break:break-all}
  .notice{background:#fff8e1;border-left:4px solid #F9A931;padding:12px 16px;margin:16px 0;font-size:14px}
</style>
</head>
<body>
<div class="wrap">
${body}
<div class="ftr">
  <p style="margin:0 0 4px"><strong>Eat Good Uganda</strong></p>
  <p style="margin:0">Do not reply to this email · <a href="https://eatgooduganda.com/privacy" style="color:#F9A931">Privacy</a></p>
</div>
</div>
</body>
</html>`
}

function hdr(title: string) {
  return `<div class="hdr"><h1>${title}</h1></div>\n<div class="body">`
}
const end = `</div>`

// ─── Template registry ────────────────────────────────────────────────────────

type TemplateEntry = { subject: string; html: string; text: string }

const TEMPLATES: Record<TemplateName, TemplateEntry> = {
  // ── Customer auth ──────────────────────────────────────────────────────────
  'customer-verify-email': {
    subject: 'Verify your Eat Good Uganda email address',
    html: wrap(
      'Verify your email',
      hdr('Verify your email') +
        `
<p>Hi {{first_name}},</p>
<p>Welcome to Eat Good Uganda! Please verify your email address to complete your account setup.</p>
<p style="text-align:center"><a href="{{verification_link}}" class="btn">Verify Email</a></p>
<p class="mono">Or paste this link: {{verification_link}}</p>
<p>If you did not sign up, you can ignore this email.</p>
` +
        end,
    ),
    text: `Verify your Eat Good Uganda email address

Hi {{first_name}},

Welcome to Eat Good Uganda! Please verify your email:

{{verification_link}}

If you did not sign up, ignore this email.

Eat Good Uganda`,
  },

  'customer-password-reset': {
    subject: 'Reset your Eat Good Uganda password',
    html: wrap(
      'Reset your password',
      hdr('Reset your password') +
        `
<p>Hi {{first_name}},</p>
<p>We received a request to reset your password. This link expires in {{expires_minutes}} minutes.</p>
<p style="text-align:center"><a href="{{reset_link}}" class="btn">Reset Password</a></p>
<p class="mono">Or paste: {{reset_link}}</p>
<p>If you did not request a reset, your account is safe — no action needed.</p>
` +
        end,
    ),
    text: `Reset your Eat Good Uganda password

Hi {{first_name}},

Reset your password (expires in {{expires_minutes}} minutes):

{{reset_link}}

If you did not request this, no action needed.

Eat Good Uganda`,
  },

  'customer-password-changed': {
    subject: 'Your Eat Good Uganda password was changed',
    html: wrap(
      'Password changed',
      hdr('Password changed') +
        `
<p>Hi {{first_name}},</p>
<p>Your Eat Good Uganda password was successfully changed.</p>
<div class="notice">If you did not make this change, contact us immediately at support@eatgooduganda.com.</div>
` +
        end,
    ),
    text: `Your Eat Good Uganda password was changed

Hi {{first_name}},

Your password was successfully changed.

If you did not make this change, contact support@eatgooduganda.com immediately.

Eat Good Uganda`,
  },

  // ── Customer orders ────────────────────────────────────────────────────────
  'customer-order-placed': {
    subject: 'Order {{order_number}} received — {{bakery_name}}',
    html: wrap(
      'Order received',
      hdr('Order received') +
        `
<p>Hi {{first_name}},</p>
<p>Your order <strong>#{{order_number}}</strong> from <strong>{{bakery_name}}</strong> has been received.</p>
<p><strong>Items:</strong> {{items_summary}}<br><strong>Total:</strong> {{total_formatted}}</p>
<div class="notice"><strong>Payment instructions</strong><br>{{payment_instructions}}</div>
<p style="text-align:center"><a href="{{order_link}}" class="btn">View Order</a></p>
` +
        end,
    ),
    text: `Order {{order_number}} received — {{bakery_name}}

Hi {{first_name}},

Your order #{{order_number}} from {{bakery_name}} has been received.

Items: {{items_summary}}
Total: {{total_formatted}}

Payment instructions:
{{payment_instructions}}

View order: {{order_link}}

Eat Good Uganda`,
  },

  'customer-order-confirmed': {
    subject: 'Order {{order_number}} confirmed — {{bakery_name}}',
    html: wrap(
      'Order confirmed',
      hdr('Order confirmed ✓') +
        `
<p>Hi {{first_name}},</p>
<p>Your order <strong>#{{order_number}}</strong> from <strong>{{bakery_name}}</strong> is confirmed.</p>
<p><strong>Estimated time:</strong> {{eta}}</p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">Track Order</a></p>
` +
        end,
    ),
    text: `Order {{order_number}} confirmed — {{bakery_name}}

Hi {{first_name}},

Your order #{{order_number}} from {{bakery_name}} is confirmed.

Estimated time: {{eta}}

Track your order: {{order_link}}

Eat Good Uganda`,
  },

  'customer-order-status': {
    subject: 'Order {{order_number}} update — {{status_label}}',
    html: wrap(
      'Order update',
      hdr('Order update') +
        `
<p>Hi {{first_name}},</p>
<p>Your order <strong>#{{order_number}}</strong> from <strong>{{bakery_name}}</strong> is now: <strong>{{status_label}}</strong>.</p>
<p>{{bakery_note}}</p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">View Order</a></p>
` +
        end,
    ),
    text: `Order {{order_number}} update — {{status_label}}

Hi {{first_name}},

Your order #{{order_number}} from {{bakery_name}} is now: {{status_label}}.

{{bakery_note}}

View order: {{order_link}}

Eat Good Uganda`,
  },

  'customer-order-ready-pickup': {
    subject: 'Order {{order_number}} ready for pickup',
    html: wrap(
      'Ready for pickup',
      hdr('Ready for pickup!') +
        `
<p>Hi {{first_name}},</p>
<p>Your order <strong>#{{order_number}}</strong> from <strong>{{bakery_name}}</strong> is ready for pickup.</p>
<p><strong>Address:</strong> {{pickup_address}}</p>
<p>{{opening_hours_note}}</p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">View Order</a></p>
` +
        end,
    ),
    text: `Order {{order_number}} ready for pickup

Hi {{first_name}},

Your order #{{order_number}} from {{bakery_name}} is ready.

Pickup address: {{pickup_address}}
{{opening_hours_note}}

View order: {{order_link}}

Eat Good Uganda`,
  },

  'customer-order-out-for-delivery': {
    subject: 'Order {{order_number}} is on its way',
    html: wrap(
      'Out for delivery',
      hdr('On its way!') +
        `
<p>Hi {{first_name}},</p>
<p>Your order <strong>#{{order_number}}</strong> from <strong>{{bakery_name}}</strong> is out for delivery.</p>
<p>{{delivery_note}}</p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">Track Order</a></p>
` +
        end,
    ),
    text: `Order {{order_number}} is on its way

Hi {{first_name}},

Your order #{{order_number}} from {{bakery_name}} is out for delivery.

{{delivery_note}}

Track order: {{order_link}}

Eat Good Uganda`,
  },

  'customer-order-delivered': {
    subject: 'Order {{order_number}} delivered — enjoy!',
    html: wrap(
      'Order delivered',
      hdr('Delivered!') +
        `
<p>Hi {{first_name}},</p>
<p>Your order <strong>#{{order_number}}</strong> from <strong>{{bakery_name}}</strong> has been delivered.</p>
<p><strong>Total charged:</strong> {{total_formatted}}</p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">View Receipt</a></p>
` +
        end,
    ),
    text: `Order {{order_number}} delivered

Hi {{first_name}},

Your order #{{order_number}} from {{bakery_name}} has been delivered.
Total: {{total_formatted}}

View receipt: {{order_link}}

Eat Good Uganda`,
  },

  'customer-order-cancelled': {
    subject: 'Order {{order_number}} cancelled',
    html: wrap(
      'Order cancelled',
      hdr('Order cancelled') +
        `
<p>Hi {{first_name}},</p>
<p>Your order <strong>#{{order_number}}</strong> from <strong>{{bakery_name}}</strong> has been cancelled.</p>
<p>{{reason}}</p>
<p>{{refund_note}}</p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">View Order</a></p>
` +
        end,
    ),
    text: `Order {{order_number}} cancelled

Hi {{first_name}},

Your order #{{order_number}} from {{bakery_name}} has been cancelled.

{{reason}}
{{refund_note}}

View order: {{order_link}}

Eat Good Uganda`,
  },

  'customer-order-message': {
    subject: 'New message about order {{order_number}} from {{bakery_name}}',
    html: wrap(
      'New message',
      hdr('Message from {{bakery_name}}') +
        `
<p>Hi {{first_name}},</p>
<p><strong>{{bakery_name}}</strong> sent a message about order <strong>#{{order_number}}</strong>:</p>
<div class="notice">{{message_excerpt}}</div>
<p style="text-align:center"><a href="{{order_link}}" class="btn">View Message</a></p>
` +
        end,
    ),
    text: `New message about order {{order_number}} from {{bakery_name}}

Hi {{first_name}},

{{bakery_name}} sent a message about order #{{order_number}}:

{{message_excerpt}}

View message: {{order_link}}

Eat Good Uganda`,
  },

  // ── Bakery ─────────────────────────────────────────────────────────────────
  'bakery-verify-email': {
    subject: 'Verify your Eat Good Uganda bakery email',
    html: wrap(
      'Verify your bakery email',
      hdr('Verify your email') +
        `
<p>Hi {{owner_name}},</p>
<p>Thank you for registering <strong>{{bakery_name}}</strong> on Eat Good Uganda. Please verify your email to continue.</p>
<p style="text-align:center"><a href="{{verification_link}}" class="btn">Verify Email</a></p>
<p class="mono">Or paste: {{verification_link}}</p>
` +
        end,
    ),
    text: `Verify your Eat Good Uganda bakery email

Hi {{owner_name}},

Verify your email for {{bakery_name}}:

{{verification_link}}

Eat Good Uganda`,
  },

  'bakery-approved': {
    subject: 'Congratulations — {{bakery_name}} is approved!',
    html: wrap(
      'Bakery approved',
      hdr("You're approved!") +
        `
<p>Hi {{owner_name}},</p>
<p>Great news! <strong>{{bakery_name}}</strong> has been approved on Eat Good Uganda. You can now log in to your dashboard and start receiving orders.</p>
<p style="text-align:center"><a href="{{dashboard_link}}" class="btn">Go to Dashboard</a></p>
` +
        end,
    ),
    text: `Congratulations — {{bakery_name}} is approved!

Hi {{owner_name}},

{{bakery_name}} has been approved on Eat Good Uganda!

Go to your dashboard: {{dashboard_link}}

Eat Good Uganda`,
  },

  'bakery-rejected': {
    subject: 'Update on your {{bakery_name}} application',
    html: wrap(
      'Application update',
      hdr('Application update') +
        `
<p>Hi {{owner_name}},</p>
<p>We have reviewed your application for <strong>{{bakery_name}}</strong> and are unable to approve it at this time.</p>
<div class="notice"><strong>Reason:</strong> {{reason}}</div>
<p>If you believe this decision is incorrect, you can appeal:</p>
<p style="text-align:center"><a href="{{appeal_link}}" class="btn">Submit Appeal</a></p>
` +
        end,
    ),
    text: `Update on your {{bakery_name}} application

Hi {{owner_name}},

We are unable to approve {{bakery_name}} at this time.

Reason: {{reason}}

Submit an appeal: {{appeal_link}}

Eat Good Uganda`,
  },

  'bakery-staff-invite': {
    subject: 'You have been invited to join {{bakery_name}}',
    html: wrap(
      'Staff invitation',
      hdr("You're invited!") +
        `
<p>Hi {{invitee_name}},</p>
<p>You have been invited to join <strong>{{bakery_name}}</strong> as <strong>{{role}}</strong> on Eat Good Uganda. This invitation expires in {{expires_hours}} hours.</p>
<p style="text-align:center"><a href="{{invite_link}}" class="btn">Accept Invitation</a></p>
` +
        end,
    ),
    text: `You have been invited to join {{bakery_name}}

Hi {{invitee_name}},

You are invited to join {{bakery_name}} as {{role}}.
This invitation expires in {{expires_hours}} hours.

Accept: {{invite_link}}

Eat Good Uganda`,
  },

  'bakery-new-order': {
    subject: 'New order #{{order_number}} — {{bakery_name}}',
    html: wrap(
      'New order',
      hdr('New order!') +
        `
<p>You have a new order from <strong>{{customer_name}}</strong>.</p>
<p><strong>Order:</strong> #{{order_number}}<br><strong>Items:</strong> {{items_summary}}<br><strong>Total:</strong> {{total_formatted}}<br><strong>Fulfilment:</strong> {{fulfilment_mode}}</p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">View in Dashboard</a></p>
` +
        end,
    ),
    text: `New order #{{order_number}} — {{bakery_name}}

New order from {{customer_name}}.

Order: #{{order_number}}
Items: {{items_summary}}
Total: {{total_formatted}}
Fulfilment: {{fulfilment_mode}}

View in dashboard: {{order_link}}

Eat Good Uganda`,
  },

  'bakery-bank-proof': {
    subject: 'Bank transfer proof uploaded for order #{{order_number}}',
    html: wrap(
      'Bank transfer proof',
      hdr('Bank transfer proof received') +
        `
<p>A customer has uploaded bank transfer proof for order <strong>#{{order_number}}</strong>.</p>
<p><strong>Amount declared:</strong> {{amount_formatted}}</p>
<p><a href="{{proof_image_link}}" style="color:#F9A931">View proof image</a></p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">Review Order</a></p>
` +
        end,
    ),
    text: `Bank transfer proof uploaded for order #{{order_number}}

Amount declared: {{amount_formatted}}
Proof image: {{proof_image_link}}

Review order: {{order_link}}

Eat Good Uganda`,
  },

  'bakery-order-cancelled': {
    subject: 'Order #{{order_number}} cancelled by customer',
    html: wrap(
      'Order cancelled',
      hdr('Order cancelled') +
        `
<p>Order <strong>#{{order_number}}</strong> has been cancelled by the customer.</p>
<p>{{reason}}</p>
<p style="text-align:center"><a href="{{order_link}}" class="btn">View Order</a></p>
` +
        end,
    ),
    text: `Order #{{order_number}} cancelled by customer

Order #{{order_number}} has been cancelled.

{{reason}}

View order: {{order_link}}

Eat Good Uganda`,
  },

  'bakery-weekly-digest': {
    subject: 'Weekly digest for {{bakery_name}} — {{period_label}}',
    html: wrap(
      'Weekly digest',
      hdr('Weekly digest') +
        `
<p>Here is your weekly summary for <strong>{{bakery_name}}</strong> ({{period_label}}).</p>
<p><strong>Orders:</strong> {{orders_count}}<br><strong>Revenue:</strong> {{revenue_formatted}}</p>
<p style="text-align:center"><a href="{{dashboard_link}}" class="btn">View Dashboard</a></p>
` +
        end,
    ),
    text: `Weekly digest for {{bakery_name}} — {{period_label}}

Orders: {{orders_count}}
Revenue: {{revenue_formatted}}

View dashboard: {{dashboard_link}}

Eat Good Uganda`,
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  'admin-bakery-pending': {
    subject: 'New bakery application: {{bakery_name}}',
    html: wrap(
      'New bakery application',
      hdr('New bakery application') +
        `
<p>A new bakery has applied for approval.</p>
<p><strong>Bakery:</strong> {{bakery_name}}<br><strong>Owner:</strong> {{owner_name}} ({{owner_email}})</p>
<p style="text-align:center"><a href="{{application_link}}" class="btn">Review Application</a></p>
` +
        end,
    ),
    text: `New bakery application: {{bakery_name}}

Bakery: {{bakery_name}}
Owner: {{owner_name}} ({{owner_email}})

Review: {{application_link}}

Eat Good Uganda`,
  },

  'admin-invite': {
    subject: 'You have been invited to Eat Good Uganda admin',
    html: wrap(
      'Admin invitation',
      hdr('Admin invitation') +
        `
<p>Hi {{invitee_name}},</p>
<p>You have been invited to join the Eat Good Uganda admin team. This invitation expires in {{expires_hours}} hours.</p>
<p style="text-align:center"><a href="{{invite_link}}" class="btn">Accept Invitation</a></p>
` +
        end,
    ),
    text: `You have been invited to Eat Good Uganda admin

Hi {{invitee_name}},

Accept your invitation (expires in {{expires_hours}} hours):

{{invite_link}}

Eat Good Uganda`,
  },

  'admin-daily-summary': {
    subject: 'Daily summary — {{date_label}}',
    html: wrap(
      'Daily summary',
      hdr('Daily summary') +
        `
<p><strong>Date:</strong> {{date_label}}</p>
<p><strong>New signups:</strong> {{new_signups}}<br><strong>Orders:</strong> {{orders_count}}<br><strong>Revenue:</strong> {{revenue_formatted}}<br><strong>Errors:</strong> {{errors_count}}<br><strong>Stuck payments:</strong> {{stuck_payments_count}}</p>
<p style="text-align:center"><a href="{{dashboard_link}}" class="btn">Open Dashboard</a></p>
` +
        end,
    ),
    text: `Daily summary — {{date_label}}

New signups: {{new_signups}}
Orders: {{orders_count}}
Revenue: {{revenue_formatted}}
Errors: {{errors_count}}
Stuck payments: {{stuck_payments_count}}

Dashboard: {{dashboard_link}}

Eat Good Uganda`,
  },
}

// ─── Public render function ───────────────────────────────────────────────────

export function renderEmail(
  templateName: TemplateName,
  data: Record<string, unknown>,
): RenderedEmail {
  const tpl = TEMPLATES[templateName]
  return {
    subject: sub(tpl.subject, data),
    html: sub(tpl.html, data),
    text: sub(tpl.text, data),
  }
}
