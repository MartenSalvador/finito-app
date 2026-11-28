import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NavbarInferior from './NavbarInferior';

describe('NavbarInferior message notifications', () => {
  it('counts conversations unread by the signed-in user', () => {
    render(
      <NavbarInferior
        activeTab="explore"
        setActiveTab={vi.fn()}
        isLoggedIn
        currentUserId="user-a"
        proposals={[
          { id: 'one', readBy: { 'user-a': true, 'user-b': false }, read: true },
          { id: 'two', readBy: { 'user-a': false }, read: true },
          { id: 'three', readBy: { 'user-a': true }, read: false },
          {
            id: 'hidden',
            readBy: { 'user-a': false },
            hiddenBy: { 'user-a': true },
          },
        ]}
      />
    );

    expect(screen.getByText('1')).toBeTruthy();
  });

  it('navigates to messages when the messages button is pressed', () => {
    const setActiveTab = vi.fn();
    render(
      <NavbarInferior
        activeTab="messages"
        setActiveTab={setActiveTab}
        isLoggedIn
        currentUserId="user-a"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mensajes' }));

    expect(setActiveTab).toHaveBeenCalledWith('messages');
  });
});
