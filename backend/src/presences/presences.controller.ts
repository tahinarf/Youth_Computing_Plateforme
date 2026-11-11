
// Importe les décorateurs HTTP et les exceptions nécessaires depuis NestJS.
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

// Importe PrismaService pour communiquer avec PostgreSQL.
import { PrismaService } from '../prisma/prisma.service.js';

// Définit le préfixe des routes de gestion des présences.
@Controller('presences')

// Déclare le contrôleur responsable de la gestion des présences.
export class PresencesController {

  // Constructeur du contrôleur.
  constructor(
    // Injecte PrismaService pour accéder aux tables PostgreSQL.
    private readonly prisma: PrismaService,
  ) {}

  // Définit la route GET /presences.
  @Get()

  // Récupère toutes les présences enregistrées.
  async findAll() {

    // Retourne toutes les présences depuis la table Presence.
    return this.prisma.client.orm.public.Presence.all();
  }

  // Définit la route GET /presences/:id.
  @Get(':id')

  // Récupère une présence à partir de son identifiant.
  async findOne(
    // Récupère l'identifiant de la présence depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idPresence = Number(id);

    // Vérifie que l'identifiant est un entier strictement positif.
    if (!Number.isInteger(idPresence) || idPresence <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est invalide.
      throw new BadRequestException('Identifiant présence invalide.');
    }

    // Recherche la présence correspondant à cet identifiant.
    const presences = await this.prisma.client.orm.public.Presence
      .where({ idPresence })
      .all();

    // Vérifie si la présence existe dans la base de données.
    if (presences.length === 0) {

      // Retourne une erreur HTTP 404 si la présence est introuvable.
      throw new NotFoundException('Présence introuvable.');
    }

    // Retourne la présence trouvée.
    return presences[0];
  }

  // Définit la route POST /presences.
  @Post()

  // Enregistre une nouvelle présence.
  async create(
    // Récupère les données envoyées dans le corps de la requête HTTP.
    @Body() body: Record<string, unknown>,
  ) {

    // Récupère l'identifiant du participant au format SQL ou camelCase.
    const idParticipant = Number(
      body['id_participant'] ?? body['idParticipant'],
    );

    // Récupère l'identifiant de la session au format SQL ou camelCase.
    const idSession = Number(
      body['id_session'] ?? body['idSession'],
    );

    // Vérifie que les deux identifiants sont des nombres entiers positifs.
    if (
      !Number.isInteger(idParticipant) ||
      idParticipant <= 0 ||
      !Number.isInteger(idSession) ||
      idSession <= 0
    ) {

      // Retourne une erreur HTTP 400 si les identifiants sont invalides.
      throw new BadRequestException(
        'Les identifiants du participant et de la session sont obligatoires.',
      );
    }

    // Vérifie que le participant existe dans PostgreSQL.
    const participants = await this.prisma.client.orm.public.Participant
      .where({ idParticipant })
      .all();

    // Vérifie si le participant a été trouvé.
    if (participants.length === 0) {

      // Retourne une erreur HTTP 404 si le participant est introuvable.
      throw new NotFoundException('Participant introuvable.');
    }

    // Vérifie que la session existe dans PostgreSQL.
    const sessions = await this.prisma.client.orm.public.Sessions
      .where({ idSession })
      .all();

    // Vérifie si la session a été trouvée.
    if (sessions.length === 0) {

      // Retourne une erreur HTTP 404 si la session est introuvable.
      throw new NotFoundException('Session introuvable.');
    }

    // Recherche une présence déjà enregistrée pour ce participant et cette session.
    const presenceExistante = await this.prisma.client.orm.public.Presence
      .where({
        idParticipant,
        idSession,
      })
      .all();

    // Vérifie si une présence identique existe déjà.
    if (presenceExistante.length > 0) {

      // Retourne une erreur HTTP 409 pour empêcher le doublon.
      throw new ConflictException(
        'Une présence existe déjà pour ce participant dans cette session.',
      );
    }

    // Prépare les données nécessaires à la création de la présence.
    const donneesPresence: Record<string, unknown> = {

      // Associe la présence au participant existant.
      idParticipant,

      // Associe la présence à la session existante.
      idSession,
    };

    // Récupère le statut envoyé par le client.
    const statutRecu =
      body['statut_presence'] ?? body['statutPresence'];

    // Vérifie si un statut a été fourni.
    if (statutRecu !== undefined) {

      // Vérifie que le statut reçu est une chaîne de caractères.
      if (typeof statutRecu !== 'string') {

        // Retourne une erreur HTTP 400 si le statut n'est pas un texte.
        throw new BadRequestException(
          'Le statut de présence doit être un texte.',
        );
      }

      // Nettoie le statut et le convertit en majuscules.
      const statutNormalise = statutRecu.trim().toUpperCase();

      // Vérifie que le statut correspond à une valeur autorisée.
      if (!['PRESENT', 'ABSENT'].includes(statutNormalise)) {

        // Retourne une erreur HTTP 400 si le statut est incorrect.
        throw new BadRequestException(
          'Le statut doit être PRESENT ou ABSENT.',
        );
      }

      // Ajoute le statut avec le nom de propriété attendu par Prisma 8.
      donneesPresence['statutPresence'] = statutNormalise as NonNullable<
        Parameters<
          typeof this.prisma.client.orm.public.Presence.create
        >[0]['statutPresence']
      >;
    }

    // Récupère l'observation éventuellement envoyée.
    const observation = body['observation'];

    // Vérifie si une observation a été fournie.
    if (observation !== undefined) {

      // Vérifie que l'observation est une chaîne ou null.
      if (
        typeof observation !== 'string' &&
        observation !== null
      ) {

        // Retourne une erreur HTTP 400 si l'observation est invalide.
        throw new BadRequestException(
          'L’observation doit être un texte.',
        );
      }

      // Ajoute l'observation aux données de création.
      donneesPresence['observation'] = observation;
    }

    // Crée la présence dans PostgreSQL avec Prisma 8.
    // La date et le statut ABSENT sont gérés par les valeurs par défaut de la base.
    return this.prisma.client.orm.public.Presence.create(
      donneesPresence as Parameters<
        typeof this.prisma.client.orm.public.Presence.create
      >[0],
    );
  }

  // Définit la route PUT /presences/:id.
  @Put(':id')

  // Modifie le statut ou l'observation d'une présence.
  async update(
    // Récupère l'identifiant de la présence depuis l'URL.
    @Param('id') id: string,

    // Récupère les nouvelles données envoyées par le client.
    @Body() data: Record<string, unknown>,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idPresence = Number(id);

    // Vérifie que l'identifiant est un entier strictement positif.
    if (!Number.isInteger(idPresence) || idPresence <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est invalide.
      throw new BadRequestException('Identifiant présence invalide.');
    }

    // Prépare les champs qui pourront être modifiés.
    const donneesModification: Record<string, unknown> = {};

    // Récupère le statut envoyé au format SQL ou camelCase.
    const statutRecu =
      data['statut_presence'] ?? data['statutPresence'];

    // Vérifie si le statut doit être modifié.
    if (statutRecu !== undefined) {

      // Vérifie que le statut est une chaîne de caractères.
      if (typeof statutRecu !== 'string') {

        // Retourne une erreur HTTP 400 si le statut est invalide.
        throw new BadRequestException(
          'Le statut de présence doit être un texte.',
        );
      }

      // Nettoie le statut et le convertit en majuscules.
      const statutNormalise = statutRecu.trim().toUpperCase();

      // Vérifie que le statut appartient aux valeurs autorisées.
      if (!['PRESENT', 'ABSENT'].includes(statutNormalise)) {

        // Retourne une erreur HTTP 400 si le statut n'est pas autorisé.
        throw new BadRequestException(
          'Le statut doit être PRESENT ou ABSENT.',
        );
      }

      // Ajoute le statut avec le type et le nom attendus par Prisma 8.
      donneesModification['statutPresence'] = statutNormalise as NonNullable<
        Parameters<
          typeof this.prisma.client.orm.public.Presence.create
        >[0]['statutPresence']
      >;
    }

    // Vérifie si une nouvelle observation est envoyée.
    if (data['observation'] !== undefined) {

      // Vérifie que l'observation est une chaîne ou null.
      if (
        typeof data['observation'] !== 'string' &&
        data['observation'] !== null
      ) {

        // Retourne une erreur HTTP 400 si l'observation est invalide.
        throw new BadRequestException(
          'L’observation doit être un texte.',
        );
      }

      // Ajoute la nouvelle observation aux données de modification.
      donneesModification['observation'] = data['observation'];
    }

    // Vérifie qu'au moins un champ modifiable a été envoyé.
    if (Object.keys(donneesModification).length === 0) {

      // Retourne une erreur HTTP 400 si aucune modification n'est demandée.
      throw new BadRequestException(
        'Veuillez fournir un statut ou une observation à modifier.',
      );
    }

    // Recherche la présence à modifier dans PostgreSQL.
    const presences = await this.prisma.client.orm.public.Presence
      .where({ idPresence })
      .all();

    // Vérifie que la présence existe.
    if (presences.length === 0) {

      // Retourne une erreur HTTP 404 si la présence est introuvable.
      throw new NotFoundException('Présence introuvable.');
    }

    // Recherche la présence et applique les modifications.
    return this.prisma.client.orm.public.Presence
      .where({ idPresence })
      .update(donneesModification);
  }

  // Définit la route DELETE /presences/:id.
  @Delete(':id')

  // Supprime une présence existante.
  async remove(
    // Récupère l'identifiant de la présence depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idPresence = Number(id);

    // Vérifie que l'identifiant est un entier strictement positif.
    if (!Number.isInteger(idPresence) || idPresence <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est invalide.
      throw new BadRequestException('Identifiant présence invalide.');
    }

    // Vérifie que la présence existe avant sa suppression.
    const presences = await this.prisma.client.orm.public.Presence
      .where({ idPresence })
      .all();

    // Refuse la suppression si la présence n'existe pas.
    if (presences.length === 0) {

      // Retourne une erreur HTTP 404 si elle est introuvable.
      throw new NotFoundException('Présence introuvable.');
    }

    // Supprime la présence et retourne les données supprimées.
    return this.prisma.client.orm.public.Presence
      .where({ idPresence })
      .delete();
  }
}
