import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

// Icons
const Icons = {
    Bed: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
    ),
    Users: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Cash: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Warning: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    Plus: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    ),
    Building: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    Door: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v.5M12 14v.5M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
    ),
    IdCard: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
    ),
    CreditCard: () => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    ),
};

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hostel, setHostel] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, hostelData] = await Promise.all([
                api.hostel.stats(),
                api.hostel.get(),
            ]);
            setStats(statsData);
            setHostel(hostelData);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">
                    Welcome back! Here's an overview of {hostel?.name || 'your hostel'}.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <Icons.Bed />
                    </div>
                    <div className="stat-value">{stats?.occupied_beds || 0}/{stats?.total_beds || 0}</div>
                    <div className="stat-label">Beds Occupied</div>
                    <div className="occupancy-bar">
                        <div
                            className="occupancy-fill"
                            style={{ width: `${stats?.occupancy_rate || 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <Icons.Users />
                    </div>
                    <div className="stat-value">{stats?.total_students || 0}</div>
                    <div className="stat-label">Active Students</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon yellow">
                        <Icons.Cash />
                    </div>
                    <div className="stat-value">Rs. {(stats?.revenue_this_month || 0).toLocaleString()}</div>
                    <div className="stat-label">Revenue This Month</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon red">
                        <Icons.Warning />
                    </div>
                    <div className="stat-value">{(stats?.due_payments || 0) + (stats?.overdue_payments || 0)}</div>
                    <div className="stat-label">Pending Payments</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Quick Actions</h2>
                </div>
                <div className="actions-grid">
                    <Link to="/students" className="action-card">
                        <div className="action-icon purple">
                            <Icons.Plus />
                        </div>
                        <div className="action-content">
                            <h3>New Admission</h3>
                            <p>Register a new student</p>
                        </div>
                    </Link>

                    <Link to="/floors" className="action-card">
                        <div className="action-icon blue">
                            <Icons.Building />
                        </div>
                        <div className="action-content">
                            <h3>Manage Floors</h3>
                            <p>{stats?.total_floors || 0} floors</p>
                        </div>
                    </Link>

                    <Link to="/rooms" className="action-card">
                        <div className="action-icon green">
                            <Icons.Door />
                        </div>
                        <div className="action-content">
                            <h3>Manage Rooms</h3>
                            <p>{stats?.total_rooms || 0} rooms</p>
                        </div>
                    </Link>

                    <Link to="/beds" className="action-card">
                        <div className="action-icon orange">
                            <Icons.Bed />
                        </div>
                        <div className="action-content">
                            <h3>Manage Beds</h3>
                            <p>{stats?.vacant_beds || 0} vacant</p>
                        </div>
                    </Link>

                    <Link to="/kyc" className="action-card">
                        <div className="action-icon pink">
                            <Icons.IdCard />
                        </div>
                        <div className="action-content">
                            <h3>KYC Verification</h3>
                            <p>{stats?.pending_kyc || 0} pending</p>
                        </div>
                    </Link>

                    <Link to="/payments" className="action-card">
                        <div className="action-icon cyan">
                            <Icons.CreditCard />
                        </div>
                        <div className="action-content">
                            <h3>Payments</h3>
                            <p>{stats?.overdue_payments || 0} overdue</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Infrastructure</h3>
                    </div>
                    <div className="card-body">
                        <table className="table">
                            <tbody>
                                <tr>
                                    <td>Total Floors</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{stats?.total_floors || 0}</td>
                                </tr>
                                <tr>
                                    <td>Total Rooms</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{stats?.total_rooms || 0}</td>
                                </tr>
                                <tr>
                                    <td>Total Beds</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{stats?.total_beds || 0}</td>
                                </tr>
                                <tr>
                                    <td>Vacant Beds</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success-600)' }}>
                                        {stats?.vacant_beds || 0}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Occupancy Rate</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{stats?.occupancy_rate || 0}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Financials</h3>
                    </div>
                    <div className="card-body">
                        <table className="table">
                            <tbody>
                                <tr>
                                    <td>Revenue This Month</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success-600)' }}>
                                        Rs. {(stats?.revenue_this_month || 0).toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Pending Revenue</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--warning-600)' }}>
                                        Rs. {(stats?.pending_revenue || 0).toLocaleString()}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Due Payments</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{stats?.due_payments || 0}</td>
                                </tr>
                                <tr>
                                    <td>Overdue Payments</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger-600)' }}>
                                        {stats?.overdue_payments || 0}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Pending KYC</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{stats?.pending_kyc || 0}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
