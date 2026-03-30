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
const VISITOR_STORAGE_KEY = "dq-visitor-name";
const USERNAME_PATTERN = /^[a-zA-Z]+$/;
const GIFT_BOX_SRC = "/media/birthday_gift.png";
const TROLL_MONKEY_SRC = "/media/troll_monkey.webp";

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

const PARTY_REACTION_CONFIG = [
  { key: "lol", emoji: "🤣", label: "Cuoi nga" },
  { key: "slay", emoji: "💅", label: "Slay queen" },
  { key: "chaos", emoji: "😈", label: "Bua mode" },
  { key: "hype", emoji: "🔥", label: "No tung bung" },
];

const INITIAL_REACTION_STATS = PARTY_REACTION_CONFIG.reduce(
  (acc, item) => ({ ...acc, [item.key]: 0 }),
  {},
);

const TROLL_CHALLENGES = [
  "Ke 3 diem vi sao Dang Quang la gay king trong 15 giay.",
  "Tha 5 icon cau vong lien tiep vao khong khi roi pose 1 kieu.",
  "Doc mot loi chuc theo giong MC dem chung ket.",
  "Lam 1 clip 5 giay chuc mung sinh nhat phong cach drama queen.",
  "Tag mot dua ban va bat no noi: Quang dep trai qua!",
  "Mo che do model walk tai cho va noi: Happy birthday your majesty!",
];

const PARTY_EMOJI_SET = ["🥳", "🎉", "🌈", "💅", "🔥", "✨", "🎂", "🦄", "😈"];

const WISH_TEMPLATES = [
  "Chuc gay king Dang Quang luc nao cung ruc ro!",
  "Tuoi moi cuoi that tuoi, bung no that to!",
  "Hom nay ban dep nhat tiec, khong can tranh cai.",
  "Chuc ban mo mat ra la gap ngay van may.",
  "Main character aura tang cap vo cuc!",
];

const DEFAULT_CREDIT_WISHES = [
  {
    id: "credit-1",
    content: "Gay king Dang Quang xuat hien la bua tiec sang len.",
    senderName: "Fan club",
  },
  {
    id: "credit-2",
    content: "Chuc Dang Quang luon ruc ro, tu tin va day nang luong dep.",
    senderName: "Hoi ban than",
  },
  {
    id: "credit-3",
    content: "Happy birthday gay king, chuc moi ngay deu la runway cua ban.",
    senderName: "Party crew",
  },
  {
    id: "credit-4",
    content: "Dang Quang la main character cua dem nay, khong can ban cai.",
    senderName: "The audience",
  },
  {
    id: "credit-5",
    content:
      "Chuc gay king Dang Quang tuoi moi cuoi that tuoi va no tung bung.",
    senderName: "The universe",
  },
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
    src: "/media/AnhQuangThoNgoc.png",
    name: "Anh Quang Thỏ Ngọc",
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

const normalizeUsernameInput = (value) =>
  value
    .replace(/[đĐ]/g, (char) => (char === "đ" ? "d" : "D"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "");

const buildDefaultDisplayName = (fileName) => {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim();
  return baseName || fileName;
};

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

const getMediaTimestamp = (item) => {
  const timestamp = Date.parse(item?.createdAt || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function App() {
  const canvasRef = useRef(null);
  const uploadInputRef = useRef(null);
  const burstsRef = useRef([]);
  const phraseQueueRef = useRef(0);
  const emojiTimerRef = useRef([]);
  const [visitorDraftName, setVisitorDraftName] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorError, setVisitorError] = useState("");
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [hasOpenedGift, setHasOpenedGift] = useState(false);
  const [hasFinishedGiftStep, setHasFinishedGiftStep] = useState(false);
  const [autoFire, setAutoFire] = useState(false);
  const [wishes, setWishes] = useState([]);
  const [wishDraft, setWishDraft] = useState("");
  const [wishError, setWishError] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [reactionStats, setReactionStats] = useState(INITIAL_REACTION_STATS);
  const [partyChallenge, setPartyChallenge] = useState(
    "Bam Quay challenge de nhan mot nhiem vu bua ngay.",
  );
  const [emojiDrops, setEmojiDrops] = useState([]);
  const [isLoadingWishes, setIsLoadingWishes] = useState(false);
  const [isSendingWish, setIsSendingWish] = useState(false);
  const [editingWishId, setEditingWishId] = useState("");
  const [editingWishDraft, setEditingWishDraft] = useState("");
  const [updatingWishIds, setUpdatingWishIds] = useState([]);
  const [deletingWishIds, setDeletingWishIds] = useState([]);
  const [serverMedia, setServerMedia] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [pendingUploads, setPendingUploads] = useState([]);
  const [deletingMediaIds, setDeletingMediaIds] = useState([]);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [mediaSort, setMediaSort] = useState("latest");
  const [mediaSearch, setMediaSearch] = useState("");
  const [isCompactMedia, setIsCompactMedia] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(-1);

  const allMedia = useMemo(
    () => [...BASE_MEDIA, ...serverMedia],
    [serverMedia],
  );

  const mediaCounts = useMemo(() => {
    let images = 0;
    let videos = 0;

    allMedia.forEach((item) => {
      if (item.type === "video") {
        videos += 1;
        return;
      }

      images += 1;
    });

    return {
      total: allMedia.length,
      images,
      videos,
    };
  }, [allMedia]);

  const displayedMedia = useMemo(() => {
    const normalizedQuery = mediaSearch.trim().toLowerCase();

    const filtered = allMedia.filter((item) => {
      if (mediaFilter !== "all" && item.type !== mediaFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const mediaName = String(item.name || "").toLowerCase();
      const uploaderName = String(item.uploadedBy || "").toLowerCase();
      return (
        mediaName.includes(normalizedQuery) ||
        uploaderName.includes(normalizedQuery)
      );
    });

    filtered.sort((a, b) => {
      if (mediaSort === "latest") {
        return getMediaTimestamp(b) - getMediaTimestamp(a);
      }

      if (mediaSort === "oldest") {
        return getMediaTimestamp(a) - getMediaTimestamp(b);
      }

      if (mediaSort === "name-desc") {
        return String(b.name || "").localeCompare(String(a.name || ""), "vi");
      }

      return String(a.name || "").localeCompare(String(b.name || ""), "vi");
    });

    return filtered;
  }, [allMedia, mediaFilter, mediaSearch, mediaSort]);

  const imageMedia = useMemo(
    () => displayedMedia.filter((item) => item.type === "image"),
    [displayedMedia],
  );

  const activeImage =
    activeImageIndex >= 0 && activeImageIndex < imageMedia.length
      ? imageMedia[activeImageIndex]
      : null;

  const creditBaseWishes = useMemo(
    () => [
      ...DEFAULT_CREDIT_WISHES,
      ...wishes.map((item) => ({
        id: item.id,
        content: item.content,
        senderName: item.senderName || `@${visitorName}`,
      })),
    ],
    [wishes, visitorName],
  );

  const creditLoopWishes = useMemo(() => {
    if (creditBaseWishes.length === 0) {
      return [];
    }

    const loopCount = 4;
    const expanded = [];

    for (let index = 0; index < loopCount; index += 1) {
      creditBaseWishes.forEach((item) => {
        expanded.push({
          ...item,
          loopKey: index,
        });
      });
    }

    return expanded;
  }, [creditBaseWishes]);

  const creditAnimationDuration = useMemo(
    () => `${Math.max(55, creditBaseWishes.length * 9)}s`,
    [creditBaseWishes.length],
  );

  useEffect(() => {
    try {
      const cachedName = window.localStorage.getItem(VISITOR_STORAGE_KEY) || "";
      const normalizedCachedName = normalizeUsernameInput(cachedName).slice(
        0,
        80,
      );
      if (normalizedCachedName) {
        setVisitorDraftName(normalizedCachedName);
      }
    } catch {
      // Ignore localStorage issues in restrictive browser modes.
    }
  }, []);

  useEffect(
    () => () => {
      emojiTimerRef.current.forEach((timerId) => window.clearTimeout(timerId));
      emojiTimerRef.current = [];
    },
    [],
  );

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
    if (!hasEnteredApp || (!hasOpenedGift && !hasFinishedGiftStep)) {
      return undefined;
    }

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
  }, [hasEnteredApp, hasOpenedGift, hasFinishedGiftStep]);

  useEffect(() => {
    if (!hasEnteredApp || !hasOpenedGift || hasFinishedGiftStep) {
      return undefined;
    }

    launchBurst(window.innerWidth * 0.5, window.innerHeight * 0.36, 8);

    const intervalId = window.setInterval(() => {
      launchBurst(
        randomBetween(window.innerWidth * 0.18, window.innerWidth * 0.82),
        randomBetween(window.innerHeight * 0.14, window.innerHeight * 0.52),
        4,
      );
    }, 320);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasEnteredApp, hasOpenedGift, hasFinishedGiftStep, launchBurst]);

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
        uploadedBy: item.uploadedBy || "",
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

  const fetchWishes = useCallback(async () => {
    setIsLoadingWishes(true);
    setWishError("");

    try {
      const response = await fetch(
        apiUrl(`/api/wishes?senderName=${encodeURIComponent(visitorName)}`),
      );
      if (!response.ok) {
        throw new Error("Khong the tai danh sach loi chuc");
      }

      const data = await response.json();
      setWishes(data.items || []);
    } catch (error) {
      setWishError(error.message || "Loi ket noi backend");
    } finally {
      setIsLoadingWishes(false);
    }
  }, [visitorName]);

  useEffect(() => {
    if (!hasEnteredApp || !hasFinishedGiftStep) {
      return;
    }

    fetchWishes();
  }, [fetchWishes, hasEnteredApp, hasFinishedGiftStep]);

  const handleEnterApp = (event) => {
    event.preventDefault();
    const trimmedName = normalizeUsernameInput(visitorDraftName).slice(0, 80);

    if (!trimmedName) {
      setVisitorError("Vui long nhap ten dang nhap.");
      return;
    }

    if (!USERNAME_PATTERN.test(trimmedName)) {
      setVisitorError("Ten dang nhap chi gom chu khong dau va viet lien.");
      return;
    }

    setVisitorName(trimmedName);
    setVisitorDraftName(trimmedName);
    setVisitorError("");
    setHasEnteredApp(true);
    setHasOpenedGift(false);
    setHasFinishedGiftStep(false);

    try {
      window.localStorage.setItem(VISITOR_STORAGE_KEY, trimmedName);
    } catch {
      // Ignore localStorage issues in restrictive browser modes.
    }
  };

  const handleSendWish = async (event) => {
    event.preventDefault();

    const content = wishDraft.trim();
    if (!content) {
      setWishError("Nhap loi chuc truoc khi gui.");
      return;
    }

    setIsSendingWish(true);
    setWishError("");
    setWishMessage("");

    try {
      const response = await fetch(apiUrl("/api/wishes"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderName: visitorName,
          content,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Khong the gui loi chuc");
      }

      setWishes((prev) => [data.item, ...prev]);
      setWishDraft("");
      setWishMessage("Da gui loi chuc va them vao credit ben phai.");
    } catch (error) {
      setWishError(error.message || "Khong the gui loi chuc");
    } finally {
      setIsSendingWish(false);
    }
  };

  const appendWishTemplate = (template) => {
    setWishDraft((prev) => {
      const joined = prev.trim() ? `${prev.trim()} ${template}` : template;
      return joined.slice(0, 500);
    });
  };

  const applyRandomWish = () => {
    const randomWish =
      WISH_TEMPLATES[Math.floor(Math.random() * WISH_TEMPLATES.length)];
    setWishDraft(randomWish);
    setWishError("");
    setWishMessage("Da nap mau loi chuc bua, sua them neu ban thich.");
  };

  const tapReaction = (reactionKey) => {
    setReactionStats((prev) => ({
      ...prev,
      [reactionKey]: (prev[reactionKey] || 0) + 1,
    }));

    launchBurst(
      randomBetween(window.innerWidth * 0.26, window.innerWidth * 0.74),
      randomBetween(window.innerHeight * 0.1, window.innerHeight * 0.34),
      3,
    );
  };

  const spinPartyChallenge = () => {
    const nextChallenge =
      TROLL_CHALLENGES[Math.floor(Math.random() * TROLL_CHALLENGES.length)];
    setPartyChallenge(nextChallenge);
    launchBurst(
      randomBetween(window.innerWidth * 0.3, window.innerWidth * 0.7),
      randomBetween(window.innerHeight * 0.12, window.innerHeight * 0.28),
      5,
    );
  };

  const triggerEmojiRain = () => {
    const batchId = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const dropCount = 18;

    const newDrops = Array.from({ length: dropCount }, (_, index) => ({
      id: `${batchId}-${index}`,
      batchId,
      emoji:
        PARTY_EMOJI_SET[Math.floor(Math.random() * PARTY_EMOJI_SET.length)],
      left: randomBetween(4, 96),
      delay: randomBetween(0, 0.55),
      duration: randomBetween(3.4, 5.4),
      rotate: randomBetween(-28, 28),
      size: randomBetween(1.1, 2.1),
    }));

    setEmojiDrops((prev) => [...prev, ...newDrops]);
    launchBurst(window.innerWidth * 0.5, window.innerHeight * 0.24, 6);

    const timerId = window.setTimeout(() => {
      setEmojiDrops((prev) => prev.filter((item) => item.batchId !== batchId));
      emojiTimerRef.current = emojiTimerRef.current.filter(
        (id) => id !== timerId,
      );
    }, 6200);

    emojiTimerRef.current.push(timerId);
  };

  const handleStartEditWish = (item) => {
    setEditingWishId(item.id);
    setEditingWishDraft(item.content);
    setWishError("");
    setWishMessage("");
  };

  const handleCancelEditWish = () => {
    setEditingWishId("");
    setEditingWishDraft("");
  };

  const handleSaveWishEdit = async (wishId) => {
    const content = editingWishDraft.trim();

    if (!content) {
      setWishError("Noi dung loi chuc khong duoc de trong.");
      return;
    }

    setUpdatingWishIds((prev) => [...prev, wishId]);
    setWishError("");
    setWishMessage("");

    try {
      const response = await fetch(
        apiUrl(`/api/wishes?id=${encodeURIComponent(wishId)}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderName: visitorName,
            content,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Khong the sua loi chuc");
      }

      setWishes((prev) =>
        prev.map((item) => (item.id === wishId ? data.item : item)),
      );
      setWishMessage("Da cap nhat loi chuc.");
      handleCancelEditWish();
    } catch (error) {
      setWishError(error.message || "Khong the sua loi chuc");
    } finally {
      setUpdatingWishIds((prev) => prev.filter((id) => id !== wishId));
    }
  };

  const handleDeleteWish = async (wish) => {
    const confirmed = window.confirm(
      `Xoa loi chuc cua ban da gui luc ${formatWishDate(wish.createdAt)}?`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingWishIds((prev) => [...prev, wish.id]);
    setWishError("");
    setWishMessage("");

    try {
      const response = await fetch(
        apiUrl(
          `/api/wishes?id=${encodeURIComponent(wish.id)}&senderName=${encodeURIComponent(visitorName)}`,
        ),
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Khong the xoa loi chuc");
      }

      setWishes((prev) => prev.filter((item) => item.id !== wish.id));
      if (editingWishId === wish.id) {
        handleCancelEditWish();
      }
      setWishMessage("Da xoa loi chuc.");
    } catch (error) {
      setWishError(error.message || "Khong the xoa loi chuc");
    } finally {
      setDeletingWishIds((prev) => prev.filter((id) => id !== wish.id));
    }
  };

  const formatWishDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Vua xong";
    }

    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setUploadError("");
    setUploadMessage("");
    setPendingUploads(
      files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        displayName: buildDefaultDisplayName(file.name),
      })),
    );
  };

  const updatePendingUploadName = (uploadId, value) => {
    setPendingUploads((prev) =>
      prev.map((item) =>
        item.id === uploadId ? { ...item, displayName: value } : item,
      ),
    );
  };

  const removePendingUpload = (uploadId) => {
    setPendingUploads((prev) => prev.filter((item) => item.id !== uploadId));
  };

  const clearPendingUploads = () => {
    setPendingUploads([]);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (pendingUploads.length === 0) {
      return;
    }

    if (!USERNAME_PATTERN.test(visitorName)) {
      setUploadError("Ten dang nhap khong hop le de upload file.");
      return;
    }

    const formData = new FormData();
    pendingUploads.forEach((item) => {
      formData.append("files", item.file);
    });
    formData.append(
      "displayNames",
      JSON.stringify(pendingUploads.map((item) => item.displayName.trim())),
    );
    formData.append("uploaderName", visitorName);

    setIsUploading(true);
    setUploadError("");
    setUploadMessage("");

    try {
      const response = await fetch(apiUrl("/api/media"), {
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
      clearPendingUploads();
    } catch (error) {
      setUploadError(error.message || "Upload that bai");
    } finally {
      setIsUploading(false);
    }
  };

  const refreshAlbum = () => {
    setUploadMessage("");
    fetchServerMedia();
  };

  const handleDeleteUploadedMedia = async (mediaItem) => {
    if (!mediaItem?.uploadedBy || mediaItem.uploadedBy !== visitorName) {
      setUploadError("Ban chi co the xoa file do chinh ban upload.");
      return;
    }

    const confirmed = window.confirm(
      `Xoa file "${mediaItem.name}" khoi album?`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingMediaIds((prev) => [...prev, mediaItem.id]);
    setUploadError("");

    try {
      const response = await fetch(
        apiUrl(
          `/api/media?id=${encodeURIComponent(mediaItem.id)}&uploaderName=${encodeURIComponent(visitorName)}`,
        ),
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Khong the xoa media");
      }

      setServerMedia((prev) => prev.filter((item) => item.id !== mediaItem.id));
      setUploadMessage(`Da xoa ${mediaItem.name}`);
      if (activeImage?.id === mediaItem.id) {
        setActiveImageIndex(-1);
      }
    } catch (error) {
      setUploadError(error.message || "Khong the xoa media");
    } finally {
      setDeletingMediaIds((prev) => prev.filter((id) => id !== mediaItem.id));
    }
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

  const handleOpenGift = () => {
    setHasOpenedGift(true);
  };

  const handleContinueAfterGift = () => {
    setHasFinishedGiftStep(true);
  };

  if (!hasEnteredApp) {
    return (
      <div className="entry-gate-shell">
        <section className="entry-gate-card">
          <p className="eyebrow">Welcome</p>
          <h1>Nhap ten de vao tiec sinh nhat Dang Quang</h1>
          <p className="lead">
            Ten cua ban se duoc dung khi gui loi chuc den Dang Quang.
          </p>

          <form className="entry-form" onSubmit={handleEnterApp}>
            <label htmlFor="visitor-name">Ten cua ban</label>
            <input
              id="visitor-name"
              type="text"
              value={visitorDraftName}
              maxLength={80}
              onChange={(event) => {
                setVisitorDraftName(
                  normalizeUsernameInput(event.target.value).slice(0, 80),
                );
                if (visitorError) {
                  setVisitorError("");
                }
              }}
              placeholder="Vi du: hieu, lam, vy"
              autoComplete="username"
              spellCheck={false}
              autoFocus
            />
            <p className="entry-rule">
              Chi duoc nhap chu khong dau va viet lien.
            </p>
            {visitorError ? (
              <p className="upload-status error">{visitorError}</p>
            ) : null}
            <button type="submit" className="btn primary entry-submit">
              Vao web
            </button>
          </form>
        </section>
      </div>
    );
  }

  if (!hasFinishedGiftStep) {
    return (
      <div className="entry-gate-shell">
        <canvas
          ref={canvasRef}
          className="firework-canvas"
          aria-hidden="true"
        />

        <section className="entry-gate-card gift-step-card">
          <p className="eyebrow">Chao {visitorName}</p>
          <h1>
            {hasOpenedGift ? "Hop qua da mo" : "Ban co mot hop qua bat ngo"}
          </h1>
          <p className="lead">
            {hasOpenedGift
              ? "Qua troll da xuat hien. Bam tiep de vao tiec sinh nhat Dang Quang."
              : "Bam vao hop qua de mo qua truoc khi vao ben trong."}
          </p>

          {!hasOpenedGift ? (
            <button
              type="button"
              className="gift-trigger"
              onClick={handleOpenGift}
              aria-label="Mo hop qua"
            >
              <img src={GIFT_BOX_SRC} alt="Hop qua" />
              <span>Mo hop qua</span>
            </button>
          ) : (
            <div className="gift-reveal">
              <img
                src={TROLL_MONKEY_SRC}
                alt="Con vuon troll"
                className="gift-troll-image"
              />
              <button
                type="button"
                className="btn primary gift-continue-btn"
                onClick={handleContinueAfterGift}
              >
                Vao tiec ngay
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <canvas ref={canvasRef} className="firework-canvas" aria-hidden="true" />

      <div className="emoji-rain-layer" aria-hidden="true">
        {emojiDrops.map((item) => (
          <span
            key={item.id}
            className="emoji-drop"
            style={{
              "--left": `${item.left}%`,
              "--delay": `${item.delay}s`,
              "--duration": `${item.duration}s`,
              "--rotate": `${item.rotate}deg`,
              "--size": item.size,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <header className="hero-card">
        <p className="eyebrow">Birthday roast mode</p>
        <h1>Chuc mung sinh nhat Quang gay</h1>
        <p className="lead">
          Chuc Quang tuoi moi luon vui, luon chat, tiec tung bung va ghi lai
          that nhieu khoanh khac dep de khoe voi hoi ban than.
        </p>
        <p className="visitor-badge">Nguoi dang truy cap: {visitorName}</p>
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

      <section className="panel fun-lab">
        <div className="fun-lab-head">
          <h2>Fun Lab Bua Party</h2>
          <p>
            Tha reaction, quay challenge, va kich hoat emoji rain de tiec vui
            nhon hon.
          </p>
        </div>

        <div className="fun-lab-grid">
          <article className="fun-card reactions-card">
            <h3>Tha reaction nhanh</h3>
            <div className="reaction-row">
              {PARTY_REACTION_CONFIG.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="reaction-btn"
                  onClick={() => tapReaction(item.key)}
                >
                  <span>
                    {item.emoji} {item.label}
                  </span>
                  <strong>{reactionStats[item.key] || 0}</strong>
                </button>
              ))}
            </div>
          </article>

          <article className="fun-card challenge-card">
            <h3>Challenge bựa</h3>
            <p className="challenge-text">{partyChallenge}</p>
            <div className="button-row fun-actions">
              <button
                type="button"
                className="btn primary"
                onClick={spinPartyChallenge}
              >
                Quay challenge
              </button>
              <button type="button" className="btn" onClick={triggerEmojiRain}>
                Emoji rain
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="panel wish-board">
        <div className="wish-board-layout">
          <div className="wish-board-main">
            <div className="wish-board-head">
              <h2>Gui loi chuc den Dang Quang</h2>
              <p>
                Ban dang xem va quan ly loi chuc cua rieng minh:{" "}
                <strong>@{visitorName}</strong>
              </p>
            </div>

            <div className="wish-presets">
              {WISH_TEMPLATES.map((template) => (
                <button
                  key={template}
                  type="button"
                  className="wish-chip"
                  onClick={() => appendWishTemplate(template)}
                  disabled={isSendingWish}
                >
                  {template}
                </button>
              ))}

              <button
                type="button"
                className="wish-chip random"
                onClick={applyRandomWish}
                disabled={isSendingWish}
              >
                Random bua
              </button>
            </div>

            <form className="wish-form" onSubmit={handleSendWish}>
              <textarea
                value={wishDraft}
                onChange={(event) => setWishDraft(event.target.value)}
                maxLength={500}
                placeholder="Viet loi chuc cua ban..."
                disabled={isSendingWish}
              />
              <div className="wish-form-actions">
                <button
                  type="submit"
                  className="btn primary"
                  disabled={isSendingWish}
                >
                  {isSendingWish ? "Dang gui..." : "Gui loi chuc"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={fetchWishes}
                  disabled={isLoadingWishes || isSendingWish}
                >
                  {isLoadingWishes ? "Dang tai..." : "Tai lai loi chuc"}
                </button>
              </div>
            </form>

            {wishMessage ? (
              <p className="upload-status">{wishMessage}</p>
            ) : null}
            {wishError ? (
              <p className="upload-status error">{wishError}</p>
            ) : null}

            <div className="wish-list">
              {wishes.length === 0 && !isLoadingWishes ? (
                <p className="wish-empty">Ban chua gui loi chuc nao.</p>
              ) : null}

              {wishes.map((item) => {
                const isEditing = editingWishId === item.id;
                const isUpdating = updatingWishIds.includes(item.id);
                const isDeleting = deletingWishIds.includes(item.id);

                return (
                  <article key={item.id} className="wish-item">
                    {isEditing ? (
                      <>
                        <textarea
                          className="wish-edit-input"
                          value={editingWishDraft}
                          onChange={(event) =>
                            setEditingWishDraft(event.target.value)
                          }
                          maxLength={500}
                          disabled={isUpdating}
                        />
                        <div className="wish-item-actions">
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => handleSaveWishEdit(item.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? "Dang luu..." : "Luu"}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={handleCancelEditWish}
                            disabled={isUpdating}
                          >
                            Huy
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>{item.content}</p>
                        <p className="wish-meta">
                          {formatWishDate(item.createdAt)}
                        </p>
                        <div className="wish-item-actions">
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleStartEditWish(item)}
                            disabled={isDeleting}
                          >
                            Sua
                          </button>
                          <button
                            type="button"
                            className="btn wish-danger"
                            onClick={() => handleDeleteWish(item)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Dang xoa..." : "Xoa"}
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="wish-credits">
            <p className="wish-credits-title">
              Credit loi chuc cua @{visitorName}
            </p>
            <div className="wish-credits-window">
              <div
                className="wish-credits-track animated"
                style={{ "--credit-duration": creditAnimationDuration }}
              >
                {creditLoopWishes.map((item) => (
                  <p
                    key={`${item.id}-${item.loopKey}`}
                    className="wish-credit-line"
                  >
                    <span>{item.content}</span>
                    <small>— {item.senderName}</small>
                  </p>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="panel media-panel">
        <div className="media-header">
          <div>
            <h2>Album cua Quang</h2>
            <p className="media-guide">
              Bao Nhiêu Hoa Anh Chỉ Chọn Một Cành Bao Nhiêu Người Anh Chỉ Chọn
              Mỗi Em
            </p>

            <a
              href="https://www.facebook.com/photo?fbid=1062066317902870&set=a.115345732574938"
              target="_blank"
              rel="noopener noreferrer"
            >
              nữ hoàng băng giá đụng đâu cứng đó
            </a>
          </div>

          <div className="upload-actions">
            <label
              htmlFor="media-upload"
              className="btn action-btn primary as-label"
            >
              <span className="action-step">1</span>
              <span className="action-copy">
                <strong>Chon file</strong>
                <small>Anh hoac video</small>
              </span>
            </label>
            <input
              id="media-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              disabled={isUploading}
              onChange={handleFilesSelected}
              ref={uploadInputRef}
            />
            <button
              type="button"
              className="btn action-btn primary"
              onClick={handleUpload}
              disabled={isUploading || pendingUploads.length === 0}
            >
              <span className="action-step">3</span>
              <span className="action-copy">
                <strong>
                  {isUploading ? "Dang tai len" : "Tai len album"}
                </strong>
                <small>
                  {pendingUploads.length > 0
                    ? `${pendingUploads.length} file dang cho`
                    : "Can chon file truoc"}
                </small>
              </span>
            </button>
            <button
              type="button"
              className="btn action-btn ghost"
              onClick={refreshAlbum}
              disabled={isLoadingMedia || isUploading}
            >
              <span className="action-step">R</span>
              <span className="action-copy">
                <strong>
                  {isLoadingMedia ? "Dang tai lai" : "Tai lai album"}
                </strong>
                <small>Dong bo tu server</small>
              </span>
            </button>

            <p
              className={`upload-selection ${pendingUploads.length === 0 ? "muted" : ""}`}
            >
              {pendingUploads.length > 0
                ? `Buoc 2: Dat ten cho ${pendingUploads.length} file ben duoi.`
                : "Chua co file nao duoc chon."}
            </p>
          </div>
        </div>

        {uploadMessage ? (
          <p className="upload-status">{uploadMessage}</p>
        ) : null}
        {uploadError ? (
          <p className="upload-status error">{uploadError}</p>
        ) : null}

        {pendingUploads.length > 0 ? (
          <div className="upload-drafts">
            <div className="upload-drafts-head">
              <strong>Buoc 2: Dat ten hien thi cho tung file</strong>
              <button
                type="button"
                className="btn draft-clear"
                onClick={clearPendingUploads}
                disabled={isUploading}
              >
                Xoa danh sach
              </button>
            </div>

            {pendingUploads.map((item) => (
              <div key={item.id} className="draft-item">
                <span>{item.file.name}</span>
                <div className="draft-item-editor">
                  <input
                    type="text"
                    value={item.displayName}
                    maxLength={120}
                    onChange={(event) =>
                      updatePendingUploadName(item.id, event.target.value)
                    }
                    placeholder="Nhap ten hien thi"
                    disabled={isUploading}
                  />
                  <button
                    type="button"
                    className="btn draft-remove"
                    onClick={() => removePendingUpload(item.id)}
                    disabled={isUploading}
                  >
                    Xoa
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="media-toolbar">
          <div className="media-stats">
            <span className="media-stat">
              <strong>{mediaCounts.total}</strong> Tong
            </span>
            <span className="media-stat">
              <strong>{mediaCounts.images}</strong> Anh
            </span>
            <span className="media-stat">
              <strong>{mediaCounts.videos}</strong> Video
            </span>
          </div>

          <div className="media-controls">
            <input
              type="search"
              className="media-search-input"
              placeholder="Tim theo ten file hoac user..."
              value={mediaSearch}
              onChange={(event) => setMediaSearch(event.target.value)}
            />

            <div className="media-filter-group">
              <button
                type="button"
                className={`media-filter-btn ${mediaFilter === "all" ? "active" : ""}`}
                onClick={() => setMediaFilter("all")}
              >
                Tat ca
              </button>
              <button
                type="button"
                className={`media-filter-btn ${mediaFilter === "image" ? "active" : ""}`}
                onClick={() => setMediaFilter("image")}
              >
                Anh
              </button>
              <button
                type="button"
                className={`media-filter-btn ${mediaFilter === "video" ? "active" : ""}`}
                onClick={() => setMediaFilter("video")}
              >
                Video
              </button>
            </div>

            <div className="media-sort-group">
              <select
                className="media-sort-select"
                value={mediaSort}
                onChange={(event) => setMediaSort(event.target.value)}
              >
                <option value="latest">Moi nhat</option>
                <option value="oldest">Cu nhat</option>
                <option value="name-asc">Ten A-Z</option>
                <option value="name-desc">Ten Z-A</option>
              </select>

              <button
                type="button"
                className="media-density-btn"
                onClick={() => setIsCompactMedia((prev) => !prev)}
              >
                {isCompactMedia ? "Che do rong" : "Che do gon"}
              </button>
            </div>
          </div>
        </div>

        {displayedMedia.length === 0 ? (
          <div className="media-empty">
            <p>Khong co media phu hop voi bo loc hien tai.</p>
            <small>Thu doi bo loc hoac tim kiem keyword khac.</small>
          </div>
        ) : (
          <div className={`media-grid ${isCompactMedia ? "compact" : ""}`}>
            {displayedMedia.map((item) => {
              const isDeleting = deletingMediaIds.includes(item.id);
              const isOwnUpload =
                Boolean(item.uploadedBy) && item.uploadedBy === visitorName;

              return (
                <figure
                  key={item.id}
                  className={`media-card ${item.type === "image" ? "previewable" : ""} ${isOwnUpload ? "deletable" : ""}`}
                >
                  {isOwnUpload ? (
                    <button
                      type="button"
                      className="media-card-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteUploadedMedia(item);
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Dang xoa" : "Xoa"}
                    </button>
                  ) : null}

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
                  <figcaption>
                    <span>{item.name}</span>
                    <small>
                      {item.type === "video" ? "Video" : "Anh"}
                      {item.uploadedBy ? ` • by @${item.uploadedBy}` : ""}
                    </small>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}
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
