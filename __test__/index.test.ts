import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DynamoDataLoader } from "../src/index";

describe("DynamoDB Test", () => {
  const docClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: "localhost:8000",
    region: "local-env",
    sslEnabled: false
  });

  it("Basic table operation", async () => {
    // GIVEN
    const testData = Math.random().toString();

    // WHEN
    await docClient
      .put({ TableName: "Temp", Item: { ID: "temp", value: testData } })
      .promise();
    const { Item } = await docClient
      .get({ TableName: "Temp", Key: { ID: "temp" } })
      .promise();

    // THEN
    expect(Item!.value).toBe(testData);
  });

  it("DataLoader basic Test", async () => {
    //GIVEN

    const dataloader = new DynamoDataLoader(docClient, "Temp");
    const data = { ID: "test" };
    // WHEN
    await docClient.put({ TableName: "Temp", Item: data }).promise();
    const result = await dataloader.load("test");
    //THEN
    expect(result).toEqual(data);
  });
});
