import { inngest } from "./client";
import Sandbox from "e2b";
import { gemini, createAgent } from "@inngest/agent-kit";

// Optional: define output type
type AgentResponse = {
  message: string;
  sandboxUrl: string;
};

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "agent/hello" },

  async ({ event, step }): Promise<AgentResponse> => {

    // Step 1: Create sandbox
    const sandboxId: string = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("v0-clone-nextjs-build");
      return sandbox.sandboxId;
    });

    // Step 2: Create agent
    const helloAgent = createAgent({
      name: "Hello Agent",
      description: "A simple agent",
      system: "Suggest top 10 programming books with short descriptions.",
      model: gemini({ model: "gemini-2.5-flash" })
    });

    // Step 3: Run agent with strong input
    const output = await helloAgent.run(
      "Give me a detailed list of top 10 programming books with explanations."
    );

    // Step 4: Get sandbox URL
    const sandboxUrl: string = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      const host: string = sandbox.getHost(3000);
      return `http://${host}`;
    });

    // Step 5: Safe response extraction
    const message: string =
      (output as any)?.output?.[0]?.content ||
      (output as any)?.output ||
      "No response from agent";

    // Final return
    return {
      message,
      sandboxUrl
    };
  }
);