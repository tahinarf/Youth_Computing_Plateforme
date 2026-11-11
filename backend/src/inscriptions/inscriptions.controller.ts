
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

// Définit le préfixe des routes de gestion des inscriptions.
@Controller('inscriptions')

// Déclare le contrôleur responsable de la gestion des inscriptions.
export class InscriptionsController {

  // Constructeur du contrôleur.
  constructor(
    // Injecte PrismaService pour accéder aux tables PostgreSQL.
    private readonly prisma: PrismaService,
  ) {}

  // Définit la route GET /inscriptions.
  @Get()

  // Récupère toutes les inscriptions.
  async findAll() {

    // Retourne toutes les inscriptions enregistrées dans PostgreSQL.
    return this.prisma.client.orm.public.Inscription.all();
  }

  // Définit la route GET /inscriptions/:id.
  @Get(':id')

  // Récupère une inscription à partir de son identifiant.
  async findOne(
    // Récupère l'identifiant envoyé dans l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idInscription = Number(id);

    // Vérifie que l'identifiant est un entier positif.
    if (!Number.isInteger(idInscription) || idInscription <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est invalide.
      throw new BadRequestException('Identifiant inscription invalide.');
    }

    // Recherche l'inscription correspondant à cet identifiant.
    const inscriptions = await this.prisma.client.orm.public.Inscription
      .where({ idInscription })
      .all();

    // Vérifie si l'inscription existe.
    if (inscriptions.length === 0) {

      // Retourne une erreur HTTP 404 si elle est introuvable.
      throw new NotFoundException('Inscription introuvable.');
    }

    // Retourne l'inscription trouvée.
    return inscriptions[0];
  }

  // Définit la route POST /inscriptions.
  @Post()

  // Crée une nouvelle inscription.
  async create(
    // Récupère les données envoyées dans le corps de la requête.
    @Body() body: Record<string, unknown>,
  ) {

    // Convertit l'identifiant du participant en nombre.
    const idParticipant = Number(body['id_participant']);

    // Convertit l'identifiant de l'activité en nombre.
    const idActivite = Number(body['id_activite']);

    // Vérifie que les deux identifiants sont des entiers positifs.
    if (
      !Number.isInteger(idParticipant) ||
      idParticipant <= 0 ||
      !Number.isInteger(idActivite) ||
      idActivite <= 0
    ) {

      // Retourne une erreur HTTP 400 si les identifiants sont invalides.
      throw new BadRequestException(
        'Les identifiants du participant et de l’activité sont obligatoires.',
      );
    }

    // Vérifie que le participant existe dans la base de données.
    const participants = await this.prisma.client.orm.public.Participant
      .where({ idParticipant })
      .all();

    // Refuse l'inscription si le participant n'existe pas.
    if (participants.length === 0) {

      // Retourne une erreur HTTP 404 pour le participant introuvable.
      throw new NotFoundException('Participant introuvable.');
    }

    // Vérifie que l'activité existe dans la base de données.
    const activites = await this.prisma.client.orm.public.Activite
      .where({ idActivite })
      .all();

    // Refuse l'inscription si l'activité n'existe pas.
    if (activites.length === 0) {

      // Retourne une erreur HTTP 404 pour l'activité introuvable.
      throw new NotFoundException('Activité introuvable.');
    }

    // Recherche une inscription ayant déjà ce participant et cette activité.
    const inscriptionExistante =
      await this.prisma.client.orm.public.Inscription
        .where({
          idParticipant,
          idActivite,
        })
        .all();

    // Vérifie si une inscription identique existe déjà.
    if (inscriptionExistante.length > 0) {

      // Retourne une erreur HTTP 409 en cas de doublon.
      throw new ConflictException(
        'Ce participant est déjà inscrit à cette activité.',
      );
    }

    // Prépare uniquement les champs autorisés à la création.
    const donneesInscription: Record<string, unknown> = {

      // Associe l'inscription au participant existant.
      id_participant: idParticipant,

      // Associe l'inscription à l'activité existante.
      id_activite: idActivite,
    };

    // Récupère le statut éventuellement envoyé par le client.
    const statutRecu = body['statut'];

    // Vérifie si un statut a été fourni.
    if (statutRecu !== undefined) {

      // Vérifie que le statut est une chaîne non vide de 50 caractères maximum.
      if (
        typeof statutRecu !== 'string' ||
        statutRecu.trim().length === 0 ||
        statutRecu.trim().length > 50
      ) {

        // Retourne une erreur HTTP 400 si le statut est invalide.
        throw new BadRequestException(
          'Le statut doit contenir entre 1 et 50 caractères.',
        );
      }

      // Ajoute le statut nettoyé aux données de création.
      donneesInscription['statut'] = statutRecu.trim();
    }

    // Crée l'inscription dans PostgreSQL avec Prisma 8.
    // La date et le statut par défaut sont gérés par la base de données.
    return this.prisma.client.orm.public.Inscription.create(
      donneesInscription as Parameters<
        typeof this.prisma.client.orm.public.Inscription.create
      >[0],
    );
  }

  // Définit la route PUT /inscriptions/:id.
  @Put(':id')

  // Modifie le statut d'une inscription existante.
  async update(
    // Récupère l'identifiant de l'inscription dans l'URL.
    @Param('id') id: string,

    // Récupère les nouvelles données envoyées par le client.
    @Body() data: Record<string, unknown>,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idInscription = Number(id);

    // Vérifie que l'identifiant est un entier positif.
    if (!Number.isInteger(idInscription) || idInscription <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est incorrect.
      throw new BadRequestException('Identifiant inscription invalide.');
    }

    // Récupère le statut envoyé dans la requête.
    const statutRecu = data['statut'];

    // Vérifie que le statut est une chaîne non vide de 50 caractères maximum.
    if (
      typeof statutRecu !== 'string' ||
      statutRecu.trim().length === 0 ||
      statutRecu.trim().length > 50
    ) {

      // Retourne une erreur HTTP 400 si le statut est invalide.
      throw new BadRequestException(
        'Le statut doit contenir entre 1 et 50 caractères.',
      );
    }

    // Recherche l'inscription à modifier.
    const inscriptions = await this.prisma.client.orm.public.Inscription
      .where({ idInscription })
      .all();

    // Vérifie que l'inscription existe.
    if (inscriptions.length === 0) {

      // Retourne une erreur HTTP 404 si l'inscription est introuvable.
      throw new NotFoundException('Inscription introuvable.');
    }

    // Convertit le statut vers le type exact attendu par Prisma 8.
    const statut = statutRecu.trim() as NonNullable<
      Parameters<
        typeof this.prisma.client.orm.public.Inscription.create
      >[0]['statut']
    >;

    // Recherche l'inscription et applique uniquement la modification du statut.
    return this.prisma.client.orm.public.Inscription
      .where({ idInscription })
      .update({

        // Transmet le statut avec le type attendu par Prisma 8.
        statut,
      });
  }

  // Définit la route DELETE /inscriptions/:id.
  @Delete(':id')

  // Supprime une inscription existante.
  async remove(
    // Récupère l'identifiant de l'inscription depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idInscription = Number(id);

    // Vérifie que l'identifiant est un entier positif.
    if (!Number.isInteger(idInscription) || idInscription <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est incorrect.
      throw new BadRequestException('Identifiant inscription invalide.');
    }

    // Vérifie que l'inscription existe avant de la supprimer.
    const inscriptions = await this.prisma.client.orm.public.Inscription
      .where({ idInscription })
      .all();

    // Refuse la suppression si l'inscription n'existe pas.
    if (inscriptions.length === 0) {

      // Retourne une erreur HTTP 404.
      throw new NotFoundException('Inscription introuvable.');
    }

    // Supprime l'inscription et retourne les données supprimées.
    return this.prisma.client.orm.public.Inscription
      .where({ idInscription })
      .delete();
  }
}
