
export function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/(Bearer\s+|(?:token|api[_-]?key|ct0|auth_token)[=:]\s*)[^\s,;]+/gi, '$1[redacted]').slice(0, 2000);
}
