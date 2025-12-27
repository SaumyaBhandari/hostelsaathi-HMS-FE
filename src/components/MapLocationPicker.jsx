import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * MapLocationPicker - A reusable map component for selecting hostel location
 * Uses OpenStreetMap (free, no API key required)
 * 
 * @param {Object} props
 * @param {number} props.latitude - Initial latitude
 * @param {number} props.longitude - Initial longitude  
 * @param {function} props.onLocationChange - Callback when location changes (lat, lng)
 * @param {function} props.onAddressChange - Callback when address is resolved (addressObj)
 * @param {string} props.height - Map container height (default: 300px)
 * @param {boolean} props.disabled - Disable map interactions
 */
export default function MapLocationPicker({
    latitude,
    longitude,
    onLocationChange,
    onAddressChange,
    height = '300px',
    disabled = false
}) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [locationName, setLocationName] = useState('');

    // Default to Kathmandu if no coordinates provided
    const defaultLat = 27.7172;
    const defaultLng = 85.3240;
    const initialLat = latitude || defaultLat;
    const initialLng = longitude || defaultLng;

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Create map instance
        const map = L.map(mapRef.current, {
            center: [initialLat, initialLng],
            zoom: 15,
            scrollWheelZoom: true,
        });

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Create draggable marker
        const marker = L.marker([initialLat, initialLng], {
            draggable: !disabled,
        }).addTo(map);

        // Handle marker drag
        marker.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            onLocationChange?.(lat, lng);
            reverseGeocode(lat, lng);
        });

        // Handle map click
        if (!disabled) {
            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                onLocationChange?.(lat, lng);
                reverseGeocode(lat, lng);
            });
        }

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // Initial reverse geocode
        if (latitude && longitude) {
            reverseGeocode(latitude, longitude);
        }

        // Cleanup
        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Update marker when coordinates change externally
    useEffect(() => {
        if (markerRef.current && latitude && longitude) {
            markerRef.current.setLatLng([latitude, longitude]);
            mapInstanceRef.current?.setView([latitude, longitude], 15);
        }
    }, [latitude, longitude]);

    // Reverse geocode: Coordinates -> Address
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&addressdetails=1`
            );
            const data = await response.json();
            if (data.display_name) {
                setLocationName(data.display_name);

                // Parse address components and call callback
                if (onAddressChange && data.address) {
                    const addr = data.address;
                    onAddressChange({
                        fullAddress: data.display_name,
                        road: addr.road || addr.street || '',
                        neighbourhood: addr.neighbourhood || addr.suburb || '',
                        city: addr.city || addr.town || addr.village || addr.municipality || '',
                        district: addr.county || addr.state_district || '',
                        province: addr.state || '',
                        country: addr.country || '',
                        postalCode: addr.postcode || '',
                    });
                }
            }
        } catch (error) {
            console.error('Reverse geocode failed:', error);
        }
    };

    // Forward geocode: Address -> Coordinates
    const searchAddress = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=en`
            );
            const data = await response.json();

            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const latNum = parseFloat(lat);
                const lngNum = parseFloat(lon);

                markerRef.current?.setLatLng([latNum, lngNum]);
                mapInstanceRef.current?.setView([latNum, lngNum], 15);
                onLocationChange?.(latNum, lngNum);
                setLocationName(display_name);
            } else {
                alert('Location not found. Try a different search term.');
            }
        } catch (error) {
            console.error('Geocode failed:', error);
            alert('Search failed. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    // Get user's current location
    const useMyLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                markerRef.current?.setLatLng([lat, lng]);
                mapInstanceRef.current?.setView([lat, lng], 15);
                onLocationChange?.(lat, lng);
                reverseGeocode(lat, lng);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location. Please allow location access.');
            }
        );
    };

    return (
        <div className="map-location-picker">
            {/* Search bar */}
            {!disabled && (
                <div className="map-search-bar" style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search address (e.g., Kathmandu, Nepal)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
                        style={{ flex: 1 }}
                    />
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={searchAddress}
                        disabled={searching}
                    >
                        {searching ? '...' : '🔍 Search'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={useMyLocation}
                        title="Use my current location"
                    >
                        📍
                    </button>
                </div>
            )}

            {/* Map container */}
            <div
                ref={mapRef}
                style={{
                    height,
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid var(--gray-200)',
                }}
            />

            {/* Location info */}
            <div className="map-location-info" style={{ marginTop: '12px' }}>
                {latitude && longitude ? (
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                        <strong>📍 Selected:</strong> {latitude?.toFixed(6)}°N, {longitude?.toFixed(6)}°E
                        {locationName && (
                            <div style={{ marginTop: '4px', color: 'var(--gray-500)', fontSize: '13px' }}>
                                {locationName}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ fontSize: '14px', color: 'var(--gray-400)' }}>
                        Click on the map or search to set your hostel location
                    </div>
                )}
            </div>
        </div>
    );
}
