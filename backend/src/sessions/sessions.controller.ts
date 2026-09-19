// Importe les décorateurs HTTP nécessaires depuis NestJS.
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

// Importe l'API Temporal pour gérer les dates et heures PostgreSQL.
import { Temporal } from '@js-temporal/polyfill';

// Importe notre service Prisma pour communiquer avec PostgreSQL.
import { PrismaService } from '../prisma/prisma.service.js';

// Définit le préfixe de toutes les routes de ce contrôleur.
@Controller('sessions')

// Déclare le contrôleur responsable de la gestion des sessions.
export class SessionsController {

  // Constructeur du contrôleur.
  constructor(
    // Injecte PrismaService pour accéder à PostgreSQL.
    private readonly prisma: PrismaService,
  ) {}

  // Définit la route GET /sessions.
  @Get()

  // Méthode permettant de récupérer toutes les sessions.
  async findAll() {

    // Récupère toutes les sessions depuis la table sessions.
    return this.prisma.client.orm.public.Sessions.all();
  }

  // Définit la route GET /sessions/:id.
  @Get(':id')

  // Méthode permettant de récupérer une seule session.
  async findOne(
    // Récupère l'identifiant de la session depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu sous forme de texte en nombre entier.
    const idSession = Number(id);

    // Recherche la session correspondant à l'identifiant demandé.
    const sessions = await this.prisma.client.orm.public.Sessions
      .where({
        idSession,
      })
      .all();

    // Retourne la première session trouvée.
    return sessions[0];
  }

  // Définit la route POST /sessions.
  @Post()

  // Méthode permettant de créer une nouvelle session.
  async create(
    // Récupère les données envoyées dans le corps de la requête.
    @Body()
    // Utilise automatiquement le type attendu par Prisma 8 pour la création.
    data: Parameters<
      typeof this.prisma.client.orm.public.Sessions.create
    >[0],
  ) {

    // Vérifie si une date de session est présente dans les données reçues.
    if ('date_session' in data && data.date_session) {

      // Convertit la date reçue en objet Temporal.PlainDate.
      data.date_session = Temporal.PlainDate.from(
        String(data.date_session),
      ) as typeof data.date_session;
    }

    // Vérifie si une heure de début est présente dans les données reçues.
    if ('heure_debut' in data && data.heure_debut) {

      // Convertit l'heure reçue en objet Temporal.PlainTime.
      data.heure_debut = Temporal.PlainTime.from(
        String(data.heure_debut),
      ) as typeof data.heure_debut;
    }

    // Vérifie si une heure de fin est présente dans les données reçues.
    if ('heure_fin' in data && data.heure_fin) {

      // Convertit l'heure reçue en objet Temporal.PlainTime.
      data.heure_fin = Temporal.PlainTime.from(
        String(data.heure_fin),
      ) as typeof data.heure_fin;
    }

    // Demande à Prisma 8 de créer la session dans PostgreSQL.
    return this.prisma.client.orm.public.Sessions.create(
      data,
    );
  }

  // Définit la route PUT /sessions/:id.
  @Put(':id')

  // Méthode permettant de modifier une session existante.
  async update(
    // Récupère l'identifiant de la session depuis l'URL.
    @Param('id') id: string,

    // Récupère les nouvelles données envoyées dans le corps de la requête.
    @Body() data: Record<string, unknown>,
  ) {

    // Convertit l'identifiant reçu sous forme de texte en nombre entier.
    const idSession = Number(id);

    // Vérifie si une date de session est présente.
    if (data['date_session']) {

      // Convertit la date en objet Temporal.PlainDate.
      data['date_session'] = Temporal.PlainDate.from(
        String(data['date_session']),
      );
    }

    // Vérifie si une heure de début est présente.
    if (data['heure_debut']) {

      // Convertit l'heure en objet Temporal.PlainTime.
      data['heure_debut'] = Temporal.PlainTime.from(
        String(data['heure_debut']),
      );
    }

    // Vérifie si une heure de fin est présente.
    if (data['heure_fin']) {

      // Convertit l'heure en objet Temporal.PlainTime.
      data['heure_fin'] = Temporal.PlainTime.from(
        String(data['heure_fin']),
      );
    }

    // Recherche la session par son identifiant et applique les modifications.
    return this.prisma.client.orm.public.Sessions
      .where({
        idSession,
      })
      .update(data);
  }

  // Définit la route DELETE /sessions/:id.
  @Delete(':id')

  // Méthode permettant de supprimer une session.
  async remove(
    // Récupère l'identifiant de la session dans l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu sous forme de texte en nombre entier.
    const idSession = Number(id);

    // Recherche la session par son identifiant puis la supprime.
    return this.prisma.client.orm.public.Sessions
      .where({
        idSession,
      })
      .delete();
  }
}