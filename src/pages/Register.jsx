import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapLocationPicker from '../components/MapLocationPicker';

export default function Register() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        hostel_name: '',
        hostel_type: 'BOYS',
        total_floors: 4,
        contact_email: '',
        contact_phone: '',
        owner_name: '',
        owner_phone: '',
        address_line1: '',
        city: '',
        latitude: null,
        longitude: null,
        password: '',
        confirm_password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.hostel_name || !formData.city || !formData.address_line1) {
                setError('Please fill in all hostel details');
                return false;
            }
        } else if (step === 2) {
            if (!formData.owner_name || !formData.owner_phone || !formData.contact_email) {
                setError('Please fill in all contact details');
                return false;
            }
        }
        setError('');
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register({
                hostel_name: formData.hostel_name,
                hostel_type: formData.hostel_type.toLowerCase(),
                total_floors: formData.total_floors,
                owner_email: formData.contact_email,
                owner_password: formData.password,
                owner_name: formData.owner_name,
                owner_phone: formData.owner_phone,
                address_line1: formData.address_line1,
                city: formData.city,
                latitude: formData.latitude,
                longitude: formData.longitude,
                contact_phone: formData.contact_phone || formData.owner_phone,
            });
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Hostel Details' },
        { number: 2, title: 'Contact Info' },
        { number: 3, title: 'Create Account' },
    ];

    return (
        <div className="auth-container">
            {/* Left side - Branding */}
            <div className="auth-branding">
                <div className="auth-branding-content">
                    <img src="/logo.png" alt="BasaiSaathi Logo" className="auth-logo-large" />
                    <h1>BasaiSaathi</h1>
                    <p>Join thousands of hostel owners who trust BasaiSaathi to manage their properties efficiently.</p>

                    <div className="auth-stats">
                        <div className="auth-stat">
                            <div className="auth-stat-value">500+</div>
                            <div className="auth-stat-label">Hostels</div>
                        </div>
                        <div className="auth-stat">
                            <div className="auth-stat-value">10K+</div>
                            <div className="auth-stat-label">Students</div>
                        </div>
                        <div className="auth-stat">
                            <div className="auth-stat-value">Rs. 2Cr+</div>
                            <div className="auth-stat-label">Tracked</div>
                        </div>
                    </div>

                    <div className="auth-testimonial">
                        <p>"BasaiSaathi transformed how we manage our hostel. Everything is organized and payments are tracked automatically."</p>
                        <div className="auth-testimonial-author">
                            <strong>Rajeev Sharma</strong>
                            <span>Owner, Sunrise Boys Hostel</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="auth-form-side">
                <div className="auth-card" style={{ maxWidth: '480px' }}>
                    <div className="auth-logo">
                        <img src="/logo.png" alt="BasaiSaathi" style={{ width: '40px', height: '40px' }} />
                        <h1 style={{ fontSize: '20px' }}>BasaiSaathi</h1>
                    </div>

                    <h2 className="auth-title">Register Your Hostel</h2>
                    <p className="auth-subtitle">Start your 30-day free trial</p>

                    {/* Progress Steps */}
                    <div className="onboarding-steps">
                        {steps.map((s, index) => (
                            <div key={s.number} className={`onboarding-step ${step >= s.number ? 'active' : ''} ${step > s.number ? 'completed' : ''}`}>
                                <div className="onboarding-step-number">
                                    {step > s.number ? '✓' : s.number}
                                </div>
                                <div className="onboarding-step-title">{s.title}</div>
                                {index < steps.length - 1 && <div className="onboarding-step-line" />}
                            </div>
                        ))}
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Hostel Details */}
                        {step === 1 && (
                            <div className="form-step">
                                <div className="form-group">
                                    <label className="form-label">Hostel Name *</label>
                                    <input
                                        type="text"
                                        name="hostel_name"
                                        className="form-input"
                                        placeholder="e.g., Sunrise Boys Hostel"
                                        value={formData.hostel_name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hostel Type *</label>
                                    <div className="type-selector">
                                        {['BOYS', 'GIRLS', 'CO_ED'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                className={`type-option ${formData.hostel_type === type ? 'selected' : ''}`}
                                                onClick={() => setFormData({ ...formData, hostel_type: type })}
                                            >
                                                <span className="type-icon">{type === 'BOYS' ? '👨' : type === 'GIRLS' ? '👩' : '👥'}</span>
                                                <span>{type === 'CO_ED' ? 'Co-Ed' : type.charAt(0) + type.slice(1).toLowerCase()}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            className="form-input"
                                            placeholder="e.g., Kathmandu"
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address *</label>
                                    <input
                                        type="text"
                                        name="address_line1"
                                        className="form-input"
                                        placeholder="Street address"
                                        value={formData.address_line1}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Total Floors</label>
                                    <select
                                        name="total_floors"
                                        className="form-select"
                                        value={formData.total_floors}
                                        onChange={(e) => setFormData({ ...formData, total_floors: parseInt(e.target.value) })}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <option key={n} value={n}>{n} Floor{n > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                    <small className="form-hint">Floors will be auto-created (Ground, First, Second...)</small>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">📍 Hostel Location</label>
                                    <small className="form-hint" style={{ display: 'block', marginBottom: '8px' }}>
                                        Click on the map or search to set your hostel's exact location (address will auto-fill)
                                    </small>
                                    <MapLocationPicker
                                        latitude={formData.latitude}
                                        longitude={formData.longitude}
                                        onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                        onAddressChange={(addr) => {
                                            // Auto-fill address fields from map selection
                                            const addressParts = [addr.road, addr.neighbourhood].filter(Boolean).join(', ');
                                            setFormData(prev => ({
                                                ...prev,
                                                address_line1: addressParts || prev.address_line1,
                                                city: addr.city || prev.city,
                                            }));
                                        }}
                                        height="250px"
                                    />
                                </div>

                                <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={nextStep}>
                                    Continue →
                                </button>
                            </div>
                        )}

                        {/* Step 2: Contact Info */}
                        {step === 2 && (
                            <div className="form-step">
                                <div className="form-group">
                                    <label className="form-label">Your Full Name *</label>
                                    <input
                                        type="text"
                                        name="owner_name"
                                        className="form-input"
                                        placeholder="Enter your name"
                                        value={formData.owner_name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Your Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="owner_phone"
                                        className="form-input"
                                        placeholder="+977 98XXXXXXXX"
                                        value={formData.owner_phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={formData.contact_email}
                                        onChange={handleChange}
                                    />
                                    <small className="form-hint">This will be your login email</small>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hostel Contact Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        name="contact_phone"
                                        className="form-input"
                                        placeholder="Hostel landline or alternate number"
                                        value={formData.contact_phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={prevStep}>← Back</button>
                                    <button type="button" className="btn btn-primary" onClick={nextStep}>Continue →</button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Create Account */}
                        {step === 3 && (
                            <div className="form-step">
                                <div className="form-group">
                                    <label className="form-label">Create Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-input"
                                        placeholder="Minimum 6 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Confirm Password *</label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        className="form-input"
                                        placeholder="Re-enter password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-summary">
                                    <h4>Summary</h4>
                                    <div className="summary-row">
                                        <span>Hostel:</span>
                                        <strong>{formData.hostel_name}</strong>
                                    </div>
                                    <div className="summary-row">
                                        <span>Type:</span>
                                        <strong>{formData.hostel_type}</strong>
                                    </div>
                                    <div className="summary-row">
                                        <span>Location:</span>
                                        <strong>{formData.city}</strong>
                                    </div>
                                    <div className="summary-row">
                                        <span>Owner:</span>
                                        <strong>{formData.owner_name}</strong>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={prevStep}>← Back</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create Account'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
