import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Modal from '../components/Modal';

// Status color mapping
const getStatusColor = (vacantBeds, totalBeds) => {
    if (totalBeds === 0) return 'var(--gray-400)';
    if (vacantBeds === 0) return 'var(--danger-500)';
    if (vacantBeds <= 2) return 'var(--warning-500)';
    return 'var(--success-500)';
};

const getStatusLabel = (vacantBeds, totalBeds) => {
    if (totalBeds === 0) return 'No beds';
    if (vacantBeds === 0) return 'Full';
    if (vacantBeds <= 2) return 'Nearly Full';
    return 'Available';
};

// Bed status colors
const BED_COLORS = {
    vacant: 'var(--success-500)',
    occupied: 'var(--danger-500)',
    temp_away: 'var(--purple-500, #9333ea)',
    reserved: 'var(--warning-500)',
    maintenance: 'var(--gray-400)',
};

// Floor name helper
const getFloorDisplayName = (floorNumber) => {
    const names = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor',
        'Fourth Floor', 'Fifth Floor', 'Sixth Floor'];
    return names[floorNumber] || `Floor ${floorNumber}`;
};

export default function Property() {
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBuildings, setExpandedBuildings] = useState({});
    const [expandedFloors, setExpandedFloors] = useState({});
    const [showBuildingModal, setShowBuildingModal] = useState(false);
    const [buildingForm, setBuildingForm] = useState({ name: '', code: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [buildingsData, floorsData, roomsData] = await Promise.all([
                api.buildings.list().catch(() => []), // Handle if buildings endpoint not ready
                api.floors.list(),
                api.rooms.list(),
            ]);
            setBuildings(buildingsData);
            setFloors(floorsData.sort((a, b) => a.floor_number - b.floor_number));
            setRooms(roomsData);

            // Auto-expand first building if any
            if (buildingsData.length > 0) {
                setExpandedBuildings({ [buildingsData[0].id]: true });
            }
        } catch (err) {
            console.error('Failed to load property data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleBuilding = (buildingId) => {
        setExpandedBuildings(prev => ({
            ...prev,
            [buildingId]: !prev[buildingId]
        }));
    };

    const toggleFloor = (floorId) => {
        setExpandedFloors(prev => ({
            ...prev,
            [floorId]: !prev[floorId]
        }));
    };

    const handleCreateBuilding = async (e) => {
        e.preventDefault();
        try {
            await api.buildings.create(buildingForm);
            setShowBuildingModal(false);
            setBuildingForm({ name: '', code: '' });
            loadData();
        } catch (err) {
            alert(err.message || 'Failed to create building');
        }
    };

    // Get floors for a building (or floors without building for default)
    const getFloorsForBuilding = (buildingId) => {
        if (buildingId) {
            return floors.filter(f => f.building_id === buildingId);
        }
        // Floors without building (legacy)
        return floors.filter(f => !f.building_id);
    };

    // Get rooms for a floor
    const getRoomsForFloor = (floorId) => {
        return rooms.filter(r => r.floor_id === floorId);
    };

    // Calculate stats for a floor
    const getFloorStats = (floorId) => {
        const floorRooms = getRoomsForFloor(floorId);
        const totalBeds = floorRooms.reduce((sum, r) => sum + (r.beds?.length || r.capacity || 0), 0);
        const occupiedBeds = floorRooms.reduce((sum, r) => {
            const beds = r.beds || [];
            return sum + beds.filter(b => b.status === 'OCCUPIED' || b.status === 'occupied').length;
        }, 0);
        return { totalRooms: floorRooms.length, totalBeds, occupiedBeds, vacantBeds: totalBeds - occupiedBeds };
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    // If no buildings exist, show floors directly (legacy mode)
    const hasBuildings = buildings.length > 0;
    const legacyFloors = floors.filter(f => !f.building_id);

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">🏢 Property Overview</h1>
                    <p className="page-subtitle">
                        Unified view of buildings, floors, rooms and bed availability
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowBuildingModal(true)}>
                    + Add Building
                </button>
            </div>

            {/* Color Legend */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--gray-600)' }}>Bed Status:</strong>
                    {Object.entries(BED_COLORS).map(([status, color]) => (
                        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
                            <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Buildings List */}
            {hasBuildings ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {buildings.map(building => (
                        <div key={building.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Building Header */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    background: 'var(--gray-50)',
                                    cursor: 'pointer',
                                    borderBottom: expandedBuildings[building.id] ? '1px solid var(--gray-200)' : 'none',
                                }}
                                onClick={() => toggleBuilding(building.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '18px', transition: 'transform 0.2s', transform: expandedBuildings[building.id] ? 'rotate(90deg)' : 'rotate(0)' }}>
                                        ▶
                                    </span>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                                            {building.name}
                                        </h3>
                                        <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                                            Code: {building.code} • {building.floor_count || 0} floors • {building.room_count || 0} rooms
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        background: getStatusColor(building.vacant_beds || 0, building.bed_count || 0),
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                    }}>
                                        {building.vacant_beds || 0} / {building.bed_count || 0} beds
                                    </div>
                                </div>
                            </div>

                            {/* Building Content - Floors */}
                            {expandedBuildings[building.id] && (
                                <div style={{ padding: '16px 20px' }}>
                                    {getFloorsForBuilding(building.id).length === 0 ? (
                                        <div style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '20px' }}>
                                            No floors in this building.{' '}
                                            <Link to={`/floors?building=${building.id}`}>Add floors →</Link>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {getFloorsForBuilding(building.id).map(floor => {
                                                    const stats = getFloorStats(floor.id);
                                                    return (
                                                        <FloorRow
                                                            key={floor.id}
                                                            floor={floor}
                                                            stats={stats}
                                                            rooms={getRoomsForFloor(floor.id)}
                                                            expanded={expandedFloors[floor.id]}
                                                            onToggle={() => toggleFloor(floor.id)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                                <Link to={`/floors?building=${building.id}`} className="btn btn-ghost btn-sm">
                                                    + Add Floor to {building.name}
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Legacy Floors (no building) */}
            {legacyFloors.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: hasBuildings ? '24px' : 0 }}>
                    <div style={{ padding: '16px 20px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                            {hasBuildings ? 'Unassigned Floors' : 'All Floors'}
                        </h3>
                        <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                            {legacyFloors.length} floors • {rooms.length} rooms total
                        </span>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {legacyFloors.map(floor => {
                                const stats = getFloorStats(floor.id);
                                return (
                                    <FloorRow
                                        key={floor.id}
                                        floor={floor}
                                        stats={stats}
                                        rooms={getRoomsForFloor(floor.id)}
                                        expanded={expandedFloors[floor.id]}
                                        onToggle={() => toggleFloor(floor.id)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Building Modal */}
            <Modal isOpen={showBuildingModal} onClose={() => setShowBuildingModal(false)} title="Add Building">
                <form onSubmit={handleCreateBuilding}>
                    <div className="form-group">
                        <label className="form-label">Building Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Main Building, Block A"
                            value={buildingForm.name}
                            onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Code</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., A, MAIN, B1"
                            value={buildingForm.code}
                            onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value.toUpperCase() })}
                            required
                            maxLength={10}
                        />
                        <small className="form-hint">Short code for identification</small>
                    </div>
                    <div className="modal-footer" style={{ marginTop: '24px', padding: 0, border: 'none' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowBuildingModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Add Building</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

// Floor Row Component
function FloorRow({ floor, stats, rooms, expanded, onToggle }) {
    return (
        <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Floor Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'white',
                    cursor: 'pointer',
                }}
                onClick={onToggle}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--gray-400)', fontSize: '12px', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}>
                        ▶
                    </span>
                    <span style={{ fontWeight: 500 }}>{getFloorDisplayName(floor.floor_number)}</span>
                    <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                        {stats.totalRooms} rooms
                    </span>
                </div>
                <div style={{
                    padding: '2px 10px',
                    borderRadius: '10px',
                    background: getStatusColor(stats.vacantBeds, stats.totalBeds),
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 500,
                }}>
                    {stats.vacantBeds}/{stats.totalBeds} beds
                </div>
            </div>

            {/* Rooms Grid */}
            {expanded && (
                <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)' }}>
                    {rooms.length === 0 ? (
                        <div style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '12px' }}>
                            No rooms on this floor. <Link to={`/rooms?floor=${floor.id}`}>Add rooms →</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                            {rooms.map(room => (
                                <RoomCard key={room.id} room={room} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Room Card Component
function RoomCard({ room }) {
    const beds = room.beds || [];
    const vacantCount = beds.filter(b => b.status === 'VACANT' || b.status === 'vacant').length;
    const totalBeds = beds.length || room.capacity || 0;

    return (
        <div style={{
            padding: '10px 12px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid var(--gray-200)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{room.room_number}</span>
                <span style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
                    {room.room_type}
                </span>
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {beds.length > 0 ? (
                    beds.map((bed, idx) => (
                        <div
                            key={bed.id || idx}
                            title={`Bed ${bed.bed_number}: ${bed.status}${bed.current_student ? ` - ${bed.current_student.full_name}` : ''}`}
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: BED_COLORS[bed.status?.toLowerCase()] || 'var(--gray-300)',
                            }}
                        />
                    ))
                ) : (
                    // Show placeholder beds based on capacity
                    Array.from({ length: totalBeds }).map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: 'var(--gray-300)',
                                border: '1px dashed var(--gray-400)',
                            }}
                        />
                    ))
                )}
            </div>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--gray-500)' }}>
                Rs. {(room.base_rent || 0).toLocaleString()}/mo
            </div>
        </div>
    );
}
