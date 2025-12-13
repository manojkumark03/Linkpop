import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long'),
  consent: z.boolean().refine((val) => val === true, 'Consent is required'),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Store the contact request in the database
    const contactRequest = await prisma.contactRequest.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        message: validatedData.message,
        metadata: {
          userAgent: validatedData.metadata?.userAgent,
          referrer: validatedData.metadata?.referrer,
          timestamp: validatedData.metadata?.timestamp || new Date().toISOString(),
        },
      },
    });

    // In a real application, you might want to:
    // 1. Send an email notification to the team
    // 2. Send a confirmation email to the user
    // 3. Integrate with a ticketing system

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully!',
        id: contactRequest.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Contact form error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: (error as any).errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again later.',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  // This could be used for admin purposes to retrieve contact requests
  try {
    const contactRequests = await prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to most recent 100 requests
    });

    return NextResponse.json({
      success: true,
      data: contactRequests,
    });
  } catch (error) {
    console.error('Error fetching contact requests:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contact requests' },
      { status: 500 },
    );
  }
}
