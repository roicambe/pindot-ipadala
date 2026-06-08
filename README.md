# TapSend PH

Offline-first "Tap-and-Pay" via NFC/QR Vouchers — built on Stellar.

## Problem
Rural Filipino merchants and jeepney/transit riders frequently experience spotty or zero internet connectivity, making real-time payment apps unreliable. Remittance workers, market vendors, and commuters in underserved areas cannot confidently use digital payments when the signal drops.

## How It Works
**TapSend PH** solves this by letting senders pre-authorize a batch of small payments while connected. 
1. **Sender (Online):** The user connects their Freighter wallet and pre-signs a batch of payments (e.g., five 10 XLM payments) to a specific merchant.
2. **Voucher Generation:** These pre-signed transactions are converted into "vouchers" displayed as a swipeable QR code carousel or written to a cheap, passive NFC sticker.
3. **Merchant (Offline):** The merchant scans the QR code or taps the NFC sticker using their phone. The transaction is stored locally on their device. No internet is required at the moment of purchase.
4. **Sync (Online):** When the merchant regains internet connectivity, they press "Sync to Stellar," which submits the queued, pre-signed transactions to the blockchain to settle the payments.

## How It Uses Stellar
- **Pre-signed XDR transactions:** This is a native Stellar Classic primitive. We do not use smart contracts. Each voucher is a fully-signed `Payment` operation (using native XLM) with sequential account sequence numbers, signed via the Freighter browser extension.
- The merchant's phone submits the signed XDR to **Horizon** when connectivity is restored.
- Works entirely with Classic Stellar.

## Track
Financial Inclusion / Social Impact

## Tech Stack
- Framework: Next.js 16 / React 19
- Stellar SDK: @stellar/stellar-sdk v15.1.0
- Wallet API: @stellar/freighter-api v6.0.1
- Styling: Tailwind CSS v4
- QR/NFC: `qrcode.react`, `html5-qrcode`, native Web NFC API (Android)
- Network: testnet

## Setup & Run
Run this project locally:

```bash
# Clone the repository (replace with your repo URL)
git clone https://github.com/your-username/TapSend-PH.git
cd TapSend-PH/web

# Install dependencies
npm install

# Start the development server
npm run dev
```
Open `http://localhost:3000` in your browser. No environment variables or smart contract deployments are needed for the core voucher system to work!

## Network Details
- Network: testnet
- RPC URL: `https://soroban-testnet.stellar.org`
- Horizon URL: `https://horizon-testnet.stellar.org`
- Contract IDs: None (Uses Native Stellar Classic)
- Asset issuers: Native XLM

## Team
- [Your Name] — @[your-github-username]

## License
MIT
