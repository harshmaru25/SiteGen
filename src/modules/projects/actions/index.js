"use server";

import { inngest } from "../../../inngest/client";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@prisma/client";
import { generateSlug } from "random-word-slugs";
import { getCurrentUser } from "@/modules/auth/actions";
import { consumeCredits } from "@/lib/usage";

export const getProjects = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return await db.project.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createProject = async (value) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await consumeCredits();
  } catch (error) {
    throw new Error("Usage limit reached. Please try again later.");
  }

  const newProject = await db.project.create({
    data: {
      name: generateSlug(2, { format: "kebab" }),
      userId: user.id,
      messages: {
        create: {
          content: value,
          role: MessageRole.USER,
          type: MessageType.RESULT,
        },
      },
    },
  });

  await inngest.send({
    name: "code-agent/run",
    data: {
      value: value,
      projectId: newProject.id,
    },
  });

  return newProject;
};

export const getProjectById = async (input) => {
  // ✅ FIX: Extract string from object if Next.js passes 'params'
  const projectId = typeof input === 'object' ? input.projectId : input;

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // ✅ FIX: Use findFirst (findUnique only allows ID-only lookups)
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!project) throw new Error("Project not found");

  return project;
};