// import { RequestParams } from '@elastic/elasticsearch';
// import { SearchApiResponse } from '../../es/interfaces';
// import client, { ES_PREFERENCE } from '../../es/supplyConnPool';


interface KeywordHitSource {
  keyword_id: string;
  keyword: string;
  lang: string;
}

export interface Keyword {
  id?: string;
  value: string;
  countryCode: string;
}

/*
  This mapping has been defined by data lake team.
  Only a subset of languages is supported by country.

  https://github.com/Ogury/airflow-dag-targeting-audience#4-supported-languages
 */
export const COUNTRY_CODE_TO_LANGUAGE_CODES: {[key: string]: string[]} = {
  US: ['en'],
  FR: ['fr', 'en'],
  IT: ['it', 'en'],
  ES: ['es', 'en'],
  GB: ['en'],
  DE: ['de', 'en'],
  NL: ['nl', 'en'],
  AU: ['en'],
  MX: ['es', 'en'],
  CO: ['es', 'en'],
  PE: ['es', 'en'],
  CL: ['es', 'en'],
  AR: ['es', 'en'],
  CA: ['en', 'fr'],
  BE: ['fr', 'nl'],
  AT: ['de', 'en'],
  IE: ['en'],
  BR: ['pt', 'en'],
  PT: ['pt', 'en'],
};

export function getLanguageCodes(countryCode: string): string[] {
  const mapping: string[] = COUNTRY_CODE_TO_LANGUAGE_CODES[countryCode.toUpperCase()];

  if (mapping) {
    return mapping;
  } {
    return ['en'];
  }
}

export async function searchKeywords(term: string, countryCode: string): Promise<Keyword[]> {
  const wildcardTerm = `*${term.toLocaleLowerCase()}*`;

  const languageCodes: string[] = getLanguageCodes(countryCode);

  const params: RequestParams.Search = {
    index: 'keywords',
    preference: ES_PREFERENCE,
    body: {
      size: 10,
      query: {
        function_score: {
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    lang: languageCodes,
                  },
                },
                {
                  wildcard: {
                    keyword: {
                      value: wildcardTerm,
                    },
                  },
                },
              ],
            },
          },
          script_score: {
            script: '1.0 / doc[\'keyword\'].value.length()',
          },
        },
      },
    },
  };
  const res: SearchApiResponse<KeywordHitSource> = await client.search(params);

  return res.body.hits.hits.map(source => {
    return {
      id: source._source.keyword_id,
      value: source._source.keyword,
      countryCode: source._source.lang,
    };
  });
}
