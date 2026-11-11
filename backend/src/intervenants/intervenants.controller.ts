
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
  NotFoundException,
} from '@nestjs/common';

// Importe PrismaService pour communiquer avec PostgreSQL.
import { PrismaService } from '../prisma/prisma.service.js';

// Définit le préfixe des routes de gestion des intervenants.
@Controller('intervenants')

// Déclare le contrôleur responsable de la gestion des intervenants.
export class IntervenantsController {

  // Constructeur du contrôleur.
  constructor(
    // Injecte PrismaService pour accéder à la base de données.
    private readonly prisma: PrismaService,
  ) {}

  // Définit les champs autorisés pour un intervenant.
  private readonly champsAutorises = [
    'nom',
    'prenom',
    'fonction',
    'organisme',
    'email',
    'telephone',
  ] as const;

  // Définit les longueurs maximales correspondant aux colonnes PostgreSQL.
  private readonly longueursMaximales: Record<string, number> = {
    nom: 100,
    prenom: 100,
    fonction: 100,
    organisme: 150,
    email: 150,
    telephone: 20,
  };

  // Vérifie et prépare les données reçues pour créer ou modifier un intervenant.
  private validerDonnees(body: Record<string, unknown>) {

    // Prépare un objet contenant uniquement les propriétés autorisées.
    const donnees: Record<string, unknown> = {};

    // Parcourt les propriétés envoyées par le client.
    for (const [champ, valeur] of Object.entries(body)) {

      // Vérifie que le champ fait partie des propriétés autorisées.
      if (!this.champsAutorises.includes(champ as typeof this.champsAutorises[number])) {

        // Refuse les propriétés inconnues.
        throw new BadRequestException(`Champ non autorisé : ${champ}`);
      }

      // Vérifie que la valeur reçue est une chaîne de caractères.
      if (typeof valeur !== 'string') {

        // Retourne une erreur HTTP 400 si la valeur n'est pas un texte.
        throw new BadRequestException(`${champ} doit être un texte.`);
      }

      // Supprime les espaces inutiles au début et à la fin.
      const valeurNettoyee = valeur.trim();

      // Vérifie que la valeur respecte la longueur maximale de la colonne.
      if (valeurNettoyee.length > this.longueursMaximales[champ]) {

        // Retourne une erreur HTTP 400 si la valeur est trop longue.
        throw new BadRequestException(
          `${champ} ne doit pas dépasser ${this.longueursMaximales[champ]} caractères.`,
        );
      }

      // Ajoute la valeur nettoyée aux données autorisées.
      donnees[champ] = valeurNettoyee;
    }

    // Retourne les données validées.
    return donnees;
  }

  // Définit la route GET /intervenants.
  @Get()

  // Récupère tous les intervenants.
  async findAll() {

    // Retourne tous les intervenants enregistrés dans PostgreSQL.
    return this.prisma.client.orm.public.Intervenant.all();
  }

  // Définit la route GET /intervenants/:id.
  @Get(':id')

  // Récupère un intervenant à partir de son identifiant.
  async findOne(
    // Récupère l'identifiant de l'intervenant depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idIntervenant = Number(id);

    // Vérifie que l'identifiant est un entier strictement positif.
    if (!Number.isInteger(idIntervenant) || idIntervenant <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est invalide.
      throw new BadRequestException('Identifiant intervenant invalide.');
    }

    // Recherche l'intervenant correspondant à cet identifiant.
    const intervenants = await this.prisma.client.orm.public.Intervenant
      .where({ idIntervenant })
      .all();

    // Vérifie si l'intervenant existe.
    if (intervenants.length === 0) {

      // Retourne une erreur HTTP 404 si l'intervenant est introuvable.
      throw new NotFoundException('Intervenant introuvable.');
    }

    // Retourne l'intervenant trouvé.
    return intervenants[0];
  }

  // Définit la route POST /intervenants.
  @Post()

  // Crée un nouvel intervenant.
  async create(
    // Récupère les données envoyées dans le corps de la requête.
    @Body() body: Record<string, unknown>,
  ) {

    // Vérifie et nettoie les données reçues.
    const donnees = this.validerDonnees(body);

    // Vérifie que le nom et le prénom sont présents et non vides.
    if (
      typeof donnees['nom'] !== 'string' ||
      donnees['nom'].length === 0 ||
      typeof donnees['prenom'] !== 'string' ||
      donnees['prenom'].length === 0
    ) {

      // Retourne une erreur HTTP 400 si le nom ou le prénom est absent.
      throw new BadRequestException(
        'Le nom et le prénom de l’intervenant sont obligatoires.',
      );
    }

    // Demande à Prisma 8 de créer le nouvel intervenant.
    return this.prisma.client.orm.public.Intervenant.create(
      donnees as Parameters<
        typeof this.prisma.client.orm.public.Intervenant.create
      >[0],
    );
  }

  // Définit la route PUT /intervenants/:id.
  @Put(':id')

  // Modifie un intervenant existant.
  async update(
    // Récupère l'identifiant de l'intervenant depuis l'URL.
    @Param('id') id: string,

    // Récupère les nouvelles données envoyées par le client.
    @Body() body: Record<string, unknown>,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idIntervenant = Number(id);

    // Vérifie que l'identifiant est un entier strictement positif.
    if (!Number.isInteger(idIntervenant) || idIntervenant <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est invalide.
      throw new BadRequestException('Identifiant intervenant invalide.');
    }

    // Vérifie et nettoie les données reçues.
    const donnees = this.validerDonnees(body);

    // Vérifie qu'au moins un champ a été envoyé pour la modification.
    if (Object.keys(donnees).length === 0) {

      // Retourne une erreur HTTP 400 si aucune donnée n'est fournie.
      throw new BadRequestException(
        'Veuillez fournir au moins un champ à modifier.',
      );
    }

    // Recherche l'intervenant à modifier.
    const intervenants = await this.prisma.client.orm.public.Intervenant
      .where({ idIntervenant })
      .all();

    // Vérifie que l'intervenant existe.
    if (intervenants.length === 0) {

      // Retourne une erreur HTTP 404 si l'intervenant est introuvable.
      throw new NotFoundException('Intervenant introuvable.');
    }

    // Recherche l'intervenant et applique les modifications.
    return this.prisma.client.orm.public.Intervenant
      .where({ idIntervenant })
      .update(donnees);
  }

  // Définit la route DELETE /intervenants/:id.
  @Delete(':id')

  // Supprime un intervenant existant.
  async remove(
    // Récupère l'identifiant de l'intervenant depuis l'URL.
    @Param('id') id: string,
  ) {

    // Convertit l'identifiant reçu en nombre entier.
    const idIntervenant = Number(id);

    // Vérifie que l'identifiant est un entier strictement positif.
    if (!Number.isInteger(idIntervenant) || idIntervenant <= 0) {

      // Retourne une erreur HTTP 400 si l'identifiant est invalide.
      throw new BadRequestException('Identifiant intervenant invalide.');
    }

    // Vérifie que l'intervenant existe avant sa suppression.
    const intervenants = await this.prisma.client.orm.public.Intervenant
      .where({ idIntervenant })
      .all();

    // Refuse la suppression si l'intervenant n'existe pas.
    if (intervenants.length === 0) {

      // Retourne une erreur HTTP 404.
      throw new NotFoundException('Intervenant introuvable.');
    }

    // Supprime l'intervenant et retourne ses données.
    return this.prisma.client.orm.public.Intervenant
      .where({ idIntervenant })
      .delete();
  }
}
