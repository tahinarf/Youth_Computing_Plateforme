// Importe le décorateur Module depuis NestJS.
import { Module } from '@nestjs/common';

// Importe le module d'observation de NestJS.
import { createObserveModule } from '@nestjs/observe';

// Importe le contrôleur principal de l'application.
import { AppController } from './app.controller.js';

// Importe le service principal de l'application.
import { AppService } from './app.service.js';

// Importe le module Prisma permettant l'accès à PostgreSQL.
import { PrismaModule } from './prisma/prisma.module.js';

// Importe le contrôleur responsable des participants.
import { ParticipantsController } from './participants/participants.controller.js';

// Importe le contrôleur responsable des activités.
import { ActivitesController } from './activites/activites.controller.js';

// Importe le contrôleur responsable de la gestion des sessions.
import { SessionsController } from './sessions/sessions.controller.js';

// Crée le module d'observation et son instrument.
export const { ObserveModule, ObserveInstrument } = createObserveModule();

// Définit le module principal de l'application NestJS.
@Module({

  // Déclare les modules utilisés par l'application.
  imports: [

    // Configure le module d'observation NestJS.
    ObserveModule.forRoot({

      // Clé d'application utilisée par Observe.
      appKey: 'YOUR_APP_KEY',

      // Secret d'application utilisé par Observe.
      appSecret: 'YOUR_APP_SECRET',

      // Identifiant du service backend.
      serviceId: 'backend',
    }),

    // Importe notre module Prisma.
    PrismaModule,
  ],

  // Déclare tous les contrôleurs de l'application.
  controllers: [

    // Contrôleur principal de l'application.
    AppController,

    // Contrôleur permettant de gérer les participants.
    ParticipantsController,

    // Contrôleur permettant de gérer les activités.
    ActivitesController,

    // Contrôleur permettant de gérer les sessions.
    SessionsController,
  ],

  // Déclare les services utilisés par le module.
  providers: [

    // Service principal de l'application.
    AppService,
  ],
})

// Exporte le module principal de l'application.
export class AppModule {}