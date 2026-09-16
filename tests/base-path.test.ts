import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { normalizeBasePath, withBasePath } from '../lib/base-path.ts';

void test('normalizes the optional deployment prefix', () => {
  assert.equal(normalizeBasePath(undefined), '');
  assert.equal(normalizeBasePath(''), '');
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(
    normalizeBasePath('/2advanced-attractor-homage/'),
    '/2advanced-attractor-homage',
  );
});

void test('rejects values that cannot be a path prefix', () => {
  for (const value of [
    '2advanced-attractor-homage',
    'https://example.com/2advanced-attractor-homage',
    '/2advanced-attractor-homage?query=1',
    '/2advanced-attractor-homage#section',
    '/2advanced//attractor',
    '/./attractor',
    '/../attractor',
    '/2advanced/../attractor',
  ]) {
    assert.throws(() => normalizeBasePath(value), /NEXT_PUBLIC_BASE_PATH/);
  }
});

void test('prefixes public assets once and leaves other URLs alone', () => {
  const prefix = '/2advanced-attractor-homage';
  assert.equal(
    withBasePath('/scenes/blue-remaster.webp', prefix),
    '/2advanced-attractor-homage/scenes/blue-remaster.webp',
  );
  assert.equal(
    withBasePath('/2advanced-attractor-homage/audio/nav-hover.wav', prefix),
    '/2advanced-attractor-homage/audio/nav-hover.wav',
  );
  assert.equal(
    withBasePath('/2advanced-attractor-homage/licensing.html?from=footer', prefix),
    '/2advanced-attractor-homage/licensing.html?from=footer',
  );
  assert.equal(
    withBasePath('https://example.com/film.mp4', prefix),
    'https://example.com/film.mp4',
  );
  assert.equal(withBasePath('#navigation', prefix), '#navigation');
});
