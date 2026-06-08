'use client';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { decodeVoucher } from '@/lib/vouchers';
import { enqueueVoucher } from '@/lib/queue';
import { isNfcSupported, readNfcTag } from '@/lib/nfc';
import PendingQueue from './PendingQueue';

type ScanMode = 'qr' | 'nfc';

export default function MerchantScanner() {
  const [mode, setMode] = useState<ScanMode>('qr');
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [queueKey, setQueueKey] = useState(0); // bump to refresh PendingQueue
  const qrRef = useRef<Html5Qrcode | null>(null);
  const nfcCleanupRef = useRef<(() => void) | null>(null);

  const nfcAvailable = isNfcSupported();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleScanned(raw: string) {
    const voucher = decodeVoucher(raw);
    if (!voucher) {
      showToast('❌ Not a TapSend voucher — try again');
      return;
    }
    enqueueVoucher(voucher);
    setQueueKey((k) => k + 1);
    showToast(`✅ Voucher #${voucher.index} queued (${voucher.amount} XLM)`);
  }

  // Start / stop QR scanner
  async function startQR() {
    setScanning(true);
    const scanner = new Html5Qrcode('qr-reader');
    qrRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanned(decodedText);
        },
        undefined,
      );
    } catch {
      setScanning(false);
    }
  }

  async function stopQR() {
    if (qrRef.current?.isScanning) {
      await qrRef.current.stop();
    }
    qrRef.current = null;
    setScanning(false);
  }

  // Start / stop NFC reader
  async function startNFC() {
    setNfcError(null);
    setScanning(true);
    try {
      const cleanup = await readNfcTag(handleScanned, (err) => {
        setNfcError(err.message);
        setScanning(false);
      });
      nfcCleanupRef.current = cleanup;
    } catch (e) {
      setNfcError(e instanceof Error ? e.message : 'NFC failed');
      setScanning(false);
    }
  }

  function stopNFC() {
    nfcCleanupRef.current?.();
    nfcCleanupRef.current = null;
    setScanning(false);
  }

  // Cleanup on unmount or mode switch
  useEffect(() => {
    return () => {
      stopQR();
      stopNFC();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleScan() {
    if (scanning) {
      mode === 'qr' ? await stopQR() : stopNFC();
    } else {
      mode === 'qr' ? await startQR() : await startNFC();
    }
  }

  async function switchMode(newMode: ScanMode) {
    if (scanning) {
      mode === 'qr' ? await stopQR() : stopNFC();
    }
    setMode(newMode);
    setNfcError(null);
  }

  return (
    <div className="panel">
      <h2 className="panel__title">🏪 Merchant — Receive Payments</h2>
      <p className="panel__subtitle">
        Scan a QR voucher or tap an NFC tag. Payments queue offline and sync to Stellar later.
      </p>

      {/* Mode tabs */}
      <div className="tab-bar">
        <button
          id="tab-qr"
          className={`tab${mode === 'qr' ? ' tab--active' : ''}`}
          onClick={() => switchMode('qr')}
        >
          📷 Scan QR
        </button>
        {nfcAvailable && (
          <button
            id="tab-nfc"
            className={`tab${mode === 'nfc' ? ' tab--active' : ''}`}
            onClick={() => switchMode('nfc')}
          >
            📡 Read NFC
          </button>
        )}
      </div>

      {/* QR reader area */}
      {mode === 'qr' && (
        <div className="scanner-area">
          <div id="qr-reader" className="qr-reader-box" />
          <button
            id="toggle-scan-btn"
            className={`btn ${scanning ? 'btn--danger' : 'btn--primary'} btn--full`}
            onClick={handleToggleScan}
          >
            {scanning ? '⏹ Stop Scanner' : '▶ Start Camera Scanner'}
          </button>
        </div>
      )}

      {/* NFC reader area */}
      {mode === 'nfc' && (
        <div className="scanner-area scanner-area--nfc">
          <div className="nfc-icon">{scanning ? '📡' : '📵'}</div>
          <p className="nfc-hint">
            {scanning
              ? 'Hold an NFC-tagged voucher near your phone…'
              : 'Tap Start to begin listening for NFC tags.'}
          </p>
          {nfcError && <p className="form-error">{nfcError}</p>}
          <button
            id="toggle-nfc-btn"
            className={`btn ${scanning ? 'btn--danger' : 'btn--primary'} btn--full`}
            onClick={handleToggleScan}
          >
            {scanning ? '⏹ Stop NFC' : '▶ Start NFC Reader'}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Pending queue */}
      <PendingQueue key={queueKey} onSync={() => setQueueKey((k) => k + 1)} />
    </div>
  );
}
