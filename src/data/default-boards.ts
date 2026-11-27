import type { Board, Tile } from '@/store/boards';

/**
 * Starter vocabulary. Picto ids come from ARASAAC (fr search, exact keyword match).
 * Kept deliberately small and adult-friendly; caregivers extend it in "mode aidant".
 */
const word = (id: string, label: string, pictoId: number): Tile => ({
  id,
  label,
  image: { kind: 'arasaac', id: pictoId },
});
const folder = (id: string, label: string, pictoId: number, target: string): Tile => ({
  ...word(id, label, pictoId),
  boardId: target,
});

export const ROOT_BOARD_ID = 'home';

export const DEFAULT_BOARDS: Record<string, Board> = {
  home: {
    id: 'home',
    title: 'Accueil',
    tiles: [
      word('je', 'je', 6632),
      word('veux', 'je veux', 5441),
      word('oui', 'oui', 5584),
      word('non', 'non', 5526),
      word('aider', 'aide-moi', 32648),
      word('stop', 'arrête', 7196),
      word('encore', 'encore', 37163),
      word('fini', "c'est fini", 5358),
      word('aime', "j'aime", 37826),
      word('aime-pas', "je n'aime pas", 37825),
      word('svp', "s'il te plaît", 8195),
      word('merci', 'merci', 8129),
      folder('f-besoins', 'Besoins', 6061, 'besoins'),
      folder('f-emotions', 'Émotions', 12359, 'emotions'),
      folder('f-personnes', 'Personnes', 7116, 'personnes'),
    ],
  },
  besoins: {
    id: 'besoins',
    parentId: 'home',
    title: 'Besoins',
    tiles: [
      word('manger', 'manger', 6456),
      word('boire', 'boire', 6061),
      word('toilettes', 'toilettes', 5921),
      word('dormir', 'dormir', 6479),
      word('douleur', "j'ai mal", 2367),
      word('malade', 'malade', 3308),
      word('froid', "j'ai froid", 4652),
      word('chaud', "j'ai chaud", 2300),
      word('medicament', 'médicament', 8359),
    ],
  },
  emotions: {
    id: 'emotions',
    parentId: 'home',
    title: 'Émotions',
    tiles: [
      word('content', 'content', 35547),
      word('triste', 'triste', 35545),
      word('colere', 'en colère', 35539),
      word('fatigue', 'fatigué', 35537),
      word('peur', "j'ai peur", 10261),
    ],
  },
  personnes: {
    id: 'personnes',
    parentId: 'home',
    title: 'Personnes',
    tiles: [
      word('bonjour', 'bonjour', 6944),
      word('tu', 'toi', 6625),
      word('famille', 'famille', 38351),
      word('ami', 'ami', 25790),
      word('medecin', 'médecin', 6561),
      word('infirmier', 'infirmier', 6050),
    ],
  },
};
