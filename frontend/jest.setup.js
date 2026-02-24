import '@testing-library/jest-dom'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
    getAll: jest.fn().mockReturnValue([]),
    has: jest.fn().mockReturnValue(false),
    forEach: jest.fn(),
    entries: jest.fn().mockReturnValue([]),
    keys: jest.fn().mockReturnValue([]),
    values: jest.fn().mockReturnValue([]),
    toString: jest.fn().mockReturnValue(''),
  }),
  usePathname: () => '',
  useParams: () => ({}),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'ru',
  useMessages: () => ({}),
  useTimeZone: () => 'UTC',
  useNow: () => new Date(),
}));
