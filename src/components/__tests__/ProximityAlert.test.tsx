import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProximityAlert from '../ProximityAlert';
import type { Attraction } from '../../types';

const mockAttraction: Attraction = {
  id: 'gugong-taihedian',
  name: '太和殿',
  areaId: 'gugong',
  location: [116.397, 39.916],
  radius: 40,
  image: '',
  segments: [{ text: '太和殿讲解' }],
};

describe('ProximityAlert', () => {
  it('renders attraction name and distance', () => {
    render(
      <ProximityAlert
        attraction={mockAttraction}
        distance={200}
        autoPlay={false}
        onPlay={vi.fn()}
        onDismiss={vi.fn()}
        onAutoPlayChange={vi.fn()}
      />,
    );
    expect(screen.getByText('太和殿')).toBeTruthy();
    expect(screen.getByText(/200m/)).toBeTruthy();
  });

  it('renders distance in km when >= 1000m', () => {
    render(
      <ProximityAlert
        attraction={mockAttraction}
        distance={1500}
        autoPlay={false}
        onPlay={vi.fn()}
        onDismiss={vi.fn()}
        onAutoPlayChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/1\.5km/)).toBeTruthy();
  });

  it('calls onPlay when play button clicked', () => {
    const onPlay = vi.fn();
    render(
      <ProximityAlert
        attraction={mockAttraction}
        distance={50}
        autoPlay={false}
        onPlay={onPlay}
        onDismiss={vi.fn()}
        onAutoPlayChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('开始讲解'));
    expect(onPlay).toHaveBeenCalledWith(mockAttraction);
  });

  it('calls onDismiss when close button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <ProximityAlert
        attraction={mockAttraction}
        distance={50}
        autoPlay={false}
        onPlay={vi.fn()}
        onDismiss={onDismiss}
        onAutoPlayChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('关闭'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
