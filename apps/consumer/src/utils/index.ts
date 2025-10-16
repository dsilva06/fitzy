const PAGE_SLUGS: Record<string, string> = {
    Home: 'home',
    Explore: 'explore',
    Calendar: 'calendar',
    Favorites: 'favorites',
    VenueSchedule: 'venue-schedule',
    ReservationDetails: 'reservation-details',
    Packages: 'packages',
    PersonalInfo: 'personal-info',
    Wallet: 'wallet',
    CategoryResults: 'category-results',
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

    return slugToPageName(segment) ?? 'Home';
}
