import { RequestParams } from '@elastic/elasticsearch';
import moment from 'moment';

import client, { ES_PREFERENCE } from '../../es/supplyConnPool';
import { SearchApiResponse, Bucket } from '../../es/interfaces';
import { Segment, Age, Gender, IncludeExclude } from '../../entities/StudyConfig';

interface UserHitSource {
  odid: string;
  gender: Gender;
  age: Age;
  app_asset_list: string[];
  site_asset_list: string[];
  io_list: string[];
  country: string;
}

interface CCRHitSource {
  campaign_id: string;
  campaign_ad_chooser_id: string;
  feasibility: 'TRUE' | 'FALSE';
}

interface UniverseQuery {
  bool: {
    should: {
      terms: {
        [key: string]: string[];
      };
    }[];
  };
}

const ALL_MONTHLY_INDICES_WILDCARD = 'feasibility_tool_*';

const DISTINCT_IN_POPULATION_AGGREGATION_NAME = 'distinct-in-population';
const DISTINCT_IN_SEGMENT_AGGREGATION_NAME = 'distinct-in-segment';

export function determineMonthlyWildcardIndices(startDate: string, endDate: string): string[] {
  const format = 'YYYY-MM-DD';
  const start = moment(startDate, format);
  const end = moment(endDate, format);

  if (end.isSameOrBefore(start)) {
    throw new Error('Invalid order of dates: startDate must be before endDate');
  }

  const moments = [];
  const first = start.clone().startOf('month');
  const last = end.clone().startOf('month');

  while (first.isSameOrBefore(last, 'month')) {
    moments.push(first.clone());
    first.add(1, 'month');
  }

  return moments.map((m) => (`feasibility_tool_${m.format('YYYY-MM')}*`));
}

function extractUniverseQueries(segment: Segment): {included: UniverseQuery[]; excluded: UniverseQuery[]} {
  const included: UniverseQuery[] = [];
  const excluded: UniverseQuery[] = [];

  segment.assetLists.forEach(assetListItem => {
    const universeShouldTerms = [];

    if (assetListItem.app.length) {
      universeShouldTerms.push({ terms: { app_asset_list: assetListItem.app } });
    }
    if (assetListItem.site.length) {
      universeShouldTerms.push({ terms: { site_asset_list: assetListItem.site } });
    }

    const universeQuery: UniverseQuery = {
      bool: {
        should: universeShouldTerms,
      },
    };

    if (assetListItem.includeExclude === IncludeExclude.INCLUDE) {
      included.push(universeQuery);
    } else {
      excluded.push(universeQuery);
    }
  });

  return {
    included,
    excluded,
  };
}

export function createSegmentFilterQueryWithAggregation(segment: Segment, io: string): object{
  const query = {
    filter: {
      bool: {
        filter: [
          {
            terms: { age: segment.age },
          },
          {
            terms: { gender: segment.gender },
          },
        ] as object[],
        must_not: [] as object[],
      },
    },
    aggregations: {
      [DISTINCT_IN_SEGMENT_AGGREGATION_NAME]: {
        cardinality: {
          field: 'odid.keyword',
        },
      },
    },
  };

  if (io) {
    query.filter.bool.filter.push({ terms: { io_list: [io] } });
  }

  const universeQueries = extractUniverseQueries(segment);

  if (universeQueries.included.length) {
    query.filter.bool.filter.push(...universeQueries.included);
  } else {
    throw new Error('No universes found in segment!');
  }

  if (universeQueries.excluded.length) {
    query.filter.bool.must_not.push(...universeQueries.excluded);
  } else {
    // delete empty key
    delete query.filter.bool.must_not;
  }

  return query;
}

export function createConsentedPopulationFilterQuery(countryList: string[]): object {
  return {
    filter: {
      bool: {
        must_not: [
          {
            terms: { app_asset_list: ['unknown'] },
          },
        ],
        filter: [
          {
            terms: { country: countryList },
          },
        ],
      },
    },
  };
}

// eslint-disable-next-line max-len
export async function determineIOCountryListAndIndices(io: string): Promise<{countryList: string[]; indices: string[] }> {
  const requestParams: RequestParams.Search = {
    index: ALL_MONTHLY_INDICES_WILDCARD,
    size: 0,
    preference: ES_PREFERENCE,
    body: {
      query: {
        constant_score: {
          filter: {
            bool: {
              filter: [
                {
                  terms: { io_list: [io] },
                },
              ],
            },
          },
        },
      },
      aggregations: {
        per_country: {
          terms : { field : 'country' },
        },
        per_index: {
          terms : { field : '_index' },
        },
      },
    },
  };

  const res: SearchApiResponse<UserHitSource> = await client.search(requestParams);

  let totalUsersAcrossCountries = 0;
  const countriesWithUsers: Bucket[] = res.body.aggregations.per_country.buckets;
  const indicesWithUsers: Bucket[] = res.body.aggregations.per_index.buckets;

  countriesWithUsers.forEach(bucket => {
    totalUsersAcrossCountries += bucket.doc_count;
  });

  const outliersTreshold = 0.01 * totalUsersAcrossCountries;

  const countryList = countriesWithUsers
    .filter(bucket => bucket.doc_count > outliersTreshold)
    .map(bucket => bucket.key);

  const indices = indicesWithUsers.map(bucket => bucket.key);

  return { countryList, indices };
}

interface Result {
  population: number;
  segmentVolume: number;
}

interface SegmentsAggregationQuery {
  [key: string]: object;
}

// eslint-disable-next-line max-len
export async function queryPopulationAndSegments(indices: string[], countryList: string[], segments: Segment[], io?: string): Promise<Result[]> {
  if (!segments.length) {
    throw new Error('Segments array must contain items');
  }

  const aggregations: SegmentsAggregationQuery = {};

  segments.forEach((segment, index) => {
    aggregations[index] = createSegmentFilterQueryWithAggregation(segment, io);
  });

  aggregations[DISTINCT_IN_POPULATION_AGGREGATION_NAME] = {
    cardinality: {
      field: 'odid.keyword',
    },
  };

  const requestParams: RequestParams.Search = {
    index: indices,
    size: 0,
    preference: ES_PREFERENCE,
    body: {
      query: {
        constant_score: createConsentedPopulationFilterQuery(countryList),
      },
      aggregations: aggregations,
    },
  };

  const res: SearchApiResponse<UserHitSource> = await client.search(requestParams);

  const results: Result[] = [];

  segments.forEach((segment, index) => {
    results.push({
      population: res.body.aggregations[DISTINCT_IN_POPULATION_AGGREGATION_NAME].value,
      segmentVolume: res.body.aggregations[index][DISTINCT_IN_SEGMENT_AGGREGATION_NAME].value,
    });
  });

  return results;
}

export async function getCreativeChoiceFeasbility(campaignAdChooserId: string): Promise<boolean> {
  const requestParams: RequestParams.Search = {
    index: 'ccr_feasibility',
    size: 1,
    preference: ES_PREFERENCE,
    body: {
      query: {
        constant_score: {
          query: {
            term: {
              campaign_ad_chooser_id: campaignAdChooserId,
            },
          },
        },
      },
    },
  };

  const res: SearchApiResponse<CCRHitSource> = await client.search(requestParams);

  if (!res.body.hits.hits.length) {
    return false;
  }

  const hit = res.body.hits.hits[0];

  return hit._source.feasibility === 'TRUE';
}
