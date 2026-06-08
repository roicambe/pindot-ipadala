'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Voucher } from '@/lib/vouchers';
import { encodeVoucher } from '@/lib/vouchers';
import { isNfcSupported, writeNfcTag } from '@/lib/nfc';

interface QRCarouselProps {
  vouchers: Voucher[];
}

export default function QRCarousel({ vouchers }: QRCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [nfcStatus, setNfcStatus] = useState<string | null>(null);
  const [nfcWriting, setNfcWriting] = useState(false);

  const voucher = vouchers[current];
  const encoded = encodeVoucher(voucher);
  const nfcAvailable = isNfcSupported();

  async function handleNfcWrite() {
    setNfcWriting(true);
    setNfcStatus('Hold NFC tag near your phone…');
    try {
      await writeNfcTag(encoded);
      setNfcStatus('✅ Written to NFC tag!');
    } catch (e) {
      setNfcStatus(`❌ ${e instanceof Error ? e.message : 'NFC write failed'}`);
    } finally {
      setNfcWriting(false);
    }
  }

  function handleDownloadAll() {
    const blob = new Blob([JSON.stringify(vouchers, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tapsend-vouchers-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="carousel">
      {/* Navigation */}
      <div className="carousel__nav">
        <button
          id="carousel-prev"
          className="carousel__arrow"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          aria-label="Previous voucher"
        >
          ‹
        </button>
        <span className="carousel__counter">
          Voucher {current + 1} of {vouchers.length}
        </span>
        <button
          id="carousel-next"
          className="carousel__arrow"
          onClick={() => setCurrent((c) => Math.min(vouchers.length - 1, c + 1))}
          disabled={current === vouchers.length - 1}
          aria-label="Next voucher"
        >
          ›
        </button>
      </div>

      {/* QR Card */}
      <div className="qr-card">
        <div className="qr-card__badge">#{voucher.index}</div>
        <div className="qr-card__qr">
          <QRCodeSVG
            value={encoded}
            size={220}
            bgColor="transparent"
            fgColor="#e2e8f0"
            level="M"
          />
        </div>
        <div className="qr-card__info">
          <div className="qr-card__amount">{voucher.amount} XLM</div>
          <div className="qr-card__dest">
            To: {voucher.destination.slice(0, 8)}…{voucher.destination.slice(-6)}
          </div>
          <div className="qr-card__note">Use in order · Do not share publicly</div>
        </div>
      </div>

      {/* Actions */}
      <div className="carousel__actions">
        {nfcAvailable && (
          <button
            id="nfc-write-btn"
            className="btn btn--accent"
            onClick={handleNfcWrite}
            disabled={nfcWriting}
          >
            {nfcWriting ? '📡 Waiting for tag…' : '📡 Write to NFC Tag'}
          </button>
        )}
        <button id="download-vouchers-btn" className="btn btn--ghost" onClick={handleDownloadAll}>
          💾 Save All as JSON
        </button>
      </div>

      {nfcStatus && (
        <p className="carousel__nfc-status">{nfcStatus}</p>
      )}

      {/* Dot indicators */}
      <div className="carousel__dots">
        {vouchers.map((_, i) => (
          <button
            key={i}
            id={`dot-${i}`}
            className={`carousel__dot${i === current ? ' carousel__dot--active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Go to voucher ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
