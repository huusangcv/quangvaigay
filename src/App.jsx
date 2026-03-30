import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();
const shouldIgnoreLocalhostApiBase =
  import.meta.env.PROD &&
  /^https?:\/\/localhost(?::\d+)?$/i.test(RAW_API_BASE_URL);
const API_BASE_URL = (
  shouldIgnoreLocalhostApiBase ? "" : RAW_API_BASE_URL
).replace(/\/$/, "");
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const FIREWORK_WORDS = [
  "QUANG GAY",
  "QUANG CO GAY KHONG",
  "CO GAY RAT GAY",
  "HAPPY BIRTHDAY QUANG",
  "QUANG OI BUNG NO DI",
];

const FIREWORK_COLORS = [
  "#ef8da1",
  "#f4bf8a",
  "#f1dc97",
  "#9fc9a0",
  "#91b3ce",
  "#b8a2cd",
];

const BASE_MEDIA = [
  {
    id: "img-1",
    type: "image",
    src: "/media/gallery_quang_party.png",
    name: "Quang party",
  },
  {
    id: "img-2",
    type: "image",
    src: "/media/gallery_quang_dance.png",
    name: "Quang dance",
  },
  {
    id: "img-3",
    type: "image",
    src: "/media/gallery_quang_fabulous.png",
    name: "Quang fabulous",
  },
  {
    id: "img-4",
    type: "image",
    src: "/media/gallery_squad_goals.png",
    name: "Squad goals",
  },
  {
    id: "img-5",
    type: "image",
    src: "/media/gallery_rainbow_cake.png",
    name: "Rainbow cake",
  },
  { id: "img-6", type: "image", src: "/media/cake.jpg", name: "Cake icon" },
  {
    id: "img-7",
    type: "image",
    src: "/media/birthday_gift.png",
    name: "Gift icon",
  },
];

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const buildBurst = (x, y, text) => {
  const particleCount = 120;
  const particles = [];

  for (let index = 0; index < particleCount; index += 1) {
    const angle = (Math.PI * 2 * index) / particleCount;
    const speed = randomBetween(1.6, 7.5);

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: randomBetween(0.75, 1),
      decay: randomBetween(0.009, 0.02),
      radius: randomBetween(1.5, 3.8),
      color:
        FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
    });
  }

  return {
    x,
    y,
    text,
    textAlpha: 1,
    textSize: randomBetween(18, 30),
    particles,
  };
};

function App() {
  const canvasRef = useRef(null);
  const burstsRef = useRef([]);
  const phraseQueueRef = useRef(0);
  const [autoFire, setAutoFire] = useState(false);
  const [serverMedia, setServerMedia] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(-1);

  const allMedia = useMemo(
    () => [...BASE_MEDIA, ...serverMedia],
    [serverMedia],
  );

  const imageMedia = useMemo(
    () => allMedia.filter((item) => item.type === "image"),
    [allMedia],
  );

  const activeImage =
    activeImageIndex >= 0 && activeImageIndex < imageMedia.length
      ? imageMedia[activeImageIndex]
      : null;

  const launchBurst = useCallback((x, y, amount = 2) => {
    for (let index = 0; index < amount; index += 1) {
      const phrase =
        FIREWORK_WORDS[phraseQueueRef.current % FIREWORK_WORDS.length];
      phraseQueueRef.current += 1;

      const offsetX = x + randomBetween(-70, 70);
      const offsetY = y + randomBetween(-60, 60);

      burstsRef.current.push(buildBurst(offsetX, offsetY, phrase));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const setCanvasSize = () => {
      const ratio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    setCanvasSize();

    let animationFrameId = 0;

    const animate = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      burstsRef.current = burstsRef.current.filter((burst) => {
        let hasAliveParticle = false;

        burst.particles.forEach((particle) => {
          if (particle.alpha <= 0) {
            return;
          }

          particle.vx *= 0.985;
          particle.vy *= 0.985;
          particle.vy += 0.05;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.alpha -= particle.decay;

          if (particle.alpha <= 0) {
            return;
          }

          hasAliveParticle = true;
          context.globalAlpha = particle.alpha;
          context.fillStyle = particle.color;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fill();
        });

        burst.textAlpha -= 0.018;
        burst.textSize += 0.12;

        if (burst.textAlpha > 0) {
          context.globalAlpha = burst.textAlpha;
          context.fillStyle = "#2f2533";
          context.font = `700 ${burst.textSize}px "Be Vietnam Pro", sans-serif`;
          context.textAlign = "center";
          context.fillText(burst.text, burst.x, burst.y - 12);
        }

        context.globalAlpha = 1;
        return hasAliveParticle || burst.textAlpha > 0;
      });

      animationFrameId = window.requestAnimationFrame(animate);
    };

    animationFrameId = window.requestAnimationFrame(animate);

    window.addEventListener("resize", setCanvasSize);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    if (!autoFire) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      launchBurst(
        randomBetween(window.innerWidth * 0.12, window.innerWidth * 0.88),
        randomBetween(window.innerHeight * 0.15, window.innerHeight * 0.62),
        3,
      );
    }, 180);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoFire, launchBurst]);

  const normalizeServerMedia = useCallback(
    (items) =>
      (items || []).map((item) => ({
        ...item,
        src:
          typeof item.src === "string" && item.src.startsWith("http")
            ? item.src
            : apiUrl(item.src || ""),
      })),
    [],
  );

  const fetchServerMedia = useCallback(async () => {
    setIsLoadingMedia(true);
    setUploadError("");

    try {
      const response = await fetch(apiUrl("/api/media"));
      if (!response.ok) {
        throw new Error("Khong the tai danh sach media");
      }

      const data = await response.json();
      setServerMedia(normalizeServerMedia(data.items));
    } catch (error) {
      setUploadError(error.message || "Loi ket noi backend");
    } finally {
      setIsLoadingMedia(false);
    }
  }, [normalizeServerMedia]);

  useEffect(() => {
    fetchServerMedia();
  }, [fetchServerMedia]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    setIsUploading(true);
    setUploadError("");
    setUploadMessage("");

    try {
      const response = await fetch(apiUrl("/api/media/uploads"), {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Upload that bai");
      }

      const createdMedia = normalizeServerMedia(data.items);
      setServerMedia((prev) => [...createdMedia, ...prev]);
      setUploadMessage(`Da tai len ${createdMedia.length} file len server`);
    } catch (error) {
      setUploadError(error.message || "Upload that bai");
    } finally {
      setIsUploading(false);
    }

    event.target.value = "";
  };

  const refreshAlbum = () => {
    setUploadMessage("");
    fetchServerMedia();
  };

  const openImagePreview = useCallback(
    (mediaId) => {
      const previewIndex = imageMedia.findIndex((item) => item.id === mediaId);
      if (previewIndex !== -1) {
        setActiveImageIndex(previewIndex);
      }
    },
    [imageMedia],
  );

  const closeImagePreview = useCallback(() => {
    setActiveImageIndex(-1);
  }, []);

  const showNextImage = useCallback(() => {
    setActiveImageIndex((prev) => {
      if (imageMedia.length === 0) {
        return -1;
      }

      if (prev < 0) {
        return 0;
      }

      return (prev + 1) % imageMedia.length;
    });
  }, [imageMedia.length]);

  const showPrevImage = useCallback(() => {
    setActiveImageIndex((prev) => {
      if (imageMedia.length === 0) {
        return -1;
      }

      if (prev < 0) {
        return 0;
      }

      return (prev - 1 + imageMedia.length) % imageMedia.length;
    });
  }, [imageMedia.length]);

  useEffect(() => {
    if (activeImageIndex < 0) {
      return;
    }

    if (imageMedia.length === 0) {
      setActiveImageIndex(-1);
      return;
    }

    if (activeImageIndex >= imageMedia.length) {
      setActiveImageIndex(imageMedia.length - 1);
    }
  }, [activeImageIndex, imageMedia.length]);

  useEffect(() => {
    if (!activeImage) {
      return undefined;
    }

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        closeImagePreview();
        return;
      }

      if (event.key === "ArrowRight") {
        showNextImage();
        return;
      }

      if (event.key === "ArrowLeft") {
        showPrevImage();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [activeImage, closeImagePreview, showNextImage, showPrevImage]);

  const handleFireZoneClick = (event) => {
    launchBurst(event.clientX, event.clientY, 3);
  };

  const triggerRandomBurst = (event) => {
    event.stopPropagation();
    launchBurst(
      randomBetween(window.innerWidth * 0.2, window.innerWidth * 0.8),
      randomBetween(window.innerHeight * 0.16, window.innerHeight * 0.58),
      4,
    );
  };

  const toggleAutoFire = (event) => {
    event.stopPropagation();
    setAutoFire((prev) => !prev);
  };

  return (
    <div className="app-shell">
      <canvas ref={canvasRef} className="firework-canvas" aria-hidden="true" />

      <header className="hero-card">
        <p className="eyebrow">Birthday roast mode</p>
        <h1>Chuc mung sinh nhat Quang gay</h1>
        <p className="lead">
          Chuc Quang tuoi moi luon vui, luon chat, tiec tung bung va ghi lai
          that nhieu khoanh khac dep de khoe voi hoi ban than.
        </p>
      </header>

      <section className="wish-grid">
        <article className="panel">
          <h2>Loi chuc danh cho Quang</h2>
          <p>
            Happy birthday Quang. Chuc ban luc nao cung duoc song dung vibe cua
            minh, thay doi the gioi bang su tu tin, vui nhon va mot chut bua de
            ai cung nho.
          </p>
          <p>
            Team hom nay se no tung bung voi loat cau danh dau thuong hieu:
            Quang Gay, Quang co gay khong, co gay rat gay.
          </p>
        </article>

        <article className="panel fire-zone" onClick={handleFireZoneClick}>
          <h2>Bam de ban phao hoa chu</h2>
          <p>
            Click vao khu vuc nay de no ra chu. Cang click nhanh thi cang bung
            no. Bat che do lien thanh de tiec cang cua.
          </p>

          <div className="button-row">
            <button
              type="button"
              className="btn primary"
              onClick={triggerRandomBurst}
            >
              Ban phao hoa nua
            </button>
            <button type="button" className="btn" onClick={toggleAutoFire}>
              {autoFire ? "Tat ban lien thanh" : "Bat ban lien thanh"}
            </button>
          </div>

          <p className="fire-hint">
            Chu se no lan luot: {FIREWORK_WORDS.join(" | ")}
          </p>
        </article>
      </section>

      <section className="panel media-panel">
        <div className="media-header">
          <div>
            <h2>Album cua Quang</h2>
            <p>
              Co san anh mau va co o de hien thi video. Local se luu vao uploads
              cua du an, con tren Vercel se luu binary trong MongoDB.
            </p>
          </div>

          <div className="upload-actions">
            <label htmlFor="media-upload" className="btn primary as-label">
              {isUploading ? "Dang upload..." : "Tai anh hoac video"}
            </label>
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              disabled={isUploading}
              onChange={handleUpload}
            />
            <button
              type="button"
              className="btn"
              onClick={refreshAlbum}
              disabled={isLoadingMedia || isUploading}
            >
              {isLoadingMedia ? "Dang tai lai..." : "Tai lai album tu server"}
            </button>
          </div>
        </div>

        {uploadMessage ? (
          <p className="upload-status">{uploadMessage}</p>
        ) : null}
        {uploadError ? (
          <p className="upload-status error">{uploadError}</p>
        ) : null}

        <div className="media-grid">
          {allMedia.map((item) => (
            <figure
              key={item.id}
              className={`media-card ${item.type === "image" ? "previewable" : ""}`}
            >
              {item.type === "image" ? (
                <button
                  type="button"
                  className="preview-trigger"
                  onClick={() => openImagePreview(item.id)}
                  aria-label={`Xem anh ${item.name}`}
                >
                  <img src={item.src} alt={item.name} loading="lazy" />
                </button>
              ) : (
                <video
                  src={item.src}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
              <figcaption>{item.name}</figcaption>
            </figure>
          ))}

          <article className="media-card video-placeholder">
            <div>
              <strong>Cho de video cua Quang</strong>
              <p>Upload file mp4, mov, webm de hien thi o day.</p>
            </div>
          </article>
        </div>
      </section>

      {activeImage ? (
        <div
          className="media-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Dang xem anh ${activeImage.name}`}
          onClick={closeImagePreview}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={closeImagePreview}
            aria-label="Dong xem anh"
          >
            Dong
          </button>

          {imageMedia.length > 1 ? (
            <>
              <button
                type="button"
                className="lightbox-nav prev"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevImage();
                }}
                aria-label="Anh truoc"
              >
                {"<"}
              </button>
              <button
                type="button"
                className="lightbox-nav next"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
                aria-label="Anh tiep theo"
              >
                {">"}
              </button>
            </>
          ) : null}

          <figure
            className="lightbox-figure"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={activeImage.src} alt={activeImage.name} />
            <figcaption>
              <span>{activeImage.name}</span>
              <span>
                {activeImageIndex + 1}/{imageMedia.length}
              </span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}

export default App;
