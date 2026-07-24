/** Game ids are `YYYY-MM-DD-type`; the play date is the first 10 chars. */
export function gameDate(id: string): string {
  return id.slice(0, 10);
}
