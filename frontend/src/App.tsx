
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_URL = "https://routewise-mbyc.onrender.com";

type TransportMode = "car" | "train" | "plane" | "bus";

type IconName =
  | "route"
  | "map"
  | "pin"
  | "swap"
  | "arrow"
  | "clock"
  | "distance"
  | "check"
  | "shield"
  | "sparkles"
  | "compass"
  | "menu"
  | "close"
  | "alert"
  | "globe"
  | "navigation"
  | "layers"
  | "car"
  | "external";

interface RouteStop {
  id: number;
  location: string;
  pauseMin: number;
}

interface RouteWaypoint {
  name: string;
  position: [number, number];
}

interface RouteResult {
  origin: string;
  destination: string;
  distance_km: number;
  duration_min: number;
  geometry: {
    type?: string;
    coordinates: [number, number][];
  };
  stops: RouteStop[];
  waypoints: RouteWaypoint[];
  pause_min: number;
}

interface RouteApiResponse {
  origin?: string;
  destination?: string;
  distance_km?: number;
  duration_min?: number;
  geometry?: {
    type?: string;
    coordinates?: [number, number][];
  };
  error?: string;
  message?: string;
}

const iconPaths: Record<IconName, ReactNode> = {
  route: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H12a4 4 0 0 0 4-4V9a4 4 0 0 1 4-4" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  swap: (
    <>
      <path d="m16 3 4 4-4 4" />
      <path d="M4 7h16M8 21l-4-4 4-4" />
      <path d="M20 17H4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  distance: (
    <>
      <path d="M3 17 8 7l4 10 4-7 5 7" />
      <circle cx="3" cy="17" r="1" />
      <circle cx="21" cy="17" r="1" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m16.2 7.8-2.7 5.7-5.7 2.7 2.7-5.7z" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  alert: (
    <>
      <path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </>
  ),
  navigation: (
    <>
      <path d="m3 11 18-8-8 18-2-8z" />
      <path d="m11 13 5-5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  car: (
    <>
      <path d="m5 17-1 3M19 17l1 3M3 13l2-7h14l2 7v4H3z" />
      <path d="M5 13h14M7 17h.01M17 17h.01" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7M10 14 21 3" />
      <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </>
  ),
};

function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function getLeafletPositions(
  coordinates: [number, number][],
): [number, number][] {
  return coordinates.map(([longitude, latitude]) => [
    latitude,
    longitude,
  ]);
}

function FitRoute({
  positions,
}: {
  positions: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, {
        padding: [48, 48],
        maxZoom: 13,
      });
    }
  }, [map, positions]);

  return null;
}

function RouteMap({ result }: { result: RouteResult | null }) {
  const positions = result
    ? getLeafletPositions(result.geometry.coordinates)
    : [];

  const center: LatLngExpression =
    positions.length > 0 ? positions[0] : [34.5, 9.5];

  return (
    <MapContainer
      center={center}
      zoom={6}
      scrollWheelZoom
      className="route-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {positions.length > 0 && result && (
        <>
          <FitRoute positions={positions} />

          <Polyline
            positions={positions}
            pathOptions={{
              color: "#315ce8",
              weight: 5,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          <Marker position={positions[0]}>
            <Popup>
              <strong>Départ</strong>
              <br />
              {result.origin}
            </Popup>
          </Marker>

          {positions.length >= 2 && (
            <Marker position={positions[positions.length - 1]}>
              <Popup>
                <strong>Destination</strong>
                <br />
                {result.destination}
              </Popup>
            </Marker>
          )}

          {result.waypoints.map((waypoint, index) => (
            <Marker
              key={`${waypoint.name}-${index}`}
              position={waypoint.position}
            >
              <Popup>
                <strong>Arrêt {index + 1}</strong>
                <br />
                {waypoint.name}
              </Popup>
            </Marker>
          ))}
        </>
      )}
    </MapContainer>
  );
}

function formatDistance(distance: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(distance);
}

function formatDuration(duration: number): string {
  const totalMinutes = Math.max(0, Math.round(duration));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;

  return `${hours} h ${minutes} min`;
}

const transportOptions: {
  id: TransportMode;
  label: string;
  icon: IconName;
}[] = [
  { id: "car", label: "Voiture", icon: "car" },
  { id: "train", label: "Train", icon: "route" },
  { id: "plane", label: "Avion", icon: "navigation" },
  { id: "bus", label: "Bus", icon: "globe" },
];

function App() {
  const [origin, setOrigin] = useState("Tunis, Tunisia");
  const [destination, setDestination] = useState("Sousse, Tunisia");
  const [transportMode, setTransportMode] =
    useState<TransportMode>("car");
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  function addStop() {
    setStops((current) => [
      ...current,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        location: "",
        pauseMin: 15,
      },
    ]);
    setError("");
  }

  function updateStop(
    id: number,
    changes: Partial<Omit<RouteStop, "id">>,
  ) {
    setStops((current) =>
      current.map((stop) =>
        stop.id === id ? { ...stop, ...changes } : stop,
      ),
    );
  }

  function removeStop(id: number) {
    setStops((current) =>
      current.filter((stop) => stop.id !== id),
    );
    setError("");
  }

  async function calculateRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanOrigin = origin.trim();
    const cleanDestination = destination.trim();

    if (!cleanOrigin || !cleanDestination) {
      setError("Veuillez renseigner le départ et la destination.");
      return;
    }

    if (transportMode !== "car") {
      setError(
        "Le calcul réel pour ce mode de transport n'est pas encore intégré. Sélectionnez Voiture pour calculer un itinéraire routier.",
      );
      return;
    }

    const cleanStops = stops.map((stop) => ({
      ...stop,
      location: stop.location.trim(),
      pauseMin: Math.max(
        0,
        Math.min(1440, Math.round(Number(stop.pauseMin) || 0)),
      ),
    }));

    if (cleanStops.some((stop) => !stop.location)) {
      setError(
        "Renseignez le lieu de chaque arrêt ou supprimez les arrêts vides.",
      );
      return;
    }

    const locations = [
      cleanOrigin,
      ...cleanStops.map((stop) => stop.location),
      cleanDestination,
    ];

    const normalizedLocations = locations.map((place) =>
      place.toLocaleLowerCase(),
    );

    if (new Set(normalizedLocations).size !== normalizedLocations.length) {
      setError(
        "Chaque lieu doit être différent. Vérifiez le départ, les arrêts et la destination.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const segments: {
        data: RouteApiResponse;
        from: string;
        to: string;
      }[] = [];

      for (let index = 0; index < locations.length - 1; index++) {
        const response = await fetch(`${API_URL}/api/route`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: locations[index],
            destination: locations[index + 1],
          }),
        });

        let data: RouteApiResponse;

        try {
          data = (await response.json()) as RouteApiResponse;
        } catch {
          throw new Error("Le serveur a renvoyé une réponse invalide.");
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Impossible de calculer le segment ${index + 1}.`,
          );
        }

        if (
          !data.geometry ||
          !Array.isArray(data.geometry.coordinates) ||
          data.geometry.coordinates.length < 2 ||
          typeof data.distance_km !== "number" ||
          typeof data.duration_min !== "number"
        ) {
          throw new Error(
            `Les données du segment ${index + 1} sont incomplètes.`,
          );
        }

        segments.push({
          data,
          from: locations[index],
          to: locations[index + 1],
        });
      }

      const combinedCoordinates: [number, number][] = [];
      const waypoints: RouteWaypoint[] = [];

      segments.forEach((segment, index) => {
        const coordinates = segment.data.geometry!.coordinates!;

        combinedCoordinates.push(
          ...(index === 0 ? coordinates : coordinates.slice(1)),
        );

        if (index < cleanStops.length) {
          const lastCoordinate = coordinates[coordinates.length - 1];

          waypoints.push({
            name: cleanStops[index].location,
            position: [lastCoordinate[1], lastCoordinate[0]],
          });
        }
      });

      const distance = segments.reduce(
        (total, segment) => total + segment.data.distance_km!,
        0,
      );

      const duration = segments.reduce(
        (total, segment) => total + segment.data.duration_min!,
        0,
      );

      const totalPause = cleanStops.reduce(
        (total, stop) => total + stop.pauseMin,
        0,
      );

      setResult({
        origin: cleanOrigin,
        destination: cleanDestination,
        distance_km: Math.round(distance * 10) / 10,
        duration_min: Math.round(duration),
        geometry: {
          type: "LineString",
          coordinates: combinedCoordinates,
        },
        stops: cleanStops,
        waypoints,
        pause_min: totalPause,
      });

      setMobilePanelOpen(false);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Une erreur inattendue est survenue.";

      setError(
        message.includes("Failed to fetch")
          ? "Impossible de contacter le backend Flask. Vérifiez qu'il fonctionne sur le port 5000."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  function swapLocations() {
    setOrigin(destination);
    setDestination(origin);
    setResult(null);
    setError("");
  }

  function selectTransport(mode: TransportMode) {
    setTransportMode(mode);
    setResult(null);
    setError("");
  }

  function openPlanner() {
    setMobilePanelOpen(true);

    window.setTimeout(() => {
      document
        .querySelector(".sidebar")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          aria-label="RouteWise - Accueil"
          onClick={(event) => {
            event.preventDefault();
            setResult(null);
            setError("");
          }}
        >
          <div className="brand-mark">
            <Icon name="route" size={23} strokeWidth={2} />
          </div>

          <div className="brand-copy">
            <span className="brand-name">
              Route<span>Wise</span>
            </span>
            <span className="brand-tagline">SMART ROUTE PLANNER</span>
          </div>
        </a>

        <div className="topbar-center">
          <span className="live-indicator" />
          Planification intelligente d’itinéraires
        </div>

        <div className="topbar-right">
          <div className="system-status">
            <span className="status-dot" />
            Service disponible
          </div>

          <div className="avatar" aria-label="Profil RouteWise">
            RW
          </div>

          <button
            className="mobile-menu-button"
            type="button"
            aria-label={
              mobilePanelOpen
                ? "Fermer le planificateur"
                : "Ouvrir le planificateur"
            }
            aria-expanded={mobilePanelOpen}
            onClick={() => setMobilePanelOpen((open) => !open)}
          >
            <Icon
              name={mobilePanelOpen ? "close" : "menu"}
              size={20}
            />
          </button>
        </div>
      </header>

      <main className="workspace" id="home">
        <aside
          className={`sidebar${mobilePanelOpen ? " sidebar-open" : ""}`}
        >
          <div className="sidebar-heading">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              YOUR JOURNEY STARTS HERE
            </div>

            <h1>
              Explorez.
              <br />
              Planifiez<span>.</span>
              <br />
              Avancez.
            </h1>

            <p className="sidebar-description">
              Organisez votre trajet, ajoutez des étapes et visualisez
              votre parcours sur une carte interactive.
            </p>
          </div>

          <section className="planner-card">
            <div className="section-heading">
              <div className="section-icon">
                <Icon name="compass" size={20} />
              </div>

              <div>
                <h2>Planifier un trajet</h2>
                <p>Personnalisez votre prochain voyage.</p>
              </div>
            </div>

            <form onSubmit={calculateRoute}>
              <div className="transport-selector">
                <span className="field-label">MODE DE TRANSPORT</span>

                <div className="transport-options">
                  {transportOptions.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      className={`transport-option ${
                        transportMode === mode.id
                          ? "transport-option-active"
                          : ""
                      }`}
                      aria-pressed={transportMode === mode.id}
                      onClick={() => selectTransport(mode.id)}
                    >
                      <Icon name={mode.icon} size={18} />
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>

                {transportMode !== "car" && (
                  <p className="transport-notice">
                    Les horaires, disponibilités et tarifs de ce mode
                    nécessitent une source de données dédiée. Le calcul
                    est actuellement disponible en voiture.
                  </p>
                )}
              </div>

              <div className="location-fields">
                <div className="location-field">
                  <span className="field-symbol departure-symbol">
                    <Icon name="pin" size={18} />
                  </span>

                  <label htmlFor="origin">POINT DE DÉPART</label>

                  <input
                    id="origin"
                    name="origin"
                    type="text"
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                    placeholder="Ex. Tunis, Tunisia"
                    autoComplete="off"
                    required
                  />
                </div>

                <span className="location-connector" aria-hidden="true" />

                <button
                  className="swap-button"
                  type="button"
                  onClick={swapLocations}
                  aria-label="Inverser le départ et la destination"
                  title="Inverser les lieux"
                >
                  <Icon name="swap" size={15} />
                </button>

                <div className="location-field">
                  <span className="field-symbol arrival-symbol">
                    <Icon name="pin" size={18} />
                  </span>

                  <label htmlFor="destination">DESTINATION</label>

                  <input
                    id="destination"
                    name="destination"
                    type="text"
                    value={destination}
                    onChange={(event) =>
                      setDestination(event.target.value)
                    }
                    placeholder="Ex. Sousse, Tunisia"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <div className="stops-section">
                <div className="stops-heading">
                  <div>
                    <h3>Étapes et pauses</h3>
                    <p>Ajoutez des arrêts sur votre parcours.</p>
                  </div>

                  <button
                    className="add-stop-button"
                    type="button"
                    onClick={addStop}
                  >
                    + Ajouter un arrêt
                  </button>
                </div>

                {stops.map((stop, index) => (
                  <div className="stop-card" key={stop.id}>
                    <div className="stop-card-heading">
                      <span className="stop-number">{index + 1}</span>
                      <strong>Arrêt intermédiaire</strong>

                      <button
                        type="button"
                        className="remove-stop-button"
                        onClick={() => removeStop(stop.id)}
                        aria-label={`Supprimer l'arrêt ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>

                    <label htmlFor={`stop-${stop.id}`}>
                      LIEU DE L'ARRÊT
                    </label>

                    <input
                      id={`stop-${stop.id}`}
                      type="text"
                      value={stop.location}
                      onChange={(event) =>
                        updateStop(stop.id, {
                          location: event.target.value,
                        })
                      }
                      placeholder="Ex. Hammamet, Tunisia"
                      autoComplete="off"
                    />

                    <label htmlFor={`pause-${stop.id}`}>
                      DURÉE DE LA PAUSE
                    </label>

                    <select
                      id={`pause-${stop.id}`}
                      value={stop.pauseMin}
                      onChange={(event) =>
                        updateStop(stop.id, {
                          pauseMin: Number(event.target.value),
                        })
                      }
                    >
                      <option value={0}>Sans pause</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 heure</option>
                      <option value={90}>1 h 30</option>
                      <option value={120}>2 heures</option>
                    </select>
                  </div>
                ))}
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner" />
                    Calcul de l’itinéraire...
                  </>
                ) : (
                  <>
                    <span>Calculer mon itinéraire</span>
                    <Icon name="arrow" size={18} />
                  </>
                )}
              </button>

              <div className="secure-note">
                <Icon name="shield" size={13} />
                Calcul routier via OpenStreetMap et OSRM
              </div>

              {error && (
                <div className="error-message" role="alert">
                  <Icon name="alert" size={17} />
                  <span>{error}</span>
                </div>
              )}
            </form>
          </section>

          {result ? (
            <section className="result-card" aria-live="polite">
              <div className="result-heading">
                <div>
                  <span className="result-kicker">VOTRE ITINÉRAIRE</span>
                  <h2>Trajet calculé</h2>
                </div>

                <div className="success-icon">
                  <Icon name="check" size={18} />
                </div>
              </div>

              <div className="metric-grid">
                <div className="metric">
                  <div className="metric-icon distance-icon">
                    <Icon name="distance" size={17} />
                  </div>

                  <span className="metric-label">DISTANCE</span>

                  <strong>
                    {formatDistance(result.distance_km)}
                    <small> km</small>
                  </strong>
                </div>

                <div className="metric">
                  <div className="metric-icon duration-icon">
                    <Icon name="clock" size={17} />
                  </div>

                  <span className="metric-label">DURÉE TOTALE</span>

                  <strong>
                    {formatDuration(
                      result.duration_min + result.pause_min,
                    )}
                  </strong>
                </div>
              </div>

              <div className="result-route">
                <div className="result-route-line">
                  <span className="route-node route-node-start" />
                  <span className="route-node-line" />
                  <span className="route-node route-node-end" />
                </div>

                <div className="result-route-labels">
                  <div>
                    <span>Départ</span>
                    <strong>{result.origin}</strong>
                  </div>

                  <div>
                    <span>Destination</span>
                    <strong>{result.destination}</strong>
                  </div>
                </div>
              </div>

              {result.stops.length > 0 && (
                <div className="result-stops">
                  <strong>Vos étapes</strong>

                  {result.stops.map((stop, index) => (
                    <div className="result-stop-row" key={stop.id}>
                      <span>
                        {index + 1}. {stop.location}
                      </span>

                      <span>
                        {stop.pauseMin > 0
                          ? `Pause : ${formatDuration(stop.pauseMin)}`
                          : "Sans pause"}
                      </span>
                    </div>
                  ))}

                  <div className="pause-summary">
                    Temps total des pauses :{" "}
                    {formatDuration(result.pause_min)}
                  </div>
                </div>
              )}

              <div className="result-footnote">
                <Icon name="car" size={14} />
                Durée routière indicative, pauses incluses dans la durée
                totale.
              </div>
            </section>
          ) : (
            <section className="empty-card">
              <div className="empty-illustration">
                <span className="empty-orbit orbit-one" />
                <span className="empty-orbit orbit-two" />
                <span className="orbit-point point-one" />
                <span className="orbit-point point-two" />

                <div className="empty-center">
                  <Icon name="route" size={25} />
                </div>
              </div>

              <h3>Votre prochaine destination</h3>

              <p>
                Choisissez votre trajet, ajoutez des étapes et découvrez
                la distance et la durée estimée.
              </p>

              <div className="empty-hint">
                <Icon name="sparkles" size={13} />
                Votre itinéraire en quelques secondes
              </div>
            </section>
          )}

          <div className="sidebar-bottom">
            <div className="sidebar-bottom-icon">
              <Icon name="globe" size={19} />
            </div>

            <div>
              <strong>Explorez en toute simplicité</strong>
              <span>Des itinéraires, une vue claire.</span>
            </div>
          </div>
        </aside>

        <section className="map-workspace">
          <div className="map-toolbar">
            <div className="map-title">
              <div className="map-title-icon">
                <Icon name="map" size={21} />
              </div>

              <div>
                <h2>Carte interactive</h2>
                <p>Visualisez votre trajet et vos arrêts.</p>
              </div>
            </div>

            <div className="map-toolbar-right">
              <div className="map-provider">
                <span className="provider-dot" />
                OpenStreetMap
              </div>

              <div className="map-live-pill">
                <Icon name="navigation" size={13} />
                {transportMode === "car"
                  ? "Vue routière"
                  : `Mode ${transportOptions.find(
                      (mode) => mode.id === transportMode,
                    )?.label.toLowerCase()}`}
              </div>
            </div>
          </div>

          <div className="map-stage">
            <div className="map-background-accent" />

            <div className="map-frame">
              <RouteMap result={result} />
            </div>

            {!result && !loading && (
              <div className="map-welcome">
                <div className="welcome-topline">
                  <span className="welcome-sparkle">
                    <Icon name="sparkles" size={16} />
                  </span>
                  DISCOVER YOUR NEXT JOURNEY
                </div>

                <h2>
                  Le monde
                  <br />
                  est à votre <span>portée.</span>
                </h2>

                <p>
                  Préparez votre trajet, personnalisez vos étapes et
                  explorez votre itinéraire sur la carte.
                </p>

                <button
                  className="welcome-action"
                  type="button"
                  onClick={openPlanner}
                >
                  Planifier un trajet
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            )}

            {loading && (
              <div className="map-loading-card" role="status">
                <span className="button-spinner" />
                Calcul de votre itinéraire...
              </div>
            )}

            {result && (
              <div className="map-route-badge">
                <div className="map-route-badge-icon">
                  <Icon name="check" size={19} />
                </div>

                <div className="map-route-badge-copy">
                  <span>ITINÉRAIRE DISPONIBLE</span>
                  <strong>
                    {formatDistance(result.distance_km)} km
                    <span className="badge-separator">·</span>
                    {formatDuration(
                      result.duration_min + result.pause_min,
                    )}
                  </strong>
                </div>
              </div>
            )}

            <div className="map-attribution">
              <Icon name="globe" size={12} />
              © OpenStreetMap contributors
            </div>

            <div className="map-controls">
              <div className="map-control-label">
                <span className="map-control-dot" />
                MAP VIEW
              </div>

              <span className="map-control-divider" />

              <span className="map-control-caption">
                {result ? "Itinéraire routier" : "Vue générale"}
              </span>
            </div>
          </div>

          <footer className="map-footer">
            <div className="footer-left">
              <span className="footer-brand-mark">
                <Icon name="route" size={14} />
              </span>

              <span>
                Propulsé par <strong>RouteWise</strong>
              </span>
            </div>

            <div className="footer-right">
              <span>
                <span className="footer-status-dot" />
                Carte disponible
              </span>

              <span className="footer-divider" />

              <span>OpenStreetMap · OSRM</span>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;