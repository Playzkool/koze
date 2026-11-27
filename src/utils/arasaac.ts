/**
 * ARASAAC public API — https://arasaac.org
 * Pictograms by Sergio Palao, property of the Government of Aragón (Spain),
 * licensed CC BY-NC-SA 4.0. Attribution is shown in the About screen.
 */

const API = 'https://api.arasaac.org/v1';
const STATIC = 'https://static.arasaac.org/pictograms';

export type PictoResult = {
  id: number;
  label: string;
};

type ApiPictogram = {
  _id: number;
  keywords: { keyword: string }[];
};

export function pictoUrl(id: number, size: 300 | 500 = 300) {
  return `${STATIC}/${id}/${id}_${size}.png`;
}

export async function searchPictos(
  query: string,
  { lang = 'fr', signal }: { lang?: string; signal?: AbortSignal } = {},
): Promise<PictoResult[]> {
  const term = query.trim();
  if (!term) return [];

  const res = await fetch(`${API}/pictograms/${lang}/search/${encodeURIComponent(term)}`, { signal });
  // ARASAAC answers 404 when nothing matches.
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`ARASAAC ${res.status}`);

  const data: ApiPictogram[] = await res.json();
  return data.slice(0, 40).map((p) => ({
    id: p._id,
    label: p.keywords[0]?.keyword ?? term,
  }));
}
