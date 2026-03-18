import { inngest } from "./client";
import Sandbox from "e2b";
import { gemini, createAgent } from "@inngest/agent-kit";
import { models } from "inngest";


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "agent/hello" },

  async ({ event, step }) => {
    
    const helloAgent = createAgent({
      name:"Hello Agent",
      description:"A simple agent that will say hello",
      system:" You are a helpful and friendly assistant.Always start with a greeting like Hello. Then provide a detailed, meaningful, and complete response to the user.Your response should be at least 4-5 sentences long. ",
      model:gemini({model:"gemini-2.5-flash"})
    })


    const output = await helloAgent.run("Greet the user and introduce yourself in a detailed and friendly way")

    return {
     message: output?.output?.[0]?.content || "No response from agent"
    }
  },

  
);