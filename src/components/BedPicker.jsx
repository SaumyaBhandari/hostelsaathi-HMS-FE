import { useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * BedPicker - Visual bed selection component with movie-ticket style picker
 * Props:
 *   - onBedSelect: (bedId, bedInfo) => void - Called when user selects a bed
 *   - selectedBedId: string - Currently selected bed ID
 */
export default function BedPicker({ onBedSelect, selectedBedId }) {
    const [hierarchy, setHierarchy] = useState({ buildings: [] });
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(false);

    useEffect(() => {
        loadHierarchy();
    }, []);

    useEffect(() => {
        if (selectedFloor) {
            loadRooms(selectedFloor.id);
        }
    }, [selectedFloor]);

    const loadHierarchy = async () => {
        try {
            setLoading(true);
            const data = await api.registration.getHierarchy();
            setHierarchy(data);
            // Auto-select first building if available
            if (data.buildings.length > 0) {
                setSelectedBuilding(data.buildings[0]);
                if (data.buildings[0].floors.length > 0) {
                    setSelectedFloor(data.buildings[0].floors[0]);
                }
            }
        } catch (err) {
            console.error('Failed to load hierarchy:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRooms = async (floorId) => {
        try {
            setLoadingRooms(true);
            const data = await api.registration.getFloorRooms(floorId);
            setRooms(data);
        } catch (err) {
            console.error('Failed to load rooms:', err);
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleBuildingChange = (buildingId) => {
        const building = hierarchy.buildings.find(b => b.id === buildingId);
        setSelectedBuilding(building);
        setSelectedFloor(building?.floors[0] || null);
        setRooms([]);
    };

    const handleFloorChange = (floorId) => {
        const floor = selectedBuilding?.floors.find(f => f.id === floorId);
        setSelectedFloor(floor);
    };

    const handleBedClick = (bed, room) => {
        if (bed.status !== 'vacant') return; // Can't select occupied beds

        onBedSelect(bed.id, {
            bedId: bed.id,
            bedNumber: bed.bed_number,
            roomNumber: room.room_number,
            roomType: room.room_type,
            monthlyRent: bed.monthly_rent || room.base_rent,
            buildingName: selectedBuilding?.name,
            floorName: selectedFloor?.name,
        });
    };

    const getBedColor = (status, isSelected) => {
        if (isSelected) return 'var(--primary-500)';
        switch (status) {
            case 'vacant': return 'var(--success-500)';
            case 'occupied': return 'var(--danger-500)';
            case 'temp_away': return 'var(--purple-500, #9333ea)';
            case 'reserved': return 'var(--warning-500)';
            case 'maintenance': return 'var(--gray-400)';
            default: return 'var(--gray-300)';
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="bed-picker">
            {/* Breadcrumb */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'var(--gray-100)',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
            }}>
                <span
                    onClick={() => setSelectedBuilding(null)}
                    style={{ cursor: 'pointer', color: 'var(--primary-600)', fontWeight: selectedBuilding ? 400 : 600 }}
                >
                    🏢 Buildings
                </span>
                {selectedBuilding && (
                    <>
                        <span style={{ color: 'var(--gray-400)' }}>›</span>
                        <span
                            onClick={() => setSelectedFloor(null)}
                            style={{ cursor: 'pointer', color: 'var(--primary-600)', fontWeight: selectedFloor ? 400 : 600 }}
                        >
                            {selectedBuilding.name}
                        </span>
                    </>
                )}
                {selectedFloor && (
                    <>
                        <span style={{ color: 'var(--gray-400)' }}>›</span>
                        <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
                            {selectedFloor.name}
                        </span>
                    </>
                )}
            </div>

            {/* Selection Dropdowns */}
            <div className="form-row" style={{ marginBottom: '24px' }}>
                <div className="form-group">
                    <label className="form-label">Building *</label>
                    <select
                        className="form-select"
                        value={selectedBuilding?.id || ''}
                        onChange={(e) => handleBuildingChange(e.target.value)}
                    >
                        <option value="">Select Building</option>
                        {hierarchy.buildings.map(b => (
                            <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Floor *</label>
                    <select
                        className="form-select"
                        value={selectedFloor?.id || ''}
                        onChange={(e) => handleFloorChange(e.target.value)}
                        disabled={!selectedBuilding}
                    >
                        <option value="">Select Floor</option>
                        {selectedBuilding?.floors.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '16px',
                fontSize: '12px',
                flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--success-500)' }}></div>
                    <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--danger-500)' }}></div>
                    <span>Occupied</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--primary-500)' }}></div>
                    <span>Selected</span>
                </div>
            </div>

            {/* Rooms Grid */}
            {loadingRooms ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : rooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
                    {selectedFloor ? 'No rooms on this floor' : 'Select a building and floor to view rooms'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {rooms.map(room => (
                        <div
                            key={room.room_id}
                            style={{
                                padding: '16px',
                                border: '1px solid var(--gray-200)',
                                borderRadius: '8px',
                                background: 'white',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div>
                                    <strong>Room {room.room_number}</strong>
                                    <span style={{
                                        marginLeft: '8px',
                                        fontSize: '12px',
                                        color: 'var(--gray-500)',
                                        textTransform: 'capitalize',
                                    }}>
                                        {room.room_type}
                                    </span>
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--primary-600)', fontWeight: 500 }}>
                                    Rs. {Number(room.base_rent).toLocaleString()}/mo
                                </div>
                            </div>

                            {/* Beds Grid (Movie ticket style) */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                            }}>
                                {room.beds.map(bed => {
                                    const isSelected = bed.id === selectedBedId;
                                    const isAvailable = bed.status === 'vacant';

                                    return (
                                        <div
                                            key={bed.id}
                                            onClick={() => handleBedClick(bed, room)}
                                            title={`Bed ${bed.bed_number}: ${bed.status}${bed.monthly_rent ? ` - Rs. ${bed.monthly_rent}` : ''}`}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '8px',
                                                background: getBedColor(bed.status, isSelected),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                opacity: isAvailable || isSelected ? 1 : 0.7,
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                boxShadow: isSelected ? '0 0 0 3px var(--primary-200)' : 'none',
                                            }}
                                            onMouseEnter={(e) => isAvailable && (e.currentTarget.style.transform = 'scale(1.05)')}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            {bed.bed_number}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
