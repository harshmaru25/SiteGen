"use server"

import db from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"
import { id, tr } from "date-fns/locale"


export const onBoardUser = async () => {
    try {
        const user = await currentUser()

        if (!user) {
            return {
                success: false,
                error: "No authenticated user found"
            }
        }

        const { id, firstName, lastName, imageUrl, emailAddresses } = user;

        const newUser = await db.user.upsert({
            where: {
                clerkId: id
            },
            update: {
                name:
                    firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null,
                image: imageUrl || null,
                email: emailAddresses[0]?.emailAddress || ""
            },
            create: {
                clerkId: id,
                name:
                    firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null,
                image: imageUrl || null,
                email: emailAddresses[0]?.emailAddress || ""
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
            error: "falied to onboard user"
        };
    }
}


export const getCurrentUser = async () => {
    try {
        const user = await currentUser()

        if (!user) {
            return null;
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

        return DbUser;

    } catch (error) {

    }
}
