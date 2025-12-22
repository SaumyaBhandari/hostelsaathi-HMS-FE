import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';

// Floor name mapping
const getFloorDisplayName = (floorNumber) => {
    const names = [
        'Ground Floor', 'First Floor', 'Second Floor', 'Third Floor',
        'Fourth Floor', 'Fifth Floor', 'Sixth Floor', 'Seventh Floor',
        'Eighth Floor', 'Ninth Floor', 'Tenth Floor'
    ];
    return names[floorNumber] || `Floor ${floorNumber}`;
};

// Floor code prefix for room naming
const getFloorPrefix = (floorNumber) => {
    if (floorNumber === 0) return 'G';
    return String(floorNumber);
};

export default function Floors() {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingFloor, setEditingFloor] = useState(null);
    const [formData, setFormData] = useState({
        floor_number: 0,
        floor_name: '',
        total_toilets: 2,
        total_bathrooms: 2,
        has_common_area: false,
    });
    const navigate = useNavigate();

    useEffect(() => {
        loadFloors();
    }, []);

    const loadFloors = async () => {
        try {
            setError('');
            const data = await api.floors.list();
            // Sort by floor number
            const sortedFloors = data.sort((a, b) => a.floor_number - b.floor_number);
            setFloors(sortedFloors);
        } catch (err) {
            console.error('Failed to load floors:', err);
            setError('Failed to load floors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFloor) {
                await api.floors.update(editingFloor.id, formData);
            } else {
                await api.floors.create(formData);
            }
            setShowModal(false);
            setEditingFloor(null);
            resetForm();
            loadFloors();
        } catch (err) {
            setError(err.message || 'Failed to save floor');
        }
    };

    const handleEdit = (floor) => {
        setEditingFloor(floor);
        setFormData({
            floor_number: floor.floor_number,
            floor_name: floor.floor_name || '',
            total_toilets: floor.total_toilets || 2,
            total_bathrooms: floor.total_bathrooms || 2,
            has_common_area: floor.has_common_area || false,
        });
        setShowModal(true);
    };

    const handleManageRooms = (floor) => {
        // Navigate to rooms page with floor filter
        navigate(`/rooms?floor=${floor.id}`);
    };

    const handleDelete = async (floor) => {
        if (!confirm(`Delete ${getFloorDisplayName(floor.floor_number)}? This will also delete all rooms and beds on this floor.`)) return;
        try {
            await api.floors.delete(floor.id);
            loadFloors();
        } catch (err) {
            setError(err.message || 'Failed to delete floor');
        }
    };

    const resetForm = () => {
        setFormData({
            floor_number: floors.length,
            floor_name: '',
            total_toilets: 2,
            total_bathrooms: 2,
            has_common_area: false,
        });
    };

    const openAddModal = () => {
        setEditingFloor(null);
        resetForm();
        setShowModal(true);
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Floor Management</h1>
                    <p className="page-subtitle">Manage building floors and their infrastructure</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4v16m8-8H4" />
                    </svg>
                    Add Floor
                </button>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {floors.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3>No Floors Yet</h3>
                        <p>Floors are auto-created when you register your hostel. You can also add more floors manually.</p>
                        <button className="btn btn-primary" onClick={openAddModal}>Add Floor</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {floors.map((floor) => (
                        <div key={floor.id} className="floor-card">
                            <div className="floor-card-header">
                                <div>
                                    <h3 className="floor-card-title">{getFloorDisplayName(floor.floor_number)}</h3>
                                    {floor.floor_name && floor.floor_name !== getFloorDisplayName(floor.floor_number) && (
                                        <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>{floor.floor_name}</span>
                                    )}
                                </div>
                                <span className="badge badge-blue">
                                    {getFloorPrefix(floor.floor_number)}XX
                                </span>
                            </div>

                            <div className="floor-card-stats">
                                <div>
                                    <span style={{ fontWeight: 600 }}>{floor.rooms?.length || 0}</span> Rooms
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600 }}>{floor.total_toilets}</span> Toilets
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600 }}>{floor.total_bathrooms}</span> Bathrooms
                                </div>
                            </div>

                            {floor.has_common_area && (
                                <div style={{ marginTop: '8px' }}>
                                    <span className="badge badge-green">Has Common Area</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
                                <button
                                    className="btn btn-primary btn-sm"
                                    style={{ flex: 1 }}
                                    onClick={() => handleManageRooms(floor)}
                                >
                                    🚪 Manage Rooms
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(floor)}>
                                    ✏️
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--danger-500)' }}
                                    onClick={() => handleDelete(floor)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingFloor ? 'Edit Floor' : 'Add New Floor'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Floor Number</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.floor_number}
                                onChange={(e) => setFormData({ ...formData, floor_number: parseInt(e.target.value) })}
                                required
                                disabled={editingFloor}
                            />
                            <small style={{ color: 'var(--gray-500)', fontSize: '12px' }}>
                                0 = Ground Floor, 1 = First Floor, etc.
                            </small>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Custom Name (optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Executive Floor"
                                value={formData.floor_name}
                                onChange={(e) => setFormData({ ...formData, floor_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Total Toilets</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.total_toilets}
                                onChange={(e) => setFormData({ ...formData, total_toilets: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Total Bathrooms</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.total_bathrooms}
                                onChange={(e) => setFormData({ ...formData, total_bathrooms: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Common Area</label>
                        <select
                            className="form-select"
                            value={formData.has_common_area ? 'yes' : 'no'}
                            onChange={(e) => setFormData({ ...formData, has_common_area: e.target.value === 'yes' })}
                        >
                            <option value="no">No Common Area</option>
                            <option value="yes">Has Common Area</option>
                        </select>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingFloor ? 'Update Floor' : 'Add Floor'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
