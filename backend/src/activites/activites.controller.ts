// Importe les décorateurs HTTP nécessaires depuis NestJS.
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

// Importe l'API Temporal pour gérer les dates et heures PostgreSQL.
import { Temporal } from '@js-temporal/polyfill';

// Importe notre service Prisma pour communiquer avec PostgreSQL.
import { PrismaService } from '../prisma/prisma.service.js';

// Définit le préfixe de toutes les routes de ce contrôleur.
@Controller('activites')

// Déclare le contrôleur responsable de la gestion des activités.
export class ActivitesController {

  // Constructeur du contrôleur.
  constructor(
    // Injecte PrismaService pour accéder à PostgreSQL.
    private readonly prisma: PrismaService,
  ) {}

  // Définit la route GET /activites.
  @Get()

  // Méthode permettant de récupérer toutes les activités.
  async findAll() {

    // Récupère toutes les activités depuis la table activite.
    return this.prisma.client.orm.public.Activite.all();
  }

  // Définit la route GET /activites/:id.
  @Get(':id')

  // Méthode permettant de récupérer une seule activité.
  async findOne(
    // Récupère l'identifiant de l'activité depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu sous forme de texte en nombre entier.
    const idActivite = Number(id);

    // Recherche l'activité correspondant à l'identifiant demandé.
    const activites = await this.prisma.client.orm.public.Activite
      .where({
        idActivite,
      })
      .all();

    // Retourne la première activité trouvée.
    return activites[0];
  }

  // Définit la route POST /activites.
  @Post()

  // Méthode permettant de créer une nouvelle activité.
  async create(
    // Récupère les données envoyées dans le corps de la requête.
    @Body()
    // Utilise automatiquement le type attendu par Prisma 8 pour la création.
    data: Parameters<
      typeof this.prisma.client.orm.public.Activite.create
    >[0],
  ) {

    // Vérifie si une date de début est présente dans les données reçues.
    if ('date_debut' in data && data.date_debut) {

      // Convertit la date reçue en objet Temporal.PlainDate.
      data.date_debut = Temporal.PlainDate.from(
        String(data.date_debut),
      ) as typeof data.date_debut;
    }

    // Vérifie si une date de fin est présente dans les données reçues.
    if ('date_fin' in data && data.date_fin) {

      // Convertit la date reçue en objet Temporal.PlainDate.
      data.date_fin = Temporal.PlainDate.from(
        String(data.date_fin),
      ) as typeof data.date_fin;
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

    // Demande à Prisma 8 de créer l'activité dans PostgreSQL.
    return this.prisma.client.orm.public.Activite.create(
      data,
    );
  }

  // Définit la route PUT /activites/:id.
  @Put(':id')

  // Méthode permettant de modifier une activité existante.
  async update(
    // Récupère l'identifiant de l'activité depuis l'URL.
    @Param('id') id: string,

    // Récupère les nouvelles données envoyées dans le corps de la requête.
    @Body() data: Record<string, unknown>,
  ) {

    // Convertit l'identifiant reçu sous forme de texte en nombre entier.
    const idActivite = Number(id);

    // Vérifie si une date de début est présente.
    if (data['date_debut']) {

      // Convertit la date en Temporal.PlainDate.
      data['date_debut'] = Temporal.PlainDate.from(
        String(data['date_debut']),
      );
    }

    // Vérifie si une date de fin est présente.
    if (data['date_fin']) {

      // Convertit la date en Temporal.PlainDate.
      data['date_fin'] = Temporal.PlainDate.from(
        String(data['date_fin']),
      );
    }

    // Vérifie si une heure de début est présente.
    if (data['heure_debut']) {

      // Convertit l'heure en Temporal.PlainTime.
      data['heure_debut'] = Temporal.PlainTime.from(
        String(data['heure_debut']),
      );
    }

    // Vérifie si une heure de fin est présente.
    if (data['heure_fin']) {

      // Convertit l'heure en Temporal.PlainTime.
      data['heure_fin'] = Temporal.PlainTime.from(
        String(data['heure_fin']),
      );
    }

    // Recherche l'activité par son identifiant et applique les modifications.
    return this.prisma.client.orm.public.Activite
      .where({
        idActivite,
      })
      .update(data);
  }

  // Définit la route DELETE /activites/:id.
  @Delete(':id')

  // Méthode permettant de supprimer une activité.
  async remove(
    // Récupère l'identifiant de l'activité depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu sous forme de texte en nombre entier.
    const idActivite = Number(id);

    // Recherche l'activité par son identifiant puis la supprime.
    return this.prisma.client.orm.public.Activite
      .where({
        idActivite,
      })
      .delete();
  }
}