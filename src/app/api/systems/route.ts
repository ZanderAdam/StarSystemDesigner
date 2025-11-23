import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLocalMode, getSystemsDirPath } from '@/lib/config';
import { SolarSystemSchema } from '@/types';

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

    // Create directory if it doesn't exist
    await fs.mkdir(resolvedPath, { recursive: true });

    const files = await fs.readdir(resolvedPath);

    const systems = files
      .filter((file) => file.toLowerCase().endsWith('.json'))
      .map((filename) => ({
        filename,
        name: filename.replace('.json', ''),
      }));

    return NextResponse.json({ systems });
  } catch (error) {
    console.error('Error reading systems directory:', error);
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

    // Validate system data
    const parseResult = SolarSystemSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid system data', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const system = parseResult.data;
    const filename = `${system.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    const resolvedPath = path.resolve(systemsDir);

    // Create directory if it doesn't exist
    await fs.mkdir(resolvedPath, { recursive: true });

    const filePath = path.join(resolvedPath, filename);

    await fs.writeFile(filePath, JSON.stringify(system, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      filename,
      path: filePath,
    });
  } catch (error) {
    console.error('Error saving system:', error);
    return NextResponse.json(
      { error: 'Failed to save system' },
      { status: 500 }
    );
  }
}
