import { useEffect, useRef, useState } from 'react'

export default function AdminQrScanner({ admin }) {
  const scannerRef = useRef(null)
  const startingRef = useRef(false)
  const processingRef = useRef(false)
  const mountedRef = useRef(false)

  const [scannerStarted, setScannerStarted] = useState(false)
  const [scannerVisible, setScannerVisible] = useState(false)
  const [scannerError, setScannerError] = useState('')

  const result = admin.qrResult
  const scanCount = admin.totalScanCount;

  // Stop the camera and remove its video elements
  async function stopScanner() {
    const scanner = scannerRef.current

    if (!scanner) {
      setScannerStarted(false)
      setScannerVisible(false)
      return
    }

    scannerRef.current = null

    try {
      await scanner.stop()
    } catch (error) {
      console.log('Scanner already stopped.')
    }

    try {
      await scanner.clear()
    } catch (error) {
      console.log('Scanner cleanup:', error)
    }

    if (mountedRef.current) {
      setScannerStarted(false)
      setScannerVisible(false)
    }
  }

  // Start the camera only when the admin clicks Start scan
  async function startScanner() {
    if (startingRef.current || scannerRef.current) return

    startingRef.current = true
    processingRef.current = false
    setScannerError('')
    setScannerVisible(true)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      if (!mountedRef.current) return

      const scanner = new Html5Qrcode('admin-qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          // Ignore duplicate detections of the same QR
          if (processingRef.current) return

          processingRef.current = true

          // Hide the scanner immediately and stop the camera
          await stopScanner()

          // Verify the scanned token once
          await admin.verifyQr(decodedText)
        },
        () => {
          // Ignore normal frame-by-frame scan failures
        },
      )

      if (mountedRef.current) {
        setScannerStarted(true)
      } else {
        try {
          await scanner.stop()
          await scanner.clear()
        } catch {}
      }
    } catch (error) {
      console.error('Unable to start QR scanner:', error)

      scannerRef.current = null

      if (mountedRef.current) {
        setScannerError(
          error.message || 'Unable to access the camera.',
        )
        setScannerVisible(false)
        setScannerStarted(false)
      }
    } finally {
      startingRef.current = false
    }
  }

  // Stop camera when navigating away from this component
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false

      const scanner = scannerRef.current
      scannerRef.current = null

      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear().catch(() => {})
          })
      }
    }
  }, [])

  async function handleStopScan() {
    processingRef.current = true
    await stopScanner()
  }

  async function handleScanNext() {
    await stopScanner()

    admin.resetQrVerification()

    processingRef.current = false
    setScannerError('')

    // Start only after the previous camera is cleaned up
    setTimeout(() => {
      if (mountedRef.current) {
        startScanner()
      }
    }, 150)
  }

  return (
    <section className="qr-scanner-page">
      <div className="admin-page-title">
        <div>
          <span className="admin-kicker">ENTRY CONTROL</span>
          <h1>Scan QR</h1>
          <p>Scan a visitor registration QR code to verify entry.</p>
        </div>
        <div>
          <h3>Total Scan Count : {scanCount ? scanCount.totalScanCount : 0 }</h3>
        </div>
      </div>

      <div className="qr-scanner-layout">
        <div className="qr-scanner-card">

          {/* Show camera only while scanning */}
          {scannerVisible && !result && !admin.qrError && (
            <div className="qr-camera-panel">
              <div
                id="admin-qr-reader"
                className="admin-qr-reader"
              />

              <p className="qr-camera-hint">
                Point the camera at the visitor's QR code.
              </p>

              <button
                type="button"
                className="admin-danger-button"
                onClick={handleStopScan}
                disabled={!scannerStarted && !startingRef.current}
              >
                Stop scan
              </button>
            </div>
          )}

          {/* Start button when camera is hidden */}
          {!scannerVisible && !admin.qrLoading && !result && !admin.qrError && (
            <div className="qr-scanner-idle">
              <div className="qr-camera-icon">▦</div>
              <h2>Ready to scan</h2>
              <p>Start the camera when the visitor is ready.</p>

              <button
                type="button"
                className="admin-primary-button"
                onClick={startScanner}
              >
                Start scan
              </button>
            </div>
          )}

          {scannerError && (
            <div className="qr-result qr-result-error" role="alert">
              <strong>Camera unavailable</strong>
              <p>{scannerError}</p>
              <p>Allow camera access in your browser and try again.</p>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={startScanner}
              >
                Try again
              </button>
            </div>
          )}

          {/* Scanner remains hidden during verification */}
          {admin.qrLoading && (
            <div className="qr-verification-loading">
              <span className="qr-loading-spinner" />
              <strong>Verifying registration...</strong>
              <p>Please wait while the server checks this QR code.</p>
            </div>
          )}

          {/* Result shown after camera has stopped */}
          {!admin.qrLoading && (result || admin.qrError) && (
            <div
              className={`qr-result ${
                result?.valid
                  ? 'qr-result-success'
                  : result?.repeated
                    ? 'qr-result-warning'
                    : 'qr-result-error'
              }`}
              role="status"
            >
              <span className="qr-result-symbol">
                {result?.valid
                  ? '✓'
                  : result?.repeated
                    ? '!'
                    : '×'}
              </span>

              <h2>
                {result?.valid
                  ? 'Entry allowed'
                  : result?.repeated
                    ? 'Already checked in'
                    : 'Verification failed'}
              </h2>

              {(result?.valid || result?.repeated ) && (
                <h4>Check In Count : {result?.scanCount ? result.scanCount  : 0}</h4>
              )}

              <p>{result?.message || admin.qrError}</p>

              {result?.attendeeName && (
                <p>
                  <strong>Attendee:</strong> {result.attendeeName}
                </p>
              )}

              {result?.event && (
                <p>
                  <strong>Event:</strong> {result.event}
                </p>
              )}

              {result?.pass && (
                <p>
                  <strong>Pass:</strong> {result.pass}
                </p>
              )}

              {result?.quantity != null && (
                <p>
                  <strong>Quantity:</strong> {result.quantity}
                </p>
              )}

              <button
                type="button"
                className="admin-primary-button"
                onClick={handleScanNext}
              >
                Scan next QR
              </button>
            </div>
          )}

        </div>

        <div className="qr-scanner-instructions">
          <span className="admin-kicker">HOW IT WORKS</span>
          <h2>Verify a registration</h2>

          <ol>
            <li>Click Start scan to open the camera.</li>
            <li>Point the camera at the registration QR.</li>
            <li>The server verifies the QR token.</li>
            <li>The camera closes and the result appears.</li>
          </ol>
        </div>
      </div>
    </section>
  )
}