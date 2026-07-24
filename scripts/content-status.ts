/**
 * Print the content buffer status (same data as /status-content).
 * Usage: npx tsx scripts/content-status.ts
 */
import { computeStatus } from '@/lib/storage/status';

const status = computeStatus();
process.stdout.write(JSON.stringify(status, null, 2) + '\n');

if (status.bufferDays < 7) {
  process.stderr.write(`AVERTISMENT: buffer de doar ${status.bufferDays} zile (țintă: 14+).\n`);
  process.exitCode = 1;
}
