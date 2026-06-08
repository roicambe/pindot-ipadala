# TapSend PH

Offline-first "Tap-and-Pay" via NFC/QR Vouchers — built on the StellarX PH scaffold.

## Idea
- **Track:** Financial Inclusion / Social Impact
- **Idea # (from the 300-ideas list):** 11
- **One-liner:** Pre-sign XLM payments while online; pay via QR or NFC tap when offline — syncs to Stellar later.

## Problem
Rural Filipino merchants and jeepney/transit riders frequently experience spotty or zero internet
connectivity, making real-time payment apps unreliable. Remittance workers, market vendors, and
commuters in underserved areas cannot confidently use digital payments when signal drops.

**TapSend PH** solves this by letting senders pre-authorize a batch of small XLM payments while
connected, packaging each as a pre-signed Stellar transaction (XDR). These vouchers are displayed
as a rolling QR carousel or written to a cheap passive NFC sticker. The vendor scans/taps
completely offline — the signed transaction sits in their phone's localStorage — and submits to
the Stellar Horizon network whenever they next get a data signal.

## How it uses Stellar
- **Pre-signed XDR transactions** — a native Stellar Classic primitive; no smart contracts required.
- Each voucher is a fully-signed `Payment` operation (XLM, native asset) using sequential account
  sequence numbers, signed via the Freighter browser extension.
- The merchant's phone submits the signed XDR to **Horizon** (`https://horizon-testnet.stellar.org`)
  when connectivity is restored. Transactions are polled to finality using `getTransaction`.
- No trustlines needed (native XLM). No Soroban contract. Works entirely with Classic Stellar.

## What works in the demo
- [x] Connect wallet (Freighter, testnet)
- [x] Fund account via Friendbot
- [x] Generate a batch of pre-signed XLM payment vouchers (1–10 vouchers)
- [x] Display vouchers as a swipeable QR carousel
- [x] (Android Chrome) Write a voucher to an NFC tag
- [x] Merchant: scan QR with camera → voucher added to offline queue (localStorage)
- [x] (Android Chrome) Merchant: tap NFC tag → voucher queued
- [x] Sync queue to Stellar Horizon in sequence-number order
- [x] Per-voucher status (Pending → Submitting → ✅ On-chain) with Stellar Expert link

## Setup / run
- Network: **testnet**
- `cd web && npm install && npm run dev`
- No contract deployment needed — zero Soroban for this project.
- No additional env vars required beyond the defaults in `web/.env.local`.

## Demo
- 2–4 min video link: _(record after hackathon)_
- Public repo link: _(add after making public)_

## Submission checklist
- [x] Public GitHub repo with a license (MIT)
- [x] README explains problem, Stellar usage, and setup
- [ ] Demo video (2–4 min)
- [ ] Submitted via the workshop's official GitHub issue template
