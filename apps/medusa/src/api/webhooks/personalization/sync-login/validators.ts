import { z } from 'zod';

export const PostPersonalizationSyncLoginBody = z.object({
  device_id: z.string().min(1),
  user_id: z.string().min(1),
});

export type PostPersonalizationSyncLoginBodyType = z.infer<
  typeof PostPersonalizationSyncLoginBody
>;
