import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  initializeAuth,
  inMemoryPersistence,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import {
  connectStorageEmulator,
  deleteObject,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

const app = initializeApp(
  {
    apiKey: 'demo-api-key',
    authDomain: 'demo-finito.firebaseapp.com',
    projectId: 'demo-finito',
    storageBucket: 'demo-finito.appspot.com',
    appId: 'demo-app-id',
  },
  'storage-rules-test'
);
const auth = initializeAuth(app, { persistence: inMemoryPersistence });
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const storage = getStorage(app);
connectStorageEmulator(storage, '127.0.0.1', 9199);

async function expectDenied(operation, description) {
  await assert.rejects(operation, (error) => {
    assert.equal(error.code, 'storage/unauthorized', description);
    return true;
  });
}

const firstUser = (await signInAnonymously(auth)).user;
const ownPath = `puzzles/${firstUser.uid}/owned.png`;
await uploadBytes(ref(storage, ownPath), Buffer.from('image'), {
  contentType: 'image/png',
});
const protectedPath = `puzzles/${firstUser.uid}/protected.png`;
await uploadBytes(ref(storage, protectedPath), Buffer.from('image'), {
  contentType: 'image/png',
});
await deleteObject(ref(storage, ownPath));
console.log('PASS owner-scoped image upload');

await expectDenied(
  () =>
    uploadBytes(
      ref(storage, `puzzles/${firstUser.uid}/not-image.bin`),
      Buffer.from('not image'),
      { contentType: 'application/octet-stream' }
    ),
  'non-image content type is rejected'
);
await expectDenied(
  () =>
    uploadBytes(
      ref(storage, `puzzles/${firstUser.uid}/too-large.png`),
      Buffer.alloc(5 * 1024 * 1024 + 1),
      { contentType: 'image/png' }
    ),
  'oversized upload is rejected'
);
console.log('PASS upload type and size checks');

await signOut(auth);
await expectDenied(
  () =>
    uploadBytes(
      ref(storage, `puzzles/${firstUser.uid}/anonymous.png`),
      Buffer.from('image'),
      { contentType: 'image/png' }
    ),
  'anonymous user cannot upload'
);

await signInAnonymously(auth);
await expectDenied(
  () => deleteObject(ref(storage, protectedPath)),
  'another user cannot delete owner image'
);
await signOut(auth);

await expectDenied(
  () => deleteObject(ref(storage, protectedPath)),
  'anonymous user cannot delete owner image'
);
await signOut(auth);
await deleteApp(app);
console.log('PASS authentication and owner-scoped image deletion');
