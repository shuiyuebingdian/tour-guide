import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AttractionCard from '../AttractionCard';
import type { Attraction } from '../../types';

const mockAttraction: Attraction = {
  id: 'test-1',
  name: '太和殿',
  areaId: 'gugong',
  location: [116.397, 39.916],
  radius: 30,
  image: '',
  segments: [{ text: '这是太和殿' }],
};

describe('AttractionCard', () => {
  it('renders attraction name and distance', () => {
    render(
      <AttractionCard
        attraction={mockAttraction}
        distance={200}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText('太和殿')).toBeTruthy();
    expect(screen.getByText(/200m/)).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <AttractionCard
        attraction={mockAttraction}
        distance={50}
        isActive={false}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByText('太和殿').closest('.attraction-card')!);
    expect(onClick).toHaveBeenCalledWith(mockAttraction);
  });

  it('shows active state styling', () => {
    const { container } = render(
      <AttractionCard
        attraction={mockAttraction}
        distance={50}
        isActive={true}
        onClick={vi.fn()}
      />,
    );
    expect(container.querySelector('.card-active')).toBeTruthy();
  });
});
