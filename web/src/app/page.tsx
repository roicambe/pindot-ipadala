'use client';
import { useState } from 'react';
import RoleSelector, { type Role } from '@/components/RoleSelector';
import VoucherGenerator from '@/components/VoucherGenerator';
import MerchantScanner from '@/components/MerchantScanner';

export default function Home() {
  const [role, setRole] = useState<Role>(null);

  return (
    <main className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <span className="app-header__logo">⚡</span>
            <div>
              <h1 className="app-header__title">TapSend PH</h1>
              <p className="app-header__tagline">Offline-first Stellar payments</p>
            </div>
          </div>
          {role && (
            <button
              id="back-btn"
              className="btn btn--ghost btn--sm"
              onClick={() => setRole(null)}
            >
              ← Back
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="app-body">
        {!role && <RoleSelector onSelect={setRole} />}
        {role === 'sender' && <VoucherGenerator />}
        {role === 'merchant' && <MerchantScanner />}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        Built on Stellar Testnet · StellarX PH Workshop @ PUP QC ·{' '}
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
