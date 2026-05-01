export type Route =
  | { name: 'home'; path: '#/' }
  | { name: 'schedule'; path: '#/schedule' }
  | { name: 'standings'; path: '#/standings' }
  | { name: 'unknown'; path: string };

export type RouteName = Route['name'];

const KNOWN: Record<string, Route> = {
  '#/': { name: 'home', path: '#/' },
  '#/schedule': { name: 'schedule', path: '#/schedule' },
  '#/standings': { name: 'standings', path: '#/standings' }
};

function parse(hash: string): Route {
  const normalized = hash === '' || hash === '#' ? '#/' : hash;
  return KNOWN[normalized] ?? { name: 'unknown', path: normalized };
}

const initial: Route = parse(typeof location !== 'undefined' ? location.hash : '#/');
let _route = $state<Route>(initial);

export const router = {
  get current(): Route {
    return _route;
  }
};

export function navigate(path: string): void {
  if (typeof location === 'undefined') return;
  if (location.hash === path) {
    _route = parse(path);
    return;
  }
  location.hash = path;
}

if (typeof window !== 'undefined') {
  if (!location.hash) {
    history.replaceState(null, '', `${location.pathname}${location.search}#/`);
  }
  window.addEventListener('hashchange', () => {
    _route = parse(location.hash);
  });
  _route = parse(location.hash || '#/');
}
