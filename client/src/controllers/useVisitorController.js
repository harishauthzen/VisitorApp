import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { visitorModel } from '../models/visitorModel.js'

const TOKEN_KEY = 'access_token'
const LEGACY_SESSION_KEYS = [
  'visitor_access_token',
  'visitor_email',
  'visitor_role',
  'admin_access_token',
  'admin_email',
]

function getTokenClaims(token) {
  if (!token) return {}
  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return {}
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return {}
  }
}

function getSessionFromToken(token) {
  const claims = getTokenClaims(token)
  const role = claims.role === 'admin' || claims.type === 'ADMIN'
    ? 'admin'
    : claims.role === 'user' || claims.type === 'USER'
      ? 'user'
      : ''
  return {
    token,
    email: typeof claims.email === 'string' ? claims.email : '',
    role,
  }
}

function clearLegacySessionData() {
  LEGACY_SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
}

function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
  clearLegacySessionData()
}

function getRouteInfo(pathname) {
  if (pathname === '/') return { page: 'discover' }
  if (pathname === '/my-events') return { page: 'my-events' }
  if (pathname === '/profile') return { page: 'profile' }
  const event = pathname.match(/^\/events\/(\d+)$/)
  if (event) return { page: 'event', eventId: event[1] }
  const registration = pathname.match(/^\/registrations\/(\d+)$/)
  if (registration) return { page: 'registration-details', registrationId: registration[1] }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return { page: 'admin' }
  return { page: 'discover' }
}


function getStoredSession() {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  setStoredToken(token)
  return getSessionFromToken(token)
}

function getPathForPage(page) {
  if (page === 'my-events') return '/my-events'
  if (page === 'profile') return '/profile'
  if (page === 'admin') return '/admin'
  return '/'
}

export function useVisitorController() {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const route = getRouteInfo(routerLocation.pathname)
  const { page: routePage, eventId: routeEventId, registrationId: routeRegistrationId } = route
  const params = new URLSearchParams(routerLocation.search)
  const [storedSession] = useState(() => getStoredSession())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [bookingEvent, setBookingEvent] = useState(null)
  const [selectedPass, setSelectedPass] = useState(null)
  const [token, setToken] = useState(storedSession.token)
  const [email, setEmail] = useState(storedSession.email)
  const [role, setRole] = useState(storedSession.role)
  const initialPage = route.page === 'admin' && token && role !== 'admin' ? 'discover' : route.page
  const activePage = initialPage
  const needsAuthentication = !token && !['discover', 'event'].includes(route.page)
  const [pendingPageOverride, setPendingPageOverride] = useState(null)
  const pendingPage = needsAuthentication ? route.page : pendingPageOverride
  const [myEvents, setMyEvents] = useState([])
  const [myEventsDetails, setMyEventsDetails] = useState(null)
  const [myEventsDetailsLoading, setMyEventsDetailsLoading] = useState(false)
  const [myEventsDetailsError, setMyEventsDetailsError] = useState('')
  const [myEventsLoading, setMyEventsLoading] = useState(() => Boolean(token && initialPage === 'my-events'))
  const [myEventsError, setMyEventsError] = useState('')
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(() => Boolean(token && initialPage === 'profile'))
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const authOpen = authModalOpen || needsAuthentication
  const [bookingOpen, setBookingOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [pendingPayment, setPendingPayment] = useState(null)
  const [paymentOriginPage, setPaymentOriginPage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)
  const routeNotice = routerLocation.state?.routeNotice
  const visibleNotice = notice || routeNotice

  useEffect(() => {
    if (!notice && !routeNotice) return undefined
    const timeout = window.setTimeout(() => {
      if (notice) setNotice(null)
      if (routeNotice) {
        navigate(`${routerLocation.pathname}${routerLocation.search}`, {
          replace: true,
          state: null,
        })
      }
    }, 10000)
    return () => window.clearTimeout(timeout)
  }, [notice, routeNotice, navigate, routerLocation.pathname, routerLocation.search])

  const loadEventDetails = useCallback(async (eventId) => {
    setDetailLoading(true)
    setSelectedEvent(null)
    try {
      const event = await visitorModel.getEvent(eventId)
      setSelectedEvent(event)
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Unable to open this event.' })
    } finally {
      setDetailLoading(false)
    }
  }, [setNotice])

  async function refreshEvents() {
    setLoading(true)
    setLoadError('')
    try {
      const result = await visitorModel.getEvents()
      setEvents(Array.isArray(result) ? result : [])
    } catch (error) {
      setLoadError(error.message || 'We could not load events right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    visitorModel.getEvents()
      .then((result) => {
        if (active) setEvents(Array.isArray(result) ? result : [])
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'We could not load events right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    let eventTimeout
    const page = routePage
    const eventId = routeEventId
    const registrationId = routeRegistrationId
    if (page === 'admin' && token && role !== 'admin') {
      navigate('/', {
        replace: true,
        state: {
          routeNotice: {
            type: 'error',
            message: 'This account does not have admin access.',
          },
        },
      })
      return () => { active = false }
    }

    if (!token && !['discover', 'event'].includes(page)) {
      return () => { active = false }
    }

    if (page === 'event' && eventId) {
      eventTimeout = window.setTimeout(() => void loadEventDetails(eventId), 0)
    }

    async function loadPrivatePageData() {
      if (page === 'my-events' && token) {
        setMyEventsLoading(true)
        setMyEventsError('')
        try {
          const result = await visitorModel.getRegisteredEvents(token)
          if (active) setMyEvents(Array.isArray(result) ? result : [])
        } catch (error) {
          if (active) {
            setMyEventsError(error.message || 'Unable to load your events.')
            setMyEvents([])
          }
        } finally {
          if (active) setMyEventsLoading(false)
        }
      }

      if (page === 'profile' && token) {
        setProfileLoading(true)
        setProfileError('')
        try {
          const result = await visitorModel.getProfile(token)
          if (!result || result.success === false) throw new Error(result?.message || 'Unable to load your profile.')
          if (active) setProfile(result)
        } catch (error) {
          if (active) setProfileError(error.message || 'Unable to load your profile.')
        } finally {
          if (active) setProfileLoading(false)
        }
      }

      if (page === 'registration-details' && token && registrationId) {
        setMyEventsDetailsLoading(true)
        setMyEventsDetailsError('')
        setMyEventsDetails(null)
        try {
          const result = await visitorModel.getRegisteredEventsDetails(registrationId, token)
          if (!result || result.success === false) throw new Error(result?.message || 'Registration not found.')
          if (active) setMyEventsDetails(result)
        } catch (error) {
          if (active) setMyEventsDetailsError(error.message || 'Unable to load registration details.')
        } finally {
          if (active) setMyEventsDetailsLoading(false)
        }
      }
    }
    void loadPrivatePageData()

    return () => {
      active = false
      if (eventTimeout) window.clearTimeout(eventTimeout)
    }
  }, [routerLocation.pathname, token, role, navigate, routePage, routeEventId, routeRegistrationId, loadEventDetails])

  const handleExpiredSession = useCallback(() => {
    setStoredToken('')
    setToken('')
    setEmail('')
    setRole('')
    setProfile(null)
    setMyEvents([])
    setMyEventsDetails(null)
    setMyEventsError('')
    setProfileError('')
    setBookingOpen(false)
    setPaymentOpen(false)
    setPendingPayment(null)
    const loginPage = role === 'admin' ? 'admin' : activePage
    navigate('/', { replace: true })
    setPendingPageOverride(loginPage === 'discover' ? null : loginPage)
    setAuthModalOpen(true)
    setNotice({
      type: 'error',
      message: 'Your session has expired. Please sign in again.',
    })
  }, [activePage, navigate, role, setBookingOpen, setAuthModalOpen, setNotice])

  useEffect(() => {
    if (!token) return undefined;

    function handleSessionExpired() {
      handleExpiredSession();
    }

    window.addEventListener(
      'gather:session-expired',
      handleSessionExpired
    );

    const claims = getTokenClaims(token);

    let timeoutId;

    if (typeof claims.exp === 'number') {
      const remainingMs = claims.exp * 1000 - Date.now();

      if (remainingMs <= 0) {
        timeoutId = window.setTimeout(handleExpiredSession, 0)
      } else {
        timeoutId = window.setTimeout(
          handleExpiredSession,
          remainingMs
        );
      }
    }

    return () => {
      window.removeEventListener(
        'gather:session-expired',
        handleSessionExpired
      );

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [token, handleExpiredSession]);

  async function openEvent(event) {
    setNotice(null);
    const visitorMode = role === 'admin' && params.get('mode') === 'admin' ? '?mode=admin' : ''
    navigate(`/events/${event.id}${visitorMode}`)
  }


  function closeEvent() {
    setSelectedEvent(null)
    navigate(params.get('mode') === 'admin' ? '/?mode=admin' : '/')
  }

  async function loadMyEvents(accessToken = token) {
    setMyEventsLoading(true)
    setMyEventsError('')
    try {
      const result = await visitorModel.getRegisteredEvents(accessToken)
      setMyEvents(Array.isArray(result) ? result : [])
    } catch (error) {
      setMyEventsError(error.message || 'Unable to load your events.')
      setMyEvents([])
    } finally {
      setMyEventsLoading(false)
    }
  }

  async function openPage(page) {
    if (page === 'discover') {
      navigate(params.get('mode') === 'admin' ? '/?mode=admin' : '/')
      setPendingPageOverride(null)
      setAuthModalOpen(false)
      return
    }
    if (!token) {
      navigate(getPathForPage(page))
      setPendingPageOverride(page)
      setAuthModalOpen(true)
      return
    }
    if (page === 'admin' && role !== 'admin') {
      setNotice({ type: 'error', message: 'This account does not have admin access.' })
      return
    }
    navigate(getPathForPage(page))
  }

  function viewAsVisitor() {
    if (role !== 'admin') return
    navigate('/?mode=admin')
    setPendingPageOverride(null)
    setAuthModalOpen(false)
  }

  function returnToAdmin() {
    if (role !== 'admin') return
    navigate('/admin')
    setPendingPageOverride(null)
    setAuthModalOpen(false)
  }

  async function saveProfile(details) {
    if (!token) return
    setProfileSaving(true)
    setProfileError('')
    try {
      await visitorModel.updateProfile({
        firstName: details.firstName,
        lastName: details.lastName,
        gender: details.gender,
        city: details.city,
        company: details.company,
      }, token)
      const result = await visitorModel.getProfile(token)
      setProfile(result)
      setNotice({ type: 'success', message: 'Your profile has been updated.' })
    } catch (error) {
      setProfileError(error.message || 'Unable to save your profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  function beginReservation(pass) {
    setBookingEvent(selectedEvent)
    setSelectedPass(pass)
    if (token) setBookingOpen(true)
    else setAuthModalOpen(true)
  }

  async function signIn(credentials) {
    setSubmitting(true)
    try {
      const result = await visitorModel.login(credentials.email, credentials.password)
      const session = getSessionFromToken(result.token)
      if (!session.role) throw new Error('Unable to read account information from the access token.')
      if (pendingPage === 'admin' && session.role !== 'admin') {
        throw new Error('This account does not have admin access.')
      }
      setStoredToken(result.token)
      setToken(result.token)
      setEmail(session.email)
      setRole(session.role)
      setAuthModalOpen(false)
      setNotice({ type: 'success', message: session.role === 'admin' ? 'Admin access granted.' : 'You are signed in and ready to reserve.' })
      if (bookingEvent && selectedPass) setBookingOpen(true)
      if (session.role === 'admin') {
        setPendingPageOverride(null)
        navigate('/admin', { replace: true })
      } else if (pendingPage) {
        setPendingPageOverride(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function requestSignupCode(details) {
    const result = await visitorModel.sendSignupCode(details.email, details.phone)
    if (!result?.success) throw new Error(result?.message || 'Unable to send a verification code.')
    return result
  }

  async function requestPasswordReset(emailAddress) {
    setSubmitting(true)
    try {
      const result = await visitorModel.requestPasswordReset(emailAddress)
      if (!result?.success) throw new Error(result?.message || 'Unable to send a reset code.')
      return result
    } finally {
      setSubmitting(false)
    }
  }

  async function resetPassword(details) {
    setSubmitting(true)
    try {
      const result = await visitorModel.resetPassword(details)
      if (!result?.success) throw new Error(result?.message || 'Unable to reset your password.')
      return result
    } finally {
      setSubmitting(false)
    }
  }

  async function completeSignup(details) {
    setSubmitting(true)
    try {
      const verification = await visitorModel.verifySignupCode({
        email: details.email,
        phone: details.phone,
        otp: details.otp,
        password: details.password,
        confirmPassword: details.confirmPassword,
      })
      if (!verification?.success || !verification.registerToken) {
        throw new Error(verification?.message || 'Unable to verify your details.')
      }

      const profile = await visitorModel.completeSignup({
        firstName: details.firstName,
        lastName: details.lastName,
        gender: details.gender,
        city: details.city,
        company: details.company,
      }, verification.registerToken)
      if (!profile?.success) throw new Error(profile?.message || 'Unable to complete your account.')

      const result = await visitorModel.login(details.email, details.password)
      const session = getSessionFromToken(result.token)
      if (session.role !== 'user') throw new Error('Unable to read user information from the access token.')
      setStoredToken(result.token)
      setToken(result.token)
      setEmail(session.email)
      setRole(session.role)
      setAuthModalOpen(false)
      setNotice({ type: 'success', message: 'Your account is ready. You are signed in.' })
      if (bookingEvent && selectedPass) setBookingOpen(true)
      if (pendingPage) {
        setPendingPageOverride(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function submitReservation(details) {
    if (!bookingEvent || !selectedPass || !token) return
    setSubmitting(true)
    try {
      const registration = await visitorModel.createRegistration(bookingEvent.id, {
        ...details,
        passId: Number(selectedPass.id),
        quantity: Number(details.quantity),
      }, token)
      setBookingOpen(false)
      setPendingPayment(registration)
      setPaymentOriginPage(activePage)
      setPaymentOpen(true)
      setNotice({
        type: 'success',
        message: 'Your reservation is recorded as pending. Confirm the demo payment to finish registration.',
      })
      await refreshEvents()
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Reservation could not be completed.' })
    } finally {
      setSubmitting(false)
    }
  }

  function startDemoPayment(registration) {
    setPendingPayment(registration)
    setPaymentOriginPage(activePage)
    setPaymentOpen(true)
  }

  function deferDemoPayment() {
    setPaymentOpen(false)
    setPendingPayment(null)
    setPaymentOriginPage(null)
    setNotice({
      type: 'info',
      message: 'Your reservation remains pending. You can confirm payment later',
    })
  }

  async function confirmDemoPayment() {
    if (!pendingPayment || !token) return
    const originPage = paymentOriginPage
    setSubmitting(true)
    try {
      const payment = {
        id: Number(pendingPayment.id),
        userId: Number(pendingPayment.userId),
        amount: Number(pendingPayment.amount),
        status: pendingPayment.status || 'pending',
      }
      await visitorModel.confirmDemoPayment(payment, token)
      setPaymentOpen(false)
      setPendingPayment(null)
      setPaymentOriginPage(null)
      setNotice({ type: 'success', message: 'Demo payment confirmed. Your registration is complete.' })
      if (originPage === 'my-events') await loadMyEvents()
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Demo payment could not be confirmed.' })
    } finally {
      setSubmitting(false)
    }
  }

  function viewRegistration(registrationId) {
    navigate(`/registrations/${registrationId}${params.get('mode') === 'admin' ? '?mode=admin' : ''}`)
    if (!token) {
      setPendingPageOverride('registration-details')
      setAuthModalOpen(true)
      return
    }
  }



  function signOut() {
    navigate('/', { replace: true })
    setStoredToken('')
    setToken('')
    setEmail('')
    setRole('')
    setPendingPageOverride(null)
    setProfile(null)
    setNotice({ type: 'success', message: 'You have signed out.' })
  }

  function setAuthOpen(open) {
    setAuthModalOpen(open)
    if (!open && needsAuthentication) {
      setPendingPageOverride(null)
      navigate('/', { replace: true })
    }
  }

  const locations = [...new Set(events.map((event) => event.location).filter(Boolean))]
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const orderedEvents = [...events].sort((left, right) => {
    const leftEnded = left.isActive === false
    const rightEnded = right.isActive === false
    const leftDate = new Date(left.startDate)
    const rightDate = new Date(right.startDate)

    if (leftEnded !== rightEnded) return leftEnded ? 1 : -1

    const leftStartsTodayOrLater = leftDate.getTime() >= todayStart.getTime()
    const rightStartsTodayOrLater = rightDate.getTime() >= todayStart.getTime()
    if (leftStartsTodayOrLater !== rightStartsTodayOrLater) return leftStartsTodayOrLater ? -1 : 1

    return leftDate.getTime() - rightDate.getTime()
  })
  const featuredEvent = orderedEvents.find((event) => event.isActive !== false) || orderedEvents[0]
  const filteredEvents = orderedEvents.filter((event) => {
    const matchesSearch = `${event.name} ${event.description || ''} ${event.location || ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
    const matchesLocation = location === 'all' || event.location === location
    return matchesSearch && matchesLocation
  })

  return {
    events,
    featuredEvent,
    filteredEvents,
    locations,
    loading,
    loadError,
    search,
    setSearch,
    location,
    setLocation,
    selectedEvent,
    detailLoading,
    openEvent,
    closeEvent,
    selectedPass,
    bookingEvent,
    authOpen,
    setAuthOpen,
    bookingOpen,
    setBookingOpen,
    beginReservation,
    signIn,
    requestSignupCode,
    completeSignup,
    requestPasswordReset,
    resetPassword,
    submitReservation,
    paymentOpen,
    pendingPayment,
    startDemoPayment,
    confirmDemoPayment,
    deferDemoPayment,
    myEventsDetails,
    myEventsDetailsLoading,
    myEventsDetailsError,
    viewRegistration,
    submitting,
    token,
    email,
    role,
    activePage,
    adminVisitorMode: role === 'admin' && params.get('mode') === 'admin',
    pendingPage,
    openPage,
    viewAsVisitor,
    returnToAdmin,
    myEvents,
    myEventsLoading,
    myEventsError,
    loadMyEvents,
    profile,
    profileLoading,
    profileSaving,
    profileError,
    saveProfile,
    signOut,
    notice: visibleNotice,
    dismissNotice: () => {
      setNotice(null)
      if (routeNotice) navigate(`${routerLocation.pathname}${routerLocation.search}`, { replace: true, state: null })
    },
    refreshEvents,
  }
}