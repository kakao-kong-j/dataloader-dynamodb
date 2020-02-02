import DataLoader from "dataloader";
import {
  AttributeMap,
  DocumentClient,
  BatchGetItemInput
} from "aws-sdk/clients/dynamodb";

const MAX_BATCH_SIZE = 100;

export class DynamoDataLoader {
  private client: DocumentClient;
  private tableName: string;
  private dataloader: DataLoader<string, AttributeMap | null>;
  constructor(client: DocumentClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
    this.dataloader = new DataLoader<string, AttributeMap | null>(
      this.generateDynamoDBBatchFunction(tableName),
      {
        maxBatchSize: MAX_BATCH_SIZE
      }
    );
  }
  private generateDynamoDBBatchFunction = (tableName: string) => async (
    ids: readonly string[]
  ): Promise<AttributeMap[]> => {
    const params: BatchGetItemInput = {
      RequestItems: {}
    };

    params.RequestItems[tableName] = {
      Keys: ids.map(id => {
        return { ID: id } as AttributeMap;
      })
    };
    const orderOfBatchItem = ids.reduce((acc: any, id: any, index: number) => {
      acc[id] = index;

      return acc;
    }, {});

    const result = await this.client.batchGet(params).promise();
    if (result.Responses![tableName].length === 0) {
      throw new Error("Dataloader Key is not correct");
    }

    return result.Responses![tableName].sort(
      (a, b) => orderOfBatchItem[a.ID] - orderOfBatchItem[b.ID]
    );
  };
  public load(key: string) {
    return this.dataloader.load(key);
  }
  public loadmany(keys: string[]) {
    return this.dataloader.loadMany(keys);
  }
  public clear(key: string) {
    return this.dataloader.clear(key);
  }
  public clearAll() {
    return this.dataloader.clearAll();
  }
  public prime(key: string, value: AttributeMap) {
    return this.dataloader.prime(key, value);
  }
}
