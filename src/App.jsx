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
const GIFT_STEP_STORAGE_KEY = "dq-gift-step-complete";
const DEFAULT_PROD_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;
const DEFAULT_DEV_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;
const RAW_CLIENT_UPLOAD_LIMIT = Number(
  import.meta.env.VITE_MAX_FILE_SIZE || "",
);
const CLIENT_UPLOAD_LIMIT_BYTES =
  Number.isFinite(RAW_CLIENT_UPLOAD_LIMIT) && RAW_CLIENT_UPLOAD_LIMIT > 0
    ? RAW_CLIENT_UPLOAD_LIMIT
    : import.meta.env.PROD
      ? DEFAULT_PROD_UPLOAD_LIMIT_BYTES
      : DEFAULT_DEV_UPLOAD_LIMIT_BYTES;
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

const WISH_PAGE_SIZE = 3;

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
    id: "img-4",
    type: "video",
    src: "/media/VuNuDangQuang.mp4",
    name: "Vũ Nữ Đăng Quang",
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

const formatFileSizeLimitMb = (bytes) => {
  const value = Math.round((bytes / (1024 * 1024)) * 10) / 10;
  return Number.isInteger(value) ? String(value) : String(value);
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

const parseApiPayload = async (response) => {
  const rawText = await response.text();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
};

const NOTE_FREQUENCIES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
};

const BIRTHDAY_MUSIC_BLUEPRINTS = [
  {
    id: "synth-funny-1",
    title: "Banh Kem Bung No",
    artist: "Synth Troll",
    bpm: 146,
    waveform: "square",
    notes: [
      { note: "C4", beats: 0.5 },
      { note: "E4", beats: 0.5 },
      { note: "G4", beats: 0.5 },
      { note: "C5", beats: 0.75 },
      { note: "REST", beats: 0.25 },
      { note: "B4", beats: 0.5 },
      { note: "G4", beats: 0.5 },
      { note: "E4", beats: 0.5 },
      { note: "D4", beats: 0.5 },
      { note: "E4", beats: 0.5 },
      { note: "G4", beats: 0.5 },
      { note: "C5", beats: 1 },
    ],
  },
  {
    id: "synth-funny-2",
    title: "Quang Gay Parade",
    artist: "DJ Bua",
    bpm: 132,
    waveform: "triangle",
    notes: [
      { note: "G4", beats: 0.5 },
      { note: "A4", beats: 0.5 },
      { note: "B4", beats: 0.5 },
      { note: "D5", beats: 0.75 },
      { note: "REST", beats: 0.25 },
      { note: "E5", beats: 0.75 },
      { note: "D5", beats: 0.5 },
      { note: "B4", beats: 0.5 },
      { note: "A4", beats: 0.5 },
      { note: "G4", beats: 0.5 },
      { note: "E4", beats: 0.75 },
      { note: "REST", beats: 0.25 },
      { note: "G4", beats: 0.75 },
    ],
  },
];

const buildWaveSample = (phase, waveform) => {
  if (waveform === "square") {
    return Math.sin(phase) >= 0 ? 1 : -1;
  }

  if (waveform === "triangle") {
    return (2 / Math.PI) * Math.asin(Math.sin(phase));
  }

  return Math.sin(phase);
};

const createSynthTrackUrl = (blueprint) => {
  const sampleRate = 22050;
  const beatSeconds = 60 / blueprint.bpm;
  const samples = [];

  blueprint.notes.forEach((entry) => {
    const durationSeconds = Math.max(0.08, entry.beats * beatSeconds);
    const frameCount = Math.floor(durationSeconds * sampleRate);
    const frequency =
      entry.note && entry.note !== "REST"
        ? NOTE_FREQUENCIES[entry.note] || 0
        : 0;

    for (let frame = 0; frame < frameCount; frame += 1) {
      let value = 0;

      if (frequency > 0) {
        const phase = (2 * Math.PI * frequency * frame) / sampleRate;
        const attack = Math.min(1, frame / (sampleRate * 0.015));
        const release = Math.min(1, (frameCount - frame) / (sampleRate * 0.04));
        const envelope = Math.min(attack, release);
        value = buildWaveSample(phase, blueprint.waveform) * envelope * 0.22;
      }

      samples.push(Math.max(-1, Math.min(1, value)));
    }

    const gapFrames = Math.floor(sampleRate * 0.014);
    for (let gap = 0; gap < gapFrames; gap += 1) {
      samples.push(0);
    }
  });

  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  const writeAscii = (offset, text) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);

  let pointer = 44;
  samples.forEach((sample) => {
    view.setInt16(pointer, sample * 0x7fff, true);
    pointer += bytesPerSample;
  });

  return URL.createObjectURL(new Blob([wavBuffer], { type: "audio/wav" }));
};

function App() {
  const canvasRef = useRef(null);
  const uploadInputRef = useRef(null);
  const musicAudioRef = useRef(null);
  const wishListRef = useRef(null);
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
  const [communityWishes, setCommunityWishes] = useState([]);
  const [wishDraft, setWishDraft] = useState("");
  const [wishError, setWishError] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [wishSearch, setWishSearch] = useState("");
  const [wishSort, setWishSort] = useState("latest");
  const [wishPage, setWishPage] = useState(1);
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
  const [activePreviewMediaId, setActivePreviewMediaId] = useState("");
  const [musicTrackIndex, setMusicTrackIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.62);
  const [musicNotice, setMusicNotice] = useState("");

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

  const activePreviewIndex = displayedMedia.findIndex(
    (item) => item.id === activePreviewMediaId,
  );

  const activePreviewMedia =
    activePreviewIndex >= 0 ? displayedMedia[activePreviewIndex] : null;

  const generatedMusicTracks = useMemo(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return BIRTHDAY_MUSIC_BLUEPRINTS.map((blueprint) => ({
      id: blueprint.id,
      title: blueprint.title,
      artist: blueprint.artist,
      src: createSynthTrackUrl(blueprint),
    }));
  }, []);

  useEffect(
    () => () => {
      generatedMusicTracks.forEach((track) => {
        if (track.src.startsWith("blob:")) {
          URL.revokeObjectURL(track.src);
        }
      });
    },
    [generatedMusicTracks],
  );

  const birthdayPlaylist = useMemo(
    () => [
      // {
      //   id: "birthday-funny-1",
      //   title: "Bua Birthday Bounce",
      //   artist: "Party Bot",
      //   src: "/media/birthday_funny_1.mp3",
      // },
      // {
      //   id: "birthday-funny-2",
      //   title: "Quang Parade Beat",
      //   artist: "Laugh Machine",
      //   src: "/media/birthday_funny_2.mp3",
      // },
      {
        id: "birthday-remix",
        title: "na na na anh domixi Remix",
        artist: "DJ Ban Than",
        src: "/media/tiktok_audio.mp3",
      },
      // ...generatedMusicTracks,
    ],
    [generatedMusicTracks],
  );

  const activeMusicTrack = birthdayPlaylist[musicTrackIndex] || null;

  const managedWishes = useMemo(() => {
    const normalizedQuery = wishSearch.trim().toLowerCase();

    const filtered = wishes.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      const content = String(item.content || "").toLowerCase();
      return content.includes(normalizedQuery);
    });

    filtered.sort((a, b) => {
      const timeA = Date.parse(a.createdAt || "") || 0;
      const timeB = Date.parse(b.createdAt || "") || 0;

      if (wishSort === "oldest") {
        return timeA - timeB;
      }

      if (wishSort === "longest") {
        return String(b.content || "").length - String(a.content || "").length;
      }

      if (wishSort === "shortest") {
        return String(a.content || "").length - String(b.content || "").length;
      }

      return timeB - timeA;
    });

    return filtered;
  }, [wishSearch, wishSort, wishes]);

  const wishPageCount = useMemo(
    () => Math.max(1, Math.ceil(managedWishes.length / WISH_PAGE_SIZE)),
    [managedWishes.length],
  );

  const currentWishPage = Math.min(wishPage, wishPageCount);

  const pagedWishes = useMemo(() => {
    const startIndex = (currentWishPage - 1) * WISH_PAGE_SIZE;
    return managedWishes.slice(startIndex, startIndex + WISH_PAGE_SIZE);
  }, [currentWishPage, managedWishes]);

  const wishRangeLabel = useMemo(() => {
    if (managedWishes.length === 0) {
      return "0/0";
    }

    const start = (currentWishPage - 1) * WISH_PAGE_SIZE + 1;
    const end = Math.min(
      currentWishPage * WISH_PAGE_SIZE,
      managedWishes.length,
    );
    return `${start}-${end}/${managedWishes.length}`;
  }, [currentWishPage, managedWishes.length]);

  useEffect(() => {
    if (wishListRef.current) {
      wishListRef.current.scrollTop = 0;
    }
  }, [currentWishPage, wishSearch, wishSort]);

  const creditBaseWishes = useMemo(() => {
    const recentCommunityWishes = communityWishes.slice(0, 80);

    return [
      ...DEFAULT_CREDIT_WISHES,
      ...recentCommunityWishes.map((item) => ({
        id: item.id,
        content: item.content,
        senderName: item.senderName || "guest",
      })),
    ];
  }, [communityWishes]);

  const creditLoopWishes = useMemo(() => {
    if (creditBaseWishes.length === 0) {
      return [];
    }

    const loopCount = 3;
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

  const creditAnimationDuration = useMemo(() => {
    const computed = Math.max(50, creditBaseWishes.length * 6);
    return `${Math.min(200, computed)}s`;
  }, [creditBaseWishes.length]);

  useEffect(() => {
    try {
      const cachedName = window.localStorage.getItem(VISITOR_STORAGE_KEY) || "";
      const normalizedCachedName = normalizeUsernameInput(cachedName).slice(
        0,
        80,
      );
      const hasCompletedGiftStep =
        window.localStorage.getItem(GIFT_STEP_STORAGE_KEY) === "1";

      if (normalizedCachedName) {
        setVisitorDraftName(normalizedCachedName);
        setVisitorName(normalizedCachedName);
        setHasEnteredApp(true);

        if (hasCompletedGiftStep) {
          setHasOpenedGift(true);
          setHasFinishedGiftStep(true);
        }
      }
    } catch {
      // Ignore localStorage issues in restrictive browser modes.
    }
  }, []);

  useEffect(() => {
    setWishPage(1);
  }, [wishSearch, wishSort]);

  useEffect(() => {
    if (wishPage > wishPageCount) {
      setWishPage(wishPageCount);
    }
  }, [wishPage, wishPageCount]);

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

  const fetchCommunityWishes = useCallback(async () => {
    try {
      const response = await fetch(apiUrl("/api/wishes"));
      if (!response.ok) {
        throw new Error("Khong the tai credit loi chuc");
      }

      const data = await response.json();
      setCommunityWishes(data.items || []);
    } catch {
      // Keep existing credit entries when all-user feed is temporarily unavailable.
    }
  }, []);

  const refreshWishData = useCallback(() => {
    fetchWishes();
    fetchCommunityWishes();
  }, [fetchCommunityWishes, fetchWishes]);

  useEffect(() => {
    if (!hasEnteredApp || !hasFinishedGiftStep) {
      return;
    }

    fetchWishes();
  }, [fetchWishes, hasEnteredApp, hasFinishedGiftStep]);

  useEffect(() => {
    if (!hasEnteredApp || !hasFinishedGiftStep) {
      return;
    }

    fetchCommunityWishes();
  }, [fetchCommunityWishes, hasEnteredApp, hasFinishedGiftStep]);

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
      window.localStorage.removeItem(GIFT_STEP_STORAGE_KEY);
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
      setCommunityWishes((prev) => [data.item, ...prev]);
      setWishDraft("");
      setWishMessage("Da gui loi chuc va them vao credit ben phai.");
      setWishPage(1);
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
      setCommunityWishes((prev) =>
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
      setCommunityWishes((prev) => prev.filter((item) => item.id !== wish.id));
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

    const maxUploadMb = formatFileSizeLimitMb(CLIENT_UPLOAD_LIMIT_BYTES);
    const oversizedFile = pendingUploads.find(
      (item) => item.file.size > CLIENT_UPLOAD_LIMIT_BYTES,
    );
    if (oversizedFile) {
      setUploadError(
        `File ${oversizedFile.file.name} qua gioi han ${maxUploadMb}MB. Vui long nen file nho hon truoc khi upload.`,
      );
      return;
    }

    if (import.meta.env.PROD) {
      const totalUploadSize = pendingUploads.reduce(
        (sum, item) => sum + item.file.size,
        0,
      );

      if (totalUploadSize > CLIENT_UPLOAD_LIMIT_BYTES) {
        setUploadError(
          `Tong dung luong request vuot ${maxUploadMb}MB nen Vercel co the tra 413 Content Too Large. Hay upload it file hon moi lan.`,
        );
        return;
      }
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

      const data = await parseApiPayload(response);
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(
            `413 Content Too Large: Video qua lon voi gioi han upload tren Vercel. Thu giam dung luong xuong duoi ${maxUploadMb}MB hoac dung cloud storage.`,
          );
        }

        throw new Error(data.message || "Upload that bai");
      }

      const createdMedia = normalizeServerMedia(data.items || []);
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
      if (activePreviewMedia?.id === mediaItem.id) {
        setActivePreviewMediaId("");
      }
    } catch (error) {
      setUploadError(error.message || "Khong the xoa media");
    } finally {
      setDeletingMediaIds((prev) => prev.filter((id) => id !== mediaItem.id));
    }
  };

  const openMediaPreview = useCallback(
    (mediaId) => {
      const previewItem = displayedMedia.find((item) => item.id === mediaId);
      if (previewItem) {
        setActivePreviewMediaId(previewItem.id);
      }
    },
    [displayedMedia],
  );

  const closeMediaPreview = useCallback(() => {
    setActivePreviewMediaId("");
  }, []);

  const showNextMedia = useCallback(() => {
    if (displayedMedia.length === 0) {
      setActivePreviewMediaId("");
      return;
    }

    if (activePreviewIndex === -1) {
      setActivePreviewMediaId(displayedMedia[0].id);
      return;
    }

    const nextIndex = (activePreviewIndex + 1) % displayedMedia.length;
    setActivePreviewMediaId(displayedMedia[nextIndex].id);
  }, [activePreviewIndex, displayedMedia]);

  const showPrevMedia = useCallback(() => {
    if (displayedMedia.length === 0) {
      setActivePreviewMediaId("");
      return;
    }

    if (activePreviewIndex === -1) {
      setActivePreviewMediaId(displayedMedia[0].id);
      return;
    }

    const prevIndex =
      (activePreviewIndex - 1 + displayedMedia.length) % displayedMedia.length;
    setActivePreviewMediaId(displayedMedia[prevIndex].id);
  }, [activePreviewIndex, displayedMedia]);

  useEffect(() => {
    if (!activePreviewMediaId) {
      return;
    }

    if (!activePreviewMedia) {
      setActivePreviewMediaId("");
    }
  }, [activePreviewMedia, activePreviewMediaId]);

  useEffect(() => {
    if (!activePreviewMedia) {
      return undefined;
    }

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        closeMediaPreview();
        return;
      }

      if (event.key === "ArrowRight") {
        showNextMedia();
        return;
      }

      if (event.key === "ArrowLeft") {
        showPrevMedia();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [activePreviewMedia, closeMediaPreview, showNextMedia, showPrevMedia]);

  useEffect(() => {
    if (birthdayPlaylist.length === 0) {
      return;
    }

    if (musicTrackIndex >= birthdayPlaylist.length) {
      setMusicTrackIndex(0);
    }
  }, [birthdayPlaylist.length, musicTrackIndex]);

  const playMusic = useCallback(async () => {
    const audioElement = musicAudioRef.current;
    if (!audioElement) {
      return;
    }

    try {
      await audioElement.play();
      setIsMusicPlaying(true);
      setMusicNotice("");
    } catch {
      setIsMusicPlaying(false);
      setMusicNotice("Trinh duyet dang chan autoplay. Bam 'Phat nhac' de bat.");
    }
  }, []);

  const pauseMusic = useCallback(() => {
    const audioElement = musicAudioRef.current;
    if (!audioElement) {
      return;
    }

    audioElement.pause();
    setIsMusicPlaying(false);
  }, []);

  const playNextTrack = useCallback(() => {
    if (birthdayPlaylist.length === 0) {
      return;
    }

    setMusicTrackIndex((prev) => (prev + 1) % birthdayPlaylist.length);
    setIsMusicPlaying(true);
    setMusicNotice("");
  }, [birthdayPlaylist.length]);

  const toggleMusicPlayback = useCallback(() => {
    if (isMusicPlaying) {
      pauseMusic();
      return;
    }

    void playMusic();
  }, [isMusicPlaying, pauseMusic, playMusic]);

  const selectMusicTrack = useCallback(
    (index) => {
      if (index < 0 || index >= birthdayPlaylist.length) {
        return;
      }

      setMusicTrackIndex(index);
      setIsMusicPlaying(true);
      setMusicNotice("");
    },
    [birthdayPlaylist.length],
  );

  useEffect(() => {
    const audioElement = musicAudioRef.current;
    if (!audioElement) {
      return;
    }

    audioElement.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (birthdayPlaylist.length === 0) {
      return;
    }

    setIsMusicPlaying(true);
  }, [birthdayPlaylist.length]);

  useEffect(() => {
    const audioElement = musicAudioRef.current;
    if (!audioElement || !activeMusicTrack) {
      return;
    }

    audioElement.load();
    if (isMusicPlaying) {
      void playMusic();
      return;
    }

    audioElement.pause();
  }, [activeMusicTrack, isMusicPlaying, playMusic]);

  useEffect(() => {
    const audioElement = musicAudioRef.current;
    if (!audioElement) {
      return undefined;
    }

    const handleEnded = () => {
      if (birthdayPlaylist.length === 0) {
        return;
      }

      setMusicTrackIndex((prev) => (prev + 1) % birthdayPlaylist.length);
      setIsMusicPlaying(true);
    };

    const handlePlay = () => {
      setIsMusicPlaying(true);
      setMusicNotice("");
    };

    const handlePause = () => {
      setIsMusicPlaying(false);
    };

    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    return () => {
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, [birthdayPlaylist.length]);

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
    setHasOpenedGift(true);
    setHasFinishedGiftStep(true);

    try {
      window.localStorage.setItem(GIFT_STEP_STORAGE_KEY, "1");
    } catch {
      // Ignore localStorage issues in restrictive browser modes.
    }
  };

  const musicWidget = activeMusicTrack ? (
    <aside className="music-dock" aria-label="Danh sach nhac sinh nhat">
      <audio ref={musicAudioRef} src={activeMusicTrack.src} preload="auto" />

      <div className="music-dock-head">
        <strong>Birthday Boombox</strong>
        <span>{isMusicPlaying ? "Dang phat" : "Tam dung"}</span>
      </div>

      <p className="music-current-track">
        <span>{activeMusicTrack.title}</span>
        <small>{activeMusicTrack.artist}</small>
      </p>

      <div className="music-controls">
        <button type="button" className="btn" onClick={toggleMusicPlayback}>
          {isMusicPlaying ? "Tam dung" : "Phat nhac"}
        </button>
        <button type="button" className="btn" onClick={playNextTrack}>
          Bai tiep
        </button>
      </div>

      <label className="music-volume" htmlFor="music-volume-input">
        <span>Am luong</span>
        <input
          id="music-volume-input"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={musicVolume}
          onChange={(event) => setMusicVolume(Number(event.target.value))}
        />
      </label>

      <ul className="music-playlist">
        {birthdayPlaylist.map((track, index) => (
          <li key={track.id}>
            <button
              type="button"
              className={`music-track-btn ${index === musicTrackIndex ? "active" : ""}`}
              onClick={() => selectMusicTrack(index)}
            >
              <span>
                {index + 1}. {track.title}
              </span>
              <small>{track.artist}</small>
            </button>
          </li>
        ))}
      </ul>

      <p className={`music-note ${musicNotice ? "error" : ""}`}>
        {musicNotice || "Playlist se tu dong qua bai tiep theo khi het nhac."}
      </p>
    </aside>
  ) : null;

  if (!hasEnteredApp) {
    return (
      <>
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
        {musicWidget}
      </>
    );
  }

  if (!hasFinishedGiftStep) {
    return (
      <>
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
        {musicWidget}
      </>
    );
  }

  return (
    <>
      <div className="app-shell">
        <canvas
          ref={canvasRef}
          className="firework-canvas"
          aria-hidden="true"
        />

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
          <h1>Chuc mung sinh nhat Quang gay go</h1>
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
              Happy birthday Quang. Chuc ban luc nao cung duoc song dung vibe
              cua minh, thay doi the gioi bang su tu tin, vui nhon va mot chut
              bua de ai cung nho.
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
                <button
                  type="button"
                  className="btn"
                  onClick={triggerEmojiRain}
                >
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

              <div className="wish-system-grid">
                <div className="wish-module wish-compose-module">
                  <div className="wish-module-head">
                    <h3>Composer</h3>
                    <span>Tao loi chuc</span>
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
                        onClick={refreshWishData}
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
                </div>

                <div className="wish-module wish-manager-module">
                  <div className="wish-module-head">
                    <h3>Manager</h3>
                    <span>Search - Sort - Page</span>
                  </div>

                  <div className="wish-manager-toolbar">
                    <input
                      type="search"
                      className="wish-search-input"
                      placeholder="Tim noi dung loi chuc..."
                      value={wishSearch}
                      onChange={(event) => setWishSearch(event.target.value)}
                    />

                    <select
                      className="wish-sort-select"
                      value={wishSort}
                      onChange={(event) => setWishSort(event.target.value)}
                    >
                      <option value="latest">Moi nhat</option>
                      <option value="oldest">Cu nhat</option>
                      <option value="longest">Dai nhat</option>
                      <option value="shortest">Ngan nhat</option>
                    </select>
                  </div>

                  <div className="wish-list-shell">
                    <div className="wish-list-head">
                      <strong>Loi chuc cua ban</strong>
                      <span>{wishRangeLabel}</span>
                    </div>

                    <div className="wish-list" ref={wishListRef}>
                      {managedWishes.length === 0 && !isLoadingWishes ? (
                        <p className="wish-empty">
                          {wishSearch.trim()
                            ? "Khong tim thay loi chuc phu hop voi tu khoa nay."
                            : "Ban chua gui loi chuc nao."}
                        </p>
                      ) : null}

                      {pagedWishes.map((item) => {
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
                                <p
                                  className="wish-content-text"
                                  title={item.content}
                                >
                                  {item.content}
                                </p>
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

                    <div className="wish-pagination">
                      <button
                        type="button"
                        className="btn wish-page-btn"
                        onClick={() =>
                          setWishPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentWishPage === 1}
                      >
                        Truoc
                      </button>
                      <p>
                        Trang {currentWishPage}/{wishPageCount} •{" "}
                        {wishes.length} tong
                      </p>
                      <button
                        type="button"
                        className="btn wish-page-btn"
                        onClick={() =>
                          setWishPage((prev) =>
                            Math.min(wishPageCount, prev + 1),
                          )
                        }
                        disabled={currentWishPage === wishPageCount}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <aside className="wish-credits" style={{ marginTop: 70 }}>
              <p className="wish-credits-title">Credit loi chuc cong dong</p>
              <p className="wish-credits-meta">
                {communityWishes.length} loi chuc tu moi nguoi
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
            <div className="media-intro">
              <h2>Album cua Quang</h2>
              <p className="media-guide">
                Bao Nhiêu Hoa Anh Chỉ Chọn Một Cành Bao Nhiêu Người Anh Chỉ Chọn
                Mỗi Em
              </p>

              <a
                href="https://www.facebook.com/photo?fbid=1062066317902870&set=a.115345732574938"
                target="_blank"
                rel="noopener noreferrer"
                className="media-intro-link"
              >
                nữ hoàng băng giá đụng đâu cứng đó
              </a>
            </div>
          </div>

          <div className="media-upload-zone">
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
            </div>

            <p
              className={`upload-selection ${pendingUploads.length === 0 ? "muted" : ""}`}
            >
              {pendingUploads.length > 0
                ? `Buoc 2: Dat ten cho ${pendingUploads.length} file ben duoi.`
                : "Chua co file nao duoc chon."}
            </p>
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

              {pendingUploads.map((item, index) => (
                <div key={item.id} className="draft-item">
                  <div className="draft-origin">
                    <span className="draft-index">{index + 1}</span>
                    <span title={item.file.name}>{item.file.name}</span>
                  </div>
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
            <div className="media-grid-shell">
              <div className={`media-grid ${isCompactMedia ? "compact" : ""}`}>
                {displayedMedia.map((item) => {
                  const isDeleting = deletingMediaIds.includes(item.id);
                  const isOwnUpload =
                    Boolean(item.uploadedBy) && item.uploadedBy === visitorName;

                  return (
                    <figure
                      key={item.id}
                      className={`media-card previewable ${isOwnUpload ? "deletable" : ""}`}
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

                      <button
                        type="button"
                        className="preview-trigger"
                        onClick={() => openMediaPreview(item.id)}
                        aria-label={`Xem ${item.type === "video" ? "video" : "anh"} ${item.name}`}
                      >
                        {item.type === "video" ? (
                          <>
                            <video
                              src={item.src}
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <span className="media-video-badge">Xem video</span>
                          </>
                        ) : (
                          <img src={item.src} alt={item.name} loading="lazy" />
                        )}
                      </button>

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
            </div>
          )}
        </section>

        {activePreviewMedia ? (
          <div
            className="media-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Dang xem ${activePreviewMedia.type === "video" ? "video" : "anh"} ${activePreviewMedia.name}`}
            onClick={closeMediaPreview}
          >
            <button
              type="button"
              className="lightbox-close"
              onClick={closeMediaPreview}
              aria-label="Dong xem media"
            >
              Dong
            </button>

            {displayedMedia.length > 1 ? (
              <>
                <button
                  type="button"
                  className="lightbox-nav prev"
                  onClick={(event) => {
                    event.stopPropagation();
                    showPrevMedia();
                  }}
                  aria-label="Media truoc"
                >
                  {"<"}
                </button>
                <button
                  type="button"
                  className="lightbox-nav next"
                  onClick={(event) => {
                    event.stopPropagation();
                    showNextMedia();
                  }}
                  aria-label="Media tiep theo"
                >
                  {">"}
                </button>
              </>
            ) : null}

            <figure
              className="lightbox-figure"
              onClick={(event) => event.stopPropagation()}
            >
              {activePreviewMedia.type === "video" ? (
                <video
                  src={activePreviewMedia.src}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={activePreviewMedia.src}
                  alt={activePreviewMedia.name}
                />
              )}
              <figcaption>
                <span>{activePreviewMedia.name}</span>
                <span>
                  {activePreviewIndex + 1}/{displayedMedia.length}
                </span>
              </figcaption>
            </figure>
          </div>
        ) : null}
      </div>
      {musicWidget}
    </>
  );
}

export default App;
