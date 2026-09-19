// Déclare des propriétés supplémentaires disponibles dans l'environnement global.
declare global {

  // Déclare l'API Temporal comme propriété globale de Node.js.
  var Temporal: typeof import('@js-temporal/polyfill').Temporal;
}

// Indique à TypeScript que ce fichier contient des déclarations globales.
export {};