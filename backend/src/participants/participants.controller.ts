/*// Importe les décorateurs nécessaires depuis NestJS.
import { Body, Controller, Get, Post } from '@nestjs/common';

// Importe l'API Temporal utilisée par Prisma 8 pour les champs DATE.
import { Temporal } from '@js-temporal/polyfill';

// Importe le service Prisma qui permet d'accéder à PostgreSQL.
import { PrismaService } from '../prisma/prisma.service.js';

// Définit le préfixe des routes de ce contrôleur.
@Controller('participants')

// Déclare le contrôleur responsable des participants.
export class ParticipantsController {

  // Constructeur du contrôleur.
  // NestJS injecte automatiquement PrismaService.
  constructor(
    // Rend Prisma disponible dans les méthodes du contrôleur.
    private readonly prisma: PrismaService,
  ) {}

  // Définit la route GET /participants.
  @Get()

  // Méthode permettant de récupérer tous les participants.
  async findAll() {

    // Récupère tous les participants dans PostgreSQL.
    return this.prisma.client.orm.public.Participant.all();
  }

  // Définit la route POST /participants.
  @Post()

  // Méthode permettant de créer un participant.
  async create(

    // Récupère les données envoyées dans le corps de la requête HTTP.
    @Body()

    // Utilise le type généré automatiquement par Prisma 8.
    data: Parameters<

      // Récupère le type du premier paramètre de la méthode create().
      typeof this.prisma.client.orm.public.Participant.create

    // Termine la récupération du type attendu par create().
    >[0],

  ) {

    // Vérifie si une date de naissance a été envoyée.
    if ('date_naissance' in data && data.date_naissance) {

      // Convertit la chaîne "2000-05-15" en Temporal.PlainDate.
      data.date_naissance = Temporal.PlainDate.from(
        // Transforme la valeur reçue en chaîne de caractères.
        String(data.date_naissance),
      ) as typeof data.date_naissance;
    }

    // Crée le participant dans PostgreSQL.
    return this.prisma.client.orm.public.Participant.create(

      // Envoie les données transformées à Prisma 8.
      data,
    );
  }
}*/

// Importe les décorateurs HTTP nécessaires depuis NestJS.
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

// Importe l'API Temporal utilisée pour gérer les dates PostgreSQL.
import { Temporal } from '@js-temporal/polyfill';

// Importe notre service Prisma pour communiquer avec PostgreSQL.
import { PrismaService } from '../prisma/prisma.service.js';

// Définit le préfixe de toutes les routes de ce contrôleur.
// Les routes commenceront donc par /participants.
@Controller('participants')

// Déclare le contrôleur responsable de la gestion des participants.
export class ParticipantsController {

  // Constructeur du contrôleur.
  constructor(

    // Injecte PrismaService afin de pouvoir interroger PostgreSQL.
    private readonly prisma: PrismaService,

  ) {}

  // Définit la route GET /participants.
  @Get()

  // Méthode permettant de récupérer tous les participants.
  async findAll() {

    // Interroge le modèle Participant de Prisma 8
    // et récupère tous les enregistrements.
    return this.prisma.client.orm.public.Participant.all();
  }

  // Définit la route GET /participants/:id.
  // Exemple : GET /participants/1.
  @Get(':id')

  // Méthode permettant de récupérer un seul participant.
  async findOne(

    // Récupère la valeur du paramètre :id dans l'URL.
    @Param('id') id: string,

  ) {

    // Convertit l'identifiant reçu sous forme de texte
    // en nombre entier pour pouvoir l'utiliser avec PostgreSQL.
    const idParticipant = Number(id);

    // Recherche les participants dont l'identifiant correspond à celui demandé.
    const participants = await this.prisma.client.orm.public.Participant
      .where({
        idParticipant,
      })
    .all();

     // Affiche les méthodes disponibles sur la collection Participant.
    console.log(Object.keys(this.prisma.client.orm.public.Participant));

    // Affiche l'objet Participant complet afin d'identifier les opérations disponibles.
    console.dir(this.prisma.client.orm.public.Participant, { depth: 2 });

    // Retourne le premier participant trouvé.
    // Si aucun participant ne correspond, la valeur retournée sera undefined.
    return participants[0];
  }
    // Définit la route PUT /participants/:id.
  @Put(':id')

  // Méthode permettant de modifier un participant existant.
  async update(

    // Récupère l'identifiant du participant depuis l'URL.
    @Param('id') id: string,

    // Récupère les nouvelles données envoyées dans le corps de la requête.
    @Body() data: Record<string, unknown>,

  ) {

    // Convertit l'identifiant reçu sous forme de texte en nombre entier.
    const idParticipant = Number(id);

    // Vérifie si une date de naissance est présente dans les données reçues.
    if (data['date_naissance']) {

      // Convertit la date reçue sous forme de texte en Temporal.PlainDate.
      data['date_naissance'] = Temporal.PlainDate.from(
        String(data['date_naissance']),
      );
    }

    // Recherche le participant avec son identifiant puis applique les nouvelles données.
    return this.prisma.client.orm.public.Participant
      .where({
        idParticipant,
      })
      .update(data);
  }

  // Définit la route DELETE /participants/:id.
  @Delete(':id')

  // Méthode permettant de supprimer un participant.
  async remove(

    // Récupère l'identifiant du participant dans l'URL.
    @Param('id') id: string,

  ) {

    // Convertit l'identifiant reçu sous forme de texte en nombre entier.
    const idParticipant = Number(id);

    // Recherche le participant avec son identifiant puis le supprime.
    return this.prisma.client.orm.public.Participant
      .where({
        idParticipant,
      })
      .delete();
  }
  // Méthode permettant de créer un nouveau participant.
  async create(

    // Récupère les données envoyées dans le corps de la requête HTTP.
    @Body()

    // Utilise automatiquement le type attendu
    // par la méthode create() de Prisma 8.
    data: Parameters<

      // Récupère le type de la méthode create()
      // du modèle Participant.
      typeof this.prisma.client.orm.public.Participant.create

    // Récupère le type du premier paramètre de create().
    >[0],

  ) {

    // Vérifie si une date de naissance existe dans les données reçues.
    if ('date_naissance' in data && data.date_naissance) {

      // Transforme la chaîne "2000-05-15"
      // en objet Temporal.PlainDate.
      data.date_naissance = Temporal.PlainDate.from(

        // Convertit la valeur reçue en chaîne de caractères.
        String(data.date_naissance),

      // Adapte le résultat au type attendu par le contrat Prisma.
      ) as typeof data.date_naissance;
    }

    // Demande à Prisma 8 de créer le participant.
    return this.prisma.client.orm.public.Participant.create(

      // Transmet les données au modèle Participant.
      data,
    );
  }
}