import { NextResponse } from 'next/server'
import {prisma} from "@/lib/prisma";
import * as bcrypt from 'bcrypt-ts';

export async function POST(request: Request) {
  try {
    // Pastikan request memiliki body
    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      )
    }

    const { name, email, password } = await request.json()

    // Validasi manual tambahan
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Pastikan mengembalikan response yang valid
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Registration error:', error)
    
    // Handle error spesifik dari Prisma with type guard
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : 'Unknown error'

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}