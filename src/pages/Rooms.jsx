import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';

// Nepal standard pricing (Rs.)
const PRICING = {
    single: { beds: 1, rent: 15000, label: 'Single (1 bed)', icon: '🛏️' },
    double: { beds: 2, rent: 10000, label: 'Double (2 beds)', icon: '🛏️🛏️' },
    triple: { beds: 3, rent: 8000, label: 'Triple (3 beds)', icon: '🛏️🛏️🛏️' },
    quad: { beds: 4, rent: 5000, label: 'Quad (4 beds)', icon: '🛏️🛏️🛏️🛏️' },
};

// Generate room name based on floor
const generateRoomName = (floorNumber, roomIndex) => {
    const prefix = floorNumber === 0 ? 'G' : String(floorNumber);
    return `${prefix}${String(roomIndex + 1).padStart(2, '0')}`;
};

// Get floor display name
const getFloorDisplayName = (floorNumber) => {
    const names = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor',
        'Fourth Floor', 'Fifth Floor', 'Sixth Floor'];
    return names[floorNumber] || `Floor ${floorNumber}`;
};

export default function Rooms() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [filterFloor, setFilterFloor] = useState(searchParams.get('floor') || '');

    const [formData, setFormData] = useState({
        room_number: '',
        floor_id: '',
        room_type: 'double',
        capacity: 2,
        window_count: 1,
        has_attached_toilet: false,
        has_attached_bathroom: false,
        has_balcony: false,
        base_rent: 10000,
        status: 'available',
    });

    const [bulkFormData, setBulkFormData] = useState({
        floor_id: '',
        room_type: 'double',
        count: 4,
        has_attached_toilet: false,
        has_attached_bathroom: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Update filter when URL param changes
        const floorParam = searchParams.get('floor');
        if (floorParam) setFilterFloor(floorParam);
    }, [searchParams]);

    const loadData = async () => {
        try {
            setError('');
            const [roomsData, floorsData] = await Promise.all([
                api.rooms.list(),
                api.floors.list(),
            ]);
            setRooms(roomsData);
            setFloors(floorsData.sort((a, b) => a.floor_number - b.floor_number));
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Backend expects lowercase enum values
            const data = {
                room_number: formData.room_number,
                floor_id: formData.floor_id,
                room_type: formData.room_type.toLowerCase(),
                capacity: formData.capacity,
                window_count: formData.window_count,
                has_attached_toilet: formData.has_attached_toilet,
                has_attached_bathroom: formData.has_attached_bathroom,
                has_balcony: formData.has_balcony,
                base_rent: formData.base_rent,
            };

            if (editingRoom) {
                // Only send status on update, not create
                data.status = formData.status.toLowerCase();
                await api.rooms.update(editingRoom.id, data);
            } else {
                await api.rooms.create(data);
            }
            setShowModal(false);
            setEditingRoom(null);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to save room');
        }
    };

    const handleBulkCreate = async (e) => {
        e.preventDefault();
        try {
            const floor = floors.find(f => f.id === bulkFormData.floor_id);
            if (!floor) throw new Error('Please select a floor');

            const pricing = PRICING[bulkFormData.room_type];
            const existingRoomsOnFloor = rooms.filter(r => r.floor_id === bulkFormData.floor_id);
            const startIndex = existingRoomsOnFloor.length;

            // Create rooms one by one - use lowercase enum values, no status on create
            for (let i = 0; i < bulkFormData.count; i++) {
                const roomData = {
                    room_number: generateRoomName(floor.floor_number, startIndex + i),
                    floor_id: bulkFormData.floor_id,
                    room_type: bulkFormData.room_type.toLowerCase(),
                    capacity: pricing.beds,
                    window_count: 1,
                    has_attached_toilet: bulkFormData.has_attached_toilet,
                    has_attached_bathroom: bulkFormData.has_attached_bathroom,
                    has_balcony: false,
                    base_rent: pricing.rent,
                };
                await api.rooms.create(roomData);
            }

            setShowBulkModal(false);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to create rooms');
        }
    };

    const handleEdit = (room) => {
        setEditingRoom(room);
        setFormData({
            room_number: room.room_number,
            floor_id: room.floor_id,
            room_type: room.room_type.toLowerCase(),
            capacity: room.capacity,
            window_count: room.window_count,
            has_attached_toilet: room.has_attached_toilet,
            has_attached_bathroom: room.has_attached_bathroom || false,
            has_balcony: room.has_balcony || false,
            base_rent: room.base_rent,
            status: room.status.toLowerCase(),
        });
        setShowModal(true);
    };

    const handleDelete = async (room) => {
        if (!confirm(`Delete Room ${room.room_number}? This will also delete all beds.`)) return;
        try {
            await api.rooms.delete(room.id);
            loadData();
        } catch (err) {
            setError(err.message || 'Failed to delete room');
        }
    };

    const handleManageBeds = (room) => {
        navigate(`/beds?room=${room.id}`);
    };

    const openAddModal = () => {
        const floor = floors.find(f => f.id === filterFloor) || floors[0];
        const existingRooms = floor ? rooms.filter(r => r.floor_id === floor.id) : [];
        const nextRoomName = floor ? generateRoomName(floor.floor_number, existingRooms.length) : '';

        setEditingRoom(null);
        setFormData({
            room_number: nextRoomName,
            floor_id: floor?.id || '',
            room_type: 'double',
            capacity: 2,
            window_count: 1,
            has_attached_toilet: false,
            has_attached_bathroom: false,
            has_balcony: false,
            base_rent: PRICING.double.rent,
            status: 'available',
        });
        setShowModal(true);
    };

    const openBulkModal = () => {
        const floor = floors.find(f => f.id === filterFloor) || floors[0];
        setBulkFormData({
            floor_id: floor?.id || '',
            room_type: 'double',
            count: 4,
            has_attached_toilet: false,
            has_attached_bathroom: false,
        });
        setShowBulkModal(true);
    };

    const handleRoomTypeChange = (type) => {
        const pricing = PRICING[type];
        setFormData({
            ...formData,
            room_type: type,
            capacity: pricing.beds,
            base_rent: pricing.rent,
        });
    };

    const getFloorName = (floorId) => {
        const floor = floors.find(f => f.id === floorId);
        if (!floor) return '-';
        return getFloorDisplayName(floor.floor_number);
    };

    const filteredRooms = filterFloor
        ? rooms.filter(r => r.floor_id === filterFloor)
        : rooms;

    const selectedFloor = floors.find(f => f.id === filterFloor);

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">
                        Room Management
                        {selectedFloor && (
                            <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: '8px' }}>
                                - {getFloorDisplayName(selectedFloor.floor_number)}
                            </span>
                        )}
                    </h1>
                    <p className="page-subtitle">Manage rooms and beds with Nepal standard pricing</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={openBulkModal} disabled={floors.length === 0}>
                        Add Multiple Rooms
                    </button>
                    <button className="btn btn-primary" onClick={openAddModal} disabled={floors.length === 0}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        Add Room
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Pricing Guide */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--gray-600)' }}>Standard Pricing (Rs.)</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {Object.entries(PRICING).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                            <span>{val.icon}</span>
                            <span style={{ fontWeight: 500 }}>{val.label}</span>
                            <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Rs. {val.rent.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {floors.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <h3>No Floors Available</h3>
                        <p>Please add floors first before adding rooms</p>
                        <button className="btn btn-primary" onClick={() => navigate('/floors')}>Go to Floors</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="filter-bar" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <select
                            className="form-select"
                            style={{ width: '200px' }}
                            value={filterFloor}
                            onChange={(e) => setFilterFloor(e.target.value)}
                        >
                            <option value="">All Floors ({rooms.length} rooms)</option>
                            {floors.map(floor => {
                                const roomCount = rooms.filter(r => r.floor_id === floor.id).length;
                                return (
                                    <option key={floor.id} value={floor.id}>
                                        {getFloorDisplayName(floor.floor_number)} ({roomCount} rooms)
                                    </option>
                                );
                            })}
                        </select>
                        {filterFloor && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setFilterFloor('')}>
                                Clear Filter
                            </button>
                        )}
                    </div>

                    {filteredRooms.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <h3>No Rooms Found</h3>
                                <p>Add rooms to this floor to get started</p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button className="btn btn-secondary" onClick={openBulkModal}>Add Multiple</button>
                                    <button className="btn btn-primary" onClick={openAddModal}>Add Room</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {filteredRooms.map((room) => (
                                <div key={room.id} className="floor-card">
                                    <div className="floor-card-header">
                                        <h3 className="floor-card-title">Room {room.room_number}</h3>
                                        <span className={`badge ${room.status === 'AVAILABLE' ? 'badge-green' : room.status === 'FULL' ? 'badge-blue' : 'badge-yellow'}`}>
                                            {room.status}
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>{getFloorName(room.floor_id)}</div>
                                        <div style={{ fontSize: '14px', marginTop: '4px' }}>
                                            <strong>{room.room_type}</strong> • {room.capacity} beds
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary-600)', marginTop: '8px' }}>
                                            Rs. {room.base_rent?.toLocaleString() || '0'}/month
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        {room.has_attached_toilet && <span className="badge badge-blue">🚽 Toilet</span>}
                                        {room.has_attached_bathroom && <span className="badge badge-blue">🚿 Bath</span>}
                                        {room.has_balcony && <span className="badge badge-blue">🌅 Balcony</span>}
                                        {room.window_count > 0 && <span className="badge badge-gray">🪟 {room.window_count}</span>}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--gray-200)' }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ flex: 1 }}
                                            onClick={() => handleManageBeds(room)}
                                        >
                                            🛏️ Manage Beds
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(room)}>✏️</button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)' }} onClick={() => handleDelete(room)}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Single Room Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRoom ? 'Edit Room' : 'Add New Room'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Room Number</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., G01, 101"
                                value={formData.room_number}
                                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Floor</label>
                            <select
                                className="form-select"
                                value={formData.floor_id}
                                onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                                required
                            >
                                <option value="">Select Floor</option>
                                {floors.map(floor => (
                                    <option key={floor.id} value={floor.id}>
                                        {getFloorDisplayName(floor.floor_number)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Room Type</label>
                        <div className="room-type-selector">
                            {Object.entries(PRICING).map(([key, val]) => (
                                <div
                                    key={key}
                                    className={`room-type-option ${formData.room_type === key ? 'selected' : ''}`}
                                    onClick={() => handleRoomTypeChange(key)}
                                >
                                    <div className="room-type-icon">{val.icon}</div>
                                    <div className="room-type-name">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                                    <div className="room-type-price">Rs. {val.rent.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Monthly Rent (Rs.)</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.base_rent}
                                onChange={(e) => setFormData({ ...formData, base_rent: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Windows</label>
                            <input
                                type="number"
                                className="form-input"
                                min="0"
                                value={formData.window_count}
                                onChange={(e) => setFormData({ ...formData, window_count: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Features</label>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.has_attached_toilet}
                                    onChange={(e) => setFormData({ ...formData, has_attached_toilet: e.target.checked })}
                                />
                                Attached Toilet
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.has_attached_bathroom}
                                    onChange={(e) => setFormData({ ...formData, has_attached_bathroom: e.target.checked })}
                                />
                                Attached Bathroom
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.has_balcony}
                                    onChange={(e) => setFormData({ ...formData, has_balcony: e.target.checked })}
                                />
                                Balcony
                            </label>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingRoom ? 'Update Room' : 'Add Room'}</button>
                    </div>
                </form>
            </Modal>

            {/* Bulk Create Modal */}
            <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Add Multiple Rooms">
                <form onSubmit={handleBulkCreate}>
                    <div className="form-group">
                        <label className="form-label">Select Floor</label>
                        <select
                            className="form-select"
                            value={bulkFormData.floor_id}
                            onChange={(e) => setBulkFormData({ ...bulkFormData, floor_id: e.target.value })}
                            required
                        >
                            <option value="">Select Floor</option>
                            {floors.map(floor => (
                                <option key={floor.id} value={floor.id}>
                                    {getFloorDisplayName(floor.floor_number)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Room Type</label>
                            <select
                                className="form-select"
                                value={bulkFormData.room_type}
                                onChange={(e) => setBulkFormData({ ...bulkFormData, room_type: e.target.value })}
                            >
                                {Object.entries(PRICING).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label} - Rs. {val.rent.toLocaleString()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Number of Rooms</label>
                            <input
                                type="number"
                                className="form-input"
                                min="1"
                                max="20"
                                value={bulkFormData.count}
                                onChange={(e) => setBulkFormData({ ...bulkFormData, count: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    {bulkFormData.floor_id && (
                        <div className="alert" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', marginTop: '16px' }}>
                            <strong>Preview:</strong> Rooms will be named {(() => {
                                const floor = floors.find(f => f.id === bulkFormData.floor_id);
                                const existing = rooms.filter(r => r.floor_id === bulkFormData.floor_id).length;
                                if (floor) {
                                    const first = generateRoomName(floor.floor_number, existing);
                                    const last = generateRoomName(floor.floor_number, existing + bulkFormData.count - 1);
                                    return `${first} to ${last}`;
                                }
                                return '';
                            })()}
                        </div>
                    )}

                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label">Common Features</label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={bulkFormData.has_attached_toilet}
                                    onChange={(e) => setBulkFormData({ ...bulkFormData, has_attached_toilet: e.target.checked })}
                                />
                                All have Attached Toilet
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={bulkFormData.has_attached_bathroom}
                                    onChange={(e) => setBulkFormData({ ...bulkFormData, has_attached_bathroom: e.target.checked })}
                                />
                                All have Attached Bathroom
                            </label>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create {bulkFormData.count} Rooms</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
