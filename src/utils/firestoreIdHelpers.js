const LOCAL_DOCUMENT_ID_PREFIXES = ['tr_', 'chat_', 'prop-'];

export function isFirestoreDocId(id) {
  if (typeof id !== 'string' || id.length === 0) return false;
  return !LOCAL_DOCUMENT_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}

export function mapFirestoreDocument(docSnap) {
  return { ...docSnap.data(), id: docSnap.id };
}
