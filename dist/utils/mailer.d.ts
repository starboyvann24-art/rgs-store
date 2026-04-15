export declare function sendResetPasswordEmail(to: string, name: string, resetUrl: string): Promise<void>;
export declare function sendOrderCreatedEmail(to: string, name: string, orderData: {
    order_number: string;
    product_name: string;
    total_price: number;
    payment_method: string;
    created_at?: string;
}): Promise<void>;
export declare function sendOrderPaidEmail(to: string, name: string, orderData: {
    order_number: string;
    product_name: string;
    total_price: number;
    credentials?: string;
}): Promise<void>;
//# sourceMappingURL=mailer.d.ts.map