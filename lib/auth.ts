import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, organizationId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).organizationId = token.organizationId;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[auth] authorize called, keys:', credentials ? Object.keys(credentials) : 'null');

        const parsed = loginSchema.safeParse({
          email: typeof credentials?.email === 'string' ? credentials.email : '',
          password: typeof credentials?.password === 'string' ? credentials.password : '',
        });

        if (!parsed.success) {
          console.log('[auth] invalid credentials shape:', parsed.error.flatten().fieldErrors);
          return null;
        }

        console.log('[auth] looking up:', parsed.data.email);

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) {
          console.log('[auth] user not found:', parsed.data.email);
          return null;
        }
        if (!user.passwordHash) {
          console.log('[auth] user has no passwordHash:', parsed.data.email);
          return null;
        }

        console.log('[auth] comparing password, hash prefix:', user.passwordHash.slice(0, 7));
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          console.log('[auth] password mismatch for:', parsed.data.email);
          return null;
        }

        console.log('[auth] login success:', user.id);
        return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl };
      },
    }),
  ],
});
