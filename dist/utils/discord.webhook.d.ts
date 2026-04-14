interface DiscordEmbed {
    title: string;
    description?: string;
    color?: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
    footer?: {
        text: string;
    };
    timestamp?: string;
}
/**
 * Sends a rich embed message to the configured Discord webhook.
 * Fails silently — will never throw or crash the main app.
 */
export declare function sendDiscordWebhook(embed: DiscordEmbed): Promise<void>;
/**
 * Pre-built: New Order notification embed
 */
export declare function buildOrderEmbed(order: {
    order_number: string;
    product_name: string;
    qty: number;
    total_price: number;
    payment_method: string;
    user_name: string;
    user_email: string;
}): DiscordEmbed;
/**
 * Pre-built: New CS Ticket notification embed
 */
export declare function buildTicketEmbed(ticket: {
    ticket_number: string;
    user_name: string;
    subject: string;
    message: string;
}): DiscordEmbed;
export {};
//# sourceMappingURL=discord.webhook.d.ts.map