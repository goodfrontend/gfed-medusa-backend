import z from 'zod';

export const AuthSchema = z.object({
  idToken: z.string(),
});
