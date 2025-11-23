import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isLocalMode, getSpriteDirPath } from '@/lib/config';

export async function GET() {
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

  try {
    const resolvedPath = path.resolve(spriteDir);
    const files = await fs.readdir(resolvedPath);

    const sprites = files
      .filter((file) => file.toLowerCase().endsWith('.png'))
      .map((filename) => ({
        filename,
        path: path.join(resolvedPath, filename),
      }));

    return NextResponse.json({ sprites });
  } catch (error) {
    console.error('Error reading sprite directory:', error);
    return NextResponse.json(
      { error: 'Failed to read sprite directory' },
      { status: 500 }
    );
  }
}
