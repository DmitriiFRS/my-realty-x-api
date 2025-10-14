import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(saltOrRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export function comparePassword(rawPassword: string, hash: string): boolean {
  return bcrypt.compareSync(rawPassword, hash);
}
