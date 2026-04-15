import nodemailer from 'nodemailer';

// ============================================================
// RGS STORE — Mailer v1.0
// Nodemailer with HTML email templates
// Uses: process.env.SMTP_EMAIL, SMTP_PASS
// ============================================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS
  }
});

const STORE_NAME = 'RGS STORE';
const STORE_COLOR = '#f97316';
const STORE_URL = process.env.APP_URL || 'https://rgsstore.com';

function baseTemplate(content: string, title: string): string {
  return `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,${STORE_COLOR},#ea580c);padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-1px;">${STORE_NAME}</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Marketplace Digital Premium</p>
      </div>
      <!-- Content -->
      <div style="padding:36px 40px;">
        ${content}
      </div>
      <!-- Footer -->
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">© 2026 ${STORE_NAME} · Semua hak dilindungi</p>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:11px;">
          <a href="${STORE_URL}" style="color:${STORE_COLOR};text-decoration:none;">Kunjungi Toko</a>
          &nbsp;·&nbsp;
          <a href="https://wa.me/62882016259591" style="color:${STORE_COLOR};text-decoration:none;">WhatsApp CS</a>
        </p>
      </div>
    </div>
  </body>
  </html>`;
}

// ─── Send: Reset Password Email ────────────────────────────────
export async function sendResetPasswordEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const content = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:800;">Reset Password</h2>
    <p style="color:#334155;line-height:1.7;margin:0 0 24px;">Halo <strong>${name}</strong>,</p>
    <p style="color:#334155;line-height:1.7;margin:0 0 24px;">
      Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk mengatur password baru. 
      Link ini akan kedaluwarsa dalam <strong>1 jam</strong>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,${STORE_COLOR},#ea580c);color:#fff;font-weight:800;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;box-shadow:0 4px 16px rgba(249,115,22,0.35);">
        🔑 Reset Password Sekarang
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;line-height:1.7;margin:24px 0 0;">
      Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.
    </p>`;

  await transporter.sendMail({
    from: `"${STORE_NAME}" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `🔑 Reset Password Akun ${STORE_NAME} Anda`,
    html: baseTemplate(content, 'Reset Password')
  });
}

// ─── Send: Order Created Email ─────────────────────────────────
export async function sendOrderCreatedEmail(to: string, name: string, orderData: {
  order_number: string;
  product_name: string;
  total_price: number;
  payment_method: string;
  created_at?: string;
}): Promise<void> {
  const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(orderData.total_price);

  const content = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:800;">🛒 Pesanan Berhasil Dibuat!</h2>
    <p style="color:#334155;line-height:1.7;margin:0 0 24px;">Halo <strong>${name}</strong>,</p>
    <p style="color:#334155;line-height:1.7;margin:0 0 24px;">
      Terima kasih telah berbelanja di <strong>${STORE_NAME}</strong>! Pesanan Anda telah berhasil dibuat dan sedang menunggu pembayaran.
    </p>
    
    <!-- Order Card -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:12px;">
        <span style="color:#64748b;font-size:13px;font-weight:600;">No. Invoice</span>
        <span style="color:#f97316;font-weight:900;font-size:14px;font-family:monospace;">#${orderData.order_number}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#64748b;font-size:13px;">Produk</span>
        <span style="color:#1e293b;font-weight:700;font-size:13px;">${orderData.product_name}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#64748b;font-size:13px;">Metode Bayar</span>
        <span style="color:#1e293b;font-weight:700;font-size:13px;">${orderData.payment_method}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #e2e8f0;margin-top:4px;">
        <span style="color:#0f172a;font-weight:800;font-size:14px;">Total Bayar</span>
        <span style="color:${STORE_COLOR};font-weight:900;font-size:18px;">${formattedPrice}</span>
      </div>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${STORE_URL}/payment.html" style="display:inline-block;background:linear-gradient(135deg,${STORE_COLOR},#ea580c);color:#fff;font-weight:800;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;box-shadow:0 4px 16px rgba(249,115,22,0.35);">
        💳 Upload Bukti Pembayaran
      </a>
    </div>
    <p style="color:#94a3b8;font-size:12px;line-height:1.7;text-align:center;">
      Pesanan diproses setelah bukti pembayaran diverifikasi admin (max. 1×24 jam)
    </p>`;

  await transporter.sendMail({
    from: `"${STORE_NAME}" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `🛒 Pesanan Baru #${orderData.order_number} - ${STORE_NAME}`,
    html: baseTemplate(content, 'Pesanan Berhasil Dibuat')
  });
}

// ─── Send: Order Paid / Completed Email ────────────────────────
export async function sendOrderPaidEmail(to: string, name: string, orderData: {
  order_number: string;
  product_name: string;
  total_price: number;
  credentials?: string;
}): Promise<void> {
  const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(orderData.total_price);

  const credentialsBlock = orderData.credentials ? `
    <div style="background:#fff7ed;border:2px solid ${STORE_COLOR};border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#ea580c;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">🔑 Kredensial / Detail Produk</p>
      <p style="margin:0;color:#0f172a;font-family:monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;">${orderData.credentials}</p>
    </div>` : '';

  const content = `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:800;">✅ Pembayaran Dikonfirmasi!</h2>
    <p style="color:#334155;line-height:1.7;margin:0 0 24px;">Halo <strong>${name}</strong>,</p>
    <p style="color:#334155;line-height:1.7;margin:0 0 24px;">
      Pembayaran Anda untuk pesanan <strong>#${orderData.order_number}</strong> telah berhasil dikonfirmasi. 
      Produk Anda sudah siap!
    </p>
    
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#16a34a;font-weight:700;font-size:14px;">🎉 ${orderData.product_name} — ${formattedPrice}</p>
      <p style="margin:6px 0 0;color:#15803d;font-size:12px;">Pesanan #${orderData.order_number} · Selesai</p>
    </div>

    ${credentialsBlock}

    <p style="color:#334155;line-height:1.7;margin:24px 0 0;">
      Jika ada pertanyaan, hubungi kami melalui WhatsApp atau buat tiket bantuan di dashboard Anda. 
      Terima kasih telah berbelanja di <strong>${STORE_NAME}</strong>! 🙏
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${STORE_URL}/dashboard.html" style="display:inline-block;background:linear-gradient(135deg,${STORE_COLOR},#ea580c);color:#fff;font-weight:800;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">
        📦 Lihat Pesanan Saya
      </a>
    </div>`;

  await transporter.sendMail({
    from: `"${STORE_NAME}" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `✅ Pembayaran Dikonfirmasi! Pesanan #${orderData.order_number} - ${STORE_NAME}`,
    html: baseTemplate(content, 'Pembayaran Berhasil')
  });
}
