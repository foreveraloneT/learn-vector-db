import { describe, it, expect } from 'vitest';
import { getOtherLocale, buildTopicPath, getOtherLocaleUrl, isLocale } from './i18n';

describe('isLocale', () => {
  it('accepts th and en', () => {
    expect(isLocale('th')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });
  it('rejects everything else', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale('TH')).toBe(false);
  });
});

describe('getOtherLocale', () => {
  it('returns en when given th', () => {
    expect(getOtherLocale('th')).toBe('en');
  });
  it('returns th when given en', () => {
    expect(getOtherLocale('en')).toBe('th');
  });
});

describe('buildTopicPath', () => {
  it('builds a TH topic path with no prefix', () => {
    expect(buildTopicPath('th', 'vector')).toBe('/vector');
  });
  it('builds an EN topic path with /en prefix', () => {
    expect(buildTopicPath('en', 'vector')).toBe('/en/vector');
  });
  it('builds the TH home as /', () => {
    expect(buildTopicPath('th', '')).toBe('/');
  });
  it('builds the EN home as /en/', () => {
    expect(buildTopicPath('en', '')).toBe('/en/');
  });
});

describe('getOtherLocaleUrl', () => {
  it('flips a TH topic to EN', () => {
    expect(getOtherLocaleUrl('th', 'vector')).toBe('/en/vector');
  });
  it('flips an EN topic to TH', () => {
    expect(getOtherLocaleUrl('en', 'vector')).toBe('/vector');
  });
  it('flips the TH home to EN home', () => {
    expect(getOtherLocaleUrl('th', '')).toBe('/en/');
  });
  it('flips the EN home to TH home', () => {
    expect(getOtherLocaleUrl('en', '')).toBe('/');
  });
});
