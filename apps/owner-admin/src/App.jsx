import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { fitzy } from './api/fitzyClient';

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const STATUS_DESCRIPTIONS = {
  pending: 'Esperando aprobación',
  approved: 'Activo en la red Fitzy',
  rejected: 'Rechazado',
};

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? 'Desconocido';
  return <span className={`status-pill status-pill--${status ?? 'pending'}`}>{label}</span>;
}

function formatDate(value, options = {}) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin registro';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: options.time ? 'short' : undefined,
  }).format(date);
}

const relativeFormatter = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });

function formatRelative(value) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin registro';
  const diffMs = date.getTime() - Date.now();
  const minutes = diffMs / 60000;
  if (Math.abs(minutes) < 60) {
    return relativeFormatter.format(Math.round(minutes), 'minute');
  }
  const hours = minutes / 60;
  if (Math.abs(hours) < 24) {
    return relativeFormatter.format(Math.round(hours), 'hour');
  }
  const days = hours / 24;
  return relativeFormatter.format(Math.round(days), 'day');
}

function formatLongestPending(hours) {
  if (!hours || hours <= 0) return '—';
  if (hours < 24) {
    return `${Math.max(1, Math.round(hours))} h`;
  }
  return `${Math.max(1, Math.round(hours / 24))} d`;
}

const defaultOwnerEmail = import.meta.env?.VITE_OWNER_EMAIL ?? 'test@example.com';

function App() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState({
    email: defaultOwnerEmail,
    password: '',
  });
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [venues, setVenues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [note, setNote] = useState('');
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [actionsLoading, setActionsLoading] = useState({
    approving: false,
    rejecting: false,
  });
  const [toast, setToast] = useState('');

  const toastRef = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastRef.current) {
      clearTimeout(toastRef.current);
    }
    toastRef.current = setTimeout(() => setToast(''), 4000);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const me = await fitzy.auth.me();
        if (!active) return;
        if (me && me.role === 'owner') {
          setUser(me);
          setAuthState('authenticated');
          return;
        }
      } catch (error) {
        // ignored
      }
      if (active) {
        setAuthState('unauthenticated');
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastRef.current) {
        clearTimeout(toastRef.current);
      }
    };
  }, []);

  const handleLoginFieldChange = (field, value) => {
    setLoginForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const extractErrorMessage = (error, fallback) => {
    const response = error?.response?.data;
    if (response?.errors) {
      const first = Object.values(response.errors)
        .flat()
        .find((item) => typeof item === 'string' && item.length > 0);
      if (first) return first;
    }
    if (typeof response?.message === 'string') {
      return response.message;
    }
    if (typeof error?.message === 'string') {
      return error.message;
    }
    return fallback;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loginSubmitting) return;

    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (!email || !password) {
      setLoginError('Ingresa tu correo y contraseña de propietario.');
      return;
    }

    setLoginSubmitting(true);
    setLoginError('');

    try {
      const nextUser = await fitzy.auth.login({
        email,
        password,
        deviceName: 'owner-admin-web',
      });

      if (nextUser?.role !== 'owner') {
        throw new Error('Necesitas una cuenta de propietario para acceder.');
      }

      setUser(nextUser);
      setAuthState('authenticated');
      showToast('Sesión iniciada');
    } catch (error) {
      setAuthState('unauthenticated');
      setLoginError(
        extractErrorMessage(
          error,
          'No pudimos iniciar sesión. Verifica tus credenciales.'
        )
      );
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fitzy.auth.logout();
    } catch (error) {
      // ignore network errors
    }
    setUser(null);
    setAuthState('unauthenticated');
    setVenues([]);
    setSelectedVenueId(null);
    setNote('');
    showToast('Sesión finalizada');
  };

  const refreshVenues = useCallback(async () => {
    if (loadingVenues) return;
    setLoadingVenues(true);
    try {
      const data = await fitzy.entities.Venue.filter(
        { with_admins: 1 },
        '-created_at'
      );
      if (Array.isArray(data)) {
        setVenues(data);
      } else {
        setVenues([]);
      }
    } catch (error) {
      showToast(
        extractErrorMessage(
          error,
          'No pudimos cargar los venues. Intenta nuevamente.'
        )
      );
    } finally {
      setLoadingVenues(false);
    }
  }, [loadingVenues, showToast]);

  useEffect(() => {
    if (authState === 'authenticated') {
      refreshVenues();
    }
  }, [authState, refreshVenues]);

  const filteredVenues = useMemo(() => {
    if (!Array.isArray(venues)) return [];
    if (statusFilter === 'all') {
      return venues;
    }
    return venues.filter((venue) => (venue.status ?? 'pending') === statusFilter);
  }, [venues, statusFilter]);

  useEffect(() => {
    if (filteredVenues.length === 0) {
      setSelectedVenueId(null);
      return;
    }
    const exists = filteredVenues.some((venue) => venue.id === selectedVenueId);
    if (!exists) {
      setSelectedVenueId(filteredVenues[0].id);
      setNote('');
    }
  }, [filteredVenues, selectedVenueId]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [venues, selectedVenueId]
  );

  const metrics = useMemo(() => {
    const now = Date.now();
    const pendingList = [];
    let approvedThisMonth = 0;
    let rejectedCount = 0;
    let longestPendingHours = 0;
    let escalated = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    venues.forEach((venue) => {
      const status = venue.status ?? 'pending';
      if (status === 'pending') {
        pendingList.push(venue);
        const createdAt = new Date(venue.created_at ?? venue.updated_at ?? now);
        const hours = (now - createdAt.getTime()) / 36e5;
        longestPendingHours = Math.max(longestPendingHours, hours);
        if (hours > 48) {
          escalated += 1;
        }
      } else if (status === 'approved') {
        if (venue.approved_at) {
          const approvedAt = new Date(venue.approved_at);
          if (
            approvedAt.getMonth() === currentMonth &&
            approvedAt.getFullYear() === currentYear
          ) {
            approvedThisMonth += 1;
          }
        }
      } else if (status === 'rejected') {
        rejectedCount += 1;
      }
    });

    return {
      pending: pendingList.length,
      escalated,
      approvedThisMonth,
      rejectedCount,
      longestPendingHours,
    };
  }, [venues]);

  const handleDecision = async (type) => {
    if (!selectedVenueId || actionsLoading.approving || actionsLoading.rejecting) {
      return;
    }

    const key = type === 'approve' ? 'approving' : 'rejecting';
    setActionsLoading((prev) => ({
      ...prev,
      [key]: true,
    }));

    try {
      const payload = note.trim() ? { note: note.trim() } : {};
      const updated =
        type === 'approve'
          ? await fitzy.entities.Venue.approve(selectedVenueId, payload)
          : await fitzy.entities.Venue.reject(selectedVenueId, payload);

      setVenues((prev) =>
        prev.map((venue) => (venue.id === updated.id ? updated : venue))
      );
      setNote('');

      showToast(
        type === 'approve' ? 'Venue aprobado y activado.' : 'Solicitud rechazada.'
      );
    } catch (error) {
      showToast(
        extractErrorMessage(error, 'No se pudo actualizar el estado del venue.')
      );
    } finally {
      setActionsLoading((prev) => ({
        ...prev,
        [key]: false,
      }));
    }
  };

  const contacts = useMemo(() => {
    if (!selectedVenue) return [];
    return (
      selectedVenue.venue_admins ??
      selectedVenue.venueAdmins ??
      []
    );
  }, [selectedVenue]);

  if (authState !== 'authenticated' || !user) {
    return (
      <div className="owner-shell">
        <div className="login-card">
          <div className="login-card__header">
            <div className="brand-mark">
              <span className="brand-icon">⚡️</span>
            </div>
            <div>
              <p className="eyebrow">Panel de aprobación</p>
              <h1>Acceso de propietarios</h1>
              <p>Revisa y aprueba los estudios que quieren sumarse a Fitzy.</p>
            </div>
          </div>

          {loginError ? <p className="login-error">{loginError}</p> : null}

          <form className="login-form" onSubmit={handleLogin}>
            <label className="form-field">
              <span>Correo</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  handleLoginFieldChange('email', event.target.value)
                }
                placeholder="propietario@fitzy.demo"
                autoComplete="email"
              />
            </label>
            <label className="form-field">
              <span>Contraseña</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  handleLoginFieldChange('password', event.target.value)
                }
                placeholder="********"
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              className="primary-btn"
              disabled={loginSubmitting}
            >
              {loginSubmitting ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-shell">
      <div className="owner-layout">
        <header className="owner-header">
          <div>
            <p className="eyebrow">Fitzy / Control de venues</p>
            <h1>Centinela de onboarding</h1>
            <p className="header-subtitle">
              Revisa solicitudes, deja notas operativas y aprueba los venues listos para
              salir a producción.
            </p>
          </div>
          <div className="owner-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={refreshVenues}
              disabled={loadingVenues}
            >
              {loadingVenues ? 'Actualizando...' : 'Actualizar lista'}
            </button>
            <div className="owner-avatar">
              <span>{user?.name?.split(' ')?.[0] ?? user?.email ?? 'Owner'}</span>
              <button type="button" onClick={handleLogout}>
                Salir
              </button>
            </div>
          </div>
        </header>

        <section className="metrics-grid">
          <div className="metric-card">
            <p>Pendientes</p>
            <h2>{metrics.pending}</h2>
            <span>{metrics.escalated} urgentes (&gt;48h)</span>
          </div>
          <div className="metric-card">
            <p>Aprobados este mes</p>
            <h2>{metrics.approvedThisMonth}</h2>
            <span>Meta: 12 nuevos estudios</span>
          </div>
          <div className="metric-card">
            <p>Espera más larga</p>
            <h2>{formatLongestPending(metrics.longestPendingHours)}</h2>
            <span>Desde creación de la solicitud</span>
          </div>
          <div className="metric-card">
            <p>Rechazados</p>
            <h2>{metrics.rejectedCount}</h2>
            <span>Con seguimiento pendiente</span>
          </div>
        </section>

        <div className="owner-content">
          <aside className="venues-panel">
            <div className="tab-bar">
              {['pending', 'approved', 'rejected', 'all'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`tab-btn ${statusFilter === status ? 'tab-btn--active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'Todos' : STATUS_LABELS[status]}
                  {status === 'pending' ? ` (${metrics.pending})` : null}
                </button>
              ))}
            </div>

            <div className="venue-list">
              {filteredVenues.length === 0 ? (
                <p className="empty-state">
                  {loadingVenues
                    ? 'Cargando venues...'
                    : 'No hay solicitudes en este estado.'}
                </p>
              ) : (
                filteredVenues.map((venue) => (
                  <button
                    key={venue.id}
                    type="button"
                    className={`venue-item ${
                      selectedVenueId === venue.id ? 'venue-item--active' : ''
                    }`}
                    onClick={() => {
                      setSelectedVenueId(venue.id);
                      setNote('');
                    }}
                  >
                    <div className="venue-item__header">
                      <strong>{venue.name}</strong>
                      <StatusBadge status={venue.status} />
                    </div>
                    <p>
                      {venue.city ?? 'Ciudad no indicada'}
                      {venue.neighborhood ? ` • ${venue.neighborhood}` : ''}
                    </p>
                    <small>{STATUS_DESCRIPTIONS[venue.status ?? 'pending']}</small>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="detail-panel">
            {selectedVenue ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Solicitud</p>
                    <h2>{selectedVenue.name}</h2>
                    <div className="detail-tags">
                      {selectedVenue.city ? (
                        <span className="tag">{selectedVenue.city}</span>
                      ) : null}
                      {selectedVenue.neighborhood ? (
                        <span className="tag">{selectedVenue.neighborhood}</span>
                      ) : null}
                      {selectedVenue.rating ? (
                        <span className="tag">{selectedVenue.rating.toFixed(1)} ★</span>
                      ) : null}
                    </div>
                  </div>
                  <StatusBadge status={selectedVenue.status} />
                </div>

                <div className="detail-section">
                  <h3>Resumen del estudio</h3>
                  <p>{selectedVenue.description ?? 'Sin descripción'}</p>
                  <dl className="detail-grid">
                    <div>
                      <dt>Registro</dt>
                      <dd>{formatDate(selectedVenue.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Última nota</dt>
                      <dd>{selectedVenue.status_note ?? 'No hay notas por ahora.'}</dd>
                    </div>
                    <div>
                      <dt>Actualizado</dt>
                      <dd>{formatRelative(selectedVenue.updated_at ?? selectedVenue.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Dirección</dt>
                      <dd>{selectedVenue.address ?? 'Sin dirección'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="detail-section">
                  <h3>Administradores vinculados</h3>
                  {contacts.length === 0 ? (
                    <p className="muted">Aún no hay responsables asociados.</p>
                  ) : (
                    <ul className="contacts-list">
                      {contacts.map((admin) => (
                        <li key={admin.id ?? admin.email} className="contact-chip">
                          <div className="avatar">
                            {admin.first_name?.[0]?.toUpperCase() ??
                              admin.name?.[0]?.toUpperCase() ??
                              'VA'}
                          </div>
                          <div>
                            <strong>{admin.name ?? admin.first_name ?? 'Admin'}</strong>
                            <p>{admin.email}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Deja una nota operativa</h3>
                  <textarea
                    className="note-field"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ej. Enviar contrato actualizado antes de aprobar."
                  />
                  <div className="actions-row">
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => handleDecision('reject')}
                      disabled={
                        actionsLoading.rejecting ||
                        selectedVenue.status === 'rejected'
                      }
                    >
                      {actionsLoading.rejecting ? 'Rechazando...' : 'Rechazar'}
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => handleDecision('approve')}
                      disabled={
                        actionsLoading.approving ||
                        selectedVenue.status === 'approved'
                      }
                    >
                      {actionsLoading.approving ? 'Aprobando...' : 'Aprobar y activar'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Selecciona un venue para revisar sus detalles.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {toast ? (
        <div className="toast" role="status" aria-live="assertive">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export default App;
