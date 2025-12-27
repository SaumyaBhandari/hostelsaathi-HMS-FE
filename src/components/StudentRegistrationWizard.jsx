import { useState, useRef } from 'react';
import Modal from './Modal';
import BedPicker from './BedPicker';
import InvoicePreview from './InvoicePreview';
import WebcamCapture from './WebcamCapture';
import { api } from '../api/client';

const STEPS = [
    { id: 1, title: 'Biodata', icon: '👤' },
    { id: 2, title: 'Bed Selection', icon: '🛏️' },
    { id: 3, title: 'Payment', icon: '💰' },
];

export default function StudentRegistrationWizard({ isOpen, onClose, onComplete }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Draft student ID (returned after step 1)
    const [draftId, setDraftId] = useState(null);

    // Step 1: Biodata
    const [biodata, setBiodata] = useState({
        full_name: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        dietary_preference: 'veg',
        email: '',
        photo_data: null,
        id_card_front_data: null,
        id_card_back_data: null,
    });
    const [showWebcam, setShowWebcam] = useState(false);
    const [webcamTarget, setWebcamTarget] = useState('photo'); // 'photo', 'id_front', 'id_back'

    // Step 2: Bed Selection
    const [selectedBed, setSelectedBed] = useState(null);
    const [bedInfo, setBedInfo] = useState(null);

    // Step 3: Payment
    const [payment, setPayment] = useState({
        amount_paid: '',
        security_deposit: '',
        payment_notes: '',
    });
    const [invoice, setInvoice] = useState(null);
    const [emailLoading, setEmailLoading] = useState(false);

    // File input refs
    const idFrontRef = useRef(null);
    const idBackRef = useRef(null);

    const resetForm = () => {
        setCurrentStep(1);
        setDraftId(null);
        setBiodata({
            full_name: '',
            phone: '',
            date_of_birth: '',
            gender: '',
            dietary_preference: 'veg',
            email: '',
            photo_data: null,
            id_card_front_data: null,
            id_card_back_data: null,
        });
        setSelectedBed(null);
        setBedInfo(null);
        setPayment({ amount_paid: '', security_deposit: '', payment_notes: '' });
        setInvoice(null);
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // --- Step 1 Handlers ---

    const handlePhotoCapture = (imageData) => {
        if (webcamTarget === 'photo') {
            setBiodata({ ...biodata, photo_data: imageData });
        } else if (webcamTarget === 'id_front') {
            setBiodata({ ...biodata, id_card_front_data: imageData });
        } else if (webcamTarget === 'id_back') {
            setBiodata({ ...biodata, id_card_back_data: imageData });
        }
        setShowWebcam(false);
    };

    const handleFileUpload = (e, target) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (target === 'id_front') {
                setBiodata({ ...biodata, id_card_front_data: event.target.result });
            } else if (target === 'id_back') {
                setBiodata({ ...biodata, id_card_back_data: event.target.result });
            }
        };
        reader.readAsDataURL(file);
    };

    const submitStep1 = async () => {
        if (!biodata.full_name || !biodata.phone || !biodata.date_of_birth) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const result = await api.registration.step1(biodata);
            setDraftId(result.draft_id);
            setCurrentStep(2);
        } catch (err) {
            setError(err.message || 'Failed to save biodata');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 2 Handlers ---

    const handleBedSelect = (bedId, info) => {
        setSelectedBed(bedId);
        setBedInfo(info);
    };

    const submitStep2 = async () => {
        if (!selectedBed) {
            setError('Please select a bed');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await api.registration.step2(draftId, { bed_id: selectedBed });
            setCurrentStep(3);
        } catch (err) {
            setError(err.message || 'Failed to assign bed');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 3 Handlers ---

    const submitStep3 = async () => {
        try {
            setLoading(true);
            setError('');

            const paymentData = {
                amount_paid: parseFloat(payment.amount_paid) || 0,
                security_deposit: parseFloat(payment.security_deposit) || 0,
                payment_notes: payment.payment_notes || null,
            };

            const result = await api.registration.step3(draftId, paymentData);
            setInvoice(result.invoice);
        } catch (err) {
            setError(err.message || 'Failed to complete registration');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!invoice) return;

        const email = prompt('Enter email address to send invoice:', biodata.email || '');
        if (!email) return;

        try {
            setEmailLoading(true);
            const result = await api.registration.sendInvoice(invoice.student_id, email);
            alert(result.message);
        } catch (err) {
            alert(err.message || 'Failed to send email');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleFinish = () => {
        if (onComplete) onComplete();
        handleClose();
    };

    // --- Render ---

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="New Student Admission" size="lg">
            {/* Steps Progress */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '24px',
                padding: '16px',
                background: 'var(--gray-50)',
                borderRadius: '8px',
            }}>
                {STEPS.map((step, idx) => (
                    <div
                        key={step.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 600,
                            background: currentStep >= step.id ? 'var(--primary-500)' : 'var(--gray-200)',
                            color: currentStep >= step.id ? 'white' : 'var(--gray-500)',
                            transition: 'all 0.3s',
                        }}>
                            {currentStep > step.id ? '✓' : step.icon}
                        </div>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: currentStep === step.id ? 600 : 400,
                            color: currentStep >= step.id ? 'var(--gray-800)' : 'var(--gray-400)',
                        }}>
                            {step.title}
                        </span>
                        {idx < STEPS.length - 1 && (
                            <div style={{
                                width: '40px',
                                height: '2px',
                                background: currentStep > step.id ? 'var(--primary-500)' : 'var(--gray-200)',
                                margin: '0 8px',
                            }}></div>
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Step 1: Biodata */}
            {currentStep === 1 && (
                <div>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                        {/* Photo */}
                        <div
                            className="photo-preview"
                            onClick={() => { setWebcamTarget('photo'); setShowWebcam(true); }}
                            title="Click to take photo"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '12px',
                                border: '2px dashed var(--gray-300)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: 'var(--gray-50)',
                            }}
                        >
                            {biodata.photo_data ? (
                                <img src={biodata.photo_data} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                                    <div style={{ fontSize: '24px' }}>📷</div>
                                    <small>Photo</small>
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={biodata.full_name}
                                        onChange={(e) => setBiodata({ ...biodata, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={biodata.phone}
                                        onChange={(e) => setBiodata({ ...biodata, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Date of Birth *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={biodata.date_of_birth}
                                onChange={(e) => setBiodata({ ...biodata, date_of_birth: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gender</label>
                            <select
                                className="form-select"
                                value={biodata.gender}
                                onChange={(e) => setBiodata({ ...biodata, gender: e.target.value })}
                            >
                                <option value="">Select (optional)</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dietary Preference *</label>
                            <select
                                className="form-select"
                                value={biodata.dietary_preference}
                                onChange={(e) => setBiodata({ ...biodata, dietary_preference: e.target.value })}
                            >
                                <option value="veg">🥬 Vegetarian</option>
                                <option value="non_veg">🍗 Non-Vegetarian</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email (optional)</label>
                        <input
                            type="email"
                            className="form-input"
                            value={biodata.email}
                            onChange={(e) => setBiodata({ ...biodata, email: e.target.value })}
                            placeholder="For invoice delivery"
                        />
                    </div>

                    {/* ID Card Upload */}
                    <div style={{ marginTop: '24px' }}>
                        <label className="form-label">ID Card Verification (Optional)</label>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '12px' }}>
                            Upload both front and back of student ID card. If skipped, student will be marked as "Unverified".
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {/* Front */}
                            <div
                                style={{
                                    flex: 1,
                                    border: '2px dashed var(--gray-300)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: biodata.id_card_front_data ? 'var(--success-50)' : 'var(--gray-50)',
                                }}
                                onClick={() => idFrontRef.current?.click()}
                            >
                                {biodata.id_card_front_data ? (
                                    <img src={biodata.id_card_front_data} alt="ID Front" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                                ) : (
                                    <>
                                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>🪪</div>
                                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Front Side</div>
                                    </>
                                )}
                                <input
                                    ref={idFrontRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload(e, 'id_front')}
                                />
                            </div>

                            {/* Back */}
                            <div
                                style={{
                                    flex: 1,
                                    border: '2px dashed var(--gray-300)',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: biodata.id_card_back_data ? 'var(--success-50)' : 'var(--gray-50)',
                                }}
                                onClick={() => idBackRef.current?.click()}
                            >
                                {biodata.id_card_back_data ? (
                                    <img src={biodata.id_card_back_data} alt="ID Back" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                                ) : (
                                    <>
                                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>🪪</div>
                                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Back Side</div>
                                    </>
                                )}
                                <input
                                    ref={idBackRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload(e, 'id_back')}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => { setWebcamTarget('id_front'); setShowWebcam(true); }}
                            >
                                📷 Take Front Photo
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => { setWebcamTarget('id_back'); setShowWebcam(true); }}
                            >
                                📷 Take Back Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Bed Selection */}
            {currentStep === 2 && (
                <div>
                    <BedPicker
                        onBedSelect={handleBedSelect}
                        selectedBedId={selectedBed}
                    />

                    {bedInfo && (
                        <div style={{
                            marginTop: '16px',
                            padding: '16px',
                            background: 'var(--primary-50)',
                            borderRadius: '8px',
                            border: '1px solid var(--primary-200)',
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Selected Bed</div>
                            <div style={{ fontSize: '14px' }}>
                                {bedInfo.buildingName} › {bedInfo.floorName} › Room {bedInfo.roomNumber} › Bed {bedInfo.bedNumber}
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600, color: 'var(--primary-600)' }}>
                                Monthly Rent: Rs. {Number(bedInfo.monthlyRent).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && !invoice && (
                <div>
                    {bedInfo && (
                        <div style={{
                            padding: '16px',
                            background: 'var(--gray-50)',
                            borderRadius: '8px',
                            marginBottom: '24px',
                        }}>
                            <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                                <strong>{biodata.full_name}</strong> - {bedInfo.buildingName} › Room {bedInfo.roomNumber} › Bed {bedInfo.bedNumber}
                            </div>
                            <div style={{ marginTop: '8px', fontWeight: 600, color: 'var(--primary-600)' }}>
                                Room Price: Rs. {Number(bedInfo.monthlyRent).toLocaleString()}/month
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Amount Paid (Rs.)</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                placeholder="0"
                                value={payment.amount_paid}
                                onChange={(e) => setPayment({ ...payment, amount_paid: e.target.value })}
                            />
                            <small style={{ color: 'var(--gray-500)' }}>Leave empty or 0 if not paid</small>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Security Deposit (Rs.)</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                placeholder="0 (optional)"
                                value={payment.security_deposit}
                                onChange={(e) => setPayment({ ...payment, security_deposit: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Payment Notes (optional)</label>
                        <textarea
                            className="form-textarea"
                            rows={2}
                            placeholder="Any additional notes..."
                            value={payment.payment_notes}
                            onChange={(e) => setPayment({ ...payment, payment_notes: e.target.value })}
                        />
                    </div>

                    {/* Preview Summary */}
                    <div style={{
                        background: 'var(--gray-50)',
                        padding: '16px',
                        borderRadius: '8px',
                        marginTop: '16px',
                    }}>
                        <h5 style={{ marginBottom: '12px', fontWeight: 600 }}>Payment Summary</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>First Month Rent</span>
                                <span>Rs. {Number(bedInfo?.monthlyRent || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Security Deposit</span>
                                <span>Rs. {Number(payment.security_deposit || 0).toLocaleString()}</span>
                            </div>
                            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--gray-300)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                <span>Total</span>
                                <span>Rs. {(Number(bedInfo?.monthlyRent || 0) + Number(payment.security_deposit || 0)).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-600)' }}>
                                <span>Amount Paid</span>
                                <span>Rs. {Number(payment.amount_paid || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--danger-500)' }}>
                                <span>Remaining</span>
                                <span>Rs. {Math.max(0, (Number(bedInfo?.monthlyRent || 0) + Number(payment.security_deposit || 0)) - Number(payment.amount_paid || 0)).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Invoice Generated */}
            {currentStep === 3 && invoice && (
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '48px' }}>🎉</span>
                        <h3 style={{ margin: '8px 0' }}>Registration Complete!</h3>
                    </div>
                    <InvoicePreview
                        invoice={invoice}
                        onSendEmail={handleSendEmail}
                        emailLoading={emailLoading}
                    />
                </div>
            )}

            {/* Footer Actions */}
            <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    {currentStep > 1 && !invoice && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={loading}
                        >
                            ← Back
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {!invoice && (
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>
                            Cancel
                        </button>
                    )}

                    {currentStep === 1 && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={submitStep1}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Next: Select Bed →'}
                        </button>
                    )}

                    {currentStep === 2 && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={submitStep2}
                            disabled={loading || !selectedBed}
                        >
                            {loading ? 'Saving...' : 'Next: Payment →'}
                        </button>
                    )}

                    {currentStep === 3 && !invoice && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={submitStep3}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Complete Registration ✓'}
                        </button>
                    )}

                    {invoice && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleFinish}
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>

            {/* Webcam Modal */}
            {showWebcam && (
                <WebcamCapture
                    onCapture={handlePhotoCapture}
                    onClose={() => setShowWebcam(false)}
                />
            )}
        </Modal>
    );
}
