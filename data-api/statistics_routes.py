
# Importe APIRouter pour créer les routes statistiques.
from fastapi import APIRouter, HTTPException

# Importe le pilote PostgreSQL.
from psycopg2 import Error as PostgreSQLError

# Importe notre fonction de connexion à PostgreSQL.
from database import get_connection, close_connection

# Importe date pour calculer l'âge des participants.
from datetime import date

# Importe Pandas pour traiter et analyser les données.
import pandas as pd

# Importe date pour calculer l'âge des participants.
from datetime import date

# Importe Pandas pour traiter et analyser les données.
import pandas as pd

# Crée le routeur dédié aux statistiques.
router = APIRouter()


# Définit la route GET /statistics/overview.
@router.get("/overview")

# Déclare la fonction qui calcule les indicateurs généraux.
def obtenir_vue_ensemble():

    # Initialise la connexion PostgreSQL.
    conn = None

    # Prépare la requête SQL qui calcule les indicateurs globaux.
    requete = """
        SELECT

            -- Compte le nombre total d'activités.
            (SELECT COUNT(*) FROM public.activite) AS total_activites,

            -- Compte le nombre total de sessions.
            (SELECT COUNT(*) FROM public.sessions) AS total_sessions,

            -- Compte tous les participants enregistrés dans la base.
            (SELECT COUNT(*) FROM public.participant) AS total_participants_base,

            -- Compte toutes les inscriptions.
            (SELECT COUNT(*) FROM public.inscription) AS total_inscriptions,

            -- Compte les participants distincts ayant au moins une inscription.
            (SELECT COUNT(DISTINCT id_participant)
             FROM public.inscription) AS participants_inscrits_uniques,

            -- Compte les enregistrements de présence.
            (SELECT COUNT(*) FROM public.presence) AS total_enregistrements_presence,

            -- Compte les participants marqués présents.
            (SELECT COUNT(*)
             FROM public.presence
             WHERE statut_presence = 'PRESENT') AS total_presents,

            -- Compte les participants marqués absents.
            (SELECT COUNT(*)
             FROM public.presence
             WHERE statut_presence = 'ABSENT') AS total_absents;
    """

    try:

        # Ouvre une connexion à la base youth_computing.
        conn = get_connection()

        # Crée un curseur pour exécuter la requête SQL.
        with conn.cursor() as cursor:

            # Exécute la requête statistique.
            cursor.execute(requete)

            # Récupère la ligne contenant tous les indicateurs.
            resultat = cursor.fetchone()

        # Vérifie que la requête a retourné un résultat.
        if resultat is None:

            # Signale une erreur si aucun résultat n'est retourné.
            raise HTTPException(
                status_code=500,
                detail="Impossible de récupérer les statistiques."
            )

        # Organise les résultats SQL dans un dictionnaire.
        statistiques = {

            # Nombre total d'activités.
            "total_activites": resultat[0],

            # Nombre total de sessions.
            "total_sessions": resultat[1],

            # Nombre de participants présents dans la base.
            "total_participants_base": resultat[2],

            # Nombre total d'inscriptions.
            "total_inscriptions": resultat[3],

            # Nombre de participants uniques inscrits.
            "participants_inscrits_uniques": resultat[4],

            # Nombre total d'enregistrements de présence.
            "total_enregistrements_presence": resultat[5],

            # Nombre de présences enregistrées comme PRESENT.
            "total_presents": resultat[6],

            # Nombre de présences enregistrées comme ABSENT.
            "total_absents": resultat[7],
        }

        # Calcule le nombre de présences dont le statut est renseigné.
        total_presence_statuee = (
            statistiques["total_presents"]
            + statistiques["total_absents"]
        )

        # Calcule le taux de participation si des statuts sont disponibles.
        if total_presence_statuee > 0:

            # Calcule le pourcentage de présences enregistrées comme PRESENT.
            taux_presence = (
                statistiques["total_presents"]
                / total_presence_statuee
            ) * 100

        else:

            # Retourne zéro si aucune présence n'est enregistrée.
            taux_presence = 0

        # Ajoute le taux de présence au dictionnaire.
        statistiques["taux_presence_pct"] = round(taux_presence, 2)

        # Retourne les indicateurs au format JSON.
        return {
            "message": "Statistiques générales récupérées avec succès.",
            "indicateurs": statistiques
        }

    # Capture les erreurs provenant de PostgreSQL.
    except PostgreSQLError as erreur:

        # Retourne une erreur HTTP 500 sans exposer les informations sensibles.
        raise HTTPException(
            status_code=500,
            detail="Erreur PostgreSQL lors du calcul des statistiques."
        ) from erreur

    finally:

        # Ferme la connexion PostgreSQL après le traitement.
        if conn is not None:
            close_connection(conn)

# Définit une fonction pour calculer la répartition d'une variable.
def calculer_repartition(df: pd.DataFrame, colonne: str) -> list:

    # Remplace les valeurs manquantes par la mention Non renseigné.
    valeurs = df[colonne].fillna("Non renseigné")

    # Convertit toutes les valeurs en chaînes de caractères.
    valeurs = valeurs.astype(str)

    # Supprime les espaces inutiles.
    valeurs = valeurs.str.strip()

    # Remplace les chaînes vides par Non renseigné.
    valeurs = valeurs.replace("", "Non renseigné")

    # Compte les occurrences de chaque catégorie.
    comptages = valeurs.value_counts()

    # Prépare la liste des résultats statistiques.
    resultat = []

    # Parcourt les catégories et leurs effectifs.
    for categorie, nombre in comptages.items():

        # Ajoute chaque catégorie et son effectif à la liste.
        resultat.append({
            "categorie": str(categorie),
            "nombre": int(nombre)
        })

    # Retourne la répartition statistique.
    return resultat


# Définit une fonction pour déterminer la tranche d'âge d'un participant.
def determiner_tranche_age(date_naissance, date_reference: date) -> str:

    # Vérifie si la date de naissance est absente.
    if pd.isna(date_naissance):

        # Retourne une catégorie pour les dates manquantes.
        return "Non renseigné"

    # Convertit la date de naissance en date Pandas.
    naissance = pd.to_datetime(date_naissance, errors="coerce")

    # Vérifie si la date est invalide.
    if pd.isna(naissance):

        # Retourne une catégorie pour les dates invalides.
        return "Date invalide"

    # Calcule l'âge en années révolues.
    age = date_reference.year - naissance.year - (
        (date_reference.month, date_reference.day)
        < (naissance.month, naissance.day)
    )

    # Vérifie si la date de naissance est dans le futur.
    if age < 0:

        # Signale une date de naissance incohérente.
        return "Date invalide"

    # Classe les participants de moins de 18 ans.
    if age < 18:
        return "Moins de 18 ans"

    # Classe les participants de 18 à 24 ans.
    if age <= 24:
        return "18-24 ans"

    # Classe les participants de 25 à 34 ans.
    if age <= 34:
        return "25-34 ans"

    # Classe les participants de 35 à 44 ans.
    if age <= 44:
        return "35-44 ans"

    # Classe les participants de 45 ans et plus.
    return "45 ans et plus"


# Définit la route GET /statistics/participants.
@router.get("/participants")

# Déclare la fonction qui analyse les profils des participants.
def statistiques_participants():

    # Initialise la connexion PostgreSQL.
    conn = None

    # Prépare la requête SQL de récupération des participants.
    requete = """
        SELECT
            id_participant,
            sexe,
            date_naissance,
            niveau_etude,
            ville,
            region
        FROM public.participant
        ORDER BY id_participant;
    """

    try:

        # Ouvre une connexion à PostgreSQL.
        conn = get_connection()

        # Crée un curseur pour exécuter la requête SQL.
        with conn.cursor() as cursor:

            # Exécute la requête de récupération.
            cursor.execute(requete)

            # Récupère les noms des colonnes SQL.
            colonnes = [description[0] for description in cursor.description]

            # Récupère toutes les lignes retournées par PostgreSQL.
            lignes = cursor.fetchall()

        # Transforme les données SQL en DataFrame Pandas.
        df = pd.DataFrame(lignes, columns=colonnes)

        # Calcule la date de référence pour déterminer les âges.
        date_reference = date.today()

        # Prépare la réponse en cas d'absence de participants.
        if df.empty:

            # Retourne des répartitions vides.
            return {
                "message": "Aucun participant enregistré.",
                "indicateurs": {
                    "total_participants": 0,
                    "repartition_sexe": [],
                    "repartition_age": [],
                    "repartition_niveau_etude": [],
                    "repartition_ville": [],
                    "repartition_region": []
                }
            }

        # Calcule la tranche d'âge de chaque participant.
        df["tranche_age"] = df["date_naissance"].apply(
            lambda naissance: determiner_tranche_age(
                naissance,
                date_reference
            )
        )

        # Calcule le nombre total de participants.
        total_participants = int(len(df))

        # Prépare tous les indicateurs de répartition.
        indicateurs = {

            # Nombre total de participants enregistrés.
            "total_participants": total_participants,

            # Répartition des participants selon leur sexe.
            "repartition_sexe": calculer_repartition(
                df,
                "sexe"
            ),

            # Répartition des participants selon leur tranche d'âge.
            "repartition_age": calculer_repartition(
                df,
                "tranche_age"
            ),

            # Répartition selon le niveau d'étude.
            "repartition_niveau_etude": calculer_repartition(
                df,
                "niveau_etude"
            ),

            # Répartition selon la ville.
            "repartition_ville": calculer_repartition(
                df,
                "ville"
            ),

            # Répartition selon la région.
            "repartition_region": calculer_repartition(
                df,
                "region"
            )
        }

        # Retourne les statistiques des participants au format JSON.
        return {
            "message": "Statistiques des participants récupérées avec succès.",
            "indicateurs": indicateurs
        }

    # Capture les erreurs provenant de PostgreSQL.
    except PostgreSQLError as erreur:

        # Retourne une erreur HTTP 500 en cas de problème SQL.
        raise HTTPException(
            status_code=500,
            detail="Erreur PostgreSQL lors de l'analyse des participants."
        ) from erreur

    # Exécute toujours la fermeture de la connexion.
    finally:

        # Vérifie que la connexion a bien été ouverte.
        if conn is not None:

            # Ferme la connexion PostgreSQL.
            close_connection(conn)

# Définit la route GET /statistics/activites.
@router.get("/activites")

# Déclare la fonction qui analyse les activités de Youth Computing.
def statistiques_activites():

    # Initialise la connexion PostgreSQL.
    conn = None

    # Prépare la requête SQL pour calculer les indicateurs généraux.
    requete_resume = """
        SELECT

            -- Compte le nombre total d'activités.
            COUNT(*) AS total_activites,

            -- Calcule la somme des capacités des activités.
            COALESCE(SUM(capacite), 0) AS capacite_totale

        -- Lit les données dans la table activite.
        FROM public.activite;
    """

    # Prépare la requête SQL pour répartir les activités par type.
    requete_types = """
        SELECT

            -- Remplace les types manquants ou vides.
            COALESCE(
                NULLIF(BTRIM(type_activite), ''),
                'Non renseigné'
            ) AS categorie,

            -- Compte les activités de chaque type.
            COUNT(*) AS nombre

        -- Lit les activités.
        FROM public.activite

        -- Regroupe les activités par type.
        GROUP BY 1

        -- Classe les types du plus fréquent au moins fréquent.
        ORDER BY nombre DESC, categorie ASC;
    """

    # Prépare la requête SQL pour répartir les activités par année.
    requete_annees = """
        SELECT

            -- Extrait l'année à partir de la date de début.
            EXTRACT(YEAR FROM date_debut)::INTEGER AS annee,

            -- Compte les activités de chaque année.
            COUNT(*) AS nombre

        -- Lit les activités.
        FROM public.activite

        -- Regroupe les activités par année.
        GROUP BY EXTRACT(YEAR FROM date_debut)

        -- Classe les années de la plus récente à la plus ancienne.
        ORDER BY annee DESC NULLS LAST;
    """

    # Prépare la requête SQL pour répartir les activités par statut.
    requete_statuts = """
        SELECT

            -- Remplace les statuts manquants ou vides.
            COALESCE(
                NULLIF(BTRIM(statut), ''),
                'Non renseigné'
            ) AS categorie,

            -- Compte les activités de chaque statut.
            COUNT(*) AS nombre

        -- Lit les activités.
        FROM public.activite

        -- Regroupe les activités par statut.
        GROUP BY 1

        -- Classe les statuts du plus fréquent au moins fréquent.
        ORDER BY nombre DESC, categorie ASC;
    """

    try:

        # Ouvre une connexion à la base de données PostgreSQL.
        conn = get_connection()

        # Crée un curseur pour exécuter les requêtes SQL.
        with conn.cursor() as cursor:

            # Exécute la requête de résumé général.
            cursor.execute(requete_resume)

            # Récupère les indicateurs généraux.
            resume = cursor.fetchone()

            # Exécute la requête de répartition par type.
            cursor.execute(requete_types)

            # Récupère les résultats par type d'activité.
            resultats_types = cursor.fetchall()

            # Exécute la requête de répartition par année.
            cursor.execute(requete_annees)

            # Récupère les résultats par année.
            resultats_annees = cursor.fetchall()

            # Exécute la requête de répartition par statut.
            cursor.execute(requete_statuts)

            # Récupère les résultats par statut.
            resultats_statuts = cursor.fetchall()

        # Organise les résultats de la répartition par type.
        repartition_type = [
            {
                "categorie": str(categorie),
                "nombre": int(nombre)
            }
            for categorie, nombre in resultats_types
        ]

        # Organise les résultats de la répartition par année.
        repartition_annee = [
            {
                "annee": (
                    int(annee)
                    if annee is not None
                    else None
                ),
                "nombre": int(nombre)
            }
            for annee, nombre in resultats_annees
        ]

        # Organise les résultats de la répartition par statut.
        repartition_statut = [
            {
                "categorie": str(categorie),
                "nombre": int(nombre)
            }
            for categorie, nombre in resultats_statuts
        ]

        # Prépare les indicateurs statistiques des activités.
        indicateurs = {

            # Nombre total d'activités enregistrées.
            "total_activites": int(resume[0]),

            # Capacité totale cumulée des activités.
            "capacite_totale": int(resume[1]),

            # Répartition des activités selon leur type.
            "repartition_type": repartition_type,

            # Répartition des activités selon leur année de début.
            "repartition_annee": repartition_annee,

            # Répartition des activités selon leur statut.
            "repartition_statut": repartition_statut
        }

        # Retourne les statistiques au format JSON.
        return {
            "message": "Statistiques des activités récupérées avec succès.",
            "indicateurs": indicateurs
        }

    # Capture les erreurs provenant de PostgreSQL.
    except PostgreSQLError as erreur:

        # Retourne une erreur HTTP 500 en cas de problème SQL.
        raise HTTPException(
            status_code=500,
            detail="Erreur PostgreSQL lors de l'analyse des activités."
        ) from erreur

    finally:

        # Vérifie que la connexion existe.
        if conn is not None:

            # Ferme la connexion PostgreSQL.
            close_connection(conn)

# Définit la route GET /statistics/inscriptions.
@router.get("/inscriptions")

# Déclare la fonction qui analyse les inscriptions de Youth Computing.
def statistiques_inscriptions():

    # Initialise la connexion PostgreSQL.
    conn = None

    # Prépare la requête SQL pour calculer les indicateurs généraux.
    requete_resume = """
        SELECT

            -- Compte toutes les inscriptions enregistrées.
            COUNT(*)::INTEGER AS total_inscriptions,

            -- Compte les participants distincts ayant une inscription.
            COUNT(DISTINCT id_participant)::INTEGER AS participants_uniques,

            -- Compte les activités ayant au moins une inscription.
            COUNT(DISTINCT id_activite)::INTEGER AS activites_concernees

        -- Lit les données de la table inscription.
        FROM public.inscription;
    """

    # Prépare la requête SQL pour calculer les inscriptions par année.
    requete_annuelle = """
        SELECT

            -- Extrait l'année de la date d'inscription.
            EXTRACT(YEAR FROM date_inscription)::INTEGER AS annee,

            -- Compte les inscriptions de chaque année.
            COUNT(*)::INTEGER AS nombre

        -- Lit les inscriptions.
        FROM public.inscription

        -- Ignore les dates d'inscription manquantes.
        WHERE date_inscription IS NOT NULL

        -- Regroupe les inscriptions par année.
        GROUP BY EXTRACT(YEAR FROM date_inscription)

        -- Classe les années de la plus ancienne à la plus récente.
        ORDER BY annee ASC;
    """

    # Prépare la requête SQL pour identifier les nouveaux participants par année.
    requete_nouveaux = """
        WITH premiere_inscription AS (

            -- Recherche la première date d'inscription de chaque participant.
            SELECT
                id_participant,
                MIN(date_inscription) AS premiere_date

            -- Lit les inscriptions enregistrées.
            FROM public.inscription

            -- Ignore les dates manquantes.
            WHERE date_inscription IS NOT NULL

            -- Regroupe les inscriptions par participant.
            GROUP BY id_participant
        )

        -- Calcule le nombre de nouveaux participants par année.
        SELECT

            -- Extrait l'année de la première inscription.
            EXTRACT(YEAR FROM premiere_date)::INTEGER AS annee,

            -- Compte les nouveaux participants de chaque année.
            COUNT(*)::INTEGER AS nombre

        -- Utilise les premières inscriptions calculées.
        FROM premiere_inscription

        -- Regroupe les nouveaux participants par année.
        GROUP BY EXTRACT(YEAR FROM premiere_date)

        -- Classe les années dans l'ordre chronologique.
        ORDER BY annee ASC;
    """

    # Prépare la requête SQL pour analyser les inscriptions par activité.
    requete_activites = """
        SELECT

            -- Récupère l'identifiant de l'activité.
            a.id_activite,

            -- Récupère le titre de l'activité.
            a.titre,

            -- Compte les inscriptions de chaque activité.
            COUNT(i.id_inscription)::INTEGER AS nombre_inscriptions,

            -- Compte les participants distincts de chaque activité.
            COUNT(DISTINCT i.id_participant)::INTEGER AS participants_uniques

        -- Utilise la table des activités comme table principale.
        FROM public.activite AS a

        -- Associe les inscriptions à leurs activités.
        LEFT JOIN public.inscription AS i
            ON i.id_activite = a.id_activite

        -- Regroupe les résultats par activité.
        GROUP BY a.id_activite, a.titre

        -- Classe les activités selon le nombre d'inscriptions.
        ORDER BY nombre_inscriptions DESC, a.titre ASC;
    """

    # Prépare la requête SQL pour analyser les statuts d'inscription.
    requete_statuts = """
        SELECT

            -- Remplace les statuts manquants ou vides.
            COALESCE(
                NULLIF(BTRIM(statut), ''),
                'Non renseigné'
            ) AS statut,

            -- Compte les inscriptions de chaque statut.
            COUNT(*)::INTEGER AS nombre

        -- Lit les inscriptions.
        FROM public.inscription

        -- Regroupe les résultats par statut.
        GROUP BY 1

        -- Classe les statuts du plus fréquent au moins fréquent.
        ORDER BY nombre DESC, statut ASC;
    """

    try:

        # Ouvre une connexion à la base youth_computing.
        conn = get_connection()

        # Crée un curseur pour exécuter les requêtes SQL.
        with conn.cursor() as cursor:

            # Exécute la requête générale.
            cursor.execute(requete_resume)

            # Récupère les indicateurs généraux.
            resume = cursor.fetchone()

            # Exécute la requête des inscriptions annuelles.
            cursor.execute(requete_annuelle)

            # Récupère les résultats annuels.
            resultats_annuels = cursor.fetchall()

            # Exécute la requête des nouveaux participants.
            cursor.execute(requete_nouveaux)

            # Récupère les nouveaux participants par année.
            resultats_nouveaux = cursor.fetchall()

            # Exécute la requête de répartition par activité.
            cursor.execute(requete_activites)

            # Récupère les résultats par activité.
            resultats_activites = cursor.fetchall()

            # Exécute la requête de répartition par statut.
            cursor.execute(requete_statuts)

            # Récupère les résultats par statut.
            resultats_statuts = cursor.fetchall()

        # Organise les inscriptions annuelles au format JSON.
        repartition_annuelle = [
            {
                "annee": int(annee),
                "nombre": int(nombre)
            }
            for annee, nombre in resultats_annuels
        ]

        # Organise les nouveaux participants au format JSON.
        nouveaux_participants = [
            {
                "annee": int(annee),
                "nombre": int(nombre)
            }
            for annee, nombre in resultats_nouveaux
        ]

        # Organise les résultats par activité au format JSON.
        repartition_activite = [
            {
                "id_activite": int(id_activite),
                "titre": titre,
                "nombre_inscriptions": int(nombre_inscriptions),
                "participants_uniques": int(participants_uniques)
            }
            for (
                id_activite,
                titre,
                nombre_inscriptions,
                participants_uniques
            ) in resultats_activites
        ]

        # Organise les résultats par statut au format JSON.
        repartition_statut = [
            {
                "statut": str(statut),
                "nombre": int(nombre)
            }
            for statut, nombre in resultats_statuts
        ]

        # Prépare les indicateurs statistiques des inscriptions.
        indicateurs = {

            # Nombre total d'inscriptions.
            "total_inscriptions": int(resume[0]),

            # Nombre de participants distincts inscrits.
            "participants_uniques": int(resume[1]),

            # Nombre d'activités ayant reçu des inscriptions.
            "activites_concernees": int(resume[2]),

            # Inscriptions regroupées par année.
            "repartition_annuelle": repartition_annuelle,

            # Nouveaux participants regroupés par année.
            "nouveaux_participants_par_annee": nouveaux_participants,

            # Nombre d'inscriptions et de participants par activité.
            "repartition_activite": repartition_activite,

            # Nombre d'inscriptions par statut.
            "repartition_statut": repartition_statut
        }

        # Retourne les statistiques au format JSON.
        return {
            "message": "Statistiques des inscriptions récupérées avec succès.",
            "indicateurs": indicateurs
        }

    # Capture les erreurs provenant de PostgreSQL.
    except PostgreSQLError as erreur:

        # Retourne une erreur HTTP 500 en cas de problème SQL.
        raise HTTPException(
            status_code=500,
            detail="Erreur PostgreSQL lors de l'analyse des inscriptions."
        ) from erreur

    finally:

        # Vérifie que la connexion PostgreSQL existe.
        if conn is not None:

            # Ferme la connexion après le traitement.
            close_connection(conn)

# Définit la route GET /statistics/presences.
@router.get("/presences")

# Déclare la fonction qui calcule les statistiques de présence.
def statistiques_presences():

    # Initialise la connexion à PostgreSQL.
    conn = None

    # Définit la requête SQL commune pour analyser chaque session.
    cte_sessions = """
        WITH session_stats AS (
            SELECT

                -- Récupère l'identifiant de l'activité.
                a.id_activite,

                -- Récupère le titre de l'activité.
                a.titre AS activite,

                -- Récupère l'identifiant de la session.
                s.id_session,

                -- Récupère le libellé de la session.
                s.libelle AS session,

                -- Récupère la date de la session.
                s.date_session,

                -- Compte les participants inscrits à l'activité.
                COUNT(DISTINCT i.id_participant)::INTEGER
                    AS participants_inscrits,

                -- Compte les participants marqués présents.
                COUNT(DISTINCT CASE
                    WHEN p.statut_presence = 'PRESENT'
                    THEN i.id_participant
                END)::INTEGER AS total_presents,

                -- Compte les participants marqués absents.
                COUNT(DISTINCT CASE
                    WHEN p.statut_presence = 'ABSENT'
                    THEN i.id_participant
                END)::INTEGER AS total_absents

            -- Utilise la table sessions comme table principale.
            FROM public.sessions AS s

            -- Associe chaque session à son activité.
            INNER JOIN public.activite AS a
                ON a.id_activite = s.id_activite

            -- Récupère les inscriptions de l'activité.
            LEFT JOIN public.inscription AS i
                ON i.id_activite = a.id_activite

            -- Associe chaque présence au participant inscrit et à la session.
            LEFT JOIN public.presence AS p
                ON p.id_session = s.id_session
                AND p.id_participant = i.id_participant

            -- Regroupe les résultats par activité et par session.
            GROUP BY
                a.id_activite,
                a.titre,
                s.id_session,
                s.libelle,
                s.date_session
        )
    """

    try:

        # Ouvre une connexion à la base youth_computing.
        conn = get_connection()

        # Crée un curseur pour exécuter les requêtes SQL.
        with conn.cursor() as cursor:

            # Prépare la requête pour les indicateurs généraux.
            requete_resume = cte_sessions + """
                SELECT

                    -- Compte les activités enregistrées.
                    (SELECT COUNT(*) FROM public.activite)::INTEGER
                        AS total_activites,

                    -- Compte les sessions enregistrées.
                    COUNT(*)::INTEGER AS total_sessions,

                    -- Compte les participants distincts inscrits.
                    (SELECT COUNT(DISTINCT id_participant)
                     FROM public.inscription)::INTEGER
                        AS participants_inscrits_uniques,

                    -- Additionne les participations attendues par session.
                    COALESCE(SUM(participants_inscrits), 0)::INTEGER
                        AS participants_attendus_sessions,

                    -- Additionne les présences enregistrées.
                    COALESCE(SUM(total_presents), 0)::INTEGER
                        AS total_presents,

                    -- Additionne les absences enregistrées.
                    COALESCE(SUM(total_absents), 0)::INTEGER
                        AS total_absents,

                    -- Calcule les participants sans pointage.
                    COALESCE(
                        SUM(
                            participants_inscrits
                            - total_presents
                            - total_absents
                        ),
                        0
                    )::INTEGER AS total_non_pointes

                -- Utilise les statistiques calculées par session.
                FROM session_stats;
            """

            # Exécute la requête des indicateurs généraux.
            cursor.execute(requete_resume)

            # Récupère les indicateurs généraux.
            resume = cursor.fetchone()

            # Prépare la requête de statistiques détaillées par session.
            requete_sessions = cte_sessions + """
                SELECT

                    -- Identifiant de l'activité.
                    id_activite,

                    -- Titre de l'activité.
                    activite,

                    -- Identifiant de la session.
                    id_session,

                    -- Libellé de la session.
                    session,

                    -- Date de la session.
                    date_session,

                    -- Nombre de participants inscrits.
                    participants_inscrits,

                    -- Nombre de participants présents.
                    total_presents,

                    -- Nombre de participants absents.
                    total_absents,

                    -- Nombre de participants non pointés.
                    (
                        participants_inscrits
                        - total_presents
                        - total_absents
                    )::INTEGER AS total_non_pointes

                -- Lit les statistiques de chaque session.
                FROM session_stats

                -- Classe les sessions par activité puis par date.
                ORDER BY id_activite, date_session, id_session;
            """

            # Exécute la requête des statistiques par session.
            cursor.execute(requete_sessions)

            # Récupère toutes les statistiques des sessions.
            lignes_sessions = cursor.fetchall()

            # Prépare les statistiques d'inscription et de présence par activité.
            requete_activites = cte_sessions + """
                , activity_registered AS (

                    -- Calcule les participants inscrits à chaque activité.
                    SELECT
                        a.id_activite,
                        a.titre,
                        COUNT(DISTINCT i.id_participant)::INTEGER
                            AS participants_inscrits

                    -- Analyse toutes les activités.
                    FROM public.activite AS a

                    -- Récupère les inscriptions de chaque activité.
                    LEFT JOIN public.inscription AS i
                        ON i.id_activite = a.id_activite

                    -- Regroupe les résultats par activité.
                    GROUP BY a.id_activite, a.titre
                ),

                activity_attendance AS (

                    -- Additionne les résultats de toutes les sessions.
                    SELECT
                        id_activite,
                        COUNT(*)::INTEGER AS total_sessions,

                        -- Additionne les participants attendus aux sessions.
                        COALESCE(SUM(participants_inscrits), 0)::INTEGER
                            AS participants_attendus,

                        -- Additionne les présences.
                        COALESCE(SUM(total_presents), 0)::INTEGER
                            AS total_presents,

                        -- Additionne les absences.
                        COALESCE(SUM(total_absents), 0)::INTEGER
                            AS total_absents,

                        -- Calcule les participants non pointés.
                        COALESCE(
                            SUM(
                                participants_inscrits
                                - total_presents
                                - total_absents
                            ),
                            0
                        )::INTEGER AS total_non_pointes

                    -- Utilise les statistiques des sessions.
                    FROM session_stats

                    -- Regroupe les résultats par activité.
                    GROUP BY id_activite
                )

                -- Assemble les inscriptions et les présences de chaque activité.
                SELECT

                    -- Identifiant de l'activité.
                    ar.id_activite,

                    -- Titre de l'activité.
                    ar.titre,

                    -- Nombre de participants distincts inscrits.
                    ar.participants_inscrits,

                    -- Nombre de sessions organisées.
                    COALESCE(aa.total_sessions, 0)::INTEGER,

                    -- Nombre total de participations attendues.
                    COALESCE(aa.participants_attendus, 0)::INTEGER,

                    -- Nombre total de présents.
                    COALESCE(aa.total_presents, 0)::INTEGER,

                    -- Nombre total d'absents.
                    COALESCE(aa.total_absents, 0)::INTEGER,

                    -- Nombre total de non pointés.
                    COALESCE(aa.total_non_pointes, 0)::INTEGER

                -- Conserve toutes les activités, même sans session.
                FROM activity_registered AS ar

                -- Associe les résultats de présence aux activités.
                LEFT JOIN activity_attendance AS aa
                    ON aa.id_activite = ar.id_activite

                -- Classe les activités par identifiant.
                ORDER BY ar.id_activite;
            """

            # Exécute la requête des statistiques par activité.
            cursor.execute(requete_activites)

            # Récupère toutes les statistiques des activités.
            lignes_activites = cursor.fetchall()

            # Compte les présences enregistrées pour des participants non inscrits.
            requete_hors_inscription = """
                SELECT COUNT(*)::INTEGER

                -- Analyse les enregistrements de présence.
                FROM public.presence AS p

                -- Récupère l'activité par l'intermédiaire de la session.
                INNER JOIN public.sessions AS s
                    ON s.id_session = p.id_session

                -- Vérifie qu'aucune inscription correspondante n'existe.
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM public.inscription AS i
                    WHERE i.id_activite = s.id_activite
                      AND i.id_participant = p.id_participant
                );
            """

            # Exécute la requête de contrôle des présences hors inscription.
            cursor.execute(requete_hors_inscription)

            # Récupère le nombre de présences hors inscription.
            hors_inscription = cursor.fetchone()[0]

        # Récupère le nombre total de sessions.
        total_sessions = int(resume[1])

        # Récupère le nombre total de participants attendus aux sessions.
        participants_attendus = int(resume[3])

        # Récupère le nombre total de participants présents.
        total_presents = int(resume[4])

        # Récupère le nombre total de participants absents.
        total_absents = int(resume[5])

        # Calcule le taux de participation sur les participants attendus.
        if participants_attendus > 0:

            # Calcule le pourcentage de présences effectives.
            taux_participation = (
                total_presents / participants_attendus
            ) * 100

            # Calcule le taux de pointage des présences et absences.
            taux_pointage = (
                (total_presents + total_absents)
                / participants_attendus
            ) * 100

        else:

            # Retourne zéro si aucun participant n'est attendu.
            taux_participation = 0

            # Retourne zéro si aucun participant n'est attendu.
            taux_pointage = 0

        # Prépare la liste des statistiques détaillées par session.
        statistiques_sessions = []

        # Parcourt les lignes retournées par PostgreSQL.
        for ligne in lignes_sessions:

            # Récupère le nombre de participants attendus à cette session.
            attendus = int(ligne[5])

            # Récupère le nombre de présents à cette session.
            presents = int(ligne[6])

            # Récupère le nombre d'absents à cette session.
            absents = int(ligne[7])

            # Calcule le taux de participation de cette session.
            taux = (
                round((presents / attendus) * 100, 2)
                if attendus > 0
                else 0
            )

            # Calcule le taux de pointage de cette session.
            taux_pointage_session = (
                round(((presents + absents) / attendus) * 100, 2)
                if attendus > 0
                else 0
            )

            # Ajoute les résultats de la session à la liste.
            statistiques_sessions.append({

                # Identifiant de l'activité.
                "id_activite": int(ligne[0]),

                # Titre de l'activité.
                "activite": ligne[1],

                # Identifiant de la session.
                "id_session": int(ligne[2]),

                # Libellé de la session.
                "session": ligne[3],

                # Date de la session.
                "date_session": (
                    ligne[4].isoformat()
                    if ligne[4] is not None
                    else None
                ),

                # Nombre de participants inscrits.
                "participants_inscrits": attendus,

                # Nombre de participants présents.
                "presents": presents,

                # Nombre de participants absents.
                "absents": absents,

                # Nombre de participants sans pointage.
                "non_pointes": int(ligne[8]),

                # Taux de participation de la session.
                "taux_participation_pct": taux,

                # Taux de pointage de la session.
                "taux_pointage_pct": taux_pointage_session
            })

        # Prépare la liste des statistiques par activité.
        statistiques_activites = []

        # Parcourt les statistiques des activités.
        for ligne in lignes_activites:

            # Récupère le nombre de participations attendues.
            attendus = int(ligne[4])

            # Récupère le nombre de présents.
            presents = int(ligne[5])

            # Récupère le nombre d'absents.
            absents = int(ligne[6])

            # Calcule le taux de participation de l'activité.
            taux = (
                round((presents / attendus) * 100, 2)
                if attendus > 0
                else 0
            )

            # Calcule le taux de pointage de l'activité.
            taux_pointage_activite = (
                round(((presents + absents) / attendus) * 100, 2)
                if attendus > 0
                else 0
            )

            # Ajoute les résultats de l'activité à la liste.
            statistiques_activites.append({

                # Identifiant de l'activité.
                "id_activite": int(ligne[0]),

                # Titre de l'activité.
                "titre": ligne[1],

                # Nombre de participants distincts inscrits.
                "participants_inscrits": int(ligne[2]),

                # Nombre total de sessions.
                "total_sessions": int(ligne[3]),

                # Nombre total de participations attendues.
                "participants_attendus_sessions": attendus,

                # Nombre total de présents.
                "presents": presents,

                # Nombre total d'absents.
                "absents": absents,

                # Nombre total de participants non pointés.
                "non_pointes": int(ligne[7]),

                # Taux de participation de l'activité.
                "taux_participation_pct": taux,

                # Taux de pointage de l'activité.
                "taux_pointage_pct": taux_pointage_activite
            })

        # Prépare les indicateurs généraux de présence.
        indicateurs = {

            # Nombre total d'activités.
            "total_activites": int(resume[0]),

            # Nombre total de sessions.
            "total_sessions": total_sessions,

            # Nombre de participants distincts inscrits.
            "participants_inscrits_uniques": int(resume[2]),

            # Nombre de participations attendues sur toutes les sessions.
            "participants_attendus_sessions": participants_attendus,

            # Nombre total de présents.
            "total_presents": total_presents,

            # Nombre total d'absents.
            "total_absents": total_absents,

            # Nombre total de participants non pointés.
            "total_non_pointes": int(resume[6]),

            # Taux global de participation.
            "taux_participation_pct": round(taux_participation, 2),

            # Taux global de pointage.
            "taux_pointage_pct": round(taux_pointage, 2),

            # Présences qui ne correspondent à aucune inscription.
            "presences_hors_inscription": int(hors_inscription),

            # Statistiques détaillées par activité.
            "par_activite": statistiques_activites,

            # Statistiques détaillées par session.
            "par_session": statistiques_sessions
        }

        # Retourne les statistiques au format JSON.
        return {
            "message": "Statistiques de présence récupérées avec succès.",
            "indicateurs": indicateurs
        }

    # Capture les erreurs provenant de PostgreSQL.
    except PostgreSQLError as erreur:

        # Retourne une erreur HTTP 500 sans exposer les détails sensibles.
        raise HTTPException(
            status_code=500,
            detail="Erreur PostgreSQL lors de l'analyse des présences."
        ) from erreur

    finally:

        # Vérifie que la connexion PostgreSQL a été ouverte.
        if conn is not None:

            # Ferme la connexion après le traitement.
            close_connection(conn)

# Définit la route GET /statistics/geographie.
@router.get("/geographie")

# Déclare la fonction qui analyse la répartition géographique des participants.
def statistiques_geographie():

    # Initialise la connexion à PostgreSQL.
    conn = None

    # Prépare la requête SQL pour calculer les indicateurs généraux.
    requete_resume = """
        SELECT

            -- Compte tous les participants enregistrés.
            COUNT(*)::INTEGER AS total_participants,

            -- Compte les régions différentes renseignées.
            COUNT(DISTINCT NULLIF(BTRIM(region), ''))::INTEGER
                AS total_regions,

            -- Compte les villes différentes renseignées.
            COUNT(DISTINCT NULLIF(BTRIM(ville), ''))::INTEGER
                AS total_villes

        -- Lit les participants dans PostgreSQL.
        FROM public.participant;
    """

    # Prépare la requête SQL pour la répartition par région.
    requete_regions = """
        SELECT

            -- Remplace les régions manquantes ou vides.
            COALESCE(
                NULLIF(BTRIM(region), ''),
                'Non renseigné'
            ) AS categorie,

            -- Compte les participants de chaque région.
            COUNT(*)::INTEGER AS nombre

        -- Lit les données des participants.
        FROM public.participant

        -- Regroupe les participants par région.
        GROUP BY 1

        -- Classe les régions de la plus représentée à la moins représentée.
        ORDER BY nombre DESC, categorie ASC;
    """

    # Prépare la requête SQL pour la répartition par ville.
    requete_villes = """
        SELECT

            -- Remplace les villes manquantes ou vides.
            COALESCE(
                NULLIF(BTRIM(ville), ''),
                'Non renseigné'
            ) AS categorie,

            -- Compte les participants de chaque ville.
            COUNT(*)::INTEGER AS nombre

        -- Lit les données des participants.
        FROM public.participant

        -- Regroupe les participants par ville.
        GROUP BY 1

        -- Classe les villes de la plus représentée à la moins représentée.
        ORDER BY nombre DESC, categorie ASC;
    """

    try:

        # Ouvre une connexion à la base youth_computing.
        conn = get_connection()

        # Crée un curseur pour exécuter les requêtes SQL.
        with conn.cursor() as cursor:

            # Exécute la requête des indicateurs généraux.
            cursor.execute(requete_resume)

            # Récupère les indicateurs généraux.
            resume = cursor.fetchone()

            # Exécute la requête de répartition par région.
            cursor.execute(requete_regions)

            # Récupère les résultats par région.
            resultats_regions = cursor.fetchall()

            # Exécute la requête de répartition par ville.
            cursor.execute(requete_villes)

            # Récupère les résultats par ville.
            resultats_villes = cursor.fetchall()

        # Récupère le nombre total de participants.
        total_participants = int(resume[0])

        # Prépare la liste des résultats géographiques par région.
        repartition_regions = []

        # Parcourt les résultats retournés par PostgreSQL.
        for categorie, nombre in resultats_regions:

            # Convertit le nombre de participants en entier.
            nombre = int(nombre)

            # Calcule la proportion de la région dans la base.
            pourcentage = (
                round((nombre / total_participants) * 100, 2)
                if total_participants > 0
                else 0
            )

            # Ajoute les informations de la région à la liste.
            repartition_regions.append({

                # Nom de la région.
                "region": str(categorie),

                # Nombre de participants dans cette région.
                "nombre_participants": nombre,

                # Pourcentage de participants dans cette région.
                "pourcentage": pourcentage
            })

        # Prépare la liste des résultats géographiques par ville.
        repartition_villes = []

        # Parcourt les résultats retournés par PostgreSQL.
        for categorie, nombre in resultats_villes:

            # Convertit le nombre de participants en entier.
            nombre = int(nombre)

            # Calcule la proportion de la ville dans la base.
            pourcentage = (
                round((nombre / total_participants) * 100, 2)
                if total_participants > 0
                else 0
            )

            # Ajoute les informations de la ville à la liste.
            repartition_villes.append({

                # Nom de la ville.
                "ville": str(categorie),

                # Nombre de participants dans cette ville.
                "nombre_participants": nombre,

                # Pourcentage de participants dans cette ville.
                "pourcentage": pourcentage
            })

        # Prépare les indicateurs géographiques.
        indicateurs = {

            # Nombre total de participants.
            "total_participants": total_participants,

            # Nombre de régions différentes renseignées.
            "total_regions": int(resume[1]),

            # Nombre de villes différentes renseignées.
            "total_villes": int(resume[2]),

            # Répartition des participants par région.
            "repartition_regions": repartition_regions,

            # Répartition des participants par ville.
            "repartition_villes": repartition_villes
        }

        # Retourne les statistiques géographiques au format JSON.
        return {
            "message": "Statistiques géographiques récupérées avec succès.",
            "indicateurs": indicateurs
        }

    # Capture les erreurs provenant de PostgreSQL.
    except PostgreSQLError as erreur:

        # Retourne une erreur HTTP 500 en cas de problème SQL.
        raise HTTPException(
            status_code=500,
            detail="Erreur PostgreSQL lors de l'analyse géographique."
        ) from erreur

    finally:

        # Vérifie que la connexion PostgreSQL a été ouverte.
        if conn is not None:

            # Ferme la connexion après le traitement.
            close_connection(conn)

# Définit la route GET /statistics/evolution-annuelle.
@router.get("/evolution-annuelle")

# Déclare la fonction qui calcule l'évolution annuelle de Youth Computing.
def statistiques_evolution_annuelle():

    # Initialise la connexion PostgreSQL.
    conn = None

    # Prépare la requête SQL qui calcule les indicateurs annuels.
    requete = """
        WITH activites_annee AS (

            -- Compte les activités selon leur année de début.
            SELECT
                EXTRACT(YEAR FROM date_debut)::INTEGER AS annee,
                COUNT(*)::INTEGER AS total_activites

            -- Lit les activités enregistrées.
            FROM public.activite

            -- Ignore les dates de début manquantes.
            WHERE date_debut IS NOT NULL

            -- Regroupe les activités par année.
            GROUP BY 1
        ),

        inscriptions_annee AS (

            -- Calcule les inscriptions et participants uniques par année.
            SELECT
                EXTRACT(YEAR FROM date_inscription)::INTEGER AS annee,
                COUNT(*)::INTEGER AS total_inscriptions,
                COUNT(DISTINCT id_participant)::INTEGER
                    AS participants_uniques

            -- Lit les inscriptions enregistrées.
            FROM public.inscription

            -- Ignore les dates d'inscription manquantes.
            WHERE date_inscription IS NOT NULL

            -- Regroupe les inscriptions par année.
            GROUP BY 1
        ),

        premieres_inscriptions AS (

            -- Détermine la première inscription connue de chaque participant.
            SELECT
                id_participant,
                MIN(date_inscription) AS premiere_date

            -- Lit les inscriptions.
            FROM public.inscription

            -- Ignore les dates d'inscription manquantes.
            WHERE date_inscription IS NOT NULL

            -- Regroupe les inscriptions par participant.
            GROUP BY id_participant
        ),

        nouveaux_participants_annee AS (

            -- Compte les nouveaux participants selon leur première inscription.
            SELECT
                EXTRACT(YEAR FROM premiere_date)::INTEGER AS annee,
                COUNT(*)::INTEGER AS nouveaux_participants

            -- Utilise les premières inscriptions calculées.
            FROM premieres_inscriptions

            -- Regroupe les nouveaux participants par année.
            GROUP BY 1
        ),

        sessions_annee AS (

            -- Compte les sessions organisées selon leur date.
            SELECT
                EXTRACT(YEAR FROM date_session)::INTEGER AS annee,
                COUNT(*)::INTEGER AS total_sessions

            -- Lit les sessions enregistrées.
            FROM public.sessions

            -- Ignore les dates de session manquantes.
            WHERE date_session IS NOT NULL

            -- Regroupe les sessions par année.
            GROUP BY 1
        ),

        presences_annee AS (

            -- Calcule les présences et absences selon l'année de la session.
            SELECT
                EXTRACT(YEAR FROM s.date_session)::INTEGER AS annee,

                -- Compte les enregistrements marqués PRESENT.
                COUNT(p.id_presence) FILTER (
                    WHERE p.statut_presence = 'PRESENT'
                )::INTEGER AS total_presents,

                -- Compte les enregistrements marqués ABSENT.
                COUNT(p.id_presence) FILTER (
                    WHERE p.statut_presence = 'ABSENT'
                )::INTEGER AS total_absents

            -- Utilise les sessions comme référence temporelle.
            FROM public.sessions AS s

            -- Associe les présences aux sessions correspondantes.
            LEFT JOIN public.presence AS p
                ON p.id_session = s.id_session

            -- Ignore les sessions sans date.
            WHERE s.date_session IS NOT NULL

            -- Regroupe les résultats par année.
            GROUP BY 1
        ),

        annees AS (

            -- Récupère les années présentes dans les activités.
            SELECT annee FROM activites_annee

            UNION

            -- Ajoute les années présentes dans les inscriptions.
            SELECT annee FROM inscriptions_annee

            UNION

            -- Ajoute les années présentes dans les premières inscriptions.
            SELECT annee FROM nouveaux_participants_annee

            UNION

            -- Ajoute les années présentes dans les sessions.
            SELECT annee FROM sessions_annee

            UNION

            -- Ajoute les années présentes dans les présences.
            SELECT annee FROM presences_annee
        )

        -- Assemble tous les indicateurs annuels.
        SELECT

            -- Année analysée.
            a.annee,

            -- Nombre total d'activités.
            COALESCE(ac.total_activites, 0) AS total_activites,

            -- Nombre total d'inscriptions.
            COALESCE(i.total_inscriptions, 0) AS total_inscriptions,

            -- Nombre de participants uniques inscrits.
            COALESCE(i.participants_uniques, 0) AS participants_uniques,

            -- Nombre de nouveaux participants.
            COALESCE(n.nouveaux_participants, 0) AS nouveaux_participants,

            -- Nombre total de sessions.
            COALESCE(s.total_sessions, 0) AS total_sessions,

            -- Nombre total de présents.
            COALESCE(p.total_presents, 0) AS total_presents,

            -- Nombre total d'absents.
            COALESCE(p.total_absents, 0) AS total_absents

        -- Utilise toutes les années identifiées.
        FROM annees AS a

        -- Associe les statistiques d'activités.
        LEFT JOIN activites_annee AS ac
            ON ac.annee = a.annee

        -- Associe les statistiques d'inscriptions.
        LEFT JOIN inscriptions_annee AS i
            ON i.annee = a.annee

        -- Associe les statistiques des nouveaux participants.
        LEFT JOIN nouveaux_participants_annee AS n
            ON n.annee = a.annee

        -- Associe les statistiques des sessions.
        LEFT JOIN sessions_annee AS s
            ON s.annee = a.annee

        -- Associe les statistiques de présence.
        LEFT JOIN presences_annee AS p
            ON p.annee = a.annee

        -- Classe les années dans l'ordre chronologique.
        ORDER BY a.annee ASC;
    """

    try:

        # Ouvre une connexion à la base youth_computing.
        conn = get_connection()

        # Crée un curseur pour exécuter la requête SQL.
        with conn.cursor() as cursor:

            # Exécute la requête statistique annuelle.
            cursor.execute(requete)

            # Récupère les résultats pour toutes les années.
            resultats = cursor.fetchall()

        # Prépare la liste des statistiques annuelles.
        evolution = []

        # Parcourt les résultats retournés par PostgreSQL.
        for ligne in resultats:

            # Récupère le nombre de présences pour cette année.
            presents = int(ligne[6])

            # Récupère le nombre d'absences pour cette année.
            absents = int(ligne[7])

            # Calcule le taux parmi les pointages enregistrés.
            total_pointages = presents + absents

            # Calcule le pourcentage de présence si des pointages existent.
            taux_presence = (
                round((presents / total_pointages) * 100, 2)
                if total_pointages > 0
                else 0
            )

            # Ajoute les résultats de l'année à la liste.
            evolution.append({

                # Année analysée.
                "annee": int(ligne[0]),

                # Nombre d'activités.
                "total_activites": int(ligne[1]),

                # Nombre d'inscriptions.
                "total_inscriptions": int(ligne[2]),

                # Nombre de participants uniques.
                "participants_uniques": int(ligne[3]),

                # Nombre de nouveaux participants.
                "nouveaux_participants": int(ligne[4]),

                # Nombre de sessions.
                "total_sessions": int(ligne[5]),

                # Nombre de présents.
                "total_presents": presents,

                # Nombre d'absents.
                "total_absents": absents,

                # Taux de présence parmi les pointages enregistrés.
                "taux_presence_pct": taux_presence
            })

        # Retourne les statistiques annuelles au format JSON.
        return {
            "message": "Évolution annuelle récupérée avec succès.",
            "nombre_annees": len(evolution),
            "evolution": evolution
        }

    # Capture les erreurs provenant de PostgreSQL.
    except PostgreSQLError as erreur:

        # Retourne une erreur HTTP 500 en cas de problème SQL.
        raise HTTPException(
            status_code=500,
            detail="Erreur PostgreSQL lors du calcul de l'évolution annuelle."
        ) from erreur

    finally:

        # Vérifie que la connexion PostgreSQL a été ouverte.
        if conn is not None:

            # Ferme la connexion après le traitement.
            close_connection(conn)
