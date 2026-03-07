"use server"

import db from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"
import { User } from "@prisma/client"

type OnBoardUserResponse =
  | {
      success: true
      user: User
      message: string
    }
  | {
      success: false
      error: string
    }

export const onBoardUser = async (): Promise<OnBoardUserResponse> => {
    try {
        const user = await currentUser()

        if (!user) {
            return {
                success: false,
                error: "No authenticated user found"
            }
        }

        const { id, firstName, lastName, imageUrl, emailAddresses } = user;

        const email = emailAddresses[0]?.emailAddress ?? ""

        const newUser = await db.user.upsert({
            where: {
                clerkId: id
            },
            update: {
                name:
                    firstName && lastName
                        ? `${firstName} ${lastName}`
                        : firstName || lastName || null,
                image: imageUrl || null,
                email: email
            },
            create: {
                clerkId: id,
                name:
                    firstName && lastName
                        ? `${firstName} ${lastName}`
                        : firstName || lastName || null,
                image: imageUrl || null,
                email: email
            }
        });

        return {
            success: true,
            user: newUser,
            message: "user onboarded successfully"
        }

    } catch (error) {
        console.error("Error onboarding user:", error);
        return {
            success: false,
            error: "failed to onboard user"
        };
    }
}


export const getCurrentUser = async (): Promise<{
    id: string
    email: string
    name: string | null
    image: string | null
    clerkId: string
} | null> => {
    try {
        const user = await currentUser()

        if (!user) {
            return null
        }

        const DbUser = await db.user.findUnique({
            where: {
                clerkId: user.id
            },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                clerkId: true
            }
        });

        return DbUser

    } catch (error) {
        console.error("Error fetching user:", error)
        return null
    }
}