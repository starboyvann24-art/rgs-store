import https from 'https';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// ============================================================
// RGS STORE — Discord Webhook Utility
// Sends rich embed notifications to the admin Discord channel
// Gracefully skips if DISCORD_WEBHOOK_URL is not configured
// ============================================================

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
}

/**
 * Sends a rich embed message to the configured Discord webhook.
 * Fails silently — will never throw or crash the main app.
 */
export async function sendDiscordWebhook(embed: DiscordEmbed): Promise<void> {
  const FALLBACK_URL = 'https://discord.com/api/webhooks/1493406609861251153/O1-aaY3nsVmW7MRl_Q8AEwbkcYCipL7pj0gjqBm2JEC-rTHUkZBdkkUSUO5XUkaxNSWv';
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || FALLBACK_URL;

  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    // Should not happen with fallback, but safe check
    return;
  }

  const payload = JSON.stringify({
    username: 'RGS STORE Bot',
    avatar_url: 'https://cdn.discordapp.com/emojis/1097836456.png',
    embeds: [
      {
        ...embed,
        color: embed.color ?? 0x22c55e, // default: neon green
        timestamp: embed.timestamp ?? new Date().toISOString(),
        footer: embed.footer ?? { text: 'RGS STORE Notification System' }
      }
    ]
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const url = new URL(webhookUrl);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        // Discord returns 204 No Content on success
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Discord webhook error: ${res.statusCode}`));
        } else {
          resolve();
        }
        res.resume(); // consume response body
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Discord webhook timeout'));
      });

      req.write(payload);
      req.end();
    });
  } catch (err: any) {
    // Log but never crash the main application
    console.warn('⚠️  Discord webhook failed (non-critical):', err.message);
  }
}

/**
 * Pre-built: New Order notification embed
 */
export function buildOrderEmbed(order: {
  order_number: string;
  product_name: string;
  qty: number;
  total_price: number;
  payment_method: string;
  user_name: string;
  user_email: string;
}): DiscordEmbed {
  return {
    title: '🛒 PESANAN BARU MASUK!',
    color: 0xff6b00, // neon orange
    fields: [
      { name: '📋 Order ID', value: `#${order.order_number}`, inline: true },
      { name: '📦 Produk', value: order.product_name, inline: true },
      { name: '🔢 Qty', value: String(order.qty), inline: true },
      {
        name: '💰 Total',
        value: `Rp ${order.total_price.toLocaleString('id-ID')}`,
        inline: true
      },
      { name: '💳 Pembayaran', value: order.payment_method, inline: true },
      { name: '👤 Pembeli', value: `${order.user_name} (${order.user_email})`, inline: false }
    ],
    footer: { text: 'Segera proses pesanan ini di Admin Dashboard!' }
  };
}

/**
 * Pre-built: New CS Ticket notification embed
 */
export function buildTicketEmbed(ticket: {
  ticket_number: string;
  user_name: string;
  subject: string;
  message: string;
}): DiscordEmbed {
  return {
    title: '🎫 TIKET CS BARU!',
    color: 0x3b82f6, // blue
    fields: [
      { name: '🎫 Tiket ID', value: `#${ticket.ticket_number}`, inline: true },
      { name: '👤 User', value: ticket.user_name, inline: true },
      { name: '📌 Subject', value: ticket.subject, inline: false },
      { name: '💬 Pesan', value: ticket.message.slice(0, 200) + (ticket.message.length > 200 ? '...' : ''), inline: false }
    ],
    footer: { text: 'Balas tiket ini melalui Admin Dashboard → Pusat Bantuan' }
  };
}
