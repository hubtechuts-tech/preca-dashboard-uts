import { NextResponse } from 'next/server';
import { prisma } from '../../../infrastructure/database/PrismaClient';

/**
 * Health Check Endpoint
 *
 * Used by Docker healthcheck and monitoring tools to verify application status.
 * Checks:
 * - Database connectivity
 * - Application uptime
 *
 * Returns 200 if healthy, 503 if unhealthy
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
    }, { status: 503 });
  }
}
