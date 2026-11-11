
// Importe les décorateurs HTTP et les exceptions nécessaires depuis NestJS.
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

// Importe PrismaService pour communiquer avec PostgreSQL.
import { PrismaService } from '../prisma/prisma.service.js';

// Définit le préfixe des routes de gestion des associations.
@Controller('activite-intervenants')

// Déclare le contrôleur responsable des associations activité-intervenant.
export class ActiviteIntervenantsController {

  // Constructeur du contrôleur.
  constructor(
    // Injecte PrismaService pour accéder aux tables PostgreSQL.
    private readonly prisma: PrismaService,
  ) {}

  // Vérifie et convertit un identifiant reçu depuis une URL ou une requête.
  private convertirIdentifiant(valeur: unknown, champ: string): number {

    // Vérifie que la valeur reçue est un nombre ou un texte.
    if (
      (typeof valeur !== 'number' && typeof valeur !== 'string') ||
      String(valeur).trim() === ''
    ) {

      // Retourne une erreur HTTP 400 si l'identifiant est invalide.
      throw new BadRequestException(`${champ} est obligatoire.`);
    }

    // Convertit la valeur en nombre entier.
    const identifiant = Number(valeur);

    // Vérifie que l'identifiant est un entier strictement positif.
    if (!Number.isSafeInteger(identifiant) || identifiant <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est incorrect.
      throw new BadRequestException(`${champ} doit être un entier positif.`);
    }

    // Retourne l'identifiant validé.
    return identifiant;
  }

  // Définit la route GET /activite-intervenants.
  @Get()

  // Récupère toutes les associations entre les activités et les intervenants.
  async findAll() {

    // Retourne toutes les associations de la table activite_intervenant.
    return this.prisma.client.orm.public.ActiviteIntervenant.all();
  }

  // Définit la route GET /activite-intervenants/activite/:id.
  @Get('activite/:id')

  // Récupère tous les intervenants associés à une activité.
  async findByActivite(
    // Récupère l'identifiant de l'activité depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit et valide l'identifiant de l'activité.
    const idActivite = this.convertirIdentifiant(id, 'idActivite');

    // Vérifie que l'activité existe dans PostgreSQL.
    const activites = await this.prisma.client.orm.public.Activite
      .where({ idActivite })
      .all();

    // Vérifie si l'activité a été trouvée.
    if (activites.length === 0) {

      // Retourne une erreur HTTP 404 si l'activité est introuvable.
      throw new NotFoundException('Activité introuvable.');
    }

    // Recherche les associations correspondant à cette activité.
    return this.prisma.client.orm.public.ActiviteIntervenant
      .where({ idActivite })
      .all();
  }

  // Définit la route GET /activite-intervenants/intervenant/:id.
  @Get('intervenant/:id')

  // Récupère toutes les activités associées à un intervenant.
  async findByIntervenant(
    // Récupère l'identifiant de l'intervenant depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit et valide l'identifiant de l'intervenant.
    const idIntervenant = this.convertirIdentifiant(id, 'idIntervenant');

    // Vérifie que l'intervenant existe dans PostgreSQL.
    const intervenants = await this.prisma.client.orm.public.Intervenant
      .where({ idIntervenant })
      .all();

    // Vérifie si l'intervenant a été trouvé.
    if (intervenants.length === 0) {

      // Retourne une erreur HTTP 404 si l'intervenant est introuvable.
      throw new NotFoundException('Intervenant introuvable.');
    }

    // Recherche les associations correspondant à cet intervenant.
    return this.prisma.client.orm.public.ActiviteIntervenant
      .where({ idIntervenant })
      .all();
  }

  // Définit la route POST /activite-intervenants.
  @Post()

  // Associe un intervenant à une activité.
  async create(
    // Récupère les identifiants envoyés dans le corps de la requête.
    @Body() body: Record<string, unknown>,
  ) {

    // Récupère l'identifiant de l'activité au format SQL ou camelCase.
    const idActivite = this.convertirIdentifiant(
      body['id_activite'] ?? body['idActivite'],
      'idActivite',
    );

    // Récupère l'identifiant de l'intervenant au format SQL ou camelCase.
    const idIntervenant = this.convertirIdentifiant(
      body['id_intervenant'] ?? body['idIntervenant'],
      'idIntervenant',
    );

    // Vérifie que l'activité existe dans PostgreSQL.
    const activites = await this.prisma.client.orm.public.Activite
      .where({ idActivite })
      .all();

    // Vérifie que l'activité a été trouvée.
    if (activites.length === 0) {

      // Retourne une erreur HTTP 404 si l'activité est introuvable.
      throw new NotFoundException('Activité introuvable.');
    }

    // Vérifie que l'intervenant existe dans PostgreSQL.
    const intervenants = await this.prisma.client.orm.public.Intervenant
      .where({ idIntervenant })
      .all();

    // Vérifie que l'intervenant a été trouvé.
    if (intervenants.length === 0) {

      // Retourne une erreur HTTP 404 si l'intervenant est introuvable.
      throw new NotFoundException('Intervenant introuvable.');
    }

    // Recherche une association déjà enregistrée entre ces deux éléments.
    const associationExistante =
      await this.prisma.client.orm.public.ActiviteIntervenant
        .where({
          idActivite,
          idIntervenant,
        })
        .all();

    // Vérifie si cette association existe déjà.
    if (associationExistante.length > 0) {

      // Retourne une erreur HTTP 409 pour empêcher les doublons.
      throw new ConflictException(
        'Cet intervenant est déjà associé à cette activité.',
      );
    }

    // Prépare les deux clés étrangères de la nouvelle association.
    const donneesAssociation = {
      // Identifiant de l'activité concernée.
      idActivite,

      // Identifiant de l'intervenant concerné.
      idIntervenant,
    };

    // Crée l'association dans PostgreSQL avec Prisma 8.
    return this.prisma.client.orm.public.ActiviteIntervenant.create(
      donneesAssociation,
    );
  }

  // Définit la route DELETE /activite-intervenants/:idActivite/:idIntervenant.
  @Delete(':idActivite/:idIntervenant')

  // Supprime une association entre une activité et un intervenant.
  async remove(
    // Récupère l'identifiant de l'activité depuis l'URL.
    @Param('idActivite') idActiviteParam: string,

    // Récupère l'identifiant de l'intervenant depuis l'URL.
    @Param('idIntervenant') idIntervenantParam: string,
  ) {

    // Convertit et valide l'identifiant de l'activité.
    const idActivite = this.convertirIdentifiant(
      idActiviteParam,
      'idActivite',
    );

    // Convertit et valide l'identifiant de l'intervenant.
    const idIntervenant = this.convertirIdentifiant(
      idIntervenantParam,
      'idIntervenant',
    );

    // Recherche l'association correspondant aux deux identifiants.
    const associations =
      await this.prisma.client.orm.public.ActiviteIntervenant
        .where({
          idActivite,
          idIntervenant,
        })
        .all();

    // Vérifie que l'association existe.
    if (associations.length === 0) {

      // Retourne une erreur HTTP 404 si l'association est introuvable.
      throw new NotFoundException('Association introuvable.');
    }

    // Supprime uniquement la relation entre l'activité et l'intervenant.
    return this.prisma.client.orm.public.ActiviteIntervenant
      .where({
        idActivite,
        idIntervenant,
      })
      .delete();
  }
}
