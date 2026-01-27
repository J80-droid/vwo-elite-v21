import express from "express";
import cors from "cors";
import got from "got";

import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = 3001;

// Initialize Gemini (Server-side only)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(cors());
app.use(express.json());

// ===== GEMINI ROUTES =====

app.post("/api/gemini/stream", async (req, res) => {
  const { prompt } = req.body;

  // Set headers for streaming
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    const result = await model.generateContentStream(prompt);

    // Loop through chunks as they become available
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }

    res.end();
  } catch (error) {
    console.error("Stream Error:", error);
    res.write("--- ERROR GENERATING RESPONSE ---");
    res.end();
  }
});

// ===== SOMTODAY CONSTANTS =====
const CLIENT_ID = "somtoday-leerling-app";
const REDIRECT_URI = "somtoday://nl.topicus.somtoday.leerling/oauth/callback";
const SOMTODAY_AUTH_URL = "https://inloggen.somtoday.nl";

// Fallback schools list
const FALLBACK_SCHOOLS = [
  {
    uuid: "dac21bd7-1b06-4552-977f-a7fdc6ab292b",
    naam: "Dalton Den Haag",
    plaats: "Den Haag",
  },
  { uuid: "10", naam: "Gymnasium Haganum", plaats: "Den Haag" },
];

// ===== ROUTES =====

app.get("/api/somtoday/schools", async (req, res) => {
  res.json(FALLBACK_SCHOOLS);
});

// Exchange authorization code for tokens (user manually provides code)
app.post("/api/somtoday/exchange", async (req, res) => {
  const { code, codeVerifier } = req.body;

  if (!code || !codeVerifier) {
    return res
      .status(400)
      .json({ error: "Code en Code Verifier zijn verplicht" });
  }

  console.log("[Proxy] Wisselen van code voor token...");
  console.log(`[Proxy] Code: ${code.substring(0, 50)}...`);

  try {
    const tokenResponse = await got.post(`${SOMTODAY_AUTH_URL}/oauth2/token`, {
      form: {
        grant_type: "authorization_code",
        code: code,
        code_verifier: codeVerifier,
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
      },
      responseType: "json",
    });

    console.log("[Proxy] Succes! Token ontvangen.");
    res.json(tokenResponse.body);
  } catch (error) {
    console.error(
      "[Proxy] Fout bij token exchange:",
      error.response?.body || error.message,
    );
    res.status(500).json({
      error: "Kon code niet inwisselen",
      details: error.response?.body || error.message,
    });
  }
});

// Refresh token endpoint
app.post("/api/somtoday/refresh", async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: "Refresh token is verplicht" });
  }

  console.log("[Proxy] Refreshing token...");

  try {
    const tokenResponse = await got.post(`${SOMTODAY_AUTH_URL}/oauth2/token`, {
      form: {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
        client_id: CLIENT_ID,
      },
      responseType: "json",
    });

    console.log("[Proxy] Token refreshed!");
    res.json(tokenResponse.body);
  } catch (error) {
    console.error(
      "[Proxy] Refresh failed:",
      error.response?.body || error.message,
    );
    res.status(401).json({ error: "Token refresh mislukt" });
  }
});

// API Proxy for authenticated requests
app.get("/api/somtoday/api", async (req, res) => {
  const { endpoint, accessToken, apiUrl, ...restParams } = req.query;

  if (!endpoint || !accessToken || !apiUrl) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    // Build URL with forwarded query params (begindatum, einddatum, etc.)
    const queryParams = new URLSearchParams(restParams).toString();
    const url = queryParams
      ? `${apiUrl}${endpoint}?${queryParams}`
      : `${apiUrl}${endpoint}`;

    console.log("[Proxy] API Request:", url);

    const response = await got(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      // responseType: 'json' // Manual parsing to handle errors better
    });

    try {
      const data = JSON.parse(response.body);
      res.json(data);
    } catch (e) {
      console.log(
        "[Proxy] Non-JSON response:",
        response.body.substring(0, 100),
      );
      res.send(response.body);
    }
  } catch (error) {
    console.error("[Proxy] API request failed:", error.message);

    let details = error.response?.body;

    // Try to parse details if it looks like JSON
    if (
      typeof details === "string" &&
      (details.startsWith("{") || details.startsWith("["))
    ) {
      try {
        details = JSON.parse(details);
      } catch (e) {
        /* keep as string */
      }
    }

    if (error.response) {
      console.error("[Proxy] Upstream status:", error.response.statusCode);
      const logBody =
        typeof details === "object"
          ? JSON.stringify(details, null, 2)
          : details;
      console.error("[Proxy] Upstream body:", logBody);
    }

    // Forward the actual upstream status if available, otherwise 500
    const status = error.response?.statusCode || 500;

    res.status(status).json({
      error: error.message,
      upstreamStatus: error.response?.statusCode,
      details: details,
      // Forward raw body if it wasn't valid JSON, might be helpful
      rawBody:
        typeof error.response?.body === "string"
          ? error.response?.body
          : undefined,
    });
  }
});

app.get("/api/somtoday/health", (req, res) => {
  res.json({ status: "ok", mode: "manual_oauth" });
});

process.on("exit", (code) => {
  console.log(`[Proxy] Process exit with code: ${code}`);
});

process.on("SIGINT", () => {
  console.log("[Proxy] Received SIGINT. Shutting down...");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("[Proxy] Uncaught Exception:", err);
});

// ===== BENCHMARKS ROUTE =====
// Fetches live ELO scores from LMSYS community archive to keep the app "Elite"
app.get("/api/benchmarks", async (req, res) => {
  try {
    const response = await got("https://raw.githubusercontent.com/nakasyou/lmarena-history/main/output/scores.json");
    const data = JSON.parse(response.body);

    // 1. Find the latest date key
    const dates = Object.keys(data).sort((a, b) => Number(b) - Number(a));
    const latestDate = dates[0];

    if (!latestDate) {
      throw new Error("No data found in history");
    }

    // 2. Extract scores (using 'full_old' usually matches the main leaderboard)
    const latestScores = data[latestDate]?.text?.full_old || {};

    // 3. Normalize keys for easier matching client-side
    // We keep the original keys but might do some basic cleanup if needed
    // For now, we pass the raw map. Frontend will do fuzzy matching.

    res.json({
      date: latestDate,
      source: "nakasyou/lmarena-history",
      scores: latestScores
    });

  } catch (error) {
    console.error("[Proxy] Failed to fetch benchmarks:", error.message);
    res.status(500).json({ error: "Failed to fetch live benchmarks" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nSomtoday Proxy running on http://localhost:${PORT}`);
  console.log("Mode: Manual OAuth (Copy-Paste flow for Microsoft SSO)");
  console.log("Feature: Live Benchmarks Enabled");
});
