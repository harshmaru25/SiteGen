"use server";

import { inngest } from "@/inngest/client";
import db from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/actions";
import { MessageRole, MessageType } from "@prisma/client";
import { generateSlug } from "random-word-slugs";

// ✅ CREATE PROJECT
export const createProject = async (value) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const newProject = await db.project.create({
    data: {
      name: generateSlug(2, { format: "kebab" }),

      // ✅ Correct relation (IMPORTANT)
      user: {
        connect: { id: user.id },
      },

      // ✅ Correct plural relation
      messages: {
        create: {
          content: value,
          role: MessageRole.USER,
          type: MessageType.RESULT,
        },
      },
    },
  });

  // ✅ Trigger background job
  await inngest.send({
    name: "code-agent/run",
    data: {
      value: value,
      projectId: newProject.id,
    },
  });

  return newProject;
};

// ✅ GET ALL PROJECTS
export const getProjects = async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const projects = await db.project.findMany({
    where: {
      userID: user.id, // ✅ must match schema
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects;
};

// ✅ GET SINGLE PROJECT
export const getProjectById = async (projectId) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userID: user.id, // ✅ correct field
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
};