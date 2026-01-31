import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatTime,
  calculateAccuracy,
  shuffle,
  generateId,
} from '@/utils/helpers';

describe('Utility Functions', () => {
  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(3665)).toBe('1h 1m');
    });
  });

  describe('formatTime', () => {
    it('formats time without hours', () => {
      expect(formatTime(90)).toBe('01:30');
    });

    it('formats time with hours', () => {
      expect(formatTime(3665)).toBe('01:01:05');
    });

    it('pads single digits with zeros', () => {
      expect(formatTime(5)).toBe('00:05');
    });
  });

  describe('calculateAccuracy', () => {
    it('calculates percentage correctly', () => {
      expect(calculateAccuracy(8, 10)).toBe(80);
    });

    it('handles zero total', () => {
      expect(calculateAccuracy(5, 0)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      expect(calculateAccuracy(2, 3)).toBe(67);
    });
  });

  describe('shuffle', () => {
    it('returns array of same length', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled.length).toBe(arr.length);
    });

    it('contains all original elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      arr.forEach((item) => {
        expect(shuffled).toContain(item);
      });
    });

    it('does not mutate original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffle(arr);
      expect(arr).toEqual(original);
    });
  });

  describe('generateId', () => {
    it('generates a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('generates unique ids', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });
});
