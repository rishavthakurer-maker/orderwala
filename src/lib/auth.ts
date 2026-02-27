import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getDb, Collections, generateId } from "@/lib/firebase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ["state"],
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

        const db = getDb();
        const snapshot = await db.collection(Collections.USERS)
          .where('email', '==', credentials.email).limit(1).get();

        if (snapshot.empty) {
          throw new Error("No user found with this email");
        }

        const userDoc = snapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() } as any;

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

        const db = getDb();
        const userDoc = await db.collection(Collections.USERS).doc(credentials.userId as string).get();

        if (!userDoc.exists) {
          throw new Error("User not found");
        }

        const user = { id: userDoc.id, ...userDoc.data() } as any;

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
        const db = getDb();
        const usersRef = db.collection(Collections.USERS);
        const snapshot = await usersRef.where('email', '==', user.email).limit(1).get();

        if (snapshot.empty) {
          const newId = generateId();
          try {
            await usersRef.doc(newId).set({
              name: user.name,
              email: user.email,
              image: user.image,
              is_verified: true,
              is_active: true,
              role: "customer",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            user.id = newId;
            user.role = "customer";
          } catch (err) {
            console.error('Error creating user:', err);
            return false;
          }
        } else {
          const existingUser = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
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

      // Always refresh role from Firestore to catch role changes
      if (token.id && typeof token.id === 'string') {
        try {
          const db = getDb();
          const userDoc = await db.collection(Collections.USERS).doc(token.id).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            token.role = userData?.role || token.role;
            token.phone = userData?.phone || token.phone;
          }
        } catch {
          // Keep existing token values if Firestore fails
        }
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
