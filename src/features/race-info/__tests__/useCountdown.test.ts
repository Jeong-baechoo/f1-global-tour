import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate correct time until target date', () => {
    const now = new Date('2024-05-20T10:00:00');
    const targetDate = new Date('2024-05-26T14:00:00');
    jest.setSystemTime(now);

    const { result } = renderHook(() => useCountdown(targetDate.toISOString()));

    expect(result.current.days).toBe(6);
    expect(result.current.hours).toBe(4);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  it('should update countdown every second', () => {
    const now = new Date('2024-05-26T13:59:58');
    const targetDate = new Date('2024-05-26T14:00:00');
    jest.setSystemTime(now);

    const { result } = renderHook(() => useCountdown(targetDate.toISOString()));

    expect(result.current.seconds).toBe(2);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.minutes).toBe(0);
  });

  it('should return all zeros for past dates', () => {
    const now = new Date('2024-05-27T10:00:00');
    const targetDate = new Date('2024-05-26T14:00:00');
    jest.setSystemTime(now);

    const { result } = renderHook(() => useCountdown(targetDate.toISOString()));

    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  it('should clean up interval on unmount', () => {
    const targetDate = new Date('2024-05-26T14:00:00');
    const { unmount } = renderHook(() => useCountdown(targetDate.toISOString()));

    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});