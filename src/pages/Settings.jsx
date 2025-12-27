import { useState, useEffect } from 'react';
import { api } from '../api/client';
import MapLocationPicker from '../components/MapLocationPicker';

export default function Settings() {
    const [hostel, setHostel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        loadHostel();
    }, []);

    const loadHostel = async () => {
        try {
            const data = await api.hostel.get();
            setHostel(data);
        } catch (err) {
            console.error('Failed to load hostel:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (updates) => {
        setSaving(true);
        try {
            const updated = await api.hostel.update(updates);
            setHostel(updated);
            alert('Settings saved successfully!');
        } catch (err) {
            alert(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleFeaturesUpdate = async (updates) => {
        setSaving(true);
        try {
            const updated = await api.hostel.updateFeatures(updates);
            setHostel(updated);
            alert('Features updated!');
        } catch (err) {
            alert(err.message || 'Failed to update features');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    if (!hostel) {
        return <div className="alert alert-error">Failed to load hostel settings</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Hostel Settings</h1>
                <p className="page-subtitle">Manage your hostel configuration</p>
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
                {/* Sidebar tabs */}
                <div style={{ width: '200px', flexShrink: 0 }}>
                    <div className="card" style={{ padding: '8px' }}>
                        <button
                            className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                            onClick={() => setActiveTab('basic')}
                            style={{ width: '100%', textAlign: 'left' }}
                        >
                            Basic Info
                        </button>
                        <button
                            className={`nav-link ${activeTab === 'features' ? 'active' : ''}`}
                            onClick={() => setActiveTab('features')}
                            style={{ width: '100%', textAlign: 'left' }}
                        >
                            Features & Amenities
                        </button>
                        <button
                            className={`nav-link ${activeTab === 'subscription' ? 'active' : ''}`}
                            onClick={() => setActiveTab('subscription')}
                            style={{ width: '100%', textAlign: 'left' }}
                        >
                            Subscription
                        </button>
                        <button
                            className={`nav-link ${activeTab === 'location' ? 'active' : ''}`}
                            onClick={() => setActiveTab('location')}
                            style={{ width: '100%', textAlign: 'left' }}
                        >
                            📍 Location
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div style={{ flex: 1 }}>
                    {activeTab === 'basic' && (
                        <BasicInfoTab hostel={hostel} onSave={handleUpdate} saving={saving} />
                    )}
                    {activeTab === 'features' && (
                        <FeaturesTab hostel={hostel} onSave={handleFeaturesUpdate} saving={saving} />
                    )}
                    {activeTab === 'subscription' && (
                        <SubscriptionTab hostel={hostel} />
                    )}
                    {activeTab === 'location' && (
                        <LocationTab hostel={hostel} onSave={async (data) => {
                            setSaving(true);
                            try {
                                const updated = await api.hostel.updateLocation(data);
                                setHostel(updated);
                                alert('Location updated!');
                            } catch (err) {
                                alert(err.message || 'Failed to update location');
                            } finally {
                                setSaving(false);
                            }
                        }} saving={saving} />
                    )}
                </div>
            </div>
        </div>
    );
}

function BasicInfoTab({ hostel, onSave, saving }) {
    const [form, setForm] = useState({
        name: hostel.name || '',
        description: hostel.description || '',
        contact_email: hostel.contact_email || '',
        contact_phone: hostel.contact_phone || '',
        address_line1: hostel.address_line1 || '',
        city: hostel.city || '',
        opening_time: hostel.opening_time || '05:00',
        closing_time: hostel.closing_time || '21:00',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Basic Information</h3>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Hostel Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Contact Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={form.contact_email}
                                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Phone</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={form.contact_phone}
                                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.address_line1}
                            onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gate Timings</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={form.opening_time}
                                    onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                                />
                                <span>to</span>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={form.closing_time}
                                    onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '16px' }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function FeaturesTab({ hostel, onSave, saving }) {
    const [features, setFeatures] = useState({
        has_24x7_water: hostel.has_24x7_water || false,
        has_hot_water: hostel.has_hot_water || false,
        has_wifi: hostel.has_wifi || false,
        has_power_backup: hostel.has_power_backup || false,
        has_cctv: hostel.has_cctv || false,
        has_security_guard: hostel.has_security_guard || false,
        has_laundry: hostel.has_laundry || false,
        has_study_room: hostel.has_study_room || false,
        has_gym: hostel.has_gym || false,
        has_ro_water: hostel.has_ro_water || false,
        provides_meals: hostel.provides_meals || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(features);
    };

    const featuresList = [
        { key: 'has_24x7_water', label: '24/7 Water Supply' },
        { key: 'has_hot_water', label: 'Hot Water' },
        { key: 'has_wifi', label: 'WiFi' },
        { key: 'has_power_backup', label: 'Power Backup (Generator/Inverter)' },
        { key: 'has_cctv', label: 'CCTV Surveillance' },
        { key: 'has_security_guard', label: 'Security Guard' },
        { key: 'has_laundry', label: 'Laundry Service' },
        { key: 'has_study_room', label: 'Study Room' },
        { key: 'has_gym', label: 'Gym' },
        { key: 'has_ro_water', label: 'RO Drinking Water' },
        { key: 'provides_meals', label: 'Provides Meals' },
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Features & Amenities</h3>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {featuresList.map((feature) => (
                            <label
                                key={feature.key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--gray-200)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: features[feature.key] ? 'var(--primary-50)' : 'white',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={features[feature.key]}
                                    onChange={(e) => setFeatures({ ...features, [feature.key]: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontWeight: 500 }}>{feature.label}</span>
                            </label>
                        ))}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '24px' }}>
                        {saving ? 'Saving...' : 'Save Features'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function SubscriptionTab({ hostel }) {
    const getStatusColor = (status) => {
        const colors = {
            ACTIVE: 'var(--success-600)',
            TRIAL: 'var(--warning-600)',
            EXPIRED: 'var(--danger-600)',
            SUSPENDED: 'var(--gray-500)',
        };
        return colors[status] || 'var(--gray-500)';
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Subscription Details</h3>
            </div>
            <div className="card-body">
                <div style={{ display: 'grid', gap: '24px' }}>
                    <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Current Plan</span>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-600)' }}>
                            {hostel.subscription_plan || 'FREE_TRIAL'}
                        </div>
                    </div>

                    <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Status</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <div
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: getStatusColor(hostel.subscription_status),
                                }}
                            />
                            <span style={{ fontWeight: 600 }}>{hostel.subscription_status || 'TRIAL'}</span>
                        </div>
                    </div>

                    <div className="form-row">
                        <div>
                            <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Start Date</span>
                            <div style={{ fontWeight: 500 }}>
                                {hostel.subscription_start_date
                                    ? new Date(hostel.subscription_start_date).toLocaleDateString()
                                    : '-'}
                            </div>
                        </div>
                        <div>
                            <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>End Date</span>
                            <div style={{ fontWeight: 500 }}>
                                {hostel.subscription_end_date
                                    ? new Date(hostel.subscription_end_date).toLocaleDateString()
                                    : '-'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Student Limit</span>
                        <div style={{ fontWeight: 500 }}>{hostel.max_students || 50} students</div>
                    </div>
                </div>

                <div style={{ marginTop: '32px', padding: '16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>
                        To upgrade your plan or extend your subscription, please contact support.
                    </p>
                    <button className="btn btn-secondary" style={{ marginTop: '12px' }}>Contact Support</button>
                </div>
            </div>
        </div>
    );
}

function LocationTab({ hostel, onSave, saving }) {
    const [form, setForm] = useState({
        latitude: hostel.latitude ? parseFloat(hostel.latitude) : null,
        longitude: hostel.longitude ? parseFloat(hostel.longitude) : null,
        address_line1: hostel.address_line1 || '',
        city: hostel.city || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">📍 Hostel Location</h3>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.address_line1}
                            onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                            type="text"
                            className="form-input"
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Map Location</label>
                        <small className="form-hint" style={{ display: 'block', marginBottom: '8px' }}>
                            Drag the marker or click on the map to set the exact location
                        </small>
                        <MapLocationPicker
                            latitude={form.latitude}
                            longitude={form.longitude}
                            onLocationChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
                            height="350px"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '16px' }}>
                        {saving ? 'Saving...' : 'Save Location'}
                    </button>
                </form>
            </div>
        </div>
    );
}
