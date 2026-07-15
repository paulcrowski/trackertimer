import assert from 'node:assert/strict';
import test from 'node:test';
import { hashDesktopHelperKey, issueDesktopHelperKey } from '../convex/helperKey.ts';

test('helper keys are generated with enough entropy and hashed deterministically', async () => {
  const first = issueDesktopHelperKey();
  const second = issueDesktopHelperKey();

  assert.equal(first.length, 64);
  assert.equal(second.length, 64);
  assert.notEqual(first, second);
  assert.match(await hashDesktopHelperKey('local-test-key'), /^[0-9a-f]{64}$/);
  assert.equal(
    await hashDesktopHelperKey('local-test-key'),
    await hashDesktopHelperKey('local-test-key'),
  );
  assert.notEqual(
    await hashDesktopHelperKey('local-test-key'),
    await hashDesktopHelperKey('different-key'),
  );
});
