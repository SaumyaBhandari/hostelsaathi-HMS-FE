import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';

// Nepal pricing constants
const PRICING = {
    REGISTRATION_FEE: 1000,
    REACTIVATION_FEE: 500,
};

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [formData, setFormData] = useState({
        student_id: '',
        payment_type: 'RENT',
        amount: 0,
        billing_period_start: '',
        billing_period_end: '',
        due_date: '',
        payment_method: 'CASH',
        notes: '',
    });

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        try {
            setError('');
            const params = statusFilter ? { status: statusFilter } : {};
            const [paymentsData, studentsData] = await Promise.all([
                api.payments.list(params),
                api.students.list({ status: 'ACTIVE' }),
            ]);
            setPayments(paymentsData);
            setStudents(studentsData);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load payments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            await api.payments.create({
                ...formData,
                paid_date: new Date().toISOString().split('T')[0],
                status: 'PAID',
            });
            setShowModal(false);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to record payment');
        }
    };

    const handleMarkPaid = async (payment) => {
        try {
            await api.payments.update(payment.id, {
                status: 'PAID',
                paid_date: new Date().toISOString().split('T')[0],
                payment_method: 'CASH',
            });
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to update payment');
        }
    };

    const openAddModal = () => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        const dueDate = new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0];

        const firstStudent = students[0];
        setFormData({
            student_id: firstStudent?.id || '',
            payment_type: 'RENT',
            amount: firstStudent?.monthly_rent || 10000,
            billing_period_start: monthStart,
            billing_period_end: monthEnd,
            due_date: dueDate,
            payment_method: 'CASH',
            notes: '',
        });
        setShowModal(true);
    };

    const handleStudentChange = (studentId) => {
        const student = students.find(s => s.id === studentId);
        setFormData({
            ...formData,
            student_id: studentId,
            amount: student?.monthly_rent || 10000,
        });
    };

    const handlePaymentTypeChange = (type) => {
        let amount = formData.amount;
        if (type === 'REGISTRATION') {
            amount = PRICING.REGISTRATION_FEE;
        } else if (type === 'REACTIVATION') {
            amount = PRICING.REACTIVATION_FEE;
        }
        setFormData({ ...formData, payment_type: type, amount });
    };

    const getStatusBadge = (status) => {
        const classes = {
            PENDING: 'badge-gray',
            pending: 'badge-gray',
            DUE: 'badge-yellow',
            due: 'badge-yellow',
            OVERDUE: 'badge-red',
            overdue: 'badge-red',
            PAID: 'badge-green',
            paid: 'badge-green',
            PARTIAL: 'badge-blue',
            partial: 'badge-blue',
            WAIVED: 'badge-gray',
            waived: 'badge-gray',
        };
        return classes[status] || 'badge-gray';
    };

    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student?.full_name || 'Unknown';
    };

    const getPaymentTypeIcon = (type) => {
        const icons = {
            REGISTRATION: '📋',
            registration: '📋',
            REACTIVATION: '🔄',
            reactivation: '🔄',
            RENT: '🏠',
            rent: '🏠',
            SECURITY_DEPOSIT: '🔒',
            security_deposit: '🔒',
            FOOD: '🍽️',
            food: '🍽️',
            ELECTRICITY: '⚡',
            electricity: '⚡',
            WATER: '💧',
            water: '💧',
            WIFI: '📶',
            wifi: '📶',
            LAUNDRY: '🧺',
            laundry: '🧺',
            PENALTY: '⚠️',
            penalty: '⚠️',
            OTHER: '📝',
            other: '📝',
        };
        return icons[type] || '📝';
    };

    // Calculate summary stats
    const stats = {
        total: payments.length,
        paid: payments.filter(p => p.status === 'PAID' || p.status === 'paid').length,
        due: payments.filter(p => p.status === 'DUE' || p.status === 'due').length,
        overdue: payments.filter(p => p.status === 'OVERDUE' || p.status === 'overdue').length,
        totalAmount: payments.filter(p => p.status === 'PAID' || p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingAmount: payments.filter(p => ['DUE', 'OVERDUE', 'due', 'overdue'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0),
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Payment Management</h1>
                    <p className="page-subtitle">Track and record student payments</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal} disabled={students.length === 0}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4v16m8-8H4" />
                    </svg>
                    Record Payment
                </button>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--success-600)' }}>Rs. {stats.totalAmount.toLocaleString()}</div>
                    <div className="stat-label">Collected ({stats.paid} payments)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--warning-600)' }}>Rs. {stats.pendingAmount.toLocaleString()}</div>
                    <div className="stat-label">Pending ({stats.due + stats.overdue} payments)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.due}</div>
                    <div className="stat-label">Due Payments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--danger-600)' }}>{stats.overdue}</div>
                    <div className="stat-label">Overdue Payments</div>
                </div>
            </div>

            {/* Pricing Reference */}
            <div className="card" style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--gray-50)' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px' }}>
                    <div><strong>📋 Registration Fee:</strong> Rs. {PRICING.REGISTRATION_FEE.toLocaleString()}</div>
                    <div><strong>🔄 Reactivation Fee:</strong> Rs. {PRICING.REACTIVATION_FEE.toLocaleString()}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="tabs">
                    <button className={`tab ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All</button>
                    <button className={`tab ${statusFilter === 'PAID' ? 'active' : ''}`} onClick={() => setStatusFilter('PAID')}>Paid</button>
                    <button className={`tab ${statusFilter === 'DUE' ? 'active' : ''}`} onClick={() => setStatusFilter('DUE')}>Due</button>
                    <button className={`tab ${statusFilter === 'OVERDUE' ? 'active' : ''}`} onClick={() => setStatusFilter('OVERDUE')}>Overdue</button>
                </div>
            </div>

            {payments.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <h3>No Payments Found</h3>
                        <p>Record your first payment to get started</p>
                        {students.length > 0 && (
                            <button className="btn btn-primary" onClick={openAddModal}>Record Payment</button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Period</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th style={{ width: '140px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td style={{ fontWeight: 600 }}>{payment.student_name || getStudentName(payment.student_id)}</td>
                                        <td>
                                            <span className="badge badge-gray">
                                                {getPaymentTypeIcon(payment.payment_type)} {payment.payment_type?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>Rs. {payment.amount?.toLocaleString()}</td>
                                        <td style={{ fontSize: '13px' }}>
                                            {payment.billing_period_start && payment.billing_period_end ? (
                                                <>
                                                    {new Date(payment.billing_period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    {' - '}
                                                    {new Date(payment.billing_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </>
                                            ) : '-'}
                                        </td>
                                        <td>{payment.due_date ? new Date(payment.due_date).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(payment.status)}`}>{payment.status?.replace('_', ' ')}</span>
                                        </td>
                                        <td>
                                            {['DUE', 'OVERDUE', 'PENDING', 'due', 'overdue', 'pending'].includes(payment.status) && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleMarkPaid(payment)}
                                                >
                                                    ✓ Mark Paid
                                                </button>
                                            )}
                                            {(payment.status === 'PAID' || payment.status === 'paid') && (
                                                <span style={{ fontSize: '12px', color: 'var(--success-600)' }}>
                                                    ✓ Paid {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : ''}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Payment">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Student</label>
                        <select
                            className="form-select"
                            value={formData.student_id}
                            onChange={(e) => handleStudentChange(e.target.value)}
                            required
                        >
                            <option value="">Select Student</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.full_name} (Room {student.room_number || '-'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Payment Type</label>
                            <select
                                className="form-select"
                                value={formData.payment_type}
                                onChange={(e) => handlePaymentTypeChange(e.target.value)}
                            >
                                <option value="REGISTRATION">📋 Registration Fee (Rs. {PRICING.REGISTRATION_FEE})</option>
                                <option value="REACTIVATION">🔄 Reactivation Fee (Rs. {PRICING.REACTIVATION_FEE})</option>
                                <option value="RENT">🏠 Monthly Rent</option>
                                <option value="SECURITY_DEPOSIT">🔒 Security Deposit</option>
                                <option value="FOOD">🍽️ Food</option>
                                <option value="ELECTRICITY">⚡ Electricity</option>
                                <option value="WATER">💧 Water</option>
                                <option value="WIFI">📶 WiFi</option>
                                <option value="LAUNDRY">🧺 Laundry</option>
                                <option value="PENALTY">⚠️ Penalty</option>
                                <option value="OTHER">📝 Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Amount (Rs.)</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Period Start</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.billing_period_start}
                                onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Period End</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.billing_period_end}
                                onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Due Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Method</label>
                            <select
                                className="form-select"
                                value={formData.payment_method}
                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                            >
                                <option value="CASH">💵 Cash</option>
                                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                                <option value="CHEQUE">📄 Cheque</option>
                                <option value="ESEWA">📱 eSewa</option>
                                <option value="KHALTI">📱 Khalti</option>
                                <option value="FONEPAY">📱 FonePay</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                            className="form-textarea"
                            rows={2}
                            placeholder="Optional notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Record Payment</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
