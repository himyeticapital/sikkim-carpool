// Cycles through the brand's accent colors so driver avatars read as
// distinct at a glance without needing a photo.
const AVATAR_COLORS = ['#3C8F86', '#E8935A', '#3E7CB1', '#D1483E', '#5B8C5A'];

export function avatarColorFor(name: string): string {
  const hash = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
