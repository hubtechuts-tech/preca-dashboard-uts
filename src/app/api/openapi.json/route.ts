/**
 * OpenAPI JSON Specification Route
 *
 * Serves the OpenAPI specification JSON file
 * Only available in development environment
 */

import { NextRequest, NextResponse } from 'next/server';
import openapiSpec from './openapi-spec.json';

export async function GET(request: NextRequest) {
  // Only allow in development environment
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return NextResponse.json(
      { error: 'API specification is not available in production' },
      { status: 404 }
    );
  }

  // Serve the OpenAPI spec JSON
  return NextResponse.json(openapiSpec);
}
