import Sandbox from "@e2b/code-interpreter";
import { inngest } from "./client";
import {
  gemini,
  createAgent,
  createTool,
  createNetwork,
  createState,
} from "@inngest/agent-kit";
import z from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "../prompt";
import { lastAssistantTextMessageContent } from "./utlis.ts";
import db from "../lib/db";
import { MessageRole, MessageType } from "@prisma/client";

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },

  async ({ event, step }) => {
    // ✅ Create sandbox
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("v0-clone-nextjs-build");
      return sandbox.sandboxId;
    });

    // ✅ Get previous messages
    const previousMessages = await step.run(
      "get-previous-messages",
      async () => {
        const formattedMessages = [];

        const messages = await db.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        for (const message of messages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          });
        }

        return formattedMessages;
      }
    );

    // ✅ State
    const state = createState(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      }
    );

    // ✅ Agent
    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),

      tools: [
        // 🔧 Terminal tool
        createTool({
          name: "terminal",
          description: "Run terminal commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => (buffers.stdout += data),
                  onStderr: (data) => (buffers.stderr += data),
                });

                return result.stdout;
              } catch (error) {
                return `Command failed: ${error}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),

        // 📁 Create/update files
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network?.state?.data.files || {};
                  const sandbox = await Sandbox.connect(sandboxId);

                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (error) {
                  return "Error: " + error;
                }
              }
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),

        // 📖 Read files
        createTool({
          name: "readFiles",
          description: "Read files",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await Sandbox.connect(sandboxId);
                const contents = [];

                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }

                return JSON.stringify(contents);
              } catch (error) {
                return "Error: " + error;
              }
            });
          },
        }),
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastText =
            lastAssistantTextMessageContent(result);

          if (lastText && network) {
            if (lastText.includes("<task_summary>")) {
              network.state.data.summary = lastText;
            }
          }

          return result;
        },
      },
    });

    // ✅ Network
    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 10,
      defaultState: state,
      router: async ({ network }) => {
        if (network.state.data.summary) return;
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value, { state });

    // ✅ Title generator
    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "Generate title",
      system: FRAGMENT_TITLE_PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
    });

    // ✅ Response generator
    const responseGenerator = createAgent({
      name: "response-generator",
      description: "Generate response",
      system: RESPONSE_PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
    });

    const { output: fragmentTitleOutput } =
      await fragmentTitleGenerator.run(result.state.data.summary);

    const { output: responseOutput } =
      await responseGenerator.run(result.state.data.summary);

    // ✅ Helpers
    const generateFragmentTitle = () => {
      if (fragmentTitleOutput[0]?.type !== "text") return "Fragment";

      return Array.isArray(fragmentTitleOutput[0].content)
        ? fragmentTitleOutput[0].content.join("")
        : fragmentTitleOutput[0].content;
    };

    const generateResponse = () => {
      if (responseOutput[0]?.type !== "text") return "Here you go";

      return Array.isArray(responseOutput[0].content)
        ? responseOutput[0].content.join("")
        : responseOutput[0].content;
    };

    const title = generateFragmentTitle();
    const response = generateResponse();

    // ✅ Error check
    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    // ✅ Sandbox URL
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      const host = sandbox.getHost(3000);
      return `http://${host}`;
    });

    // ✅ Save to DB
    await step.run("save-result", async () => {
      if (isError) {
        return db.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        });
      }

      return db.message.create({
        data: {
          projectId: event.data.projectId,
          content: response,
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              sandboxUrl,
              title,
              files: result.state.data.files,
            },
          },
        },
      });
    });

    // ✅ FINAL RETURN (FIXED)
    return {
      url: sandboxUrl,
      title: title,
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);