import { z } from 'zod';

export const updateTeamMemberSchema = z.object({
  email: z.string().email({ message: 'メールアドレスの形式が正しくありません。' }),
  isAdmin: z.boolean(),
});

export type TeamMemberUpdateSchema = z.infer<typeof updateTeamMemberSchema>;
