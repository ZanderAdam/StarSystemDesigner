import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLocalMode, getSystemsDirPath } from '@/lib/config';
import { SolarSystemSchema } from '@/types';

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
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const systemData = JSON.parse(fileContent);

    // Validate
    const parseResult = SolarSystemSchema.safeParse(systemData);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid system file', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(parseResult.data);
  } catch (error) {
    console.error('Error reading system file:', error);
    return NextResponse.json(
      { error: 'System not found' },
      { status: 404 }
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
    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting system file:', error);
    return NextResponse.json(
      { error: 'Failed to delete system' },
      { status: 500 }
    );
  }
}
