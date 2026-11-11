
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  loadDashboardData,
  type CountRow,
  type DashboardData,
  type EvolutionRow,
} from './services/statisticsApi';

import './App.css';

// Couleurs des graphiques.
const chartColors = [
  '#2855C5',
  '#14A38B',
  '#8B5CF6',
  '#F59E0B',
  '#E05B79',
  '#64748B',
];

// Formate un nombre.
function formatNumber(value: number | undefined): string {
  return new Intl.NumberFormat('fr-FR').format(value ?? 0);
}

// Formate un pourcentage.
function formatPercentage(value: number | undefined): string {
  return `${(value ?? 0).toFixed(1).replace('.', ',')} %`;
}

// Transforme les données d'une répartition pour Recharts.
function prepareChartData(rows: CountRow[] | undefined) {
  return (rows ?? []).map((row) => ({
    name: row.categorie,
    value: row.nombre,
  }));
}

// Affiche un message lorsqu'un graphique n'a aucune donnée.
function EmptyChart() {
  return (
    <div className="empty-chart">
      <BarChart3 size={28} />
      <span>Aucune donnée disponible</span>
    </div>
  );
}

// Composant réutilisable pour les cartes KPI.
interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  color: string;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <div>
          <span className="metric-title">{title}</span>
          <div className="metric-value">{value}</div>
        </div>

        <div
          className="metric-icon"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon size={23} />
        </div>
      </div>

      <span className="metric-description">{description}</span>
    </article>
  );
}

// Carte contenant un graphique.
interface ChartCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: ChartCardProps) {
  return (
    <article className={`chart-card ${className}`}>
      <div className="chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      {children}
    </article>
  );
}

// Application principale.
function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Charge ou actualise les données du dashboard.
  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);

    try {
      const result = await loadDashboardData();

      setData(result);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Charge les données au montage du composant.
  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  // Récupère les indicateurs généraux.
  const overview = data?.overview?.indicateurs;
  const participantStats = data?.participants?.indicateurs;
  const activityStats = data?.activities?.indicateurs;
  const registrationStats = data?.registrations?.indicateurs;
  const presenceStats = data?.presences?.indicateurs;
  const geographyStats = data?.geography?.indicateurs;

  // Prépare les données de l'évolution annuelle.
  const evolutionData = useMemo(() => {
    const rows = data?.evolution?.evolution ?? [];

    if (selectedYear === 'all') {
      return rows;
    }

    return rows.filter(
      (row) => String(row.annee) === selectedYear,
    );
  }, [data?.evolution?.evolution, selectedYear]);

  // Prépare les choix d'années disponibles.
  const availableYears = useMemo(() => {
    const rows: EvolutionRow[] = data?.evolution?.evolution ?? [];

    return rows.map((row) => row.annee);
  }, [data?.evolution?.evolution]);

  // Prépare la répartition des participants par sexe.
  const genderData = prepareChartData(
    participantStats?.repartition_sexe,
  );

  // Prépare la répartition des participants par âge.
  const ageData = prepareChartData(
    participantStats?.repartition_age,
  );

  // Prépare les activités par type.
  const activityTypeData = prepareChartData(
    activityStats?.repartition_type,
  );

  // Prépare les répartitions géographiques.
  const regionData = (geographyStats?.repartition_regions ?? []).map(
    (item) => ({
      name: item.region,
      nombre: item.nombre_participants,
    }),
  );

  // Prépare les données de présence par session.
  const sessionData = (presenceStats?.par_session ?? []).map(
    (item) => ({
      name: item.session,
      presents: item.presents,
      absents: item.absents,
      nonPointes: item.non_pointes,
    }),
  );

  // Prépare les activités les plus fréquentées.
  const popularActivities = (
    registrationStats?.repartition_activite ?? []
  ).slice(0, 5);

  // Détermine si le dashboard a été chargé.
  const hasErrors = (data?.errors.length ?? 0) > 0;

  // Affiche l'heure de dernière actualisation.
  const updateTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Non actualisé';

  return (
    <div className="app-shell">

      {/* Barre latérale de navigation. */}
      <aside className="sidebar">

        <a className="brand" href="#overview">
          <div className="brand-logo">
            <GraduationCap size={27} />
          </div>

          <div>
            <strong>YOUTH COMPUTING</strong>
            <span>Management Platform</span>
          </div>
        </a>

        <div className="nav-label">MENU PRINCIPAL</div>

        <nav className="sidebar-nav">
          <a href="#overview" className="nav-link active">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </a>

          <a href="#activities" className="nav-link">
            <CalendarDays size={19} />
            <span>Activités</span>
          </a>

          <a href="#participants" className="nav-link">
            <Users size={19} />
            <span>Participants</span>
          </a>

          <a href="#attendance" className="nav-link">
            <CheckCircle2 size={19} />
            <span>Présences</span>
          </a>

          <a href="#registrations" className="nav-link">
            <ClipboardList size={19} />
            <span>Inscriptions</span>
          </a>

          <a href="#evolution" className="nav-link">
            <TrendingUp size={19} />
            <span>Évolution annuelle</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot" />
            <span>Data API</span>
            <strong>{hasErrors ? 'Partielle' : data ? 'Connectée' : '...'}</strong>
          </div>

          <p>© 2026 Youth Computing</p>
        </div>
      </aside>

      {/* Contenu principal. */}
      <main className="main-content">

        {/* En-tête. */}
        <header className="topbar">
          <div>
            <span className="breadcrumb">Youth Computing / Analyse</span>
            <h1>Tableau de bord</h1>
          </div>

          <div className="topbar-actions">
            <div className="update-info">
              <span className="status-dot" />
              <span>Actualisé à {updateTime}</span>
            </div>

            <button
              className="refresh-button"
              type="button"
              onClick={() => void refreshDashboard()}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'spin' : ''}
              />
              Actualiser
            </button>
          </div>
        </header>

        {/* Zone de contenu. */}
        <div className="dashboard-content" id="overview">

          <section className="welcome-section">
            <div>
              <span className="eyebrow">ESPACE DÉCISIONNEL</span>
              <h2>Vue d'ensemble</h2>
              <p>
                Suivez et analysez les activités de Youth Computing
                grâce aux données centralisées.
              </p>
            </div>

            <div className="year-indicator">
              <CalendarDays size={17} />
              <span>Données institutionnelles</span>
            </div>
          </section>

          {/* État du chargement. */}
          {loading && (
            <div className="loading-banner">
              <RefreshCw size={18} className="spin" />
              Chargement des statistiques...
            </div>
          )}

          {/* Erreurs éventuelles des API. */}
          {hasErrors && (
            <div className="error-banner">
              <XCircle size={19} />
              <div>
                <strong>Certaines statistiques sont indisponibles.</strong>

                <ul>
                  {data?.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Cartes KPI. */}
          <section className="metrics-grid">

            <MetricCard
              title="Activités"
              value={formatNumber(
                overview?.total_activites ??
                activityStats?.total_activites,
              )}
              description="Total des activités enregistrées"
              icon={CalendarDays}
              color="#2855C5"
            />

            <MetricCard
              title="Participants"
              value={formatNumber(
                overview?.total_participants_base ??
                participantStats?.total_participants,
              )}
              description="Participants dans la base"
              icon={Users}
              color="#119B84"
            />

            <MetricCard
              title="Inscriptions"
              value={formatNumber(
                overview?.total_inscriptions ??
                registrationStats?.total_inscriptions,
              )}
              description="Inscriptions enregistrées"
              icon={ClipboardList}
              color="#8058D7"
            />

            <MetricCard
              title="Participation"
              value={formatPercentage(
                presenceStats?.taux_participation_pct,
              )}
              description="Présents / participations attendues"
              icon={TrendingUp}
              color="#D38B24"
            />

          </section>

          {/* Deuxième ligne de KPI. */}
          <section className="secondary-metrics">

            <div className="small-metric">
              <div className="small-metric-icon present">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <strong>{formatNumber(presenceStats?.total_presents)}</strong>
                <span>Présents</span>
              </div>
            </div>

            <div className="small-metric">
              <div className="small-metric-icon absent">
                <XCircle size={19} />
              </div>

              <div>
                <strong>{formatNumber(presenceStats?.total_absents)}</strong>
                <span>Absents</span>
              </div>
            </div>

            <div className="small-metric">
              <div className="small-metric-icon sessions">
                <Activity size={19} />
              </div>

              <div>
                <strong>{formatNumber(overview?.total_sessions)}</strong>
                <span>Sessions</span>
              </div>
            </div>

            <div className="small-metric">
              <div className="small-metric-icon locations">
                <MapPin size={19} />
              </div>

              <div>
                <strong>{formatNumber(geographyStats?.total_regions)}</strong>
                <span>Régions représentées</span>
              </div>
            </div>

          </section>

          {/* Graphiques annuels et par type. */}
          <section className="charts-grid" id="evolution">

            <ChartCard
              title="Évolution annuelle"
              subtitle="Activités, sessions, inscriptions et participants"
              className="chart-large"
            >
              <div className="chart-filter">
                <label htmlFor="year-filter">Année</label>

                <select
                  id="year-filter"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                >
                  <option value="all">Toutes les années</option>

                  {availableYears.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {evolutionData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={290}>
                    <LineChart data={evolutionData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E8EDF4"
                      />

                      <XAxis
                        dataKey="annee"
                        tick={{ fill: '#718096', fontSize: 12 }}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#718096', fontSize: 12 }}
                      />

                      <Tooltip />
                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="total_activites"
                        name="Activités"
                        stroke="#2855C5"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="total_inscriptions"
                        name="Inscriptions"
                        stroke="#14A38B"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="participants_uniques"
                        name="Participants uniques"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              title="Activités par type"
              subtitle="Répartition des activités enregistrées"
            >
              {activityTypeData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={290}>
                    <PieChart>
                      <Pie
                        data={activityTypeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={95}
                        innerRadius={55}
                        paddingAngle={3}
                      >
                        {activityTypeData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

          </section>

          {/* Participants et géographie. */}
          <section className="charts-grid" id="participants">

            <ChartCard
              title="Répartition par sexe"
              subtitle="Structure des participants"
            >
              {genderData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={275}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={90}
                        innerRadius={48}
                      >
                        {genderData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              title="Répartition par âge"
              subtitle="Nombre de participants par tranche d'âge"
            >
              {ageData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={275}>
                    <BarChart data={ageData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E8EDF4"
                      />

                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis allowDecimals={false} />
                      <Tooltip />

                      <Bar
                        dataKey="value"
                        name="Participants"
                        fill="#2855C5"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

          </section>

          {/* Répartition géographique et fréquentation. */}
          <section className="charts-grid">

            <ChartCard
              title="Répartition géographique"
              subtitle="Participants par région"
            >
              {regionData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={290}>
                    <BarChart
                      data={regionData}
                      layout="vertical"
                      margin={{ left: 5, right: 15 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#E8EDF4"
                      />

                      <XAxis type="number" allowDecimals={false} />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 11 }}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="nombre"
                        name="Participants"
                        fill="#14A38B"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              title="Présences par session"
              subtitle="Présents et absents enregistrés"
            >
              {sessionData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={290}>
                    <BarChart data={sessionData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E8EDF4"
                      />

                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                      />

                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />

                      <Bar
                        dataKey="presents"
                        name="Présents"
                        stackId="attendance"
                        fill="#14A38B"
                      />

                      <Bar
                        dataKey="absents"
                        name="Absents"
                        stackId="attendance"
                        fill="#E05B79"
                      />

                      <Bar
                        dataKey="nonPointes"
                        name="Non pointés"
                        stackId="attendance"
                        fill="#F59E0B"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

          </section>

          {/* Tableau des activités. */}
          <section className="table-section" id="registrations">
            <div className="table-header">
              <div>
                <h3>Activités et inscriptions</h3>
                <p>Vue détaillée des inscriptions par activité</p>
              </div>

              <span className="table-count">
                {popularActivities.length} activité(s)
              </span>
            </div>

            {popularActivities.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Activité</th>
                      <th>Inscriptions</th>
                      <th>Participants uniques</th>
                    </tr>
                  </thead>

                  <tbody>
                    {popularActivities.map((activity) => (
                      <tr key={activity.id_activite}>
                        <td>{activity.titre}</td>

                        <td>
                          <strong>
                            {formatNumber(activity.nombre_inscriptions)}
                          </strong>
                        </td>

                        <td>
                          {formatNumber(activity.participants_uniques)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyChart />
            )}
          </section>

          {/* Pied de page. */}
          <footer className="dashboard-footer">
            <span>Youth Computing · Plateforme de gestion et d'analyse</span>
            <span>React · FastAPI · PostgreSQL</span>
          </footer>

        </div>
      </main>
    </div>
  );
}

export default App;
