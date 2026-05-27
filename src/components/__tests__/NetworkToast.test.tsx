import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import NetworkToast from '../NetworkToast';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('NetworkToast', () => {
  it('renders offline message for type="offline"', () => {
    render(<NetworkToast type="offline" onDone={vi.fn()} />);
    expect(screen.getByText(/当前离线/)).toBeTruthy();
    expect(screen.getByText(/已缓存内容仍可浏览/)).toBeTruthy();
  });

  it('renders online message for type="online"', () => {
    render(<NetworkToast type="online" onDone={vi.fn()} />);
    expect(screen.getByText(/网络已恢复/)).toBeTruthy();
  });

  it('renders nothing for type=null', () => {
    const { container } = render(<NetworkToast type={null} onDone={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onDone after 3 seconds', () => {
    const onDone = vi.fn();
    render(<NetworkToast type="offline" onDone={onDone} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onDone).toHaveBeenCalled();
  });

  it('clears timer and calls onDone on manual dismiss', () => {
    const onDone = vi.fn();
    render(<NetworkToast type="online" onDone={onDone} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const closeBtn = screen.getByLabelText('关闭');
    closeBtn.click();

    expect(onDone).toHaveBeenCalled();
  });
});
