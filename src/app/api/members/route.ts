import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const members = await prisma.member.findMany();
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await prisma.member.create({ data: body });
  return NextResponse.json(created);
}
