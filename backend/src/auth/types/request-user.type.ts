import type { Role } from '@prisma/client';

export type RequestUser = {
  userId: string;
  role: Role;
};
