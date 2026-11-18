import { useEffect, useRef, useState } from 'react'
import NameInput from './NameInput.jsx'
import { sanitizeName } from '../utils/nameText.js'
import { QRCodeSVG } from 'qrcode.react'

const eventImages = [
  'photo-1506157786151-b8491531f063',
  'photo-1514525253161-7a46d19cd819',
  'photo-1511795409834-ef04bbd61622',
  'photo-1492684223066-81342ee5ff30',
]

function imageUrl(id, width = 1000) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`
}

function dateLabel(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return 'Date to be announced'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date to be announced' : date.toLocaleDateString('en-US', options)
}

function timeLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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

function formatPrice(value) {
  const amount = Number(value || 0)
  return amount === 0
    ? 'Free'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function Header({ visitor }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    if (!profileMenuOpen) return undefined

    function closeOnOutsideClick(event) {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setProfileMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileMenuOpen])

  function navigateTo(page) {
    setProfileMenuOpen(false)
    visitor.openPage(page)
  }

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Gather home" onClick={(event) => {
        event.preventDefault()
        visitor.openPage('discover')
      }}>
        <span className="brand-mark" aria-hidden="true">g</span>
        <span>gather<span className="brand-period">.</span></span>
      </a>
      <div className="header-actions">
        {visitor.role === 'admin' && visitor.adminVisitorMode && <button className="return-user-button" onClick={visitor.returnToAdmin}>← <span>Admin panel</span></button>}
        {visitor.token ? (
          <div className="account-menu" ref={profileMenuRef} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setProfileMenuOpen(false)
          }}>
            <button className="account-button" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              <span className="account-avatar">{visitor.email?.[0]?.toUpperCase() || 'V'}</span>
            </button>
            {profileMenuOpen && <div className="profile-popover" role="menu">
              <div className="profile-popover-heading"><strong>{visitor.email || 'Gather account'}</strong><span>{visitor.role === 'admin' ? 'Administrator' : 'Visitor account'}</span></div>
              <button role="menuitem" onClick={() => navigateTo('profile')}>Profile</button>
              <button role="menuitem" onClick={() => navigateTo('my-events')}>My events</button>
              <div className="profile-popover-divider" />
              <button className="profile-logout" role="menuitem" onClick={() => { setProfileMenuOpen(false); visitor.signOut() }}>Log out</button>
            </div>}
          </div>
        ) : (
          <button className="sign-in-button" onClick={() => visitor.setAuthOpen(true)}>Sign in <span aria-hidden="true">↗</span></button>
        )}
      </div>
    </header>
  )
}

function Hero({ featuredEvent, onExplore }) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot" /> GOOD THINGS HAPPEN TOGETHER</p>
        <h1>Make room for<br /><span>something memorable.</span></h1>
        <p className="hero-description">Find your next favorite thing, from the people making it happen.</p>
        <button className="primary-button hero-button" onClick={onExplore}>Explore what’s on <span aria-hidden="true">↓</span></button>
        <div className="hero-footnote"><span className="avatar-stack"><i>J</i><i>M</i><i>A</i></span><span>Good company. Better plans.</span></div>
      </div>
      <div className="hero-visual" role="img" aria-label="A crowd enjoying a live event">
        <img src={imageUrl('photo-1506157786151-b8491531f063', 1400)} alt="A crowd gathered beneath the lights at a live event" />
        <div className="hero-image-shade" />
        <div className="image-caption">
          <span className="caption-kicker">THE NEXT GOOD PLAN</span>
          <strong>{featuredEvent?.name || 'A little more life, together.'}</strong>
          <span>{featuredEvent ? `${dateLabel(featuredEvent.startDate)}${featuredEvent.location ? ` · ${featuredEvent.location}` : ''}` : 'Discover experiences worth leaving home for.'}</span>
        </div>
        <span className="hero-sticker" aria-hidden="true">BE<br />THERE</span>
      </div>
    </section>
  )
}

function EventCard({ event, index, onOpen }) {
  const image = eventImages[index % eventImages.length]
  const ended = event.isActive === false
  return (
    <article className={`event-card${ended ? ' event-card-ended' : ''}`}>
      <button className="event-image-button" disabled={ended} onClick={() => onOpen(event)} aria-label={ended ? `${event.name}, event ended` : `View ${event.name}`}>
        <img src={imageUrl(image, 900)} alt={`${event.name} event`} loading="lazy" />
        <span className="image-category">{ended ? 'ENDED' : 'EXPERIENCE'}</span>
        {!ended && <span className="image-arrow" aria-hidden="true">↗</span>}
      </button>
      <div className="event-card-content">
        <div className="event-card-date">{dateLabel(event.startDate, { month: 'short', day: 'numeric' }).toUpperCase()}</div>
        <h3>{event.name}</h3>
        <p className="event-card-description">{event.description || 'A good reason to get out, meet up, and make a day of it.'}</p>
        <div className="event-card-meta">
          <span><span className="meta-pin" aria-hidden="true">⌖</span>{event.location || 'Location to be announced'}</span>
          <button disabled={ended} onClick={() => onOpen(event)} aria-label={ended ? `${event.name}, event ended` : `Details for ${event.name}`}>{ended ? 'Ended' : 'Details'} {!ended && <span aria-hidden="true">→</span>}</button>
        </div>
      </div>
    </article>
  )
}

function EventDetails({ event, loading, onClose, onReserve }) {
  if (loading) return <section className="event-detail-page"><div className="event-detail-state">Loading event details…</div></section>
  if (!event) return <section className="event-detail-page"><div className="event-detail-state"><h1>Event unavailable</h1><button className="secondary-button" onClick={onClose}>Back to events</button></div></section>

  const passes = Array.isArray(event.passes) ? event.passes.filter((pass) => pass.isActive !== false) : []
  const image = eventImages[(Number(event.id) || 0) % eventImages.length]

  return (
    <article className="event-detail-page">
      <div className="event-detail-toolbar"><button className="event-back-button" onClick={onClose}>← <span>All events</span></button></div>
      <div className="event-detail-hero">
        <img src={imageUrl(image, 1600)} alt={`${event.name} event`} />
        <div className="event-detail-hero-shade" />
        <div className="event-detail-title"><span className="detail-kicker">GATHER EXPERIENCE</span><h1>{event.name}</h1><p>{event.location || 'Location to be announced'}</p></div>
      </div>
      <div className="event-detail-body">
        <section className="event-overview">
          <ScrollReveal className="event-date-facts">
            <div><span>DATES</span><strong>{dateLabel(event.startDate)}{event.endDate && new Date(event.endDate).toDateString() !== new Date(event.startDate).toDateString() ? ` – ${dateLabel(event.endDate)}` : ''}</strong></div>
            <div><span>START TIME</span><strong>{timeLabel(event.startDate) || 'See event schedule'}</strong></div>
            <div><span>LOCATION</span><strong>{event.location || 'To be announced'}</strong></div>
            <div><span>STATUS</span><strong className={event.isActive === false ? 'detail-inactive' : 'detail-active'}>{event.isActive === false ? 'Registration closed' : 'Registration open'}</strong></div>
          </ScrollReveal>
          <ScrollReveal className="event-description-block"><p className="eyebrow">ABOUT THIS EVENT</p><h2>A day worth showing up for.</h2><p>{event.description || 'Event details will be added soon.'}</p></ScrollReveal>
        </section>
        <section className="event-passes-section">
          <ScrollReveal className="passes-section-heading"><div><p className="eyebrow">PICK YOUR EXPERIENCE</p><h2>Passes & inclusions</h2></div><span>{passes.length} {passes.length === 1 ? 'pass type' : 'pass types'}</span></ScrollReveal>
          {passes.length ? <div className="event-pass-grid">{passes.map((pass) => {
            const remaining = Math.max(0, Number(pass.totalSlots || 0) - Number(pass.soldSlots || 0))
            const soldOut = remaining === 0
            const capacity = Number(pass.totalSlots || 0) > 0 ? Math.min(100, Number(pass.soldSlots || 0) / Number(pass.totalSlots) * 100) : 0
            return <ScrollReveal className="event-pass-reveal" key={pass.id}>
              <article className="event-pass-card">
                <div className="event-pass-topline"><span>PASS {String(pass.id).padStart(2, '0')}</span><strong>{formatPrice(pass.price)}</strong></div>
                <h3>{pass.name}</h3>
                <p className="event-pass-inclusion-title">What’s included</p>
                <p className="event-pass-description">{pass.description || 'Pass details have not been provided.'}</p>
                <div className="event-pass-capacity"><div><span>{soldOut ? 'Sold out' : `${remaining} spots remaining`}</span><span>{pass.totalSlots} total</span></div><div className="capacity-track"><span style={{ width: `${capacity}%` }} /></div></div>
                <button className="primary-button event-pass-cta" disabled={soldOut || event.isActive === false} onClick={() => onReserve(pass)}>{soldOut ? 'Sold out' : 'Reserve this pass'} <span aria-hidden="true">→</span></button>
              </article>
            </ScrollReveal>
          })}</div> : <ScrollReveal className="event-no-passes"><h3>Passes coming soon</h3><p>Pass information has not been published for this event yet.</p></ScrollReveal>}
          <p className="pass-facilities-note">Pass inclusions are based on the event organizer’s pass description.</p>
        </section>
      </div>
    </article>
  )
}

function AuthDialog({ open, onClose, onSubmit, onRequestCode, onCompleteSignup, onRequestPasswordReset, onResetPassword, submitting, intent }) {
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')
  const [signupStep, setSignupStep] = useState('contact')
  const [signupDetails, setSignupDetails] = useState(null)
  const [developmentCode, setDevelopmentCode] = useState('')
  const [resetCodeSent, setResetCodeSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await onSubmit({ email: form.get('email'), password: form.get('password') })
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.')
    }
  }

  async function handleRequestCode(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const details = {
      email: form.get('email'),
      phone: form.get('phone'),
      password: form.get('password'),
      confirmPassword: form.get('confirmPassword'),
    }
    if (details.password !== details.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    try {
      const result = await onRequestCode(details)
      setSignupDetails(details)
      setDevelopmentCode(result.otp || '')
      setSignupStep('profile')
    } catch (err) {
      setError(err.message || 'Unable to send a verification code.')
    }
  }

  async function handleCompleteSignup(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await onCompleteSignup({
        ...signupDetails,
        otp: form.get('otp'),
        firstName: sanitizeName(form.get('firstName')),
        lastName: sanitizeName(form.get('lastName')),
        gender: form.get('gender'),
        city: form.get('city'),
        company: form.get('company'),
      })
    } catch (err) {
      setError(err.message || 'Unable to complete your account.')
    }
  }

  async function handleRequestPasswordReset(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const email = form.get('email').trim()
    try {
      const result = await onRequestPasswordReset(email)
      setResetEmail(email)
      setDevelopmentCode(result.otp || '')
      setResetCodeSent(true)
    } catch (err) {
      setError(err.message || 'Unable to send a reset code.')
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const password = form.get('password')
    const confirmPassword = form.get('confirmPassword')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    try {
      await onResetPassword({
        email: resetEmail,
        otp: form.get('otp'),
        password,
        confirmPassword,
      })
      setMode('login')
      setResetCodeSent(false)
      setDevelopmentCode('')
      setResetMessage('Your password has been reset. Sign in with your new password.')
    } catch (err) {
      setError(err.message || 'Unable to reset your password.')
    }
  }

  function showLogin() {
    setMode('login')
    setSignupStep('contact')
    setResetCodeSent(false)
    setDevelopmentCode('')
    setError('')
  }

  return (
    <div className="modal-backdrop modal-top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close" onClick={onClose} aria-label="Close sign in">×</button>
        <div className="auth-symbol" aria-hidden="true">g.</div>
        <p className="eyebrow">GOOD TO HAVE YOU HERE</p>
        <h2 id="auth-title">{intent === 'admin' ? 'Administrator sign in' : mode === 'login' ? 'Sign in to reserve' : mode === 'forgot' ? resetCodeSent ? 'Reset your password' : 'Forgot password' : signupStep === 'contact' ? 'Create your account' : 'A few more details'}</h2>
        <p className="auth-intro">{intent === 'admin' ? 'Use an administrator account to open the operations workspace.' : mode === 'login' ? 'Use your Gather account to keep your plans together.' : mode === 'forgot' ? resetCodeSent ? `Enter the reset code sent to ${resetEmail}.` : 'Enter your account email and we’ll send a reset code if it matches an account.' : signupStep === 'contact' ? 'Verify your email and phone to get started.' : `Code sent to ${signupDetails?.email}.`}</p>
        {mode === 'login' ? (
          <form className="form-stack" onSubmit={handleSubmit}>
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Your password" required /></label>
            {resetMessage && <p className="signup-code" role="status">{resetMessage}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button full-button" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">→</span></button>
            {intent !== 'admin' && <button className="text-button auth-recovery-link" type="button" onClick={() => { setMode('forgot'); setResetMessage(''); setError('') }}>Forgot password?</button>}
          </form>
        ) : mode === 'forgot' && !resetCodeSent ? (
          <form className="form-stack" onSubmit={handleRequestPasswordReset}>
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button full-button" disabled={submitting}>{submitting ? 'Sending code…' : 'Send reset code'} <span aria-hidden="true">→</span></button>
          </form>
        ) : mode === 'forgot' ? (
          <form className="form-stack" onSubmit={handleResetPassword}>
            {developmentCode && <p className="signup-code">Development reset code: <strong>{developmentCode}</strong></p>}
            <label>Reset code<input name="otp" inputMode="numeric" autoComplete="one-time-code" minLength="6" maxLength="6" defaultValue={developmentCode} required /></label>
            <label>New password<input name="password" type="password" autoComplete="new-password" minLength="8" placeholder="At least 8 characters" required /></label>
            <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" placeholder="Enter password again" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button full-button" disabled={submitting}>{submitting ? 'Resetting password…' : 'Reset password'} <span aria-hidden="true">→</span></button>
          </form>
        ) : signupStep === 'contact' ? (
          <form key="signup-contact" className="form-stack" onSubmit={handleRequestCode}>
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" required /></label>
            <label>Password<input name="password" type="password" autoComplete="new-password" minLength="8" placeholder="At least 8 characters" required /></label>
            <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" placeholder="Enter password again" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button full-button" disabled={submitting}>{submitting ? 'Sending code…' : 'Send verification code'} <span aria-hidden="true">→</span></button>
          </form>
        ) : (
          <form key="signup-profile" className="form-stack" autoComplete="off" onSubmit={handleCompleteSignup}>
            {developmentCode && <p className="signup-code">Development verification code: <strong>{developmentCode}</strong></p>}
            <label>Verification code<input name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" minLength="6" maxLength="6" defaultValue={developmentCode} required /></label>
            <div className="form-grid">
              <label>First name<NameInput name="firstName" autoComplete="given-name" required /></label>
              <label>Last name<NameInput name="lastName" autoComplete="family-name" required /></label>
            </div>
            <div className="form-grid">
              <label>Gender<select name="gender" autoComplete="sex" defaultValue="" required>
                <option value="" disabled>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select></label>
              <label>City<input name="city" autoComplete="address-level2" required /></label>
            </div>
            <label>Company<input name="company" autoComplete="organization" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button full-button" disabled={submitting}>{submitting ? 'Creating account…' : 'Verify and continue'} <span aria-hidden="true">→</span></button>
          </form>
        )}
        {intent === 'admin' ? <p className="auth-note">Administrator credentials are required for this area.</p> : <p className="auth-note">{mode === 'login' ? <>New to Gather? <button className="text-button" onClick={() => { setMode('signup'); setResetMessage(''); setError('') }}>Create an account</button></> : mode === 'signup' ? <>Already have an account? <button className="text-button" onClick={showLogin}>Sign in</button></> : <>Remembered it? <button className="text-button" onClick={showLogin}>Back to sign in</button></>}</p>}
      </section>
    </div>
  )
}

function BookingDialog({ visitor }) {
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const event = visitor.bookingEvent
  const pass = visitor.selectedPass
  if (!visitor.bookingOpen || !event || !pass) return null

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)
  const remaining = Math.max(0, Number(pass.totalSlots || 0) - Number(pass.soldSlots || 0))

  async function handleSubmit(formEvent) {
    formEvent.preventDefault()
    setError('')
    const form = new FormData(formEvent.currentTarget)
    try {
      await visitor.submitReservation({
        attendeeName: sanitizeName(form.get('attendeeName')),
        email: form.get('email'),
        phone: form.get('phone'),
        selectedDate: form.get('selectedDate'),
        quantity: Number(form.get('quantity')),
      })
    } catch (err) {
      setError(err.message || 'We could not complete your reservation.')
    }
  }

  return (
    <div className="modal-backdrop modal-top" onMouseDown={(e) => e.target === e.currentTarget && visitor.setBookingOpen(false)}>
      <section className="dialog booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="dialog-close" onClick={() => visitor.setBookingOpen(false)} aria-label="Close reservation">×</button>
        <p className="eyebrow">ONE STEP FROM A GOOD DAY</p>
        <h2 id="booking-title">Reserve your spot</h2>
        <div className="booking-summary"><div><strong>{event.name}</strong><span>{pass.name} · {formatPrice(pass.price)} per person</span></div><span className="summary-date">{dateLabel(event.startDate, { month: 'short', day: 'numeric' })}</span></div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>Attendee name<NameInput name="attendeeName" autoComplete="name" placeholder="Full name" required /></label>
          <div className="form-grid">
            <label>Email<input name="email" type="email" autoComplete="email" defaultValue={visitor.email} placeholder="you@example.com" /></label>
            <label>Phone number<input name="phone" type="tel" autoComplete="tel" inputMode="numeric" pattern="[0-9]{10}" minLength="10" maxLength="10" placeholder="10-digit phone number" title="Enter exactly 10 digits" required /></label>
          </div>
          <div className="form-grid">
            <label>Visit date<input name="selectedDate" type="date" min={startDate.toISOString().slice(0, 10)} max={endDate.toISOString().slice(0, 10)} defaultValue={startDate.toISOString().slice(0, 10)} required /></label>
            <label>People<select name="quantity" value={Math.min(quantity, remaining) || 1} onChange={(changeEvent) => setQuantity(Number(changeEvent.target.value))}>{Array.from({ length: Math.min(10, remaining) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? 'person' : 'people'}</option>)}</select></label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="booking-total"><span>Amount due at event</span><strong>{formatPrice((Number(pass.price) || 0) * quantity)}</strong></div>
          <button className="primary-button full-button" disabled={visitor.submitting || !remaining}>{visitor.submitting ? 'Reserving…' : 'Confirm reservation'} <span aria-hidden="true">→</span></button>
          <p className="booking-fineprint">Enter Your details to confirm reservation.</p>
        </form>
      </section>
    </div>
  )
}

function DemoPaymentDialog({ visitor }) {
  const registration = visitor.pendingPayment
  if (!visitor.paymentOpen || !registration) return null

  return (
    <div className="modal-backdrop modal-top" onMouseDown={(event) => event.target === event.currentTarget && visitor.deferDemoPayment()}>
      <section className="dialog demo-payment-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-payment-title">
        <button className="dialog-close" onClick={visitor.deferDemoPayment} aria-label="Close payment confirmation">×</button>
        <span className="demo-payment-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">DEMO CHECKOUT</p>
        <h2 id="demo-payment-title">Confirm your payment</h2>
        <p className="demo-payment-intro">This is a demo confirmation. No payment provider or card charge is involved.</p>
        <div className="demo-payment-summary">
          <div><span>EVENT</span><strong>{visitor.bookingEvent?.name || 'Gather event'}</strong></div>
          <div><span>PASS</span><strong>{visitor.selectedPass?.name || 'Selected pass'} · {registration.quantity} {Number(registration.quantity) === 1 ? 'attendee' : 'attendees'}</strong></div>
          <div><span>REGISTRATION</span><strong>#{registration.id}</strong></div>
          <div className="demo-payment-amount"><span>DEMO AMOUNT</span><strong>{formatPrice(registration.amount)}</strong></div>
        </div>
        <div className="demo-payment-actions">
          <button className="secondary-button" onClick={visitor.deferDemoPayment}>Do this later</button>
          <button className="primary-button" disabled={visitor.submitting} onClick={visitor.confirmDemoPayment}>{visitor.submitting ? 'Confirming…' : 'Confirm demo payment'} <span aria-hidden="true">→</span></button>
        </div>
        <p className="demo-payment-note">Confirming will mark this registration as paid in the demo backend.</p>
      </section>
    </div>
  )
}

function Icon({ name, className = '' }) {
  const paths = {
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  }
  return <svg className={`user-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function MyEventsPage({ visitor }) {
  return (
    <section className="account-page">
      <ScrollReveal className="account-page-heading">
        <div><p className="eyebrow">YOUR PLANS, ALL IN ONE PLACE</p><h1>My events</h1><p>Reservations made with your Gather account.</p></div>
        <button className="secondary-button" onClick={() => visitor.loadMyEvents()} disabled={visitor.myEventsLoading}>{visitor.myEventsLoading ? 'Refreshing…' : 'Refresh'}</button>
      </ScrollReveal>
      {visitor.myEventsError ? (
        <ScrollReveal className="account-state"><span className="state-symbol">!</span><h2>We couldn’t load your events.</h2><p>{visitor.myEventsError}</p><button className="secondary-button" onClick={() => visitor.loadMyEvents()}>Try again</button></ScrollReveal>
      ) : visitor.myEventsLoading ? (
        <div className="account-state"><span className="loading-indicator" /><p>Loading your reservations…</p></div>
      ) : visitor.myEvents.length ? (
        <div className="registration-list">
          {visitor.myEvents.map((registration, index) => {
            const selectedDate = new Date(`${registration.selectedDate}T12:00:00`)
            const validDate = !Number.isNaN(selectedDate.getTime())
            const day = validDate ? selectedDate.toLocaleDateString('en-US', { day: '2-digit' }) : '--'
            const month = validDate ? selectedDate.toLocaleDateString('en-US', { month: 'short' }) : 'TBA'
            return (
              <ScrollReveal className="registration-row-reveal" delay={Math.min(index * 70, 280)} key={registration.id || `${registration.event?.name || registration.eventNameSnapshot}-${registration.selectedDate}-${index}`}>
                <article className="registration-row">
                  <div className="registration-date"><strong>{day}</strong><span>{month}</span></div>
                  <div className="registration-main"><h2>{registration.event?.name || registration.eventNameSnapshot || 'Deleted event'}</h2><p>{registration.pass?.name || registration.passNameSnapshot || 'Deleted pass'}{(registration.pass?.price ?? registration.passPriceSnapshot) != null && ` · ${formatPrice(registration.pass?.price ?? registration.passPriceSnapshot)} per person`} · {registration.quantity} {registration.quantity === 1 ? 'attendee' : 'attendees'}{registration.attendeeName ? ` · ${registration.attendeeName}` : ''}</p></div>
                  <div className="registration-payment"><strong>{formatPrice(registration.amount)}</strong><span>Reservation total</span></div>
                  <div className="registration-status-block">
                    <span className={`registration-status status-${String(registration.status || 'pending').toLowerCase()}`}>{registration.status || 'pending'}</span>
                    {String(registration.status || '').toLowerCase() === 'pending' && <button className="registration-pay-button" onClick={() => visitor.startDemoPayment(registration)}>Confirm payment</button>}
                  </div>
                  <button className="visitor-secondary-button row-edit-button registration-view-button" onClick={() => visitor.viewRegistration(registration.id)} aria-label={`View registration ${registration.id}`}><Icon name="eye" /> View</button>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      ) : (
        <ScrollReveal className="account-state"><span className="state-symbol">✳</span><h2>Your calendar is clear.</h2><p>When you reserve a spot, the details will show up here.</p><button className="primary-button" onClick={() => visitor.openPage('discover')}>Discover events <span aria-hidden="true">→</span></button></ScrollReveal>
      )}
    </section>
  )
}

function RegistrationDetailsPage({ visitor }) {
  if (visitor.myEventsDetailsLoading) {
    return (
      <section className="account-page">
        <div className="account-state">
          <span className="loading-indicator" />
          <p>Loading registration details…</p>
        </div>
      </section>
    )
  }

  if (visitor.myEventsDetailsError) {
    return (
      <section className="account-page">
        <ScrollReveal className="account-state">
          <span className="state-symbol">!</span>

          <h2>Unable to load registration.</h2>

          <p>{visitor.myEventsDetailsError}</p>

          <button
            className="secondary-button"
            onClick={() => visitor.openPage('my-events')}
          >
            ← Back to my events
          </button>
        </ScrollReveal>
      </section>
    )
  }

  const registration = visitor.myEventsDetails

  if (!registration) {
    return (
      <section className="account-page">
        <ScrollReveal className="account-state">
          <span className="state-symbol">!</span>

          <h2>Registration not found.</h2>

          <button
            className="secondary-button"
            onClick={() => visitor.openPage('my-events')}
          >
            ← Back to my events
          </button>
        </ScrollReveal>
      </section>
    )
  }

  return (
    <section className="account-page">
      <ScrollReveal className="account-page-heading">
        <div>
          <p className="eyebrow">YOUR RESERVATION</p>
          <h1>Registration details</h1>
          <p>
            {registration.event?.name || registration.eventNameSnapshot || 'Deleted event'}
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => visitor.openPage('my-events')}
        >
          ← My events
        </button>
      </ScrollReveal>

      <div className="registration-detail-grid">
        <ScrollReveal className="registration-detail-reveal">
          <article className="registration-detail-card">
            <span className="user-kicker">ATTENDEE</span>
            <h2>{registration.attendeeName || 'Visitor'}</h2>
            <dl className="registration-detail-list">
              <div><dt>Email</dt><dd>{registration.email || 'Not provided'}</dd></div>
              <div><dt>Phone</dt><dd>{registration.phone || 'Not provided'}</dd></div>
              <div><dt>Event</dt><dd>{registration.event?.name || registration.eventNameSnapshot || 'Deleted event'}</dd></div>
              <div><dt>Pass</dt><dd>{registration.pass?.name || registration.passNameSnapshot || 'Deleted pass'}</dd></div>
              {(registration.pass?.price ?? registration.passPriceSnapshot) != null && <div><dt>Pass price</dt><dd>{formatPrice(registration.pass?.price ?? registration.passPriceSnapshot)} per person</dd></div>}
              <div><dt>Visit date</dt><dd>{formatDate(registration.selectedDate)}</dd></div>
              <div><dt>Registered</dt><dd>{formatDate(registration.createdAt, true)}</dd></div>
              <div><dt>Quantity</dt><dd>{registration.quantity ?? 1}</dd></div>
              <div><dt>Amount</dt><dd>{formatMoney(registration.amount)}</dd></div>
              <div><dt>Payment status</dt><dd><span className={`payment-status ${registration.status || ''}`}>{registration.status || 'Unknown'}</span></dd></div>
            </dl>
          </article>
        </ScrollReveal>
        <ScrollReveal className="registration-detail-reveal" delay={100}>
          <article className="registration-detail-card">
            <span className="user-kicker">Your Registration QR</span>
            <h2>Show this QR Code at time of entry</h2>
            <p className="registration-qr-id">Registration #{registration.id}</p>

            <div className="registration-qr-code">
              <div className={!registration?.qrToken ? 'qr-blurred' : ''}>
                <QRCodeSVG
                  value={registration?.qrToken || 'INVALID-QR'}
                  size={280}
                  level="H"
                  style={{
                    width: '100%',
                    maxWidth: '280px',
                    height: 'auto',
                    display: 'block',
                  }}
                />
              </div>

              {!registration?.qrToken && (
                <div className="qr-error-overlay">
                  <div className="qr-error-content">
                    <span className="qr-error-icon">!</span>
                    <strong>QR unavailable</strong>
                    <span>Unable to generate your QR code.</span>
                  </div>
                </div>
              )}
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  )
}

function ProfilePage({ visitor }) {
  const profile = visitor.profile
  const savedDetails = {
    firstName: sanitizeName(profile?.firstName || ''),
    lastName: sanitizeName(profile?.lastName || ''),
    gender: profile?.gender || '',
    city: profile?.city || '',
    company: profile?.company || '',
  }
  const [profileDraft, setProfileDraft] = useState(() => ({
    profile,
    details: savedDetails,
  }))
  const draftDetails = profileDraft.profile === profile
    ? profileDraft.details
    : savedDetails

  function updateDraft(field, value) {
    setProfileDraft({
      profile,
      details: { ...draftDetails, [field]: value },
    })
  }

  if (visitor.profileLoading) {
    return <section className="account-page"><div className="account-state"><span className="loading-indicator" /><p>Loading your profile…</p></div></section>
  }

  if (!visitor.profile) {
    return (
      <section className="account-page">
        <div className="account-page-heading"><div><p className="eyebrow">YOUR GATHER ACCOUNT</p><h1>Profile</h1></div></div>
        <ScrollReveal className="account-state"><span className="state-symbol">!</span><h2>Profile unavailable.</h2><p>{visitor.profileError || 'We could not load your account details.'}</p><button className="secondary-button" onClick={() => visitor.openPage('profile')}>Try again</button></ScrollReveal>
      </section>
    )
  }

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'G'
  const hasChanges = Object.keys(savedDetails).some(
    (field) => draftDetails[field] !== savedDetails[field],
  )

  async function handleSubmit(event) {
    event.preventDefault()
    await visitor.saveProfile({
      ...draftDetails,
      firstName: sanitizeName(draftDetails.firstName),
      lastName: sanitizeName(draftDetails.lastName),
    })
  }

  return (
    <section className="account-page">
      <ScrollReveal className="account-page-heading"><div><p className="eyebrow">YOUR GATHER ACCOUNT</p><h1>Profile</h1><p>Keep your visitor details up to date.</p></div></ScrollReveal>
      <ScrollReveal className="profile-layout">
        <aside className="profile-identity"><span className="profile-avatar">{initials}</span><strong>{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Gather visitor'}</strong><span>{profile.email}</span></aside>
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-heading"><div><h2>Personal details</h2><p>Email and phone are verified account identifiers.</p></div><span className="edit-mark" aria-hidden="true">✎</span></div>
          <div className="profile-field-grid">
            <label>First name<NameInput name="firstName" value={draftDetails.firstName} onChange={(event) => updateDraft('firstName', event.target.value)} autoComplete="given-name" required minLength="2" maxLength="50" /></label>
            <label>Last name<NameInput name="lastName" value={draftDetails.lastName} onChange={(event) => updateDraft('lastName', event.target.value)} autoComplete="family-name" required minLength="2" maxLength="50" /></label>
            <label>Email address<input value={profile.email || ''} readOnly aria-readonly="true" /></label>
            <label>Phone number<input value={profile.phone || ''} readOnly aria-readonly="true" /></label>
            <label>Gender<select name="gender" value={draftDetails.gender} onChange={(event) => updateDraft('gender', event.target.value)} required>
              <option value="" disabled>Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select></label>
            <label>City<input name="city" value={draftDetails.city} onChange={(event) => updateDraft('city', event.target.value)} autoComplete="address-level2" required minLength="2" maxLength="100" /></label>
            <label className="company-field">Company<input name="company" value={draftDetails.company} onChange={(event) => updateDraft('company', event.target.value)} autoComplete="organization" required minLength="2" maxLength="150" /></label>
          </div>
          {visitor.profileError && <p className="form-error" role="alert">{visitor.profileError}</p>}
          <div className="profile-form-actions"><span>Only name, gender, city, and company can be edited.</span><div className="profile-form-buttons">{hasChanges && <button className="secondary-button" type="button" disabled={visitor.profileSaving} onClick={() => setProfileDraft({ profile, details: savedDetails })}>Cancel</button>}<button className="primary-button" disabled={!hasChanges || visitor.profileSaving}>{visitor.profileSaving ? 'Saving…' : 'Save changes'} <span aria-hidden="true">→</span></button></div></div>
        </form>
      </ScrollReveal>
    </section>
  )
}

function ScrollReveal({ children, className = '', delay = 0 }) {
  const revealRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = revealRef.current
    if (!element || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.unobserve(element)
      }
    }, { threshold: 0.15 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={revealRef}
      className={`scroll-reveal${isVisible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function VisitorPortal({ visitor }) {
  const [eventPagination, setEventPagination] = useState({ page: 1, search: visitor.search, location: visitor.location })
  const eventsSectionRef = useRef(null)
  const shouldScrollToEventsRef = useRef(false)
  const eventsPerPage = 9
  const eventPageCount = Math.ceil(visitor.filteredEvents.length / eventsPerPage)
  const eventPage = eventPagination.search === visitor.search && eventPagination.location === visitor.location
    ? eventPagination.page
    : 1
  const currentEventPage = Math.min(eventPage, Math.max(eventPageCount, 1))
  const firstEventIndex = (currentEventPage - 1) * eventsPerPage
  const visibleEvents = visitor.filteredEvents.slice(firstEventIndex, firstEventIndex + eventsPerPage)

  function changeEventPage(page) {
    if (page === currentEventPage) return
    shouldScrollToEventsRef.current = true
    setEventPagination({ page, search: visitor.search, location: visitor.location })
  }

  useEffect(() => {
    if (!shouldScrollToEventsRef.current) return
    shouldScrollToEventsRef.current = false
    eventsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentEventPage])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
    <div className="app-shell">
      <Header visitor={visitor} />
      <main>
        {visitor.activePage === 'event' ? <EventDetails event={visitor.selectedEvent} loading={visitor.detailLoading} onClose={visitor.closeEvent} onReserve={visitor.beginReservation} /> : visitor.activePage === 'my-events' ?
          <MyEventsPage visitor={visitor} /> : visitor.activePage === 'registration-details' ? (<RegistrationDetailsPage visitor={visitor} />) : visitor.activePage === 'profile' ? <ProfilePage visitor={visitor} /> : <>
            <Hero featuredEvent={visitor.featuredEvent} onExplore={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })} />
            <section className="events-section" id="events" ref={eventsSectionRef}>
              <ScrollReveal className="section-heading">
                <div><p className="eyebrow">YOUR NEXT OUT-OF-OFFICE MOMENT</p><h2>Find your kind of event.</h2></div>
                <span className="event-count">{visitor.loading ? '…' : `${visitor.filteredEvents.length} ${visitor.filteredEvents.length === 1 ? 'event' : 'events'}`}</span>
              </ScrollReveal>
              <ScrollReveal className="event-toolbar">
                <label className="search-field"><span className="search-icon" aria-hidden="true">⌕</span><input value={visitor.search} onChange={(event) => visitor.setSearch(event.target.value)} placeholder="Search events, places…" aria-label="Search events" /><kbd>/</kbd></label>
                <label className="location-filter"><span>LOCATION</span><select value={visitor.location} onChange={(event) => visitor.setLocation(event.target.value)} aria-label="Filter by location"><option value="all">Everywhere</option>{visitor.locations.map((place) => <option key={place} value={place}>{place}</option>)}</select></label>
              </ScrollReveal>
              {visitor.loadError ? (
                <ScrollReveal className="state-panel error-panel"><span className="state-symbol">!</span><h3>Events aren’t loading</h3><p>{visitor.loadError}. Check that the event service is available, then try again.</p><button className="secondary-button" onClick={visitor.refreshEvents}>Try again</button></ScrollReveal>
              ) : visitor.loading ? (
                <div className="event-grid" aria-label="Loading events"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>
              ) : visitor.filteredEvents.length ? (
                <>
                  <div className="event-grid">{visibleEvents.map((event, index) => <ScrollReveal className="event-card-reveal" delay={Math.min(index * 70, 280)} key={event.id}><EventCard event={event} index={firstEventIndex + index} onOpen={visitor.openEvent} /></ScrollReveal>)}</div>
                  {visitor.filteredEvents.length > eventsPerPage && <nav className="event-pagination" aria-label="Event pages">
                    <button type="button" className="pagination-direction" onClick={() => changeEventPage(currentEventPage - 1)} disabled={currentEventPage === 1} aria-label="Previous page">← <span>Previous</span></button>
                    <div className="pagination-pages">
                      {Array.from({ length: eventPageCount }, (_, index) => index + 1).map((page) => <button type="button" key={page} className={`pagination-page${currentEventPage === page ? ' is-active' : ''}`} onClick={() => changeEventPage(page)} aria-label={`Page ${page}`} aria-current={currentEventPage === page ? 'page' : undefined}>{page}</button>)}
                    </div>
                    <button type="button" className="pagination-direction" onClick={() => changeEventPage(currentEventPage + 1)} disabled={currentEventPage === eventPageCount} aria-label="Next page"><span>Next</span> →</button>
                  </nav>}
                </>
              ) : (
                <ScrollReveal className="state-panel"><span className="state-symbol">✳</span><h3>{visitor.events.length ? 'Nothing matches just yet.' : 'The calendar is taking a breath.'}</h3><p>{visitor.events.length ? 'Try another search or location.' : 'There are no events to show right now. Check back soon for something good.'}</p>{visitor.events.length > 0 && <button className="secondary-button" onClick={() => { visitor.setSearch(''); visitor.setLocation('all') }}>Clear filters</button>}</ScrollReveal>
              )}
            </section>
            <div className="gather-marquee" role="img" aria-label="Discover, show up, and make a memory">
              <div className="gather-marquee-track" aria-hidden="true">
                {[0, 1].map((copy) => (
                  <span className="gather-marquee-copy" key={copy}>
                    <span className="marquee-word">FIND YOUR PEOPLE</span><i>✳</i>
                    <span className="marquee-word marquee-word-highlight">MAKE A DAY OF IT</span><i>✳</i>
                    <span className="marquee-word">GOOD THINGS HAPPEN TOGETHER</span><i>✳</i>
                    <span className="marquee-word marquee-word-highlight">SHOW UP FOR SOMETHING GOOD</span><i>✳</i>
                  </span>
                ))}
              </div>
            </div>
            <section className="about-section" id="about" aria-labelledby="about-heading">
              <ScrollReveal className="about-copy">
                <p className="eyebrow"><span className="eyebrow-dot" /> A LITTLE ABOUT GATHER</p>
                <h2 id="about-heading">Less scrolling.<br /><span>More living.</span></h2>
                <p className="about-description">Gather makes it easier to find experiences worth leaving home for. Discover something happening nearby, get the details you need, and save your spot—all in one place.</p>
                <a className="about-link" href="#events">Find your next good plan <span aria-hidden="true">↗</span></a>
              </ScrollReveal>
              <div className="about-features">
                <ScrollReveal className="about-feature" delay={80}>
                  <span className="feature-number">01</span>
                  <div><h3>Find your kind of event</h3><p>Search upcoming experiences and explore by location to find a plan that feels like you.</p></div>
                  <span className="feature-icon" aria-hidden="true">⌕</span>
                </ScrollReveal>
                <ScrollReveal className="about-feature" delay={160}>
                  <span className="feature-number">02</span>
                  <div><h3>Know before you go</h3><p>Check the schedule, venue, and pass details before deciding what’s next.</p></div>
                  <span className="feature-icon" aria-hidden="true">↗</span>
                </ScrollReveal>
                <ScrollReveal className="about-feature" delay={240}>
                  <span className="feature-number">03</span>
                  <div><h3>Keep your plans together</h3><p>Reserve your spot and find your registration details and entry QR when you need them.</p></div>
                  <span className="feature-icon" aria-hidden="true">✳</span>
                </ScrollReveal>
              </div>
            </section>
            <section className="reviews-section" aria-labelledby="reviews-heading">
              <ScrollReveal className="reviews-heading">
                <div><p className="eyebrow">THE GATHER FEELING</p><h2 id="reviews-heading">Good plans make<br />good stories.</h2></div>
                <p>From the first search to the last song, it’s all about making room for moments worth sharing.</p>
              </ScrollReveal>
              <div className="review-grid">
                <ScrollReveal className="review-card" delay={60}>
                  <div className="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
                  <blockquote>“Found a new favorite spot and made a whole day out of it.”</blockquote>
                  <div className="review-author"><span className="review-avatar review-avatar-coral">S</span><span><strong>A day well spent</strong><small>For the curious ones</small></span></div>
                </ScrollReveal>
                <ScrollReveal className="review-card" delay={140}>
                  <div className="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
                  <blockquote>“The best plans are the ones you almost stayed home for.”</blockquote>
                  <div className="review-author"><span className="review-avatar review-avatar-green">G</span><span><strong>A little nudge to go</strong><small>For the last-minute yes</small></span></div>
                </ScrollReveal>
                <ScrollReveal className="review-card" delay={220}>
                  <div className="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
                  <blockquote>“One easy place to find the details, book a spot, and just enjoy.”</blockquote>
                  <div className="review-author"><span className="review-avatar review-avatar-gold">M</span><span><strong>More time in the moment</strong><small>For the plan-makers</small></span></div>
                </ScrollReveal>
              </div>
            </section>
            <ScrollReveal className="closing-band"><div><p className="eyebrow">MAKE A DAY OF IT</p><h2>Life is better on the calendar.</h2></div><a href="#events">Find your next plan <span aria-hidden="true">↗</span></a></ScrollReveal>
          </>}
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <ScrollReveal className="footer-about">
            <a className="brand footer-brand" href="/" aria-label="Gather home" onClick={(event) => {
              event.preventDefault()
              visitor.openPage('discover')
            }}>
              <span className="brand-mark" aria-hidden="true">g</span>
              <span>gather<span className="brand-period">.</span></span>
            </a>
            <p>Make room for something memorable. Find your next favorite thing, from the people making it happen.</p>
          </ScrollReveal>
          <ScrollReveal className="footer-links-reveal">
            <nav className="footer-links" aria-label="Footer">
            <h2>Explore</h2>
            <a href="/#events">Upcoming events</a>
            <a href="/#about">How Gather works</a>
            <button type="button" onClick={() => visitor.openPage('my-events')}>My events</button>
            </nav>
          </ScrollReveal>
          <ScrollReveal className="footer-social">
            <h2>Stay connected</h2>
            <p>Visit your favorite social platform.</p>
            <div className="footer-social-links">
              <a href="/" rel="noopener noreferrer" aria-label="Visit Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.2v3.2H10V21h3.4Z" /></svg>
              </a>
              <a href="/"  rel="noopener noreferrer" aria-label="Visit LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.2a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8ZM4.9 9.7h3.2V20H4.9V9.7Zm5.2 0h3.1v1.4h.1a3.4 3.4 0 0 1 3.1-1.7c3.3 0 3.9 2.2 3.9 5V20H17v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V20h-3.2V9.7Z" /></svg>
              </a>
              <a href="/" rel="noopener noreferrer" aria-label="Visit WhatsApp">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a8.7 8.7 0 0 0-7.5 13.1L3.3 21l5-1.3A8.7 8.7 0 1 0 12 3Zm0 15.8a7.1 7.1 0 0 1-3.6-1l-.3-.2-2.9.8.8-2.8-.2-.3A7.1 7.1 0 1 1 12 18.8Zm3.9-5.3c-.2-.1-1.3-.7-1.5-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.3-.1-1-.4-1.8-1.1-.7-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.5l.4-.4.2-.4c.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.1.9 2.2c.1.2 1.6 2.5 3.8 3.4.5.2.9.3 1.2.4.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1 .2-.5.2-1 .1-1.1 0-.1-.2-.2-.4-.3Z" /></svg>
              </a>
            </div>
          </ScrollReveal>
        </div>
        <ScrollReveal className="footer-bottom">
          <span>© {new Date().getFullYear()} Gather. All rights reserved.</span>
        </ScrollReveal>
      </footer>
      {visitor.notice && <div className={`notice notice-${visitor.notice.type}`} role="status"><span>{visitor.notice.message}</span><button onClick={visitor.dismissNotice} aria-label="Dismiss notification">×</button></div>}
      {visitor.authOpen && <AuthDialog open onClose={() => visitor.setAuthOpen(false)} onSubmit={visitor.signIn} onRequestCode={visitor.requestSignupCode} onCompleteSignup={visitor.completeSignup} onRequestPasswordReset={visitor.requestPasswordReset} onResetPassword={visitor.resetPassword} submitting={visitor.submitting} intent={visitor.pendingPage} />}
      <BookingDialog visitor={visitor} />
      <DemoPaymentDialog visitor={visitor} />
    </div>
    <button className="back-to-top" type="button" onClick={scrollToTop} aria-label="Move to top">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-7 7 7-7 7 7" /></svg>
    </button>
    </>
  )
}

export default VisitorPortal;