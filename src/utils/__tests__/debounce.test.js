import { describe, it, expect } from 'vitest';
import { debounce, throttle } from '../../../utils/debounce';

describe('Debounce Utility', () => {
    it('debounces function calls', async () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        // Call multiple times quickly
        debouncedFn('test1');
        debouncedFn('test2');
        debouncedFn('test3');

        expect(mockFn).not.toHaveBeenCalled();

        // Wait for debounce delay
        await new Promise((resolve) => setTimeout(resolve, 150));

        expect(mockFn).toHaveBeenCalledOnce();
        expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('throttles function calls', () => {
        const mockFn = vi.fn();
        const throttledFn = throttle(mockFn, 100);

        throttledFn('test1');
        throttledFn('test2');
        throttledFn('test3');

        expect(mockFn).toHaveBeenCalledOnce();
        expect(mockFn).toHaveBeenCalledWith('test1');
    });

    it('handles function arguments correctly', async () => {
        const mockFn = vi.fn((a, b) => a + b);
        const debouncedFn = debounce(mockFn, 50);

        debouncedFn(2, 3);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mockFn).toHaveBeenCalledWith(2, 3);
    });

    it('can be cancelled by calling multiple times', async () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn();
        await new Promise((resolve) => setTimeout(resolve, 50));
        debouncedFn(); // Reset timer

        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(mockFn).not.toHaveBeenCalled();

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(mockFn).toHaveBeenCalledOnce();
    });
});
