import { useState } from 'react';
import Modal from './Modal';
import { api } from '../api/client';

/**
 * CompletePaymentModal - Pay remaining/partial unpaid balance
 */
export default function CompletePaymentModal({ isOpen, onClose, student, remainingAmount, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        amount: '',
        payment_method: 'cash',
        description: '',
        notes: '',
    });

    const resetForm = () => {
        setError('');
        setForm({
            amount: String(remainingAmount || ''),
            payment_method: 'cash',
            description: '',
            notes: '',
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        if (amount > remainingAmount) {
            setError(`Amount cannot exceed remaining balance of Rs. ${remainingAmount.toLocaleString()}`);
            return;
        }

        try {
            setLoading(true);
            setError('');

            await api.students.completePayment(student.id, {
                amount: amount,
                payment_method: form.payment_method,
                description: form.description || 'Remaining balance payment',
                notes: form.notes || null,
            });

            onSuccess?.();
            handleClose();
        } catch (err) {
            console.error('Failed to record payment:', err);
            setError(err.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    // Pre-fill amount when modal opens or remainingAmount changes
    useState(() => {
        if (isOpen && remainingAmount > 0) {
            setForm(prev => ({ ...prev, amount: String(remainingAmount) }));
        }
    }, [isOpen, remainingAmount]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Complete Payment" size="md">
            <div style={{ padding: '8px 0' }}>
                {/* Error Display */}
                {error && (
                    <div style={{
                        background: 'var(--danger-50)',
                        color: 'var(--danger-600)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{
                    background: 'var(--warning-50)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid var(--warning-200)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--warning-700)', fontWeight: 500 }}>
                            ⚠️ Remaining Balance
                        </span>
                        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning-700)' }}>
                            Rs. {Number(remainingAmount || 0).toLocaleString()}
                        </span>
                    </div>
                </div>

                <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
                    Record a payment for <strong>{student?.full_name}</strong> to clear their outstanding balance.
                    You can pay the full amount or a partial amount.
                </p>

                <div className="form-group">
                    <label className="form-label">Amount (Rs.) *</label>
                    <input
                        type="number"
                        className="form-input"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder={`Max: Rs. ${remainingAmount}`}
                        min="0"
                        max={remainingAmount}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setForm({ ...form, amount: String(remainingAmount) })}
                        >
                            Pay Full Amount
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setForm({ ...form, amount: String(Math.round(remainingAmount / 2)) })}
                        >
                            Pay Half
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                        className="form-input"
                        value={form.payment_method}
                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="esewa">eSewa</option>
                        <option value="khalti">Khalti</option>
                        <option value="fonepay">FonePay</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <input
                        type="text"
                        className="form-input"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="e.g., Second installment payment"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea
                        className="form-input"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Additional notes"
                        rows={2}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className="btn btn-secondary" onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Recording...' : `Record Rs. ${Number(form.amount || 0).toLocaleString()} Payment`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
