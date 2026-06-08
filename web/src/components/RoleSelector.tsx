'use client';

export type Role = 'sender' | 'merchant' | null;

interface RoleSelectorProps {
  onSelect: (role: Role) => void;
}

export default function RoleSelector({ onSelect }: RoleSelectorProps) {
  return (
    <div className="role-selector">
      <p className="role-selector__label">Choose your role to get started</p>
      <div className="role-selector__grid">
        <button
          id="role-sender"
          className="role-card role-card--sender"
          onClick={() => onSelect('sender')}
        >
          <span className="role-card__icon">💸</span>
          <span className="role-card__title">Sender</span>
          <span className="role-card__desc">
            Pre-load vouchers and generate QR / NFC payment tokens
          </span>
        </button>
        <button
          id="role-merchant"
          className="role-card role-card--merchant"
          onClick={() => onSelect('merchant')}
        >
          <span className="role-card__icon">🏪</span>
          <span className="role-card__title">Merchant</span>
          <span className="role-card__desc">
            Scan QR codes or tap NFC, then sync to Stellar when online
          </span>
        </button>
      </div>
    </div>
  );
}
