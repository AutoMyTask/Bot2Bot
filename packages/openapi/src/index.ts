import { OpenApiBuilder } from "openapi3-ts/oas31";
import { createPathItem } from "./create.path";
import { createRequestBody } from "./create.requestBody";
import { MetadataTag } from "./metadata/metadataTag";
import { MetadataProduce } from "./metadata/metadata.produce";
import { AppCore, RouteCore } from "api-core-types";
import { SchemaBuilder } from "./builders/schema.builder";

/**
 * MODULE OPENAPI
 */
// https://blog.simonireilly.com/posts/typescript-openapi

type GroupedMetadataTag = {
  name: string;
  tag: MetadataTag;
};

function processRouteHandlers(
  openApiBuilder: OpenApiBuilder,
  schemaBuilder: SchemaBuilder,
  conventions: RouteCore.IRouteConventions[],
) {
  const groupedMetadataTagCollection = new Map<string, GroupedMetadataTag>();

  for (const {
    path,
    request,
    prefixes,
    method,
    metadataCollection,
    auth,
  } of conventions) {
    const metadataTags =
      metadataCollection.getAllMetadataAttributes(MetadataTag);
    const metadataProduces =
      metadataCollection.getAllMetadataAttributes(MetadataProduce);

    for (const metadataProduce of metadataProduces) {
      schemaBuilder.addSchema(metadataProduce.type);
    }

    for (const metadataTag of metadataTags) {
      if (!groupedMetadataTagCollection.has(metadataTag.name)) {
        groupedMetadataTagCollection.set(metadataTag.name, {
          name: metadataTag.name,
          tag: metadataTag,
        });
      }
    }

    const pathItem = createPathItem(
      request.params,
      method,
      metadataTags,
      metadataProduces,
      auth?.schemes,
    );

    const fullPath = prefixes
      .slice()
      .reverse()
      .reduce((path, prefix) => {
        return prefix.description + path;
      }, path)
      .replace(/\/:([^/]+)/g, "/{$1}");

    openApiBuilder.addPath(fullPath, pathItem);

    if (request.params.body) {
      schemaBuilder.addSchema(request.params.body.type);
      const reqBody = createRequestBody(request.params.body.type);
      openApiBuilder.addRequestBody(request.params.body.name, reqBody);
    }

    for (const metadataProduce of metadataProduces) {
      openApiBuilder.addResponse(
        metadataProduce.type.name,
        metadataProduce.responseObject,
      );
    }
  }

  return { groupedMetadataTagCollection };
}

export { configureOpenApi } from "./configure.openapi";

export { MetadataTag } from "./metadata/metadataTag";

export { MetadataProduce } from "./metadata/metadata.produce";

export { OpenapiProp } from "./decorators/openapi.prop";

export { OpenapiObjectDescriptor } from "./decorators/openapi.object.descriptor.decorator";

export const openApi = (app: AppCore.IApp): void => {
  const openApiBuilder = app.services.get<OpenApiBuilder>(OpenApiBuilder);
  const schemaBuilder = new SchemaBuilder();

  const { groupedMetadataTagCollection } = processRouteHandlers(
    openApiBuilder,
    schemaBuilder,
    app.conventions,
  );

  for (const metadataTag of groupedMetadataTagCollection.values()) {
    openApiBuilder.addTag(metadataTag.tag.tagObject);
  }

  // Type pas forcément à conserver (utiliser entries à la place). Cele evite une dupplication de données
  for (const { type, schema } of schemaBuilder.getSchemas.values()) {
    openApiBuilder.addSchema(type.name, schema);
  }
};

export { OpenApiBuilder };
