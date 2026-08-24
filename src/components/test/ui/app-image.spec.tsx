import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppImage } from '@/components/ui/app-image';

describe('AppImage Component (Next.js Image Wrapper)', () => {
  it('renders image properly when valid src is provided', () => {
    render(
      <AppImage
        src="/banners/banner-coffee.jpg"
        alt="Kopi Spesial"
        width={300}
        height={200}
      />
    );

    const img = screen.getByRole('img', { name: /Kopi Spesial/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Kopi Spesial');
  });

  it('renders fallback placeholder when src is empty or null', () => {
    render(<AppImage src={null} alt="No Image" fallbackText="Belum Ada Foto" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Belum Ada Foto')).toBeInTheDocument();
  });

  it('switches to fallback placeholder when image triggers onError', () => {
    render(
      <AppImage
        src="/uploads/menus/broken-file.jpg"
        alt="Broken Image"
        width={300}
        height={200}
        fallbackText="Foto Tidak Tersedia"
      />
    );

    const img = screen.getByRole('img', { name: /Broken Image/i });
    fireEvent.error(img);

    expect(screen.getByText('Foto Tidak Tersedia')).toBeInTheDocument();
  });

  it('renders with fill layout without dimension errors', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <AppImage src="/banners/banner-qris.jpg" alt="QRIS Banner" fill />
      </div>
    );

    const img = screen.getByRole('img', { name: /QRIS Banner/i });
    expect(img).toBeInTheDocument();
  });
});
