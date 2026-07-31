"use client";

import { createClient } from "./supabase/client";

// Backwards-compatible browser client for existing Client Components.
export const supabase = createClient();
