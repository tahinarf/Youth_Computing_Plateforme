/*import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
*/

// Importe le polyfill de l'API Temporal.
import { Temporal } from '@js-temporal/polyfill';

// Rend Temporal disponible globalement dans Node.js.
globalThis.Temporal = Temporal;

// Charge les variables d'environnement depuis le fichier .env.
import 'dotenv/config';

// Importe NestFactory pour créer l'application NestJS.
import { NestFactory } from '@nestjs/core';

// Importe AppModule ainsi que l'instrumentation Observe.
import { AppModule, ObserveInstrument } from './app.module.js';

// Fonction principale qui démarre l'application NestJS.
async function bootstrap() {

  // Crée l'application NestJS à partir de AppModule.
  const app = await NestFactory.create(AppModule, {

    // Active l'instrumentation Observe de NestJS.
    instrument: ObserveInstrument,
  });

  // Démarre le serveur HTTP sur le port défini dans .env,
  // ou utilise le port 3000 si PORT n'est pas défini.
  await app.listen(process.env.PORT ?? 3000);
}

// Exécute la fonction de démarrage de l'application.
await bootstrap();