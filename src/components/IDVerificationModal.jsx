import { useState, useRef } from 'react';
import Modal from './Modal';
import { api } from '../api/client';

/**
 * IDVerificationModal - Upload ID card images for verification.
 * Allows uploading front and back photos of ID card.
 */
export default function IDVerificationModal({ isOpen, onClose, student, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const frontInputRef = useRef(null);
    const backInputRef = useRef(null);

    const handleClose = () => {
        setIdFront(null);
        setIdBack(null);
        setError('');
        onClose();
    };

    const handleFileSelect = (e, side) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (JPEG, PNG)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (side === 'front') {
                setIdFront({
                    preview: reader.result,
                    data: reader.result,
                });
            } else {
                setIdBack({
                    preview: reader.result,
                    data: reader.result,
                });
            }
            setError('');
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!idFront || !idBack) {
            setError('Please upload both front and back of the ID card');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await api.students.verifyId(student.id, {
                id_card_front_data: idFront.data,
                id_card_back_data: idBack.data,
            });

            onSuccess?.();
            handleClose();
        } catch (err) {
            console.error('Failed to upload ID:', err);
            setError(err.message || 'Failed to upload ID documents');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Verify ID" size="md">
            <div style={{ padding: '8px 0' }}>
                <p style={{ color: 'var(--gray-600)', marginBottom: '20px' }}>
                    Upload ID card for <strong>{student?.full_name}</strong> to complete verification.
                </p>

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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    {/* ID Front */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            ID Card Front *
                        </label>
                        <input
                            ref={frontInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'front')}
                            style={{ display: 'none' }}
                        />
                        <div
                            onClick={() => frontInputRef.current?.click()}
                            style={{
                                width: '100%',
                                height: '140px',
                                border: idFront ? '2px solid var(--success-400)' : '2px dashed var(--gray-300)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: idFront ? 'transparent' : 'var(--gray-50)',
                                backgroundImage: idFront ? `url(${idFront.preview})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative',
                            }}
                        >
                            {!idFront && (
                                <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>📷</div>
                                    <div style={{ fontSize: '12px' }}>Click to upload</div>
                                </div>
                            )}
                            {idFront && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: 'var(--success-500)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                }}>
                                    ✓
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ID Back */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                            ID Card Back *
                        </label>
                        <input
                            ref={backInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'back')}
                            style={{ display: 'none' }}
                        />
                        <div
                            onClick={() => backInputRef.current?.click()}
                            style={{
                                width: '100%',
                                height: '140px',
                                border: idBack ? '2px solid var(--success-400)' : '2px dashed var(--gray-300)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: idBack ? 'transparent' : 'var(--gray-50)',
                                backgroundImage: idBack ? `url(${idBack.preview})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative',
                            }}
                        >
                            {!idBack && (
                                <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>📷</div>
                                    <div style={{ fontSize: '12px' }}>Click to upload</div>
                                </div>
                            )}
                            {idBack && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: 'var(--success-500)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                }}>
                                    ✓
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--gray-100)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: 'var(--gray-600)'
                }}>
                    <div style={{ marginBottom: '4px' }}>
                        ℹ️ <strong>Accepted documents:</strong>
                    </div>
                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        <li>Citizenship Card</li>
                        <li>National ID</li>
                        <li>Driver's License</li>
                        <li>Student ID Card</li>
                    </ul>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading || !idFront || !idBack}
                    >
                        {loading ? 'Uploading...' : '✓ Verify ID'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
