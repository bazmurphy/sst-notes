# SST

https://sst.dev/guide.html

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

## Starting the dev environment

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

### Deploy to Production

To deploy our API to production, we’ll need to stop our local development environment and run the following.

`npm run deploy --prod`

We don’t have to do this right now. We’ll be doing it later once we are done working on our app.

The idea here is that we are able to work on separate environments. So when we are working in our personal environment `Baz`), it doesn’t break the API for our users in `prod`. The environment (or `stage`) names in this case are just strings and have no special significance. We could’ve called them `development` and `production` instead. We are however creating completely new serverless apps when we deploy to a different environment. This is another advantage of the serverless architecture. The infrastructure as code idea means that it’s easy to replicate to new environments. And the pay per use model means that we are not charged for these new environments unless we actually use them.

---
