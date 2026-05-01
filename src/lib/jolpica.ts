const BASE = 'https://api.jolpi.ca/ergast/f1';

export class JolpicaError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'JolpicaError';
  }
}

interface JolpicaQuery {
  limit?: number;
  offset?: number;
}

async function get<T>(path: string, query: JolpicaQuery = {}, signal?: AbortSignal): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  if (query.limit !== undefined) url.searchParams.set('limit', String(query.limit));
  if (query.offset !== undefined) url.searchParams.set('offset', String(query.offset));
  const res = await fetch(url, { signal });
  if (!res.ok) throw new JolpicaError(`Jolpica ${path} ${res.status}`, res.status);
  return res.json() as Promise<T>;
}

export interface MRDataEnvelope<T> {
  MRData: T & {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  };
}

export interface ErgastLocation {
  lat: string;
  long: string;
  locality: string;
  country: string;
}

export interface ErgastCircuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: ErgastLocation;
}

export interface ErgastDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface ErgastConstructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

export interface SessionStamp {
  date: string;
  time: string;
}

export interface ScheduleRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: ErgastCircuit;
  date: string;
  time?: string;
  FirstPractice?: SessionStamp;
  SecondPractice?: SessionStamp;
  ThirdPractice?: SessionStamp;
  Qualifying?: SessionStamp;
  Sprint?: SessionStamp;
  SprintQualifying?: SessionStamp;
}

export interface ErgastTime {
  millis?: string;
  time: string;
}

export interface FastestLap {
  rank: string;
  lap: string;
  Time: { time: string };
  AverageSpeed?: { units: string; speed: string };
}

export interface RaceResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  grid: string;
  laps: string;
  status: string;
  Time?: ErgastTime;
  FastestLap?: FastestLap;
}

export interface QualifyingResult {
  number: string;
  position: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export type SprintResult = RaceResult;

export interface RaceWithResults extends ScheduleRace {
  Results?: RaceResult[];
  QualifyingResults?: QualifyingResult[];
  SprintResults?: SprintResult[];
}

export interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: ErgastDriver;
  Constructors: ErgastConstructor[];
}

export interface ConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: ErgastConstructor;
}

interface RaceTablePayload<R> {
  RaceTable: {
    season: string;
    round?: string;
    Races: R[];
  };
}

interface StandingsTablePayload<S> {
  StandingsTable: {
    season: string;
    round?: string;
    StandingsLists: S[];
  };
}

export interface DriverStandingsList {
  season: string;
  round: string;
  DriverStandings: DriverStanding[];
}

export interface ConstructorStandingsList {
  season: string;
  round: string;
  ConstructorStandings: ConstructorStanding[];
}

export const getSchedule = (season: string | 'current' = 'current', q?: JolpicaQuery, signal?: AbortSignal) =>
  get<MRDataEnvelope<RaceTablePayload<ScheduleRace>>>(`${season}.json`, q, signal);

export const getRaceResults = (season: string | 'current', round: string | 'last', q?: JolpicaQuery, signal?: AbortSignal) =>
  get<MRDataEnvelope<RaceTablePayload<RaceWithResults>>>(`${season}/${round}/results.json`, q, signal);

export const getQualifyingResults = (season: string | 'current', round: string | 'last', q?: JolpicaQuery, signal?: AbortSignal) =>
  get<MRDataEnvelope<RaceTablePayload<RaceWithResults>>>(`${season}/${round}/qualifying.json`, q, signal);

export const getSprintResults = (season: string | 'current', round: string | 'last', q?: JolpicaQuery, signal?: AbortSignal) =>
  get<MRDataEnvelope<RaceTablePayload<RaceWithResults>>>(`${season}/${round}/sprint.json`, q, signal);

export const getDriverStandings = (season: string | 'current' = 'current', q?: JolpicaQuery, signal?: AbortSignal) =>
  get<MRDataEnvelope<StandingsTablePayload<DriverStandingsList>>>(`${season}/driverStandings.json`, q, signal);

export const getConstructorStandings = (season: string | 'current' = 'current', q?: JolpicaQuery, signal?: AbortSignal) =>
  get<MRDataEnvelope<StandingsTablePayload<ConstructorStandingsList>>>(`${season}/constructorStandings.json`, q, signal);
