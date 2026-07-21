# Vérifier un badge AIDD sans nous faire confiance

Un badge AIDD est un **Open Badges 3.0 VC-JWT signé RS256**. Son authenticité ne
repose pas sur notre serveur : n'importe qui peut la vérifier avec des outils tiers.

## En un clic (page de vérification)

Ouvrez `https://verify.ai-driven-dev.fr/u/<handle>`. La signature est vérifiée
**dans votre navigateur** (Web Crypto), contre la clé publique d'AIDD. Notre serveur
ne fait que servir des fichiers statiques ; il ne « valide » rien.

## Avec un outil que vous choisissez (#32)

1. Téléchargez la preuve : `https://verify.ai-driven-dev.fr/u/<handle>/credential.jwt`.
2. Soumettez-la au **validateur public 1EdTech** : <https://vc.1ed.tech> (verifier « Open Badges 3.0 »).
3. Il récupère la clé publique via le `kid` du JWT (`https://verify.ai-driven-dev.fr/keys/<kid>.json`,
   un JWK nu) et confirme la signature — **sans passer par notre page**.

La conformité au format est prouvée : voir `docs/spikes/sp4-conformance/`.

## Hors ligne / à la main

Le JWT est autoportant. Avec la clé publique correspondant à son `kid`, toute
bibliothèque JOSE vérifie la signature RS256 sans réseau. Les clés publiques
passées restent publiées indéfiniment (CT-7), donc un ancien badge reste
vérifiable même après rotation.

## Ce que la vérification établit

- **Signature** : le badge a été émis par la clé privée d'AIDD, non forgé ni altéré.
- **Titulaire** : le sujet est un compte GitHub (`https://github.com/<handle>`) — le
  contrôle du compte a été prouvé à l'émission (CT-3).
- **Validité** : dates d'émission et d'expiration (1 an), et statut de révocation
  (Bitstring Status List, à venir #25).
