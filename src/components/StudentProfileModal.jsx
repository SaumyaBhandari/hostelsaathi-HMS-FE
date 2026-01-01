import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import PaymentHistory from './PaymentHistory';
import NewPaymentModal from './NewPaymentModal';
import IDVerificationModal from './IDVerificationModal';
import CompletePaymentModal from './CompletePaymentModal';
import { api } from '../api/client';

const API_BASE = 'http://localhost:8000';

export default function StudentProfileModal({ isOpen, onClose, studentId, onUpdate }) {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'payments', 'edit'
    const [availability, setAvailability] = useState({
        isAway: false,
        expectedReturnDate: '',
    });
    const [editMode, setEditMode] = useState(null); // 'personal', 'academic', etc.
    const [editData, setEditData] = useState({});

    // Modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showIdVerificationModal, setShowIdVerificationModal] = useState(false);
    const [showCompletePaymentModal, setShowCompletePaymentModal] = useState(false);
    const [paymentHistoryKey, setPaymentHistoryKey] = useState(0); // For refreshing payment history
    const [paymentSummary, setPaymentSummary] = useState({ totalPaid: 0, totalDue: 0, remaining: 0 });

    useEffect(() => {
        if (isOpen && studentId) {
            loadStudent();
            setActiveTab('info');
            setEditMode(null);
        }
    }, [isOpen, studentId]);

    const loadStudent = async () => {
        try {
            setLoading(true);
            const data = await api.students.get(studentId);
            setStudent(data);

            // Set initial availability state
            if (data.status === 'ACTIVE' && data.bed_id) {
                try {
                    const bedData = await api.beds.get(data.bed_id);
                    setAvailability({
                        isAway: bedData.status === 'TEMP_AWAY',
                        expectedReturnDate: bedData.expected_return_date || '',
                    });
                } catch (e) {
                    console.error("Failed to load bed details", e);
                }
            }

            // Calculate payment summary (total due vs total paid)
            try {
                const payments = await api.payments.forStudent(studentId);
                const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                const totalDue = (data.monthly_rent || 0) + (data.security_deposit || 0);
                setPaymentSummary({
                    totalPaid,
                    totalDue,
                    remaining: Math.max(0, totalDue - totalPaid),
                });
            } catch (e) {
                console.error("Failed to load payment summary", e);
            }
        } catch (error) {
            console.error("Failed to load student", error);
        } finally {
            setLoading(false);
        }
    };

    const getPhotoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        if (path.startsWith('./')) return `${API_BASE}${path.slice(1)}`;
        return `${API_BASE}${path}`;
    };

    const handleSaveAvailability = async () => {
        if (!student?.bed_id) return;

        try {
            setSaving(true);
            const status = availability.isAway ? 'TEMP_AWAY' : 'OCCUPIED';
            const payload = {
                status: status,
                expected_return_date: availability.isAway ? availability.expectedReturnDate : null
            };

            await api.beds.update(student.bed_id, payload);
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to update availability", error);
            alert("Failed to update availability");
        } finally {
            setSaving(false);
        }
    };

    const handleEditSection = (section) => {
        setEditMode(section);
        setEditData({ ...student });
    };

    const handleSaveEdit = async () => {
        try {
            setSaving(true);
            await api.students.update(studentId, editData);
            await loadStudent();
            setEditMode(null);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to save changes", error);
            alert("Failed to save changes: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        setEditMode(null);
        setEditData({});
    };

    // Calculate next due date
    const getNextDueDate = () => {
        if (student?.last_payment_date) {
            const lastPayment = new Date(student.last_payment_date);
            lastPayment.setDate(lastPayment.getDate() + 30);
            return lastPayment;
        } else if (student?.admission_date) {
            const admission = new Date(student.admission_date);
            admission.setDate(admission.getDate() + 30);
            return admission;
        }
        return null;
    };

    const nextDueDate = getNextDueDate();
    const daysUntilDue = nextDueDate ? Math.ceil((nextDueDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Student Profile" size="lg">
            {loading ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>Loading...</div>
            ) : student ? (
                <div>
                    {/* Header with Photo and Name */}
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'var(--gray-200)', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '3px solid var(--primary-100)'
                        }}>
                            {getPhotoUrl(student.photo_path) ? (
                                <img src={getPhotoUrl(student.photo_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '32px' }}>👤</span>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '20px' }}>{student.full_name}</h3>
                            <div style={{ color: 'var(--gray-600)' }}>{student.course || 'Student'} • {student.college_name || 'Unknown College'}</div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                <span className={`badge ${student.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                                    {student.status?.replace('_', ' ')}
                                </span>
                                {student.id_card_front_path && student.id_card_back_path ? (
                                    <span className="badge badge-green">✓ ID Verified</span>
                                ) : (
                                    <span
                                        className="badge badge-yellow"
                                        onClick={() => setShowIdVerificationModal(true)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to verify ID"
                                    >
                                        ⚠️ ID Unverified - Click to Verify
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', marginBottom: '16px' }}>
                        {['info', 'payments'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '12px 20px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === tab ? '2px solid var(--primary-600)' : '2px solid transparent',
                                    color: activeTab === tab ? 'var(--primary-600)' : 'var(--gray-600)',
                                    fontWeight: activeTab === tab ? 600 : 400,
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                {tab === 'info' ? '📋 Information' : '💰 Payment History'}
                            </button>
                        ))}
                    </div>

                    {/* Info Tab */}
                    {activeTab === 'info' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Personal Information */}
                            <div className="card" style={{ padding: '16px', background: 'var(--gray-50)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--gray-700)' }}>Personal Information</h4>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEditSection('personal')}>
                                        ✏️ Edit
                                    </button>
                                </div>
                                {editMode === 'personal' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Full Name</label>
                                            <input className="form-input" value={editData.full_name || ''}
                                                onChange={e => setEditData({ ...editData, full_name: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Phone</label>
                                            <input className="form-input" value={editData.phone || ''}
                                                onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Email</label>
                                            <input className="form-input" value={editData.email || ''}
                                                onChange={e => setEditData({ ...editData, email: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={saving}>
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        <div>
                                            <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>Phone</label>
                                            <div>{student.phone}</div>
                                        </div>
                                        <div>
                                            <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>Email</label>
                                            <div>{student.email || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>Date of Birth</label>
                                            <div>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>Address</label>
                                            <div>{student.permanent_address || '-'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Room Assignment */}
                            <div className="card" style={{ padding: '16px', border: '1px solid var(--primary-200)', background: 'white' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--primary-700)' }}>🏠 Room Assignment</h4>

                                {student.bed_id ? (
                                    <>
                                        <div style={{ marginBottom: '16px' }}>
                                            {/* Clickable Breadcrumb */}
                                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                                <span
                                                    onClick={() => navigate(`/property?building=${student.building_id}`)}
                                                    style={{ color: 'var(--primary-600)', cursor: 'pointer' }}
                                                >
                                                    {student.building_name || 'Building'}
                                                </span>
                                                <span style={{ color: 'var(--gray-400)', margin: '0 6px' }}>›</span>
                                                <span
                                                    onClick={() => navigate(`/property?floor=${student.floor_id}`)}
                                                    style={{ color: 'var(--primary-600)', cursor: 'pointer' }}
                                                >
                                                    {student.floor_name || `Floor ${student.floor_number}`}
                                                </span>
                                                <span style={{ color: 'var(--gray-400)', margin: '0 6px' }}>›</span>
                                                <span
                                                    onClick={() => navigate(`/property?room=${student.room_id}`)}
                                                    style={{ color: 'var(--primary-600)', cursor: 'pointer' }}
                                                >
                                                    Room {student.room_number}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                                                Bed {student.bed_number || 'A'} • {student.room_type || 'Standard'}
                                            </div>
                                        </div>

                                        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />

                                        {/* Temporarily Away Toggle */}
                                        <div className="form-group" style={{ marginBottom: '8px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={availability.isAway}
                                                    onChange={(e) => setAvailability({ ...availability, isAway: e.target.checked })}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                <span style={{ fontWeight: 500 }}>Temporarily Away</span>
                                            </label>
                                        </div>

                                        {availability.isAway && (
                                            <div className="form-group" style={{ marginLeft: '30px', marginBottom: '8px' }}>
                                                <label className="form-label" style={{ fontSize: '12px' }}>Expected Return</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={availability.expectedReturnDate}
                                                    onChange={(e) => setAvailability({ ...availability, expectedReturnDate: e.target.value })}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        )}

                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={handleSaveAvailability}
                                            disabled={saving}
                                            style={{ marginTop: '8px' }}
                                        >
                                            {saving ? 'Saving...' : 'Update Status'}
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ color: 'var(--gray-500)' }}>No bed assigned</div>
                                )}
                            </div>

                            {/* Payment Summary */}
                            <div className="card" style={{ padding: '16px', background: 'white', border: '1px solid var(--gray-200)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--gray-700)' }}>💰 Payment Summary</h4>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowPaymentModal(true)}
                                    >
                                        + New Payment
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--gray-600)' }}>Monthly Rent</span>
                                        <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                                            Rs. {Number(student.monthly_rent || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--gray-600)' }}>Security Deposit</span>
                                        <span>Rs. {Number(student.security_deposit || 0).toLocaleString()}</span>
                                    </div>
                                    <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--gray-600)' }}>Last Payment</span>
                                        <span>
                                            {student.last_payment_date
                                                ? new Date(student.last_payment_date).toLocaleDateString()
                                                : 'No payments yet'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--gray-600)' }}>Next Due Date</span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: daysUntilDue !== null && daysUntilDue <= 0 ? 'var(--danger-600)'
                                                : daysUntilDue !== null && daysUntilDue <= 7 ? 'var(--warning-600)'
                                                    : 'var(--gray-700)'
                                        }}>
                                            {nextDueDate ? nextDueDate.toLocaleDateString() : '-'}
                                            {daysUntilDue !== null && (
                                                <span style={{ fontSize: '12px', marginLeft: '4px' }}>
                                                    ({daysUntilDue <= 0 ? 'Overdue' : `${daysUntilDue} days`})
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    {/* Remaining Balance Section */}
                                    {paymentSummary.remaining > 0 && (
                                        <>
                                            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--warning-200)' }} />
                                            <div style={{
                                                background: 'var(--warning-50)',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--warning-200)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ color: 'var(--warning-700)', fontWeight: 600 }}>
                                                            ⚠️ Unpaid Balance
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--warning-600)' }}>
                                                            Initial dues not fully paid
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--warning-700)' }}>
                                                            Rs. {paymentSummary.remaining.toLocaleString()}
                                                        </div>
                                                        <button
                                                            className="btn btn-warning btn-sm"
                                                            onClick={() => setShowCompletePaymentModal(true)}
                                                            style={{ marginTop: '4px' }}
                                                        >
                                                            Complete Payment
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Academic Info */}
                            <div className="card" style={{ padding: '16px', background: 'var(--gray-50)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--gray-700)' }}>🎓 Academic Info</h4>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEditSection('academic')}>
                                        ✏️ Edit
                                    </button>
                                </div>
                                {editMode === 'academic' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '12px' }}>College Name</label>
                                            <input className="form-input" value={editData.college_name || ''}
                                                onChange={e => setEditData({ ...editData, college_name: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '12px' }}>Course</label>
                                            <input className="form-input" value={editData.course || ''}
                                                onChange={e => setEditData({ ...editData, course: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={saving}>
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        <div>
                                            <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>College</label>
                                            <div>{student.college_name || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>Course</label>
                                            <div>{student.course || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>Admission Date</label>
                                            <div>{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div>
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowPaymentModal(true)}
                                >
                                    + New Payment
                                </button>
                            </div>
                            <PaymentHistory studentId={studentId} key={paymentHistoryKey} />
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '32px', textAlign: 'center' }}>Student not found</div>
            )}

            {/* New Payment Modal */}
            <NewPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                student={student}
                onSuccess={() => {
                    setPaymentHistoryKey(k => k + 1);
                    loadStudent();
                    if (onUpdate) onUpdate();
                }}
            />

            {/* ID Verification Modal */}
            <IDVerificationModal
                isOpen={showIdVerificationModal}
                onClose={() => setShowIdVerificationModal(false)}
                student={student}
                onSuccess={() => {
                    loadStudent();
                    if (onUpdate) onUpdate();
                }}
            />

            {/* Complete Payment Modal */}
            <CompletePaymentModal
                isOpen={showCompletePaymentModal}
                onClose={() => setShowCompletePaymentModal(false)}
                student={student}
                remainingAmount={paymentSummary.remaining}
                onSuccess={() => {
                    setPaymentHistoryKey(k => k + 1);
                    loadStudent();
                    if (onUpdate) onUpdate();
                }}
            />
        </Modal>
    );
}
