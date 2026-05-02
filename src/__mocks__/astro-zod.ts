// Re-export zod as astro/zod mock for Vitest
// Using createRequire to resolve the pnpm-managed zod package at runtime
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const zod = _require('zod');
export const z = zod.z;
export default zod;
