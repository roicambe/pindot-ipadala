'use client';
import { useState, useEffect } from 'react';
import { getQueue, dequeueVoucher } from '@/lib/queue';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import type { Voucher } from '@/lib/vouchers';

type VoucherStatus = 'pending' | 'submitting' | 'success' | 'failed';

interface QueueEntry {
  voucher: Voucher;
  status: VoucherStatus;
  hash?: string;
  error?: string;
}

interface PendingQueueProps {
  onSync: () => void;
}

export default function PendingQueue({ onSync }: PendingQueueProps) {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const q = getQueue();
    setEntries(q.map((v) => ({ voucher: v, status: 'pending' })));
  }, []);

  function updateEntry(xdr: string, patch: Partial<QueueEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.voucher.xdr === xdr ? { ...e, ...patch } : e)),
    );
  }

  async function handleSync() {
    setSyncing(true);
    // Sort by index to ensure correct submission order (seq number matters!)
    const pending = [...entries]
      .filter((e) => e.status === 'pending')
      .sort((a, b) => a.voucher.index - b.voucher.index);

    for (const entry of pending) {
      const { xdr } = entry.voucher;
      updateEntry(xdr, { status: 'submitting' });
      try {
        const hash = await submitSignedXDR(xdr);
        await pollTransaction(hash);
        dequeueVoucher(xdr);
        updateEntry(xdr, { status: 'success', hash });
      } catch (e) {
        updateEntry(xdr, {
          status: 'failed',
          error: e instanceof Error ? e.message : 'Unknown error',
        });
        // Stop on first failure — later vouchers may depend on sequence order
        break;
      }
    }

    setSyncing(false);
    onSync();
  }

  const pendingCount = entries.filter((e) => e.status === 'pending').length;
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (entries.length === 0) {
    return (
      <div className="queue-empty">
        <p>📭 No vouchers in queue yet.</p>
        <p className="queue-empty__hint">Scan a QR or tap an NFC tag to add one.</p>
      </div>
    );
  }

  return (
    <div className="queue">
      <div className="queue__header">
        <h3 className="queue__title">
          Offline Queue
          <span className="queue__badge">{pendingCount}</span>
        </h3>
        <button
          id="sync-btn"
          className="btn btn--primary btn--sm"
          onClick={handleSync}
          disabled={syncing || pendingCount === 0 || !isOnline}
          title={!isOnline ? 'No internet connection' : ''}
        >
          {syncing ? '⏳ Syncing…' : !isOnline ? '📵 Offline' : '☁ Sync to Stellar'}
        </button>
      </div>

      <ul className="queue__list">
        {entries.map((entry) => (
          <li key={entry.voucher.xdr.slice(0, 20)} className={`queue__item queue__item--${entry.status}`}>
            <div className="queue__item-left">
              <span className="queue__item-index">#{entry.voucher.index}</span>
              <div>
                <div className="queue__item-amount">{entry.voucher.amount} XLM</div>
                <div className="queue__item-dest">
                  {entry.voucher.destination.slice(0, 8)}…{entry.voucher.destination.slice(-6)}
                </div>
              </div>
            </div>
            <div className="queue__item-status">
              {entry.status === 'pending' && <span className="badge badge--pending">Pending</span>}
              {entry.status === 'submitting' && <span className="badge badge--submitting">⏳ Sending…</span>}
              {entry.status === 'success' && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${entry.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge badge--success"
                >
                  ✅ On-chain ↗
                </a>
              )}
              {entry.status === 'failed' && (
                <span className="badge badge--failed" title={entry.error}>
                  ❌ Failed
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
