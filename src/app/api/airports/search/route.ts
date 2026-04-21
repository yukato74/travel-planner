import { NextRequest, NextResponse } from 'next/server';

type AirportsApiResource = {
  id: string;
  attributes?: {
    name?: string | null;
    code?: string | null;
    iata_code?: string | null;
    icao_code?: string | null;
  };
  relationships?: {
    country?: { data?: { id?: string } | null } | null;
    region?: { data?: { id?: string } | null } | null;
  };
};

type AirportsApiIncluded = {
  id: string;
  type: 'countries' | 'regions';
  attributes?: {
    name?: string | null;
  };
};

type AirportOption = {
  id: string;
  label: string;
  value: string;
};

function normalizeToken(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function formatAirportLabel(params: {
  name: string;
  iataCode: string;
  cityOrRegion: string;
  country: string;
}): string {
  const location = [params.cityOrRegion, params.country].filter(Boolean).join(', ');
  return location ? `${params.name} (${params.iataCode}) · ${location}` : `${params.name} (${params.iataCode})`;
}

function mapAirportOption(
  item: AirportsApiResource,
  countryById: Map<string, string>,
  regionById: Map<string, string>,
): AirportOption | null {
  const name = normalizeToken(item.attributes?.name);
  const iataCode = normalizeToken(item.attributes?.iata_code);
  const icaoCode = normalizeToken(item.attributes?.icao_code) || normalizeToken(item.attributes?.code);
  if (!name || (!iataCode && !icaoCode)) {
    return null;
  }

  const countryId = item.relationships?.country?.data?.id;
  const regionId = item.relationships?.region?.data?.id;
  const country = countryId ? normalizeToken(countryById.get(countryId)) : '';
  const region = regionId ? normalizeToken(regionById.get(regionId)) : '';
  const displayCode = iataCode || icaoCode;
  const label = formatAirportLabel({
    name,
    iataCode: displayCode,
    cityOrRegion: region,
    country,
  });

  return {
    id: item.id,
    label,
    value: label,
  };
}

async function fetchAirportSearch(term: string): Promise<AirportOption[]> {
  const url = new URL('https://airportsapi.com/api/airports');
  url.searchParams.set('include', 'country,region');
  url.searchParams.set('filter[name]', term);
  url.searchParams.set('page[size]', '10');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    data?: AirportsApiResource[];
    included?: AirportsApiIncluded[];
  };

  const countryById = new Map<string, string>();
  const regionById = new Map<string, string>();
  for (const included of payload.included ?? []) {
    const name = normalizeToken(included.attributes?.name);
    if (!name) {
      continue;
    }
    if (included.type === 'countries') {
      countryById.set(included.id, name);
    }
    if (included.type === 'regions') {
      regionById.set(included.id, name);
    }
  }

  return (payload.data ?? [])
    .map((item) => mapAirportOption(item, countryById, regionById))
    .filter((item): item is AirportOption => Boolean(item));
}

async function fetchAirportByCode(code: string): Promise<AirportOption[]> {
  const lookupCode = code.trim().toUpperCase();
  if (!lookupCode || (lookupCode.length !== 3 && lookupCode.length !== 4)) {
    return [];
  }

  const endpoint = lookupCode.length === 3 ? `iata/${lookupCode}` : `icao/${lookupCode}`;
  const response = await fetch(`https://www.iatageo.com/v2/airports/${endpoint}`, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    success?: boolean;
    data?: {
      name?: string;
      iataCode?: string;
      icaoCode?: string;
    };
  };

  const data = payload.data;
  const name = normalizeToken(data?.name);
  const iataCode = normalizeToken(data?.iataCode);
  const icaoCode = normalizeToken(data?.icaoCode);
  if (!name || (!iataCode && !icaoCode)) {
    return [];
  }

  let region = '';
  let country = '';
  if (icaoCode) {
    const detailsUrl = new URL(`https://airportsapi.com/api/airports/${icaoCode}`);
    detailsUrl.searchParams.set('include', 'country,region');
    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (detailsResponse.ok) {
      const details = (await detailsResponse.json()) as { included?: AirportsApiIncluded[] };
      for (const included of details.included ?? []) {
        if (included.type === 'countries') {
          country = normalizeToken(included.attributes?.name);
        }
        if (included.type === 'regions') {
          region = normalizeToken(included.attributes?.name);
        }
      }
    }
  }

  const displayCode = iataCode || icaoCode;
  const label = formatAirportLabel({
    name,
    iataCode: displayCode,
    cityOrRegion: region,
    country,
  });
  return [
    {
      id: `code:${lookupCode}`,
      label,
      value: label,
    },
  ];
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) {
    return NextResponse.json({ options: [] });
  }

  try {
    const [nameMatches, codeMatches] = await Promise.all([
      fetchAirportSearch(query),
      fetchAirportByCode(query),
    ]);
    const unique = new Map<string, AirportOption>();
    for (const option of [...codeMatches, ...nameMatches]) {
      if (!unique.has(option.value)) {
        unique.set(option.value, option);
      }
    }
    return NextResponse.json({ options: Array.from(unique.values()).slice(0, 12) });
  } catch {
    return NextResponse.json({ options: [] }, { status: 200 });
  }
}
