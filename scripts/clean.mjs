// Removes the .next build folder before every build so a stale or half-written one (for example one locked by
// antivirus or a still-running dev server on Windows) can never be mixed into a new build.
import { rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.cwd(), '.next');
if (existsSync(dir)) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    console.log('Cleaned .next');
  } catch (err) {
    console.error('Could not delete .next (' + err.code + '). Stop any running "npm run dev" / "npm start", pause antivirus scanning of this folder, then retry.');
    process.exit(1);
  }
}
