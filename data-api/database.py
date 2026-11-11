
# Importe os pour lire les variables d'environnement.
import os

# Importe Path pour construire les chemins des fichiers.
from pathlib import Path

# Importe les fonctions nécessaires pour analyser une URL.
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

# Importe psycopg2 pour communiquer avec PostgreSQL.
import psycopg2

# Importe le type de connexion PostgreSQL.
from psycopg2.extensions import connection

# Importe load_dotenv pour charger les variables du fichier .env.
from dotenv import load_dotenv


# Récupère le chemin du dossier contenant database.py.
BASE_DIR = Path(__file__).resolve().parent

# Construit le chemin du fichier .env situé dans backend.
ENV_FILE = BASE_DIR.parent / "backend" / ".env"

# Charge les variables d'environnement depuis backend/.env.
load_dotenv(dotenv_path=ENV_FILE)

# Récupère l'adresse de connexion PostgreSQL.
DATABASE_URL = os.getenv("DATABASE_URL")


# Prépare l'URL PostgreSQL pour le pilote psycopg2.
def nettoyer_url_postgresql(url: str) -> str:

    # Sépare l'URL en protocole, serveur, base et paramètres.
    composants = urlsplit(url)

    # Récupère les paramètres de connexion de l'URL.
    parametres = parse_qsl(composants.query, keep_blank_values=True)

    # Supprime uniquement le paramètre schema utilisé par Prisma.
    parametres_nettoyes = [
        (cle, valeur)
        for cle, valeur in parametres
        if cle.lower() != "schema"
    ]

    # Reconstruit l'URL sans le paramètre schema.
    url_nettoyee = urlunsplit((
        composants.scheme,
        composants.netloc,
        composants.path,
        urlencode(parametres_nettoyes),
        composants.fragment
    ))

    # Retourne l'URL compatible avec psycopg2.
    return url_nettoyee


# Définit une fonction pour ouvrir une connexion PostgreSQL.
def get_connection() -> connection:

    # Vérifie que l'adresse PostgreSQL est disponible.
    if not DATABASE_URL:

        # Signale une erreur si DATABASE_URL est absente.
        raise RuntimeError(
            "DATABASE_URL est absente du fichier backend/.env"
        )

    # Nettoie l'URL pour supprimer les paramètres incompatibles.
    database_url = nettoyer_url_postgresql(DATABASE_URL)

    # Ouvre et retourne la connexion à PostgreSQL.
    return psycopg2.connect(database_url)


# Définit une fonction pour fermer une connexion PostgreSQL.
def close_connection(conn: connection) -> None:

    # Vérifie que la connexion existe et qu'elle est encore ouverte.
    if conn and not conn.closed:

        # Ferme la connexion PostgreSQL.
        conn.close()
