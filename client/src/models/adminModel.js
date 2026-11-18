import { request } from './visitorModel.js'

export const adminModel = {
  async getEvents(token) {
    try {
      const events = await request('/events', { token, cache: 'no-store' })
      return Array.isArray(events) ? events : []
    } catch (error) {
      if (error.status === 404) return []
      throw error
    }
  },

  getSummary(token) {
    return request('/events/dashboard/summary', { token, cache: 'no-store' })
  },

  async getRegistrations(token) {
    try {
      const registrations = await request('/events/registrations', { token, cache: 'no-store' });
      return Array.isArray(registrations) ? registrations : []
    } catch (error) {
      if (error.status === 404) return []
      throw error
    }
  },

  async getDeletedEvents(token) {
    try {
      const events = await request('/events/deleted', { token, cache: 'no-store' })
      return Array.isArray(events) ? events : []
    } catch (error) {
      if (error.status === 404) return []
      throw error
    }
  },

  async getDeletedPasses(token) {
    try {
      const passes = await request('/events/passes/deleted', { token, cache: 'no-store' })
      return Array.isArray(passes) ? passes : []
    } catch (error) {
      if (error.status === 404) return []
      throw error
    }
  },

  async getDeletedRegistrations(token) {
    try {
      const registrations = await request('/events/registrations/deleted', { token, cache: 'no-store' })
      return Array.isArray(registrations) ? registrations : []
    } catch (error) {
      if (error.status === 404) return []
      throw error
    }
  },

  getRegistration(id, token) {
    return request(`/events/registrations/${id}`, { token, cache: 'no-store' })
  },


  async getRegistrationsByEvent(eventId, token) {
    try {
      const registrations = await request(
        `/events/${eventId}/registrations`,
        { token, cache: 'no-store' },
      );

      return Array.isArray(registrations) ? registrations : [];
    } catch (error) {
      if (error.status === 404) return [];
      throw error;
    }
  },


  getEvent(id, token) {
    return request(`/events/${id}`, { token, cache: 'no-store' })
  },

  verifyQr(qrToken, token) {
    return request('/events/registrations/verify-qr', {
      method: 'POST',
      token,
      body: JSON.stringify({
        qrToken,
      }),
    })
  },

  getTotalScanCount(token){
    return request('/events/registrations/scan-count', { token, cache: 'no-store' })
  },

  createEvent(details, token) {
    return request('/events', { token, method: 'POST', body: JSON.stringify(details) })
  },

  updateEvent(id, details, token) {
    return request(`/events/${id}`, { token, method: 'PATCH', body: JSON.stringify(details) })
  },

  deleteEvent(id, token) {
    return request(`/events/${id}`, { token, method: 'DELETE' })
  },

  restoreEvent(id, token) {
    return request(`/events/${id}/restore`, { token, method: 'PATCH' })
  },

  permanentlyDeleteEvent(id, token) {
    return request(`/events/${id}/permanent`, { token, method: 'DELETE' })
  },

  createPass(eventId, details, token) {
    return request(`/events/${eventId}/passes`, { token, method: 'POST', body: JSON.stringify(details) })
  },

  updatePass(eventId, passId, details, token) {
    return request(`/events/${eventId}/passes/${passId}`, { token, method: 'PATCH', body: JSON.stringify(details) })
  },

  deletePass(eventId, passId, token) {
    return request(`/events/${eventId}/passes/${passId}`, { token, method: 'DELETE' })
  },

  restorePass(eventId, passId, token) {
    return request(`/events/${eventId}/passes/${passId}/restore`, { token, method: 'PATCH' })
  },

  permanentlyDeletePass(eventId, passId, token) {
    return request(`/events/${eventId}/passes/${passId}/permanent`, { token, method: 'DELETE' })
  },

  deleteRegistration(id, token) {
    return request(`/events/registrations/${id}`, { token, method: 'DELETE' })
  },

  restoreRegistration(id, token) {
    return request(`/events/registrations/${id}/restore`, { token, method: 'PATCH' })
  },

  permanentlyDeleteRegistration(id, token) {
    return request(`/events/registrations/${id}/permanent`, { token, method: 'DELETE' })
  },
}