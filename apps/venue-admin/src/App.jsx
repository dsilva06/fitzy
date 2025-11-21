import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { fitzy } from './api/fitzyClient';
import venezuelaLocations from './data/venezuelaLocations.json';
import urbanizationsByCity from './data/urbanizationsByCity.json';

const FALLBACK_USER = {
  id: 'demo-user',
  username: 'daniela',
  firstName: 'Daniela',
  lastName: 'Santos',
  email: 'daniela@fitzy.demo',
  role: 'admin',
  venueName: 'Fitzy Downtown',
  venueId: 1,
  venue: { id: 1, name: 'Fitzy Downtown' },
  avatarUrl:
    'https://api.dicebear.com/7.x/initials/svg?seed=DS&backgroundType=gradientLinear&fontWeight=700',
};

const FALLBACK_CLASS_TYPES = [
  { id: 1, name: 'HIIT', description: 'Entrenamiento interválico de alta intensidad.' },
  { id: 2, name: 'Yoga', description: 'Flujos conscientes y movilidad.' },
];

const FALLBACK_INSTRUCTORS = [
  {
    id: 'inst-1',
    name: 'Lucía Fernández',
    email: 'lucia@fitzy.demo',
    avatar:
      'https://api.dicebear.com/7.x/initials/svg?seed=LF&backgroundColor=5865F2&fontWeight=700',
  },
  {
    id: 'inst-2',
    name: 'Carlos Méndez',
    email: 'carlos@fitzy.demo',
    avatar:
      'https://api.dicebear.com/7.x/initials/svg?seed=CM&backgroundColor=22D3EE&fontWeight=700',
  },
  {
    id: 'inst-3',
    name: 'Sofía Rivas',
    email: 'sofia@fitzy.demo',
    avatar:
      'https://api.dicebear.com/7.x/initials/svg?seed=SR&backgroundColor=4752C4&fontWeight=700',
  },
];

const FALLBACK_ROOMS = [
  { id: 1, name: 'Sala Principal' },
  { id: 2, name: 'Sala Zen' },
];

const FALLBACK_CLASSES = [
  {
    id: 'cls-1',
    name: 'HIIT 45',
    title: 'HIIT 45',
    capacity: 16,
    instructorId: 'inst-1',
    typeId: 1,
    roomId: 1,
    start: buildDateTime(addDays(new Date(), 0), '09:00'),
    end: buildDateTime(addDays(new Date(), 0), '09:45'),
    booked: 16,
    waitlistCount: 3,
    waitlist: [
      { id: 'wl-1', name: 'Ana Gómez', email: 'ana@example.com' },
      { id: 'wl-2', name: 'Luis Ortega', email: 'luis@example.com' },
      { id: 'wl-3', name: 'Valeria Ruiz', email: 'valeria@example.com' },
    ],
  },
  {
    id: 'cls-2',
    name: 'Yoga Flow',
    title: 'Yoga Flow',
    capacity: 12,
    instructorId: 'inst-3',
    typeId: 2,
    roomId: 2,
    start: buildDateTime(addDays(new Date(), 0), '18:30'),
    end: buildDateTime(addDays(new Date(), 0), '19:30'),
    booked: 10,
    waitlistCount: 0,
    waitlist: [],
  },
  {
    id: 'cls-3',
    name: 'Funcional Express',
    title: 'Funcional Express',
    capacity: 10,
    instructorId: 'inst-2',
    typeId: 1,
    roomId: 1,
    start: buildDateTime(addDays(new Date(), 2), '07:30'),
    end: buildDateTime(addDays(new Date(), 2), '08:15'),
    booked: 8,
    waitlistCount: 1,
    waitlist: [{ id: 'wl-4', name: 'Pedro Márquez', email: 'pedro@example.com' }],
  },
];

const WEEKDAY_OPTIONS = [
  { key: 'mon', label: 'L', name: 'Lunes' },
  { key: 'tue', label: 'M', name: 'Martes' },
  { key: 'wed', label: 'X', name: 'Miércoles' },
  { key: 'thu', label: 'J', name: 'Jueves' },
  { key: 'fri', label: 'V', name: 'Viernes' },
  { key: 'sat', label: 'S', name: 'Sábado' },
  { key: 'sun', label: 'D', name: 'Domingo' },
];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildDateTime(date, time) {
  const formattedDate = formatDateInput(date);
  return `${formattedDate}T${time}`;
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date();
  date.setFullYear(year ?? date.getFullYear());
  date.setMonth((month ?? 1) - 1);
  date.setDate(day ?? 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateId(date) {
  if (typeof date === 'string') return date.slice(0, 10);
  return formatDateInput(date);
}

function startOfMonth(date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return startOfMonth(next);
}

const DAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function slugifyLocation(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeLocationKey(stateName, cityName) {
  return slugifyLocation(`${stateName ?? ''}-${cityName ?? ''}`);
}

function buildUrbanizationLookup(data) {
  if (!Array.isArray(data)) return {};

  return data.reduce((acc, entry) => {
    const state = entry?.state?.trim();
    const city = entry?.city?.trim();
    const key = normalizeLocationKey(state, city);
    const items = Array.isArray(entry?.urbanizations) ? entry.urbanizations : [];
    const uniqueUrbanizations = Array.from(
      new Set(
        items
          .map((name) => (name ?? '').trim())
          .filter(Boolean)
      )
    );

    if (key && uniqueUrbanizations.length > 0) {
      acc[key] = uniqueUrbanizations;
    }

    return acc;
  }, {});
}

function splitFullName(input) {
  const normalized = String(input ?? '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return { firstName: '', lastName: '' };
  }

  const parts = normalized.split(' ');

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
}

function buildLocationOptions(data) {
  if (!Array.isArray(data)) {
    return {
      states: [],
      stateLookup: {},
      cityLookup: {},
      citiesByState: {},
    };
  }

  const states = [];
  const stateLookup = {};
  const cityLookup = {};
  const citiesByState = {};

  data.forEach((state, stateIndex) => {
    const stateName = state?.estado?.trim();
    if (!stateName) return;

    const stateSlug = slugifyLocation(
      `${stateName}-${state?.id_estado ?? stateIndex}`
    );

    const stateOption = {
      value: stateSlug,
      label: stateName,
      code: state?.iso_31662 ?? null,
      capital: state?.capital?.trim() ?? '',
    };

    states.push(stateOption);
    stateLookup[stateSlug] = {
      ...stateOption,
      municipios: Array.isArray(state?.municipios) ? state.municipios : [],
    };

    const municipios = stateLookup[stateSlug].municipios;

    municipios.forEach((municipio, municipioIndex) => {
      const municipalityName = municipio?.municipio?.trim();
      const capitalName = (municipio?.capital ?? municipalityName ?? '').trim();

      if (!capitalName) return;

      const citySlug = slugifyLocation(
        `${stateSlug}-${municipalityName ?? capitalName}-${municipioIndex}`
      );

      const uniqueZones = Array.from(
        new Set(
          (municipio?.parroquias ?? [])
            .map((name) => (name ?? '').trim())
            .filter(Boolean)
        )
      );

      const cityKey = normalizeLocationKey(stateName, capitalName);
      const customUrbanizations = URBANIZATION_LOOKUP[cityKey] ?? null;
      const zones =
        customUrbanizations?.length > 0
          ? customUrbanizations
          : uniqueZones.length > 0
            ? uniqueZones
            : [capitalName];

      const cityOption = {
        value: citySlug,
        label: `${capitalName} (${stateName})`,
        city: capitalName,
        municipality: municipalityName ?? capitalName,
        state: stateName,
        stateValue: stateSlug,
        zones,
        hasUrbanizationOverrides: Boolean(customUrbanizations?.length),
      };

      cityLookup[citySlug] = cityOption;

      if (!citiesByState[stateSlug]) {
        citiesByState[stateSlug] = [];
      }

      citiesByState[stateSlug].push(cityOption);
    });
  });

  states.sort((a, b) =>
    a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
  );

  Object.values(citiesByState).forEach((cityList) => {
    cityList.sort((a, b) =>
      a.city.localeCompare(b.city, 'es', { sensitivity: 'base' })
    );
  });

  return {
    states,
    stateLookup,
    cityLookup,
    citiesByState,
  };
}

const URBANIZATION_LOOKUP = buildUrbanizationLookup(urbanizationsByCity);

// Dataset sourced from https://github.com/zokeber/venezuela-json
const {
  states: STATE_OPTIONS,
  cityLookup: CITY_LOOKUP,
  citiesByState: CITIES_BY_STATE,
} = buildLocationOptions(venezuelaLocations);

function getDayKey(date) {
  return DAY_KEY_BY_INDEX[date.getDay()];
}

const RRULE_DAY_BY_KEY = {
  mon: 'MO',
  tue: 'TU',
  wed: 'WE',
  thu: 'TH',
  fri: 'FR',
  sat: 'SA',
  sun: 'SU',
};

const DAY_KEY_BY_RRULE = {
  MO: 'mon',
  TU: 'tue',
  WE: 'wed',
  TH: 'thu',
  FR: 'fri',
  SA: 'sat',
  SU: 'sun',
};

function toRRuleDay(dayKey) {
  return RRULE_DAY_BY_KEY[dayKey] ?? 'MO';
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function getMonthMatrix(monthDate) {
  const firstDayOfMonth = startOfMonth(monthDate);
  const calendarStart = startOfWeek(firstDayOfMonth);
  const matrix = [];

  for (let week = 0; week < 6; week += 1) {
    const row = [];
    for (let day = 0; day < 7; day += 1) {
      const cellDate = new Date(calendarStart);
      cellDate.setDate(calendarStart.getDate() + week * 7 + day);
      row.push(cellDate);
    }
    matrix.push(row);
  }

  return matrix;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return toDateId(a) === toDateId(b);
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString.split('T')[1]?.slice(0, 5) ?? '--:--';
  }
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function computeEndTime(date, time, duration) {
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + Number(duration ?? 0));
  const endHours = String(end.getHours()).padStart(2, '0');
  const endMinutes = String(end.getMinutes()).padStart(2, '0');
  return `${formatDateInput(end)}T${endHours}:${endMinutes}`;
}

function timeRange(start, end) {
  return `${formatTime(start)}–${formatTime(end)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatCurrency(value) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeSession(input) {
  if (!input) return null;

  const start = input.start_datetime ?? input.start ?? null;
  const end =
    input.end_datetime ??
    input.end ??
    (start ? computeEndTime(parseDateInput(start.slice(0, 10)), start.slice(11, 16), 60) : null);

  const waitlistEntries = Array.isArray(input.waitlistEntries)
    ? input.waitlistEntries
    : Array.isArray(input.waitlist_entries)
    ? input.waitlist_entries
    : input.waitlist ?? [];

  const mappedWaitlist = waitlistEntries
    .map((entry) => {
      const user = entry.user ?? {};
      const name =
        entry.name ??
        user.name ??
        [user.first_name, user.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
      return {
        id: entry.id ?? `wl-${Math.random().toString(16).slice(2, 8)}`,
        name: name || 'Cliente',
        email: entry.email ?? user.email ?? '',
      };
    })
    .filter(Boolean);

  const typeId =
    input.class_type_id ??
    input.classTypeId ??
    input.type_id ??
    input.typeId ??
    input.class_type?.id ??
    null;

  const name = input.name ?? input.title ?? 'Nueva clase';

  return {
    id: input.id ?? `tmp-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    name,
    title: name,
    capacity: input.capacity_total ?? input.capacity ?? 0,
    instructorId:
      input.instructor_id ??
      input.instructorId ??
      input.instructor?.id ??
      null,
    instructor: input.instructor ?? null,
    typeId,
    roomId: input.room_id ?? input.roomId ?? input.room?.id ?? null,
    room: input.room ?? null,
    start,
    end,
    booked:
      input.bookings_confirmed_count ??
      input.capacity_taken ??
      input.booked ??
      0,
    waitlistCount:
      input.waitlist_active_count ??
      input.waitlistCount ??
      mappedWaitlist.length,
    waitlist: mappedWaitlist,
    raw: input,
    classTypeId: typeId,
  };
}

function normalizeInstructor(input) {
  if (!input) return null;
  const numericId =
    typeof input.id === 'number'
      ? input.id
      : Number(input.id ?? input.value ?? NaN);
  return {
    id: String(input.id ?? input.value ?? `inst-${Math.random().toString(16).slice(2, 8)}`),
    name: input.name ?? input.label ?? 'Instructor',
    email: input.email ?? '',
    avatar:
      input.avatar ??
      input.avatar_url ??
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        (input.name ?? 'IN')[0] ?? 'I'
      )}`,
    venueId: input.venue_id ?? input.venueId ?? input.venue?.id ?? null,
    numericId: Number.isFinite(numericId) ? numericId : null,
    raw: input,
  };
}

function normalizeClassType(input) {
  if (!input) return null;
  const numericId =
    typeof input.id === 'number'
      ? input.id
      : Number(input.id ?? input.value ?? NaN);
  return {
    id: String(input.id ?? input.value ?? ''),
    name: input.name ?? input.label ?? '',
    description: input.description ?? '',
    numericId: Number.isFinite(numericId) ? numericId : null,
    raw: input,
  };
}

function normalizeRoom(input) {
  if (!input) return null;
  const numericId =
    typeof input.id === 'number'
      ? input.id
      : Number(input.id ?? input.value ?? NaN);
  return {
    id: String(input.id ?? input.value ?? ''),
    name: input.name ?? input.label ?? 'Sala',
    numericId: Number.isFinite(numericId) ? numericId : null,
    raw: input,
  };
}

function normalizeUser(apiUser) {
  if (!apiUser) return FALLBACK_USER;

  const venue =
    apiUser.venue ??
    apiUser.venue_data ??
    (apiUser.venueId
      ? { id: apiUser.venueId, name: apiUser.venueName }
      : null);

  const firstName =
    apiUser.first_name ??
    apiUser.firstName ??
    (apiUser.name ? apiUser.name.split(' ')[0] : FALLBACK_USER.firstName);
  const lastName =
    apiUser.last_name ??
    apiUser.lastName ??
    (apiUser.name ? apiUser.name.split(' ').slice(1).join(' ') : FALLBACK_USER.lastName);

  return {
    id: apiUser.id ?? FALLBACK_USER.id,
    username: apiUser.username ?? apiUser.email?.split('@')[0] ?? FALLBACK_USER.username,
    firstName: firstName ?? FALLBACK_USER.firstName,
    lastName: lastName ?? FALLBACK_USER.lastName,
    email: apiUser.email ?? FALLBACK_USER.email,
    role: apiUser.role ?? FALLBACK_USER.role,
    venueName: venue?.name ?? apiUser.venueName ?? FALLBACK_USER.venueName,
    venueId: venue?.id ?? apiUser.venue_id ?? FALLBACK_USER.venueId,
    venue,
    avatarUrl: apiUser.profile_picture_url ?? FALLBACK_USER.avatarUrl,
  };
}

function generateRecurringInstances(baseDate, form, basePayload) {
  const repeat = form.repeat ?? {};
  if (!repeat.enabled) return [];

  const desiredOccurrences = Math.min(
    Math.max(Number(repeat.count ?? 0), 0),
    6
  );
  if (desiredOccurrences <= 0) return [];

  const maxOccurrences = desiredOccurrences;
  const occurrences = [];
  const baseStart = new Date(baseDate);
  const untilBoundary = repeat.until ? parseDateInput(repeat.until) : null;

  const pushOccurrence = (date) => {
    if (occurrences.length >= maxOccurrences) return;
    if (date <= baseStart) return;
    if (untilBoundary && date > untilBoundary) return;

    const dateStr = formatDateInput(date);
    const startIso = `${dateStr}T${form.time}`;
    const endIso = computeEndTime(date, form.time, form.duration);

    occurrences.push({
      ...basePayload,
      start_datetime: startIso,
      end_datetime: endIso,
    });
  };

  const freq = repeat.freq ?? 'WEEKLY';

  if (freq === 'DAILY') {
    let cursor = new Date(baseStart);
    while (occurrences.length < maxOccurrences) {
      cursor = addDays(cursor, 1);
      if (untilBoundary && cursor > untilBoundary) break;
      pushOccurrence(cursor);
    }
    return occurrences;
  }

  if (freq === 'WEEKLY') {
    const daysSet = new Set(
      (Array.isArray(repeat.byDay) ? repeat.byDay : [])
        .map((value) => value?.toString().toUpperCase())
        .filter(Boolean)
    );
    let cursor = new Date(baseStart);
    cursor = addDays(cursor, 1);
    while (occurrences.length < maxOccurrences) {
      if (untilBoundary && cursor > untilBoundary) break;
      const rruleDay = toRRuleDay(getDayKey(cursor));
      if (daysSet.size === 0 || daysSet.has(rruleDay)) {
        pushOccurrence(cursor);
      }
      cursor = addDays(cursor, 1);
    }
    return occurrences;
  }

  if (freq === 'MONTHLY') {
    for (let i = 1; i <= maxOccurrences; i += 1) {
      const next = new Date(baseStart);
      next.setMonth(next.getMonth() + i);
      pushOccurrence(next);
      if (occurrences.length >= maxOccurrences) break;
    }
    return occurrences;
  }

  return occurrences;
}

function resolveDateRange(rangeKey, customStart, customEnd) {
  const now = new Date();
  const todayEnd = endOfDay(now);

  switch (rangeKey) {
    case '7d': {
      return {
        start: startOfDay(addDays(todayEnd, -6)),
        end: todayEnd,
      };
    }
    case '30d': {
      return {
        start: startOfDay(addDays(todayEnd, -29)),
        end: todayEnd,
      };
    }
    case '6m': {
      const sixMonthsAgo = new Date(todayEnd.getFullYear(), todayEnd.getMonth() - 5, 1);
      return {
        start: startOfDay(sixMonthsAgo),
        end: todayEnd,
      };
    }
    case 'ytd': {
      const yearStart = new Date(todayEnd.getFullYear(), 0, 1);
      return {
        start: startOfDay(yearStart),
        end: todayEnd,
      };
    }
    case 'custom': {
      const startValue = customStart ? parseDateInput(customStart) : addDays(todayEnd, -6);
      const endValue = customEnd ? parseDateInput(customEnd) : todayEnd;
      const startDate = startOfDay(startValue);
      const endDate = endOfDay(endValue);
      if (startDate > endDate) {
        return {
          start: endOfDay(endValue),
          end: endOfDay(endValue),
        };
      }
      return {
        start: startDate,
        end: endDate,
      };
    }
    default:
      return {
        start: startOfDay(addDays(todayEnd, -29)),
        end: todayEnd,
      };
  }
}

function resolveInterval(rangeKey, intervalKey, start, end) {
  if (intervalKey && intervalKey !== 'auto') return intervalKey;

  if (rangeKey === '7d') return 'day';
  if (rangeKey === '30d') return 'day';
  if (rangeKey === '6m') return 'week';
  if (rangeKey === 'ytd') return 'month';

  if (start && end) {
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays <= 31) return 'day';
    if (diffDays <= 120) return 'week';
    return 'month';
  }

  return 'week';
}

function bucketKey(date, interval) {
  const d = new Date(date);
  if (interval === 'day') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (interval === 'week') {
    const weekStart = startOfWeek(d);
    return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function bucketLabel(date, interval) {
  if (interval === 'day') {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
  }
  if (interval === 'week') {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfDay(addDays(weekStart, 6));
    const startLabel = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
    }).format(weekStart);
    const endLabel = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
    }).format(weekEnd);
    return `${startLabel} – ${endLabel}`;
  }
  return new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' }).format(date);
}

function nextBucketStart(date, interval) {
  if (interval === 'day') {
    return addDays(date, 1);
  }
  if (interval === 'week') {
    return addDays(date, 7);
  }
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function generateTimeBuckets(range, interval) {
  const buckets = [];
  if (!range.start || !range.end) return buckets;

  let cursor = startOfDay(range.start);
  if (interval === 'week') {
    cursor = startOfWeek(cursor);
  } else if (interval === 'month') {
    cursor = startOfMonth(cursor);
  }

  while (cursor <= range.end) {
    const start = new Date(cursor);
    let nextStart = nextBucketStart(start, interval);
    const end = new Date(nextStart.getTime() - 1);
    if (end > range.end) {
      end.setTime(range.end.getTime());
    }

    buckets.push({
      key: bucketKey(start, interval),
      label: bucketLabel(start, interval),
      start,
      end,
    });

    cursor = nextStart;
  }

  return buckets;
}

function coerceCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return amount;
}

function buildTimeSeries({ buckets, classes, packageOwnerships, bookings, payments }) {
  const map = new Map(
    buckets.map((bucket) => [
      bucket.key,
      {
        ...bucket,
        classes: 0,
        packages: 0,
        cancellations: 0,
        booked: 0,
        capacity: 0,
        revenue: 0,
      },
    ])
  );

  const assign = (timestamp, updater) => {
    if (!timestamp) return;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return;
    for (const bucket of map.values()) {
      if (date >= bucket.start && date <= bucket.end) {
        updater(bucket);
        break;
      }
    }
  };

  classes.forEach((session) => {
    const startValue = session.start ?? session.start_datetime;
    if (!startValue) return;
    assign(startValue, (bucket) => {
      bucket.classes += 1;
      const capacity = Number(session.capacity ?? session.capacity_total ?? 0);
      const booked = Number(session.booked ?? session.capacity_taken ?? 0);
      if (Number.isFinite(capacity)) {
        bucket.capacity += Math.max(0, capacity);
      }
      if (Number.isFinite(booked)) {
        bucket.booked += Math.max(0, booked);
      }
    });
  });

  packageOwnerships.forEach((ownership) => {
    assign(ownership.purchased_at ?? ownership.created_at, (bucket) => {
      bucket.packages += 1;
    });
  });

  bookings.forEach((booking) => {
    const status = (booking.status ?? '').toLowerCase();
    const createdAt = booking.created_at ?? booking.session?.start_datetime;
    if (!createdAt) return;
    assign(createdAt, (bucket) => {
      if (status === 'cancelled' || status === 'canceled') {
        bucket.cancellations += 1;
      } else if (status === 'confirmed') {
        bucket.booked += 1;
      }
    });
  });

  payments.forEach((payment) => {
    assign(payment.created_at ?? payment.paid_at, (bucket) => {
      bucket.revenue += coerceCurrency(payment.amount);
    });
  });

  return Array.from(map.values()).map((bucket) => {
    const capacity = bucket.capacity > 0 ? bucket.capacity : bucket.classes * 10;
    const occupancy = capacity > 0 ? Math.min(100, Math.round((bucket.booked / capacity) * 100)) : 0;
    return {
      ...bucket,
      occupancyPct: occupancy,
      revenue: bucket.revenue,
    };
  });
}

function niceNumber(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue === 0) return 0;
  const exponent = Math.floor(Math.log10(Math.abs(numericValue)));
  const fraction = Math.abs(numericValue) / Math.pow(10, exponent);
  let niceFraction;
  if (fraction <= 1) {
    niceFraction = 1;
  } else if (fraction <= 2) {
    niceFraction = 2;
  } else if (fraction <= 5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }
  return niceFraction * Math.pow(10, exponent);
}

function buildAxisTicks(maxValue, { minTicks = 4 } = {}) {
  const numericMax = Number(maxValue);
  if (!Number.isFinite(numericMax) || numericMax <= 0) {
    return [0];
  }
  const niceMax = Math.max(1, niceNumber(numericMax));
  const rawStep = niceMax / Math.max(1, minTicks);
  const niceStep = Math.max(1, niceNumber(rawStep));
  const ticks = [];
  for (let tick = 0; tick <= niceMax + niceStep * 0.25; tick += niceStep) {
    ticks.push(Math.round(tick));
  }
  if (!ticks.includes(Math.round(niceMax))) {
    ticks.push(Math.round(niceMax));
  }
  return [...new Set(ticks)].sort((a, b) => a - b);
}

function Icon({ name, size = 20 }) {
  const icons = {
    bolt: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
    calendar: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    users: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    'credit-card': (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="7" y1="15" x2="7.01" y2="15" />
        <line x1="11" y1="15" x2="13" y2="15" />
      </svg>
    ),
    home: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </svg>
    ),
    logout: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    plus: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    chevronLeft: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    ),
    chevronRight: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
  };

  return (
    <span className="icon" aria-hidden="true">
      {icons[name] ?? null}
    </span>
  );
}

function FormField({ label, id, children, hint, error }) {
  return (
    <label className="form-field" htmlFor={id}>
      <span className="form-label">{label}</span>
      {children}
      {hint ? <span className="form-hint">{hint}</span> : null}
      {error ? <span className="form-error">{error}</span> : null}
    </label>
  );
}

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`switch ${checked ? 'switch--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-track" />
      <span className="switch-thumb" />
    </button>
  );
}

const SAVED_ACCOUNTS_STORAGE_KEY = 'fitzy:auth:saved-accounts';

function loadSavedAccounts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.email === 'string' && item.email.length > 0
    );
  } catch {
    return [];
  }
}

function persistSavedAccounts(list) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SAVED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(list.slice(0, 10))
    );
  } catch {
    // ignore storage errors
  }
}

function AuthScreen({ onSuccess, message, onPending }) {
  const [mode, setMode] = useState('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const deviceName =
    import.meta.env?.VITE_VENUE_ADMIN_DEVICE_NAME ?? 'venue-admin-web';

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    venueStateId: '',
    venueCityId: '',
    venueName: '',
    venueCity: '',
    venueNeighborhood: '',
    venueAddress: '',
    venueDescription: '',
  });
  const [savedAccounts, setSavedAccounts] = useState(() => loadSavedAccounts());
  const [pendingNotice, setPendingNotice] = useState(null);
  const cityOptionsForState = useMemo(
    () => (form.venueStateId ? CITIES_BY_STATE[form.venueStateId] ?? [] : []),
    [form.venueStateId]
  );
  const selectedCity = useMemo(
    () => (form.venueCityId ? CITY_LOOKUP[form.venueCityId] ?? null : null),
    [form.venueCityId]
  );
  const availableZones = selectedCity?.zones ?? [];

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field !== 'password') {
      setPendingNotice(null);
    }
  };

  const handleStateSelect = (stateId) => {
    setForm((prev) => ({
      ...prev,
      venueStateId: stateId,
      venueCityId: '',
      venueCity: '',
      venueNeighborhood: '',
    }));
    setPendingNotice(null);
  };

  const handleCitySelect = (cityId) => {
    const option = cityId ? CITY_LOOKUP[cityId] ?? null : null;
    setForm((prev) => ({
      ...prev,
      venueCityId: cityId,
      venueCity: option?.city ?? '',
      venueNeighborhood: '',
    }));
    setPendingNotice(null);
  };

  const extractErrorMessage = (err, fallback) => {
    const response = err?.response?.data;
    if (response?.errors) {
      const first = Object.values(response.errors)
        .flat()
        .find((item) => typeof item === 'string' && item.length > 0);
      if (first) return first;
    }
    if (typeof response?.message === 'string') {
      return response.message;
    }
    if (typeof err?.message === 'string') {
      return err.message;
    }
    return fallback;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      setError('Introduce tu correo electrónico y contraseña.');
      return;
    }

    let validatedName = null;

    if (mode === 'register') {
      validatedName = splitFullName(form.fullName);
      if (!validatedName.firstName || !validatedName.lastName) {
        setError('Ingresa nombre y apellido completos.');
        return;
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (!form.phone.trim()) {
        setError('Indica un teléfono de contacto.');
        return;
      }
      if (!form.venueName.trim()) {
        setError('Describe el nombre comercial de tu venue.');
        return;
      }
      if (!form.venueStateId) {
        setError('Selecciona el estado del venue.');
        return;
      }
      if (!form.venueCityId) {
        setError('Selecciona la ciudad del venue.');
        return;
      }
      if (!form.venueNeighborhood) {
        setError('Selecciona la urbanización del venue.');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      let user;
      if (mode === 'login') {
        const loginUser = await fitzy.auth.login({
          email,
          password,
          deviceName,
        });
        const existing = savedAccounts.find(
          (account) => account.email.toLowerCase() === email
        );
        if (!existing) {
          const nextSaved = [
            {
              email,
              contactName: loginUser?.name ?? '',
              firstName: loginUser?.first_name ?? '',
              lastName: loginUser?.last_name ?? '',
              venueName: loginUser?.venue?.name ?? '',
            },
            ...savedAccounts,
          ].slice(0, 10);
          setSavedAccounts(nextSaved);
          persistSavedAccounts(nextSaved);
        }
        setPendingNotice(null);
        user = loginUser;
      } else {
        const nameParts = validatedName ?? splitFullName(form.fullName);
        const registration = await fitzy.auth.register({
          email,
          password,
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          phone: form.phone.trim() || null,
          role: 'venue_admin',
          venueName: form.venueName.trim(),
          venueCity: form.venueCity.trim() || null,
          venueNeighborhood: form.venueNeighborhood.trim() || null,
          venueAddress: form.venueAddress.trim() || null,
          venueDescription: form.venueDescription.trim() || null,
          deviceName,
        });

        if (!registration || registration.pending || !registration.user) {
          const pendingMessage =
            registration?.message ??
            'Recibimos tu solicitud. Te avisaremos cuando aprobemos tu acceso.';
          setPendingNotice({
            message: pendingMessage,
            email,
            venueName: form.venueName.trim(),
          });
          if (typeof onPending === 'function') {
            onPending(pendingMessage);
          }
          setMode('login');
          setForm((prev) => ({
            ...prev,
            password: '',
          }));
          return;
        }

        user = registration.user;
        const venueName = form.venueName.trim();
        const contactName = `${nameParts.firstName} ${nameParts.lastName}`.trim();
        const newSaved = [
          {
            email,
            contactName,
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            venueName,
          },
          ...savedAccounts.filter(
            (account) => account.email.toLowerCase() !== email
          ),
        ].slice(0, 10);
        setSavedAccounts(newSaved);
        persistSavedAccounts(newSaved);
        setPendingNotice(null);
      }

      onSuccess(user, mode);
    } catch (err) {
      const fallback =
        mode === 'login'
          ? 'No se pudo iniciar sesión. Verifica tus credenciales.'
          : 'No se pudo crear la cuenta. Inténtalo nuevamente.';
      const extracted = extractErrorMessage(err, fallback);
      if (
        mode === 'login' &&
        ['pending', 'rejected'].includes(err?.response?.data?.status ?? '')
      ) {
        setPendingNotice({
          message: extracted,
          email: err?.response?.data?.user?.email ?? email,
          venueName: err?.response?.data?.user?.venue?.name ?? '',
        });
        if (typeof onPending === 'function') {
          onPending(extracted);
        }
      }
      setError(extracted);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError('');
    setPendingNotice(null);
  };

  const handleApplySavedAccount = (account) => {
    setMode('login');
    setForm((prev) => ({
      ...prev,
      email: account.email,
      password: '',
    }));
    setError('');
  };

  const handleRemoveSavedAccount = (email) => {
    const filtered = savedAccounts.filter(
      (account) => account.email.toLowerCase() !== email.toLowerCase()
    );
    setSavedAccounts(filtered);
    persistSavedAccounts(filtered);
  };

  return (
    <div className="auth-shell">
      <div className="auth-container">
        <aside className="auth-hero">
          <div className="auth-hero-content">
            <span className="auth-badge">Administra como los grandes</span>
            <h2 className="auth-hero-title">
              Gestiona tu estudio con la misma experiencia que las apps líderes.
            </h2>
            <p className="auth-hero-subtitle">
              Dashboard en tiempo real, herramientas de ocupación y un flujo de reservas
              pensado para crecer tu comunidad.
            </p>
            <ul className="auth-hero-list">
              <li>
                <span className="auth-hero-icon">✓</span>
                Control total de clases, instructores y salas
              </li>
              <li>
                <span className="auth-hero-icon">✓</span>
                Insights listos para compartir con tu equipo
              </li>
              <li>
                <span className="auth-hero-icon">✓</span>
                Integración instantánea con la app de clientes
              </li>
            </ul>
            <div className="auth-hero-highlights">
              <div className="auth-highlight">
                <span className="auth-highlight-label">Locales activos</span>
                <span className="auth-highlight-value">120+</span>
              </div>
              <div className="auth-highlight">
                <span className="auth-highlight-label">Reservas mensuales</span>
                <span className="auth-highlight-value">48K</span>
              </div>
              <div className="auth-highlight">
                <span className="auth-highlight-label">Satisfacción</span>
                <span className="auth-highlight-value">4.9★</span>
              </div>
            </div>
          </div>
          <div className="auth-hero-art" aria-hidden="true">
            <div className="auth-hero-glow" />
            <div className="auth-hero-card auth-hero-card--primary">
              <div className="auth-hero-chip">Hoy</div>
              <h3>26 clases activas</h3>
              <p>85% de ocupación media</p>
            </div>
            <div className="auth-hero-card auth-hero-card--secondary">
              <div className="auth-hero-avatar-group">
                <span className="auth-hero-avatar">DS</span>
                <span className="auth-hero-avatar">LM</span>
                <span className="auth-hero-avatar">SR</span>
              </div>
              <p>Equipo operativo al instante</p>
            </div>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel-header">
            <div className="logo-badge">
              <Icon name="bolt" size={20} />
            </div>
            <div>
              <p className="auth-eyebrow">Fitzy Venue Admin</p>
              <h1 className="auth-title">
                {mode === 'login' ? 'Bienvenido de nuevo' : 'Activa tu estación de trabajo'}
              </h1>
            </div>
          </div>

          {message ? <p className="auth-message">{message}</p> : null}
          {pendingNotice ? (
            <div className="auth-pending-card" role="status">
              <div className="auth-pending-icon" aria-hidden="true">
                ⏳
              </div>
              <div className="auth-pending-content">
                <p className="auth-pending-title">Solicitud en revisión</p>
                <p className="auth-pending-message">{pendingNotice.message}</p>
                <div className="auth-pending-meta">
                  {pendingNotice.venueName ? (
                    <span>
                      Venue:{' '}
                      <strong>{pendingNotice.venueName}</strong>
                    </span>
                  ) : null}
                  {pendingNotice.email ? (
                    <span>
                      Contacto:{' '}
                      <strong>{pendingNotice.email}</strong>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          {error ? <p className="auth-error">{error}</p> : null}

          <div className="auth-social">
            <button type="button" className="auth-social-btn auth-social-btn--apple">
              <span className="auth-social-icon"></span>
              Continuar con Apple
            </button>
            <button type="button" className="auth-social-btn auth-social-btn--google">
              <span className="auth-social-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.6h5.1c-.2 1.1-.8 2.1-1.7 2.8l2.7 2.1c1.6-1.5 2.6-3.7 2.6-6.3 0-.6-.1-1.2-.2-1.8H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M6.6 14.3l-.9.7-2.1 1.6C5 19.9 8.2 22 12 22c2.4 0 4.4-.8 5.8-2.2l-2.7-2.1c-.7.5-1.7.8-3.1.8-2.4 0-4.5-1.6-5.2-3.8z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M3.6 7.6C2.6 9 2 10.5 2 12s.6 3 1.6 4.4l2.6-2c-.4-.7-.6-1.6-.6-2.4s.2-1.7.6-2.4z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 5.6c1.3 0 2.5.4 3.5 1.3l2.6-2.6C16.4 2.9 14.3 2 12 2 8.2 2 5 4.1 3.6 7.6l2.6 2c.7-2.2 2.8-4 5.8-4z"
                  />
                </svg>
              </span>
              Continuar con Google
            </button>
          </div>

          <div className="auth-divider">
            <span>o usa tu correo corporativo</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <FormField
                label="Nombre completo del responsable"
                id="auth-full-name"
                hint="Tal como aparecería en una factura."
              >
                <input
                  id="auth-full-name"
                  type="text"
                  className="control"
                  value={form.fullName}
                  onChange={(event) =>
                    handleFieldChange('fullName', event.target.value)
                  }
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                  required
                />
              </FormField>
            ) : null}

            <FormField label="Correo electrónico" id="auth-email">
              <input
                id="auth-email"
                type="email"
                className="control"
                value={form.email}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                autoComplete="email"
                required
              />
            </FormField>

            {mode === 'register' ? (
              <>
                <FormField label="Teléfono de contacto" id="auth-phone">
                  <input
                    id="auth-phone"
                    type="tel"
                    className="control"
                    value={form.phone}
                    onChange={(event) =>
                      handleFieldChange('phone', event.target.value)
                    }
                    autoComplete="tel"
                    placeholder="+58 414 0000000"
                    required
                  />
                </FormField>
                <div className="auth-venue-switch">
                  <p className="auth-venue-switch-label">Dirección del venue</p>
                  <p className="form-hint">
                    Completa los campos como si estuvieras llenando una dirección de facturación.
                  </p>
                </div>
                <FormField label="Estado" id="auth-venue-state">
                  <select
                    id="auth-venue-state"
                    className="control"
                    value={form.venueStateId}
                    onChange={(event) => handleStateSelect(event.target.value)}
                    required
                  >
                    <option value="">Selecciona un estado</option>
                    {STATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="auth-grid">
                  <FormField
                    label="Ciudad"
                    id="auth-venue-city"
                    hint={
                      form.venueStateId ? undefined : 'Selecciona primero el estado.'
                    }
                  >
                    <select
                      id="auth-venue-city"
                      className="control"
                      value={form.venueCityId}
                      onChange={(event) => handleCitySelect(event.target.value)}
                      disabled={!form.venueStateId}
                      required
                    >
                      <option value="">
                        {form.venueStateId
                          ? 'Selecciona una ciudad'
                          : 'Selecciona el estado primero'}
                      </option>
                      {cityOptionsForState.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.city}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField
                    label="Urbanización"
                    id="auth-venue-neighborhood"
                    hint={
                      form.venueCityId
                        ? undefined
                        : 'Selecciona primero la ciudad.'
                    }
                  >
                    <select
                      id="auth-venue-neighborhood"
                      className="control"
                      value={form.venueNeighborhood}
                      onChange={(event) =>
                        handleFieldChange('venueNeighborhood', event.target.value)
                      }
                      disabled={!form.venueCityId}
                      required
                    >
                      <option value="">
                        {form.venueCityId
                          ? 'Selecciona una urbanización'
                          : 'Selecciona la ciudad primero'}
                      </option>
                      {availableZones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <FormField
                  label="Dirección (opcional)"
                  id="auth-venue-address"
                  hint="Calle y número, piso o referencia."
                >
                  <input
                    id="auth-venue-address"
                    type="text"
                    className="control"
                    value={form.venueAddress}
                    onChange={(event) =>
                      handleFieldChange('venueAddress', event.target.value)
                    }
                    placeholder="Av. Principal, piso 2"
                    autoComplete="street-address"
                  />
                </FormField>
                <FormField label="Nombre comercial del venue" id="auth-venue-name">
                  <input
                    id="auth-venue-name"
                    type="text"
                    className="control"
                    value={form.venueName}
                    onChange={(event) =>
                      handleFieldChange('venueName', event.target.value)
                    }
                    placeholder="Ej. Studio 33"
                    required
                  />
                </FormField>
                <FormField
                  label="Cuéntanos en qué consiste (opcional)"
                  id="auth-venue-description"
                  hint="Usamos esta descripción para validar tu solicitud."
                >
                  <textarea
                    id="auth-venue-description"
                    className="control control--textarea"
                    rows={3}
                    value={form.venueDescription}
                    onChange={(event) =>
                      handleFieldChange('venueDescription', event.target.value)
                    }
                    placeholder="Entrenamientos funcionales, yoga y programas personalizados."
                  />
                </FormField>
              </>
            ) : null}

            <FormField
              label="Contraseña"
              id="auth-password"
              hint={mode === 'register' ? 'Mínimo 8 caracteres.' : undefined}
            >
              <input
                id="auth-password"
                type="password"
                className="control"
                value={form.password}
                onChange={(event) =>
                  handleFieldChange('password', event.target.value)
                }
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </FormField>

            <button
              type="submit"
              className="btn btn--primary auth-submit"
              disabled={submitting}
            >
              {submitting
                ? 'Procesando...'
                : mode === 'login'
                  ? 'Ingresar'
                  : 'Enviar solicitud'}
            </button>
          </form>

          <div className="auth-toggle">
            <span>
              {mode === 'login'
                ? '¿No tienes cuenta todavía?'
                : '¿Ya cuentas con un acceso?'}
            </span>
            <button
              type="button"
              className="auth-link"
              onClick={toggleMode}
              disabled={submitting}
            >
              {mode === 'login' ? 'Crear una cuenta' : 'Inicia sesión'}
            </button>
          </div>

          {savedAccounts.length > 0 ? (
            <div className="auth-saved">
              <p className="auth-saved-title">Cuentas de prueba guardadas</p>
              <ul className="auth-saved-list">
                {savedAccounts.map((account) => {
                  const displayName =
                    account.contactName?.trim() ||
                    `${account.firstName ?? ''} ${account.lastName ?? ''}`.trim() ||
                    account.email;
                  return (
                    <li key={account.email} className="auth-saved-item">
                      <div className="auth-saved-info">
                        <span className="auth-saved-name">{displayName}</span>
                        <span className="auth-saved-email">{account.email}</span>
                        {account.venueName ? (
                          <span className="auth-saved-venue">{account.venueName}</span>
                        ) : null}
                      </div>
                      <div className="auth-saved-actions">
                        <button
                          type="button"
                          className="auth-link auth-link--sm"
                          onClick={() => handleApplySavedAccount(account)}
                          disabled={submitting}
                        >
                          Usar
                        </button>
                        <button
                          type="button"
                          className="auth-link auth-link--danger auth-link--sm"
                          onClick={() => handleRemoveSavedAccount(account.email)}
                          disabled={submitting}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Calendar({
  month,
  selectedDate,
  onMonthChange,
  onSelectDate,
  badges = {},
}) {
  const matrix = useMemo(() => getMonthMatrix(month), [month]);
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', {
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', {
        weekday: 'short',
      }),
    []
  );

  const handlePrev = () => onMonthChange(addMonths(month, -1));
  const handleNext = () => onMonthChange(addMonths(month, 1));

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="icon-button"
          onClick={handlePrev}
          aria-label="Mes anterior"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <div className="calendar-title">
          {monthFormatter.format(month)}
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={handleNext}
          aria-label="Mes siguiente"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {matrix[0].map((date) => (
          <div key={`wd-${toDateId(date)}`} className="calendar-weekday">
            {weekdayFormatter.format(date)}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {matrix.flat().map((date) => {
          const inMonth = date.getMonth() === month.getMonth();
          const dateId = toDateId(date);
          const count = badges[dateId];
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={dateId}
              type="button"
              className={[
                'calendar-cell',
                !inMonth ? 'calendar-cell--muted' : '',
                isSelected ? 'calendar-cell--selected' : '',
                isToday ? 'calendar-cell--today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(date)}
              aria-pressed={isSelected}
              aria-label={`${
                inMonth ? '' : 'Fuera de mes '
              }${date.toLocaleDateString('es-ES')}${
                count ? `. ${count} clases` : ''
              }`}
            >
              <span className="calendar-day">{date.getDate()}</span>
              {count ? (
                <span className="calendar-badge">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message, onHide }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onHide, 4000);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

function initialClassForm(selectedDate) {
  const dateValue = formatDateInput(selectedDate ?? new Date());
  const defaultDay = getDayKey(parseDateInput(dateValue));
  return {
    name: '',
    capacity: 12,
    instructorId: '',
    typeId: '',
    roomId: '',
    date: dateValue,
    time: '09:00',
    duration: 60,
    waitlistSize: 4,
    allowLateCancel: false,
    visibleInApp: true,
    repeat: {
      enabled: false,
      freq: 'WEEKLY',
      byDay: [toRRuleDay(defaultDay)],
      count: 1,
      until: '',
    },
  };
}

function initialInstructorForm() {
  return {
    name: '',
    email: '',
    avatar: '',
  };
}

function App() {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading');
  const [authMessage, setAuthMessage] = useState('');
  const [uiState, setUiState] = useState({
    activePage: 'home',
    selectedDate: new Date(),
    calendarMonth: startOfMonth(new Date()),
    isAddingInstructor: false,
    toast: '',
  });
  const [instructors, setInstructors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [packageOwnerships, setPackageOwnerships] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingClassTypes, setLoadingClassTypes] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingOwnerships, setLoadingOwnerships] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [createClassForm, setCreateClassForm] = useState(
    initialClassForm(new Date())
  );
  const [newInstructorForm, setNewInstructorForm] = useState(
    initialInstructorForm()
  );
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classView, setClassView] = useState({
    dayFilter: 'all',
  });
  const [filters, setFilters] = useState({
    seriesMode: 'both',
    range: '6m',
    interval: 'auto',
    customStart: '',
    customEnd: '',
    normalize: false,
    showCancellations: false,
  });

  const clearData = useCallback(() => {
    setInstructors([]);
    setClasses([]);
    setClassTypes([]);
    setBookings([]);
    setPayments([]);
    setPackageOwnerships([]);
    setRooms([]);
    setLoadingInstructors(false);
    setLoadingClasses(false);
    setLoadingClassTypes(false);
    setLoadingBookings(false);
    setLoadingPayments(false);
    setLoadingOwnerships(false);
    setLoadingRooms(false);
  }, []);

  const handleAuthSuccess = useCallback((apiUser, source = 'login') => {
    clearData();
    setUser(normalizeUser(apiUser));
    setAuthStatus('authenticated');
    setAuthMessage('');
    setUiState({
      activePage: 'home',
      selectedDate: new Date(),
      calendarMonth: startOfMonth(new Date()),
      isAddingInstructor: false,
      toast:
        source === 'register'
          ? 'Cuenta creada y sesión iniciada.'
          : 'Sesión iniciada correctamente.',
    });
    setCreateClassForm(initialClassForm(new Date()));
    setNewInstructorForm(initialInstructorForm());
  }, [clearData]);

  const updateUi = (patch) => {
    setUiState((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  useEffect(() => {
    let active = true;

    async function hydrateUser() {
      setAuthStatus('loading');
      try {
        const data = await fitzy.auth.me();
        if (!active) return;
        if (data) {
          setUser(normalizeUser(data));
          setAuthStatus('authenticated');
          setAuthMessage('');
          return;
        }
      } catch (error) {
        if (active) {
          console.warn('No se pudo restaurar la sesión.', error);
        }
      }

      if (!active) return;
      clearData();
      setUser(null);
      setAuthStatus('unauthenticated');
      setAuthMessage('Inicia sesión con tus credenciales para gestionar tu venue.');
    }

    hydrateUser();

    return () => {
      active = false;
    };
  }, [clearData]);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'unauthenticated') {
        setClassTypes([]);
        setLoadingClassTypes(false);
      }
      return;
    }

    let active = true;
    async function hydrateClassTypes() {
      setLoadingClassTypes(true);
      try {
        const data = await fitzy.entities.ClassType.list();
        if (!active) return;
        if (Array.isArray(data)) {
          setClassTypes(
            data.map(normalizeClassType).filter((item) => item && item.id)
          );
        }
      } catch (error) {
        if (active) {
          console.warn('No se pudieron cargar los tipos de clase.', error);
        }
      } finally {
        if (active) {
          setLoadingClassTypes(false);
        }
      }
    }

    hydrateClassTypes();

    return () => {
      active = false;
    };
  }, [authStatus]);

  useEffect(() => {
    if (classTypes.length >= 1 && !createClassForm.typeId) {
      setCreateClassForm((prev) => ({
        ...prev,
        typeId: classTypes[0].id,
      }));
    }
  }, [classTypes, createClassForm.typeId]);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'unauthenticated') {
        setInstructors([]);
        setLoadingInstructors(false);
      }
      return;
    }

    const venueId = user?.venue?.id ?? user?.venueId;
    if (!venueId) {
      setInstructors([]);
      setLoadingInstructors(false);
      return;
    }

    let active = true;
    async function hydrateInstructors() {
      setLoadingInstructors(true);
      try {
        const data = await fitzy.entities.VenueInstructor.filter({
          venue_id: venueId,
        });
        if (!active) return;
        if (Array.isArray(data)) {
          setInstructors(
            data
              .map(normalizeInstructor)
              .filter((item) => item && item.id)
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (error) {
        if (active) {
          console.warn('No se pudieron cargar instructores.', error);
          setInstructors([]);
        }
      } finally {
        if (active) {
          setLoadingInstructors(false);
        }
      }
    }

    hydrateInstructors();
    return () => {
      active = false;
    };
  }, [authStatus, user?.venueId, user?.venue]);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'unauthenticated') {
        setRooms([]);
        setLoadingRooms(false);
      }
      return;
    }

    const venueId = user?.venue?.id ?? user?.venueId;
    if (!venueId) {
      setRooms([]);
      setLoadingRooms(false);
      return;
    }

    let active = true;
    async function hydrateRooms() {
      setLoadingRooms(true);
      try {
        const data = await fitzy.entities.Room?.filter
          ? await fitzy.entities.Room.filter({ venue_id: venueId })
          : await fitzy.entities.Room?.list?.();
        if (!active) return;
        if (Array.isArray(data) && data.length) {
          setRooms(
            data
              .map(normalizeRoom)
              .filter(Boolean)
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        } else {
          setRooms([]);
        }
      } catch (error) {
        if (active) {
          console.warn('No se pudieron cargar salas.', error);
          setRooms([]);
        }
      } finally {
        if (active) {
          setLoadingRooms(false);
        }
      }
    }

    hydrateRooms();
    return () => {
      active = false;
    };
  }, [authStatus, user?.venueId, user?.venue]);

  const refreshClasses = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      setClasses([]);
      setLoadingClasses(false);
      return;
    }

    const venueId = user?.venue?.id ?? user?.venueId;
    if (!venueId) {
      setLoadingClasses(false);
      setClasses([]);
      return;
    }

    setLoadingClasses(true);
    try {
      const monthParam = formatDateInput(uiState.calendarMonth);
      const data = await (fitzy.entities.Session.filter
        ? fitzy.entities.Session.filter({
            venue_id: venueId,
            month: monthParam,
          })
        : fitzy.entities.Session.list?.());

      if (Array.isArray(data) && data.length) {
        setClasses(
          data
            .map(normalizeSession)
            .filter(Boolean)
            .sort((a, b) => {
              const aStart = (a.start ?? a.start_datetime) ?? '';
              const bStart = (b.start ?? b.start_datetime) ?? '';
              return aStart.localeCompare(bStart);
            })
        );
        return;
      }

      setClasses([]);
    } catch (error) {
      console.warn('No se pudieron cargar clases.', error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, [authStatus, user?.venue?.id, user?.venueId, uiState.calendarMonth]);

  useEffect(() => {
    refreshClasses();
  }, [refreshClasses]);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'unauthenticated') {
        setBookings([]);
        setLoadingBookings(false);
      }
      return;
    }

    const venueId = user?.venue?.id ?? user?.venueId;
    if (!venueId) {
      setBookings([]);
      setLoadingBookings(false);
      return;
    }

    let active = true;
    async function hydrateBookings() {
      setLoadingBookings(true);
      try {
        const data = await fitzy.entities.Booking.list();
        if (!active) return;
        setBookings(
          (data ?? []).filter(
            (booking) => Number(booking.session?.venue_id) === Number(venueId)
          )
        );
      } catch (error) {
        console.warn('No se pudieron cargar reservas.', error);
        if (active) {
          setBookings([]);
        }
      } finally {
        if (active) {
          setLoadingBookings(false);
        }
      }
    }

    hydrateBookings();
    return () => {
      active = false;
    };
  }, [authStatus, user?.venueId, user?.venue]);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'unauthenticated') {
        setPayments([]);
        setLoadingPayments(false);
      }
      return;
    }

    const venueId = user?.venue?.id ?? user?.venueId;
    if (!venueId) {
      setPayments([]);
      setLoadingPayments(false);
      return;
    }

    let active = true;
    async function hydratePayments() {
      setLoadingPayments(true);
      try {
        const data = await fitzy.entities.Payment.list();
        if (!active) return;
        setPayments(
          (data ?? []).filter(
            (payment) =>
              Number(payment.booking?.session?.venue_id) === Number(venueId)
          )
        );
      } catch (error) {
        console.warn('No se pudieron cargar pagos.', error);
        if (active) {
          setPayments([]);
        }
      } finally {
        if (active) {
          setLoadingPayments(false);
        }
      }
    }

    hydratePayments();
    return () => {
      active = false;
    };
  }, [authStatus, user?.venueId, user?.venue]);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'unauthenticated') {
        setPackageOwnerships([]);
        setLoadingOwnerships(false);
      }
      return;
    }

    const venueId = user?.venue?.id ?? user?.venueId;
    if (!venueId) {
      setPackageOwnerships([]);
      setLoadingOwnerships(false);
      return;
    }

    let active = true;
    async function hydrateOwnerships() {
      setLoadingOwnerships(true);
      try {
        const data = await fitzy.entities.PackageOwnership.list();
        if (!active) return;
        setPackageOwnerships(
          (data ?? []).filter(
            (ownership) =>
              Number(ownership.package?.venue_id) === Number(venueId)
          )
        );
      } catch (error) {
        console.warn('No se pudieron cargar paquetes adquiridos.', error);
        if (active) {
          setPackageOwnerships([]);
        }
      } finally {
        if (active) {
          setLoadingOwnerships(false);
        }
      }
    }

    hydrateOwnerships();
    return () => {
      active = false;
    };
  }, [authStatus, user?.venueId, user?.venue]);

  useEffect(() => {
    setCreateClassForm((prev) => ({
      ...prev,
      date: formatDateInput(uiState.selectedDate),
    }));
  }, [uiState.selectedDate]);

  useEffect(() => {
    if (rooms.length === 0) return;
    setCreateClassForm((prev) => {
      if (prev.roomId) return prev;
      return {
        ...prev,
        roomId: rooms[0].id,
      };
    });
  }, [rooms]);

  const monthBadges = useMemo(
    () =>
      classes.reduce((acc, session) => {
        const startValue = session.start ?? session.start_datetime;
        if (!startValue) return acc;
        const key = toDateId(startValue);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    [classes]
  );

  const selectedDayClasses = useMemo(() => {
    const selectedKey = formatDateInput(uiState.selectedDate);
    return classes
      .filter((session) => {
        const startValue = session.start ?? session.start_datetime;
        if (!startValue) return false;
        return toDateId(startValue) === selectedKey;
      })
      .sort((a, b) => {
        const aStart = (a.start ?? a.start_datetime) ?? '';
        const bStart = (b.start ?? b.start_datetime) ?? '';
        return aStart.localeCompare(bStart);
      });
  }, [classes, uiState.selectedDate]);

  const filteredDayClasses = useMemo(() => {
    if (classView.dayFilter === 'all') return selectedDayClasses;
    return selectedDayClasses.filter((session) => {
      const occupied = Number(session.booked ?? session.capacity_taken ?? 0);
      const capacity = Number(session.capacity ?? session.capacity_total ?? 0);
      const waitlist =
        session.waitlistCount ??
        (Array.isArray(session.waitlist) ? session.waitlist.length : 0);
      if (classView.dayFilter === 'full') {
        return capacity > 0 && occupied >= capacity;
      }
      if (classView.dayFilter === 'waitlist') {
        return waitlist > 0;
      }
      if (classView.dayFilter === 'available') {
        return capacity === 0 || occupied < capacity;
      }
      return true;
    });
  }, [selectedDayClasses, classView.dayFilter]);

  const lookupInstructorName = useCallback((id) => {
    if (id === null || id === undefined || id === '') return 'Por asignar';
    const match = instructors.find((inst) => {
      if (inst.numericId !== null && inst.numericId === Number(id)) return true;
      return inst.id === id || inst.id === String(id);
    });
    return match?.name ?? 'Por asignar';
  }, [instructors]);

  const lookupRoomName = useCallback((id) => {
    if (id === null || id === undefined || id === '') return 'Sin sala';
    const match = rooms.find((room) => {
      if (room.numericId !== null && room.numericId === Number(id)) return true;
      return room.id === id || room.id === String(id);
    });
    return match?.name ?? 'Sala';
  }, [rooms]);

  const formConflicts = useMemo(() => {
    if (!createClassForm.date || !createClassForm.time) {
      return { items: [], blocking: false };
    }

    const baseStart = `${createClassForm.date}T${createClassForm.time}`;
    const startDate = new Date(baseStart);
    if (Number.isNaN(startDate.getTime())) return { items: [], blocking: false };

    const durationMinutes = Number(createClassForm.duration) || 60;
    const baseEndIso = computeEndTime(startDate, createClassForm.time, durationMinutes);
    const baseEndDate = new Date(baseEndIso);

    const basePayload = {
      start_datetime: baseStart,
      end_datetime: baseEndIso,
    };

    const recurrencePayloads = generateRecurringInstances(startDate, createClassForm, basePayload);
    const candidates = [
      {
        start: startDate,
        end: baseEndDate,
        label: formatDateInput(startDate),
      },
      ...recurrencePayloads.map((payload) => {
        const startIso = payload.start_datetime ?? payload.start;
        const endIso = payload.end_datetime ?? payload.end;
        const startValue = new Date(startIso);
        const endValue = endIso ? new Date(endIso) : new Date(startIso);
        return {
          start: startValue,
          end: endValue,
          label: formatDateInput(startValue),
        };
      }),
    ];

    const items = [];

    const instructorId = createClassForm.instructorId
      ? String(createClassForm.instructorId)
      : '';
    const roomId = createClassForm.roomId ? String(createClassForm.roomId) : '';

    const instructorName = lookupInstructorName(instructorId);
    const roomName = lookupRoomName(roomId);

    const compareSessions = classes;

    compareSessions.forEach((session) => {
      const sessionStartValue = session.start ?? session.start_datetime;
      const sessionEndValue = session.end ?? session.end_datetime;
      if (!sessionStartValue) return;
      const sessionStart = new Date(sessionStartValue);
      const sessionEnd = sessionEndValue ? new Date(sessionEndValue) : new Date(sessionStartValue);
      if (Number.isNaN(sessionStart.getTime()) || Number.isNaN(sessionEnd.getTime())) return;

      const sessionInstructor = session.instructorId ?? session.instructor?.id ?? session.raw?.instructor_id;
      const sessionRoom = session.roomId ?? session.room?.id ?? session.raw?.room_id;

      candidates.forEach((candidate, index) => {
        if (!intervalsOverlap(candidate.start, candidate.end, sessionStart, sessionEnd)) return;

        const timeLabel = `${formatTime(sessionStartValue)}–${formatTime(sessionEndValue)}`;
        const dateLabel = candidate.label;

        if (
          instructorId &&
          sessionInstructor &&
          String(sessionInstructor) === instructorId
        ) {
          items.push({
            id: `instructor-${session.id}-${index}`,
            message: `El instructor ${instructorName} ya tiene una clase el ${dateLabel} a las ${timeLabel}.`,
            blocking: true,
          });
        }

        if (
          roomId &&
          sessionRoom &&
          String(sessionRoom) === roomId
        ) {
          items.push({
            id: `room-${session.id}-${index}`,
            message: `La sala ${roomName} está ocupada el ${dateLabel} a las ${timeLabel}.`,
            blocking: true,
          });
        }
      });
    });

    const uniqueItems = items.reduce((acc, item) => {
      if (acc.some((existing) => existing.message === item.message)) return acc;
      acc.push(item);
      return acc;
    }, []);

    return {
      items: uniqueItems,
      blocking: uniqueItems.some((item) => item.blocking),
    };
  }, [classes, createClassForm, lookupInstructorName, lookupRoomName]);

  const todaySummary = useMemo(() => {
    const todayKey = formatDateInput(new Date());
    const daySessions = classes.filter((session) => {
      const startValue = session.start ?? session.start_datetime;
      if (!startValue) return false;
      return toDateId(startValue) === todayKey;
    });

    let bookingsCount = 0;
    let waitlistCount = 0;

    daySessions.forEach((session) => {
      bookingsCount += Number(session.booked ?? session.capacity_taken ?? 0);
      const waitlist =
        session.waitlistCount ??
        (Array.isArray(session.waitlist) ? session.waitlist.length : 0);
      waitlistCount += Number(waitlist ?? 0);
    });

    return {
      count: daySessions.length,
      bookings: bookingsCount,
      waitlist: waitlistCount,
    };
  }, [classes]);

  const selectedDaySummary = useMemo(() => {
    let occupied = 0;
    let capacity = 0;
    let waitlist = 0;

    selectedDayClasses.forEach((session) => {
      occupied += Number(session.booked ?? session.capacity_taken ?? 0);
      capacity += Number(session.capacity ?? session.capacity_total ?? 0);
      waitlist += Number(
        session.waitlistCount ??
          (Array.isArray(session.waitlist) ? session.waitlist.length : 0)
      );
    });

    return {
      count: selectedDayClasses.length,
      occupied,
      capacity,
      waitlist,
    };
  }, [selectedDayClasses]);

  const instructorOptions = useMemo(
    () =>
      instructors.map((instructor) => ({
        label: instructor.name,
        value:
          instructor.numericId !== null
            ? String(instructor.numericId)
            : instructor.id,
      })),
    [instructors]
  );

  const classTypeOptions = useMemo(
    () =>
      classTypes.map((classType) => ({
        label: classType.name,
        value:
          classType.numericId !== null
            ? String(classType.numericId)
            : classType.id,
      })),
    [classTypes]
  );

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: room.name,
        value:
          room.numericId !== null
            ? String(room.numericId)
            : room.id,
      })),
    [rooms]
  );

  const lookupClassTypeName = (id) => {
    if (id === null || id === undefined || id === '') return '';
    const match = classTypes.find((type) => {
      if (type.numericId !== null && type.numericId === Number(id)) return true;
      return type.id === id || type.id === String(id);
    });
    return match?.name ?? '';
  };

  const nextClass = useMemo(() => {
    const now = new Date();
    return [...classes]
      .map((session) => {
        const startValue = session.start ?? session.start_datetime;
        return {
          session,
          start: startValue ? new Date(startValue) : null,
        };
      })
      .filter(({ start }) => start && !Number.isNaN(start.getTime()) && start >= now)
      .sort((a, b) => a.start - b.start)
      .map(({ session }) => session)[0] ?? null;
  }, [classes]);

  const nextInstructorName =
    nextClass?.instructor?.name ?? lookupInstructorName(nextClass?.instructorId);

  const resolvedRange = useMemo(
    () => resolveDateRange(filters.range, filters.customStart, filters.customEnd),
    [filters.range, filters.customStart, filters.customEnd]
  );

  const rangeStartMs = resolvedRange.start ? resolvedRange.start.getTime() : null;
  const rangeEndMs = resolvedRange.end ? resolvedRange.end.getTime() : null;

  const resolvedInterval = useMemo(() => {
    const startDate = rangeStartMs ? new Date(rangeStartMs) : null;
    const endDate = rangeEndMs ? new Date(rangeEndMs) : null;
    return resolveInterval(filters.range, filters.interval, startDate, endDate);
  }, [filters.range, filters.interval, rangeStartMs, rangeEndMs]);

  const timeBuckets = useMemo(() => {
    const startDate = rangeStartMs ? new Date(rangeStartMs) : null;
    const endDate = rangeEndMs ? new Date(rangeEndMs) : null;
    return generateTimeBuckets({ start: startDate, end: endDate }, resolvedInterval);
  }, [rangeStartMs, rangeEndMs, resolvedInterval]);

  const timeSeries = useMemo(
    () =>
      buildTimeSeries({
        buckets: timeBuckets,
        classes,
        packageOwnerships,
        bookings,
        payments,
      }),
    [timeBuckets, classes, packageOwnerships, bookings, payments]
  );

  const chartLegend = useMemo(() => {
    const items = [];
    if (filters.seriesMode === 'classes' || filters.seriesMode === 'both') {
      items.push({
        key: 'classes',
        label: filters.normalize ? 'Ocupación' : 'Clases',
      });
    }
    if (filters.seriesMode === 'packages' || filters.seriesMode === 'both') {
      items.push({
        key: 'packages',
        label: 'Paquetes',
      });
    }
    if (filters.showCancellations) {
      items.push({
        key: 'cancellations',
        label: 'Cancelaciones',
      });
    }
    return items;
  }, [filters.seriesMode, filters.normalize, filters.showCancellations]);

  const popularClasses = useMemo(() => {
    if (!bookings.length) return [];
    const classCapacity = new Map(
      classes.map((session) => [
        session.id ?? session.raw?.id ?? session.raw?.session_id,
        Number(session.capacity ?? session.capacity_total ?? session.raw?.capacity_total ?? 0),
      ])
    );

    const counts = new Map();

    bookings
      .filter((booking) => (booking.status ?? '').toLowerCase() === 'confirmed')
      .forEach((booking) => {
        const sessionId = booking.session_id ?? booking.session?.id ?? booking.session?.session_id;
        const key = sessionId ?? `${booking.session?.name}-${booking.session?.start_datetime}`;
        if (!key) return;
        const title = booking.session?.name ?? booking.session_name ?? 'Clase';
        const schedule = booking.session?.start_datetime ?? booking.session_start ?? booking.starts_at;
        const capacity =
          classCapacity.get(sessionId) ??
          Number(booking.session?.capacity_total ?? booking.session?.capacity ?? 0);

        const previous = counts.get(key) ?? {
          key,
          title,
          total: 0,
          capacity: Number.isFinite(capacity) ? capacity : 0,
          schedule,
        };

        counts.set(key, {
          ...previous,
          total: previous.total + 1,
          capacity: Number.isFinite(capacity) ? capacity : previous.capacity,
        });
      });

    return Array.from(counts.values())
      .map((item) => ({
        ...item,
        attendance:
          item.capacity > 0 ? Math.min(100, Math.round((item.total / item.capacity) * 100)) : null,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [bookings, classes]);

  const recentBookings = useMemo(() => {
    if (!bookings.length) return [];
    return bookings
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.created_at ?? a.session?.start_datetime ?? 0);
        const dateB = new Date(b.created_at ?? b.session?.start_datetime ?? 0);
        return dateB - dateA;
      })
      .slice(0, 6)
      .map((booking) => {
        const startValue = booking.session?.start_datetime;
        const startDate = startValue ? new Date(startValue) : null;
        const rawStatus = (booking.status ?? 'pending').toLowerCase();
        const statusKey = ['confirmada', 'confirmado', 'confirmed'].includes(rawStatus)
          ? 'confirmed'
          : ['cancelada', 'cancelado', 'cancelled', 'canceled'].includes(rawStatus)
            ? 'cancelled'
            : 'pending';
        const statusLabel =
          statusKey === 'confirmed'
            ? 'Confirmada'
            : statusKey === 'cancelled'
              ? 'Cancelada'
              : 'Pendiente';
        const clientName =
          booking.user?.name ??
          [booking.user?.first_name, booking.user?.last_name].filter(Boolean).join(' ') ??
          booking.client_name ??
          'Cliente';

        return {
          id: booking.id,
          title: booking.session?.name ?? 'Clase',
          status: statusKey,
          statusLabel,
          client: {
            name: clientName,
            avatar:
              booking.user?.avatar_url ??
              booking.user?.profile_picture_url ??
              booking.client_avatar ??
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                clientName.slice(0, 2) || 'CL'
              )}&backgroundColor=E6F0FF&fontWeight=700`,
          },
          startsAt: startValue ?? booking.starts_at ?? booking.session?.start,
          when: startDate
            ? startDate.toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
              })
            : 'Sin fecha',
          time: startDate
            ? startDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '--:--',
        };
      });
  }, [bookings]);

  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(addDays(todayStart, -1));
    const yesterdayEnd = endOfDay(addDays(todayStart, -1));

    const isWithin = (dateValue, start, end) => {
      if (!dateValue) return false;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return false;
      return date >= start && date <= end;
    };

    const todaysBookings = bookings.filter((booking) =>
      isWithin(
        booking.session?.start_datetime ?? booking.starts_at ?? booking.created_at,
        todayStart,
        todayEnd
      )
    );

    const todaysConfirmed = todaysBookings.filter(
      (booking) => (booking.status ?? '').toLowerCase() === 'confirmed'
    ).length;
    const yesterdaysConfirmed = bookings.filter((booking) =>
      isWithin(
        booking.session?.start_datetime ?? booking.starts_at ?? booking.created_at,
        yesterdayStart,
        yesterdayEnd
      )
    ).filter((booking) => (booking.status ?? '').toLowerCase() === 'confirmed').length;

    const bookingsTrend = yesterdaysConfirmed
      ? Math.round(((todaysConfirmed - yesterdaysConfirmed) / yesterdaysConfirmed) * 100)
      : todaysConfirmed > 0
        ? 100
        : 0;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));

    const bookingsInRange = (start, end, predicate = () => true) =>
      bookings.filter(
        (booking) =>
          isWithin(
            booking.session?.start_datetime ?? booking.starts_at ?? booking.created_at,
            start,
            end
          ) && predicate(booking)
      ).length;

    const monthBookingsTotal = bookingsInRange(monthStart, todayEnd);
    const monthCancellations = bookingsInRange(monthStart, todayEnd, (booking) =>
      ['cancelled', 'canceled'].includes((booking.status ?? '').toLowerCase())
    );

    const classesThisMonth = classes.filter((session) => {
      const startValue = session.start ?? session.start_datetime;
      return isWithin(startValue, monthStart, todayEnd);
    });

    const capacityTotals = classesThisMonth.reduce(
      (acc, session) => {
        const capacity = Number(session.capacity ?? session.capacity_total ?? 0);
        const booked = Number(session.booked ?? session.capacity_taken ?? 0);
        if (Number.isFinite(capacity)) {
          acc.capacity += Math.max(0, capacity);
        }
        if (Number.isFinite(booked)) {
          acc.booked += Math.max(0, booked);
        }
        return acc;
      },
      { capacity: 0, booked: 0 }
    );

    const monthOccupancy =
      capacityTotals.capacity > 0
        ? Math.round((capacityTotals.booked / capacityTotals.capacity) * 100)
        : 0;

    const previousClasses = classes.filter((session) => {
      const startValue = session.start ?? session.start_datetime;
      return isWithin(startValue, previousMonthStart, previousMonthEnd);
    });

    const previousCapacityTotals = previousClasses.reduce(
      (acc, session) => {
        const capacity = Number(session.capacity ?? session.capacity_total ?? 0);
        const booked = Number(session.booked ?? session.capacity_taken ?? 0);
        if (Number.isFinite(capacity)) acc.capacity += Math.max(0, capacity);
        if (Number.isFinite(booked)) acc.booked += Math.max(0, booked);
        return acc;
      },
      { capacity: 0, booked: 0 }
    );

    const previousOccupancy =
      previousCapacityTotals.capacity > 0
        ? Math.round((previousCapacityTotals.booked / previousCapacityTotals.capacity) * 100)
        : 0;

    const paymentsThisMonth = payments.filter((payment) =>
      isWithin(payment.created_at ?? payment.paid_at, monthStart, todayEnd)
    );

    const paymentsPreviousMonth = payments.filter((payment) =>
      isWithin(payment.created_at ?? payment.paid_at, previousMonthStart, previousMonthEnd)
    );

    const monthRevenue = paymentsThisMonth.reduce(
      (sum, payment) => sum + coerceCurrency(payment.amount),
      0
    );
    const previousRevenue = paymentsPreviousMonth.reduce(
      (sum, payment) => sum + coerceCurrency(payment.amount),
      0
    );

    const occupancyTrend =
      previousOccupancy > 0
        ? Math.round(((monthOccupancy - previousOccupancy) / previousOccupancy) * 100)
        : monthOccupancy;

    const revenueTrend =
      previousRevenue > 0
        ? Math.round(((monthRevenue - previousRevenue) / previousRevenue) * 100)
        : monthRevenue > 0
          ? 100
          : 0;

    const monthCancellationPct =
      monthBookingsTotal > 0 ? Math.round((monthCancellations / monthBookingsTotal) * 100) : 0;

    return {
      today: {
        bookings: todaysConfirmed,
        bookingsTrend,
      },
      month: {
        occupancyPct: monthOccupancy,
        occupancyTrend,
        revenue: monthRevenue,
        revenueTrend,
        cancellations: monthCancellations,
        cancellationsPct: monthCancellationPct,
      },
    };
  }, [bookings, classes, payments]);

  const insights = useMemo(() => {
    const hourCounts = new Map();
    bookings
      .filter((booking) => (booking.status ?? '').toLowerCase() === 'confirmed')
      .forEach((booking) => {
        const startValue = booking.session?.start_datetime ?? booking.starts_at;
        if (!startValue) return;
        const date = new Date(startValue);
        if (Number.isNaN(date.getTime())) return;
        const hour = date.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      });

    let peakHour = null;
    let peakHourBookings = 0;
    hourCounts.forEach((value, key) => {
      if (value > peakHourBookings) {
        peakHour = key;
        peakHourBookings = value;
      }
    });

    const topClass = popularClasses[0]
      ? {
          name: popularClasses[0].title,
          attendance: popularClasses[0].attendance ?? null,
        }
      : { name: 'Sin datos', attendance: null };

    return {
      topClass,
      peakHour,
      peakHourBookings,
      cancellationsPct: dashboardMetrics.month.cancellationsPct,
      popularClasses: popularClasses.map((item) => ({
        name: item.title,
        attendance: item.attendance ?? Math.min(100, item.total),
      })),
    };
  }, [popularClasses, bookings, dashboardMetrics.month.cancellationsPct]);

  const nextClassInfo = useMemo(() => {
    if (!nextClass) return null;
    const startValue = nextClass.start ?? nextClass.start_datetime;
    const startDate = startValue ? new Date(startValue) : null;
    return {
      title: nextClass.title ?? nextClass.name ?? 'Clase',
      date: startDate
        ? startDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })
        : 'Sin fecha',
      time: startDate
        ? startDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '--:--',
      instructor: nextInstructorName,
      capacity: `${nextClass.capacity ?? nextClass.capacity_total ?? 0} cupos`,
    };
  }, [nextClass, nextInstructorName]);

  const handleCreateClassChange = (key, value) => {
    setCreateClassForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateClassToggle = (key, value) => {
    setCreateClassForm((prev) => ({
      ...prev,
      [key]: !!value,
    }));
  };

  const handleRepeatToggle = (enabled) => {
    setCreateClassForm((prev) => ({
      ...prev,
      repeat: {
        ...prev.repeat,
        enabled,
      },
    }));
  };

  const handleRepeatChange = (key, value) => {
    setCreateClassForm((prev) => ({
      ...prev,
      repeat: {
        ...prev.repeat,
        [key]: value,
      },
    }));
  };

  const handleRepeatDayToggle = (rruleDay) => {
    const dayValue = rruleDay.toUpperCase();
    setCreateClassForm((prev) => {
      const currentDays = Array.isArray(prev.repeat.byDay)
        ? prev.repeat.byDay
        : [];
      const exists = currentDays.includes(dayValue);
      const nextDays = exists
        ? currentDays.filter((day) => day !== dayValue)
        : [...currentDays, dayValue];
      return {
        ...prev,
        repeat: {
          ...prev.repeat,
          byDay: nextDays.length ? nextDays : [toRRuleDay(getDayKey(parseDateInput(prev.date)))],
        },
      };
    });
  };

  const handleNewInstructorChange = (key, value) => {
    setNewInstructorForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === 'range' && value !== 'custom') {
        next.customStart = '';
        next.customEnd = '';
      }

      if (key === 'range' && prev.interval === 'auto') {
        next.interval = 'auto';
      }

      return next;
    });
  };

  const handleFilterToggle = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCustomRangeChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectDate = (date) => {
    updateUi({
      selectedDate: date,
    });
    setCreateClassForm((prev) => ({
      ...prev,
      date: formatDateInput(date),
    }));
  };

  const handleShiftSelectedDate = (deltaDays) => {
    const baseDate = uiState.selectedDate ?? new Date();
    const nextDate = addDays(baseDate, deltaDays);
    handleSelectDate(nextDate);
    const currentMonth = uiState.calendarMonth ?? startOfMonth(new Date());
    if (
      nextDate.getMonth() !== currentMonth.getMonth() ||
      nextDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      handleMonthChange(nextDate);
    }
  };

  const handleMonthChange = (date) => {
    updateUi({
      calendarMonth: startOfMonth(date),
    });
  };

  const handleCreateClass = async () => {
    const errors = {};
    const capacity = Number(createClassForm.capacity);
    const duration = Number(createClassForm.duration);
    const venueId = user?.venue?.id ?? user?.venueId;

    if (!venueId) {
      updateUi({
        toast: 'No se reconoce el venue del usuario. Contacta al administrador.',
      });
      return;
    }

    if (!createClassForm.name.trim()) {
      errors.name = 'Ingresa un nombre para la clase';
    }
    if (!Number.isFinite(capacity) || capacity < 1 || capacity > 100) {
      errors.capacity = 'Cupos debe ser ≥ 1';
    }
    if (!Number.isFinite(duration) || duration < 15 || duration > 180) {
      errors.duration = 'Duración entre 15 y 180 minutos';
    }
    if (!createClassForm.instructorId) {
      errors.instructorId = 'Selecciona un instructor';
    }
    if (!createClassForm.typeId) {
      errors.typeId = 'Selecciona un tipo de clase';
    }
    if (!createClassForm.time) {
      errors.time = 'Selecciona un horario';
    }

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      updateUi({
        toast: 'Revisa los campos marcados',
      });
      return;
    }

    setFormErrors({});

    if (formConflicts.blocking) {
      updateUi({
        toast: 'Resuelve los conflictos antes de guardar',
      });
      return;
    }

    setIsSubmitting(true);

    const baseStart = `${createClassForm.date}T${createClassForm.time}`;
    const startDateObj = parseDateInput(createClassForm.date);
    const baseEnd = computeEndTime(
      startDateObj,
      createClassForm.time,
      duration
    );

    const typeIdNumber = Number(createClassForm.typeId);
    const instructorIdNumber = Number(createClassForm.instructorId);
    const roomIdNumber = createClassForm.roomId ? Number(createClassForm.roomId) : null;
    const waitlistSizeNumber = Number.isFinite(Number(createClassForm.waitlistSize))
      ? Number(createClassForm.waitlistSize)
      : 0;

    const basePayload = {
      venue_id: venueId,
      class_type_id: typeIdNumber,
      instructor_id: instructorIdNumber,
      room_id: roomIdNumber ?? undefined,
      name: createClassForm.name.trim(),
      start_datetime: baseStart,
      end_datetime: baseEnd,
      capacity_total: capacity,
      capacity_taken: 0,
      waitlist_size: Math.max(0, waitlistSizeNumber),
      allow_late_cancel: Boolean(createClassForm.allowLateCancel),
      visible_in_app: Boolean(createClassForm.visibleInApp),
    };

    try {
      const created = await fitzy.entities.Session.create(basePayload);

      const createdSessions = [];
      const normalizedBase = normalizeSession(created ?? basePayload);
      if (normalizedBase) {
        createdSessions.push(normalizedBase);
      }

      const recurrencePayloads = generateRecurringInstances(
        startDateObj,
        createClassForm,
        basePayload
      );

      if (recurrencePayloads.length) {
        const recurrenceResponses = await Promise.all(
          recurrencePayloads.map((payload) =>
            fitzy.entities.Session.create(payload).catch((error) => {
              console.error('No se pudo crear la clase recurrente', error);
              return payload;
            })
          )
        );

        recurrenceResponses.forEach((session, index) => {
          const normalized = normalizeSession(session ?? recurrencePayloads[index]);
          if (normalized) {
            createdSessions.push(normalized);
          }
        });
      }

      updateUi({
        toast: 'Clase creada correctamente',
        calendarMonth: new Date(uiState.calendarMonth),
      });

      setCreateClassForm((prev) => ({
        ...initialClassForm(uiState.selectedDate),
        instructorId: prev.instructorId,
        typeId: prev.typeId,
        roomId: prev.roomId,
      }));

      setClasses((prev) => {
        const merged = new Map();
        [...prev, ...createdSessions]
          .filter(Boolean)
          .forEach((session) => {
            merged.set(session.id, session);
          });
        return [...merged.values()].sort((a, b) => {
          const aStart = (a.start ?? a.start_datetime) ?? '';
          const bStart = (b.start ?? b.start_datetime) ?? '';
          return aStart.localeCompare(bStart);
        });
      });
    } catch (error) {
      console.error('No se pudo crear la clase', error);
      updateUi({
        toast: 'No se pudo crear la clase',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassFormSubmit = (event) => {
    event.preventDefault();
    handleCreateClass();
  };

  const handleResetClassForm = () => {
    setFormErrors({});
    setCreateClassForm((prev) => {
      const next = initialClassForm(uiState.selectedDate);
      return {
        ...next,
        typeId: prev.typeId || next.typeId,
        instructorId: '',
        roomId: prev.roomId || next.roomId,
      };
    });
  };

  const apiRequest = async (method, path, payload) => {
    const lowerMethod = method.toLowerCase();
    const http = fitzy.http ?? {};
    if (typeof http[lowerMethod] === 'function') {
      return http[lowerMethod](path, payload);
    }

    const response = await fetch(path, {
      method: method.toUpperCase(),
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error en la solicitud');
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const handleDuplicateSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      await apiRequest('post', `/api/classes/${sessionId}/duplicate`);
      updateUi({ toast: 'Clase duplicada' });
      await refreshClasses();
    } catch (error) {
      console.error('No se pudo duplicar la clase', error);
      updateUi({ toast: 'No se pudo duplicar la clase' });
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!sessionId) return;
    if (typeof window !== 'undefined' && !window.confirm('¿Cancelar esta clase?')) {
      return;
    }
    try {
      await apiRequest('delete', `/api/classes/${sessionId}`);
      updateUi({ toast: 'Clase cancelada' });
      await refreshClasses();
    } catch (error) {
      console.error('No se pudo cancelar la clase', error);
      updateUi({ toast: 'No se pudo cancelar la clase' });
    }
  };

  const handleViewSession = (sessionId) => {
    if (!sessionId) return;
    if (typeof window !== 'undefined') {
      window.open(`/classes/${sessionId}`, '_self');
    }
  };

  const handleEditSession = (sessionId) => {
    handleViewSession(sessionId);
  };

  const handleCheckInSession = (sessionId) => {
    if (!sessionId) return;
    if (typeof window !== 'undefined') {
      window.open(`/checkin/${sessionId}`, '_self');
    }
  };

  const handleAddInstructor = async () => {
    if (!newInstructorForm.name.trim() || !newInstructorForm.email.trim()) {
      updateUi({
        toast: 'Nombre y email son obligatorios',
      });
      return;
    }

    const venueId = user?.venue?.id ?? user?.venueId;
    if (!venueId) {
      updateUi({
        toast: 'No se reconoce el venue del usuario. No se puede añadir instructor.',
      });
      return;
    }

    const payload = {
      venue_id: venueId,
      name: newInstructorForm.name.trim(),
      email: newInstructorForm.email.trim(),
      avatar_url: newInstructorForm.avatar.trim() || undefined,
    };

    try {
      const data = await fitzy.entities.VenueInstructor.create(payload);
      const normalized = normalizeInstructor(data ?? payload);
      setInstructors((prev) => {
        if (prev.some((inst) => inst.id === normalized.id)) return prev;
        return [...prev, normalized].sort((a, b) => a.name.localeCompare(b.name));
      });
      setNewInstructorForm(initialInstructorForm());
      updateUi({
        toast: 'Instructor añadido',
        isAddingInstructor: false,
      });
    } catch (error) {
      console.error('No se pudo añadir instructor', error);
      updateUi({
        toast: 'No se pudo añadir instructor',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fitzy.auth.logout();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    } finally {
      clearData();
      setUser(null);
      setAuthStatus('unauthenticated');
      setAuthMessage('Sesión cerrada. Inicia nuevamente para continuar.');
      setUiState({
        activePage: 'home',
        selectedDate: new Date(),
        calendarMonth: startOfMonth(new Date()),
        isAddingInstructor: false,
        toast: '',
      });
      setCreateClassForm(initialClassForm(new Date()));
      setNewInstructorForm(initialInstructorForm());
    }
  };

  const isLoading =
    loadingClasses ||
    loadingInstructors ||
    loadingClassTypes ||
    loadingBookings ||
    loadingPayments ||
    loadingOwnerships ||
    loadingRooms;

  const renderDashboard = () => {
    const formatTrend = (value) => {
      if (value === null || value === undefined) return '—';
      if (value === 0) return '0%';
      const prefix = value > 0 ? '+' : '';
      return `${prefix}${value}%`;
    };

    const seriesOptions = [
      { key: 'classes', label: 'Clases' },
      { key: 'packages', label: 'Paquetes' },
      { key: 'both', label: 'Ambos' },
    ];

    const chartColumns = timeSeries.map((bucket) => {
      const series = [];
      if (filters.seriesMode === 'classes' || filters.seriesMode === 'both') {
        series.push({
          key: filters.normalize ? 'occupancy' : 'classes',
          label: filters.normalize ? 'Ocupación' : 'Clases',
          tone: 'classes',
          value: filters.normalize ? bucket.occupancyPct : bucket.classes,
        });
      }
      if (filters.seriesMode === 'packages' || filters.seriesMode === 'both') {
        series.push({
          key: 'packages',
          label: 'Paquetes',
          tone: 'packages',
          value: bucket.packages,
        });
      }
      if (filters.showCancellations) {
        series.push({
          key: 'cancellations',
          label: 'Cancelaciones',
          tone: 'cancellations',
          value: bucket.cancellations,
        });
      }

      return {
        key: bucket.key,
        label: bucket.label,
        meta: {
          occupancyPct: bucket.occupancyPct,
          revenue: bucket.revenue,
        },
        series,
      };
    });

    const chartMax = chartColumns.reduce((max, column) => {
      const columnMax = column.series.reduce((serieMax, serie) => Math.max(serieMax, serie.value), 0);
      return Math.max(max, columnMax);
    }, 0);

    const chartTotals = timeSeries.reduce(
      (acc, bucket) => {
        acc.classes += bucket.classes;
        acc.packages += bucket.packages;
        acc.cancellations += bucket.cancellations;
        acc.revenue += bucket.revenue;
        acc.booked += bucket.booked;
        acc.capacity += bucket.capacity;
        return acc;
      },
      {
        classes: 0,
        packages: 0,
        cancellations: 0,
        revenue: 0,
        booked: 0,
        capacity: 0,
      }
    );

    const summaryOccupancy =
      chartTotals.capacity > 0
        ? Math.round((chartTotals.booked / chartTotals.capacity) * 100)
        : chartTotals.booked > 0
          ? 100
          : 0;

    const summaryCancellationRate =
      chartTotals.booked + chartTotals.cancellations > 0
        ? Math.round(
            (chartTotals.cancellations / (chartTotals.booked + chartTotals.cancellations)) * 100
          )
        : 0;

    const chartSummary = {
      classes: chartTotals.classes,
      packages: chartTotals.packages,
      occupancy: summaryOccupancy,
      cancellations: chartTotals.cancellations,
      cancellationRate: summaryCancellationRate,
      booked: chartTotals.booked,
      revenue: chartTotals.revenue,
      capacity: chartTotals.capacity,
    };

    const axisTicks = filters.normalize
      ? [0, 25, 50, 75, 100]
      : buildAxisTicks(chartMax, { minTicks: 4 });

    const scaleMaxCandidate =
      filters.normalize ? 100 : axisTicks[axisTicks.length - 1] ?? chartMax;
    const chartScaleMax = scaleMaxCandidate > 0 ? scaleMaxCandidate : 1;
    const chartIsEmpty = !chartColumns.some((column) =>
      column.series.some((serie) => Number.isFinite(serie.value) && serie.value > 0)
    );

    const handleExport = (format) => {
      console.info('Export chart request', { format, filters });
    };

    return (
      <>
        <div className="home-header">
          <div className="home-identity">
            <img
              src={user?.avatarUrl}
              alt={user?.firstName ?? 'Usuario'}
              className="avatar avatar--xl"
            />
            <div className="home-greeting">
              <span className="home-eyebrow">FITZY Venue Admin</span>
              <h1 className="home-title">Hola, {user?.firstName ?? 'equipo'} 👋</h1>
              <p className="home-subtitle">
                Administra tu estudio y visualiza el rendimiento a un vistazo.
              </p>
            </div>
          </div>
          <div className="kpi-group">
            <div className="kpi">
              <span className="kpi-label">Reservas hoy</span>
              <span className="kpi-value">{formatNumber(dashboardMetrics.today.bookings)}</span>
              <span
                className={`kpi-trend ${
                  dashboardMetrics.today.bookingsTrend >= 0 ? 'kpi-trend--up' : 'kpi-trend--down'
                }`}
              >
                {formatTrend(dashboardMetrics.today.bookingsTrend)}
              </span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Ocupación</span>
              <span className="kpi-value">{formatNumber(dashboardMetrics.month.occupancyPct)}%</span>
              <span
                className={`kpi-trend ${
                  dashboardMetrics.month.occupancyTrend >= 0 ? 'kpi-trend--up' : 'kpi-trend--down'
                }`}
              >
                {formatTrend(dashboardMetrics.month.occupancyTrend)}
              </span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Ingresos (mes)</span>
              <span className="kpi-value">{formatCurrency(dashboardMetrics.month.revenue)}</span>
              <span
                className={`kpi-trend ${
                  dashboardMetrics.month.revenueTrend >= 0 ? 'kpi-trend--up' : 'kpi-trend--down'
                }`}
              >
                {formatTrend(dashboardMetrics.month.revenueTrend)}
              </span>
            </div>
          </div>
        </div>

        <div className="home-grid">
          <div className="home-col home-col--main">
            <section className="card analytics-card chart-card">
              <div className="card-header">
                <div>
                  <h2>Clases vs Paquetes</h2>
                  <span className="chart-subtitle">Rendimiento</span>
                </div>
              </div>

              <div
                className="chart-toolbar"
                role="toolbar"
                aria-label="Filtros del gráfico Clases vs Paquetes"
              >
                <div className="chart-toolbar-row">
                  <div className="filter-group">
                    <span className="filter-label">Series</span>
                    <div className="segmented-control" role="radiogroup" aria-label="Series">
                      {seriesOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`segment ${
                            filters.seriesMode === option.key ? 'segment--active' : ''
                          }`}
                          role="radio"
                          aria-checked={filters.seriesMode === option.key}
                          onClick={() => handleFilterChange('seriesMode', option.key)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className="chart-toolbar-actions"
                    role="group"
                    aria-label="Opciones de visualización"
                  >
                    <button
                      type="button"
                      className={`toggle toggle--pill ${filters.normalize ? 'toggle--active' : ''}`}
                      aria-pressed={filters.normalize}
                      onClick={() => handleFilterToggle('normalize')}
                    >
                      Normalizar por aforo
                    </button>
                    <button
                      type="button"
                      className={`toggle toggle--pill ${
                        filters.showCancellations ? 'toggle--active' : ''
                      }`}
                      aria-pressed={filters.showCancellations}
                      onClick={() => handleFilterToggle('showCancellations')}
                    >
                      Ver cancelaciones
                    </button>
                  </div>

                  <div className="chart-toolbar-spacer" />

                  <div className="export-menu">
                    <span className="filter-label">Exportar</span>
                    <div className="export-actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleExport('png')}
                      >
                        PNG
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleExport('csv')}
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                </div>

                <div className="chart-toolbar-row chart-toolbar-row--filters">
                  <label className="filter-control">
                    <span className="filter-label">Periodo</span>
                    <select
                      className="control control--sm"
                      value={filters.range}
                      onChange={(event) => handleFilterChange('range', event.target.value)}
                    >
                      <option value="7d">Últimos 7 días</option>
                      <option value="30d">Últimos 30 días</option>
                      <option value="6m">Últimos 6 meses</option>
                      <option value="ytd">Año actual</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </label>

                  {filters.range === 'custom' ? (
                    <div className="filter-dates">
                      <label className="filter-control">
                        <span className="filter-label">Desde</span>
                        <input
                          type="date"
                          className="control control--sm"
                          value={filters.customStart}
                          onChange={(event) =>
                            handleCustomRangeChange('customStart', event.target.value)
                          }
                        />
                      </label>
                      <label className="filter-control">
                        <span className="filter-label">Hasta</span>
                        <input
                          type="date"
                          className="control control--sm"
                          value={filters.customEnd}
                          onChange={(event) =>
                            handleCustomRangeChange('customEnd', event.target.value)
                          }
                        />
                      </label>
                    </div>
                  ) : null}

                  <label className="filter-control">
                    <span className="filter-label">Intervalo</span>
                    <select
                      className="control control--sm"
                      value={filters.interval}
                      onChange={(event) => handleFilterChange('interval', event.target.value)}
                    >
                      <option value="auto">Automático</option>
                      <option value="day">Día</option>
                      <option value="week">Semana</option>
                      <option value="month">Mes</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="chart-body">
                <div className="chart-summary" aria-label="Resumen del gráfico">
                  <div className="chart-summary-item">
                    <span className="chart-summary-label">Clases programadas</span>
                    <span className="chart-summary-value">{formatNumber(chartSummary.classes)}</span>
                    <span className="chart-summary-hint">En el periodo seleccionado</span>
                  </div>
                  <div className="chart-summary-item">
                    <span className="chart-summary-label">Paquetes vendidos</span>
                    <span className="chart-summary-value">{formatNumber(chartSummary.packages)}</span>
                    <span className="chart-summary-hint">Altas totales</span>
                  </div>
                  <div className="chart-summary-item">
                    <span className="chart-summary-label">Ocupación promedio</span>
                    <span className="chart-summary-value">{chartSummary.occupancy}%</span>
                    <span className="chart-summary-hint">
                      {chartSummary.capacity > 0
                        ? `${formatNumber(chartSummary.booked)} plazas ocupadas`
                        : 'Sin datos de aforo'}
                    </span>
                  </div>
                  <div className="chart-summary-item">
                    <span className="chart-summary-label">Cancelaciones</span>
                    <span className="chart-summary-value">
                      {formatNumber(chartSummary.cancellations)}
                      {chartSummary.cancellationRate > 0
                        ? ` · ${chartSummary.cancellationRate}%`
                        : ''}
                    </span>
                    <span className="chart-summary-hint">Sobre reservas registradas</span>
                  </div>
                </div>

                {chartLegend.length ? (
                  <div className="chart-legend">
                    {chartLegend.map((item) => (
                      <span
                        key={item.key}
                        className={`chart-legend-item chart-legend-item--${item.key}`}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="chart-visual">
                  <div className="chart-axis" aria-hidden="true">
                    <div className="chart-axis-track">
                      {axisTicks.map((tick) => (
                        <span
                          key={`axis-${tick}`}
                          className="chart-axis-label"
                          style={{ bottom: `${(tick / chartScaleMax) * 100}%` }}
                        >
                          {filters.normalize ? `${tick}%` : formatNumber(tick)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="chart-plot">
                    <div className="chart-guides">
                      {axisTicks.map((tick) => {
                        const guideClassName = [
                          'chart-guide-line',
                          tick === chartScaleMax ? 'chart-guide-line--major' : '',
                          tick === 0 ? 'chart-guide-line--baseline' : '',
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <span
                            key={`guide-${tick}`}
                            className={guideClassName}
                            style={{ bottom: `${(tick / chartScaleMax) * 100}%` }}
                          />
                        );
                      })}
                    </div>
                    {chartIsEmpty ? (
                      <div className="empty-state empty-state--compact chart-empty-state">
                        Sin datos en el rango seleccionado. Ajusta los filtros.
                      </div>
                    ) : (
                      <div className="chart-bars">
                        {chartColumns.map((column) => (
                          <div key={column.key} className="chart-bar">
                            <div
                              className="chart-bar-group"
                              title={`Ocupación ${column.meta.occupancyPct}% · ${formatCurrency(column.meta.revenue)}`}
                            >
                              {column.series.map((serie) => {
                                const valueLabel =
                                  filters.normalize && serie.key === 'occupancy'
                                    ? `${serie.value}%`
                                    : formatNumber(serie.value);
                                return (
                                  <div
                                    key={serie.key}
                                    className={`chart-bar-item chart-bar-item--${serie.tone}`}
                                    style={{
                                      height: `${Math.max(
                                        4,
                                        Math.round((serie.value / chartScaleMax) * 100)
                                      )}%`,
                                    }}
                                    aria-label={`${serie.label}: ${valueLabel}`}
                                  />
                                );
                              })}
                            </div>
                            <span className="chart-bar-label">{column.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="insights-inline">
                <div className="insight">
                  <span className="insight-label">Clase más popular</span>
                  <span className="insight-value">
                    {insights.topClass.name}
                    {insights.topClass.attendance !== null
                      ? ` (${insights.topClass.attendance}% asistencia)`
                      : ''}
                  </span>
                </div>
                <div className="insight">
                  <span className="insight-label">Horario pico</span>
                  <span className="insight-value">
                    {insights.peakHour !== null
                      ? `${insights.peakHour}:00 · ${formatNumber(insights.peakHourBookings)} reservas`
                      : 'Sin datos'}
                  </span>
                </div>
                <div className="insight">
                  <span className="insight-label">Cancelaciones (mes)</span>
                  <span className="insight-value">
                    {formatNumber(dashboardMetrics.month.cancellations)} ·{' '}
                    {dashboardMetrics.month.cancellationsPct}%
                  </span>
                </div>
              </div>
            </section>

            <section className="card analytics-card">
              <div className="card-header">
                <h2>Reservas recientes</h2>
              </div>
              <div className="list">
                {recentBookings.length === 0 ? (
                  <div className="empty-state">Sin reservas registradas por ahora.</div>
                ) : (
                  recentBookings.map((booking) => (
                    <div key={booking.id} className="list-item">
                      <img
                        src={booking.client.avatar}
                        alt={booking.client.name}
                        className="avatar avatar--small"
                      />
                      <div className="list-item-body">
                        <div className="item-title">{booking.client.name}</div>
                        <div className="item-subtitle">
                          {booking.title} • {booking.when} · {booking.time}
                        </div>
                      </div>
                      <span
                        className={`status-badge status-badge--${booking.status}`}
                        aria-label={`Estado ${booking.statusLabel}`}
                      >
                        {booking.statusLabel}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="card-footer">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => window.open('/bookings?sort=-createdAt', '_self')}
                >
                  Ver todas
                </button>
              </div>
            </section>
          </div>

          <div className="home-col home-col--aside">
            <section className="card highlight-card">
              <div className="card-header">
                <h2>Próxima clase</h2>
              </div>
              {nextClassInfo ? (
                <div className="highlight-content">
                  <div className="highlight-heading">{nextClassInfo.title}</div>
                  <div className="highlight-line">{nextClassInfo.date}</div>
                  <div className="highlight-line">
                    {nextClassInfo.time} • {nextClassInfo.instructor}
                  </div>
                  <div className="highlight-muted">{nextClassInfo.capacity}</div>
                  <div className="highlight-actions">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => window.open(`/classes/${nextClass?.id ?? ''}`, '_self')}
                      disabled={!nextClass?.id}
                    >
                      Ver detalles
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => window.open(`/classes/${nextClass?.id ?? ''}/checkin`, '_self')}
                      disabled={!nextClass?.id}
                    >
                      Check-in
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">No hay clases programadas hoy.</div>
              )}
            </section>

            <section className="card analytics-card">
              <div className="card-header">
                <h2>Cancelaciones</h2>
              </div>
              <div className="stack stack--sm">
                <div className="metric metric--light">
                  <span className="metric-label">Total este mes</span>
                  <span className="metric-value">
                    {formatNumber(dashboardMetrics.month.cancellations)}
                  </span>
                </div>
                <div className="progress">
                  <div className="progress-label">
                    Ratio mensual · {dashboardMetrics.month.cancellationsPct}%
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-bar"
                      style={{ width: `${Math.min(100, dashboardMetrics.month.cancellationsPct)}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => window.open('/reports/cancellations', '_self')}
                >
                  Ver reporte
                </button>
              </div>
            </section>

            <section className="card analytics-card">
              <div className="card-header">
                <h2>Clases populares</h2>
              </div>
              <div className="list list--compact">
                {insights.popularClasses.length === 0 ? (
                  <div className="empty-state">Aún no hay reservas confirmadas.</div>
                ) : (
                  insights.popularClasses.map((item) => (
                    <div key={item.name} className="list-item">
                      <div className="list-item-body">
                        <div className="item-title">{item.name}</div>
                      </div>
                      <span className="chip chip--info">
                        {item.attendance !== null ? `${item.attendance}%` : '—'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </>
    );
  };

  const renderClasses = () => {
    const repeat = createClassForm.repeat ?? {};
    const repeatDays = Array.isArray(repeat.byDay)
      ? repeat.byDay.map((value) => value.toUpperCase())
      : [];
    const isWeeklyRepeat = repeat.freq === 'WEEKLY';
    const frequencyOptions = [
      { value: 'DAILY', label: 'Diario' },
      { value: 'WEEKLY', label: 'Semanal' },
      { value: 'MONTHLY', label: 'Mensual' },
    ];
    const weeklyDayOptions = WEEKDAY_OPTIONS.map((day) => ({
      key: toRRuleDay(day.key),
      label: day.label,
      name: day.name,
    }));
    const conflictItems = formConflicts.items;
    const blockingConflicts = formConflicts.blocking;
    const todayKpis = [
      { label: 'Clases hoy', value: formatNumber(todaySummary.count) },
      { label: 'Reservas hoy', value: formatNumber(todaySummary.bookings) },
      { label: 'Lista de espera', value: formatNumber(todaySummary.waitlist) },
    ];
    const selectedDateSummaryLabel = uiState.selectedDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const isLoadingDay = loadingClasses && classes.length === 0;
    const goToToday = () => {
      const today = new Date();
      handleMonthChange(today);
      handleSelectDate(today);
    };
    const selectedDayOccupancyPct =
      selectedDaySummary.capacity > 0
        ? Math.min(
            100,
            Math.round((selectedDaySummary.occupied / selectedDaySummary.capacity) * 100)
          )
        : selectedDaySummary.occupied > 0
          ? 100
          : 0;
    const dayFilterOptions = [
      { value: 'all', label: 'Todas' },
      { value: 'available', label: 'Disponibles' },
      { value: 'full', label: 'Llenas' },
      { value: 'waitlist', label: 'Con espera' },
    ];
    const handleDayFilterChange = (value) => {
      setClassView((prev) => ({
        ...prev,
        dayFilter: value,
      }));
    };
    const handleShiftDay = (delta) => handleShiftSelectedDate(delta);

    return (
      <div className="classes-view">
        <section className="classes-hero card">
          <div className="classes-hero-body">
            <span className="classes-hero-eyebrow">Gestión de clases</span>
            <h1 className="classes-hero-title">Planificador de clases</h1>
            <p className="classes-hero-subtitle">
              Diseña tu programación con claridad. Ajusta horarios, confirma instructores y anticipa ocupación con herramientas pensadas para equipos modernos.
            </p>
            <div className="classes-hero-actions">
              <button type="button" className="btn btn--primary" onClick={goToToday}>
                Ir a hoy
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => updateUi({ isAddingInstructor: true })}
              >
                Añadir instructor
              </button>
            </div>
          </div>
          <div className="classes-hero-kpis">
            {todayKpis.map((kpi) => (
              <div key={kpi.label} className="kpi kpi--flush">
                <span className="kpi-label">{kpi.label}</span>
                <span className="kpi-value">{kpi.value}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="classes-toolbar card card--surface">
          <div className="classes-toolbar-date">
            <span className="classes-toolbar-eyebrow">Visualizando</span>
            <strong>{selectedDateSummaryLabel}</strong>
          </div>
          <div className="classes-toolbar-controls">
            <div className="classes-toolbar-buttons">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => handleShiftDay(-1)}
              >
                <Icon name="chevronLeft" size={16} /> Día anterior
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={goToToday}>
                Hoy
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => handleShiftDay(1)}
              >
                Siguiente día <Icon name="chevronRight" size={16} />
              </button>
            </div>
            <div className="classes-filters">
              {dayFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`filter-chip ${
                    classView.dayFilter === option.value ? 'filter-chip--active' : ''
                  }`}
                  onClick={() => handleDayFilterChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="classes-layout">
          <div className="classes-column classes-column--secondary">
            <section className="card calendar-panel">
              <div className="calendar-panel-header">
                <div>
                  <span className="calendar-panel-eyebrow">Calendario</span>
                  <h2>Agenda visual</h2>
                </div>
                <div className="calendar-panel-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={goToToday}>
                    Hoy
                  </button>
                </div>
              </div>
              <div className="calendar-panel-body">
                <Calendar
                  month={uiState.calendarMonth}
                  selectedDate={uiState.selectedDate}
                  onMonthChange={handleMonthChange}
                  onSelectDate={handleSelectDate}
                  badges={monthBadges}
                />
                <div className="calendar-meta">
                  <div className="calendar-meta-item">
                    <span className="calendar-meta-label">Clases</span>
                    <span className="calendar-meta-value">
                      {formatNumber(selectedDaySummary.count)}
                    </span>
                  </div>
                  <div className="calendar-meta-item">
                    <span className="calendar-meta-label">Reservas</span>
                    <span className="calendar-meta-value">
                      {formatNumber(selectedDaySummary.occupied)}
                    </span>
                  </div>
                  <div className="calendar-meta-item">
                    <span className="calendar-meta-label">Lista de espera</span>
                    <span className="calendar-meta-value">
                      {formatNumber(selectedDaySummary.waitlist)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="schedule-divider" />
              <div className="day-list">
                <div className="day-list-heading">
                  <div>
                    <span className="day-list-eyebrow">{selectedDateSummaryLabel}</span>
                    <h3>Clases programadas</h3>
                  </div>
                </div>
                {isLoadingDay ? (
                  <div className="empty-state empty-state--compact">Cargando clases...</div>
                ) : filteredDayClasses.length === 0 ? (
                  <div className="empty-state empty-state--compact">
                    No hay clases para esta fecha.
                  </div>
                ) : (
                  filteredDayClasses.map((session) => {
                    const startValue = session.start ?? session.start_datetime;
                    const endValue = session.end ?? session.end_datetime;
                    const occupied = Number(session.booked ?? session.capacity_taken ?? 0);
                    const capacity = Number(session.capacity ?? session.capacity_total ?? 0);
                    const waitlist =
                      session.waitlistCount ??
                      (Array.isArray(session.waitlist) ? session.waitlist.length : 0);
                    const isFull = capacity > 0 && occupied >= capacity;
                    const classTypeName = lookupClassTypeName(session.typeId ?? session.classTypeId);
                    const roomName = session.room?.name ?? lookupRoomName(session.roomId);
                    const occupancyPct =
                      capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;
                    return (
                      <div key={session.id} className="day-list-item">
                        <div className="day-item-info">
                          <div className="item-title">{session.name ?? session.title}</div>
                          <div className="item-subtitle">
                            {timeRange(startValue, endValue)} •{' '}
                            {lookupInstructorName(session.instructorId ?? session.instructor?.id)}
                          </div>
                          <div className="class-progress">
                            <div className="class-progress-track">
                              <div
                                className="class-progress-value"
                                style={{ width: `${occupancyPct}%` }}
                              />
                            </div>
                            <span className="class-progress-label">
                              {formatNumber(occupied)} / {formatNumber(capacity || 0)} cupos
                            </span>
                          </div>
                          <div className="class-meta">
                            {classTypeName ? (
                              <span className="chip chip--info">{classTypeName}</span>
                            ) : null}
                            {roomName ? <span className="chip chip--neutral">{roomName}</span> : null}
                            <span className={`chip ${isFull ? 'chip--alert' : 'chip--success'}`}>
                              {occupied}/{capacity || '∞'} ocupados
                            </span>
                            {waitlist ? (
                              <span className="chip chip--waitlist">{waitlist} en espera</span>
                            ) : null}
                          </div>
                          <div className="class-actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleViewSession(session.id)}
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleDuplicateSession(session.id)}
                            >
                              Duplicar
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleEditSession(session.id)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm btn--danger"
                              onClick={() => handleCancelSession(session.id)}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={() => handleCheckInSession(session.id)}
                            >
                              Check-in
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="card day-summary-card">
              <div className="day-summary-card-header">
                <div>
                  <span className="day-summary-eyebrow">Salud del día</span>
                  <h2>Resumen del día</h2>
                </div>
                <span className="day-summary-date">{selectedDateSummaryLabel}</span>
              </div>
              <div className="day-summary-grid">
                <div className="day-summary-item day-summary-item--progress">
                  <span className="day-summary-label">Ocupación programada</span>
                  <span className="day-summary-value">
                    {formatNumber(selectedDayOccupancyPct)}%
                  </span>
                  <div className="day-summary-progress" aria-hidden="true">
                    <div
                      className="day-summary-progress-bar"
                      style={{ width: `${Math.min(selectedDayOccupancyPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="day-summary-item">
                  <span className="day-summary-label">Clases agendadas</span>
                  <span className="day-summary-value">
                    {formatNumber(selectedDaySummary.count)}
                  </span>
                  <span className="day-summary-hint">Sesiones en el día</span>
                </div>
                <div className="day-summary-item">
                  <span className="day-summary-label">Reservas confirmadas</span>
                  <span className="day-summary-value">
                    {formatNumber(selectedDaySummary.occupied)}
                  </span>
                  <span className="day-summary-hint">
                    De {formatNumber(selectedDaySummary.capacity)} cupos
                  </span>
                </div>
                <div className="day-summary-item">
                  <span className="day-summary-label">Lista de espera</span>
                  <span className="day-summary-value">
                    {formatNumber(selectedDaySummary.waitlist)}
                  </span>
                  <span className="day-summary-hint">Clientes esperando cupo</span>
                </div>
              </div>
            </section>
          </div>

          <div className="classes-column">
            <section className="card classes-editor">
              <div className="card-header card-header--subtle">
                <div>
                  <h2>Crear clase</h2>
                  <p className="card-subtitle">Completa los detalles y guarda</p>
                </div>
            </div>
            <form className="form-grid" onSubmit={handleClassFormSubmit}>
              <div className="form-grid-row form-grid-row--2">
                <FormField label="Nombre de la clase" id="class-name" error={formErrors.name}>
                  <input
                    id="class-name"
                    type="text"
                    className="control"
                    placeholder="Ej. HIIT 45"
                    value={createClassForm.name}
                    maxLength={60}
                    onChange={(event) => handleCreateClassChange('name', event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="Tipo de clase"
                  id="class-type"
                  error={formErrors.typeId}
                  hint={
                    loadingClassTypes
                      ? 'Cargando tipos de clase...'
                      : classTypes.length === 0
                        ? 'Crea tipos de clase desde el panel de dueño o contacta al administrador.'
                        : undefined
                  }
                >
                  <select
                    id="class-type"
                    className="control"
                    disabled={classTypes.length === 0 || loadingClassTypes}
                    value={createClassForm.typeId}
                    onChange={(event) => handleCreateClassChange('typeId', event.target.value)}
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    {classTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="form-grid-row form-grid-row--3">
                <FormField
                  label="Cantidad de cupos"
                  id="class-capacity"
                  error={formErrors.capacity}
                  hint="Capacidad total para la sesión"
                >
                  <input
                    id="class-capacity"
                    type="number"
                    min={1}
                    max={100}
                    className="control"
                    value={createClassForm.capacity}
                    onChange={(event) => handleCreateClassChange('capacity', event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="Seleccionar instructor"
                  id="class-instructor"
                  error={formErrors.instructorId}
                  hint={
                    loadingInstructors
                      ? 'Cargando instructores disponibles...'
                      : instructors.length === 0
                        ? 'Añade instructores para poder programar clases.'
                        : undefined
                  }
                >
                  <select
                    id="class-instructor"
                    className="control"
                    disabled={instructors.length === 0 || loadingInstructors}
                    value={createClassForm.instructorId}
                    onChange={(event) => handleCreateClassChange('instructorId', event.target.value)}
                    required
                  >
                    <option value="">Selecciona un instructor</option>
                    {instructorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="form-grid-row form-grid-row--3">
                <FormField label="Seleccionar fecha" id="class-date">
                  <input
                    id="class-date"
                    type="date"
                    className="control"
                    value={createClassForm.date}
                    min={formatDateInput(new Date())}
                    onChange={(event) => {
                      const nextDate = event.target.value;
                      handleCreateClassChange('date', nextDate);
                      updateUi({ selectedDate: parseDateInput(nextDate) });
                    }}
                    required
                  />
                </FormField>
                <FormField label="Seleccionar hora" id="class-time" error={formErrors.time}>
                  <input
                    id="class-time"
                    type="time"
                    step={300}
                    className="control"
                    value={createClassForm.time}
                    onChange={(event) => handleCreateClassChange('time', event.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Duración (min)" id="class-duration" error={formErrors.duration}>
                  <input
                    id="class-duration"
                    type="number"
                    min={15}
                    max={180}
                    step={5}
                    className="control"
                    value={createClassForm.duration}
                    onChange={(event) => handleCreateClassChange('duration', event.target.value)}
                    required
                  />
                </FormField>
              </div>

              <div className="repeat-card repeat-card--subtle">
                <div className="repeat-header">
                  <div>
                    <div className="repeat-title">Repetir clase</div>
                    <div className="repeat-subtitle">
                      Programa repeticiones automáticas (máximo 6 eventos adicionales).
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(repeat.enabled)}
                    onChange={handleRepeatToggle}
                    ariaLabel="Activar repetición de la clase"
                  />
                </div>

                {repeat.enabled ? (
                  <div className="repeat-body">
                    <div className="form-grid-row form-grid-row--4">
                      <FormField label="Frecuencia" id="repeat-freq">
                        <select
                          id="repeat-freq"
                          className="control"
                          value={repeat.freq}
                          onChange={(event) => handleRepeatChange('freq', event.target.value)}
                        >
                          {frequencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      {isWeeklyRepeat ? (
                        <FormField label="Días (si semanal)" id="repeat-byday">
                          <div className="repeat-days">
                            {weeklyDayOptions.map((day) => {
                              const active = repeatDays.includes(day.key);
                              return (
                                <button
                                  key={day.key}
                                  type="button"
                                  className={`repeat-day ${active ? 'repeat-day--active' : ''}`}
                                  onClick={() => handleRepeatDayToggle(day.key)}
                                >
                                  {day.label}
                                  <span className="sr-only">{day.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </FormField>
                      ) : null}
                      <FormField label="Ocurrencias" id="repeat-count">
                        <input
                          id="repeat-count"
                          type="number"
                          min={1}
                          max={6}
                          className="control"
                          value={repeat.count ?? 1}
                          onChange={(event) => handleRepeatChange('count', event.target.value)}
                        />
                      </FormField>
                      <FormField label="Hasta" id="repeat-until">
                        <input
                          id="repeat-until"
                          type="date"
                          className="control"
                          min={createClassForm.date}
                          value={repeat.until ?? ''}
                          onChange={(event) => handleRepeatChange('until', event.target.value)}
                        />
                      </FormField>
                    </div>
                    <p className="form-hint">
                      Las repeticiones respetan conflictos y aforo. Se omitirán choques de sala o instructor.
                    </p>
                  </div>
                ) : (
                  <div className="repeat-subtitle">
                    Activa la repetición para programar esta sesión automáticamente.
                  </div>
                )}
              </div>

              <div className="form-grid-row form-grid-row--3">
                <FormField label="Tamaño de lista de espera" id="waitlist-size">
                  <input
                    id="waitlist-size"
                    type="number"
                    min={0}
                    max={50}
                    className="control"
                    value={createClassForm.waitlistSize}
                    onChange={(event) => handleCreateClassChange('waitlistSize', event.target.value)}
                  />
                </FormField>
                <div className="toggle-field">
                  <span>Permitir cancelación tardía</span>
                  <Switch
                    checked={Boolean(createClassForm.allowLateCancel)}
                    onChange={(value) => handleCreateClassToggle('allowLateCancel', value)}
                    ariaLabel="Permitir cancelación tardía"
                  />
                </div>
                <div className="toggle-field">
                  <span>Visible en app</span>
                  <Switch
                    checked={Boolean(createClassForm.visibleInApp)}
                    onChange={(value) => handleCreateClassToggle('visibleInApp', value)}
                    ariaLabel="Visible en la app de clientes"
                  />
                </div>
              </div>

              {conflictItems.length ? (
                <div className={`alert alert--warning ${blockingConflicts ? 'alert--blocking' : ''}`} role="alert">
                  <div className="alert-title">
                    Existen conflictos de horario con {conflictItems.length} elemento(s).
                  </div>
                  <ul className="alert-list">
                    {conflictItems.map((item) => (
                      <li key={item.id} className="alert-list-item">
                        {item.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="form-footer">
                <button type="button" className="btn btn--ghost" onClick={handleResetClassForm}>
                  Limpiar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSubmitting || blockingConflicts}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar clase'}
                </button>
              </div>
              <p className="form-hint form-hint--footer">
                Al guardar, la clase aparecerá inmediatamente en el calendario de tus clientes.
              </p>
            </form>
          </section>
          </div>

          <div className="classes-column classes-column--secondary">
            <section className="card calendar-panel">
              <div className="calendar-panel-header">
                <div>
                  <span className="calendar-panel-eyebrow">Calendario</span>
                  <h2>Agenda visual</h2>
                </div>
                <div className="calendar-panel-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={goToToday}>
                    Hoy
                  </button>
                </div>
              </div>
              <div className="calendar-panel-body">
                <Calendar
                  month={uiState.calendarMonth}
                  selectedDate={uiState.selectedDate}
                  onMonthChange={handleMonthChange}
                  onSelectDate={handleSelectDate}
                  badges={monthBadges}
                />
                <div className="calendar-meta">
                  <div className="calendar-meta-item">
                    <span className="calendar-meta-label">Clases</span>
                    <span className="calendar-meta-value">
                      {formatNumber(selectedDaySummary.count)}
                    </span>
                  </div>
                  <div className="calendar-meta-item">
                    <span className="calendar-meta-label">Reservas</span>
                    <span className="calendar-meta-value">
                      {formatNumber(selectedDaySummary.occupied)}
                    </span>
                  </div>
                  <div className="calendar-meta-item">
                    <span className="calendar-meta-label">Lista de espera</span>
                    <span className="calendar-meta-value">
                      {formatNumber(selectedDaySummary.waitlist)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="schedule-divider" />
              <div className="day-list">
                <div className="day-list-heading">
                  <div>
                    <span className="day-list-eyebrow">{selectedDateSummaryLabel}</span>
                    <h3>Clases programadas</h3>
                  </div>
                </div>
                {isLoadingDay ? (
                  <div className="empty-state empty-state--compact">Cargando clases...</div>
                ) : filteredDayClasses.length === 0 ? (
                  <div className="empty-state empty-state--compact">
                    No hay clases para esta fecha.
                  </div>
                ) : (
                  filteredDayClasses.map((session) => {
                    const startValue = session.start ?? session.start_datetime;
                    const endValue = session.end ?? session.end_datetime;
                    const occupied = Number(session.booked ?? session.capacity_taken ?? 0);
                    const capacity = Number(session.capacity ?? session.capacity_total ?? 0);
                    const waitlist =
                      session.waitlistCount ??
                      (Array.isArray(session.waitlist) ? session.waitlist.length : 0);
                    const isFull = capacity > 0 && occupied >= capacity;
                    const classTypeName = lookupClassTypeName(session.typeId ?? session.classTypeId);
                    const roomName = session.room?.name ?? lookupRoomName(session.roomId);
                    const occupancyPct =
                      capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;
                    return (
                      <div key={session.id} className="day-list-item">
                        <div className="day-item-info">
                          <div className="item-title">{session.name ?? session.title}</div>
                          <div className="item-subtitle">
                            {timeRange(startValue, endValue)} •{' '}
                            {lookupInstructorName(session.instructorId ?? session.instructor?.id)}
                          </div>
                          <div className="class-progress">
                            <div className="class-progress-track">
                              <div
                                className="class-progress-value"
                                style={{ width: `${occupancyPct}%` }}
                              />
                            </div>
                            <span className="class-progress-label">
                              {formatNumber(occupied)} / {formatNumber(capacity || 0)} cupos
                            </span>
                          </div>
                          <div className="class-meta">
                            {classTypeName ? (
                              <span className="chip chip--info">{classTypeName}</span>
                            ) : null}
                            {roomName ? <span className="chip chip--neutral">{roomName}</span> : null}
                            <span className={`chip ${isFull ? 'chip--alert' : 'chip--success'}`}>
                              {occupied}/{capacity || '∞'} ocupados
                            </span>
                            {waitlist ? (
                              <span className="chip chip--waitlist">{waitlist} en espera</span>
                            ) : null}
                          </div>
                          <div className="class-actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleViewSession(session.id)}
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleDuplicateSession(session.id)}
                            >
                              Duplicar
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleEditSession(session.id)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm btn--danger"
                              onClick={() => handleCancelSession(session.id)}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={() => handleCheckInSession(session.id)}
                            >
                              Check-in
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    );
  };


  if (authStatus === 'loading') {
    return (
      <div className="auth-shell auth-shell--loading">
        <div className="auth-loading-card">
          <div className="logo-badge">
            <Icon name="bolt" size={20} />
          </div>
          <p className="auth-loading-text">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (authStatus !== 'authenticated' || !user) {
    return (
      <AuthScreen
        onSuccess={handleAuthSuccess}
        message={authMessage}
        onPending={setAuthMessage}
      />
    );
  }


  return (
    <div className="app-shell">
      <div className="layout">
        <aside className="sidebar">
          <div className="logo-row">
            <div className="logo-badge">
              <Icon name="bolt" size={20} />
            </div>
            <div className="venue-name">
              {user?.venueName ?? 'Fitzy Venue'}
            </div>
          </div>

          <div className="card card--surface">
            <div className="user">
              <img
                src={user?.avatarUrl}
                alt={user?.firstName ?? 'Usuario'}
                className="avatar"
              />
              <div className="user-info">
                <div className="user-name">
                  {user?.firstName ?? 'Usuario'}
                </div>
                <div className="user-email">{user?.email}</div>
                <span className="badge badge--primary">
                  {user?.role ?? 'admin'}
                </span>
              </div>
            </div>
          </div>

          <nav className="nav" aria-label="Navegación principal">
            <button
              type="button"
              className={`nav-item ${
                uiState.activePage === 'home' ? 'nav-item--active' : ''
              }`}
              aria-current={uiState.activePage === 'home'}
              onClick={() => updateUi({ activePage: 'home' })}
            >
              <Icon name="home" size={18} />
              <span>Home</span>
            </button>
            <button
              type="button"
              className={`nav-item ${
                uiState.activePage === 'clases' ? 'nav-item--active' : ''
              }`}
              aria-current={uiState.activePage === 'clases'}
              onClick={() => updateUi({ activePage: 'clases' })}
            >
              <Icon name="users" size={18} />
              <span>Clases</span>
            </button>
            <button type="button" className="nav-item" disabled>
              <Icon name="credit-card" size={18} />
              <span>Clientes</span>
            </button>
          </nav>

          <div className="spacer" />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleLogout}
          >
            <span>Salir</span>
            <Icon name="logout" size={18} />
          </button>
        </aside>

        <main className={`main main--${uiState.activePage}`}>
          <div className="page-content">
            {uiState.activePage === 'home' ? renderDashboard() : renderClasses()}
          </div>
        </main>
      </div>

      <Modal
        open={uiState.isAddingInstructor}
        title="Añadir instructor"
        onClose={() => updateUi({ isAddingInstructor: false })}
      >
        <div className="stack stack--sm">
          <FormField label="Nombre" id="instructor-name">
            <input
              id="instructor-name"
              type="text"
              className="control"
              value={newInstructorForm.name}
              onChange={(event) =>
                handleNewInstructorChange('name', event.target.value)
              }
            />
          </FormField>
          <FormField label="Email" id="instructor-email">
            <input
              id="instructor-email"
              type="email"
              className="control"
              value={newInstructorForm.email}
              onChange={(event) =>
                handleNewInstructorChange('email', event.target.value)
              }
            />
          </FormField>
          <FormField label="Avatar URL" id="instructor-avatar">
            <input
              id="instructor-avatar"
              type="url"
              className="control"
              placeholder="https://"
              value={newInstructorForm.avatar}
              onChange={(event) =>
                handleNewInstructorChange('avatar', event.target.value)
              }
            />
          </FormField>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => updateUi({ isAddingInstructor: false })}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleAddInstructor}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <Toast
        message={uiState.toast}
        onHide={() => updateUi({ toast: '' })}
      />

      {isLoading ? (
        <div className="loading-indicator" aria-hidden="true">
          Cargando...
        </div>
      ) : null}
    </div>
  );
}

export default App;
