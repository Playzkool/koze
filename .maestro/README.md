# Tests end-to-end (Maestro)

Ces scénarios pilotent Kozé dans **Expo Go** sur un simulateur iOS (ou un émulateur
Android), pour détecter les régressions, en particulier après une mise à jour de
paquets ou du SDK Expo.

## Prérequis

- [Maestro](https://maestro.dev) installé (`maestro --version`)
- un simulateur démarré, avec Expo Go installé (`npx expo start --ios` l'installe)
- Metro lancé : `npx expo start`

## Lancer

```bash
npm run test:e2e                              # tous les scénarios
npm run test:e2e -- --exclude-tags network    # sans accès internet (ARASAAC)
npm run test:e2e -- .maestro/category.yaml    # un seul scénario
METRO_PORT=8082 npm run test:e2e              # Metro sur un autre port
```

Chaque scénario repart d'un Expo Go vidé (`clearState`) : les tableaux de départ,
sans données du scénario précédent.

## Scénarios

| Fichier | Ce qui est vérifié | Réseau |
| --- | --- | --- |
| `communication.yaml` | Construire une phrase, effacer, ouvrir une catégorie, mode aidant protégé | non |
| `custom-tile.yaml` | Créer un picto « texte seul » avec phrase prononcée, persistance après redémarrage | non |
| `category.yaml` | Créer une catégorie, y ajouter un picto, le déplacer, supprimer la catégorie | non |
| `reset.yaml` | « Réinitialiser les tableaux » supprime les pictos ajoutés | non |
| `arasaac-search.yaml` | Ajouter un picto via la recherche ARASAAC | oui |

Sous-flows réutilisables (ne se lancent pas seuls) : `launch-clean.yaml`,
`enter-caregiver.yaml`, `create-text-tile.yaml`.

## Non couvert

- **Glisser-déposer** des tuiles : Maestro ne sait pas faire un appui long suivi d'un
  déplacement.
- **Photos, export et import** : ils passent par des écrans du système (galerie,
  feuille de partage, sélecteur de fichiers). La validation des sauvegardes est
  couverte par les tests unitaires : `npm run test:unit`.

## Pièges connus

- Les éléments sont ciblés par `testID` : ne pas les renommer sans mettre à jour
  les scénarios.
- Le menu développeur d'Expo Go s'ouvre au premier lancement, et son bouton
  flottant « Tools button » se place sur le bouton d'effacement de la phrase :
  `launch-clean.yaml` le ferme et désactive ce bouton.
- Un bloc `env:` dans un flow écrase les valeurs passées par `-e` : les valeurs
  par défaut sont donc écrites en JavaScript (`${typeof X !== 'undefined' ? X : ...}`).
- Garder des textes ASCII dans `inputText` (les accents sont peu fiables).
