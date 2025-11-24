import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLocalMode, getSystemsDirPath } from '@/lib/config';
import { SolarSystemSchema, CelestialBodySchema } from '@/types';
import { z } from 'zod';

const SavePayloadSchema = z.object({
  system: SolarSystemSchema,
  rootBodies: z.array(CelestialBodySchema),
});

export async function GET() {
  if (!isLocalMode()) {
    return NextResponse.json(
      { error: 'API only available in local mode' },
      { status: 404 }
    );
  }

  const systemsDir = getSystemsDirPath();

  if (!systemsDir) {
    return NextResponse.json(
      { error: 'SYSTEMS_DIR not configured' },
      { status: 500 }
    );
  }

  try {
    const resolvedPath = path.resolve(systemsDir);
    console.log('GET /api/systems - Reading from:', resolvedPath);

    // Create directory if it doesn't exist
    await fs.mkdir(resolvedPath, { recursive: true });

    const files = await fs.readdir(resolvedPath);

    const systems = files
      .filter((file) => file.toLowerCase().endsWith('.json'))
      .map((filename) => ({
        filename,
        name: filename.replace('.json', ''),
      }));

    console.log('GET /api/systems - Found systems:', systems.map(s => s.filename));
    return NextResponse.json({ systems });
  } catch (error) {
    console.error('GET /api/systems - Error:', error);
    return NextResponse.json(
      { error: 'Failed to read systems directory' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isLocalMode()) {
    return NextResponse.json(
      { error: 'API only available in local mode' },
      { status: 404 }
    );
  }

  const systemsDir = getSystemsDirPath();

  if (!systemsDir) {
    return NextResponse.json(
      { error: 'SYSTEMS_DIR not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Validate payload
    const parseResult = SavePayloadSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('System validation failed:', JSON.stringify(parseResult.error.issues, null, 2));
      return NextResponse.json(
        { error: 'Invalid system data', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { system, rootBodies } = parseResult.data;
    const filename = `${system.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    const resolvedPath = path.resolve(systemsDir);

    console.log('POST /api/systems - Saving system:', system.name, 'with', rootBodies.length, 'root bodies');

    // Create directory if it doesn't exist
    await fs.mkdir(resolvedPath, { recursive: true });

    const filePath = path.join(resolvedPath, filename);

    await fs.writeFile(filePath, JSON.stringify({ system, rootBodies }, null, 2), 'utf-8');

    console.log('POST /api/systems - Saved to:', filePath);
    return NextResponse.json({
      success: true,
      filename,
      path: filePath,
    });
  } catch (error) {
    console.error('POST /api/systems - Error:', error);
    return NextResponse.json(
      { error: 'Failed to save system' },
      { status: 500 }
    );
  }
}
