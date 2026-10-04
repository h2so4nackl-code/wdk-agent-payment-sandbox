import test from 'node:test';
import assert from 'node:assert/strict';
import { expressFixture } from './express-fixture.mjs';
import { createWdkTestMode } from './official.mjs';
test('Official Express/core resource middleware over loopback HTTP, WDK gated signer and simulated settlement', async () => {
  const server = await expressFixture();
  const w = await createWdkTestMode({ mode: 'wdk-test', resource: server.resource });
  try {
    const initial = await fetch(server.resource);
    assert.equal(initial.status, 402); await initial.body.cancel();
    assert.equal(server.stats.releases, 0);
    const result = await w.agent.purchase(w.host.authorize(), request => fetch(request));
    assert.equal(result.ok, true);
    assert.equal((await result.value.json()).data, 'official local conformance resource');
    assert.equal(w.stats.testAuthorizations, 1); assert.equal(server.stats.settlements, 1);
    assert.equal(server.stats.broadcasts, 0);
  } finally { await w.dispose(); await server.close(); }
});
