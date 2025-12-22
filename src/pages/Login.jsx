import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Left side - Branding */}
            <div className="auth-branding">
                <div className="auth-branding-content">
                    <img src="/logo.png" alt="BasaiSaathi Logo" className="auth-logo-large" />
                    <h1>BasaiSaathi</h1>
                    <p>Simplify your hostel management with our all-in-one platform. Track beds, manage students, and handle payments effortlessly.</p>
                    <div className="auth-features">
                        <div className="auth-feature">
                            <span className="auth-feature-icon">🏠</span>
                            <span>Multi-floor & Room Management</span>
                        </div>
                        <div className="auth-feature">
                            <span className="auth-feature-icon">👥</span>
                            <span>Student Admissions & KYC</span>
                        </div>
                        <div className="auth-feature">
                            <span className="auth-feature-icon">💰</span>
                            <span>Payment Tracking & Receipts</span>
                        </div>
                        <div className="auth-feature">
                            <span className="auth-feature-icon">📊</span>
                            <span>Real-time Dashboard Analytics</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="auth-form-side">
                <div className="auth-card">
                    <div className="auth-logo">
                        <img src="/logo.png" alt="BasaiSaathi" style={{ width: '48px', height: '48px' }} />
                        <h1 style={{ fontSize: '24px' }}>BasaiSaathi</h1>
                    </div>

                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to continue managing your hostel</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: '8px' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="btn-loading">
                                    <span className="spinner-small"></span>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>New to BasaiSaathi?</span>
                    </div>

                    <Link to="/register" className="btn btn-secondary btn-lg" style={{ width: '100%', textAlign: 'center' }}>
                        Register Your Hostel
                    </Link>

                    <p className="auth-hint">
                        Start your 30-day free trial today. No credit card required.
                    </p>
                </div>
            </div>
        </div>
    );
}
