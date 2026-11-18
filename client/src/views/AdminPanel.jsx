import { useEffect, useMemo, useState } from 'react'
import { useAdminController } from '../controllers/useAdminController.js'
import NameInput from './NameInput.jsx'
import AdminQrScanner from './AdminQrScanner.jsx'
import { sanitizeName } from '../utils/nameText.js'

const PAGE_SIZE = 10

function registrationEventName(registration) {
  const snapshot = registration.eventNameSnapshot
  return snapshot && snapshot !== 'Deleted event'
    ? snapshot
    : registration.event?.name || snapshot || 'Deleted event'
}

function registrationPassName(registration) {
  if (registration.passName && registration.passName !== 'Deleted pass') {
    return registration.passName
  }
  const snapshot = registration.passNameSnapshot
  return snapshot && snapshot !== 'Deleted pass'
    ? snapshot
    : (registration.pass?.name !== 'Deleted pass' ? registration.pass?.name : null) || snapshot || 'Deleted pass'
}

function registrationPassPrice(registration) {
  return registration.passPrice ?? registration.passPriceSnapshot ?? registration.pass?.price
}

function getPageItems(items, page) {
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIndex = (currentPage - 1) * PAGE_SIZE

  return {
    items: items.slice(startIndex, startIndex + PAGE_SIZE),
    currentPage,
    pageCount,
    startIndex,
  }
}

function Pagination({ total, page, onPageChange }) {
  if (total <= PAGE_SIZE) return null
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.min(page, pageCount)
  const firstItem = (currentPage - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(currentPage * PAGE_SIZE, total)

  return (
    <nav className="admin-pagination" aria-label="List pagination">
      <span>Showing {firstItem}–{lastItem} of {total}</span>
      <div>
        <button type="button" className="admin-secondary-button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
        <span className="admin-pagination-page">Page {currentPage} of {pageCount}</span>
        <button type="button" className="admin-secondary-button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === pageCount}>Next</button>
      </div>
    </nav>
  )
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDate(value, withTime = false) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleString('en-IN', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' })
}

function localDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function Icon({ name, className = '' }) {
  const paths = {
    overview: <><path d="M3 3h8v8H3z" /><path d="M13 3h8v5h-8z" /><path d="M13 10h8v11h-8z" /><path d="M3 13h8v8H3z" /></>,
    events: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    registrations: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.5-2L20 12M4 12l2.9 5a7 7 0 0 0 11.5-2" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m4 4v7m6-7v7" /></>,
    restore: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    qr: (<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3z" />
      <path d="M19 14v3h2" /><path d="M14 19h3v2" /><path d="M19 19h2v2" /></>),
  }
  return <svg className={`admin-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Metric({ label, value, note, icon, accent }) {
  return (
    <article className="admin-metric">
      <span className={`metric-symbol metric-${accent}`}><Icon name={icon} /></span>
      <div><p>{label}</p><strong>{value}</strong><span>{note}</span></div>
    </article>
  )
}

function EventDialog({ event, admin, onClose }) {
  const [formError, setFormError] = useState('')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detail, setDetail] = useState(event)
  const [passDialog, setPassDialog] = useState(null)

  async function reloadDetail() {
    if (!detail?.id) return
    setLoadingDetail(true)
    try {
      setDetail(await admin.getEvent(detail.id))
    } catch (error) {
      setFormError(error.message || 'Unable to load event passes.')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleEventSubmit(formEvent) {
    formEvent.preventDefault()
    setFormError('')
    const form = new FormData(formEvent.currentTarget)
    const payload = {
      name: sanitizeName(form.get('name')).trim(),
      description: form.get('description').trim(),
      location: form.get('location').trim(),
      startDate: new Date(form.get('startDate')).toISOString(),
      endDate: new Date(form.get('endDate')).toISOString(),
    }
    if (new Date(payload.endDate) <= new Date(payload.startDate)) {
      setFormError('End date must be later than the start date.')
      return
    }
    const saved = await admin.saveEvent(detail?.id, payload)
    if (!saved || saved === true) {
      if (saved === true && !detail?.id) onClose()
      else setFormError(admin.error || 'Unable to save event details.')
      return
    }
    if (event?.id) {
      await reloadDetail()
    } else {
      onClose()
    }
  }

  async function handleDeleteEvent() {
    if (!detail?.id || !window.confirm(`Move “${detail.name}” and its passes to trash? You can restore them later.`)) return
    const removed = await admin.removeEvent(detail.id)
    if (removed) onClose()
    else setFormError(admin.error || 'Unable to delete event.')
  }

  const passes = Array.isArray(detail?.passes) ? detail.passes : []

  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-dialog event-editor" role="dialog" aria-modal="true" aria-labelledby="event-editor-title">
        <div className="admin-dialog-heading">
          <div><span className="admin-kicker">EVENT MANAGEMENT</span><h2 id="event-editor-title">{event?.id ? 'Edit event' : 'Create an event'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close event editor"><Icon name="close" /></button>
        </div>
        <form className="admin-form" onSubmit={handleEventSubmit}>
          <div className="admin-form-grid">
            <label className="wide-field">Event name<NameInput name="name" defaultValue={sanitizeName(event?.name || '')} required maxLength="100" placeholder="e.g. Summer makers market" /></label>
            <label>Location<input name="location" defaultValue={event?.location || ''} placeholder="City or venue" /></label>
            <label>Starts<input name="startDate" type="datetime-local" defaultValue={localDateTime(event?.startDate)} required /></label>
            <label>Ends<input name="endDate" type="datetime-local" defaultValue={localDateTime(event?.endDate)} required /></label>
            <label className="wide-field">Description<textarea name="description" defaultValue={event?.description || ''} rows="3" placeholder="What should guests know?" /></label>
          </div>
          {formError && <p className="admin-form-error" role="alert">{formError}</p>}
          <div className="admin-form-actions">
            {event?.id && <button type="button" className="admin-danger-text" onClick={handleDeleteEvent}><Icon name="trash" /> Move event to trash</button>}
            <button className="admin-primary-button" disabled={admin.busy}>{admin.busy ? 'Saving…' : event?.id ? 'Save event' : 'Create event'} <Icon name="arrow" /></button>
          </div>
        </form>
        {detail?.id && (
          <section className="pass-management">
            <div className="pass-management-heading"><div><span className="admin-kicker">TICKETS & CAPACITY</span><h3>Passes</h3></div><button className="admin-secondary-button compact-button" onClick={() => setPassDialog({})}><Icon name="plus" /> Add pass</button></div>
            {loadingDetail ? <p className="admin-muted">Loading passes…</p> : passes.length ? (
              <div className="managed-pass-list">
                {passes.map((pass) => <div className="managed-pass-row" key={pass.id}>
                  <div><strong>{pass.name}</strong><span>{Number(pass.soldSlots || 0)} sold of {pass.totalSlots} · {formatMoney(pass.price)}</span></div>
                  <div className="managed-pass-actions"><button className="icon-button small-icon-button" onClick={() => setPassDialog(pass)} aria-label={`Edit ${pass.name}`}><Icon name="edit" /></button><button className="icon-button small-icon-button danger-icon" onClick={async () => { if (window.confirm(`Move pass “${pass.name}” to trash? You can restore it later.`)) { const removed = await admin.removePass(detail.id, pass.id); if (removed) await reloadDetail() } }} aria-label={`Move ${pass.name} to trash`}><Icon name="trash" /></button></div>
                </div>)}
              </div>
            ) : <p className="admin-muted">No passes yet. Add a pass to open reservations.</p>}
          </section>
        )}
        {passDialog && <PassDialog eventId={detail.id} pass={passDialog.id ? passDialog : null} admin={admin} onClose={() => setPassDialog(null)} onSaved={async () => { setPassDialog(null); await reloadDetail() }} />}
      </section>
    </div>
  )
}

function PassDialog({ eventId, pass, admin, onClose, onSaved }) {
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await admin.savePass(eventId, pass?.id, {
      name: sanitizeName(form.get('name')).trim(),
      description: form.get('description').trim(),
      price: Number(form.get('price')),
      totalSlots: Number(form.get('totalSlots')),
    })
    if (result) await onSaved()
    else setError(admin.error || 'Unable to save pass.')
  }

  return (
    <div className="admin-modal-backdrop nested-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-dialog pass-editor" role="dialog" aria-modal="true" aria-labelledby="pass-editor-title">
        <div className="admin-dialog-heading"><div><span className="admin-kicker">EVENT PASS</span><h2 id="pass-editor-title">{pass ? 'Edit pass' : 'Add a pass'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close pass editor"><Icon name="close" /></button></div>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>Pass name<NameInput name="name" defaultValue={sanitizeName(pass?.name || '')} required /></label>
          <label>Description<input name="description" defaultValue={pass?.description || ''} /></label>
          <div className="admin-form-grid"><label>Price (INR)<input name="price" type="number" min="0" step="0.01" defaultValue={pass?.price ?? 0} required /></label><label>Total slots<input name="totalSlots" type="number" min={Math.max(1, Number(pass?.soldSlots || 0))} step="1" defaultValue={pass?.totalSlots ?? 100} required /></label></div>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button><button className="admin-primary-button" disabled={admin.busy}>{admin.busy ? 'Saving…' : 'Save pass'} <Icon name="arrow" /></button></div>
        </form>
      </section>
    </div>
  )
}

function AdminPanel({ visitor }) {
  const admin = useAdminController(visitor.token)
  const [eventDialog, setEventDialog] = useState(null)
  const [eventSearch, setEventSearch] = useState('')
  const [registrationSearch, setRegistrationSearch] = useState('')
  const [eventPage, setEventPage] = useState(1)
  const [registrationPage, setRegistrationPage] = useState(1)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const sortedEvents = useMemo(() => [...admin.events].sort((left, right) => {
    const leftEnded = left.isActive === false
    const rightEnded = right.isActive === false
    const leftDate = Date.parse(left.startDate) || 0
    const rightDate = Date.parse(right.startDate) || 0
    if (leftEnded !== rightEnded) return leftEnded ? 1 : -1
    return leftEnded ? rightDate - leftDate : leftDate - rightDate
  }), [admin.events])
  const filteredEvents = useMemo(() => sortedEvents.filter((event) => `${event.name} ${event.location || ''}`.toLowerCase().includes(eventSearch.trim().toLowerCase())), [sortedEvents, eventSearch])
  const sortedRegistrations = useMemo(() => [...admin.registrations].sort((left, right) => (Date.parse(right.createdAt) || 0) - (Date.parse(left.createdAt) || 0)), [admin.registrations])
  const filteredRegistrations = useMemo(() => {
    return sortedRegistrations.filter((registration) => {
      const matchesSearch =
        `${registration.attendeeName || ''} ${registration.email || ''
          } ${registrationEventName(registration)} ${registrationPassName(registration)}
          }`
          .toLowerCase()
          .includes(registrationSearch.trim().toLowerCase())

      return matchesSearch
    })
  }, [sortedRegistrations, registrationSearch])
  const pagedEvents = getPageItems(filteredEvents, eventPage)
  const pagedRegistrations = getPageItems(filteredRegistrations, registrationPage)

  const summary = admin.summary || {}

  function changeSection(section) {
    admin.selectSection(section)
    setMobileNavOpen(false)
  }

  // ****
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setMobileNavOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  async function viewEventRegistrations(event) {
    if (!event?.id) return
    setMobileNavOpen(false)
    await admin.viewEventRegistrations(event)
  }

  async function editEvent(event) {
    try {
      setEventDialog(await admin.getEvent(event.id))
    } catch (error) {
      setEventDialog(null)
      window.alert(error.message || 'Unable to load the event.')
    }
  }

  function backToRegistrations() {
    admin.backToRegistrations()
  }

  return (
    <div className="admin-shell">
      {mobileNavOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="admin-brand" href="/?page=admin"><span className="admin-brand-mark">g</span><span>gather<span>.</span><small>ADMIN CONSOLE</small></span></a>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {[
            ['overview', 'Overview', 'overview'],
            ['events', 'Events', 'events'],
            ['registrations', 'Registrations', 'registrations'],
            ['trash', 'Trash', 'trash'],
            ['scanner', 'Scan QR', 'qr'],
          ].map(([section, label, icon]) => (
            <button
              key={section}
              className={
                admin.section === section
                  ? 'admin-nav-active'
                  : ''
              }
              onClick={() => changeSection(section)}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {section === 'events' && (
                <b>{admin.events.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="admin-user-chip"><span className="admin-user-avatar">{visitor.email?.[0]?.toUpperCase() || 'A'}</span><span><strong>{visitor.email || 'Administrator'}</strong><small>Administrator</small></span></div><button className="admin-view-as-visitor" onClick={visitor.viewAsVisitor}><Icon name="eye" /> View as visitor</button><button className="admin-signout" onClick={visitor.signOut}>Sign out <Icon name="arrow" /></button></div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">{!mobileNavOpen && (
          <button
            className="admin-mobile-menu"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open admin navigation"
          >
            ☰
          </button>
        )}        <div><span className="admin-breadcrumb">Workspace</span><span className="breadcrumb-divider">/</span><strong>{admin.registrationId ? `Registration #${admin.registrationId}` : admin.section === 'overview' ? 'Overview' : admin.section === 'events' ? 'Events' : admin.section === 'trash' ? 'Trash' : admin.section === 'scanner' ? 'Scan QR' : 'Registrations'}</strong></div><button className="admin-refresh" onClick={() => admin.refresh()} disabled={admin.loading}><Icon name="refresh" /> <span>{admin.loading ? 'Refreshing' : 'Refresh data'}</span></button></header>
        <div className="admin-content">
          {admin.error && <div className="admin-alert" role="alert"><span>{admin.error}</span><button onClick={() => admin.refresh()}>Retry</button></div>}
          {admin.section === 'overview' && <>
            <div className="admin-page-title"><div><span className="admin-kicker">EVENT OPERATIONS</span><h1>Overview</h1><p>A clear view of your events and attendance.</p></div><button className="admin-primary-button" onClick={() => setEventDialog({})}><Icon name="plus" /> New event</button></div>
            <div className="admin-metrics">
              <Metric label="Total revenue" value={formatMoney(summary.totalRevenue)} note="Across all registrations" icon="overview" accent="green" />
              <Metric label="Registrations" value={summary.totalRegistrations ?? '—'} note={`${summary.totalSoldSlots ?? 0} tickets reserved`} icon="registrations" accent="coral" />
              <Metric label="Active events" value={summary.activeEvents ?? '—'} note={`${summary.upcomingEvents ?? 0} upcoming`} icon="events" accent="gold" />
              <Metric label="Pass types" value={summary.totalPasses ?? '—'} note="Across all events" icon="overview" accent="blue" />
            </div>
            <section className="admin-panel-section">
              <div className="admin-section-heading"><div><span className="admin-kicker">YOUR CALENDAR</span><h2>Recent events</h2></div><button className="admin-link-button" onClick={() => changeSection('events')}>View all <Icon name="arrow" /></button></div>
              <EventTable events={sortedEvents.slice(0, 5)} onEdit={editEvent} onView={viewEventRegistrations} />
            </section>
            <section className="admin-panel-section recent-registrations">
              <div className="admin-section-heading"><div><span className="admin-kicker">ATTENDEE ACTIVITY</span><h2>Latest registrations</h2></div><button className="admin-link-button" onClick={() => changeSection('registrations')}>View all <Icon name="arrow" /></button></div>
              <RegistrationTable registrations={sortedRegistrations.slice(0, 5)} onView={admin.viewRegistration} onDelete={admin.removeRegistration} busy={admin.busy} />
            </section>
          </>}
          {admin.section === 'events' && <>
            <div className="admin-page-title"><div><span className="admin-kicker">EVENT CATALOG</span><h1>Events</h1><p>Create, update, and manage passes for your events.</p></div><button className="admin-primary-button" onClick={() => setEventDialog({})}><Icon name="plus" /> New event</button></div>
            <div className="admin-toolbar"><label className="admin-search"><span>⌕</span><input value={eventSearch} onChange={(event) => { setEventSearch(event.target.value); setEventPage(1) }} placeholder="Search events or locations" /></label><span className="admin-results-count">{filteredEvents.length} events</span></div>
            {admin.loading ? <AdminLoading /> : <EventTable events={pagedEvents.items} onEdit={editEvent} onView={viewEventRegistrations} />}
            {!admin.loading && <Pagination total={filteredEvents.length} page={pagedEvents.currentPage} onPageChange={setEventPage} />}
          </>}
          {admin.section === 'trash' && <TrashSection admin={admin} />}
          {admin.section === 'registrations' &&
            admin.registrationId ? (
            <RegistrationDetail
              key={`${admin.registrationId}:${admin.detailRefreshKey}`}
              registrationId={admin.registrationId}
              admin={admin}
              onBack={backToRegistrations}
            />
          ) : admin.section === 'registrations' ? (
            <>
              <div className="admin-page-title">
                <div>
                  <span className="admin-kicker">
                    ATTENDEE DIRECTORY
                  </span>

                  <h1>
                    {admin.eventId
                      ? `${admin.events.find(
                        (event) => String(event.id) === String(admin.eventId),
                      )?.name || 'Event'
                      } Registrations`
                      : 'Registrations'}
                  </h1>
                  <p>
                    {admin.eventId
                      ? 'Showing registrations for this event.'
                      : 'Review reservations and ticket allocations.'}
                  </p>
                </div>
                {admin.eventId && (
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => admin.selectSection('registrations')}
                  >
                    View all registrations
                  </button>
                )}
              </div>

              <div className="admin-toolbar">
                <label className="admin-search">
                  <span>⌕</span>

                  <input
                    value={registrationSearch}
                    onChange={(event) => {
                      setRegistrationSearch(event.target.value)
                      setRegistrationPage(1)
                    }}
                    placeholder="Search attendee, event, or pass"
                  />
                </label>

                <span className="admin-results-count">
                  {filteredRegistrations.length} registrations
                </span>
              </div>

              {admin.loading ? (
                <AdminLoading />
              ) : (
                <RegistrationTable
                  registrations={pagedRegistrations.items}
                  onView={admin.viewRegistration}
                  onDelete={admin.removeRegistration}
                  busy={admin.busy}
                />
              )}
              {!admin.loading && <Pagination total={filteredRegistrations.length} page={pagedRegistrations.currentPage} onPageChange={setRegistrationPage} />}
            </>
          ) : null}

          {admin.section === 'scanner' && (
            <AdminQrScanner admin={admin} />
          )}
        </div>
      </main>
      {admin.notice && <div className="admin-toast" role="status"><span>{admin.notice.message}</span><button onClick={admin.dismissNotice} aria-label="Dismiss notification"><Icon name="close" /></button></div>}
      {eventDialog && <EventDialog key={eventDialog.id || 'new'} event={eventDialog} admin={admin} onClose={() => setEventDialog(null)} />}
    </div>
  )
}

function EventTable({ events, onEdit, onView }) {
  if (!events.length) return <div className="admin-empty"><span className="empty-calendar"><Icon name="events" /></span><h3>No events yet</h3><p>Create an event to begin managing your calendar.</p></div>
  return (
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>EVENT</th><th>LOCATION</th><th>DATE</th><th>STATUS</th><th /></tr></thead><tbody>{events.map((event) => <tr key={event.id}>
      <td><strong className="table-primary">{event.name}</strong><span className="table-secondary">{event.description || 'No description added'}</span></td>
      <td><span className="table-location"><Icon name="pin" />{event.location || 'Not set'}</span></td>
      <td><span className="table-date">{formatDate(event.startDate)}</span><span className="table-secondary">Ends {formatDate(event.endDate)}</span></td>
      <td><span className={`admin-status ${event.isActive === false ? 'is-inactive' : 'is-active'}`}><i />{event.isActive === false ? 'Ended' : 'Active'}</span></td>
      <td>
        <button className="admin-secondary-button row-edit-button" onClick={() => onEdit(event)}><Icon name="edit" /> Manage</button>
        <button className="admin-secondary-button row-view-button" onClick={() => onView(event)}><Icon name="eye" /> Registrations</button>
      </td>
    </tr>)}</tbody></table></div>
  )
}

function RegistrationTable({ registrations, onView, onDelete, busy }) {
  async function handleDelete(registration) {
    const attendee = registration.attendeeName || 'this visitor'
    if (!window.confirm(`Move ${attendee}'s registration to trash? You can restore it later.`)) return
    await onDelete(registration.id)
  }

  if (!registrations.length) return <div className="admin-empty compact-empty"><span className="empty-calendar"><Icon name="registrations" /></span><h3>No registrations yet</h3><p>Visitor bookings will appear here.</p></div>
  return (
    <div className="admin-table-wrap"><table className="admin-table registration-table"><thead><tr><th>ATTENDEE</th><th>EVENT & PASS</th><th>REGISTERED</th><th>VISIT DATE</th><th>PEOPLE</th><th>AMOUNT</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{registrations.map((registration, index) => <tr key={registration.id || `${registration.email}-${index}`}>
      <td><strong className="table-primary">{registration.attendeeName || 'Visitor'}</strong><span className="table-secondary">{registration.email || 'No email provided'}</span></td>
      <td><strong className="table-primary">{registrationEventName(registration)}</strong><span className="table-secondary">{registrationPassName(registration)}{registrationPassPrice(registration) != null && ` · ${formatMoney(registrationPassPrice(registration))} per person`}</span></td>
      <td><span className="table-date">{formatDate(registration.createdAt, true)}</span></td>
      <td><span className="table-date">{formatDate(registration.selectedDate)}</span></td>
      <td><span className="people-count">{registration.quantity ?? 1}</span></td>
      <td><strong className="amount-cell">{formatMoney(registration.amount)}</strong></td>
      <td><span className={`payment-status ${registration.status}`}><i />{registration.status}</span></td>
      <td className="registration-actions"><button className="admin-secondary-button row-edit-button registration-view-button" onClick={() => onView(registration.id)} aria-label={`View registration ${registration.id}`}><Icon name="eye" /> View</button><button className="admin-secondary-button row-edit-button registration-delete-button" onClick={() => handleDelete(registration)} disabled={busy} aria-label={`Move registration ${registration.id} to trash`}><Icon name="trash" /> Delete</button></td>
    </tr>)}</tbody></table></div>
  )
}

function RegistrationDetail({ registrationId, admin, onBack }) {
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { getRegistration } = admin

  async function handleDelete() {
    if (!window.confirm('Move this registration to trash? You can restore it later.')) return
    const deleted = await admin.removeRegistration(registrationId)
    if (deleted) onBack()
  }

  useEffect(() => {
    let active = true
    getRegistration(registrationId)
      .then((result) => {
        if (active) setRegistration(result)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load registration details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [getRegistration, registrationId])

  return (
    <section className="registration-detail">
      <div className="admin-page-title registration-detail-heading">
        <div><span className="admin-kicker">REGISTRATION DETAILS</span><h1>Registration #{registrationId}</h1><p>Complete attendee and reservation information.</p></div>
        <div className="registration-detail-actions">
          <button className="admin-danger-text" onClick={handleDelete} disabled={admin.busy}><Icon name="trash" /> Move to trash</button>
          <button className="admin-secondary-button" onClick={onBack}><Icon name="arrow" className="back-arrow" /> Back to registrations</button>
        </div>
      </div>
      {loading ? <AdminLoading /> : error ? <div className="admin-alert" role="alert">{error}</div> : registration ? <>
        <div className="registration-detail-grid">
          <article className="registration-detail-card">
            <span className="admin-kicker">ATTENDEE</span>
            <h2>{registration.attendeeName || 'Visitor'}</h2>
            <dl className="registration-detail-list">
              <div><dt>Email</dt><dd>{registration.email || 'Not provided'}</dd></div>
              <div><dt>Phone</dt><dd>{registration.phone || 'Not provided'}</dd></div>
              <div><dt>User ID</dt><dd>{registration.userId ?? 'Not available'}</dd></div>
            </dl>
          </article>
          <article className="registration-detail-card">
            <span className="admin-kicker">RESERVATION</span>
            <h2>{registrationEventName(registration)}</h2>
            <dl className="registration-detail-list">
              <div><dt>Pass</dt><dd>{registrationPassName(registration)}</dd></div>
              {registrationPassPrice(registration) != null && <div><dt>Pass price</dt><dd>{formatMoney(registrationPassPrice(registration))} per person</dd></div>}
              <div><dt>Visit date</dt><dd>{formatDate(registration.selectedDate)}</dd></div>
              <div><dt>Registered</dt><dd>{formatDate(registration.createdAt, true)}</dd></div>
              <div><dt>Quantity</dt><dd>{registration.quantity ?? 1}</dd></div>
              <div><dt>Amount</dt><dd>{formatMoney(registration.amount)}</dd></div>
              <div><dt>Payment status</dt><dd><span className={`payment-status ${registration.status || ''}`}>{registration.status || 'Unknown'}</span></dd></div>
            </dl>
          </article>
        </div>
      </> : <div className="admin-alert" role="alert">Registration details were not returned.</div>}
    </section>
  )
}

function TrashSection({ admin }) {
  const [eventPage, setEventPage] = useState(1)
  const [passPage, setPassPage] = useState(1)
  const [registrationPage, setRegistrationPage] = useState(1)
  const pagedEvents = getPageItems(admin.deletedEvents, eventPage)
  const pagedPasses = getPageItems(admin.deletedPasses, passPage)
  const pagedRegistrations = getPageItems(admin.deletedRegistrations, registrationPage)

  async function restoreEvent(event) {
    if (window.confirm(`Restore “${event.name}”? Passes deleted with this event will also be restored.`)) {
      await admin.restoreEvent(event.id)
    }
  }

  async function permanentlyDeleteEvent(event) {
    if (window.confirm(`Permanently delete “${event.name}” and its passes? This cannot be undone.`)) {
      await admin.permanentlyDeleteEvent(event.id)
    }
  }

  async function restorePass(pass) {
    if (pass.deletedWithEvent) return
    if (window.confirm(`Restore pass “${pass.name}”?`)) {
      await admin.restorePass(pass.eventId, pass.id)
    }
  }

  async function permanentlyDeletePass(pass) {
    if (window.confirm(`Permanently delete pass “${pass.name}”? This cannot be undone.`)) {
      await admin.permanentlyDeletePass(pass.eventId, pass.id)
    }
  }

  async function restoreRegistration(registration) {
    if (window.confirm(`Restore registration #${registration.id} for ${registration.attendeeName || 'this visitor'}?`)) {
      await admin.restoreRegistration(registration.id)
    }
  }

  async function permanentlyDeleteRegistration(registration) {
    if (window.confirm(`Permanently delete registration #${registration.id} for ${registration.attendeeName || 'this visitor'}? This cannot be undone.`)) {
      await admin.permanentlyDeleteRegistration(registration.id)
    }
  }

  const actionButton = (label, onClick, disabled = false) => (
    <button className="admin-secondary-button row-edit-button" onClick={onClick} disabled={disabled || admin.busy}>
      <Icon name={label === 'Restore' ? 'restore' : 'trash'} /> {label}
    </button>
  )

  return (
    <>
      <div className="admin-page-title">
        <div><span className="admin-kicker">RECOVER OR REMOVE RECORDS</span><h1>Trash</h1><p>Restore deleted records or permanently remove them.</p></div>
      </div>
      {admin.loading ? <AdminLoading /> : (
        <div className="trash-sections">
          <section className="admin-panel-section">
            <div className="admin-section-heading"><div><span className="admin-kicker">EVENTS</span><h2>Deleted events <span className="trash-count">{admin.deletedEvents.length}</span></h2></div></div>
            {admin.deletedEvents.length ? <><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>EVENT</th><th>LOCATION</th><th>DELETED</th><th>ACTIONS</th></tr></thead><tbody>{pagedEvents.items.map((event) => <tr key={event.id}>
              <td><strong className="table-primary">{event.name}</strong><span className="table-secondary">{event.description || 'No description added'}</span></td>
              <td>{event.location || 'Not set'}</td><td>{formatDate(event.deletedAt, true)}</td>
              <td className="trash-actions">{actionButton('Restore', () => restoreEvent(event))}{actionButton('Delete forever', () => permanentlyDeleteEvent(event))}</td>
            </tr>)}</tbody></table></div><Pagination total={admin.deletedEvents.length} page={pagedEvents.currentPage} onPageChange={setEventPage} /></> : <TrashEmpty label="No deleted events" />}
          </section>
          <section className="admin-panel-section">
            <div className="admin-section-heading"><div><span className="admin-kicker">PASSES</span><h2>Deleted passes <span className="trash-count">{admin.deletedPasses.length}</span></h2></div></div>
            {admin.deletedPasses.length ? <><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>PASS</th><th>EVENT</th><th>DELETED</th><th>ACTIONS</th></tr></thead><tbody>{pagedPasses.items.map((pass) => <tr key={pass.id}>
              <td><strong className="table-primary">{pass.name}</strong><span className="table-secondary">{formatMoney(pass.price)} · {pass.totalSlots} slots</span></td>
              <td>{pass.eventName}{pass.deletedWithEvent && <span className="table-secondary">Deleted with event</span>}</td><td>{formatDate(pass.deletedAt, true)}</td>
              <td className="trash-actions">{actionButton('Restore', () => restorePass(pass), pass.deletedWithEvent)}{actionButton('Delete forever', () => permanentlyDeletePass(pass))}</td>
            </tr>)}</tbody></table></div><Pagination total={admin.deletedPasses.length} page={pagedPasses.currentPage} onPageChange={setPassPage} /></> : <TrashEmpty label="No deleted passes" />}
          </section>
          <section className="admin-panel-section">
            <div className="admin-section-heading"><div><span className="admin-kicker">REGISTRATIONS</span><h2>Deleted registrations <span className="trash-count">{admin.deletedRegistrations.length}</span></h2></div></div>
            {admin.deletedRegistrations.length ? <><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ATTENDEE</th><th>EVENT & PASS</th><th>DELETED</th><th>ACTIONS</th></tr></thead><tbody>{pagedRegistrations.items.map((registration) => <tr key={registration.id}>
              <td><strong className="table-primary">{registration.attendeeName || 'Visitor'}</strong><span className="table-secondary">Registration #{registration.id}</span></td>
              <td><strong className="table-primary">{registration.eventName || registration.eventNameSnapshot || 'Deleted event'}</strong><span className="table-secondary">{registration.passName || registration.passNameSnapshot || 'Deleted pass'}{registration.passPrice != null && ` · ${formatMoney(registration.passPrice)} per person`} · {registration.quantity} {Number(registration.quantity) === 1 ? 'person' : 'people'} · {formatMoney(registration.amount)} total</span></td>
              <td>{formatDate(registration.deletedAt, true)}</td>
              <td className="trash-actions">{actionButton('Restore', () => restoreRegistration(registration))}{actionButton('Delete forever', () => permanentlyDeleteRegistration(registration))}</td>
            </tr>)}</tbody></table></div><Pagination total={admin.deletedRegistrations.length} page={pagedRegistrations.currentPage} onPageChange={setRegistrationPage} /></> : <TrashEmpty label="No deleted registrations" />}
          </section>
        </div>
      )}
    </>
  )
}

function TrashEmpty({ label }) {
  return <div className="admin-empty compact-empty"><span className="empty-calendar"><Icon name="trash" /></span><h3>{label}</h3><p>Deleted items will appear here.</p></div>
}

function AdminLoading() {
  return <div className="admin-loading"><span /><span /><span /></div>
}

export default AdminPanel