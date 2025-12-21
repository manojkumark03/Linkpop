import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

import type { BlockType, BlockContent } from '@/types/blocks';

// Create a new profile element
export async function createProfileElement(
  profileId: string,
  type: BlockType,
  content: BlockContent,
  order?: number,
) {
  try {
    const user = await requireAuth();

    // Verify the user owns the profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return { ok: false, error: 'Profile not found or access denied' };
    }

    // Get the next order if not provided
    const maxOrder = await prisma.block.aggregate({
      where: {
        parentId: profileId,
        parentType: 'PROFILE',
      },
      _max: { order: true },
    });

    const nextOrder = order ?? (maxOrder._max.order ?? -1) + 1;

    const block = await prisma.block.create({
      data: {
        parentId: profileId,
        parentType: 'PROFILE',
        profileId,
        pageId: null,
        type,
        order: nextOrder,
        content: content as any,
      },
    });

    revalidatePath('/dashboard');

    return { ok: true, block };
  } catch (error) {
    console.error('Error creating profile element:', error);
    return { ok: false, error: 'Failed to create element' };
  }
}

// Update an existing profile element
export async function updateProfileElement(
  elementId: string,
  updates: {
    content?: BlockContent;
    order?: number;
    iconName?: string | null;
    fontColor?: string | null;
    bgColor?: string | null;
  },
) {
  try {
    const user = await requireAuth();

    // Get the block and verify ownership
    const block = await prisma.block.findFirst({
      where: {
        id: elementId,
        parentType: 'PROFILE',
        profile: { userId: user.id },
      },
      include: { profile: true },
    });

    if (!block) {
      return { ok: false, error: 'Element not found or access denied' };
    }

    const updateData: any = { ...updates };
    if (updateData.content) {
      updateData.content = updateData.content as any;
    }

    const updatedBlock = await prisma.block.update({
      where: { id: elementId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/dashboard');

    return { ok: true, block: updatedBlock };
  } catch (error) {
    console.error('Error updating profile element:', error);
    return { ok: false, error: 'Failed to update element' };
  }
}

// Delete a profile element
export async function deleteProfileElement(elementId: string) {
  try {
    const user = await requireAuth();

    // Get the block and verify ownership
    const block = await prisma.block.findFirst({
      where: {
        id: elementId,
        parentType: 'PROFILE',
        profile: { userId: user.id },
      },
      include: { profile: true },
    });

    if (!block) {
      return { ok: false, error: 'Element not found or access denied' };
    }

    await prisma.block.delete({
      where: { id: elementId },
    });

    revalidatePath('/dashboard');

    return { ok: true };
  } catch (error) {
    console.error('Error deleting profile element:', error);
    return { ok: false, error: 'Failed to delete element' };
  }
}

// Reorder profile elements
export async function reorderProfileElements(
  profileId: string,
  elementOrders: Array<{ id: string; order: number }>,
) {
  try {
    const user = await requireAuth();

    // Verify the user owns the profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return { ok: false, error: 'Profile not found or access denied' };
    }

    // Update all elements with new orders
    const updates = elementOrders.map(({ id, order }) =>
      prisma.block.update({
        where: { id },
        data: { order },
      }),
    );

    await prisma.$transaction(updates);

    revalidatePath('/dashboard');

    return { ok: true };
  } catch (error) {
    console.error('Error reordering profile elements:', error);
    return { ok: false, error: 'Failed to reorder elements' };
  }
}

// Get profile elements
export async function getProfileElements(profileId: string) {
  try {
    const user = await requireAuth();

    // Verify the user owns the profile
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return { ok: false, error: 'Profile not found or access denied' };
    }

    const elements = await prisma.block.findMany({
      where: {
        parentId: profileId,
        parentType: 'PROFILE',
      },
      orderBy: { order: 'asc' },
    });

    return { ok: true, elements };
  } catch (error) {
    console.error('Error getting profile elements:', error);
    return { ok: false, error: 'Failed to get elements' };
  }
}
