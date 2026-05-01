const BASE = 'https://api.openf1.org/v1';

export type OpenF1Params = Record<string, string | number | boolean | undefined>;

export class OpenF1Error extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OpenF1Error';
  }
}

async function get<T>(path: string, params: OpenF1Params = {}, signal?: AbortSignal): Promise<T[]> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { signal });
  if (!res.ok) throw new OpenF1Error(`OpenF1 ${path} ${res.status}`, res.status);
  return res.json() as Promise<T[]>;
}

export interface Session {
  session_key: number;
  session_type: 'Practice' | 'Qualifying' | 'Race' | string;
  session_name: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_key: number;
  country_code: string;
  country_name: string;
  location: string;
  gmt_offset: string;
  year: number;
  is_cancelled: boolean;
}

export interface Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_key: number;
  country_code: string;
  country_name: string;
  country_flag: string | null;
  circuit_key: number;
  circuit_short_name: string;
  circuit_type: string | null;
  circuit_info_url: string | null;
  circuit_image: string | null;
  gmt_offset: string;
  date_start: string;
  date_end: string;
  year: number;
  is_cancelled: boolean;
}

export interface Driver {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string | null;
  country_code: string | null;
}

export interface Position {
  date: string;
  meeting_key: number;
  session_key: number;
  driver_number: number;
  position: number;
}

export interface Interval {
  date: string;
  meeting_key: number;
  session_key: number;
  driver_number: number;
  gap_to_leader: number | string | null;
  interval: number | string | null;
}

export interface Lap {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  lap_number: number;
  date_start: string;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  st_speed: number | null;
  is_pit_out_lap: boolean;
  segments_sector_1: number[] | null;
  segments_sector_2: number[] | null;
  segments_sector_3: number[] | null;
}

export interface PitStop {
  date: string;
  meeting_key: number;
  session_key: number;
  driver_number: number;
  lap_number: number;
  pit_duration: number | null;
  lane_duration: number | null;
  stop_duration: number | null;
}

export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'TEST_UNKNOWN' | string;

export interface Stint {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: TyreCompound;
  tyre_age_at_start: number;
}

export interface Weather {
  date: string;
  meeting_key: number;
  session_key: number;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  pressure: number;
  rainfall: 0 | 1;
  wind_speed: number;
  wind_direction: number;
}

export type RaceControlCategory = 'Flag' | 'SafetyCar' | 'Drs' | 'Other' | string;
export type RaceControlFlag =
  | 'GREEN' | 'YELLOW' | 'DOUBLE YELLOW' | 'RED' | 'BLUE'
  | 'CHEQUERED' | 'CLEAR' | 'BLACK AND WHITE' | string;

export interface RaceControl {
  meeting_key: number;
  session_key: number;
  date: string;
  driver_number: number | null;
  lap_number: number | null;
  category: RaceControlCategory;
  flag: RaceControlFlag | null;
  scope: string | null;
  sector: number | null;
  qualifying_phase: string | null;
  message: string;
}

export interface Location {
  date: string;
  meeting_key: number;
  session_key: number;
  driver_number: number;
  x: number;
  y: number;
  z: number;
}

export interface CarData {
  date: string;
  meeting_key: number;
  session_key: number;
  driver_number: number;
  rpm: number;
  speed: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

export const getSessions = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Session>('sessions', params, signal);

export const getMeetings = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Meeting>('meetings', params, signal);

export const getDrivers = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Driver>('drivers', params, signal);

export const getPosition = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Position>('position', params, signal);

export const getIntervals = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Interval>('intervals', params, signal);

export const getLaps = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Lap>('laps', params, signal);

export const getPit = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<PitStop>('pit', params, signal);

export const getStints = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Stint>('stints', params, signal);

export const getWeather = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Weather>('weather', params, signal);

export const getRaceControl = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<RaceControl>('race_control', params, signal);

export const getLocation = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<Location>('location', params, signal);

export const getCarData = (params?: OpenF1Params, signal?: AbortSignal) =>
  get<CarData>('car_data', params, signal);
