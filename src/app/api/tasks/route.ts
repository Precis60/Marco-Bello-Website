import { NextRequest, NextResponse } from "next/server";

import { adminGuard } from "@/lib/adminAuth";
import { createTask, deleteTask, getTasks, setTaskStatus } from "@/lib/db";
import { getProperty } from "@/lib/properties";

const PRIORITIES = ["low", "medium", "high"];
const STATUSES = ["open", "in-progress", "done"];

export async function GET(request: NextRequest) {
  const denied = adminGuard(request.headers.get("x-admin-token"));
  if (denied) return denied;

  try {
    const tasks = await getTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to load tasks", error);
    return NextResponse.json({ error: "Couldn’t load tasks." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: {
    token?: string;
    propertyId?: string | null;
    title?: string;
    details?: string;
    assignee?: string;
    dueDate?: string;
    startDate?: string;
    completedDate?: string;
    priority?: string;
    status?: string;
    area?: string;
    workType?: string;
    minutes?: number | null;
    createdBy?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = adminGuard(body.token);
  if (denied) return denied;

  const title = body.title?.trim();
  const priority = body.priority ?? "medium";
  const status = body.status ?? "open";
  if (!title) {
    return NextResponse.json({ error: "Enter a task title." }, { status: 400 });
  }
  if (!PRIORITIES.includes(priority)) {
    return NextResponse.json({ error: "Unknown priority." }, { status: 400 });
  }
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }
  if (body.minutes != null && (!Number.isInteger(body.minutes) || body.minutes < 0)) {
    return NextResponse.json({ error: "Time spent must be a whole number." }, { status: 400 });
  }
  if (body.propertyId && !getProperty(body.propertyId)) {
    return NextResponse.json({ error: "Unknown property." }, { status: 400 });
  }

  try {
    await createTask({
      propertyId: body.propertyId || null,
      title,
      details: body.details?.trim() || null,
      assignee: body.assignee?.trim() || null,
      dueDate: body.dueDate || null,
      startDate: body.startDate || null,
      completedDate: body.completedDate || null,
      priority,
      status,
      area: body.area?.trim() || null,
      workType: body.workType?.trim() || null,
      minutes: body.minutes ?? null,
      createdBy: body.createdBy?.trim() || null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create task", error);
    return NextResponse.json({ error: "Couldn’t save that task." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let body: { token?: string; id?: number; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = adminGuard(body.token);
  if (denied) return denied;

  if (typeof body.id !== "number" || !body.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await setTaskStatus(body.id, body.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update task", error);
    return NextResponse.json({ error: "Couldn’t update that task." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let body: { token?: string; id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = adminGuard(body.token);
  if (denied) return denied;

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await deleteTask(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete task", error);
    return NextResponse.json({ error: "Couldn’t delete that task." }, { status: 500 });
  }
}
