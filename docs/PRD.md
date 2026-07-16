# Certified Member AIDD

Un outil qui délivre aux membres certifiés d'AIDD une preuve vérifiable par un tiers, affichable sur LinkedIn, pour que le titre cesse d'être une simple auto-déclaration.

## Overview

AIDD décerne un titre — « Certified Member » — aux membres de sa core team qui réussissent une masterclass évaluée. Ce titre atteste qu'ils savent appliquer le flow AIDD et ses concepts.

Hors de la communauté, ce titre ne vaut rien. Un recruteur qui le lit sur un CV n'a aucun moyen de savoir s'il est réel. Le travail de certification que fait AIDD ne se transforme donc en aucune valeur pour ses membres sur le marché — et la certification, sans preuve, n'est qu'une décoration.

Ce projet donne à chaque certifié une preuve que **n'importe qui peut vérifier de façon indépendante**, sans avoir à croire AIDD sur parole. Petit périmètre : moins de 100 certifications par an, un seul badge, émission manuelle.

## Problem Statement

N'importe qui peut écrire « Certified Member AIDD » sur son profil LinkedIn. Rien ne distingue un vrai certifié d'un imposteur.

Aujourd'hui le coût se répartit ainsi :
- **Pour le membre certifié** : son titre n'a aucun poids face à un employeur. L'effort de la masterclass ne se convertit pas en signal reconnaissable.
- **Pour l'employeur** : il ne peut ni vérifier le titre, ni s'y fier. Il l'ignore donc.
- **Pour AIDD** : le titre décerné ne construit aucune valeur externe, et n'importe qui peut l'usurper sans risque.

Le besoin : qu'un tiers puisse **confirmer lui-même** qu'un badge est authentique, qu'il a bien été émis par AIDD, et qu'il appartient bien à la personne qui le présente.

## Goals

- Un membre certifié dispose d'une **preuve exportable** de sa certification, affichable sur LinkedIn.
- Un tiers peut **vérifier l'authenticité d'un badge avec un outil indépendant**, sans dépendre du verdict d'AIDD ni de la disponibilité de ses serveurs.
- Un tiers peut **confirmer que le badge appartient à la personne** qui le lui présente, et pas seulement qu'il a été émis à quelqu'un du même nom.
- Un badge falsifié, forgé ou altéré est **rejeté**, y compris par un vérificateur tiers.
- Le titre **conserve sa valeur dans le temps** : il expire, et ne prétend donc jamais attester une compétence périmée.
- AIDD reste **maître de l'outil** : auto-hébergé, standards ouverts, aucune dépendance à un fournisseur payant.

## Non-Goals

- **Révoquer un badge pour non-paiement.** Qui cesse de payer conserve son badge jusqu'à son échéance.
- **Détecter la triche** ou gérer une contestation de certification.
- **Archiver les notes ou rendus** de la masterclass — hors de ce système.
- **Un second badge « Habilité »** (niveau supérieur) — prévu ultérieurement, pas maintenant.
- **L'émission en self-service** par le membre. L'équipe AIDD reste la seule autorité qui émet.
- **Un portail public de recherche** des membres certifiés.
- **La création du visuel du badge** — produite à part, simplement intégrée ici.

## User Stories

- En tant qu'**équipe AIDD**, je veux émettre un badge à un membre après le verdict de certification, afin de matérialiser un titre qu'il pourra prouver.
- En tant qu'**équipe AIDD**, je veux être la seule autorité capable d'émettre, afin que personne ne puisse fabriquer un badge en notre nom.
- En tant que **membre certifié**, je veux recevoir mon badge et une preuve téléchargeable, afin de pouvoir la présenter à qui je veux.
- En tant que **membre certifié**, je veux ajouter mon badge à mon profil LinkedIn sans me tromper de champ, afin que les recruteurs qui me consultent puissent le vérifier.
- En tant que **membre de longue date**, je veux pouvoir repasser la certification librement, afin de renouveler mon badge quand il expire.
- En tant qu'**employeur**, je veux vérifier un badge en un clic, afin de savoir immédiatement s'il est valide.
- En tant qu'**employeur méfiant**, je veux vérifier un badge avec un outil que je choisis moi-même, afin de ne pas avoir à faire confiance à AIDD.
- En tant qu'**employeur**, je veux confirmer que le badge appartient bien au candidat en face de moi, afin qu'il ne puisse pas présenter celui d'un autre.
- En tant que **membre**, je veux pouvoir demander l'effacement de mes données, afin de ne pas rester exposé après mon départ.

## Acceptance Criteria

**Vérification**
- Ouvrir l'URL d'un badge réel affiche **« valide »**, avec le nom du titulaire, les dates et l'émetteur.
- Un badge **altéré d'un octet** est rejeté comme **invalide**.
- Un badge **forgé sans la clé privée d'AIDD** est rejeté comme **invalide**.
- Un badge **échu** affiche une page propre « expiré ».
- Un **identifiant inconnu ou deviné** affiche « invalide » — jamais une erreur technique ni un 404.
- La page de vérification **contrôle réellement la preuve cryptographique**. Une page qui afficherait « valide » sans le faire est un échec, pas une approximation.

**Vérification indépendante**
- Un tiers **télécharge la preuve brute**, récupère la clé publique d'AIDD, et obtient le même verdict **via un outil de vérification tiers reconnu**, sans utiliser la page d'AIDD.
- Un badge de production est **accepté par le validateur public 1EdTech** — c'est la preuve que le standard est réellement respecté.
- L'authenticité reste vérifiable **même si les serveurs d'AIDD sont injoignables**.

**Liaison d'identité**
- Un tiers peut confirmer que le badge **correspond à la personne** qui le présente, à partir d'une information que seule cette personne connaît.
- Le badge d'une autre personne **ne correspond pas**.

**Cycle de vie**
- Tout badge **expire au bout d'un an**.
- Après renouvellement, l'ancien badge **reste valide jusqu'à sa propre échéance** — il n'est jamais signalé comme révoqué.
- Un badge révoqué affiche son état **sans divulguer le nom** ni aucune donnée du titulaire.

**Émission**
- Une route d'émission **sans authentification est inaccessible**.
- Le membre reçoit par email son badge, sa preuve téléchargeable, et les valeurs à recopier dans LinkedIn.
- Le membre parvient à créer son entrée LinkedIn **avec l'URL de vérification correctement renseignée**.

## Dependencies

- **Conformité Open Badges 3.0**, mesurée par l'acceptation du badge par le validateur public 1EdTech. C'est la condition d'existence de la vérification indépendante — sans elle, aucun outil tiers ne saura lire nos badges.
- **LinkedIn ne pré-remplit plus les certifications.** Le membre saisit chaque champ à la main, y compris l'URL de vérification. Or cette URL porte toute la vérifiabilité : si le membre ne la colle pas, son badge devient invérifiable en pratique. Le produit doit compenser ce risque humain.
- **Une Page LinkedIn AIDD** (`linkedin.com/company/ai-driven-dev`) est requise pour le bouton d'ajout au profil.
- **Un sous-domaine dédié, engagé pour 5 ans minimum.** Il est inscrit dans l'identifiant de chaque badge émis : le changer casse tous les badges déjà délivrés. Ce n'est pas une décision technique, c'est un engagement opérationnel.
- **La clé de signature est l'ancre de confiance du système.** Sa perte empêche d'émettre ; sa fuite permet à un tiers de forger des badges AIDD indétectables. Sa garde est une dépendance organisationnelle, pas seulement technique.
- **Le visuel du badge**, produit séparément.
- **Les CGU d'AIDD** doivent décrire ce traitement de données. La base légale retenue est l'exécution du contrat : publier le nom sur un badge vérifiable *est* l'objet de la prestation achetée. Les CGU informent — elles ne recueillent pas de consentement, ce que le RGPD interdit dans des conditions générales.
- **Justification de non-réalisation d'une AIPD**, à écrire et archiver (obligation CNIL/CEPD, AIDD étant une structure commerciale).

## Open Questions

- **Les CGU décrivent-elles réellement ce traitement ?** Personne ne les a relues. Supposé, non vérifié.
- **Aucun juriste n'a validé le dispositif.** « Nécessaire à l'exécution du contrat » est une qualification juridique. Le risque est faible et documenté, mais il n'est pas levé.
- **La liaison d'identité expose un compromis de confidentialité** (voir annexe) : qui devine l'email d'un certifié peut confirmer son hypothèse. Inhérent au mécanisme choisi ; supprimable en v2 seulement.
- **Durée de conservation de l'email** : elle doit couvrir la fenêtre de renouvellement, sinon la re-certification devient impossible. Non chiffrée.
- **Stack et framework** : délibérément non tranchés, à choisir avec les contributeurs.
- **Badge « Habilité »** : critères et cycle de vie à définir le moment venu.

---

# Annexe — Spécification technique

*Cette annexe sort du périmètre « solution-agnostic » du PRD. Elle fixe les contraintes non négociables de l'implémentation. Le reste — framework, ORM, hébergement applicatif — demeure libre.*

**Conventions.** « DOIT », « NE DOIT PAS » et « PEUT » ont le sens défini par la RFC 2119. Chaque contrainte est normative ; sa justification et sa source sont fournies pour permettre de la contester sur pièces plutôt que par principe.

---

## CT-1 — Format de preuve : VC-JWT signé en RS256

**Exigence.** Les credentials DOIVENT être émis au format **VC-JWT**, signés avec l'algorithme **RS256**, les clés publiques étant publiées en **JSON Web Key**. La combinaison **JWT + EdDSA (Ed25519) NE DOIT PAS être utilisée.**

**Justification.** Le guide d'implémentation Open Badges 3.0 ne reconnaît que deux mécanismes de sécurisation pour la certification de conformité :

> « Linked Data Proofs using the Data Integrity **EdDSA** Cryptosuites v1.0. Issuers produce a DataIntegrityProof proof referencing a key URL of a public key expressed in eddsa-rdf-2022 format »
>
> « **JWTs with RSA256** algorithm, with key material published as JSON Web Key (JWK). »

Les deux chemins sont étanches : EdDSA est lié aux Linked Data Proofs, RS256 est lié aux JWT. Un JWT signé en EdDSA ne relève d'aucun des deux et se situe hors du domaine de conformité. Le guide précise, pour tout mécanisme sortant de ces options :

> « issuers should be aware that these may not be supported by all hosts, wallets and verifiers, and that **interoperability may be limited** »

**Mode de défaillance.** L'écart est silencieux. Un credential signé en JWT + EdDSA se vérifie sans erreur par l'implémentation qui l'a produit ; il est rejeté par les vérificateurs tiers conformes. La défaillance n'apparaît donc qu'au moment précis où la vérification indépendante — l'objectif central du produit — est exercée.

**Arbitrage.** Le chemin Linked Data Proofs impose la canonicalisation JSON-LD (URDNA2015) : le graphe RDF doit être normalisé avant signature, afin que deux sérialisations distinctes d'un même document produisent une signature identique. Cette étape concentre l'essentiel des défauts d'interopérabilité observés dans les implémentations non spécialisées. Le format JWT signe une séquence d'octets et ne présente pas cette classe de problème. **RS256 est le coût assumé de l'évitement de JSON-LD**, non un choix par défaut.

> [OB 3.0 Implementation Guide](https://www.imsglobal.org/spec/ob/v3p0/impl)

---

## CT-2 — La vérification cryptographique DOIT être effective

**Exigence.** La vérification DOIT résoudre la clé publique de l'émetteur et **contrôler la signature**. Un contrôle limité à la présence ou à la forme des champs de la preuve NE constitue PAS une vérification et NE DOIT PAS être présenté comme telle.

**Justification.** Une page de vérification produit une assertion de confiance. Si elle valide sans contrôler la signature, elle convertit une incertitude en affirmation d'authenticité — un résultat strictement pire que l'absence de vérification, puisqu'elle légitime les contrefaçons au lieu de les ignorer.

**Mode de défaillance, illustré.** Ce défaut est documenté dans un émetteur Open Badges 3.0 open source diffusé publiquement, [Certo](https://github.com/Schroedinger-Hat/certo) (`main`, commit `bd8a840`, 2026-01-28). L'émission y est cryptographiquement correcte (`src/api/credential/services/credential.ts`, l. 317-338 : import PKCS8, signature réelle via `jose`). La vérification, en revanche (`src/api/credential/services/verification.ts`, l. 165) :

```js
/**
 * Verify a credential's cryptographic proof
 * This is a placeholder for the actual cryptographic verification
 * In a production environment, this would use a library like jsonld-signatures
 */
async verifyProof(credential) {
  // contrôle : proof.type, proof.created, proof.verificationMethod, proof.proofPurpose existent
  // contrôle : proof.proofValue OU proof.jws est non vide
  // contrôle : la preuve a moins de 10 ans

  // For now, since we're not implementing actual cryptographic verification,
  // we'll accept any proof that passes the above checks
  return { valid: true };
}
```

La signature n'est jamais contrôlée — confirmé par l'absence de tout `jwtVerify`, `compactVerify`, `importSPKI` ou primitive équivalente dans le backend. Un document portant `proof.jws` de valeur arbitraire, les champs attendus et une date récente est validé.

Ce mode de défaillance est structurellement probable : la signature est la partie visible et testable ; la vérification échoue silencieusement lorsqu'elle est incomplète, sans faire échouer aucun test.

---

## CT-3 — Liaison d'identité par `identityHash` salé

**Exigence.** Chaque credential DOIT porter un identifiant de sujet. En l'absence de DID, il DOIT s'agir d'un `IdentityObject` contenant un `identityHash` de l'adresse email, **salé par un sel unique au credential et publié dans le credential**. Un hash **non salé** NE DOIT PAS être utilisé. Un credential portant le seul nom du titulaire NE DOIT PAS être émis.

**Justification.** La preuve est exportable par conception (CT-6). Un credential dont le sujet n'est identifié que par un nom constitue un **titre au porteur** : sa détention vaut revendication. Un homonyme, ou tout tiers ayant obtenu le fichier, peut le présenter comme sien. Le credential atteste alors qu'un titre a été délivré à *une personne portant ce nom*, non que le porteur est cette personne — ce qui annule l'objectif de non-auto-déclaration.

**Forme.** Le guide d'implémentation décrit l'option sans DID :

> « do not include a `credentialSubject.id` property, and instead include an `identifier` »

```json
"identityHash": "sha256$658625b25ab3d75d613ca97d9a5a77f70e2192feca5557f4ad09a4d4f121f5fc",
"identityType": "emailAddress",
"hashed": true,
"salt": "<sel unique au credential>"
```

Le hash porte sur `email + sel`. Le vérificateur obtient l'adresse email de la personne qui présente le credential, la hache avec le sel publié, et compare au `identityHash`.

**Le sel est public**, par nécessité : sans publication, aucun tiers ne peut recalculer le hash, et la liaison d'identité devient inopérante.

**Propriétés de sécurité, énoncées sans ambiguïté.** Le sel défait les tables précalculées et empêche la corrélation d'une même adresse entre deux credentials. Il **ne protège pas** contre une attaque ciblée : un tiers qui suppose l'adresse email d'un titulaire peut la hacher avec le sel publié et confirmer son hypothèse. Cette propriété est **inhérente au mécanisme** : la capacité de vérifier l'appartenance d'un credential implique la capacité de tester une hypothèse d'appartenance. Le compromis est assumé, documenté, et porté à la connaissance du titulaire. Seule l'adoption d'un `credentialSubject.id` de type DID le supprime ; elle relève d'une version ultérieure.

> [OB 3.0 Implementation Guide](https://www.imsglobal.org/spec/ob/v3p0/impl)

---

## CT-4 — Révocation par Bitstring Status List v1.0

**Exigence.** Le statut de révocation DOIT être publié via une **Bitstring Status List v1.0**, référencée depuis chaque credential. Un mécanisme de statut propriétaire (endpoint retournant un état ad hoc) NE DOIT PAS être utilisé.

**Justification.** Un format de statut non standard n'est lisible par aucun vérificateur conforme. La révocation ne serait alors interprétable que par l'émetteur lui-même : un credential révoqué continuerait d'apparaître valide dans tout l'écosystème. Le défaut est de même nature que celui décrit en CT-1 — conforme en apparence, inexploitable en pratique.

> « The **recommended option** for checking revocation is the **Bitstring Status List v1.0** specification, which was adopted as a standards-track specification by the VCWG on December 14th 2022. »

La spécification n'impose aucun mécanisme, mais exige que l'émetteur et le vérificateur en partagent un. Bitstring Status List est celui que l'écosystème implémente.

**Propriété annexe.** L'émetteur publie une liste de bits unique couvrant l'ensemble de ses credentials ; le vérificateur la récupère intégralement et lit l'index correspondant. Aucune requête par credential n'est émise : l'émetteur n'apprend donc pas quel credential est vérifié, ni par qui.

---

## CT-5 — Le canal de révocation est réservé à l'effacement

**Exigence.** Le `statusPurpose: revocation` NE DOIT être employé **que** pour honorer une demande d'effacement de données personnelles. Il NE DOIT PAS être employé pour signaler une supersession, un défaut de paiement, ni une suspicion de fraude.

**Justification — supersession.** Une Bitstring Status List ne définit pas d'état « remplacé ». Publier une supersession sur le canal `revocation` revient à déclarer révoqué — donc invalide — un credential authentique et non expiré. Le renouvellement invaliderait ainsi le credential précédent aux yeux de tout vérificateur conforme.

**Règle.** Un credential remplacé **reste valide jusqu'à son échéance propre**. La supersession est une information présentée sur la page du credential ; elle n'est pas publiée dans la liste de statuts.

**Justification — défaut de paiement.** Décision produit : le titulaire conserve son credential jusqu'à échéance. L'expiration annuelle (CT-8) assure seule la péremption.

---

## CT-6 — Exportabilité de la preuve

**Exigence.** La preuve brute (JWT signé) DOIT être téléchargeable depuis la page du credential. La procédure de vérification indépendante DOIT être documentée publiquement, en désignant au moins un outil de vérification tiers conforme.

**Justification.** La vérification n'est indépendante que si le vérificateur peut opérer hors de l'infrastructure de l'émetteur. Une page de vérification hébergée par l'émetteur, quelle que soit la rigueur de son contrôle, demande au vérificateur de faire confiance à l'émetteur. L'exportabilité de la preuve, combinée à la publication de la clé (CT-7), est la condition qui permet d'établir l'authenticité **sans cette confiance**, et de la préserver au-delà de la durée de vie du service.

---

## CT-7 — Gestion et rotation des clés

**Exigence.** Chaque JWT DOIT porter un identifiant de clé (`kid`) dans son en-tête. Les clés publiques DOIVENT être publiées dans un JWKS accessible sur le domaine de l'émetteur. Après rotation, **les clés publiques antérieures DOIVENT demeurer publiées indéfiniment**.

**Justification.** Le retrait d'une clé publique du JWKS rend définitivement invérifiables tous les credentials signés avec elle, sans procédure de rattrapage possible. Une clé publique n'étant pas un secret, sa conservation est sans coût de sécurité et sans coût matériel significatif ; son retrait détruit rétroactivement l'ensemble des credentials émis sous cette clé, y compris ceux déjà référencés par leurs titulaires.

**Corollaire.** La clé privée constitue l'ancre de confiance du dispositif. Sa perte interdit toute émission ultérieure ; sa compromission permet la production de credentials contrefaits indétectables. Sa conservation, sa sauvegarde et la restriction de son accès sont des exigences opérationnelles, non des recommandations.

---

## CT-8 — Cycle de vie

**Exigence.** Tout credential DOIT porter une date d'expiration fixée à **un an** après l'émission. Toute page de credential — valide, expiré, remplacé, révoqué, ou d'identifiant inconnu — DOIT retourner une page explicite ; un code d'erreur technique ou une page 404 NE DOIT PAS être retourné. La page d'un credential révoqué NE DOIT divulguer **aucune donnée personnelle** du titulaire.

**Justification — expiration.** La certification atteste une compétence à un instant donné, dans un domaine dont l'état de l'art évolue rapidement. Une attestation sans terme prétendrait garantir une compétence actuelle qu'elle n'a pas évaluée.

**Justification — anonymisation.** Une demande d'effacement impose de cesser de publier la donnée. Une page de révocation qui continuerait d'afficher le nom du titulaire maintiendrait cette publication. L'interdiction du 404 (lisibilité) et l'obligation d'effacement (conformité) se concilient par l'anonymisation de la page : l'état est affiché, les données du titulaire sont retirées.

---

## CT-9 — Primitives cryptographiques

**Exigence.** La signature et la vérification DOIVENT reposer sur une bibliothèque auditée couvrant RS256, JWKS et l'identifiant de clé. Aucune primitive cryptographique NE DOIT être réimplémentée.

**Référence.** En écosystème JavaScript, [`jose`](https://github.com/panva/jose) satisfait ces trois exigences (`SignJWT`, `jwtVerify`, `createRemoteJWKSet`) — vérifié. Toute bibliothèque équivalente dans un autre langage DOIT être vérifiée sur ces trois points avant adoption.

---

## CT-10 — Intégration LinkedIn

**Exigence.** La page du credential et le message de livraison DOIVENT présenter les valeurs à reporter dans LinkedIn sous forme d'un bloc dédié, champ par champ, incluant explicitement la **Credential URL**.

**Justification.** LinkedIn ne pré-remplit plus les entrées de certification. Le microsite `addtoprofile.linkedin.com` redirige (301) vers la documentation d'aide, laquelle établit :

> « Links will no longer be customized for a specific certificate or degree. […] **it will no longer autofill** and members must enter the relevant information directly. »

Le titulaire saisit donc manuellement chaque champ, dont la Credential URL. Or cette URL est l'unique lien entre le profil LinkedIn et la preuve : une entrée LinkedIn dépourvue de Credential URL est, pour un tiers, indiscernable d'une auto-déclaration — soit le problème même que le dispositif traite. Le bloc de valeurs constitue une mesure de mitigation d'un risque produit identifié, non un agrément d'interface.

**Prérequis.** Une Page LinkedIn (gratuite, sans procédure d'approbation).

> [LinkedIn Help — Add to Profile](https://www.linkedin.com/help/linkedin/answer/a528030)

---

## Validation de conformité

Le validateur public de 1EdTech, [`1EdTech/digital-credentials-public-validator`](https://github.com/1EdTech/digital-credentials-public-validator), fait référence. Un credential qu'il rejette n'est pas conforme, indépendamment du verdict rendu par la page de vérification de l'émetteur. Son emploi rend le critère d'acceptation « vérifiable par un tiers » exécutable.

## Solutions évaluées et écartées

| Solution | Motif |
|---|---|
| **Credly** | Tarification non publiée, sur devis. Ordre de grandeur rapporté par des utilisateurs : ~3 000 $/an pour 500 credentials — *estimation indirecte, non confirmée par l'éditeur*. Dépendance forte au fournisseur. |
| **Accredible** | Aucune offre gratuite pérenne : à partir de ~45 $/mois, engagement 12 mois. |
| **Badgr / Canvas Credentials** | Émission gratuite **arrêtée le 31 décembre 2025**. De nombreuses documentations tierces l'indiquent encore comme disponible. |
| **Certifier.io** | Offre gratuite réelle (250 credentials/an, sans carte bancaire). Écarté : solution SaaS, et **conformité effective à Open Badges 3.0 non confirmée**. Sans credentials signés vérifiables par un tiers, l'exigence centrale n'est pas satisfaite. |
| **Certo** | Vérification non implémentée (CT-2). La partie signature est saine et le projet est sous licence AGPL : la correction serait possible, mais ne présente pas d'avantage sur une implémentation neuve à ce périmètre. |
| **Linked Data Proofs / EdDSA** | Impose la canonicalisation JSON-LD (CT-1). |

---

# Annexe — Feuille de route de construction

*Séquence indicative de mise en œuvre. L'ordre suit les dépendances techniques : chaque phase produit un résultat vérifiable et débloque la suivante. La granularité de découpage en tâches et l'affectation relèvent de l'étape de planification.*

## Surface applicative

L'application est réduite. Elle expose quatre surfaces :

| Surface | Rôle | Accès |
|---|---|---|
| Interface d'émission | Saisie d'un titulaire, génération et signature d'un credential | **Authentifié** (CT-2 du produit : E0) |
| Page de vérification publique | Contrôle de la preuve, affichage de l'état | Public |
| Endpoint JWKS | Publication des clés publiques (`/.well-known/jwks.json`) | Public |
| Bitstring Status List | Publication des statuts de révocation | Public |

Le stockage est minimal : identifiant de credential, nom, email (privé, non publié), sel, date d'émission, date d'expiration, `kid`, index de statut.

## Phase 0 — Socle de confiance

*Prérequis de tout le reste. Aucune émission ne DOIT précéder cette phase.*

- Réserver le sous-domaine dédié et permanent, avec TLS (CT-7, dépendance « sous-domaine 5 ans »).
- Générer la paire de clés RSA. Sécuriser, sauvegarder et restreindre l'accès à la clé privée (CT-7, corollaire).
- Publier le JWKS avec `kid`, en prévoyant dès l'origine la conservation indéfinie des clés retirées (CT-7).
- Établir le schéma de stockage minimal, sel par credential compris.

**Vérifiable :** le JWKS est accessible publiquement et contient une clé référencée par un `kid`.

## Phase 1 — Émission

- Authentifier l'interface d'émission ; aucune route d'émission n'est joignable sans authentification (critère : *route d'émission sans authentification inaccessible*).
- Générer un credential Open Badges 3.0 conforme : format VC-JWT / RS256 (CT-1), `kid` (CT-7), expiration à un an (CT-8), `credentialStatus` référençant la liste de statuts (CT-4), `identityHash` salé (CT-3), visuel.
- Générer un sel unique par credential et calculer l'`identityHash`.
- Implémenter la ré-émission **sans révocation** du credential précédent (CT-5).
- Livrer par email : lien vers la page, preuve téléchargeable, bloc de valeurs à reporter dans LinkedIn (CT-10).

**Vérifiable :** un credential émis est **accepté par le validateur public 1EdTech**. C'est le jalon de conformité (critère d'acceptation central) ; il DOIT être atteint avant d'investir dans la page de vérification.

## Phase 2 — Vérification

- Page de vérification contrôlant réellement signature, expiration et statut (CT-2).
- États d'affichage : valide / expiré / remplacé / révoqué / invalide, toujours en page propre, jamais en 404 (CT-8).
- Page d'un credential révoqué **anonymisée** : état affiché, données du titulaire retirées (CT-8).
- Téléchargement de la preuve brute (CT-6).
- Publication de la Bitstring Status List, référencée par les credentials (CT-4).
- Documentation publique de la vérification indépendante **et** de la vérification de liaison d'identité — hacher l'email présenté avec le sel du credential (CT-3, CT-6).

**Vérifiable :** le test adverse passe (un credential forgé et un credential altéré sont rejetés par la page **et** par le validateur tiers), et l'authenticité reste vérifiable serveur de statut injoignable.

## Phase 3 — LinkedIn

- Récupérer l'`organizationId` numérique de la Page (`linkedin.com/company/ai-driven-dev`).
- Bouton Add-to-Profile et bloc de valeurs à copier, sur la page du credential et dans l'email (CT-10).

**Vérifiable :** un titulaire crée une entrée LinkedIn dont la Credential URL renvoie à la page de vérification.

## Phase 4 — Conformité RGPD

*Voir les dépendances RGPD du corps du PRD. Ces tâches sont documentaires et organisationnelles, non applicatives, mais conditionnent la mise en production.*

- Vérifier que les CGU décrivent effectivement ce traitement (finalité, publication du nom, durée, destinataires, droits). Aucun consentement n'y est logé.
- Informer le titulaire, au moment de la certification, de la limite d'irrévocabilité des preuves exportées (CT-6).
- Implémenter la procédure d'effacement : révocation dans la liste de statuts, anonymisation de la page, purge de l'email.
- Rédiger et archiver la justification de non-réalisation d'une AIPD.

## Dépendance externe transverse

- **Visuel du credential**, produit hors de ce projet, à intégrer à l'émission (Phase 1).

## Décision non tranchée, à lever au démarrage

Le framework web, la couche de persistance et le mécanisme d'authentification de l'interface d'émission ne sont pas imposés. Les contraintes CT-1 à CT-10 s'appliquent quel que soit le choix. Seule contrainte de sélection : la bibliothèque cryptographique retenue DOIT satisfaire CT-9 (RS256 + JWKS + `kid`), à vérifier avant adoption si elle diffère de `jose`.

