"use server";

import { MessageRole, MessageType } from "@prisma/client";
import db from "../../../lib/db";
import { inngest } from "../../../inngest/client";
import { getCurrentUser } from "@/modules/auth/actions";
import { consumeCredits } from "@/lib/usage";

export const createMessages = async (value, inputId) => {
  const projectId = typeof inputId === 'object' ? inputId.projectId : inputId;
  
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
  });

  if (!project) throw new Error("Project not found or unauthorized");

  try {
    await consumeCredits();
  } catch (error) {
    throw new Error("Usage limit reached");
  }

  const newMessage = await db.message.create({
    data: {
      projectId: projectId,
      content: value,
      role: MessageRole.USER,
      type: MessageType.RESULT,
    },
  });

  await inngest.send({
    name: "code-agent/run",
    data: {
      value,
      projectId,
    },
  });

  return newMessage;
};

export const getMessages = async (input) => {
  // ✅ FIX: Extract string from object
  const projectId = typeof input === 'object' ? input.projectId : input;

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // ✅ FIX: Use findFirst for security check
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
  });

  if (!project) throw new Error("Project not found or unauthorized");

  const messages = await db.message.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      fragments: true, // Matches 'fragments' model name in your schema
    },
  });

  return messages;
};