import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], { stdio: 'inherit' });
if (existsSync('integrations/wdk/node_modules/@x402/evm/package.json')) {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '-p', 'tsconfig.wdk.json'], { stdio: 'inherit' });
  console.log('Core and installed optional WDK adapter strict contracts PASS.');
} else console.log('Core strict contract PASS; optional WDK profile not installed. Run typecheck:adapter after installing it.');
