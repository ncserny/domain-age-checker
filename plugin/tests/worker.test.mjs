import assert from 'node:assert/strict';
import test from 'node:test';
import worker, { normalizeDomain, checkDomain } from '../worker/index.js';

const request = (message, headers = {}) => new Request('https://plugin.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(message) });
test('normalizes URLs and IDNs without forwarding private URL details', async () => {
  assert.equal(normalizeDomain('https://Example.COM/private?token=secret#fragment'), 'example.com');
  assert.equal(normalizeDomain('bücher.de'), 'xn--bcher-kva.de');
  assert.equal(normalizeDomain('example.com.'), 'example.com');
  for (const value of ['', 'localhost', '127.0.0.1', 'ftp://example.com', 'https://user:password@example.com', '-example.com']) assert.throws(() => normalizeDomain(value));
  let called;
  const result = await checkDomain({ domain: 'https://example.com/private?token=secret' }, async url => {
    called = url.href;
    return Response.json({ created: 'August 14, 1995', expires: 'August 13, 2027', age: '31 years, 1 month', daysLeft: 317 });
  });
  assert.equal(called, 'https://api-dac.nader.io/?domain=example.com');
  assert.equal(result.structuredContent.daysLeft, 317);
  assert.ok(result.structuredContent.checkedAt);
});
test('preserves missing fields and expired domains', async () => {
  const result = await checkDomain({ domain: 'example.com' }, async () => Response.json({ created: 'Unknown', expires: 'September 1, 2026', age: null, daysLeft: -29 }));
  assert.equal(result.structuredContent.created, null);
  assert.equal(result.structuredContent.daysLeft, -29);
});
test('reports upstream failures without inventing dates', async () => {
  for (const status of [404, 429, 500]) {
    const result = await checkDomain({ domain: 'example.com' }, async () => new Response('', { status }));
    assert.equal(result.isError, true);
  }
  assert.equal((await checkDomain({ domain: 'example.com' }, async () => { throw new Error('Timeout'); })).isError, true);
  assert.equal((await checkDomain({ domain: 'example.com' }, async () => new Response('not JSON'))).isError, true);
});
test('MCP initialization, discovery, notifications and protocol errors', async () => {
  const init = await (await worker.fetch(request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } }))).json();
  assert.equal(init.result.protocolVersion, '2025-03-26');
  const list = await (await worker.fetch(request({ jsonrpc: '2.0', id: 2, method: 'tools/list' }))).json();
  assert.equal(list.result.tools[0].name, 'check_domain_age');
  assert.equal(list.result.tools[0].annotations.readOnlyHint, true);
  assert.equal((await worker.fetch(request({ jsonrpc: '2.0', method: 'notifications/initialized' }))).status, 202);
  assert.equal((await worker.fetch(request({ jsonrpc: '2.0', id: 3, method: 'ping' }, { 'mcp-protocol-version': 'invalid' }))).status, 400);
  assert.equal((await (await worker.fetch(request([]))).json()).error.code, -32600);
});
test('lookups require trusted Sites identity; invalid inputs never reach upstream', async () => {
  const message = { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'check_domain_age', arguments: { domain: 'localhost' } } };
  assert.equal((await worker.fetch(request(message))).status, 401);
  const authenticated = await (await worker.fetch(request(message, { 'oai-authenticated-user-id': 'test-user' }))).json();
  assert.equal(authenticated.result.isError, true);
});
