import { Api, Config, StackContext, use } from "sst/constructs"; // import Api, import Config
import { StorageStack } from "./StorageStack";

export function ApiStack({ stack }: StackContext) {
  const { table } = use(StorageStack); // use the table from StorageStack
  const STRIPE_SECRET_KEY = new Config.Secret(stack, "STRIPE_SECRET_KEY"); // get the secret

  // Create the API
  const api = new Api(stack, "Api", {
    defaults: {
      authorizer: "iam",
      function: {
        bind: [table, STRIPE_SECRET_KEY], // bind the table to our API // bind the secret to our API
      },
    },
    routes: {
      // create a POST /notes route (to create a new note)
      "POST /notes": "packages/functions/src/create.main",
      // create a GET /notes/{id} route (to get a single note by id)
      "GET /notes/{id}": "packages/functions/src/get.main",
      // create a GET /notes route (to get all notes)
      "GET /notes": "packages/functions/src/list.main",
      // create a PUT /notes/{id} route (to update a single note by id)
      "PUT /notes/{id}": "packages/functions/src/update.main",
      // create a DELETE /notes/{id} route (to delete a single note by id)
      "DELETE /notes/{id}": "packages/functions/src/delete.main",
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
