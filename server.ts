import express from "express";
import path from "path";
import fs from "fs";
import { spawn, execSync } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const PYTHON_PORT = 8001;

function ensurePythonEnv() {
  if (!fs.existsSync("/venv/bin/python")) {
    console.log("Provisioning Python environment at /venv...");
    try {
      execSync(
        "python3 -m venv --without-pip /venv && curl -sSL https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && /venv/bin/python /tmp/get-pip.py && /venv/bin/pip install --no-cache-dir -r backend/requirements.txt && rm -f /tmp/get-pip.py",
        { stdio: "inherit" }
      );
    } catch (err) {
      console.error("Failed to provision Python environment:", err);
    }
  }
}

async function startServer() {
  const app = express();

  // 1. Ensure Python environment and spawn FastAPI uvicorn backend on port 8001
  ensurePythonEnv();
  const pythonBin = fs.existsSync("/venv/bin/python") ? "/venv/bin/python" : "python3";
  console.log("Starting FastAPI backend on port", PYTHON_PORT, "using", pythonBin);
  const uvicornProc = spawn(
    pythonBin,
    ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", String(PYTHON_PORT)],
    {
      cwd: path.join(process.cwd(), "backend"),
      env: { ...process.env, PYTHONPATH: path.join(process.cwd(), "backend") },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  uvicornProc.stdout.on("data", (data) => {
    console.log(`[FastAPI] ${data.toString().trim()}`);
  });

  uvicornProc.stderr.on("data", (data) => {
    console.error(`[FastAPI] ${data.toString().trim()}`);
  });

  uvicornProc.on("error", (err) => {
    console.error("Failed to start uvicorn process:", err);
  });

  // Wait a moment for FastAPI to boot
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 2. Proxy /api requests to FastAPI backend
  app.use(
    createProxyMiddleware({
      pathFilter: "/api",
      target: `http://127.0.0.1:${PYTHON_PORT}`,
      changeOrigin: true,
    })
  );

  // 3. Vite development middleware or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WorkPilot application running on http://localhost:${PORT}`);
  });
}

startServer();
