import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

// ============================================================
// RGS STORE — PDF Invoice Generator v1.0
// Uses: pdfkit
// ============================================================

interface InvoiceData {
  order_number: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  qty: number;
  unit_price: number;
  total_price: number;
  payment_method: string;
  status: string;
  created_at: string | Date;
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const ORANGE = '#f97316';
    const DARK = '#0f172a';
    const GRAY = '#64748b';
    const LIGHT_GRAY = '#f8fafc';

    // Header Block
    doc.rect(0, 0, 595, 100).fill(ORANGE);
    doc.fillColor('#fff')
       .font('Helvetica-Bold')
       .fontSize(24)
       .text('RGS STORE', 50, 30);
    doc.fillColor('rgba(255,255,255,0.85)')
       .font('Helvetica')
       .fontSize(11)
       .text('Marketplace Digital Premium', 50, 58);
    doc.fillColor('#fff')
       .font('Helvetica-Bold')
       .fontSize(30)
       .text('INVOICE', 380, 30, { align: 'right' });
    doc.fillColor('rgba(255,255,255,0.9)')
       .font('Helvetica')
       .fontSize(12)
       .text(`#${data.order_number}`, 380, 65, { align: 'right' });

    doc.fillColor(DARK);

    // Customer Info
    doc.moveDown(4);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(ORANGE).text('TAGIHAN KEPADA:', 50);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text(data.customer_name);
    doc.font('Helvetica').fontSize(10).fillColor(GRAY).text(data.customer_email);

    // Date / Status
    const dateStr = new Date(data.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.font('Helvetica').fontSize(10).fillColor(GRAY)
       .text(`Tanggal: ${dateStr}`, 380, 130, { align: 'right' })
       .text(`Status: ${data.status.toUpperCase()}`, 380, 148, { align: 'right' });

    // Divider
    doc.moveTo(50, 200).lineTo(545, 200).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // Table Header
    doc.rect(50, 210, 495, 28).fill(ORANGE);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10);
    doc.text('PRODUK', 60, 218);
    doc.text('QTY', 340, 218, { width: 60, align: 'center' });
    doc.text('HARGA SATUAN', 400, 218, { width: 90, align: 'right' });
    doc.text('TOTAL', 490, 218, { width: 55, align: 'right' });

    // Table Row
    const rowY = 246;
    doc.rect(50, rowY, 495, 32).fill(LIGHT_GRAY);
    doc.fillColor(DARK).font('Helvetica').fontSize(10);
    doc.text(data.product_name, 60, rowY + 10, { width: 270 });
    doc.text(String(data.qty), 340, rowY + 10, { width: 60, align: 'center' });
    doc.text(formatRupiah(data.unit_price), 400, rowY + 10, { width: 90, align: 'right' });
    doc.font('Helvetica-Bold').text(formatRupiah(data.total_price), 490, rowY + 10, { width: 55, align: 'right' });

    // Total Row
    doc.moveTo(50, 290).lineTo(545, 290).strokeColor('#e2e8f0').stroke();
    doc.rect(380, 300, 165, 36).fill(ORANGE);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(11)
       .text('TOTAL BAYAR', 390, 308)
       .text(formatRupiah(data.total_price), 390, 308, { width: 145, align: 'right' });

    // Payment Method
    doc.fillColor(GRAY).font('Helvetica').fontSize(10)
       .text(`Metode Pembayaran: ${data.payment_method}`, 50, 316);

    // Footer note
    doc.moveTo(50, 360).lineTo(545, 360).strokeColor('#e2e8f0').stroke();
    doc.fillColor(GRAY).font('Helvetica').fontSize(9)
       .text('Terima kasih telah berbelanja di RGS STORE. Invoice ini dibuat secara otomatis oleh sistem.', 50, 368, { align: 'center', width: 495 })
       .text('Garansi: 1×24 jam setelah produk diterima. CS: wa.me/62882016259591', 50, 382, { align: 'center', width: 495 });

    // Watermark LUNAS (Hanya jika status success/shipped)
    if (data.status === 'success' || data.status === 'shipped') {
      doc.save();
      doc.translate(297, 420); // center of A4
      doc.rotate(-45);
      doc.fillColor('rgba(34,197,94,0.15)'); // Green opacity
      doc.font('Helvetica-Bold').fontSize(110);
      doc.text('LUNAS', -250, -55, { align: 'center', width: 500 });
      doc.restore();
    }

    doc.end();
  });
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}
