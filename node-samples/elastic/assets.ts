import { RequestParams } from '@elastic/elasticsearch';

import client from '../../es/supplyConnPool';
import { SearchApiResponse } from '../../es/interfaces';

export enum AssetTypeSource {
  app = 'app',
  site = 'site',
}

export interface AssetRefHitSource {
  asset_type: AssetTypeSource;
  asset_technical_name: string;
  asset_name: string;
  icon_path: string;
}

export enum AssetType {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

// Mimics interface of EAR
export interface AssetRef {
  name: string;
  bundle: string;
  assetType: AssetType;
  icon?: string;
}

function hitSourceToAssetMapper(hit: AssetRefHitSource): AssetRef {
  const assetType = hit.asset_type === AssetTypeSource.site ? AssetType.WEB : AssetType.ANDROID;
  return {
    name: hit.asset_name,
    bundle: hit.asset_technical_name,
    assetType: assetType,
    icon: hit.icon_path,
  };
}

export function buildParamsForAvailableAssets(term?: string, excludeAssets?: string[]): RequestParams.Search {
  const query = {
    function_score: {
      query: {
        bool: {
          should: [] as object[],
          must_not: [
            {
              wildcard: {
                asset_technical_name: '*_o',
              },
            },
          ],
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };

  const params: RequestParams.Search = {
    index: 'asset_ref',
    body: {
      size: 10,
      sort: {
        volumes: { order: 'desc' },
      },
      query: query,
    },
  };

  if (term) {
    delete params.body.sort;

    const wildcardTerm = `${term.toLocaleLowerCase()}*`;

    query.function_score.query.bool.should = [
      {
        wildcard: {
          asset_technical_name: wildcardTerm,
        },
      },
      {
        match_phrase_prefix: {
          asset_name: term,
        },
      },
      {
        match: {
          asset_name: {
            query: term,
            operator: 'and',
          },
        },
      },
    ];
    query.function_score.field_value_factor = {
      field: 'volumes',
      factor: 0.3,
      modifier: 'sqrt',
      missing: 1,
    };
  }

  if (excludeAssets) {
    excludeAssets.forEach((assetName) => {
      params.body.query.function_score.query.bool.must_not.push({
        term: {
          'asset_technical_name': assetName,
        },
      });
    });
  }
  return params;
}

function buildParamsForMultipleAssets(assets: string[]): RequestParams.Search {
  return {
    index: 'asset_ref',
    size: assets.length,
    body: {
      query: {
        terms: {
          asset_technical_name: assets,
        },
      },
    },
  };
}

export default async function searchAssets(asset?: string | string[], excludeAssets?: string[]): Promise<AssetRef[]> {
  const params = asset instanceof Array ?
    buildParamsForMultipleAssets(asset) :
    buildParamsForAvailableAssets(asset, excludeAssets);

  const res: SearchApiResponse<AssetRefHitSource> = await client.search(params);
  return res.body.hits.hits.map((hit) => hitSourceToAssetMapper(hit._source));
}
