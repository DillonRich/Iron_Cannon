#!/usr/bin/env node
import { runObligationCalibrationSuite } from '../packages/mcp-core/src/obligation-calibrate.js';

const { total, failures } = runObligationCalibrationSuite();
const maxShow = 10;
if (failures.length) {
  console.error(
    `G-2 obligation calibration: ${failures.length}/${total} failed\n` +
      failures
        .slice(0, maxShow)
        .map((f) => `${f.obligationId} pass=${f.passOk} fail=${f.failOk}`)
        .join('\n'),
  );
  process.exit(1);
}
console.log(`✓ G-2 obligation calibration — ${total} entries pass/fail calibrated`);
process.exit(0);
