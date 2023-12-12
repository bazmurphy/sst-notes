import { Api, StackContext, use } from "sst/constructs"; // import Api
import { StorageStack } from "./StorageStack";

export function ApiStack({ stack }: StackContext) {
  const { table } = use(StorageStack); // use the table from StorageStack

  // Create the API
  const api = new Api(stack, "Api", {
    defaults: {
      function: {
        bind: [table], // bind the table to our API
      },
    },
    routes: {
      // create a new POST /notes route
      "POST /notes": "packages/functions/src/create.main",
    },
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  // Return the API resource
  return {
    api,
  };
}
