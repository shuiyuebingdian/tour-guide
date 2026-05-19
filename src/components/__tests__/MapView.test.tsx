import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapView from '../MapView';

vi.mock('@amap/amap-jsapi-loader', () => ({
  default: {
    load: () =>
      Promise.resolve({
        Map: vi.fn().mockImplementation(() => ({})),
        Geolocation: vi.fn().mockImplementation(() => ({
          getCurrentPosition: vi.fn(),
        })),
        Marker: vi.fn().mockImplementation(() => ({})),
      }),
  },
}));

describe('MapView', () => {
  it('renders the map container', () => {
    const { container } = render(
      <MapView
        userLocation={null}
        attractions={[]}
        onAttractionClick={vi.fn()}
      />,
    );
    expect(container.querySelector('#map-container')).toBeTruthy();
  });

  it('shows loading state', () => {
    render(
      <MapView
        userLocation={null}
        attractions={[]}
        onAttractionClick={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/地图加载中/).length).toBeGreaterThan(0);
  });
});
