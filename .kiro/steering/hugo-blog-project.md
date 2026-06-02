---
inclusion: auto
description: Conventions, structure et stack technique du blog Hugo stormacq.com
---

# Blog Hugo — stormacq.com

Ce projet est un blog personnel propulsé par Hugo avec le thème PaperMod. Il est déployé via AWS CodeBuild (`buildspec.yaml`) et hébergé sur `https://stormacq.com`.

## Stack technique

- Hugo (thème PaperMod) — build avec `hugo --minify`
- SCSS custom dans `assets/scss/` + CSS étendu dans `assets/css/extended/custom.css`
- Mermaid (chargé via CDN dans `extend_footer.html`)
- Conversion automatique d'URLs YouTube en iframes (script dans `extend_footer.html`)
- Feed Bluesky embarqué sur la homepage via `bsky-embed`
- Tests Vitest (migration Jekyll → Hugo) dans `package.json`

## Structure des articles

Les articles sont dans `content/posts/` avec le nommage `YYYY-MM-DD-slug.md`.

Front matter YAML obligatoire :

```yaml
---
title: "Titre de l'article"
subtitle: "Sous-titre optionnel"
date: YYYY-MM-DD 00:00:00 +0100
tags: [tag1, tag2]
author: Seb
background: '/img/posts/YYYYMMDD/image.png'
images: ['/img/posts/YYYYMMDD/image.png']
---
```

Points importants :
- `background` est utilisé comme image de couverture (le partial `cover.html` fait un fallback de `cover.image` vers `background`)
- `images` est utilisé pour l'Open Graph / partage social
- `author` est toujours `Seb`
- Les dates utilisent le fuseau `+0100`
- Les images des articles vont dans `static/img/posts/YYYYMMDD/`
- Certains anciens articles ont aussi `description` en plus de `subtitle`

## Permaliens

Les URLs suivent le format `/:year/:month/:day/:slug/` (configuré dans `hugo.toml`).

## Layouts personnalisés

- `layouts/index.html` — Homepage avec deux colonnes (posts + sidebar Bluesky)
- `layouts/partials/cover.html` — Gestion des images de couverture avec fallback `background` → `cover.image`, images responsives
- `layouts/partials/extend_footer.html` — YouTube embed auto + Mermaid
- `layouts/404.html` — Page 404 custom avec image de chaton

## CSS custom

- `assets/css/extended/custom.css` — Layout deux colonnes homepage (`.home-columns`, `.home-posts`, `.home-sidebar`), responsive à 768px

## Conventions de contenu

- Le contenu est rédigé en anglais ou en français selon le sujet
- Le HTML inline est autorisé dans le Markdown (`markup.goldmark.renderer.unsafe = true`)
- Les blocs de code Mermaid sont rendus automatiquement côté client
- Les URLs YouTube brutes dans un `<p>` sont converties en embed automatiquement
- Le blog utilise la coloration syntaxique Monokai

## Build & déploiement

- Hugo n'est PAS installé localement — toujours utiliser un conteneur via Finch
- Build : `finch run --rm -v $(pwd):/project ghcr.io/gohugoio/hugo:v0.157.0 --minify`
- Serveur local : `./docker/run-finch.sh` (monte le répertoire courant, port 1313)
- Les scripts conteneur sont dans `docker/` (`run-finch.sh` pour Finch, `run-container.sh` pour Apple Container)
- Output dans `public/`
- Déployé via AWS CodeBuild (`buildspec.yaml`)
- Le cache Hugo est dans `resources/`

## Style d'écriture

Le blog a un style personnel et conversationnel. Voici les règles à suivre pour rester cohérent avec le ton de Seb :

### Ton général

- Première personne, narratif — on raconte une histoire, pas un rapport technique
- Conversationnel et chaleureux, comme si on expliquait à un collègue développeur autour d'un café
- Mélanger phrases courtes et punchy avec des explications plus longues — ne pas être uniformément dense
- Humour léger et sous-entendu — pas de blagues forcées, juste des apartés détendus ("I couldn't resist.", "the best part was…", smileys occasionnels)
- Pas de ton académique ou corporate — éviter les formulations passives et impersonnelles

### Structure narrative

- Commencer par le contexte personnel et la motivation ("Here is why.", "A few weeks ago…", "I wanted to…")
- Arc narratif : setup (contexte/problème) → parcours (ce qu'on a fait, les choix) → conclusion (ce qu'on a appris)
- Transitions conversationnelles entre sections ("So, how did it go?", "Let me walk you through…", "Getting there wasn't linear.")
- Éviter les gros blocs type rapport — préférer un flux qui se lit comme un récit

### Détails pratiques

- Ancrer les choses dans le réel : coûts, impact concret, expérience vécue (ex: "less than a cup of coffee per month")
- Partager les galères et les faux-pas, pas juste le résultat final ("42 commits tell the real story", "I OOM'd", "I switched SDKs halfway through")
- Montrer qu'on a mesuré et expérimenté — ne pas juste affirmer, donner les chiffres qui soutiennent les décisions

### Forme

- Liens intégrés naturellement dans les phrases, pas des dumps de références en fin de paragraphe
- Markdown headings avec `###` pour les sous-sections, pas de bold isolé comme titre de paragraphe
- Tableaux et listes utilisés avec parcimonie, quand ils apportent vraiment de la clarté
- Les blocs de code sont courts et ciblés — montrer le minimum nécessaire
- S'adresser au lecteur directement : "Give it a try", "Let me know your feedback"
- Signature de fin : "Happy coding.", "Happy hacking.", ou un appel à l'action léger

### Ce qu'il ne faut PAS faire en écriture

- Ne pas écrire comme un benchmark report — éviter le style "Results / Methodology / Conclusion"
- Ne pas abuser des bold pour structurer le texte à la place des headings
- Ne pas oublier le "pourquoi ça m'intéresse personnellement" au début
- Ne pas être impersonnel — c'est un blog perso, pas de la doc officielle
- Ne pas utiliser d'emoji (sauf smiley textuel occasionnel comme `:-)`), pas de `™️` ou dérivés

## Ce qu'il ne faut PAS faire

- Ne pas toucher au thème PaperMod directement (il est dans `themes/`, géré comme dépendance)
- Ne pas supprimer `unsafe = true` dans la config Goldmark — ça casserait le rendu HTML inline des anciens articles
- Ne pas changer le format des permaliens — ça casserait les URLs existantes et le SEO
