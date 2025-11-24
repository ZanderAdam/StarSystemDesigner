import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLocalMode, getSystemsDirPath } from '@/lib/config';
import { SolarSystemSchema, CelestialBodySchema } from '@/types';
import { z } from 'zod';

const SystemFileSchema = z.object({
  system: SolarSystemSchema,
  rootBodies: z.array(CelestialBodySchema),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
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

  const { filename } = await params;

  // Security: prevent path traversal
  const sanitizedFilename = path.basename(filename);

  if (!sanitizedFilename.toLowerCase().endsWith('.json')) {
    return NextResponse.json(
      { error: 'Only JSON files are allowed' },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(path.resolve(systemsDir), sanitizedFilename);
    console.log('GET /api/systems/[filename] - Loading:', filePath);

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const systemData = JSON.parse(fileContent);

    // Validate
    const parseResult = SystemFileSchema.safeParse(systemData);
    if (!parseResult.success) {
      console.error('GET /api/systems/[filename] - Validation failed:', JSON.stringify(parseResult.error.issues, null, 2));
      return NextResponse.json(
        { error: 'Invalid system file', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    console.log('GET /api/systems/[filename] - Loaded:', parseResult.data.system.name);
    return NextResponse.json(parseResult.data);
  } catch (error) {
    console.error('GET /api/systems/[filename] - Error:', error);

    // Return appropriate status code based on error type
    if (error instanceof Error) {
      if ('code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'System not found' },
          { status: 404 }
        );
      }
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON in system file' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to read system file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
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

  const { filename } = await params;

  // Security: prevent path traversal
  const sanitizedFilename = path.basename(filename);

  if (!sanitizedFilename.toLowerCase().endsWith('.json')) {
    return NextResponse.json(
      { error: 'Only JSON files are allowed' },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(path.resolve(systemsDir), sanitizedFilename);
    console.log('DELETE /api/systems/[filename] - Deleting:', filePath);

    await fs.unlink(filePath);

    console.log('DELETE /api/systems/[filename] - Deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/systems/[filename] - Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete system' },
      { status: 500 }
    );
  }
}
