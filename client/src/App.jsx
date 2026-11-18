import VisitorPortal from './views/VisitorPortal.jsx'
import AdminPanel from './views/AdminPanel.jsx'
import { useVisitorController } from './controllers/useVisitorController.js'
import { Navigate, useLocation } from 'react-router-dom'
import './App.css'
import './views/VisitorPortal.css'
import './views/AdminPanel.css'
import './views/AdminQrScanner.css'

function App() {
  const visitor = useVisitorController()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  if (location.pathname === '/' && params.has('page')) {
    const page = params.get('page')
    const section = params.get('section')
    const eventId = params.get('eventId')
    const registrationId = params.get('registrationId')
    const visitorMode = params.get('mode') === 'admin' ? '?mode=admin' : ''

    if (page === 'event' && /^\d+$/.test(eventId || '')) {
      return <Navigate replace to={`/events/${eventId}${visitorMode}`} />
    }
    if (page === 'registration-details' && /^\d+$/.test(registrationId || '')) {
      return <Navigate replace to={`/registrations/${registrationId}${visitorMode}`} />
    }
    if (page === 'admin') {
      const validSection = ['events', 'registrations', 'trash', 'scanner'].includes(section)
      const destination = registrationId
        && /^\d+$/.test(registrationId)
        ? `/admin/registrations/${registrationId}`
        : eventId && /^\d+$/.test(eventId) && section === 'registrations'
          ? `/admin/events/${eventId}/registrations`
          : validSection
            ? `/admin/${section}`
            : '/admin'
      return <Navigate replace to={destination} />
    }
    if (page === 'my-events' || page === 'profile') {
      return <Navigate replace to={`/${page}${visitorMode}`} />
    }
  }

  if (!['/', '/my-events', '/profile'].includes(location.pathname) &&
      !/^\/events\/\d+$/.test(location.pathname) &&
      !/^\/registrations\/\d+$/.test(location.pathname) &&
      !['/admin', '/admin/events', '/admin/registrations', '/admin/trash', '/admin/scanner'].includes(location.pathname) &&
      !/^\/admin\/registrations\/\d+$/.test(location.pathname) &&
      !/^\/admin\/events\/\d+\/registrations$/.test(location.pathname)) {
    return <Navigate replace to="/" />
  }

  if (location.pathname.startsWith('/admin') && visitor.role === 'admin' && visitor.token) {
    return <AdminPanel visitor={visitor} />
  }
  return <VisitorPortal visitor={visitor} />
}

export default App
