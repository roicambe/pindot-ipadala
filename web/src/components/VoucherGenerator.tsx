'use client';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import ConnectWallet from './ConnectWallet';
import BalanceCard from './BalanceCard';
import QRCarousel from './QRCarousel';
import { buildAndSignVouchers, type Voucher } from '@/lib/vouchers';
import { fundTestnetAccount } from '@/lib/stellar';

export default function VoucherGenerator() {
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('10');
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [funded, setFunded] = useState(false);
  const [funding, setFunding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleFund() {
    if (!publicKey) return;
    setFunding(true);
    try {
      await fundTestnetAccount(publicKey);
      setFunded(true);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Funding failed');
    } finally {
      setFunding(false);
    }
  }

  async function handleGenerate() {
    if (!publicKey || !destination || !amount || count < 1) return;
    setError(null);
    setGenerating(true);
    setProgress({ done: 0, total: count });
    try {
      const result = await buildAndSignVouchers(
        publicKey,
        destination,
        amount,
        count,
        (done, total) => setProgress({ done, total }),
      );
      setVouchers(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate vouchers');
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  }

  return (
    <div className="panel">
      <h2 className="panel__title">💸 Generate Payment Vouchers</h2>
      <p className="panel__subtitle">
        Pre-sign XLM payments while online. Share as QR or NFC for offline use.
      </p>

      {/* Wallet connection */}
      <div className="panel__section">
        <ConnectWallet {...wallet} />
      </div>

      {publicKey && (
        <>
          {/* Balance + Fund */}
          <div className="panel__section">
            <BalanceCard publicKey={publicKey} refreshKey={refreshKey} />
            <button
              id="fund-account-btn"
              className="btn btn--ghost btn--sm mt-2"
              onClick={handleFund}
              disabled={funding}
            >
              {funding ? 'Funding…' : funded ? '✅ Funded' : '🚰 Get testnet XLM'}
            </button>
          </div>

          {/* Form */}
          {vouchers.length === 0 && (
            <div className="panel__section">
              <div className="form-group">
                <label className="form-label" htmlFor="destination">
                  Merchant Address (G…)
                </label>
                <input
                  id="destination"
                  className="form-input"
                  type="text"
                  placeholder="GABCD…"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.trim())}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="amount">
                    XLM per voucher
                  </label>
                  <input
                    id="amount"
                    className="form-input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="count">
                    # of vouchers
                  </label>
                  <input
                    id="count"
                    className="form-input"
                    type="number"
                    min="1"
                    max="10"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}

              {generating && progress && (
                <div className="progress-bar-wrap">
                  <div className="progress-bar-label">
                    Signing voucher {progress.done} of {progress.total}… approve in Freighter
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar__fill"
                      style={{ width: `${(progress.done / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                id="generate-vouchers-btn"
                className="btn btn--primary btn--full"
                onClick={handleGenerate}
                disabled={generating || !destination || !amount || count < 1}
              >
                {generating ? 'Generating…' : `⚡ Generate ${count} Voucher${count !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* QR Carousel */}
          {vouchers.length > 0 && (
            <>
              <QRCarousel vouchers={vouchers} />
              <button
                id="reset-vouchers-btn"
                className="btn btn--ghost btn--sm mt-4"
                onClick={() => setVouchers([])}
              >
                ← Generate new batch
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
