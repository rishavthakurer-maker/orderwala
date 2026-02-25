import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const supabase = createAdminSupabaseClient();

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user) {
          throw new Error("No user found with this email");
        }

        if (!user.password_hash) {
          throw new Error("Please login with Google or request a password reset");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        if (!user.is_active) {
          throw new Error("Your account has been deactivated");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.userId) {
          throw new Error("Phone number and user ID are required");
        }

        const supabase = createAdminSupabaseClient();

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', credentials.userId)
          .single();

        if (error || !user) {
          throw new Error("User not found");
        }

        if (!user.is_active) {
          throw new Error("Your account has been deactivated");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const supabase = createAdminSupabaseClient();

        const { data: existingUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error || !existingUser) {
          // Create new user for Google sign-in
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              name: user.name,
              email: user.email,
              image: user.image,
              is_verified: true,
              is_active: true,
              role: "customer",
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            return false;
          }

          user.id = newUser.id;
          user.role = newUser.role;
        } else {
          if (!existingUser.is_active) {
            return false;
          }
          user.id = existingUser.id;
          user.role = existingUser.role;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }

      // Handle session update
      if (trigger === "update" && session) {
        token.name = session.name;
        token.image = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role?: string;
    phone?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      phone?: string;
    };
  }
}
