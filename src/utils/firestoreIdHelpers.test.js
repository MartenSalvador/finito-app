import { describe, expect, it } from 'vitest';
import { isFirestoreDocId, mapFirestoreDocument } from './firestoreIdHelpers';

describe('isFirestoreDocId', () => {
  it.each(['tr_12345', 'chat_trade_12345', 'prop-12345'])(
    'rejects temporary IDs: %s',
    (id) => {
      expect(isFirestoreDocId(id)).toBe(false);
    }
  );

  it('accepts Firestore IDs that begin with t', () => {
    expect(isFirestoreDocId('tAbCdEfGhIjKlMnOpQrS')).toBe(true);
  });

  it('uses the real document ID instead of an ID field stored in the document', () => {
    const mapped = mapFirestoreDocument({
      id: 'real-firestore-id',
      data: () => ({ id: 'prop-temporary', messages: [] }),
    });

    expect(mapped.id).toBe('real-firestore-id');
  });
});
