import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLocalMode, getSpriteDirPath } from '@/lib/config';

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

  const spriteDir = getSpriteDirPath();

  if (!spriteDir) {
    return NextResponse.json(
      { error: 'SPRITE_DIR not configured' },
      { status: 500 }
    );
  }

  const { filename } = await params;

  // Security: prevent path traversal
  const sanitizedFilename = path.basename(filename);

  if (!sanitizedFilename.toLowerCase().endsWith('.png')) {
    return NextResponse.json(
      { error: 'Only PNG files are allowed' },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(path.resolve(spriteDir), sanitizedFilename);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error reading sprite file:', error);
    return NextResponse.json(
      { error: 'Sprite not found' },
      { status: 404 }
    );
  }
}
