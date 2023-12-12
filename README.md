# SST

---

## Anatomy of a Lambda Function

![Anatomy of a Lambda Function](readme-images/anatomy-of-a-lambda-function.png)

---

### Create SST App using `notes` template

- `npm init sst notes`
- `cd notes`
- `npm install`

---

#### Adjust Region

in `sst.config.ts` change region to `eu-west-2`

```ts
// sst.config.ts
import { SSTConfig } from "sst";
import { API } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "notes",
      region: "eu-west-2",
    };
  },
  stacks(app) {
    app.stack(API);
  },
} satisfies SSTConfig;
```

---

### An SST app is made up of two parts:

1. `stacks/` — **App Infrastructure**

   The code that describes the infrastructure of your serverless app is placed in the `stacks/` directory of your project.

   SST uses `AWS CDK`, to create the infrastructure.

2. `packages/` — **App Code**

   The Lambda function code that’s run when your API is invoked is placed in the `packages/functions` directory of your project.

   While `packages/core` contains our business logic.

Our app is structured as a monorepo. Later on we’ll be adding a frontend/ directory for our React app.

The starter project that’s created is defining a simple Hello World API.

---

### Create a Hello World API

We are creating a simple API with one route, GET /. When this API is invoked, the function called handler in packages/functions/src/lambda.ts will be executed.

```ts
// stacks/MyStack.ts
import { StackContext, Api, EventBus } from "sst/constructs";

export function API({ stack }: StackContext) {
  const api = new Api(stack, "api", {
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
    },
  });
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
```

---

## Starting the `dev` environment

`npm run dev`

The first time you run this command it’ll ask you for the name of a `stage`.

A `stage` or an `environment` is just a string that SST uses to namespace your deployments.

```bash
SST v2.38.4  ready!

➜  App:     notes
   Stage:   Baz
   Console: https://console.sst.dev/local/notes/Baz

⠏ Deploying bootstrap stack, this only needs to happen once
✔ Deploying bootstrap stack, this only needs to happen once
|  API PUBLISH_ASSETS_COMPLETE
|  API api/Api AWS::ApiGatewayV2::Api CREATE_COMPLETE
|  API api/LogGroup AWS::Logs::LogGroup CREATE_COMPLETE
|  API api/Parameter_url AWS::SSM::Parameter CREATE_COMPLETE
|  API api/Api/DefaultStage AWS::ApiGatewayV2::Stage CREATE_COMPLETE
|  API CustomResourceHandler/ServiceRole AWS::IAM::Role CREATE_COMPLETE
|  API api/Lambda_GET_--/ServiceRole AWS::IAM::Role CREATE_COMPLETE
|  API CustomResourceHandler AWS::Lambda::Function CREATE_COMPLETE
|  API api/Lambda_GET_--/ServiceRole/DefaultPolicy AWS::IAM::Policy CREATE_COMPLETE
|  API api/Lambda_GET_-- AWS::Lambda::Function CREATE_COMPLETE
|  API api/Route_GET_--/Integration_GET_-- AWS::ApiGatewayV2::Integration CREATE_COMPLETE
|  API api/Lambda_GET_--/EventInvokeConfig AWS::Lambda::EventInvokeConfig CREATE_COMPLETE
|  API api/Route_GET_-- AWS::Lambda::Permission CREATE_COMPLETE
|  API api/Route_GET_-- AWS::ApiGatewayV2::Route CREATE_COMPLETE
|  API AWS::CloudFormation::Stack CREATE_COMPLETE

✔  Deployed:
   API
   ApiEndpoint: https://sr2waecxv4.execute-api.eu-west-2.amazonaws.com
```

Live API on AWS:

![Hello World](readme-images/01-hello-world.png)

---

### Deploy to `prod`

To deploy our API to production, we’ll need to stop our local development environment and run the following.

`npm run deploy --prod`

We don’t have to do this right now. We’ll be doing it later once we are done working on our app.

The idea here is that we are able to work on separate environments. So when we are working in our personal environment `Baz`), it doesn’t break the API for our users in `prod`. The environment (or `stage`) names in this case are just strings and have no special significance. We could’ve called them `development` and `production` instead. We are however creating completely new serverless apps when we deploy to a different environment. This is another advantage of the serverless architecture. The infrastructure as code idea means that it’s easy to replicate to new environments. And the pay per use model means that we are not charged for these new environments unless we actually use them.

---

### Create a DynamoDB Table in SST

We are now going to start creating our infrastructure in SST using AWS CDK. Starting with DynamoDB.

#### Create a Stack

Add a new file in `stacks/StorageStack.ts`

```ts
// stacks/StorageStack.ts
import { StackContext, Table } from "sst/constructs";

export function StorageStack({ stack }: StackContext) {
  // Create the DynamoDB table
  const table = new Table(stack, "Notes", {
    fields: {
      userId: "string",
      noteId: "string",
    },
    primaryIndex: { partitionKey: "userId", sortKey: "noteId" },
  });

  return {
    table,
  };
}
```

We are creating a new `stack` in our SST app.
We will be using it to create all our storage related infrastructure (DynamoDB and S3).
There’s no specific reason why we are creating a separate `stack` for these resources.
It’s only meant as a way of organizing our resources and **illustrating how to create separate stacks in our app**.

We are using SST’s Table construct to create our `DynamoDB` table.

It has two `fields`:

- `userId`: The id of the user that the note belongs to.
- `noteId`: The id of the note.

We are then creating an index for our table.

- Each `DynamoDB` table has a `primary key`.
- **`This cannot be changed once set`**.
- **`The primary key uniquely identifies each item in the table, so that no two items can have the same key.`**

- DynamoDB supports two different kinds of primary keys:
  - `Partition key`
  - `Partition key and sort key (composite)`

We are going to use the `composite primary key` (referenced by `primaryIndex` in code block above) which gives us additional flexibility when querying the data.

For example, if you provide only the `value` for `userId`, DynamoDB would retrieve **all of the notes by that user**.

Or you could provide a `value` for `userId` and a `value` for `noteId`, to retrieve a particular note.

We are also returning the Table that’s being created publicly.

```ts
return {
  table,
};
```

**By explicitly returning the resources created in a stack, we can reference them in other stacks when we imported.**

---

### Remove Template Files

In `sst.config.ts` we can remove the previous `API` stack

And `import` and use the `StorageStack` we just created

```ts
// sst.config.ts
import { SSTConfig } from "sst";
// import { API } from "./stacks/MyStack";
import { StorageStack } from "./stacks/StorageStack";

export default {
  config(_input) {
    return {
      name: "notes",
      region: "eu-west-2",
    };
  },
  stacks(app) {
    app.stack(StorageStack);
  },
} satisfies SSTConfig;
```

---

### Deploy the App

When we change the `sst.config.ts` and are running `npm run dev` the App updates

```bash
✔  Built

|  StorageStack PUBLISH_ASSETS_COMPLETE
|  StorageStack Notes/Table AWS::DynamoDB::Table CREATE_COMPLETE
|  StorageStack Notes/Parameter_tableName AWS::SSM::Parameter CREATE_COMPLETE
|  StorageStack CustomResourceHandler/ServiceRole AWS::IAM::Role CREATE_COMPLETE
|  StorageStack CustomResourceHandler AWS::Lambda::Function CREATE_COMPLETE
|  StorageStack AWS::CloudFormation::Stack CREATE_COMPLETE

✔  Deployed:
   StorageStack
```

---

### Create an S3 Bucket in SST

We will create an `S3 Bucket` an add it the `StorageStack` that we created before

- We import `Bucket` from `"sst/constructs"`
- We instantiate a new bucket with `new Bucket` and add it add it **ABOVE** the `Table`
- Then in the `StorageStack` `return` we add `bucket`
- This will allow us to reference the `S3 bucket` in other `stacks`

```ts
// stacks/StorageStack.ts
import { StackContext, Bucket, Table } from "sst/constructs"; // import Bucket

export function StorageStack({ stack }: StackContext) {
  // Create an S3 Bucket
  const bucket = new Bucket(stack, "Uploads");

  // Create the DynamoDB table
  const table = new Table(stack, "Notes", {
    fields: {
      userId: "string",
      noteId: "string",
    },
    primaryIndex: { partitionKey: "userId", sortKey: "noteId" },
  });

  return {
    // return the bucket
    bucket,
    table,
  };
}
```

### Deploy the App

We can see when we have updated the `StorageStack` it has deployed the `S3 Bucket`

```bash
✔  Built

|  StorageStack PUBLISH_ASSETS_COMPLETE
|  StorageStack Uploads/Bucket AWS::S3::Bucket CREATE_COMPLETE
|  StorageStack Uploads/Parameter_bucketName AWS::SSM::Parameter CREATE_COMPLETE
|  StorageStack Uploads/Bucket/Policy AWS::S3::BucketPolicy CREATE_COMPLETE
|  StorageStack AWS::CloudFormation::Stack UPDATE_COMPLETE
⠋  Deploying...

✔  Deployed:
   StorageStack
```

---

### Review

1. What we initially created `Hello World Public API`

- `API Gateway` handles our main `/` endpoint
- sending `GET` requests made to this to our default `services/functions/lambda.js` Lambda function

![](readme-images/serverless-hello-world-api-architecture.png)

2. Our `Notes App Architecture` currently
   - with DynamoDB
   - with S3

- Our database is not exposed publicly and is only invoked by our Lambda functions
- But our users will be uploading files directly to the S3 bucket that we created

![](readme-images/serverless-public-api-architecture.png)

- **The second point is something that is different from a lot of traditional server based architectures.**
- We are typically used to uploading the files to our server and then moving them to a file server.
- But here we will be directly uploading it to our S3 bucket. We will look at this in more detail when we look at file uploads.
- In the coming sections will also be looking at how we can secure access to these resources.
- We will be setting it up such that only our authenticated users will be allowed to access these resources.

---
