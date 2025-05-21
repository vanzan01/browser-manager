import { describe, it, expect } from 'vitest';
import { formatBytes, formatDate, getColorForValue } from '../format';

describe('formatBytes', () => {
  it('formats zero bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('respects decimal precision', () => {
    expect(formatBytes(1500, 2)).toBe('1.46 KB');
    expect(formatBytes(1500, 0)).toBe('1 KB');
  });
});

describe('formatDate', () => {
  it('handles null date', () => {
    expect(formatDate(null)).toBe('Never');
  });

  it('formats recent dates as relative time', () => {
    const now = new Date();
    
    // 5 minutes ago
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatDate(fiveMinutesAgo)).toBe('5 minutes ago');
    
    // 1 hour ago
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    expect(formatDate(oneHourAgo)).toBe('1 hour ago');
  });
});

describe('getColorForValue', () => {
  it('returns green for low percentages', () => {
    expect(getColorForValue(0, 100)).toBe('rgb(0, 255, 0)');
    expect(getColorForValue(25, 100)).toBe('rgb(127, 255, 0)');
  });

  it('returns yellow for medium percentages', () => {
    expect(getColorForValue(50, 100)).toBe('rgb(255, 255, 0)');
  });

  it('returns red for high percentages', () => {
    expect(getColorForValue(75, 100)).toBe('rgb(255, 127, 0)');
    expect(getColorForValue(100, 100)).toBe('rgb(255, 0, 0)');
  });

  it('caps at red for values greater than max', () => {
    expect(getColorForValue(150, 100)).toBe('rgb(255, 0, 0)');
  });
});