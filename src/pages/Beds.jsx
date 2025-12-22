import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function Beds() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [beds, setBeds] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBed, setEditingBed] = useState(null);
    const [filterRoom, setFilterRoom] = useState(searchParams.get('room') || '');
    const [filterStatus, setFilterStatus] = useState('');
    const [formData, setFormData] = useState({
        bed_number: '',
        room_id: '',
        bed_type: 'SINGLE',
        monthly_rent: null,
        status: 'VACANT',
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const roomParam = searchParams.get('room');
        if (roomParam) setFilterRoom(roomParam);
    }, [searchParams]);

    const loadData = async () => {
        try {
            setError('');
            const [bedsData, roomsData, floorsData] = await Promise.all([
                api.beds.list(),
                api.rooms.list(),
                api.floors.list(),
            ]);
            setBeds(bedsData);
            setRooms(roomsData);
            setFloors(floorsData.sort((a, b) => a.floor_number - b.floor_number));
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load beds. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            // Backend expects lowercase enum values
            const data = {
                bed_number: formData.bed_number,
                room_id: formData.room_id,
                bed_type: formData.bed_type.toLowerCase(),
            };
            if (formData.monthly_rent) {
                data.monthly_rent = formData.monthly_rent;
            }

            if (editingBed) {
                // Only send status on update, not create
                data.status = formData.status.toLowerCase();
                await api.beds.update(editingBed.id, data);
            } else {
                await api.beds.create(data);
            }
            setShowModal(false);
            setEditingBed(null);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to save bed');
        }
    };

    const handleEdit = (bed) => {
        setEditingBed(bed);
        setFormData({
            bed_number: bed.bed_number,
            room_id: bed.room_id,
            bed_type: bed.bed_type || 'SINGLE',
            monthly_rent: bed.monthly_rent,
            status: bed.status,
        });
        setShowModal(true);
    };

    const handleDelete = async (bed) => {
        const status = bed.status?.toUpperCase();
        if (status === 'OCCUPIED') {
            setError('Cannot delete an occupied bed. First checkout the student.');
            return;
        }
        if (!confirm(`Delete Bed ${bed.bed_number}? This cannot be undone.`)) return;
        try {
            await api.beds.delete(bed.id);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to delete bed');
        }
    };

    const openAddModal = () => {
        const selectedRoom = rooms.find(r => r.id === filterRoom) || rooms[0];
        const existingBeds = selectedRoom ? beds.filter(b => b.room_id === selectedRoom.id) : [];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const nextLetter = letters[existingBeds.length] || String(existingBeds.length + 1);

        setEditingBed(null);
        setFormData({
            bed_number: nextLetter,
            room_id: selectedRoom?.id || '',
            bed_type: 'SINGLE',
            monthly_rent: null,
            status: 'VACANT',
        });
        setShowModal(true);
    };

    const getRoomInfo = (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return { number: '-', floorName: '-', rent: 0 };
        const floor = floors.find(f => f.id === room.floor_id);
        return {
            number: room.room_number,
            floorName: floor?.floor_name || (floor?.floor_number === 0 ? 'Ground' : `Floor ${floor?.floor_number || '?'}`),
            rent: room.base_rent || 0,
        };
    };

    const getStatusBadge = (status) => {
        const s = status?.toUpperCase();
        const classes = {
            VACANT: 'badge-green',
            OCCUPIED: 'badge-blue',
            RESERVED: 'badge-yellow',
            MAINTENANCE: 'badge-red',
        };
        return classes[s] || 'badge-gray';
    };

    const filteredBeds = beds.filter(bed => {
        if (filterRoom && bed.room_id !== filterRoom) return false;
        if (filterStatus && bed.status?.toUpperCase() !== filterStatus) return false;
        return true;
    });

    const selectedRoom = rooms.find(r => r.id === filterRoom);
    const selectedRoomInfo = selectedRoom ? getRoomInfo(selectedRoom.id) : null;

    // Stats
    const stats = {
        total: beds.length,
        vacant: beds.filter(b => b.status?.toUpperCase() === 'VACANT').length,
        occupied: beds.filter(b => b.status?.toUpperCase() === 'OCCUPIED').length,
        reserved: beds.filter(b => b.status?.toUpperCase() === 'RESERVED').length,
        maintenance: beds.filter(b => b.status?.toUpperCase() === 'MAINTENANCE').length,
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">
                        Bed Management
                        {selectedRoomInfo && (
                            <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: '8px' }}>
                                - Room {selectedRoomInfo.number}
                            </span>
                        )}
                    </h1>
                    <p className="page-subtitle">Track beds and their occupancy (1 bed = 1 person)</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal} disabled={rooms.length === 0}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4v16m8-8H4" />
                    </svg>
                    Add Bed
                </button>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '16px' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--success-600)' }}>{stats.vacant}</div>
                    <div className="stat-label">Vacant Beds</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--primary-600)' }}>{stats.occupied}</div>
                    <div className="stat-label">Occupied Beds</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--warning-600)' }}>{stats.reserved}</div>
                    <div className="stat-label">Reserved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--danger-600)' }}>{stats.maintenance}</div>
                    <div className="stat-label">Under Maintenance</div>
                </div>
            </div>

            {rooms.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <h3>No Rooms Available</h3>
                        <p>Please add rooms first before adding beds</p>
                        <button className="btn btn-primary" onClick={() => navigate('/rooms')}>Go to Rooms</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="filter-bar" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <select
                            className="form-select"
                            style={{ width: '200px' }}
                            value={filterRoom}
                            onChange={(e) => setFilterRoom(e.target.value)}
                        >
                            <option value="">All Rooms ({beds.length} beds)</option>
                            {rooms.map(room => {
                                const roomInfo = getRoomInfo(room.id);
                                const bedCount = beds.filter(b => b.room_id === room.id).length;
                                return (
                                    <option key={room.id} value={room.id}>
                                        Room {room.room_number} ({bedCount} beds)
                                    </option>
                                );
                            })}
                        </select>
                        <select
                            className="form-select"
                            style={{ width: '150px' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="VACANT">🟢 Vacant</option>
                            <option value="OCCUPIED">🔵 Occupied</option>
                            <option value="RESERVED">🟡 Reserved</option>
                            <option value="MAINTENANCE">🔴 Maintenance</option>
                        </select>
                        {(filterRoom || filterStatus) && (
                            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterRoom(''); setFilterStatus(''); }}>
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {filteredBeds.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <h3>No Beds Found</h3>
                                <p>Add beds to this room</p>
                                <button className="btn btn-primary" onClick={openAddModal}>Add Bed</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {filteredBeds.map((bed) => {
                                const roomInfo = getRoomInfo(bed.room_id);
                                const isOccupied = bed.status?.toUpperCase() === 'OCCUPIED';
                                const effectiveRent = bed.monthly_rent || roomInfo.rent;

                                return (
                                    <div key={bed.id} className="floor-card">
                                        <div className="floor-card-header">
                                            <h3 className="floor-card-title">
                                                Room {roomInfo.number} - Bed {bed.bed_number}
                                            </h3>
                                            <span className={`badge ${getStatusBadge(bed.status)}`}>
                                                {bed.status?.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>{roomInfo.floorName}</div>
                                            <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                                <strong>{bed.bed_type?.replace('_', ' ') || 'Single'}</strong>
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary-600)', marginTop: '8px' }}>
                                                Rs. {effectiveRent?.toLocaleString() || '0'}/month
                                            </div>
                                        </div>

                                        {isOccupied && bed.current_student_name && (
                                            <div style={{
                                                background: 'var(--primary-50)',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                marginBottom: '12px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Occupied by</div>
                                                <div style={{ fontWeight: 600 }}>{bed.current_student_name}</div>
                                            </div>
                                        )}

                                        {isOccupied && !bed.current_student_name && (
                                            <div style={{
                                                background: 'var(--primary-50)',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                marginBottom: '12px',
                                                color: 'var(--primary-700)'
                                            }}>
                                                👤 Assigned to a student
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--gray-200)' }}>
                                            {!isOccupied && (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{ flex: 1 }}
                                                    onClick={() => navigate('/students')}
                                                >
                                                    👤 Assign Student
                                                </button>
                                            )}
                                            {isOccupied && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ flex: 1 }}
                                                    onClick={() => navigate('/students')}
                                                >
                                                    View Student
                                                </button>
                                            )}
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(bed)}>✏️</button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: isOccupied ? 'var(--gray-300)' : 'var(--danger-500)' }}
                                                onClick={() => handleDelete(bed)}
                                                disabled={isOccupied}
                                                title={isOccupied ? 'Cannot delete occupied bed' : 'Delete bed'}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBed ? 'Edit Bed' : 'Add New Bed'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Bed Letter/Number</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., A, B, 1, 2"
                                value={formData.bed_number}
                                onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                                required
                            />
                            <small style={{ color: 'var(--gray-500)', fontSize: '12px' }}>
                                Typically A, B, C for shared rooms
                            </small>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Room</label>
                            <select
                                className="form-select"
                                value={formData.room_id}
                                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                                required
                            >
                                <option value="">Select Room</option>
                                {rooms.map(room => (
                                    <option key={room.id} value={room.id}>
                                        Room {room.room_number} (Rs. {room.base_rent?.toLocaleString() || '0'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Bed Type</label>
                            <select
                                className="form-select"
                                value={formData.bed_type}
                                onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                            >
                                <option value="SINGLE">🛏️ Single Bed</option>
                                <option value="BUNK_LOWER">🛏️ Bunk - Lower</option>
                                <option value="BUNK_UPPER">🛏️ Bunk - Upper</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Rent Override (Rs.)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Leave empty to use room rent"
                                value={formData.monthly_rent || ''}
                                onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value ? parseInt(e.target.value) : null })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            disabled={editingBed?.status?.toUpperCase() === 'OCCUPIED'}
                        >
                            <option value="VACANT">🟢 Vacant</option>
                            <option value="RESERVED">🟡 Reserved</option>
                            <option value="MAINTENANCE">🔴 Maintenance</option>
                            {editingBed?.status?.toUpperCase() === 'OCCUPIED' && <option value="OCCUPIED">🔵 Occupied</option>}
                        </select>
                        {editingBed?.status?.toUpperCase() === 'OCCUPIED' && (
                            <small style={{ color: 'var(--warning-600)', fontSize: '12px' }}>
                                Cannot change status of occupied bed. Checkout student first.
                            </small>
                        )}
                    </div>

                    <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingBed ? 'Update Bed' : 'Add Bed'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
