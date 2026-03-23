import { describe, it, expect } from 'vitest';

/**
 * Sample unit test to verify the test infrastructure is working.
 * Add real feature tests alongside their source files in src/**\/*.spec.ts
 */
describe('example', () => {
  it('adds two numbers', () => {
    expect(1 + 1).toBe(2);
  });

  it('formats a string', () => {
    const name = 'Beauty Style Pro';
    expect(`Hello, ${name}!`).toBe('Hello, Beauty Style Pro!');
  });

  it('filters an array', () => {
    const items = ['hair', 'makeup', 'nails', 'full_look'];
    const result = items.filter((i) => i !== 'full_look');
    expect(result).toEqual(['hair', 'makeup', 'nails']);
  });
});
