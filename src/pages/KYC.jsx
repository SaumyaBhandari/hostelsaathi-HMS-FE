import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function KYC() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDING');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await api.students.list({ status: 'ACTIVE' });
            setStudents(data);
        } catch (err) {
            console.error('Failed to load students:', err);
        } finally {
            setLoading(false);
        }
    };

    // For now, simulate KYC status since we don't have a direct endpoint
    // In a real implementation, you'd fetch KYC status for each student
    const getKYCStatus = (student) => {
        // Simulated - would be from actual API
        return 'PENDING';
    };

    const handleVerify = async (studentId) => {
        try {
            await api.students.kyc.verify(studentId);
            loadData();
            alert('KYC Verified successfully!');
        } catch (err) {
            alert(err.message || 'Failed to verify KYC');
        }
    };

    const handleReject = async (studentId) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await api.students.kyc.reject(studentId, reason);
            loadData();
            alert('KYC Rejected');
        } catch (err) {
            alert(err.message || 'Failed to reject KYC');
        }
    };

    const getStatusBadge = (status) => {
        const classes = {
            PENDING: 'badge-yellow',
            VERIFIED: 'badge-green',
            REJECTED: 'badge-red',
            EXPIRED: 'badge-gray',
        };
        return classes[status] || 'badge-gray';
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">KYC Verification</h1>
                <p className="page-subtitle">Manage student identity verification documents</p>
            </div>

            <div className="tabs" style={{ marginBottom: '24px' }}>
                <button
                    className={`tab ${activeTab === 'PENDING' ? 'active' : ''}`}
                    onClick={() => setActiveTab('PENDING')}
                >
                    Pending Verification
                </button>
                <button
                    className={`tab ${activeTab === 'VERIFIED' ? 'active' : ''}`}
                    onClick={() => setActiveTab('VERIFIED')}
                >
                    Verified
                </button>
                <button
                    className={`tab ${activeTab === 'ALL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ALL')}
                >
                    All Students
                </button>
            </div>

            {students.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        <h3>No Students Found</h3>
                        <p>Add students to manage their KYC verification</p>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Phone</th>
                                    <th>Room</th>
                                    <th>Document Type</th>
                                    <th>Status</th>
                                    <th style={{ width: '150px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                                                    Admitted: {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{student.phone}</td>
                                        <td>
                                            {student.room_number ? `Room ${student.room_number}` : '-'}
                                        </td>
                                        <td>
                                            <span className="badge badge-gray">Citizenship</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadge('PENDING')}`}>PENDING</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleVerify(student.id)}
                                                >
                                                    Verify
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: 'var(--danger-500)' }}
                                                    onClick={() => handleReject(student.id)}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Information Card */}
            <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header">
                    <h3 className="card-title">KYC Document Types</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                            <strong>Citizenship</strong>
                            <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>Nepal citizenship card</p>
                        </div>
                        <div>
                            <strong>Passport</strong>
                            <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>Valid passport</p>
                        </div>
                        <div>
                            <strong>College ID</strong>
                            <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>College/University ID card</p>
                        </div>
                        <div>
                            <strong>National ID</strong>
                            <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>National ID card</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
