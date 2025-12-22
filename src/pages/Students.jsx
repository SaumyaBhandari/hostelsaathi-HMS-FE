import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import WebcamCapture from '../components/WebcamCapture';

// Nepal pricing constants
const PRICING = {
    REGISTRATION_FEE: 1000,
    REACTIVATION_FEE: 500,
};

export default function Students() {
    const [students, setStudents] = useState([]);
    const [vacantBeds, setVacantBeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showWebcam, setShowWebcam] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        gender: 'MALE',
        blood_group: '',
        permanent_address: '',
        college_name: '',
        course: '',
        bed_id: '',
        admission_date: new Date().toISOString().split('T')[0],
        monthly_rent: 10000,
        security_deposit: 5000,
        dietary_preference: 'veg',
        photo_data: null, // Base64 image from webcam
    });

    const [checkoutData, setCheckoutData] = useState({
        checkout_date: new Date().toISOString().split('T')[0],
        refund_deposit: true,
    });

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [studentsData, bedsData] = await Promise.all([
                api.students.list({ status: statusFilter }),
                api.beds.vacant(),
            ]);
            setStudents(studentsData);
            setVacantBeds(bedsData);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            // Build data with only fields the backend expects
            const data = {
                full_name: formData.full_name,
                phone: formData.phone,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender.toLowerCase(),
                permanent_address: formData.permanent_address,
                college_name: formData.college_name || 'Not specified', // Required field
                bed_id: formData.bed_id,
                admission_date: formData.admission_date,
                monthly_rent: formData.monthly_rent,
                security_deposit: formData.security_deposit,
            };

            // Only add optional fields if they have values
            if (formData.email && formData.email.trim()) {
                data.email = formData.email;
            }
            if (formData.blood_group && formData.blood_group.trim()) {
                data.blood_group = formData.blood_group;
            }
            if (formData.course && formData.course.trim()) {
                data.course = formData.course;
            }

            await api.students.create(data);
            setShowModal(false);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to create admission');
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        try {
            await api.students.checkout(selectedStudent.id, checkoutData);
            setShowCheckoutModal(false);
            setSelectedStudent(null);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to checkout student');
        }
    };

    const handlePhotoCapture = (imageData) => {
        setFormData({ ...formData, photo_data: imageData });
        setShowWebcam(false);
    };

    const openAddModal = () => {
        const selectedBed = vacantBeds[0];
        setFormData({
            full_name: '',
            phone: '',
            email: '',
            date_of_birth: '',
            gender: 'MALE',
            blood_group: '',
            permanent_address: '',
            college_name: '',
            course: '',
            bed_id: selectedBed?.id || '',
            admission_date: new Date().toISOString().split('T')[0],
            monthly_rent: selectedBed?.monthly_rent || selectedBed?.room_base_rent || 10000,
            security_deposit: 5000,
            dietary_preference: 'veg',
            photo_data: null,
        });
        setShowModal(true);
    };

    const openCheckoutModal = (student) => {
        setSelectedStudent(student);
        setCheckoutData({
            checkout_date: new Date().toISOString().split('T')[0],
            refund_deposit: true,
        });
        setShowCheckoutModal(true);
    };

    const handleBedChange = (bedId) => {
        const bed = vacantBeds.find(b => b.id === bedId);
        setFormData({
            ...formData,
            bed_id: bedId,
            monthly_rent: bed?.monthly_rent || bed?.room_base_rent || 10000,
        });
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery)
    );

    const getPaymentStatus = (student) => {
        if (!student.registration_expires_at) return 'pending';
        const expiryDate = new Date(student.registration_expires_at);
        const today = new Date();
        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) return 'expired';
        if (daysLeft < 30) return 'warning';
        return 'paid';
    };

    const getPaymentBadgeClass = (status) => {
        const classes = {
            paid: 'payment-badge paid',
            pending: 'payment-badge pending',
            warning: 'payment-badge pending',
            expired: 'payment-badge expired',
        };
        return classes[status] || 'payment-badge pending';
    };

    const getStatusBadge = (status) => {
        const classes = {
            ACTIVE: 'badge-green',
            active: 'badge-green',
            CHECKED_OUT: 'badge-gray',
            checked_out: 'badge-gray',
            SUSPENDED: 'badge-red',
            suspended: 'badge-red',
            PENDING_ADMISSION: 'badge-yellow',
            pending_admission: 'badge-yellow',
        };
        return classes[status] || 'badge-gray';
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Student Management</h1>
                    <p className="page-subtitle">Manage admissions, student records, and checkouts</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal} disabled={vacantBeds.length === 0}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4v16m8-8H4" />
                    </svg>
                    New Admission
                </button>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Registration Fee Note */}
            <div className="card" style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--primary-50)' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px' }}>
                    <div><strong>Registration Fee:</strong> Rs. {PRICING.REGISTRATION_FEE.toLocaleString()}</div>
                    <div><strong>Reactivation Fee:</strong> Rs. {PRICING.REACTIVATION_FEE.toLocaleString()}</div>
                    <div><strong>Registration Valid:</strong> 1 Year from admission</div>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="tabs">
                    <button className={`tab ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>
                        Active
                    </button>
                    <button className={`tab ${statusFilter === 'checked_out' ? 'active' : ''}`} onClick={() => setStatusFilter('checked_out')}>
                        Checked Out
                    </button>
                    <button className={`tab ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>
                        All
                    </button>
                </div>
            </div>

            {vacantBeds.length === 0 && statusFilter === 'active' && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    No vacant beds available. Add more beds or checkout students to admit new students.
                </div>
            )}

            {filteredStudents.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3>No Students Found</h3>
                        <p>{statusFilter === 'active' ? 'Start by admitting your first student' : 'No students match your search'}</p>
                        {vacantBeds.length > 0 && (
                            <button className="btn btn-primary" onClick={openAddModal}>New Admission</button>
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
                                    <th>Location</th>
                                    <th>Payment Status</th>
                                    <th>Rent</th>
                                    <th>Diet</th>
                                    <th>Admission</th>
                                    <th>Status</th>
                                    <th style={{ width: '120px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => {
                                    const paymentStatus = getPaymentStatus(student);
                                    return (
                                        <tr key={student.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: 'var(--gray-200)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {student.photo_path ? (
                                                            <img src={student.photo_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <span style={{ fontSize: '16px' }}>👤</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{student.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {student.room_number ? (
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>Room {student.room_number}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Bed {student.bed_number || 'A'}</div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--gray-400)' }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={getPaymentBadgeClass(paymentStatus)}>
                                                    {paymentStatus === 'paid' && '✓ Paid'}
                                                    {paymentStatus === 'pending' && '⏳ Pending'}
                                                    {paymentStatus === 'warning' && '⚠️ Due Soon'}
                                                    {paymentStatus === 'expired' && '❌ Expired'}
                                                </span>
                                                {student.last_payment_date && (
                                                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                                                        Last: {new Date(student.last_payment_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                                                    Rs. {student.monthly_rent?.toLocaleString() || '0'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                                                    {student.dietary_preference === 'veg' ? '🥬' : '🍗'} {student.dietary_preference || 'Veg'}
                                                </span>
                                            </td>
                                            <td>{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(student.status)}`}>
                                                    {student.status?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {(student.status === 'ACTIVE' || student.status === 'active') && (
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            style={{ color: 'var(--danger-500)' }}
                                                            onClick={() => openCheckoutModal(student)}
                                                        >
                                                            Checkout
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Admission Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Student Admission" size="lg">
                <form onSubmit={handleSubmit}>
                    {/* Photo Section */}
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                        <div
                            className="photo-preview"
                            onClick={() => setShowWebcam(true)}
                            title="Click to take photo"
                        >
                            {formData.photo_data ? (
                                <img src={formData.photo_data} alt="Student" />
                            ) : (
                                <div className="photo-preview-placeholder">
                                    <span>📷</span>
                                    <small>Take Photo</small>
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: '16px', color: 'var(--gray-600)', fontSize: '14px', fontWeight: 600 }}>Personal Information</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date of Birth *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Gender *</label>
                            <select
                                className="form-select"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Blood Group</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., A+, B-, O+"
                                value={formData.blood_group}
                                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dietary Preference *</label>
                            <select
                                className="form-select"
                                value={formData.dietary_preference}
                                onChange={(e) => setFormData({ ...formData, dietary_preference: e.target.value })}
                            >
                                <option value="veg">🥬 Vegetarian</option>
                                <option value="non_veg">🍗 Non-Vegetarian</option>
                                <option value="eggetarian">🥚 Eggetarian</option>
                                <option value="vegan">🌱 Vegan</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Permanent Address *</label>
                        <textarea
                            className="form-textarea"
                            rows={2}
                            value={formData.permanent_address}
                            onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                            required
                        />
                    </div>

                    <h4 style={{ margin: '24px 0 16px', color: 'var(--gray-600)', fontSize: '14px', fontWeight: 600 }}>Academic Information</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">College/University *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.college_name}
                                onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Course</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., B.Tech, MBBS"
                                value={formData.course}
                                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                            />
                        </div>
                    </div>

                    <h4 style={{ margin: '24px 0 16px', color: 'var(--gray-600)', fontSize: '14px', fontWeight: 600 }}>Accommodation Details</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Select Bed *</label>
                            <select
                                className="form-select"
                                value={formData.bed_id}
                                onChange={(e) => handleBedChange(e.target.value)}
                                required
                            >
                                <option value="">Select a vacant bed</option>
                                {vacantBeds.map(bed => (
                                    <option key={bed.id} value={bed.id}>
                                        Room {bed.room_number} - Bed {bed.bed_number} (Rs. {bed.monthly_rent || bed.room_base_rent}/month)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Admission Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.admission_date}
                                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Monthly Rent (Rs.) *</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.monthly_rent}
                                onChange={(e) => setFormData({ ...formData, monthly_rent: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Security Deposit (Rs.) *</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.security_deposit}
                                onChange={(e) => setFormData({ ...formData, security_deposit: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                        <h5 style={{ marginBottom: '12px', fontWeight: 600 }}>Payment Summary</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Registration Fee (one-time)</span>
                                <span>Rs. {PRICING.REGISTRATION_FEE.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>First Month Rent</span>
                                <span>Rs. {formData.monthly_rent.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Security Deposit</span>
                                <span>Rs. {formData.security_deposit.toLocaleString()}</span>
                            </div>
                            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--gray-300)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '16px' }}>
                                <span>Total Due on Admission</span>
                                <span style={{ color: 'var(--primary-600)' }}>
                                    Rs. {(PRICING.REGISTRATION_FEE + formData.monthly_rent + formData.security_deposit).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Complete Admission</button>
                    </div>
                </form>
            </Modal>

            {/* Webcam Modal */}
            {showWebcam && (
                <WebcamCapture
                    onCapture={handlePhotoCapture}
                    onClose={() => setShowWebcam(false)}
                />
            )}

            {/* Checkout Modal */}
            <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Student Checkout">
                <form onSubmit={handleCheckout}>
                    <p style={{ marginBottom: '16px', color: 'var(--gray-600)' }}>
                        Checking out: <strong>{selectedStudent?.full_name}</strong>
                    </p>

                    <div className="form-group">
                        <label className="form-label">Checkout Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={checkoutData.checkout_date}
                            onChange={(e) => setCheckoutData({ ...checkoutData, checkout_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={checkoutData.refund_deposit}
                                onChange={(e) => setCheckoutData({ ...checkoutData, refund_deposit: e.target.checked })}
                            />
                            Refund security deposit (Rs. {selectedStudent?.security_deposit?.toLocaleString()})
                        </label>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-danger">Confirm Checkout</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
