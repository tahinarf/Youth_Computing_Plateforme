
# Importe FastAPI pour créer l'application.
from fastapi import FastAPI

# Importe le routeur des statistiques.
from statistics_routes import router as statistics_router

# Crée l'application principale FastAPI.
app = FastAPI(

    # Définit le nom de l'API.
    title="Youth Computing Data API",

    # Décrit le rôle du service statistique.
    description="API dédiée aux statistiques, aux analyses et au traitement des données de Youth Computing",

    # Définit la version actuelle de l'API.
    version="1.0.0"
)

# Enregistre les routes statistiques avec le préfixe /statistics.
app.include_router(
    statistics_router,
    prefix="/statistics",
    tags=["Statistiques"]
)


# Définit la route GET /.
@app.get("/")

# Déclare la fonction d'accueil.
def accueil():

    # Retourne un message confirmant le fonctionnement de l'API.
    return {
        "message": "API Youth Computing opérationnelle"
    }
