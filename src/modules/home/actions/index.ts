"use server"

import { inngest } from "@/inngest/client"
import { Inngest } from "inngest"

export const onInvoke = async () => {
    await inngest.send({
        name:"agent/hello"
    })
}