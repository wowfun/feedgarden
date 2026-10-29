export class FdgError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryAt?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'FdgError';
  }
}
export function issue(error: unknown): {
  code: string;
  message: string;
  retryAt?: string;
  evidence?: { trust: 'untrusted'; text: string };
} {
  if (error instanceof FdgError)
    return {
      code: error.code,
      message: error.message,
      ...(error.retryAt ? { retryAt: error.retryAt } : {}),
      ...(error.details
        ? { evidence: { trust: 'untrusted' as const, text: redact(JSON.stringify(error.details)) } }
        : {}),
    };
  return {
    code: 'UNKNOWN',
    message: 'Operation failed; inspect diagnostic evidence',
    evidence: { trust: 'untrusted', text: redact(error instanceof Error ? error.message : String(error)) },
  };
}
export function redact(text: string): string {
  for (const [key, value] of Object.entries(process.env))
    if (value && value.length >= 6 && /TOKEN|SECRET|PASSWORD|API_KEY|COOKIE|CT0/i.test(key))
      text = text.split(value).join('[REDACTED]');
  return text.replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/g, '$1[REDACTED]@');
}
