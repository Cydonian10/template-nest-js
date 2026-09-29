import { ApiOkResponse } from '@nestjs/swagger';
import { z } from 'zod';

type OpenApiSchema = Extract<
  NonNullable<Parameters<typeof ApiOkResponse>[0]>,
  { schema: unknown }
>['schema'];

// Zod genera OpenAPI 3.0, pero sus tipos de JSON Schema son más amplios que los de Swagger.
export function toOpenApiSchema(schema: z.ZodType): OpenApiSchema {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
  }) as unknown as OpenApiSchema;
}
