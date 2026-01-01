import { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../api/client';

/**
 * NewPaymentModal - Record monthly or extra payments from Student Profile.
 * 
 * Monthly Payment: 
 * - Shows available billing periods or manual date picker
 * - Allows partial payments for current period
 * - Allows pre-payment for future periods
 * 
 * Extra Payment: Custom amount + reason, doesn't affect due date
 */
export default function NewPaymentModal({ isOpen, onClose, student, onSuccess }) {
    const [paymentType, setPaymentType] = useState(null); // 'monthly' or 'extra'
    const [loading, setLoading] = useState(false);
    const [loadingBilling, setLoadingBilling] = useState(false);
    const [error, setError] = useState('');

    // Billing status from backend
    const [billingStatus, setBillingStatus] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [useCustomDates, setUseCustomDates] = useState(false);
    const [customDates, setCustomDates] = useState({
        start: '',
        end: '',
    });

    // Monthly payment form
    const [monthlyForm, setMonthlyForm] = useState({
        amount: '',
        payment_method: 'cash',
        description: '',
        notes: '',
    });

    // Extra payment form
    const [extraForm, setExtraForm] = useState({
        amount: '',
        description: '',
        payment_method: 'cash',
        notes: '',
    });
    const [documents, setDocuments] = useState([]);

    // Calculate default billing period based on student info
    const calculateDefaultPeriod = () => {
        const today = new Date();
        let startDate;

        if (student?.last_payment_date) {
            startDate = new Date(student.last_payment_date);
            startDate.setDate(startDate.getDate() + 30);
        } else if (student?.admission_date) {
            startDate = new Date(student.admission_date);
            startDate.setDate(startDate.getDate() + 30);
        } else {
            startDate = today;
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);

        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
        };
    };

    // Load billing status when monthly payment is selected
    useEffect(() => {
        if (paymentType === 'monthly' && student?.id) {
            loadBillingStatus();
        }
    }, [paymentType, student?.id]);

    const loadBillingStatus = async () => {
        try {
            setLoadingBilling(true);
            const data = await api.students.getBillingStatus(student.id);
            setBillingStatus(data);

            // Auto-select the first available period
            if (data.available_periods?.length > 0) {
                const firstPeriod = data.available_periods[0];
                setSelectedPeriod(firstPeriod);
                setCustomDates({ start: firstPeriod.start, end: firstPeriod.end });

                // Calculate default amount (remaining for current, full for future)
                const defaultAmount = firstPeriod.is_current && firstPeriod.remaining > 0
                    ? firstPeriod.remaining
                    : data.monthly_rent;

                setMonthlyForm(prev => ({
                    ...prev,
                    amount: String(defaultAmount),
                }));
            } else {
                // No periods from API, use calculated defaults
                const defaults = calculateDefaultPeriod();
                setCustomDates(defaults);
                setUseCustomDates(true);
                setMonthlyForm(prev => ({
                    ...prev,
                    amount: String(student?.monthly_rent || ''),
                }));
            }
        } catch (err) {
            console.error('Failed to load billing status:', err);
            // Fallback to simple mode with date pickers
            const defaults = calculateDefaultPeriod();
            setCustomDates(defaults);
            setUseCustomDates(true);
            setMonthlyForm(prev => ({
                ...prev,
                amount: String(student?.monthly_rent || ''),
            }));
        } finally {
            setLoadingBilling(false);
        }
    };

    const resetForm = () => {
        setPaymentType(null);
        setError('');
        setBillingStatus(null);
        setSelectedPeriod(null);
        setUseCustomDates(false);
        setCustomDates({ start: '', end: '' });
        setMonthlyForm({
            amount: '',
            payment_method: 'cash',
            description: '',
            notes: '',
        });
        setExtraForm({
            amount: '',
            description: '',
            payment_method: 'cash',
            notes: '',
        });
        setDocuments([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handlePeriodSelect = (period) => {
        setSelectedPeriod(period);
        setUseCustomDates(false);
        setCustomDates({ start: period.start, end: period.end });

        // Update amount based on period
        const defaultAmount = period.is_current && period.remaining > 0
            ? period.remaining
            : billingStatus?.monthly_rent || student?.monthly_rent;

        setMonthlyForm(prev => ({
            ...prev,
            amount: String(defaultAmount),
        }));
    };

    const handleCustomDateChange = (field, value) => {
        setUseCustomDates(true);
        setSelectedPeriod(null);

        const newDates = { ...customDates, [field]: value };

        // Auto-calculate end date if start is set (30 days later)
        if (field === 'start' && value) {
            const startDate = new Date(value);
            startDate.setDate(startDate.getDate() + 30);
            newDates.end = startDate.toISOString().split('T')[0];
        }

        setCustomDates(newDates);
    };

    // Handle monthly payment
    const handleMonthlyPayment = async () => {
        const amount = parseFloat(monthlyForm.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        // Get billing period dates
        let billingStart, billingEnd;

        if (useCustomDates || !selectedPeriod) {
            if (!customDates.start) {
                setError('Please select a billing period start date');
                return;
            }
            billingStart = customDates.start;
            billingEnd = customDates.end || customDates.start;
        } else {
            billingStart = selectedPeriod.start;
            billingEnd = selectedPeriod.end;
        }

        try {
            setLoading(true);
            setError('');
            await api.students.recordMonthlyPayment(student.id, {
                amount: amount,
                billing_period_start: billingStart,
                billing_period_end: billingEnd,
                payment_method: monthlyForm.payment_method,
                description: monthlyForm.description || `Monthly rent payment`,
                notes: monthlyForm.notes || null,
            });
            onSuccess?.();
            handleClose();
        } catch (err) {
            console.error('Failed to record monthly payment:', err);
            setError(err.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    // Handle file upload
    const handleDocumentUpload = (e) => {
        const files = Array.from(e.target.files);
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        const validFiles = files.filter(f => validTypes.includes(f.type));

        if (validFiles.length !== files.length) {
            setError('Some files were rejected. Only PDF, PNG, JPEG, DOC, DOCX are allowed.');
        }

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                setDocuments(prev => [...prev, {
                    name: file.name,
                    data: reader.result,
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeDocument = (index) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    // Handle extra payment
    const handleExtraPayment = async () => {
        if (!extraForm.description.trim()) {
            setError('Please enter a reason/description for this payment');
            return;
        }

        const amount = parseFloat(extraForm.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await api.students.recordExtraPayment(student.id, {
                amount: amount,
                description: extraForm.description.trim(),
                payment_method: extraForm.payment_method,
                notes: extraForm.notes || null,
                documents_data: documents.map(d => d.data),
            });

            onSuccess?.();
            handleClose();
        } catch (err) {
            console.error('Failed to record extra payment:', err);
            setError(err.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    // Format date for display
    const formatDateLabel = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="New Payment" size="md">
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

                {/* Payment Type Selection */}
                {!paymentType && (
                    <div>
                        <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
                            Select the type of payment to record for <strong>{student?.full_name}</strong>
                        </p>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            {/* Monthly Payment Card */}
                            <div
                                onClick={() => setPaymentType('monthly')}
                                style={{
                                    flex: 1,
                                    padding: '20px',
                                    border: '2px solid var(--primary-200)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: 'var(--primary-50)',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-500)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--primary-200)'}
                            >
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                                <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>Monthly Payment</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-600)' }}>
                                    Regular monthly rent. Select billing period.
                                </p>
                                <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--primary-600)' }}>
                                    Rs. {Number(student?.monthly_rent || 0).toLocaleString()}
                                </div>
                            </div>

                            {/* Extra Payment Card */}
                            <div
                                onClick={() => setPaymentType('extra')}
                                style={{
                                    flex: 1,
                                    padding: '20px',
                                    border: '2px solid var(--gray-200)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--gray-400)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--gray-200)'}
                            >
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💳</div>
                                <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>Extra Payment</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gray-600)' }}>
                                    Fines, services, or misc charges. Does not affect due date.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Monthly Payment Form */}
                {paymentType === 'monthly' && (
                    <div>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setPaymentType(null)}
                            style={{ marginBottom: '16px' }}
                        >
                            ← Back
                        </button>

                        {loadingBilling ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                Loading billing information...
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '20px', background: 'var(--primary-50)' }}>
                                <h3 style={{ margin: '0 0 16px', color: 'var(--primary-700)' }}>
                                    📅 Monthly Rent Payment
                                </h3>

                                {/* Billing Period Selector */}
                                <div className="form-group">
                                    <label className="form-label">Select Billing Period *</label>

                                    {/* Preset Period Options */}
                                    {billingStatus?.available_periods?.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                            {billingStatus.available_periods.map((period, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handlePeriodSelect(period)}
                                                    style={{
                                                        padding: '12px',
                                                        border: selectedPeriod?.start === period.start && !useCustomDates
                                                            ? '2px solid var(--primary-500)'
                                                            : '1px solid var(--gray-200)',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        background: selectedPeriod?.start === period.start && !useCustomDates
                                                            ? 'white'
                                                            : 'var(--gray-50)',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                                                {period.label}
                                                                {period.is_current && (
                                                                    <span style={{
                                                                        marginLeft: '8px',
                                                                        fontSize: '11px',
                                                                        background: 'var(--warning-100)',
                                                                        color: 'var(--warning-700)',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        Current
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {period.paid > 0 && (
                                                                <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                                                                    Paid: Rs. {period.paid.toLocaleString()}
                                                                    {period.remaining > 0 && (
                                                                        <span style={{ color: 'var(--warning-600)', marginLeft: '8px' }}>
                                                                            • Remaining: Rs. {period.remaining.toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '50%',
                                                            border: selectedPeriod?.start === period.start && !useCustomDates
                                                                ? '5px solid var(--primary-500)'
                                                                : '2px solid var(--gray-300)',
                                                            background: 'white'
                                                        }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Custom Date Option */}
                                    <div
                                        onClick={() => setUseCustomDates(true)}
                                        style={{
                                            padding: '12px',
                                            border: useCustomDates
                                                ? '2px solid var(--primary-500)'
                                                : '1px solid var(--gray-200)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: useCustomDates ? 'white' : 'var(--gray-50)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                                📆 Custom Dates
                                            </div>
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                border: useCustomDates
                                                    ? '5px solid var(--primary-500)'
                                                    : '2px solid var(--gray-300)',
                                                background: 'white'
                                            }} />
                                        </div>

                                        {/* Date Pickers */}
                                        {useCustomDates && (
                                            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
                                                onClick={(e) => e.stopPropagation()}>
                                                <div>
                                                    <label style={{ fontSize: '12px', color: 'var(--gray-600)', display: 'block', marginBottom: '4px' }}>
                                                        Period Start
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        value={customDates.start}
                                                        onChange={(e) => handleCustomDateChange('start', e.target.value)}
                                                        style={{ fontSize: '14px' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '12px', color: 'var(--gray-600)', display: 'block', marginBottom: '4px' }}>
                                                        Period End
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        value={customDates.end}
                                                        onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                                        style={{ fontSize: '14px' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Period Display */}
                                    {(selectedPeriod || (useCustomDates && customDates.start)) && (
                                        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--primary-600)' }}>
                                            ✓ Selected: {useCustomDates
                                                ? `${formatDateLabel(customDates.start)} → ${formatDateLabel(customDates.end)}`
                                                : selectedPeriod?.label}
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="form-group">
                                    <label className="form-label">Amount (Rs.) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={monthlyForm.amount}
                                        onChange={(e) => setMonthlyForm({ ...monthlyForm, amount: e.target.value })}
                                        placeholder={`Standard: Rs. ${student?.monthly_rent || 0}`}
                                        min="0"
                                    />
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setMonthlyForm({
                                                ...monthlyForm,
                                                amount: String(student?.monthly_rent || 0)
                                            })}
                                        >
                                            Full Month
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setMonthlyForm({
                                                ...monthlyForm,
                                                amount: String(Math.round((student?.monthly_rent || 0) / 2))
                                            })}
                                        >
                                            Half
                                        </button>
                                        {selectedPeriod?.remaining > 0 && selectedPeriod?.remaining < (student?.monthly_rent || 0) && (
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setMonthlyForm({
                                                    ...monthlyForm,
                                                    amount: String(selectedPeriod.remaining)
                                                })}
                                            >
                                                Remaining (Rs. {selectedPeriod.remaining.toLocaleString()})
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="form-group">
                                    <label className="form-label">Payment Method</label>
                                    <select
                                        className="form-input"
                                        value={monthlyForm.payment_method}
                                        onChange={(e) => setMonthlyForm({ ...monthlyForm, payment_method: e.target.value })}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="esewa">eSewa</option>
                                        <option value="khalti">Khalti</option>
                                        <option value="fonepay">FonePay</option>
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label className="form-label">Description (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={monthlyForm.description}
                                        onChange={(e) => setMonthlyForm({ ...monthlyForm, description: e.target.value })}
                                        placeholder="e.g., Partial payment, Pre-payment for next month"
                                    />
                                </div>

                                {/* Notes */}
                                <div className="form-group">
                                    <label className="form-label">Remarks (Optional)</label>
                                    <textarea
                                        className="form-input"
                                        value={monthlyForm.notes}
                                        onChange={(e) => setMonthlyForm({ ...monthlyForm, notes: e.target.value })}
                                        placeholder="Additional notes"
                                        rows={2}
                                    />
                                </div>

                                <button
                                    className="btn btn-primary"
                                    onClick={handleMonthlyPayment}
                                    disabled={loading}
                                    style={{ width: '100%' }}
                                >
                                    {loading ? 'Recording...' : `Record Rs. ${Number(monthlyForm.amount || 0).toLocaleString()} Payment`}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Extra Payment Form */}
                {paymentType === 'extra' && (
                    <div>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setPaymentType(null)}
                            style={{ marginBottom: '16px' }}
                        >
                            ← Back
                        </button>

                        <h3 style={{ margin: '0 0 16px' }}>💳 Extra Payment</h3>

                        <div className="form-group">
                            <label className="form-label">Amount (Rs.) *</label>
                            <input
                                type="number"
                                className="form-input"
                                value={extraForm.amount}
                                onChange={(e) => setExtraForm({ ...extraForm, amount: e.target.value })}
                                placeholder="Enter amount"
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reason / Description *</label>
                            <textarea
                                className="form-input"
                                value={extraForm.description}
                                onChange={(e) => setExtraForm({ ...extraForm, description: e.target.value })}
                                placeholder="e.g., Fine for late payment, Extra electricity charges, etc."
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Payment Method</label>
                            <select
                                className="form-input"
                                value={extraForm.payment_method}
                                onChange={(e) => setExtraForm({ ...extraForm, payment_method: e.target.value })}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="esewa">eSewa</option>
                                <option value="khalti">Khalti</option>
                                <option value="fonepay">FonePay</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Supporting Documents (Optional)</label>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                onChange={handleDocumentUpload}
                                style={{ display: 'none' }}
                                id="doc-upload"
                            />
                            <label
                                htmlFor="doc-upload"
                                className="btn btn-secondary btn-sm"
                                style={{ cursor: 'pointer' }}
                            >
                                📎 Upload Documents
                            </label>
                            {documents.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    {documents.map((doc, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px',
                                            background: 'var(--gray-100)',
                                            borderRadius: '4px',
                                            marginBottom: '4px',
                                        }}>
                                            <span style={{ flex: 1, fontSize: '13px' }}>{doc.name}</span>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => removeDocument(i)}
                                                style={{ color: 'var(--danger-500)' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                                Allowed: PDF, PNG, JPEG, DOC, DOCX
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={extraForm.notes}
                                onChange={(e) => setExtraForm({ ...extraForm, notes: e.target.value })}
                                placeholder="Additional notes"
                            />
                        </div>

                        <div style={{
                            background: 'var(--gray-100)',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            color: 'var(--gray-600)'
                        }}>
                            ℹ️ Extra payments do not affect monthly due dates or stay duration.
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleExtraPayment}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            {loading ? 'Recording...' : 'Record Extra Payment'}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
