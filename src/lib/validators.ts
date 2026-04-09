import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const weightSchema = z.object({
  date: dateString,
  weight: z.number().min(20).max(300),
});

export const mealItemSchema = z.object({
  food: z.string().min(1).max(200),
  meal: z.number().int().min(0).max(3),
  qty: z.number().min(0),
  kcal: z.number().min(0),
  prot: z.number().min(0),
  gluc: z.number().min(0),
  lip: z.number().min(0),
  fib: z.number().min(0).default(0),
});

export const waterSchema = z.object({
  date: dateString,
  glasses: z.number().int().min(0).max(12),
});

export const stepsSchema = z.object({
  date: dateString,
  steps: z.number().int().min(0),
});

export const targetsSchema = z.object({
  kcal: z.number().int().min(800).max(10000),
  prot: z.number().int().min(0),
  gluc: z.number().int().min(0),
  lip: z.number().int().min(0),
  fib: z.number().int().min(0).default(30),
});

export const profileSchema = z.object({
  height: z.number().int().min(100).max(250),
  goalWeight: z.number().min(20).max(300),
  stepsGoal: z.number().int().min(0),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  phase: z.enum(["A", "B", "C", "D", "E"]),
});

export const workoutSchema = z.object({
  date: dateString,
  type: z.string().min(1),
  duration: z.number().int().min(0),
  calories: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
  muscles: z
    .array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(0),
      })
    )
    .optional(),
});

export const recipeSchema = z.object({
  name: z.string().min(1).max(200),
  kcal: z.number().min(0),
  prot: z.number().min(0),
  gluc: z.number().min(0),
  lip: z.number().min(0),
  fib: z.number().min(0).default(0),
});

export const onboardingSchema = z.object({
  height: z.number().int().min(100).max(250),
  weight: z.number().min(20).max(300),
  goalWeight: z.number().min(20).max(300),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  phase: z.enum(["A", "B", "C", "D", "E"]),
});
