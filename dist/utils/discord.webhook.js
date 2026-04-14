"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDiscordWebhook = sendDiscordWebhook;
exports.buildOrderEmbed = buildOrderEmbed;
exports.buildTicketEmbed = buildTicketEmbed;
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: path_1.default.resolve(__dirname, '..', '..', '.env') });
/**
 * Sends a rich embed message to the configured Discord webhook.
 * Fails silently — will never throw or crash the main app.
 */
async function sendDiscordWebhook(embed) {
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
        await new Promise((resolve, reject) => {
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
            const req = https_1.default.request(options, (res) => {
                // Discord returns 204 No Content on success
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`Discord webhook error: ${res.statusCode}`));
                }
                else {
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
    }
    catch (err) {
        // Log but never crash the main application
        console.warn('⚠️  Discord webhook failed (non-critical):', err.message);
    }
}
/**
 * Pre-built: New Order notification embed
 */
function buildOrderEmbed(order) {
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
function buildTicketEmbed(ticket) {
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
//# sourceMappingURL=discord.webhook.js.map