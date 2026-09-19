from fastapi import FastAPI

app = FastAPI(
    title="Youth Computing Data API",
    description="API dédiée aux statistiques et au traitement des données",
    version="1.0.0"
)


@app.get("/")
def accueil():
    return {
        "message": "API Youth Computing opérationnelle"
    }