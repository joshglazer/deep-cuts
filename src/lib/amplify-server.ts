import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import type { Schema } from "../../amplify/data/resource";
import outputs from "../../amplify_outputs.json";

// Server-only Amplify Data client (route handlers / server actions / server
// components — never import this from a "use client" component, since the
// API key travels with amplify_outputs.json). See amplify/data/resource.ts
// for why apiKey is the right auth mode here.
Amplify.configure(outputs, { ssr: true });

export const dataClient = generateClient<Schema>({ authMode: "apiKey" });
