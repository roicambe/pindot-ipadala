'use client';
import { useEffect, useState } from 'react';

export interface ReceiptData {
  totalAmount: string;
  participants: number;
  individualShare: string;
  networkFee: string;
  date: Date;
}

interface ReceiptModalProps {
  data: ReceiptData;
  onClose: () => void;
  onNewSplit: () => void;
}

export default function ReceiptModal({ data, onClose, onNewSplit }: ReceiptModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const formattedDate = data.date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="receipt-header">
          <div className="receipt-icon">✓</div>
          <h3 className="receipt-title">Split Successful!</h3>
          <p className="receipt-date">{formattedDate}</p>
        </div>

        <div className="receipt-body">
          <div className="receipt-row">
            <span className="receipt-label">Total Bill Amount</span>
            <span className="receipt-value">{data.totalAmount} XLM</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Number of Participants</span>
            <span className="receipt-value">{data.participants}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Individual Share</span>
            <span className="receipt-value">{data.individualShare} XLM</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Network Fee</span>
            <span className="receipt-value">{data.networkFee} XLM</span>
          </div>
        </div>

        <div className="receipt-actions">
          <button className="btn btn--primary btn--full" onClick={onNewSplit}>
            Start New Split
          </button>
          <button className="btn btn--ghost btn--full" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
