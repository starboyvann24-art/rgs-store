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
export declare function generateInvoicePDF(data: InvoiceData): Promise<Buffer>;
export {};
//# sourceMappingURL=pdf.d.ts.map