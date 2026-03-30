import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import Media from "./models/Media.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const isVercelRuntime = Boolean(process.env.VERCEL);
const uploadsDir = isVercelRuntime
  ? path.join("/tmp", "uploads")
  : path.join(projectRoot, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

let dbConnectPromise;

const ensureDbConnected = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!dbConnectPromise) {
    dbConnectPromise = mongoose.connect(mongoUri).catch((error) => {
      dbConnectPromise = undefined;
      throw error;
    });
  }

  await dbConnectPromise;
};

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow Vercel preview/prod domains by default when running on Vercel.
  if (isVercelRuntime) {
    return /\.vercel\.app$/i.test(origin);
  }

  return false;
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS blocked origin"));
    },
  }),
);

app.use(express.json());
app.use("/api/uploads", express.static(uploadsDir));

const buildSafeFilename = (originalName) => {
  const safeBase = originalName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);

  const ext = path.extname(safeBase) || path.extname(originalName).toLowerCase();
  const nameOnly = path.basename(safeBase, ext) || "media";

  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${nameOnly}${ext}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    callback(null, buildSafeFilename(file.originalname));
  },
});

const maxFileSize = Number(
  process.env.MAX_FILE_SIZE || (isVercelRuntime ? 4 * 1024 * 1024 : 100 * 1024 * 1024),
);

const multerOptions = {
  limits: {
    fileSize: maxFileSize,
    files: 20,
  },
  fileFilter: (_req, file, callback) => {
    const isAccepted = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (isAccepted) {
      callback(null, true);
      return;
    }

    callback(new Error("Only image and video files are allowed"));
  },
};

const uploadLocal = multer({ ...multerOptions, storage });
const uploadInMemory = multer({ ...multerOptions, storage: multer.memoryStorage() });

const uploadMany = (req, res, next) => {
  const upload = isVercelRuntime ? uploadInMemory : uploadLocal;
  upload.array("files", 20)(req, res, next);
};

const toClientMedia = (doc) => ({
  id: String(doc._id),
  name: doc.originalName,
  type: doc.mediaType,
  src: doc.url,
  createdAt: doc.createdAt,
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/media", async (_req, res, next) => {
  try {
    const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
    res.json({ items: mediaItems.map(toClientMedia) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/media/file/:id", async (req, res, next) => {
  try {
    const item = await Media.findById(req.params.id).select("bufferData mimeType");

    if (!item || !item.bufferData) {
      res.status(404).json({ message: "Media not found" });
      return;
    }

    res.setHeader("Content-Type", item.mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(item.bufferData);
  } catch (error) {
    next(error);
  }
});

app.post("/api/media/upload", uploadMany, async (req, res, next) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      res.status(400).json({ message: "No valid files uploaded" });
      return;
    }

    const docs = files.map((file) => {
      if (isVercelRuntime) {
        const documentId = new mongoose.Types.ObjectId();
        return {
          _id: documentId,
          originalName: file.originalname,
          filename: buildSafeFilename(file.originalname),
          url: `/api/media/file/${documentId}`,
          mimeType: file.mimetype,
          mediaType: file.mimetype.startsWith("video/") ? "video" : "image",
          size: file.size,
          storageProvider: "mongo",
          bufferData: file.buffer,
        };
      }

      return {
        originalName: file.originalname,
        filename: file.filename,
        url: `/api/uploads/${file.filename}`,
        mimeType: file.mimetype,
        mediaType: file.mimetype.startsWith("video/") ? "video" : "image",
        size: file.size,
        storageProvider: "local",
      };
    });

    const created = await Media.insertMany(docs);
    res.status(201).json({ items: created.map(toClientMedia) });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error.message === "CORS blocked origin") {
    res.status(403).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: error.message || "Internal server error" });
});

async function bootstrap() {
  await ensureDbConnected();
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

if (!isVercelRuntime) {
  bootstrap().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}

const handler = async (req, res) => {
  await ensureDbConnected();
  return app(req, res);
};

export default handler;
