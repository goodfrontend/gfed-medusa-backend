import { SearchClient, algoliasearch } from 'algoliasearch';

type AlgoliaOptions = {
  apiKey: string;
  appId: string;
  productIndexName: string;
  productBrowseIndexName?: string;
};

export type AlgoliaIndexType = 'product';
export type AlgoliaBrowseSort = 'price_asc' | 'price_desc';
export type AlgoliaRecord = Record<string, unknown> & {
  id?: string;
  objectID?: string;
};

const DEFAULT_RANKING = [
  'typo',
  'geo',
  'words',
  'filters',
  'proximity',
  'attribute',
  'exact',
  'custom',
];

const BROWSE_ATTRIBUTES_FOR_FACETING = [
  'category_ids',
  'category_handles',
  'collection_id',
  'collection_handle',
  'country_codes',
  'is_sellable',
];

export default class AlgoliaModuleService {
  private client: SearchClient;
  private options: AlgoliaOptions;
  private configuredBrowseIndices = new Set<string>();

  constructor(_dependencies: Record<string, never>, options: AlgoliaOptions) {
    this.client = algoliasearch(options.appId, options.apiKey);
    this.options = options;
  }

  async getIndexName(type: AlgoliaIndexType) {
    switch (type) {
      case 'product':
        return this.options.productIndexName;
      default:
        throw new Error(`Invalid index type: ${type}`);
    }
  }

  getBrowseIndexName(type: AlgoliaIndexType, marketKey: string) {
    const browseBaseIndexName =
      this.options.productBrowseIndexName ??
      `${this.options.productIndexName}_browse`;

    switch (type) {
      case 'product':
        return `${browseBaseIndexName}_${marketKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      default:
        throw new Error(`Invalid index type: ${type}`);
    }
  }

  getBrowseReplicaIndexName(
    type: AlgoliaIndexType,
    marketKey: string,
    sort: AlgoliaBrowseSort
  ) {
    return `${this.getBrowseIndexName(type, marketKey)}_${sort}`;
  }

  async configureBrowseIndex(
    type: AlgoliaIndexType,
    marketKey: string,
    force = false
  ) {
    const primaryIndexName = this.getBrowseIndexName(type, marketKey);
    const replicaIndexNames = [
      this.getBrowseReplicaIndexName(type, marketKey, 'price_asc'),
      this.getBrowseReplicaIndexName(type, marketKey, 'price_desc'),
    ];

    if (!force && this.configuredBrowseIndices.has(primaryIndexName)) {
      return {
        primaryIndexName,
        replicaIndexNames,
      };
    }

    const primarySettingsResponse = await this.client.setSettings({
      indexName: primaryIndexName,
      indexSettings: {
        attributesForFaceting: BROWSE_ATTRIBUTES_FOR_FACETING,
        customRanking: ['desc(createdAtTs)'],
        replicas: replicaIndexNames,
      },
    });

    if (primarySettingsResponse.taskID) {
      await this.client.waitForTask({
        indexName: primaryIndexName,
        taskID: primarySettingsResponse.taskID,
      });
    }

    const replicaSettings = [
      {
        indexName: replicaIndexNames[0],
        ranking: [`asc(price_amount)`, ...DEFAULT_RANKING],
      },
      {
        indexName: replicaIndexNames[1],
        ranking: [`desc(price_amount)`, ...DEFAULT_RANKING],
      },
    ];

    const replicaResponses = await Promise.all(
      replicaSettings.map(({ indexName, ranking }) =>
        this.client.setSettings({
          indexName,
          indexSettings: {
            attributesForFaceting: BROWSE_ATTRIBUTES_FOR_FACETING,
            customRanking: ['desc(createdAtTs)'],
            ranking,
          },
        })
      )
    );

    await Promise.all(
      replicaResponses.map((response, index) =>
        response.taskID
          ? this.client.waitForTask({
              indexName: replicaSettings[index].indexName,
              taskID: response.taskID,
            })
          : Promise.resolve()
      )
    );

    this.configuredBrowseIndices.add(primaryIndexName);

    return {
      primaryIndexName,
      replicaIndexNames,
    };
  }

  async deleteBrowseIndexFamily(
    type: AlgoliaIndexType,
    marketKey: string,
    allowMissingIndex = false
  ) {
    const primaryIndexName = this.getBrowseIndexName(type, marketKey);
    const replicaIndexNames = [
      this.getBrowseReplicaIndexName(type, marketKey, 'price_asc'),
      this.getBrowseReplicaIndexName(type, marketKey, 'price_desc'),
    ];

    try {
      const response = await this.client.setSettings({
        indexName: primaryIndexName,
        indexSettings: {
          replicas: [],
        },
      });

      if (response.taskID) {
        await this.client.waitForTask({
          indexName: primaryIndexName,
          taskID: response.taskID,
        });
      }
    } catch (error) {
      if (!(allowMissingIndex && this.isMissingIndexError(error))) {
        throw error;
      }
    }

    await Promise.all(
      [...replicaIndexNames, primaryIndexName].map(async (indexName) => {
        try {
          await this.client.deleteIndex({ indexName });
        } catch (error) {
          if (!(allowMissingIndex && this.isMissingIndexError(error))) {
            throw error;
          }
        }
      })
    );

    this.configuredBrowseIndices.delete(primaryIndexName);

    return {
      primaryIndexName,
      replicaIndexNames,
    };
  }

  async indexData(
    data: AlgoliaRecord[],
    type: AlgoliaIndexType = 'product',
    indexName?: string
  ) {
    const resolvedIndexName = indexName ?? (await this.getIndexName(type));
    await this.client.saveObjects({
      indexName: resolvedIndexName,
      objects: data.map((item) => ({
        ...item,
        // set the object ID to allow updating later
        objectID: item.objectID ?? item.id,
      })),
    });
  }

  private isMissingIndexError(error: unknown) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';

    return (
      message.includes('does not exist') ||
      message.includes("doesn't exist") ||
      message.includes('index not found')
    );
  }

  async retrieveFromIndex(
    objectIDs: string[],
    type: AlgoliaIndexType = 'product',
    indexName?: string,
    allowMissingIndex = false
  ) {
    const resolvedIndexName = indexName ?? (await this.getIndexName(type));
    try {
      return await this.client.getObjects<Record<string, unknown>>({
        requests: objectIDs.map((objectID) => ({
          indexName: resolvedIndexName,
          objectID,
        })),
      });
    } catch (error) {
      if (allowMissingIndex && this.isMissingIndexError(error)) {
        return {
          results: objectIDs.map(() => null),
        };
      }

      throw error;
    }
  }

  async deleteFromIndex(
    objectIDs: string[],
    type: AlgoliaIndexType = 'product',
    indexName?: string,
    allowMissingIndex = false
  ) {
    const resolvedIndexName = indexName ?? (await this.getIndexName(type));
    try {
      await this.client.deleteObjects({
        indexName: resolvedIndexName,
        objectIDs,
      });
    } catch (error) {
      if (allowMissingIndex && this.isMissingIndexError(error)) {
        return;
      }

      throw error;
    }
  }

  async search(query: string, type: AlgoliaIndexType = 'product') {
    const indexName = await this.getIndexName(type);
    return await this.client.search({
      requests: [
        {
          indexName,
          query,
        },
      ],
    });
  }
}
