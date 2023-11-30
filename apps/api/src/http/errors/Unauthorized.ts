import { OpenapiProp } from "openapi";

class UnauthorizedErrorConnectionError {
  @OpenapiProp({ type: "number" })
  status!: number;

  @OpenapiProp({ type: "string" })
  connection!: string;
}

export class Unauthorized {
  @OpenapiProp({ type: "string" })
  message!: string;

  @OpenapiProp([
    { type: "null" },
    {
      type: "array",
      option: {
        type: [
          {
            type: "object",
            option: { type: UnauthorizedErrorConnectionError },
          },
        ],
      },
    },
  ])
  errors: null | UnauthorizedErrorConnectionError[] = null;
}
