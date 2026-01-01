const API_BASE = 'http://localhost:8000/api/v1';

// Helper to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request handler
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: getHeaders(),
  });

  // Handle 401 - clear token and redirect
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await response.json();

  if (!response.ok) {
    // Handle FastAPI validation errors (detail is an array)
    if (Array.isArray(data.detail)) {
      const messages = data.detail.map(err => {
        const field = err.loc?.slice(-1)[0] || 'Unknown field';
        return `${field}: ${err.msg}`;
      });
      throw new Error(messages.join(', '));
    }
    // Handle string detail
    throw new Error(data.detail || 'Request failed');
  }

  return data;
}

// API methods organized by resource
export const api = {
  // Auth
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request('/auth/me'),
    updateProfile: (data) =>
      request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    changePassword: (currentPassword, newPassword) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      }),
  },

  // Hostel
  hostel: {
    get: () => request('/hostel'),
    update: (data) =>
      request('/hostel', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    stats: () => request('/hostel/stats'),
    updateFeatures: (data) =>
      request('/hostel/features', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateLocation: (data) =>
      request('/hostel/location', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateMeals: (data) =>
      request('/hostel/meals', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Buildings
  buildings: {
    list: () => request('/buildings'),
    listBrief: () => request('/buildings/brief'),
    get: (id) => request(`/buildings/${id}`),
    create: (data) =>
      request('/buildings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/buildings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/buildings/${id}`, {
        method: 'DELETE',
      }),
  },

  // Floors
  floors: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.building_id) query.append('building_id', params.building_id);
      const queryStr = query.toString();
      return request(`/floors${queryStr ? `?${queryStr}` : ''}`);
    },
    get: (id) => request(`/floors/${id}`),
    create: (data) =>
      request('/floors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/floors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/floors/${id}`, {
        method: 'DELETE',
      }),
    stats: (id) => request(`/floors/${id}/stats`),
  },

  // Rooms
  rooms: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/rooms${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/rooms/${id}`),
    create: (data) =>
      request('/rooms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/rooms/${id}`, {
        method: 'DELETE',
      }),
  },

  // Beds
  beds: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/beds${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/beds/${id}`),
    create: (data) =>
      request('/beds', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/beds/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/beds/${id}`, {
        method: 'DELETE',
      }),
    vacant: () => request('/beds/vacant'),
  },

  // Amenities
  amenities: {
    list: () => request('/amenities'),
    create: (data) =>
      request('/amenities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/amenities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/amenities/${id}`, {
        method: 'DELETE',
      }),
  },

  // Students
  students: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/students${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/students/${id}`),
    create: (data) =>
      request('/students', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    checkout: (id, data) =>
      request(`/students/${id}/checkout`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    transfer: (id, newBedId) =>
      request(`/students/${id}/transfer`, {
        method: 'POST',
        body: JSON.stringify({ new_bed_id: newBedId }),
      }),
    // Guardians
    guardians: {
      list: (studentId) => request(`/students/${studentId}/guardians`),
      create: (studentId, data) =>
        request(`/students/${studentId}/guardians`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (studentId, guardianId, data) =>
        request(`/students/${studentId}/guardians/${guardianId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (studentId, guardianId) =>
        request(`/students/${studentId}/guardians/${guardianId}`, {
          method: 'DELETE',
        }),
    },
    // KYC
    kyc: {
      get: (studentId) => request(`/students/${studentId}/kyc`),
      upload: (studentId, data) =>
        request(`/students/${studentId}/kyc`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      verify: (studentId) =>
        request(`/students/${studentId}/kyc/verify`, {
          method: 'POST',
        }),
      reject: (studentId, reason) =>
        request(`/students/${studentId}/kyc/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }),
    },
    // New Payment Methods
    getBillingStatus: (studentId) =>
      request(`/students/${studentId}/billing-status`),
    recordMonthlyPayment: (studentId, data = {}) =>
      request(`/students/${studentId}/payments/monthly`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    recordExtraPayment: (studentId, data) =>
      request(`/students/${studentId}/payments/extra`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyId: (studentId, data) =>
      request(`/students/${studentId}/verify-id`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    completePayment: (studentId, data) =>
      request(`/students/${studentId}/payments/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Payments
  payments: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/payments${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/payments/${id}`),
    create: (data) =>
      request('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/payments/${id}`, {
        method: 'DELETE',
      }),
    due: () => request('/payments/due'),
    overdue: () => request('/payments/overdue'),
    forStudent: (studentId) => request(`/students/${studentId}/payments`),
  },

  // Registration (3-step wizard)
  registration: {
    // Get hierarchy for bed picker
    getHierarchy: () => request('/registration/hierarchy'),

    // Get rooms with beds for a floor
    getFloorRooms: (floorId) => request(`/registration/floors/${floorId}/rooms`),

    // Step 1: Save biodata
    step1: (data) =>
      request('/registration/step1', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Step 2: Assign bed
    step2: (draftId, data) =>
      request(`/registration/${draftId}/step2`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    // Step 3: Payment and finalize
    step3: (draftId, data) =>
      request(`/registration/${draftId}/step3`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    // Get invoice
    getInvoice: (studentId) => request(`/registration/${studentId}/invoice`),

    // Send invoice email
    sendInvoice: (studentId, email) =>
      request(`/registration/${studentId}/send-invoice`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  // Financial Summary
  financial: {
    summary: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/financial/summary${query ? `?${query}` : ''}`);
    },
    pendingStudents: (limit = 10) => request(`/financial/pending-students?limit=${limit}`),
  },
};

export default api;
