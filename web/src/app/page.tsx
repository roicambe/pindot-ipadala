'use client';
import { useState } from 'react';
import BillSplitter from '@/components/BillSplitter';

export default function Home() {
  const [view, setView] = useState<'landing' | 'split'>('landing');

  return (
    <main className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <span className="app-header__logo">🧾</span>
            <div>
              <h1 className="app-header__title">Stellar Bill Splitter</h1>
              <p className="app-header__tagline">Fast, fair, and atomic</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="app-body">
        {view === 'landing' ? (
          <div className="panel text-center py-12">
            <div className="text-6xl mb-6">💸</div>
            <h2 className="text-2xl font-bold mb-4">Split Bills on the Blockchain</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Easily divide a total bill among friends and send the exact amounts instantly via a single Stellar transaction.
            </p>
            <button
              className="btn btn--primary"
              onClick={() => setView('split')}
            >
              Start a Split
            </button>
          </div>
        ) : (
          <BillSplitter onBack={() => setView('landing')} />
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        Built on Stellar Testnet · Simple Bill Splitter ·{' '}
        <a
          href="https://stellar.expert/explorer/testnet"
          target="_blank"
          rel="noopener noreferrer"
          className="app-footer__link"
        >
          Stellar Expert ↗
        </a>
      </footer>
    </main>
  );
}
