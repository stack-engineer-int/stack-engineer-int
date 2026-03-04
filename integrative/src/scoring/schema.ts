import { z } from "zod";

export const FIBONACCI_SCORES = [1, 2, 3, 5, 8] as const;
export type FibonacciScore = (typeof FIBONACCI_SCORES)[number];

export const ImpactScoreSchema = z.object({
	score: z
		.number()
		.refine((n): n is FibonacciScore => FIBONACCI_SCORES.includes(n as FibonacciScore), {
			message: "Score must be Fibonacci: 1, 2, 3, 5, or 8",
		}),
	confidence: z.number().describe("Model confidence in this score (0-1)"),
	description: z.string().describe("Plain language description of what this change does"),
	rationale: z.string().describe("2-3 sentence explanation of why this score"),
	keyChanges: z.array(z.string()).describe("List of significant changes"),
	affectedAreas: z.array(z.string()).describe("Code areas affected (e.g., auth, payments, api)"),
});

export type ImpactScore = z.infer<typeof ImpactScoreSchema>;
