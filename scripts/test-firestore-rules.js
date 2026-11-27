import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

const projectId = 'demo-finito';
const documentsUrl = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

function authToken(uid) {
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    iss: `https://securetoken.google.com/${projectId}`,
    aud: projectId,
    auth_time: now,
    user_id: uid,
    sub: uid,
    iat: now,
    exp: now + 3600,
    firebase: { sign_in_provider: 'password' },
  })}.`;
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(firestoreValue) } };
  }
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, firestoreValue(item)])
      ),
    },
  };
}

async function request(path, { uid, token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (uid) headers.Authorization = `Bearer ${authToken(uid)}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${documentsUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}

async function write(path, data, { uid, token = 'owner', updateMask } = {}) {
  const update = {
    name: `projects/${projectId}/databases/(default)/documents/${path}`,
    fields: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, firestoreValue(value)])
    ),
  };
  const writeOperation = { update };
  if (updateMask) writeOperation.updateMask = { fieldPaths: updateMask };

  return request(':commit', {
    method: 'POST',
    uid,
    token,
    body: { writes: [writeOperation] },
  });
}

async function expectStatus(response, expected, description) {
  assert.equal(
    response.status,
    expected,
    `${description}: expected HTTP ${expected}, got ${response.status}: ${JSON.stringify(response.body)}`
  );
}

async function seed(path, data) {
  await expectStatus(await write(path, data), 200, `seed ${path}`);
}

await seed('publicProfiles/alice', { name: 'Alice', city: 'Test city' });
await seed('publicProfiles/bob', { name: 'Bob', city: 'Test city' });
await seed('puzzles/puzzle-alice', { userId: 'alice', title: 'Puzzle A' });
await seed('puzzles/puzzle-bob', { userId: 'bob', title: 'Puzzle B' });

await expectStatus(
  await write('users/alice', { email: 'alice@example.com' }, { uid: 'alice' }),
  200,
  'owner writes private profile'
);
await expectStatus(await request('/users/alice', { uid: 'alice' }), 200, 'owner reads private profile');
await expectStatus(await request('/users/alice', { uid: 'bob' }), 403, 'other user cannot read private profile');
await expectStatus(await request('/users/alice'), 403, 'anonymous cannot read private profile');
await expectStatus(
  await request(':runQuery', {
    method: 'POST',
    uid: 'alice',
    body: { structuredQuery: { from: [{ collectionId: 'users' }] } },
  }),
  403,
  'private user collection cannot be listed'
);
console.log('PASS private profile access');

await expectStatus(await request('/publicProfiles/bob'), 200, 'public profile is readable');
await expectStatus(
  await write(
    'publicProfiles/alice',
    { name: 'Alice', email: 'alice@example.com' },
    { uid: 'alice' }
  ),
  403,
  'public profile rejects private fields'
);
console.log('PASS public profile field allowlist');

const trade = {
  senderId: 'alice',
  senderName: 'Alice',
  senderAvatar: '',
  receiverId: 'bob',
  receiverName: 'Bob',
  requestedPuzzleId: 'puzzle-bob',
  requestedPuzzleTitle: 'Puzzle B',
  offeredPuzzleId: 'puzzle-alice',
  offeredPuzzleTitle: 'Puzzle A',
  message: '',
  status: 'pending',
  createdAt: Date.now(),
  expiresAt: Date.now() + 60_000,
  serverCreatedAt: { timestampValue: new Date().toISOString() },
};
await expectStatus(await write('trades/trade-ab', trade, { uid: 'alice' }), 200, 'sender creates valid trade');
await expectStatus(
  await write(
    'trades/trade-tampered',
    { ...trade, senderId: 'bob' },
    { uid: 'alice' }
  ),
  403,
  'sender cannot create a trade for another user'
);
const unfilteredTrades = await request(':runQuery', {
  method: 'POST',
  uid: 'alice',
  body: { structuredQuery: { from: [{ collectionId: 'trades' }] } },
});
await expectStatus(unfilteredTrades, 403, 'unfiltered trade query is denied');
const participantTrades = await request(':runQuery', {
  method: 'POST',
  uid: 'alice',
  body: {
    structuredQuery: {
      from: [{ collectionId: 'trades' }],
      where: {
        compositeFilter: {
          op: 'OR',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'senderId' },
                op: 'EQUAL',
                value: { stringValue: 'alice' },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: 'receiverId' },
                op: 'EQUAL',
                value: { stringValue: 'alice' },
              },
            },
          ],
        },
      },
    },
  },
});
await expectStatus(participantTrades, 200, 'participant trade query is allowed');
assert.equal(
  (Array.isArray(participantTrades.body) ? participantTrades.body : [])
    .filter((item) => item.document).length,
  1,
  `participant query returns one trade: ${JSON.stringify(participantTrades.body)}`
);
await expectStatus(
  await write('trades/trade-ab', { receiverId: 'charlie' }, { uid: 'bob', updateMask: ['receiverId'] }),
  403,
  'participant cannot change trade participants'
);
await expectStatus(
  await write('trades/trade-ab', { status: 'accepted' }, { uid: 'bob', updateMask: ['status'] }),
  200,
  'receiver can accept trade'
);
console.log('PASS participant-scoped trade access');

const proposal = {
  id: 'proposal-ab',
  tradeId: 'trade-ab',
  senderId: 'alice',
  senderName: 'Alice',
  senderAvatar: '',
  receiverId: 'bob',
  receiverName: 'Bob',
  receiverAvatar: '',
  targetOwnerId: 'bob',
  targetOwnerName: 'Bob',
  requestedPuzzleId: 'puzzle-bob',
  offeredPuzzleId: 'puzzle-alice',
  puzzleTargetTitle: 'Puzzle B',
  puzzleOfferedTitle: 'Puzzle A',
  status: 'accepted',
  read: true,
  createdAt: Date.now(),
  serverCreatedAt: { timestampValue: new Date().toISOString() },
  messages: [],
  confirmations: { alice: false, bob: false },
};
await expectStatus(
  await write('proposals/proposal-ab', proposal, { uid: 'bob' }),
  200,
  'trade participant creates linked proposal'
);
await expectStatus(
  await request('/proposals/proposal-ab', { uid: 'charlie' }),
  403,
  'non-participant cannot read proposal'
);
await expectStatus(
  await write(
    'proposals/proposal-forgery',
    { ...proposal, tradeId: 'missing-trade' },
    { uid: 'bob' }
  ),
  403,
  'proposal must link to a real participant trade'
);
await expectStatus(
  await request(':runQuery', {
    method: 'POST',
    uid: 'alice',
    body: { structuredQuery: { from: [{ collectionId: 'proposals' }] } },
  }),
  403,
  'unfiltered proposal query is denied'
);
const participantProposals = await request(':runQuery', {
  method: 'POST',
  uid: 'alice',
  body: {
    structuredQuery: {
      from: [{ collectionId: 'proposals' }],
      where: {
        compositeFilter: {
          op: 'OR',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'senderId' },
                op: 'EQUAL',
                value: { stringValue: 'alice' },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: 'receiverId' },
                op: 'EQUAL',
                value: { stringValue: 'alice' },
              },
            },
          ],
        },
      },
    },
  },
});
await expectStatus(participantProposals, 200, 'participant proposal query is allowed');
assert.equal(
  (Array.isArray(participantProposals.body) ? participantProposals.body : [])
    .filter((item) => item.document).length,
  1
);
await expectStatus(
  await write(
    'proposals/proposal-ab',
    { messages: [{ senderId: 'bob', text: 'Hello', time: 'now' }] },
    { uid: 'bob', updateMask: ['messages'] }
  ),
  200,
  'participant appends own chat message'
);
await expectStatus(
  await write(
    'proposals/proposal-ab',
    { messages: [{ senderId: 'alice', text: 'Forged', time: 'now' }] },
    { uid: 'bob', updateMask: ['messages'] }
  ),
  403,
  'participant cannot forge another sender'
);
await expectStatus(
  await write(
    'proposals/proposal-ab',
    { senderId: 'charlie' },
    { uid: 'bob', updateMask: ['senderId'] }
  ),
  403,
  'participant cannot change proposal participants'
);
console.log('PASS participant-scoped proposals and chat writes');

await expectStatus(
  await write(
    'reports/report-alice',
    { reporterId: 'alice', targetUserId: 'bob', status: 'submitted' },
    { uid: 'alice' }
  ),
  200,
  'user creates own report'
);
await expectStatus(
  await request('/reports/report-alice', { uid: 'bob' }),
  403,
  'other user cannot read report'
);
console.log('PASS report privacy');
