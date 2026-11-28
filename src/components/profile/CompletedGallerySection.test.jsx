import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CompletedGallerySection from './CompletedGallerySection';

describe('CompletedGallerySection', () => {
  it('keeps entered data and shows an error when saving fails', async () => {
    const onAddCompletedPuzzle = vi
      .fn()
      .mockRejectedValue(new Error('La imagen supera el límite de 5 MB.'));

    render(
      <CompletedGallerySection
        userId="user-a"
        onAddCompletedPuzzle={onAddCompletedPuzzle}
        defaultOpen
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Subir puzzle terminado' }));
    fireEvent.change(
      screen.getByPlaceholderText('Ej: Noche Estrellada 1000 piezas'),
      { target: { value: 'Noche Estrellada' } }
    );
    fireEvent.change(screen.getByPlaceholderText('URL de la foto https://...'), {
      target: { value: 'https://example.com/puzzle.jpg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar en mi galería' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'La imagen supera el límite de 5 MB.'
    );
    expect(
      screen.getByPlaceholderText('Ej: Noche Estrellada 1000 piezas').value
    ).toBe('Noche Estrellada');
    expect(screen.getByPlaceholderText('URL de la foto https://...').value).toBe(
      'https://example.com/puzzle.jpg'
    );
  });
});
