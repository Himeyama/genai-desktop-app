import { z } from 'zod';

export const createTeamMemberSchema = z.object({
  email: z.string().email({ message: 'メールアドレスの形式が正しくありません。' }),
  isAdmin: z.boolean(),
});

export type TeamMemberCreateSchema = z.infer<typeof createTeamMemberSchema>;
