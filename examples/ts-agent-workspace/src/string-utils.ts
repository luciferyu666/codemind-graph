export function normalizeLabel(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function toSlug(value: string): string {
  return normalizeLabel(value).replaceAll(" ", "-");
}
