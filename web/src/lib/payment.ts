import {
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, USDC_ISSUER } from './stellar';

export type AssetCode = 'XLM' | 'USDC';

/** Build an unsigned classic payment transaction with multiple recipients and return its XDR. */
export async function buildMultiPaymentXDR(
  sender: string,
  destinations: string[],
  amounts: string[],
  assetCode: AssetCode = 'XLM',
): Promise<string> {
  const asset = assetCode === 'XLM' ? Asset.native() : new Asset('USDC', USDC_ISSUER);

  // Always load the account fresh so we have the current sequence number.
  const account = await server.getAccount(sender);

  let builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  for (let i = 0; i < destinations.length; i++) {
    builder = builder.addOperation(
      Operation.payment({ destination: destinations[i], asset, amount: amounts[i] })
    );
  }

  const tx = builder.setTimeout(60).build();
  return tx.toXDR();
}

/** Submit a Freighter-signed XDR. Returns the transaction hash. */
export async function submitSignedXDR(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const res = await server.sendTransaction(tx);
  if (res.status === 'ERROR') {
    throw new Error(`Submit rejected: ${JSON.stringify(res.errorResult ?? res)}`);
  }
  return res.hash;
}

/**
 * Poll until the transaction reaches finality.
 * `sendTransaction` returning PENDING is NOT success — you must poll.
 */
export async function pollTransaction(hash: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await server.getTransaction(hash);
    if (res.status !== 'NOT_FOUND') {
      if (res.status === 'SUCCESS') return;
      throw new Error(`Transaction ${res.status}`);
    }
  }
  throw new Error('Transaction timed out after 60s');
}
