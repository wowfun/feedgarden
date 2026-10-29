import { FdgError } from './errors.js';
export class ModelError extends FdgError {
  constructor(
    code: string,
    message: string,
    retryAt?: string,
    readonly scope: 'model' | 'account' = 'account',
  ) {
    super(code, message, retryAt);
  }
}
