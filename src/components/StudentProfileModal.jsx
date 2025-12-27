import { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../api/client';

export default function StudentProfileModal({ isOpen, onClose, studentId, onUpdate }) {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [availability, setAvailability] = useState({
        isAway: false,
        expectedReturnDate: '',
    });

    useEffect(() => {
        if (isOpen && studentId) {
            loadStudent();
        }
    }, [isOpen, studentId]);

    const loadStudent = async () => {
        try {
            setLoading(true);
            const data = await api.students.get(studentId);
            setStudent(data);

            // Set initial availability state
            if (data.status === 'ACTIVE' && data.bed_id) {
                // We need to fetch the bed status to know if they are temp away
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
        } catch (error) {
            console.error("Failed to load student", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAvailability = async () => {
        if (!student?.bed_id) return;

        try {
            setSaving(true);
            const status = availability.isAway ? 'TEMP_AWAY' : 'OCCUPIED';
            const payload = {
                status: status,
                // Only send date if away, otherwise clear it or ignore
                expected_return_date: availability.isAway ? availability.expectedReturnDate : null
            };

            await api.beds.update(student.bed_id, payload);

            if (onUpdate) onUpdate(); // Refresh parent list
            onClose(); // Close modal on success? Or just show success msg?
        } catch (error) {
            console.error("Failed to update availability", error);
            alert("Failed to update availability");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Student Profile" size="lg">
            {loading ? (
                <div className="p-4 text-center">Loading...</div>
            ) : student ? (
                <div>
                    {/* Header with Photo and Name */}
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'var(--gray-200)', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {student.photo_path ? (
                                <img src={student.photo_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '32px' }}>👤</span>
                            )}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '20px' }}>{student.full_name}</h3>
                            <div style={{ color: 'var(--gray-600)' }}>{student.course || 'Student'} • {student.college_name}</div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <span className={`badge ${student.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                                    {student.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Information Section */}
                        <div className="card" style={{ padding: '16px', background: 'var(--gray-50)' }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--gray-700)' }}>Contact Info</h4>
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
                                    <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>Address</label>
                                    <div>{student.permanent_address}</div>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--gray-500)', fontSize: '12px' }}>Guardian</label>
                                    <button className="btn btn-ghost btn-sm" style={{ padding: 0, height: 'auto', color: 'var(--primary-600)' }}>
                                        View Guardians
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Availability Section */}
                        <div className="card" style={{ padding: '16px', border: '1px solid var(--primary-200)', background: 'white' }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--primary-700)' }}>Current Stay Status</h4>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: 500, fontSize: '15px', marginBottom: '4px' }}>
                                    Room {student.room_number || '-'}, Bed {student.bed_number || '-'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                                    Floor {student.floor_number || '-'}
                                </div>
                            </div>

                            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={availability.isAway}
                                        onChange={(e) => setAvailability({ ...availability, isAway: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontWeight: 500 }}>Temporarily Away</span>
                                </label>
                                <small style={{ display: 'block', marginTop: '4px', color: 'var(--gray-500)', marginLeft: '30px' }}>
                                    Mark this if the student is going home or away for few days.
                                </small>
                            </div>

                            {availability.isAway && (
                                <div className="form-group" style={{ marginLeft: '30px' }}>
                                    <label className="form-label">Expected Return Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={availability.expectedReturnDate}
                                        onChange={(e) => setAvailability({ ...availability, expectedReturnDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: '24px', textAlign: 'right' }}>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleSaveAvailability}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center">Student not found</div>
            )}
        </Modal>
    );
}
