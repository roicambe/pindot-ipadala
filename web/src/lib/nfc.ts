/**
 * Web NFC API wrapper — progressive enhancement only.
 * Web NFC is available on Android Chrome 89+ only.
 * All functions gracefully no-op on unsupported browsers.
 */

/** Returns true if the Web NFC API is available in this browser. */
export function isNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/**
 * Write a string payload to an NFC tag.
 * Resolves when the tag is written successfully.
 * Rejects if NFC is not supported or writing fails.
 */
export async function writeNfcTag(payload: string): Promise<void> {
  if (!isNfcSupported()) {
    throw new Error('Web NFC is not supported in this browser.');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ndef = new (window as any).NDEFReader();
  await ndef.write({
    records: [{ recordType: 'text', data: payload }],
  });
}

/**
 * Start listening for NFC tag reads.
 * Calls `onRead` with the raw text payload each time a tag is scanned.
 * Returns a cleanup function — call it to stop listening.
 */
export async function readNfcTag(
  onRead: (data: string) => void,
  onError?: (err: Error) => void,
): Promise<() => void> {
  if (!isNfcSupported()) {
    throw new Error('Web NFC is not supported in this browser.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ndef = new (window as any).NDEFReader();
  await ndef.scan();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReading = (event: any) => {
    for (const record of event.message.records) {
      if (record.recordType === 'text') {
        const decoder = new TextDecoder(record.encoding ?? 'utf-8');
        onRead(decoder.decode(record.data));
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleError = (event: any) => {
    onError?.(new Error(event.message ?? 'NFC read error'));
  };

  ndef.addEventListener('reading', handleReading);
  ndef.addEventListener('readingerror', handleError);

  return () => {
    ndef.removeEventListener('reading', handleReading);
    ndef.removeEventListener('readingerror', handleError);
  };
}
