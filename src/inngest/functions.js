import { inngest } from "./client";
import Sandbox from "e2b";
import {
  gemini,
  createAgent,
  createTool,
  createNetwork
} from "@inngest/agent-kit";
import z from "zod";
import { PROMPT } from "@/prompt";
import { lastAssistantTextMessageContent } from "./utlis";

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },

  async ({ event, step }) => {

    // Step 1: Create sandbox
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("v0-clone-nextjs-build");
      return sandbox.sandboxId;
    });

    // Step 2: Create agent
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
      tools: [

        // 1. Terminal
        createTool({
          name: "code-agent",
          description: "An expert coding agent",
          parameters: z.object({
            command: z.string()
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = {
                stdout: "",
                stderr: ""
              };

              try {
                const sandbox = await Sandbox.connect(sandboxId);

                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data) => {
                    buffers.stderr += data;
                  }
                });

                return result.stdout;

              } catch (error) {
                console.log(
                  `Command Failed ${error} \n stdout: ${buffers.stdout} \n stderr: ${buffers.stderr}`
                );

                return `Command Failed ${String(
                  error
                )} \n stdout: ${buffers.stdout} \n stderr: ${buffers.stderr}`;
              }
            });
          }
        }),

        // 2. Create or Update Files
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string()
              })
            )
          }),

          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles =
                    network?.state?.data.files || {};

                  const sandbox = await Sandbox.connect(sandboxId);

                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;

                } catch (error) {
                  return "Error" + error;
                }
              }
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          }
        }),

        // 3. Read Files
        createTool({
          name: "Read_Files",
          description: "Read Files in the Sandbox",
          parameters: z.object({
            files: z.array(z.string())
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandboxPromise = Sandbox.connect(sandboxId);
                const contents = [];

                for (const file of files) {
                  const content = (await sandboxPromise).files.read(file);
                  contents.push({ path: file, content });
                }

                return JSON.stringify(contents);

              } catch (error) {
                return "Error" + error;
              }
            });
          }
        })

      ]
    });

    const lifecycle = {
      onResponse: async ({ result, network }) => {
        const lastAssistantMessageText =
          lastAssistantTextMessageContent(result);

        if (lastAssistantMessageText && network) {
          if (lastAssistantMessageText.includes("<task_summary>")) {
            network.state.data.summary = lastAssistantMessageText;
          }
        }

        return result;
      }
    };

    const network = createNetwork({
      name: "codingAgentNetwork",
      agents: [codeAgent],
      maxIter: 10,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      }
    });

    const result = await network.run(event.data.value);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    // Step 4: Get sandbox URL
    const sandboxUrl = await step.run(
      "get-sandbox-url",
      async () => {
        const sandbox = await Sandbox.connect(sandboxId);
        const host = sandbox.getHost(3000);
        return `http://${host}`;
      }
    );

    // Step 5: Safe response extraction
const message =
  result?.output?.[0]?.content ||
  result?.output ||
  "No response from agent";

    // Final return
    return {
      url: sandboxUrl,
      title: "Untitled",
      files: result.state.data.files,
      summary: result.state.data.summary
    };
  }
);