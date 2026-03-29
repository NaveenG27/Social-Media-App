import { NextResponse } from 'next/server';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  // Handle Zod Error format if needed, though usually handled inline
  if (error instanceof Error) {
    console.error('[API Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error('[Unhandled Error]:', error);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
