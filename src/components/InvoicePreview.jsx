import { useRef } from 'react';

/**
 * InvoicePreview - Display invoice with Print/PDF/Email options
 * Props:
 *   - invoice: InvoiceData object
 *   - onSendEmail: () => void
 *   - emailLoading: boolean
 */
export default function InvoicePreview({ invoice, onSendEmail, emailLoading }) {
    const invoiceRef = useRef(null);

    const handlePrint = () => {
        const printContent = invoiceRef.current;
        const printWindow = window.open('', '', 'width=800,height=600');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice - ${invoice.invoice_number}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { margin: 0; color: #333; }
                        .header p { color: #666; margin: 5px 0; }
                        .section { margin-bottom: 20px; }
                        .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                        .row { display: flex; justify-content: space-between; margin: 5px 0; }
                        .total { font-size: 18px; font-weight: bold; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; }
                        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                        .status.paid { background: #dcfce7; color: #166534; }
                        .status.pending { background: #fef3c7; color: #a16207; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownloadPDF = () => {
        // For now, use print-to-PDF browser functionality
        // In production, call backend PDF endpoint
        handlePrint();
    };

    if (!invoice) return null;

    const isPaid = invoice.payment_status === 'FULL_PAID';

    return (
        <div>
            {/* Invoice Content */}
            <div
                ref={invoiceRef}
                style={{
                    background: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '16px',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, color: 'var(--primary-600)' }}>🏠 Hostel Saathi</h2>
                    <p style={{ color: 'var(--gray-500)', margin: '4px 0' }}>Admission Invoice</p>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{invoice.invoice_number}</p>
                </div>

                {/* Student Info */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--gray-700)' }}>Student Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                        <div><span style={{ color: 'var(--gray-500)' }}>Name:</span> {invoice.student_name}</div>
                        <div><span style={{ color: 'var(--gray-500)' }}>Phone:</span> {invoice.student_phone}</div>
                        <div><span style={{ color: 'var(--gray-500)' }}>Admission Date:</span> {new Date(invoice.admission_date).toLocaleDateString()}</div>
                        <div><span style={{ color: 'var(--gray-500)' }}>Invoice Date:</span> {new Date(invoice.invoice_date).toLocaleDateString()}</div>
                    </div>
                </div>

                {/* Location */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--gray-700)' }}>Accommodation</div>
                    <div style={{
                        background: 'var(--primary-50)',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                    }}>
                        <div style={{ fontWeight: 500 }}>
                            {invoice.building_name} › {invoice.floor_name} › Room {invoice.room_number} › Bed {invoice.bed_number}
                        </div>
                        <div style={{ color: 'var(--gray-600)', marginTop: '4px', textTransform: 'capitalize' }}>
                            Room Type: {invoice.room_type}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--gray-700)' }}>Charges</div>
                    <div style={{ borderTop: '1px solid var(--gray-200)' }}>
                        {invoice.line_items.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--gray-100)',
                                    fontSize: '14px',
                                }}
                            >
                                <span>{item.description}</span>
                                <span style={{ fontWeight: 500 }}>Rs. {Number(item.amount).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div style={{
                    background: 'var(--gray-50)',
                    padding: '16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Total Amount</span>
                        <span style={{ fontWeight: 600 }}>Rs. {Number(invoice.total_amount).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--success-600)' }}>
                        <span>Amount Paid</span>
                        <span style={{ fontWeight: 500 }}>Rs. {Number(invoice.amount_paid).toLocaleString()}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px dashed var(--gray-300)',
                        fontWeight: 600,
                        fontSize: '16px',
                    }}>
                        <span>Remaining</span>
                        <span style={{ color: invoice.remaining_amount > 0 ? 'var(--danger-500)' : 'var(--success-500)' }}>
                            Rs. {Number(invoice.remaining_amount).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Status Badge */}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: isPaid ? 'var(--success-100)' : 'var(--warning-100)',
                        color: isPaid ? 'var(--success-700)' : 'var(--warning-700)',
                    }}>
                        {isPaid ? '✓ FULLY PAID' : '⏳ PAYMENT PENDING'}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                    className="btn btn-secondary"
                    onClick={handlePrint}
                >
                    🖨️ Print Invoice
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={handleDownloadPDF}
                >
                    📄 Save as PDF
                </button>
                <button
                    className="btn btn-primary"
                    onClick={onSendEmail}
                    disabled={emailLoading}
                >
                    {emailLoading ? '📤 Sending...' : '📧 Send Email'}
                </button>
            </div>
        </div>
    );
}
