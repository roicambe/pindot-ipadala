import type { Voucher } from './vouchers';

const QUEUE_KEY = 'tapsend_queue';

/** Retrieve all queued vouchers from localStorage. */
export function getQueue(): Voucher[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as Voucher[]) : [];
  } catch {
    return [];
  }
}

/** Add a voucher to the merchant's offline queue. */
export function enqueueVoucher(voucher: Voucher): void {
  const queue = getQueue();
  // Prevent duplicates — same XDR string means same transaction.
  if (queue.some((v) => v.xdr === voucher.xdr)) return;
  queue.push(voucher);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Remove a voucher from the queue by its XDR (after successful submission). */
export function dequeueVoucher(xdr: string): void {
  const queue = getQueue().filter((v) => v.xdr !== xdr);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Clear the entire queue (use after confirming all submitted). */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}
