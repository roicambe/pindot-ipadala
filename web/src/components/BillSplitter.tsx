'use client';
import { useState, useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import ConnectWallet from './ConnectWallet';
import BalanceCard from './BalanceCard';
import { fundTestnetAccount } from '@/lib/stellar';
import { buildMultiPaymentXDR } from '@/lib/payment';
import { signAndSubmit } from '@/lib/sign';
import ReceiptModal, { type ReceiptData } from './ReceiptModal';

interface BillSplitterProps {
  onBack?: () => void;
}

export default function BillSplitter({ onBack }: BillSplitterProps) {
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [totalBill, setTotalBill] = useState('');
  const [participants, setParticipants] = useState('2');
  const [destinations, setDestinations] = useState<string[]>(['', '']);

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [funded, setFunded] = useState(false);
  const [funding, setFunding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const parsedParticipants = Math.max(1, parseInt(participants, 10) || 1);

  const individualShare = useMemo(() => {
    const bill = parseFloat(totalBill);
    if (!isNaN(bill) && parsedParticipants > 0) {
      return (bill / parsedParticipants).toFixed(7);
    }
    return '0.0000000';
  }, [totalBill, parsedParticipants]);

  // Adjust the destinations array length when participants count changes
  const handleParticipantsChange = (val: string) => {
    setParticipants(val);
    const count = parseInt(val, 10);
    if (!isNaN(count) && count > 0) {
      setDestinations((prev) => {
        const newDest = [...prev];
        if (count > prev.length) {
          for (let i = prev.length; i < count; i++) newDest.push('');
        } else if (count < prev.length) {
          newDest.length = count;
        }
        return newDest;
      });
    }
  };

  const handleDestinationChange = (index: number, val: string) => {
    const newDest = [...destinations];
    newDest[index] = val;
    setDestinations(newDest);
  };

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

  async function handleSplitAndPay() {
    // Validate inputs
    if (!publicKey || parseFloat(individualShare) <= 0) return;
    const cleanDests = destinations.map((d) => d.trim()).filter(Boolean);
    if (cleanDests.length !== parsedParticipants) {
      setError('Please provide valid Stellar addresses for all participants.');
      return;
    }

    setError(null);
    setPaying(true);

    try {
      // Create an array of identical amounts for each destination
      const amounts = Array(parsedParticipants).fill(individualShare);
      const xdr = await buildMultiPaymentXDR(publicKey, cleanDests, amounts, 'XLM');
      
      await signAndSubmit(xdr, publicKey);
      
      // Show receipt modal on success
      setReceiptData({
        totalAmount: totalBill,
        participants: parsedParticipants,
        individualShare,
        networkFee: (0.0000100 * parsedParticipants).toFixed(7), // base fee * ops
        date: new Date(),
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed. Please verify the destination addresses and your balance.');
    } finally {
      setPaying(false);
    }
  }

  function handleNewSplit() {
    setReceiptData(null);
    setTotalBill('');
    setParticipants('2');
    setDestinations(['', '']);
  }

  return (
    <>
      <div className="panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="panel__title mb-0">Settle the Bill</h2>
          {onBack && (
            <button onClick={onBack} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              ← Back
            </button>
          )}
        </div>
        <p className="panel__subtitle">
          Distribute funds natively across multiple accounts in a single Stellar transaction.
        </p>

        <div className="panel__section">
          <ConnectWallet {...wallet} />
        </div>

        {publicKey && (
          <>
            <div className="panel__section">
              <BalanceCard publicKey={publicKey} refreshKey={refreshKey} />
              <button
                className="btn btn--ghost btn--sm mt-2"
                onClick={handleFund}
                disabled={funding}
              >
                {funding ? 'Funding account...' : funded ? '✅ Account Funded' : '🚰 Get testnet XLM'}
              </button>
            </div>

            <div className="panel__section">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Bill Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 100.00"
                    value={totalBill}
                    onChange={(e) => setTotalBill(e.target.value)}
                  />
                  <p className="helper-text">Total amount in XLM.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Number of Participants</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    step="1"
                    value={participants}
                    onChange={(e) => handleParticipantsChange(e.target.value)}
                  />
                  <p className="helper-text">How many ways to split?</p>
                </div>
              </div>

              <div className="mt-6 mb-4">
                <h3 className="font-semibold text-slate-800 mb-3">Participant Addresses</h3>
                <div className="flex flex-col gap-3">
                  {destinations.map((dest, i) => (
                    <div className="form-group mb-0" key={i}>
                      <input
                        className="form-input"
                        type="text"
                        placeholder={`Address for Participant ${i + 1} (GABCD...)`}
                        value={dest}
                        onChange={(e) => handleDestinationChange(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6 mb-6 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Split Amount per Person:</span>
                <span className="text-2xl font-bold text-blue-600">{individualShare} XLM</span>
              </div>

              {error && <p className="form-error mb-4">{error}</p>}

              <button
                className="btn btn--primary btn--full"
                onClick={handleSplitAndPay}
                disabled={paying || parseFloat(individualShare) <= 0}
              >
                {paying ? 'Processing Payment...' : `Send ${individualShare} XLM to ${parsedParticipants} addresses`}
              </button>
            </div>
          </>
        )}
      </div>

      {receiptData && (
        <ReceiptModal 
          data={receiptData} 
          onClose={() => setReceiptData(null)} 
          onNewSplit={handleNewSplit} 
        />
      )}
    </>
  );
}
