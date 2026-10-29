/** Public publishing API. Import internal files only within this module. */
export { adoptTarget } from './adoption.js';
export { inspectTarget } from './checkout.js';
export { exportTarget } from './export.js';
export { publish } from './publish.js';
export { assertManagedPaths, targetFor } from './targets.js';
export { reconcileTargetTopics } from './topics.js';
export { confirmPush } from './transport.js';
