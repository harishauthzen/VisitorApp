import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adminModel } from '../models/adminModel.js'

const sections = ['overview', 'events', 'registrations', 'trash', 'scanner']

function getAdminRoute(pathname) {
  const eventRegistrations = pathname.match(/^\/admin\/events\/(\d+)\/registrations$/)
  if (eventRegistrations) return { section: 'registrations', eventId: eventRegistrations[1], registrationId: '' }

  const registration = pathname.match(/^\/admin\/registrations\/(\d+)$/)
  if (registration) return { section: 'registrations', eventId: '', registrationId: registration[1] }

  const section = pathname.match(/^\/admin\/(events|registrations|trash|scanner)$/)?.[1] || 'overview'
  return { section, eventId: '', registrationId: '' }
}

export function useAdminController(token) {
  const location = useLocation()
  const navigate = useNavigate()
  const route = getAdminRoute(location.pathname)
  const routeInitialized = useRef(false)
  const { section, registrationId, eventId } = route
  const [summary, setSummary] = useState(null)
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [deletedEvents, setDeletedEvents] = useState([])
  const [deletedPasses, setDeletedPasses] = useState([])
  const [deletedRegistrations, setDeletedRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [qrResult, setQrResult] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')
  const [totalScanCount, setTotalScanCount] = useState(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(null), 10000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const loadDeletedRecords = useCallback(async () => {
    const [nextEvents, nextPasses, nextRegistrations] = await Promise.all([
      adminModel.getDeletedEvents(token),
      adminModel.getDeletedPasses(token),
      adminModel.getDeletedRegistrations(token),
    ])
    setDeletedEvents(nextEvents)
    setDeletedPasses(nextPasses)
    setDeletedRegistrations(nextRegistrations)
  }, [token])

  async function refresh() {
    setLoading(true);
    setError('');

    try {
      const [nextSummary, nextEvents, nextRegistrations] =
        await Promise.all([
          adminModel.getSummary(token),
          adminModel.getEvents(token),
          route.eventId
            ? adminModel.getRegistrationsByEvent(route.eventId, token)
            : adminModel.getRegistrations(token),
        ]);

      setSummary(nextSummary);
      setEvents(nextEvents);
      setRegistrations(nextRegistrations);
      await scanCount()
      if (route.section === 'trash') await loadDeletedRecords()
      setDetailRefreshKey((key) => key + 1)
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to load the admin workspace.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true

    async function loadWorkspace() {
      setLoading(true)
      setError('')

      try {
        const [nextSummary, nextEvents, nextRegistrations] = await Promise.all([
          adminModel.getSummary(token),
          adminModel.getEvents(token),
          adminModel.getRegistrations(token),
        ])

        if (!active) return

        setSummary(nextSummary)
        setEvents(nextEvents)
        setRegistrations(nextRegistrations)
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || 'Unable to load the admin workspace.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadWorkspace()

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    const nextRoute = getAdminRoute(location.pathname)
    const isInitialRoute = !routeInitialized.current
    routeInitialized.current = true
    if (isInitialRoute && nextRoute.section !== 'trash' && !nextRoute.eventId) return
    if (nextRoute.registrationId) return

    let active = true
    async function loadSectionData() {
      setError('')
      setLoading(true)
      try {
        if (nextRoute.section === 'trash') {
          await loadDeletedRecords()
        } else if (nextRoute.section === 'registrations') {
          const nextRegistrations = nextRoute.eventId
            ? await adminModel.getRegistrationsByEvent(nextRoute.eventId, token)
            : await adminModel.getRegistrations(token)
          if (active) setRegistrations(nextRegistrations)
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Unable to load admin data.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadSectionData()
    return () => { active = false }
  }, [location.pathname, token, loadDeletedRecords])

  async function selectSection(nextSection) {
    if (!sections.includes(nextSection)) return;

    navigate(nextSection === 'overview' ? '/admin' : `/admin/${nextSection}`)
  }

  function viewRegistration(id) {
    navigate(`/admin/registrations/${id}`, { state: { from: location.pathname } })
  }

  function backToRegistrations() {
    const previousPath = location.state?.from
    navigate(previousPath && /^\/admin\/events\/\d+\/registrations$/.test(previousPath)
      ? previousPath
      : '/admin/registrations')
  }

  const getRegistration = useCallback((id) => adminModel.getRegistration(id, token), [token]);

  async function viewEventRegistrations(event) {
    if (!event?.id) return

    navigate(`/admin/events/${event.id}/registrations`)
  }


  async function runAction(action, message) {
    setBusy(true)
    setError('')
    try {
      const result = await action()
      await refresh()
      setNotice({ type: 'success', message })
      return result
    } catch (actionError) {
      setError(actionError.message || 'The requested change could not be saved.')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function saveEvent(id, details) {
    return runAction(
      () => id ? adminModel.updateEvent(id, details, token) : adminModel.createEvent(details, token),
      id ? 'Event changes saved.' : 'Event created.',
    )
  }

  async function removeEvent(id) {
    return runAction(() => adminModel.deleteEvent(id, token), 'Event deleted.')
  }

  async function restoreEvent(id) {
    return (await runAction(() => adminModel.restoreEvent(id, token), 'Event restored.')) !== false
  }

  async function permanentlyDeleteEvent(id) {
    return (await runAction(() => adminModel.permanentlyDeleteEvent(id, token), 'Event permanently deleted.')) !== false
  }

  async function savePass(eventId, passId, details) {
    return runAction(
      () => passId
        ? adminModel.updatePass(eventId, passId, details, token)
        : adminModel.createPass(eventId, details, token),
      passId ? 'Pass changes saved.' : 'Pass created.',
    )
  }

  async function removePass(eventId, passId) {
    return runAction(() => adminModel.deletePass(eventId, passId, token), 'Pass deleted.')
  }

  async function restorePass(eventId, passId) {
    return (await runAction(() => adminModel.restorePass(eventId, passId, token), 'Pass restored.')) !== false
  }

  async function permanentlyDeletePass(eventId, passId) {
    return (await runAction(() => adminModel.permanentlyDeletePass(eventId, passId, token), 'Pass permanently deleted.')) !== false
  }

  async function removeRegistration(id) {
    return (await runAction(() => adminModel.deleteRegistration(id, token), 'Registration deleted.')) !== false
  }

  async function restoreRegistration(id) {
    return (await runAction(() => adminModel.restoreRegistration(id, token), 'Registration restored.')) !== false
  }

  async function permanentlyDeleteRegistration(id) {
    return (await runAction(() => adminModel.permanentlyDeleteRegistration(id, token), 'Registration permanently deleted.')) !== false
  }

  function getEvent(id) {
    return adminModel.getEvent(id, token)
  }

  async function verifyQr(qrToken) {
    if (!qrToken || !String(qrToken).trim()) {
      setQrError('QR token is missing.')
      return null
    }

    setQrLoading(true)
    setQrError('')
    setQrResult(null)

    try {
      const result = await adminModel.verifyQr(
        String(qrToken).trim(),
        token,
      )

      setQrResult(result)

      await scanCount();

      return result
    } catch (requestError) {
      setQrError(
        requestError.message ||
        'Unable to verify the QR code.',
      )

      return null
    } finally {
      setQrLoading(false)
    }
  }


  async function scanCount() {
    if (!token) return null;
    setError('');

    try {
      const result = await adminModel.getTotalScanCount(token);
      setTotalScanCount(result);
      return result;
    } catch (error) {
      setError(
        error.message ||
        'Unable to get total scan count',
      )
      return null;
    }
  }

  useEffect(() => {
    if (!token) return;

    let active = true
    adminModel.getTotalScanCount(token)
      .then((result) => {
        if (active) setTotalScanCount(result)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to get total scan count')
      })

    return () => { active = false }
  }, [token]);


  function resetQrVerification() {
    setQrResult(null)
    setQrError('')
    setQrLoading(false)
  }

  return {
    section,
    selectSection,
    registrationId,
    viewRegistration,
    backToRegistrations,
    summary,
    events,
    registrations,
    deletedEvents,
    deletedPasses,
    deletedRegistrations,
    loading,
    error,
    busy,
    notice,
    dismissNotice: () => setNotice(null),
    refresh,
    saveEvent,
    getEvent,
    eventId,
    viewEventRegistrations,
    verifyQr,
    resetQrVerification,
    qrResult,
    qrLoading,
    qrError,
    scanCount,
    totalScanCount,
    detailRefreshKey,
    getRegistration,
    removeEvent,
    restoreEvent,
    permanentlyDeleteEvent,
    savePass,
    removePass,
    restorePass,
    permanentlyDeletePass,
    removeRegistration,
    restoreRegistration,
    permanentlyDeleteRegistration,
  }
}