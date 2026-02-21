import { getPrisma } from '../../lib/prisma';
import { getPresignedUploadUrl, getImageUrl } from '../../lib/s3';
import type { Prisma } from '@prisma/client';

export async function createProperty(cognitoSub: string, data: Record<string, unknown>) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  return prisma.property.create({
    data: { ...(data as object), ownerId: user.id } as Parameters<typeof prisma.property.create>[0]['data'],
    include: { images: true, owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
}

export async function listProperties(filters: Record<string, unknown>, userSub?: string) {
  const prisma = getPrisma();
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isActive: true };
  if (filters.city) where.city = filters.city;
  if (filters.department) where.department = filters.department;
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.listingType) where.listingType = filters.listingType;
  if (filters.minPrice || filters.maxPrice) {
    where.price = {} as Record<string, unknown>;
    if (filters.minPrice) (where.price as Record<string, unknown>).gte = Number(filters.minPrice);
    if (filters.maxPrice) (where.price as Record<string, unknown>).lte = Number(filters.maxPrice);
  }

  // Resolve the authenticated user once for all user-specific logic
  let viewedPropertyIds: Set<string> = new Set();
  if (userSub) {
    const currentUser = await prisma.user.findUnique({ where: { cognitoSub: userSub } });
    if (currentUser) {
      // Exclude the user's own properties from browse listing
      where.ownerId = { not: currentUser.id };

      // Exclude already-viewed properties if requested
      if (filters.excludeViewed) {
        const viewedIds = await prisma.propertyView.findMany({
          where: { userId: currentUser.id },
          select: { propertyId: true },
        });
        where.id = { notIn: viewedIds.map((v: { propertyId: string }) => v.propertyId) };
      }

      // Get viewed property IDs to mark isViewed on results
      const views = await prisma.propertyView.findMany({
        where: { userId: currentUser.id },
        select: { propertyId: true },
      });
      viewedPropertyIds = new Set(views.map((v: { propertyId: string }) => v.propertyId));
    }
  }

  const [data, total] = await Promise.all([
    prisma.property.findMany({
      where: where as Prisma.PropertyWhereInput,
      include: {
        images: { orderBy: { order: 'asc' } },
        owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.property.count({ where: where as Prisma.PropertyWhereInput }),
  ]);

  const enriched = data.map((p: (typeof data)[number]) => ({
    ...p,
    isViewed: viewedPropertyIds.has(p.id),
  }));

  return { data: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getPropertyById(id: string) {
  const prisma = getPrisma();
  return prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}

export async function updateProperty(id: string, cognitoSub: string, data: Record<string, unknown>) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  const property = await prisma.property.findUniqueOrThrow({ where: { id } });
  if (property.ownerId !== user.id) {
    throw Object.assign(new Error('No tienes permiso para editar esta propiedad'), { statusCode: 403 });
  }
  return prisma.property.update({ where: { id }, data: data as Parameters<typeof prisma.property.update>[0]['data'] });
}

export async function deleteProperty(id: string, cognitoSub: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  const property = await prisma.property.findUniqueOrThrow({ where: { id } });
  if (property.ownerId !== user.id) {
    throw Object.assign(new Error('No tienes permiso para eliminar esta propiedad'), { statusCode: 403 });
  }
  return prisma.property.update({ where: { id }, data: { isActive: false } });
}

export async function getPropertiesByOwner(cognitoSub: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  return prisma.property.findMany({
    where: { ownerId: user.id },
    include: { images: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function recordPropertyView(cognitoSub: string, propertyId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  return prisma.propertyView.upsert({
    where: { userId_propertyId: { userId: user.id, propertyId } },
    update: { viewedAt: new Date() },
    create: { userId: user.id, propertyId },
  });
}

export async function getViewedProperties(cognitoSub: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  return prisma.propertyView.findMany({
    where: { userId: user.id },
    include: {
      property: {
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { viewedAt: 'desc' },
  });
}

export async function getImageUploadUrl(propertyId: string, cognitoSub: string, contentType: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { cognitoSub } });
  const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
  if (property.ownerId !== user.id) {
    throw Object.assign(new Error('No tienes permiso para subir imagenes a esta propiedad'), { statusCode: 403 });
  }
  const imageId = crypto.randomUUID();
  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const key = `properties/${propertyId}/${imageId}.${ext}`;
  const uploadUrl = await getPresignedUploadUrl(key, contentType);
  const imageUrl = getImageUrl(key);
  const image = await prisma.propertyImage.create({ data: { propertyId, url: imageUrl } });
  return { uploadUrl, image };
}
