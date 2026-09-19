# Youth Computing — Plateforme de gestion des activités et des participants

## 1. Présentation du projet

**Youth Computing** est une plateforme destinée à centraliser la gestion des participants, des activités, des sessions, des inscriptions, des présences, des intervenants et des utilisateurs.

Le projet est conçu pour être exploitable dans un contexte académique et professionnel, avec une architecture séparant :

- une interface utilisateur web moderne ;
- une API métier principale ;
- un service spécialisé dans les statistiques et le traitement des données ;
- une base de données PostgreSQL ;
- une couche ORM/data contract basée sur Prisma 8.

L'objectif est de disposer d'une plateforme évolutive capable de gérer les opérations CRUD, les statistiques sur plusieurs années et, à terme, l'import de fichiers Excel/CSV pour l'analyse des données Youth Computing.

---

## 2. Objectifs

### Objectif général

Mettre en place une plateforme complète permettant de gérer et d'analyser les données du programme Youth Computing.

### Objectifs spécifiques

1. Gérer les participants.
2. Gérer les utilisateurs et leurs rôles.
3. Gérer les activités et leurs responsables.
4. Gérer les sessions liées aux activités.
5. Gérer les inscriptions des participants.
6. Enregistrer les présences aux sessions.
7. Gérer les intervenants et leur participation aux activités.
8. Fournir des statistiques et tableaux de bord.
9. Préparer l'import et le traitement de fichiers Excel/CSV.
10. Exploiter l'historique des données, notamment sur plusieurs années.

---

## 3. Architecture technique

```text
                    ┌──────────────────────────┐
                    │ React + TypeScript       │
                    │ Frontend Web             │
                    └────────────┬─────────────┘
                                 │ REST API
                                 ▼
                    ┌──────────────────────────┐
                    │ NestJS + TypeScript      │
                    │ Backend principal        │
                    └────────────┬─────────────┘
                                 │ Prisma 8
                                 ▼
                    ┌──────────────────────────┐
                    │ PostgreSQL                │
                    │ youth_computing           │
                    └────────────▲─────────────┘
                                 │
                                 │ données / statistiques
                    ┌────────────┴─────────────┐
                    │ FastAPI + Python         │
                    │ Pandas / NumPy           │
                    │ Excel / CSV / analyse    │
                    └──────────────────────────┘
```

### Rôle des composants

| Composant | Technologie | Rôle |
|---|---|---|
| Frontend | React + TypeScript | Interface utilisateur |
| Backend | NestJS + TypeScript | API métier, sécurité, CRUD |
| Data API | FastAPI + Python | Statistiques, import, traitement de données |
| Base de données | PostgreSQL | Stockage principal |
| ORM / Data Contract | Prisma 8 | Accès et définition des données |
| Analyse | Pandas / NumPy | Traitement statistique |
| Graphiques | Recharts / ECharts | Visualisation des données |
| Documentation API | Swagger / OpenAPI | Documentation et test des endpoints |

---

## 4. Structure du projet

```text
youth-computing/
│
├── frontend/                         # Application React + TypeScript
│
├── backend/                          # API principale NestJS
│   ├── src/
│   │   ├── activites/                # Gestion des activités
│   │   ├── participants/             # Gestion des participants
│   │   ├── sessions/                 # Gestion des sessions
│   │   ├── prisma/                   # Configuration Prisma 8
│   │   ├── types/                    # Types globaux TypeScript
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma             # Schéma source local
│   │   ├── contract.prisma            # Contrat Prisma 8 introspecté
│   │   ├── contract.json              # Artefact généré
│   │   └── contract.d.ts              # Types générés
│   │
│   ├── .env                           # Configuration locale
│   └── package.json
│
├── data-api/                         # API FastAPI / Python
│   ├── main.py
│   ├── venv/
│   └── ...
│
└── README.md                         # Documentation du projet
```

---

## 5. Modèle de données

Le modèle relationnel comporte actuellement **9 tables** :

```text
role
│
└── utilisateur
      │
      └── activite
             │
             ├── sessions
             │      │
             │      └── presence
             │
             ├── inscription
             │      │
             │      └── participant
             │
             └── activite_intervenant
                         │
                         └── intervenant
```

### Tables

- `role`
- `utilisateur`
- `participant`
- `activite`
- `sessions`
- `inscription`
- `presence`
- `intervenant`
- `activite_intervenant`

### Relations principales

```text
ROLE             1 ───── N UTILISATEUR
UTILISATEUR      1 ───── N ACTIVITE
ACTIVITE         1 ───── N SESSIONS
PARTICIPANT      1 ───── N INSCRIPTION
ACTIVITE         1 ───── N INSCRIPTION
PARTICIPANT      1 ───── N PRESENCE
SESSIONS         1 ───── N PRESENCE
ACTIVITE         N ───── N INTERVENANT
```

La relation plusieurs-à-plusieurs entre `activite` et `intervenant` est matérialisée par `activite_intervenant`.

---

## 6. Détail des principales tables

### `role`

| Champ | Type | Contraintes |
|---|---|---|
| `id_role` | INT | PK, identité |
| `nom_role` | VARCHAR(100) | NOT NULL, UNIQUE |
| `description` | TEXT | facultatif |

### `utilisateur`

| Champ | Type | Contraintes |
|---|---|---|
| `id_utilisateur` | INT | PK, identité |
| `id_role` | INT | FK vers `role` |
| `nom` | VARCHAR(100) | NOT NULL |
| `prenom` | VARCHAR(100) | NOT NULL |
| `email` | VARCHAR(150) | UNIQUE |
| `mot_de_passe` | VARCHAR(255) | NOT NULL |
| `statut` | VARCHAR(50) | défaut `ACTIF` |

### `participant`

| Champ | Type |
|---|---|
| `id_participant` | INT PK |
| `nom` | VARCHAR(100) |
| `prenom` | VARCHAR(100) |
| `sexe` | VARCHAR(20) |
| `date_naissance` | DATE |
| `telephone` | VARCHAR(20) |
| `email` | VARCHAR(150) |
| `niveau_etude` | VARCHAR(100) |
| `profession` | VARCHAR(100) |
| `ville` | VARCHAR(100) |
| `region` | VARCHAR(100) |

### `activite`

| Champ | Type |
|---|---|
| `id_activite` | INT PK |
| `id_utilisateur` | INT FK |
| `titre` | VARCHAR(200) |
| `type_activite` | VARCHAR(100) |
| `description` | TEXT |
| `date_debut` | DATE |
| `date_fin` | DATE |
| `heure_debut` | TIME |
| `heure_fin` | TIME |
| `lieu` | VARCHAR(200) |
| `mode` | VARCHAR(50) |
| `capacite` | INT |
| `statut` | VARCHAR(50) |

### `sessions`

| Champ | Type |
|---|---|
| `id_session` | INT PK |
| `id_activite` | INT FK |
| `libelle` | VARCHAR(200) |
| `date_session` | DATE |
| `heure_debut` | TIME |
| `heure_fin` | TIME |
| `lieu` | VARCHAR(200) |

### `inscription`

Contient l'inscription d'un participant à une activité.

### `presence`

Contient la présence d'un participant à une session.

### `intervenant`

Contient les informations sur les personnes intervenant dans les activités.

### `activite_intervenant`

Table associative avec une clé primaire composite :

```text
(id_activite, id_intervenant)
```

---

## 7. Prérequis

Installer au minimum :

- Node.js
- npm
- PostgreSQL
- Python 3
- Git

Vérifier les installations :

```cmd
node --version
npm --version
psql --version
python --version
git --version
```

---

## 8. Base PostgreSQL

### Base utilisée

```text
database : youth_computing
host     : localhost
port     : 5432
schema   : public
```

### Connexion

```cmd
psql -U postgres -d youth_computing
```

### Vérifier les tables

```cmd
psql -U postgres -d youth_computing -c "\dt"
```

### Vérifier une table

```cmd
psql -U postgres -d youth_computing -c "\d activite"
```

> Dans PostgreSQL/psql, utiliser `\d` plutôt que `DESC`.

---

## 9. Configuration Backend NestJS

Entrer dans le backend :

```cmd
cd D:\STAGE----M2-2026--YOUTH-C\PROJET-YC\youth-computing\backend
```

Installer les dépendances :

```cmd
npm install
```

Le projet utilise notamment :

```text
@nestjs/common
@nestjs/core
@nestjs/platform-express
@prisma/client
@prisma/orm-postgres
@js-temporal/polyfill
dotenv
```

---

## 10. Configuration `.env`

Créer le fichier :

```text
backend/.env
```

avec une connexion de ce type :

```env
DATABASE_URL="postgresql://postgres:<MOT_DE_PASSE>@localhost:5432/youth_computing?schema=public"
PORT=3000
```

Ne jamais publier un vrai mot de passe dans GitHub.

---

## 11. Prisma 8

Le projet utilise le nouveau fonctionnement Prisma 8 avec contrat et runtime PostgreSQL.

### Vérifier Prisma

```cmd
npx prisma --version
```

### Lire le schéma PostgreSQL

```cmd
npx prisma db schema
```

### Générer le contrat à partir de la base

```cmd
npx prisma contract infer
```

### Générer les artefacts du contrat

```cmd
npx prisma contract emit
```

Fichiers générés :

```text
prisma/contract.prisma
prisma/contract.json
prisma/contract.d.ts
```

`contract.json` et `contract.d.ts` sont des artefacts générés : ils ne doivent pas être modifiés manuellement.

---

## 12. Runtime Prisma 8 dans NestJS

Le service Prisma du projet utilise :

```typescript
import postgres from '@prisma/orm-postgres/runtime';
```

et le contrat généré pour exposer les modèles via :

```typescript
this.prisma.client.orm.public
```

Exemple de lecture de tous les participants :

```typescript
return this.prisma.client.orm.public.Participant.all();
```

---

## 13. Démarrer le Backend

Depuis `backend` :

```cmd
npm run start:dev
```

Lorsque tout fonctionne, NestJS affiche notamment :

```text
Found 0 errors. Watching for file changes.
Nest application successfully started
```

Le backend est accessible sur :

```text
http://localhost:3000
```

---

## 14. API Participants

Endpoint de base :

```text
/participants
```

### Créer

```cmd
curl -X POST http://localhost:3000/participants -H "Content-Type: application/json" -d "{\"nom\":\"RAKOTO\",\"prenom\":\"Jean\",\"sexe\":\"M\",\"date_naissance\":\"2000-05-15\",\"telephone\":\"0340000000\",\"email\":\"jean@example.com\",\"niveau_etude\":\"Master\",\"profession\":\"Etudiant\",\"ville\":\"Antananarivo\",\"region\":\"Analamanga\"}"
```

### Lire tous

```cmd
curl http://localhost:3000/participants
```

### Lire un

```cmd
curl http://localhost:3000/participants/1
```

### Modifier

```cmd
curl -X PUT http://localhost:3000/participants/1 -H "Content-Type: application/json" -d "{\"profession\":\"Etudiant M2\"}"
```

### Supprimer

```cmd
curl -X DELETE http://localhost:3000/participants/2
```

### État

```text
POST   /participants       ✅ validé
GET    /participants       ✅ validé
GET    /participants/:id   ✅ validé
PUT    /participants/:id   ✅ validé
DELETE /participants/:id   ✅ validé
```

---

## 15. API Activités

Endpoint de base :

```text
/activites
```

### Créer

```cmd
curl -X POST http://localhost:3000/activites -H "Content-Type: application/json" -d "{\"id_utilisateur\":1,\"titre\":\"Atelier Youth Computing\",\"type_activite\":\"ATELIER\",\"description\":\"Atelier pratique dans le cadre du programme Youth Computing.\",\"date_debut\":\"2026-09-21\",\"date_fin\":\"2026-09-21\",\"heure_debut\":\"08:30:00\",\"heure_fin\":\"16:00:00\",\"lieu\":\"Antananarivo\",\"mode\":\"PRESENTIEL\",\"capacite\":25,\"statut\":\"PLANIFIEE\"}"
```

### Lire tous

```cmd
curl http://localhost:3000/activites
```

### Lire un

```cmd
curl http://localhost:3000/activites/1
```

### Modifier

```cmd
curl -X PUT http://localhost:3000/activites/1 -H "Content-Type: application/json" -d "{\"titre\":\"Formation React TypeScript Avance\",\"capacite\":40,\"lieu\":\"Université d'Antananarivo\"}"
```

### Supprimer

```cmd
curl -X DELETE http://localhost:3000/activites/1
```

### État

```text
POST   /activites       ✅ validé
GET    /activites       ✅ validé
GET    /activites/:id   ✅ validé
PUT    /activites/:id   ✅ validé
DELETE /activites/:id   ✅ validé
```

---

## 16. API Sessions

Endpoint de base :

```text
/sessions
```

Une session est obligatoirement rattachée à une activité grâce à `id_activite`.

### Créer

```cmd
curl -X POST http://localhost:3000/sessions -H "Content-Type: application/json" -d "{\"id_activite\":2,\"libelle\":\"Session 1 - Introduction\",\"date_session\":\"2026-09-21\",\"heure_debut\":\"08:30:00\",\"heure_fin\":\"10:30:00\",\"lieu\":\"Salle informatique A\"}"
```

### Lire tous

```cmd
curl http://localhost:3000/sessions
```

### Lire un

```cmd
curl http://localhost:3000/sessions/1
```

### Modifier

```cmd
curl -X PUT http://localhost:3000/sessions/1 -H "Content-Type: application/json" -d "{\"libelle\":\"Session 1 - Introduction avancée\"}"
```

### Supprimer

```cmd
curl -X DELETE http://localhost:3000/sessions/1
```

### État actuel

```text
POST   /sessions       ✅ validé
GET    /sessions       ✅ validé
GET    /sessions/:id   ⏳ test à poursuivre
PUT    /sessions/:id   ⏳ test à poursuivre
DELETE /sessions/:id   ⏳ test à poursuivre
```

---

## 17. API FastAPI / Data API

Le service Python se trouve dans :

```text
D:\STAGE----M2-2026--YOUTH-C\PROJET-YC\youth-computing\data-api
```

### Activer l'environnement virtuel sous CMD

```cmd
venv\Scripts\activate
```

### Installer les bibliothèques

```cmd
python -m pip install fastapi uvicorn pandas openpyxl psycopg2-binary
```

### Lancer FastAPI

```cmd
uvicorn main:app --reload
```

Par défaut :

```text
http://127.0.0.1:8000
```

Documentation interactive :

```text
http://127.0.0.1:8000/docs
```

OpenAPI :

```text
http://127.0.0.1:8000/openapi.json
```

### Endpoint actuellement disponible

```text
GET /
```

Réponse initiale :

```json
{
  "message": "API Youth Computing opérationnelle"
}
```

---

## 18. Préparation aux statistiques

Le service FastAPI est destiné à prendre en charge :

- statistiques sur les participants ;
- évolution du nombre d'activités ;
- fréquentation des sessions ;
- taux de présence ;
- répartition par sexe ;
- répartition par région et ville ;
- répartition par niveau d'étude ;
- statistiques par année ;
- comparaison sur les cinq dernières années ;
- import de fichiers Excel ;
- import de fichiers CSV ;
- nettoyage et transformation des données.

Les bibliothèques prévues sont principalement :

```text
Pandas
NumPy
openpyxl
psycopg2-binary
FastAPI
```

---

## 19. Frontend React

Le frontend est prévu dans :

```text
frontend/
```

Technologies prévues :

```text
React
TypeScript
Vite
Recharts ou ECharts
```

Fonctionnalités principales prévues :

- tableau de bord ;
- gestion des participants ;
- gestion des activités ;
- gestion des sessions ;
- inscriptions ;
- présences ;
- intervenants ;
- utilisateurs et rôles ;
- statistiques ;
- graphiques ;
- import de fichiers ;
- recherche et filtres.

---

## 20. Authentification et sécurité

La conception prévoit :

```text
JWT
Refresh Token
RBAC par rôle
Validation des données
Hash des mots de passe
Swagger/OpenAPI
```

Les mots de passe ne doivent pas être conservés en clair dans la version finale.

Pour la production, il faudra également prévoir :

- variables d'environnement sécurisées ;
- HTTPS ;
- contrôle d'accès ;
- validation stricte des entrées ;
- limitation des requêtes si nécessaire ;
- gestion centralisée des erreurs ;
- journalisation adaptée.

---

## 21. Développement avec Git

Initialiser le dépôt depuis la racine :

```cmd
git init
```

Ajouter les fichiers :

```cmd
git add .
```

Créer le premier commit :

```cmd
git commit -m "Initialisation du projet Youth Computing"
```

Ajouter le dépôt distant :

```cmd
git remote add origin https://github.com/<utilisateur>/<repository>.git
```

Vérifier le dépôt distant :

```cmd
git remote -v
```

Envoyer la branche principale :

```cmd
git branch -M main
git push -u origin main
```

### Important

Le fichier `.env` ne doit pas être envoyé sur GitHub. Ajouter notamment :

```gitignore
.env
venv/
node_modules/
dist/
__pycache__/
*.log
```

---

## 22. Dépannage courant

### `psql` n'est pas reconnu

Vérifier l'installation de PostgreSQL et la présence du dossier `bin` de PostgreSQL dans le `PATH` Windows.

### Erreur `AUTO_INCREMENT`

`AUTO_INCREMENT` est une syntaxe MySQL. PostgreSQL utilise notamment les colonnes `IDENTITY`.

Exemple :

```sql
id_role INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

### `DESC table` ne fonctionne pas

Dans `psql`, utiliser :

```text
\d table
```

### Prisma ne trouve pas `PrismaClient`

Ce projet utilise le runtime Prisma 8 et `@prisma/orm-postgres`. Ne pas appliquer directement les anciens exemples Prisma basés uniquement sur `@prisma/client`.

### Erreur Temporal

Les champs PostgreSQL `DATE` et `TIME` sont manipulés côté runtime avec les types Temporal utilisés par Prisma 8.

Le projet charge notamment :

```typescript
import { Temporal } from '@js-temporal/polyfill';
```

### Erreur Observe `401`

Le module Observe utilise actuellement des valeurs de démonstration :

```text
YOUR_APP_KEY
YOUR_APP_SECRET
```

Cette erreur de télémétrie ne bloque pas le démarrage actuel de l'API, mais les identifiants Observe devront être configurés ou le module désactivé/configuré pour un environnement final.

---

## 23. État d'avancement

### Base de données

```text
PostgreSQL                           ✅
Schéma relationnel                  ✅
Tables principales                  ✅
PK / FK                             ✅
Contraintes principales             ✅
```

### Prisma 8

```text
Configuration Prisma 8              ✅
Introspection PostgreSQL            ✅
Contract Prisma                     ✅
contract.json                       ✅
contract.d.ts                       ✅
Runtime PostgreSQL                  ✅
```

### Backend NestJS

```text
Projet NestJS                       ✅
PrismaModule                        ✅
ParticipantsController              ✅
ActivitesController                 ✅
SessionsController                  ✅
```

### CRUD

```text
Participants                        ✅ 5/5
Activites                           ✅ 5/5
Sessions                            ✅ 2/5 validés actuellement
```

### FastAPI

```text
Projet FastAPI                      ✅
Environnement virtuel               ✅
FastAPI installé                    ✅
Uvicorn installé                    ✅
Pandas installé                     ✅
openpyxl installé                   ✅
Connexion PostgreSQL prévue         ⏳
Statistiques                        ⏳
Import Excel/CSV                    ⏳
```

### Frontend

```text
Architecture React                  ✅ prévue
Interface CRUD                      ⏳
Dashboard                           ⏳
Graphiques                          ⏳
Authentification                    ⏳
```

---

## 24. Feuille de route recommandée

### Phase 1 — Backend CRUD

1. Terminer `sessions`.
2. Créer `inscriptions`.
3. Créer `presences`.
4. Créer `intervenants`.
5. Créer la gestion de `activite_intervenant`.
6. Ajouter progressivement les validations DTO.

### Phase 2 — Sécurité

1. Authentification JWT.
2. Hash des mots de passe.
3. Gestion des rôles.
4. Guards et autorisations.

### Phase 3 — Data API

1. Connexion FastAPI à PostgreSQL.
2. Endpoints statistiques.
3. Agrégations par année.
4. Analyse sur cinq ans.
5. Import Excel/CSV.
6. Nettoyage et validation des données.

### Phase 4 — Frontend

1. Initialiser React + TypeScript.
2. Connecter les endpoints NestJS.
3. Créer les écrans CRUD.
4. Ajouter les formulaires.
5. Ajouter les tableaux.
6. Créer le dashboard statistique.
7. Ajouter les graphiques.

### Phase 5 — Production

1. Variables d'environnement.
2. Docker.
3. PostgreSQL de production.
4. CI/CD.
5. Logs et monitoring.
6. Sauvegardes.
7. Tests automatisés.

---

## 25. Commandes essentielles — résumé

### Backend

```cmd
cd D:\STAGE----M2-2026--YOUTH-C\PROJET-YC\youth-computing\backend
npm install
npm run start:dev
```

### FastAPI

```cmd
cd D:\STAGE----M2-2026--YOUTH-C\PROJET-YC\youth-computing\data-api
venv\Scripts\activate
uvicorn main:app --reload
```

### PostgreSQL

```cmd
psql -U postgres -d youth_computing
```

### Prisma

```cmd
npx prisma db schema
npx prisma contract infer
npx prisma contract emit
```

---

## 26. Auteur / projet académique

**Projet :** Youth Computing — Plateforme de gestion et d'analyse des données

**Stack :** React + TypeScript + NestJS + FastAPI + PostgreSQL + Prisma 8

**Contexte :** projet M2 / développement d'une plateforme de gestion, d'import et d'analyse de données Youth Computing.

---

## 27. Licence

Projet académique / professionnel. La licence définitive doit être ajoutée selon les règles de diffusion du projet.
