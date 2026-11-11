
/**
 * Service API du tableau de bord Youth Computing.
 * Ce fichier centralise les appels vers FastAPI.
 */

// URL de base de l'API statistique.
// En développement, Vite transmet les requêtes à FastAPI via son proxy.
const API_BASE_URL = import.meta.env.VITE_STATISTICS_API_URL ?? '';

// Structure d'une catégorie statistique.
export interface CountRow {
  categorie: string;
  nombre: number;
}

// Structure d'une répartition annuelle.
export interface YearRow {
  annee: number;
  nombre: number;
}

// Indicateurs généraux.
export interface OverviewIndicators {
  total_activites: number;
  total_sessions: number;
  total_participants_base: number;
  total_inscriptions: number;
  participants_inscrits_uniques: number;
  total_enregistrements_presence: number;
  total_presents: number;
  total_absents: number;
  taux_presence_pct: number;
}

// Réponse générale de FastAPI.
export interface OverviewResponse {
  message: string;
  indicateurs: OverviewIndicators;
}

// Statistiques des participants.
export interface ParticipantIndicators {
  total_participants: number;
  repartition_sexe: CountRow[];
  repartition_age: CountRow[];
  repartition_niveau_etude: CountRow[];
  repartition_ville: CountRow[];
  repartition_region: CountRow[];
}

export interface ParticipantsResponse {
  message: string;
  indicateurs: ParticipantIndicators;
}

// Statistiques des activités.
export interface ActivityIndicators {
  total_activites: number;
  capacite_totale: number;
  repartition_type: CountRow[];
  repartition_annee: YearRow[];
  repartition_statut: CountRow[];
}

export interface ActivitiesResponse {
  message: string;
  indicateurs: ActivityIndicators;
}

// Statistiques des inscriptions.
export interface RegistrationActivity {
  id_activite: number;
  titre: string;
  nombre_inscriptions: number;
  participants_uniques: number;
}

export interface RegistrationIndicators {
  total_inscriptions: number;
  participants_uniques: number;
  activites_concernees: number;
  repartition_annuelle: YearRow[];
  nouveaux_participants_par_annee: YearRow[];
  repartition_activite: RegistrationActivity[];
  repartition_statut: CountRow[];
}

export interface RegistrationsResponse {
  message: string;
  indicateurs: RegistrationIndicators;
}

// Statistiques des présences.
export interface SessionAttendance {
  id_activite: number;
  activite: string;
  id_session: number;
  session: string;
  date_session: string | null;
  participants_inscrits: number;
  presents: number;
  absents: number;
  non_pointes: number;
  taux_participation_pct: number;
  taux_pointage_pct: number;
}

export interface ActivityAttendance {
  id_activite: number;
  titre: string;
  participants_inscrits: number;
  total_sessions: number;
  participants_attendus_sessions: number;
  presents: number;
  absents: number;
  non_pointes: number;
  taux_participation_pct: number;
  taux_pointage_pct: number;
}

export interface PresenceIndicators {
  total_activites: number;
  total_sessions: number;
  participants_inscrits_uniques: number;
  participants_attendus_sessions: number;
  total_presents: number;
  total_absents: number;
  total_non_pointes: number;
  taux_participation_pct: number;
  taux_pointage_pct: number;
  presences_hors_inscription: number;
  par_activite: ActivityAttendance[];
  par_session: SessionAttendance[];
}

export interface PresencesResponse {
  message: string;
  indicateurs: PresenceIndicators;
}

// Statistiques géographiques.
export interface RegionRow {
  region: string;
  nombre_participants: number;
  pourcentage: number;
}

export interface CityRow {
  ville: string;
  nombre_participants: number;
  pourcentage: number;
}

export interface GeographyIndicators {
  total_participants: number;
  total_regions: number;
  total_villes: number;
  repartition_regions: RegionRow[];
  repartition_villes: CityRow[];
}

export interface GeographyResponse {
  message: string;
  indicateurs: GeographyIndicators;
}

// Statistiques de l'évolution annuelle.
export interface EvolutionRow {
  annee: number;
  total_activites: number;
  total_inscriptions: number;
  participants_uniques: number;
  nouveaux_participants: number;
  total_sessions: number;
  total_presents: number;
  total_absents: number;
  taux_presence_pct: number;
}

export interface EvolutionResponse {
  message: string;
  nombre_annees: number;
  evolution: EvolutionRow[];
}

// Résultat d'un appel API.
interface RequestResult<T> {
  data: T | null;
  error: string | null;
}

// Récupère les données d'un endpoint FastAPI.
async function request<T>(endpoint: string): Promise<RequestResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as T;

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: `${endpoint} : ${
        error instanceof Error ? error.message : 'Erreur inconnue'
      }`,
    };
  }
}

// Structure regroupant toutes les données du tableau de bord.
export interface DashboardData {
  overview: OverviewResponse | null;
  participants: ParticipantsResponse | null;
  activities: ActivitiesResponse | null;
  registrations: RegistrationsResponse | null;
  presences: PresencesResponse | null;
  geography: GeographyResponse | null;
  evolution: EvolutionResponse | null;
  errors: string[];
}

// Charge toutes les statistiques disponibles.
export async function loadDashboardData(): Promise<DashboardData> {
  const [
    overview,
    participants,
    activities,
    registrations,
    presences,
    geography,
    evolution,
  ] = await Promise.all([
    request<OverviewResponse>('/statistics/overview'),
    request<ParticipantsResponse>('/statistics/participants'),
    request<ActivitiesResponse>('/statistics/activites'),
    request<RegistrationsResponse>('/statistics/inscriptions'),
    request<PresencesResponse>('/statistics/presences'),
    request<GeographyResponse>('/statistics/geographie'),
    request<EvolutionResponse>('/statistics/evolution-annuelle'),
  ]);

  const results = [
    overview,
    participants,
    activities,
    registrations,
    presences,
    geography,
    evolution,
  ];

  return {
    overview: overview.data,
    participants: participants.data,
    activities: activities.data,
    registrations: registrations.data,
    presences: presences.data,
    geography: geography.data,
    evolution: evolution.data,
    errors: results
      .map((result) => result.error)
      .filter((error): error is string => error !== null),
  };
}
