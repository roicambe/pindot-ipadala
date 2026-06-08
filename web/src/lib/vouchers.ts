import {
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Account,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from './stellar';

/** A single pre-signed payment voucher. */
export interface Voucher {
  /** 1-based position in the batch — must be submitted in this order. */
  index: number;
  /** Fully signed XDR string, ready to submit to Horizon. */
  xdr: string;
  /** XLM amount as a string, e.g. "10". */
  amount: string;
  /** Merchant's Stellar public key. */
  destination: string;
  /** Unix timestamp (ms) when this voucher was created. */
  createdAt: number;
}

/**
 * Build N unsigned XDR transactions with sequential sequence numbers
 * (seq+1, seq+2, … seq+N) for the same destination and amount.
 *
 * IMPORTANT: These transactions must be submitted in index order.
 * Submitting #2 before #1 will cause #2 to fail with tx_bad_seq.
 */
export async function buildVoucherXDRs(
  sender: string,
  destination: string,
  amount: string,
  count: number,
): Promise<string[]> {
  // Fetch account once — we'll manually increment the sequence number.
  const accountData = await server.getAccount(sender);
  const xdrs: string[] = [];

  for (let i = 0; i < count; i++) {
    // Account tracks sequence internally; each call to .build() increments it.
    const account = new Account(sender, accountData.sequenceNumber());
    // Manually set to (base + i) so each tx gets a unique, ordered seq.
    // The Account constructor uses the CURRENT seq, so we need to bump it
    // by the loop offset.  We rebuild from the raw sequence number each time.
    const baseSeq = BigInt(accountData.sequenceNumber());
    const thisSeq = (baseSeq + BigInt(i)).toString();
    const offsetAccount = new Account(sender, thisSeq);

    const tx = new TransactionBuilder(offsetAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({ destination, asset: Asset.native(), amount }),
      )
      .setTimeout(0) // 0 = no expiry — voucher stays valid indefinitely
      .build();

    xdrs.push(tx.toXDR());
  }

  return xdrs;
}

/**
 * Build and Freighter-sign N vouchers, returning them one by one.
 * Calls `onProgress` after each signing so the UI can show progress.
 *
 * Each voucher requires a separate Freighter approval popup.
 */
export async function buildAndSignVouchers(
  sender: string,
  destination: string,
  amount: string,
  count: number,
  onProgress: (signed: number, total: number) => void,
): Promise<Voucher[]> {
  const freighter = await import('@stellar/freighter-api');
  const xdrs = await buildVoucherXDRs(sender, destination, amount, count);
  const vouchers: Voucher[] = [];

  for (let i = 0; i < xdrs.length; i++) {
    const result = await freighter.signTransaction(xdrs[i], {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: sender,
    });

    if (result.error) {
      throw new Error(
        typeof result.error === 'string'
          ? result.error
          : `Signing cancelled on voucher ${i + 1}`,
      );
    }

    vouchers.push({
      index: i + 1,
      xdr: result.signedTxXdr,
      amount,
      destination,
      createdAt: Date.now(),
    });

    onProgress(i + 1, count);
  }

  return vouchers;
}

/** Encode a voucher to a compact JSON string for embedding in a QR code. */
export function encodeVoucher(voucher: Voucher): string {
  return JSON.stringify({
    v: 1,               // schema version
    i: voucher.index,
    x: voucher.xdr,
    a: voucher.amount,
    d: voucher.destination,
    t: voucher.createdAt,
  });
}

/** Decode a QR-scanned string back into a Voucher. Returns null on failure. */
export function decodeVoucher(raw: string): Voucher | null {
  try {
    const obj = JSON.parse(raw);
    if (obj.v !== 1 || !obj.x || !obj.d) return null;
    return {
      index: obj.i,
      xdr: obj.x,
      amount: obj.a,
      destination: obj.d,
      createdAt: obj.t,
    };
  } catch {
    return null;
  }
}
