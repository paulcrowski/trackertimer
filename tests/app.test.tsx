import assert from 'node:assert/strict';
import test from 'node:test';

import App from '../src/App.tsx';

test('App exports a component function', () => {
  assert.equal(typeof App, 'function');
});
