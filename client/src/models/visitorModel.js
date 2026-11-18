const API_BASE_URL = (import.meta.env.VITE_API_URL);

export async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401 && token) {
    window.dispatchEvent(new CustomEvent('gather:session-expired'));
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join('. ')
      : payload?.message || `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

export const visitorModel = {
  async getEvents() {
    try {
      return await request('/events')
    } catch (error) {
      if (error.status === 404) return []
      throw error
    }
  },

  getEvent(id) {
    return request(`/events/${id}`)
  },

  async login(email, password) {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (!result?.success || !result.token) {
      throw new Error(result?.message || 'Unable to sign in. Please check your details.')
    }

    return result
  },

  requestPasswordReset(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  resetPassword(details) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  },

  sendSignupCode(email, phone) {
    return request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, phone }),
    })
  },

  verifySignupCode(details) {
    return request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  },

  completeSignup(profile, registerToken) {
    return request('/auth/register', {
      method: 'POST',
      token: registerToken,
      body: JSON.stringify(profile),
    })
  },

  getRegisteredEvents(token) {
    return request('/user/registered-events', { token })
  },

  getRegisteredEventsDetails(id, token) {
    return request(`/user/registered-events/${id}`, { token });
  },

  verifyQr(qrToken, token) {
    return request('/events/verify-qr', {
      method: 'POST',
      token,
      body: JSON.stringify({
        qrToken,
      }),
    })
  },

  getProfile(token) {
    return request('/user/profile', { token })
  },

  updateProfile(profile, token) {
    return request('/user/details', {
      method: 'PATCH',
      token,
      body: JSON.stringify(profile),
    })
  },

  createRegistration(eventId, registration, token) {
    return request(`/events/${eventId}/register`, {
      method: 'POST',
      token,
      body: JSON.stringify(registration),
    })
  },

  confirmDemoPayment(payment, token) {
    return request('/payment', {
      method: 'POST',
      token,
      body: JSON.stringify(payment),
    })
  },
}