const PUBLIC_PROFILE_FIELDS = [
  'name',
  'bio',
  'city',
  'cp',
  'lat',
  'lon',
  'rating',
  'tradesCount',
  'avatar',
  'badges',
];

export function toPublicProfile(user = {}) {
  return Object.fromEntries(
    PUBLIC_PROFILE_FIELDS
      .filter((field) => user[field] !== undefined)
      .map((field) => [field, user[field]])
  );
}
