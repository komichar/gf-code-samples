/* eslint-disable max-len */
import {
  createConsentedPopulationFilterQuery,
  createSegmentFilterQueryWithAggregation,
  determineMonthlyWildcardIndices,
} from './feasibility';
import { Segment, Age, Gender, IncludeExclude } from '../../entities/StudyConfig';

describe('determineMonthlyWildcardIndices()', () => {

  it('throws an error if given endDate is before startDate', () => {
    const startDate = '2020-05-01';
    const endDate = '2020-04-01';

    try {
      determineMonthlyWildcardIndices(startDate, endDate);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid order of dates: startDate must be before endDate');
    }
  });

  it('returns an array with 1 monthly wildcard index when startDate and endDate are in the same month', () => {
    const startDate = '2020-05-01';
    const endDate = '2020-05-31';

    const result = determineMonthlyWildcardIndices(startDate, endDate);

    expect(result).toEqual(['feasibility_tool_2020-05*']);
  });

  it('returns an ordered array of monthly wildcard indices including startDate, endDate and all months in between', () => {
    const startDate = '2019-06-01';
    const endDate = '2020-05-31';

    const result = determineMonthlyWildcardIndices(startDate, endDate);

    expect(result).toEqual([
      'feasibility_tool_2019-06*',
      'feasibility_tool_2019-07*',
      'feasibility_tool_2019-08*',
      'feasibility_tool_2019-09*',
      'feasibility_tool_2019-10*',
      'feasibility_tool_2019-11*',
      'feasibility_tool_2019-12*',
      'feasibility_tool_2020-01*',
      'feasibility_tool_2020-02*',
      'feasibility_tool_2020-03*',
      'feasibility_tool_2020-04*',
      'feasibility_tool_2020-05*',
    ]);
  });
});

describe('createConsentedPopulationFilterQuery()', () => {
  it('returns a bool filter object with must_not and filter clauses', () => {
    const filterQuery = createConsentedPopulationFilterQuery(['DE', 'FR']);

    expect(filterQuery).toEqual({
      filter: {
        bool: {
          must_not: [
            {
              terms: { app_asset_list: ['unknown'] },
            },
          ],
          filter: [
            {
              terms: { country: ['DE', 'FR'] },
            },
          ],
        },
      },
    });
  });
});

describe('createSegmentFilterQueryWithAggregation()', () => {
  describe('when segment.assetList contains only INCLUDE universes', () => {
    it('returns a bool filter object, with filter query containing terms for age, gender and a boolean for each INCLUDE universe. must_not query is not present', () => {
      const segment: Segment = {
        personaName: 'persona 1',
        age: [Age.GROUP_25_34],
        gender: [Gender.MALE, Gender.FEMALE],
        assetLists: [
          {
            includeExclude: IncludeExclude.INCLUDE,
            app: ['included.app.100', 'included.app.101'],
            site: ['included.site.100', 'included.site.101'],
          },
          {
            includeExclude: IncludeExclude.INCLUDE,
            app: ['included.app.200', 'included.app.201', 'included.app.202', 'included.app.203', 'included.app.204'],
            site: [],
          },
        ],
      };

      const filterQuery = createSegmentFilterQueryWithAggregation(segment, null);

      expect(filterQuery).toEqual({
        filter: {
          bool: {
            filter: [
              {
                terms: { age: segment.age },
              },
              {
                terms: { gender: segment.gender },
              },
              {
                bool: {
                  should: [
                    {
                      terms: {
                        app_asset_list: ['included.app.100', 'included.app.101'],
                      },
                    },
                    {
                      terms: {
                        site_asset_list: ['included.site.100', 'included.site.101'],
                      },
                    },
                  ],
                },
              },
              {
                bool: {
                  should: [
                    {
                      terms: {
                        app_asset_list: ['included.app.200', 'included.app.201', 'included.app.202', 'included.app.203', 'included.app.204'],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        aggregations: {
          'distinct-in-segment': {
            cardinality: {
              field: 'odid.keyword',
            },
          },
        },
      });

    });

    it('returns a bool filter object, with filter query containing terms for io, age, gender and a boolean for each INCLUDE universe. must_not query is not present', () => {
      const segment: Segment = {
        personaName: 'persona 1',
        age: [Age.GROUP_25_34],
        gender: [Gender.MALE, Gender.FEMALE],
        assetLists: [
          {
            includeExclude: IncludeExclude.INCLUDE,
            app: ['included.app.100', 'included.app.101'],
            site: ['included.site.100', 'included.site.101'],
          },
          {
            includeExclude: IncludeExclude.INCLUDE,
            app: ['included.app.200', 'included.app.201', 'included.app.202', 'included.app.203', 'included.app.204'],
            site: [],
          },
        ],
      };
      const io = '654321';

      const filterQuery = createSegmentFilterQueryWithAggregation(segment, io);

      expect(filterQuery).toEqual({
        filter: {
          bool: {
            filter: [
              {
                terms: { age: segment.age },
              },
              {
                terms: { gender: segment.gender },
              },
              {
                terms: { io_list: [io] },
              },
              {
                bool: {
                  should: [
                    {
                      terms: {
                        app_asset_list: ['included.app.100', 'included.app.101'],
                      },
                    },
                    {
                      terms: {
                        site_asset_list: ['included.site.100', 'included.site.101'],
                      },
                    },
                  ],
                },
              },
              {
                bool: {
                  should: [
                    {
                      terms: {
                        app_asset_list: ['included.app.200', 'included.app.201', 'included.app.202', 'included.app.203', 'included.app.204'],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        aggregations: {
          'distinct-in-segment': {
            cardinality: {
              field: 'odid.keyword',
            },
          },
        },
      });

    });
  });

  describe('when segment.assetList contains both INCLUDE and EXCLUDE universes', () => {
    it('returns a bool filter object, with filter query containing terms for age, gender and a boolean for each INCLUDE universe. must_not query contains a boolean for each EXCLUDE universe', () => {
      const segment: Segment = {
        personaName: 'persona2',
        age: [Age.GROUP_25_34],
        gender: [Gender.MALE, Gender.FEMALE],
        assetLists: [
          {
            includeExclude: IncludeExclude.INCLUDE,
            app: ['included.app.100', 'included.app.101'],
            site: ['included.site.100', 'included.site.101'],
          },
          {
            includeExclude: IncludeExclude.EXCLUDE,
            app: ['included.app.200', 'included.app.201', 'included.app.202', 'included.app.203', 'included.app.204'],
            site: [],
          },
        ],
      };

      const filterQuery = createSegmentFilterQueryWithAggregation(segment, null);

      expect(filterQuery).toEqual({
        filter: {
          bool: {
            filter: [
              {
                terms: { age: segment.age },
              },
              {
                terms: { gender: segment.gender },
              },
              {
                bool: {
                  should: [
                    {
                      terms: {
                        app_asset_list: ['included.app.100', 'included.app.101'],
                      },
                    },
                    {
                      terms: {
                        site_asset_list: ['included.site.100', 'included.site.101'],
                      },
                    },
                  ],
                },
              },
            ],
            must_not: [
              {
                bool: {
                  should: [
                    {
                      terms: {
                        app_asset_list: ['included.app.200', 'included.app.201', 'included.app.202', 'included.app.203', 'included.app.204'],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        aggregations: {
          'distinct-in-segment': {
            cardinality: {
              field: 'odid.keyword',
            },
          },
        },
      });

    });
  });
});
