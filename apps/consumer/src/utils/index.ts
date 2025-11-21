const PAGE_SLUGS: Record<string, string> = {
    Home: 'home',
    Explore: 'explore',
    ExploreClasses: 'explore/classes',
    ExploreCourts: 'explore/courts',
    Calendar: 'calendar',
    Favorites: 'favorites',
    VenueDetails: 'venues',
    CourtDetails: 'complexes',
    CourtSchedule: 'courts',
    ReservationDetails: 'reservation-details',
    Packages: 'packages',
    PersonalInfo: 'personal-info',
    Wallet: 'wallet',
    CategoryResults: 'explore/classes',
    CourtCategoryResults: 'explore/courts',
    CategorySchedule: 'category-schedule',
};

const SLUG_TO_PAGE: Record<string, string> = Object.entries(PAGE_SLUGS).reduce(
    (acc, [pageName, slug]) => {
        acc[slug] = pageName;
        return acc;
    },
    { home: 'Home' } as Record<string, string>
);

function camelOrTitleToSlug(input: string) {
    return input
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .replace(/_+/g, '-')
        .toLowerCase();
}

export function pageNameToSlug(pageName: string) {
    if (!pageName) {
        return '';
    }

    const mapped = PAGE_SLUGS[pageName];
    if (mapped) {
        return mapped;
    }

    return camelOrTitleToSlug(pageName);
}

export function slugToPageName(slug: string | null | undefined) {
    if (!slug) {
        return 'Home';
    }

    const normalized = slug.toLowerCase();
    return SLUG_TO_PAGE[normalized] ?? null;
}

export function createPageUrl(pageName: string) {
    const slug = pageNameToSlug(pageName);
    if (!slug || slug === 'home') {
        return '/';
    }

    return `/${slug}`;
}

const DYNAMIC_ROUTE_PATTERNS: { name: string; regex: RegExp }[] = [
    { name: 'VenueSchedule', regex: /^venues\/[^/]+\/schedule/ },
    { name: 'VenueDetails', regex: /^venues\/[^/]+$/ },
    { name: 'CourtSchedule', regex: /^courts\/[^/]+$/ },
    { name: 'CourtDetails', regex: /^complexes\/[^/]+$/ },
    { name: 'CategorySchedule', regex: /^explore\/classes\/[^/]+\/schedule/ },
    { name: 'CategoryResults', regex: /^explore\/classes\/[^/]+/ },
    { name: 'CourtCategoryResults', regex: /^explore\/courts\/[^/]+/ },
    { name: 'ExploreCourts', regex: /^explore\/courts$/ },
    { name: 'ExploreClasses', regex: /^explore\/classes$/ },
];

export function getPageNameFromPath(pathname: string | null | undefined) {
    if (!pathname || pathname === '/' || pathname === '') {
        return 'Home';
    }

    let segment = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '');
    if (segment === '') {
        return 'Home';
    }

    if (segment.startsWith('/')) {
        segment = segment.slice(1);
    }

    if (segment === '' || segment.toLowerCase() === 'home') {
        return 'Home';
    }

    for (const pattern of DYNAMIC_ROUTE_PATTERNS) {
        if (pattern.regex.test(segment)) {
            return pattern.name;
        }
    }

    const matchedSlug = Object.entries(PAGE_SLUGS).find(([, slug]) => {
        return segment === slug || segment.startsWith(`${slug}/`);
    });
    if (matchedSlug) {
        return matchedSlug[0];
    }

    const [firstSegment] = segment.split('/');
    return slugToPageName(firstSegment) ?? 'Home';
}

export function getLocalToday(): Date {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now;
}

const COURT_KEYWORDS = ['court', 'padel', 'tennis', 'pickle', 'pickleball'];

export function isCourtVenue(venue: { name?: string | null; description?: string | null } | null | undefined) {
    if (!venue) return false;
    const haystacks = [venue.name, venue.description]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

    return COURT_KEYWORDS.some((keyword) =>
        haystacks.some((haystack) => haystack.includes(keyword))
    );
}

export function toCategorySlug(name: string | null | undefined) {
    if (!name) return '';
    return name
        .toString()
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function fromCategorySlug(slug: string | null | undefined) {
    if (!slug) return '';
    return slug
        .toString()
        .split('-')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
