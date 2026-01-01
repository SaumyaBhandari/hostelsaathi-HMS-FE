import { useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * PaymentHistory component displays a student's payment history in a simple table.
 * Shows individual transactions to track partial payments within a billing cycle.
 */
export default function PaymentHistory({ studentId }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (studentId) {
            loadPayments();
        }
    }, [studentId]);

    const loadPayments = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await api.payments.forStudent(studentId);
            setPayments(data);
        } catch (err) {
            console.error('Failed to load payments:', err);
            setError('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    // Group payments by billing period (month)
    const groupedByMonth = payments.reduce((acc, payment) => {
        const date = new Date(payment.paid_date || payment.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        if (!acc[monthKey]) {
            acc[monthKey] = { label: monthLabel, payments: [], total: 0 };
        }
        acc[monthKey].payments.push(payment);
        acc[monthKey].total += payment.amount || 0;
        return acc;
    }, {});

    const sortedMonths = Object.keys(groupedByMonth).sort().reverse();

    if (loading) {
        return <div style={{ padding: '16px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading payments...</div>;
    }

    if (error) {
        return <div style={{ padding: '16px', color: 'var(--danger-500)' }}>{error}</div>;
    }

    if (payments.length === 0) {
        return (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--gray-500)' }}>
                No payment records found
            </div>
        );
    }

    return (
        <div>
            {sortedMonths.map(monthKey => {
                const group = groupedByMonth[monthKey];
                return (
                    <div key={monthKey} style={{ marginBottom: '16px' }}>
                        {/* Month Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'var(--gray-100)',
                            borderRadius: '6px',
                            marginBottom: '8px',
                        }}>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{group.label}</span>
                            <span style={{ fontWeight: 600, color: 'var(--success-600)', fontSize: '13px' }}>
                                Total: Rs. {group.total.toLocaleString()}
                            </span>
                        </div>

                        {/* Payments Table */}
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--gray-50)' }}>
                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>Date</th>
                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>Type</th>
                                    <th style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>Amount</th>
                                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 500 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.payments.map((payment, idx) => (
                                    <tr
                                        key={payment.id || idx}
                                        style={{ borderBottom: '1px solid var(--gray-100)' }}
                                    >
                                        <td style={{ padding: '8px' }}>
                                            {new Date(payment.paid_date || payment.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>
                                            {payment.payment_type?.replace('_', ' ') || 'Rent'}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--primary-600)' }}>
                                            Rs. {(payment.amount || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <span className={`badge ${payment.status === 'PAID' ? 'badge-green' : 'badge-yellow'}`}
                                                style={{ fontSize: '11px' }}>
                                                {payment.status || 'PAID'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
}
