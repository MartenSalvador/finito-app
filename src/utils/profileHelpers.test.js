import { describe, expect, it } from 'vitest';
import { toPublicProfile } from './profileHelpers';

describe('public profile projection', () => {
  it('excludes private account and moderation fields', () => {
    expect(
      toPublicProfile({
        name: 'Ana',
        email: 'ana@example.com',
        birthDate: '1990-01-01',
        blockedUserIds: ['user-b'],
        favorites: ['puzzle-1'],
        city: 'Delmenhorst',
      })
    ).toEqual({ name: 'Ana', city: 'Delmenhorst' });
  });
});
