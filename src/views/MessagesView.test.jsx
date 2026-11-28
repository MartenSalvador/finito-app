import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const docMock = vi.hoisted(() => vi.fn());
const updateDocMock = vi.hoisted(() => vi.fn());

vi.mock('firebase/firestore', () => ({
  doc: docMock,
  updateDoc: updateDocMock,
}));

vi.mock('../firebase/config', () => ({ db: {} }));

import MessagesView from './MessagesView';

const originalScrollIntoView = Element.prototype.scrollIntoView;

function renderChat(proposalId) {
  const proposal = {
    id: proposalId,
    senderId: 'user-a',
    senderName: 'Ana',
    receiverId: 'user-b',
    receiverName: 'Beto',
    status: 'accepted',
    readBy: { 'user-a': true, 'user-b': false },
    messages: [],
    confirmations: { 'user-a': false, 'user-b': false },
  };

  return render(
    <MessagesView
      proposals={[proposal]}
      setProposals={vi.fn()}
      currentUser={{ id: 'user-a', name: 'Ana' }}
      users={[{ id: 'user-b', name: 'Beto' }]}
      selectedProposalId={proposalId}
    />
  );
}

describe('MessagesView chat persistence', () => {
  beforeEach(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    docMock.mockReset();
    docMock.mockImplementation((_, collection, id) => ({ collection, id }));
    updateDocMock.mockReset();
    updateDocMock.mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalScrollIntoView) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        value: originalScrollIntoView,
      });
    } else {
      delete Element.prototype.scrollIntoView;
    }
  });

  it('prevents sending until the temporary chat has a Firestore ID', () => {
    renderChat('prop-temporary');

    expect(screen.getByPlaceholderText('Conectando el chat...').disabled).toBe(true);
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('focuses the message field when opening a persisted chat', () => {
    renderChat('tAbCdEfGhIjKlMnOpQrS');

    expect(document.activeElement).toBe(
      screen.getByPlaceholderText('Escribí un mensaje...')
    );
  });

  it('persists messages and restores input focus after sending', async () => {
    const sentAt = new Date('2026-11-28T16:40:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(sentAt);
    let finishUpdate;
    updateDocMock.mockImplementation((_, payload) =>
      payload.messages
        ? new Promise((resolve) => {
            finishUpdate = resolve;
          })
        : Promise.resolve()
    );
    renderChat('tAbCdEfGhIjKlMnOpQrS');

    const input = screen.getByPlaceholderText('Escribí un mensaje...');
    const focus = vi.spyOn(input, 'focus');
    fireEvent.change(input, {
      target: { value: 'Hola, coordinemos el intercambio.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(docMock).toHaveBeenCalledWith(
      {},
      'proposals',
      'tAbCdEfGhIjKlMnOpQrS'
    );
    expect(updateDocMock).toHaveBeenCalledWith(
      { collection: 'proposals', id: 'tAbCdEfGhIjKlMnOpQrS' },
      {
        messages: [
          {
            senderId: 'user-a',
            sender: 'Ana',
            text: 'Hola, coordinemos el intercambio.',
            time: 'Hace un momento',
            sentAt,
          },
        ],
        readBy: { 'user-a': true, 'user-b': false },
      }
    );
    expect(focus).toHaveBeenCalled();
    expect(input.disabled).toBe(false);
    await act(async () => {
      finishUpdate();
    });
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('stores the current user as the author of their confirmation', async () => {
    const onConfirmTrade = vi.fn();
    render(
      <MessagesView
        proposals={[
          {
            id: 'tAbCdEfGhIjKlMnOpQrS',
            senderId: 'user-a',
            senderName: 'Ana',
            receiverId: 'user-b',
            receiverName: 'Beto',
            status: 'accepted',
            readBy: { 'user-a': true, 'user-b': false },
            messages: [],
            confirmations: { 'user-a': false, 'user-b': false },
          },
        ]}
        setProposals={vi.fn()}
        currentUser={{ id: 'user-a', name: 'Ana' }}
        users={[{ id: 'user-b', name: 'Beto' }]}
        selectedProposalId="tAbCdEfGhIjKlMnOpQrS"
        onConfirmTrade={onConfirmTrade}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar intercambio' })
    );

    await waitFor(() =>
      expect(
        updateDocMock.mock.calls.some(([, fields]) => fields.confirmations)
      ).toBe(true)
    );
    const [, update] = updateDocMock.mock.calls.find(
      ([, fields]) => fields.confirmations
    );
    const confirmationMessage = update.messages[0];

    expect(update.confirmations).toEqual({
      'user-a': true,
      'user-b': false,
    });
    expect(confirmationMessage).toMatchObject({
      senderId: 'user-a',
      sender: 'Ana',
    });
    expect(confirmationMessage.isSystem).toBeUndefined();
    expect(update.status).toBeUndefined();
    expect(onConfirmTrade).not.toHaveBeenCalled();
  });

  it('completes the trade only when the other participant already confirmed', async () => {
    const onConfirmTrade = vi.fn();
    render(
      <MessagesView
        proposals={[
          {
            id: 'tAbCdEfGhIjKlMnOpQrS',
            senderId: 'user-a',
            senderName: 'Ana',
            receiverId: 'user-b',
            receiverName: 'Beto',
            status: 'accepted',
            readBy: { 'user-a': true, 'user-b': false },
            messages: [],
            confirmations: { 'user-a': false, 'user-b': true },
          },
        ]}
        setProposals={vi.fn()}
        currentUser={{ id: 'user-a', name: 'Ana' }}
        users={[{ id: 'user-b', name: 'Beto' }]}
        selectedProposalId="tAbCdEfGhIjKlMnOpQrS"
        onConfirmTrade={onConfirmTrade}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar intercambio' })
    );

    await waitFor(() => expect(onConfirmTrade).toHaveBeenCalledOnce());
    const [, update] = updateDocMock.mock.calls.find(
      ([, fields]) => fields.confirmations
    );
    expect(update.confirmations).toEqual({
      'user-a': true,
      'user-b': true,
    });
    expect(update.status).toBe('completed');
    expect(update.completedAt).toEqual(expect.any(Number));
  });

  it('keeps the message and reports the error when Firestore rejects it', async () => {
    updateDocMock.mockRejectedValue(new Error('permission-denied'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderChat('tAbCdEfGhIjKlMnOpQrS');

    const input = screen.getByPlaceholderText('Escribí un mensaje...');
    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'No se pudo enviar el mensaje.'
    );
    expect(input.value).toBe('Hola');
  });

  it('labels conversations with unread messages in the inbox', () => {
    render(
      <MessagesView
        proposals={[
          {
            id: 'tAbCdEfGhIjKlMnOpQrS',
            senderId: 'user-b',
            senderName: 'Beto',
            receiverId: 'user-a',
            receiverName: 'Ana',
            status: 'accepted',
            read: true,
            readBy: { 'user-a': false, 'user-b': true },
            messages: [{ senderId: 'user-b', text: 'Hola' }],
          },
        ]}
        setProposals={vi.fn()}
        currentUser={{ id: 'user-a', name: 'Ana' }}
        users={[{ id: 'user-b', name: 'Beto' }]}
      />
    );

    expect(screen.getByText('Sin leer')).toBeTruthy();
  });

  it('renders persisted message timestamps as a local hour', () => {
    const sentAt = new Date('2026-11-28T16:40:00.000Z').getTime();
    const expectedTime = new Intl.DateTimeFormat('es', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(sentAt));

    render(
      <MessagesView
        proposals={[
          {
            id: 'tAbCdEfGhIjKlMnOpQrS',
            senderId: 'user-b',
            senderName: 'Beto',
            receiverId: 'user-a',
            receiverName: 'Ana',
            status: 'accepted',
            messages: [
              {
                senderId: 'user-b',
                text: 'Hola',
                time: 'Hace un momento',
                sentAt,
              },
            ],
          },
        ]}
        setProposals={vi.fn()}
        currentUser={{ id: 'user-a', name: 'Ana' }}
        users={[{ id: 'user-b', name: 'Beto' }]}
        selectedProposalId="tAbCdEfGhIjKlMnOpQrS"
        lang="es"
      />
    );

    expect(screen.getByText(expectedTime)).toBeTruthy();
    expect(screen.queryByText('Hace un momento')).toBeNull();
  });

  it('asks before hiding a chat from only the current user inbox', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const setProposals = vi.fn();
    render(
      <MessagesView
        proposals={[
          {
            id: 'tAbCdEfGhIjKlMnOpQrS',
            senderId: 'user-a',
            senderName: 'Ana',
            receiverId: 'user-b',
            receiverName: 'Beto',
            status: 'accepted',
            messages: [],
          },
        ]}
        setProposals={setProposals}
        currentUser={{ id: 'user-a', name: 'Ana' }}
        users={[{ id: 'user-b', name: 'Beto' }]}
        selectedProposalId="tAbCdEfGhIjKlMnOpQrS"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar chat' }));

    expect(confirm).toHaveBeenCalledWith(
      '¿Eliminar este chat de tu buzón? La otra persona conservará la conversación.'
    );
    await waitFor(() =>
      expect(updateDocMock).toHaveBeenCalledWith(
        { collection: 'proposals', id: 'tAbCdEfGhIjKlMnOpQrS' },
        { 'hiddenBy.user-a': true }
      )
    );
    expect(screen.queryByPlaceholderText('Escribí un mensaje...')).toBeNull();
  });

  it('keeps the chat open if deletion is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderChat('tAbCdEfGhIjKlMnOpQrS');

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar chat' }));

    expect(screen.getByPlaceholderText('Escribí un mensaje...')).toBeTruthy();
    expect(
      updateDocMock.mock.calls.some(([, fields]) =>
        Object.keys(fields).some((field) => field.startsWith('hiddenBy.'))
      )
    ).toBe(false);
  });
});
