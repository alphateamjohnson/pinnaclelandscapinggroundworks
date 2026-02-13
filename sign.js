// sign.js (UPDATED) — fixes decoding + mobile signing + creates a clean PNG

const BUSINESS_WHATSAPP_INTL = "447809253688";

function getCompressedPayload() {
  const d = new URLSearchParams(window.location.search).get("d");
  if (!d) return null;

  try {
    const json = LZString.decompressFromEncodedURIComponent(d);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function fitCanvasToDisplay(canvas) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

function setupSignature(canvas) {
  const ctx = fitCanvasToDisplay(canvas);
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111";

  let drawing = false;
  let hasInk = false;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasInk = true;
  });

  canvas.addEventListener("pointerup", (e) => {
    e.preventDefault();
    drawing = false;
  });

  canvas.addEventListener("pointercancel", () => {
    drawing = false;
  });

  return {
    clear() {
      const rect = canvas.getBoundingClientRect();
      const c = canvas.getContext("2d");
      c.clearRect(0, 0, rect.width, rect.height);
      hasInk = false;
    },
    hasInk() {
      return hasInk;
    },
    toDataUrl() {
      return canvas.toDataURL("image/png");
    },
    refreshSize() {
      fitCanvasToDisplay(canvas);
    }
  };
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = (text || "").split(/\s+/);
  let line = "";
  const lines = [];

  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
  return lines.length;
}

function formatDateTime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function buildSignedImage({ name, address, phone, statement, signatureDataUrl }) {
  // Crisp A4-ish PNG
  const W = 1240, H = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // White background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  // Header bar
  ctx.fillStyle = "#003b2f";
  ctx.fillRect(0, 0, W, 220);

  // Logo
  const logo = await loadImage("assets/logo.png");
  const pad = 40;
  const maxLogoW = W - pad * 2;
  const maxLogoH = 220 - pad * 2;
  const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height);
  const lw = logo.width * scale;
  const lh = logo.height * scale;
  ctx.drawImage(logo, (W - lw) / 2, (220 - lh) / 2, lw, lh);

  let y = 300;
  const margin = 70;

  ctx.fillStyle = "#0b0f0d";
  ctx.font = "700 34px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("SIGNED STATEMENT", margin, y);
  y += 42;

  ctx.font = "400 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "#2b3a34";
  ctx.fillText(`Date/time: ${formatDateTime(new Date())}`, margin, y);
  y += 55;

  ctx.fillStyle = "#0b0f0d";
  ctx.font = "700 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Client:", margin, y);
  ctx.font = "400 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(name || "—", margin + 90, y);
  y += 34;

  ctx.font = "700 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Address:", margin, y);
  ctx.font = "400 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const addrLines = wrapText(ctx, address || "—", margin + 110, y, W - margin * 2 - 110, 30);
  y += Math.max(34, addrLines * 30) + 10;

  ctx.font = "700 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Phone:", margin, y);
  ctx.font = "400 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(phone || "—", margin + 90, y);
  y += 50;

  ctx.strokeStyle = "#d8e2dd";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(W - margin, y);
  ctx.stroke();
  y += 45;

  ctx.fillStyle = "#0b0f0d";
  ctx.font = "700 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Statement:", margin, y);
  y += 40;

  ctx.font = "400 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = "#111";
  const used = wrapText(ctx, statement || "", margin, y, W - margin * 2, 34);
  y += used * 34 + 55;

  ctx.fillStyle = "#0b0f0d";
  ctx.font = "700 24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Client signature:", margin, y);
  y += 18;

  // signature box
  const sigBoxH = 220;
  const sigBoxW = W - margin * 2;
  ctx.strokeStyle = "#9fb5ad";
  ctx.lineWidth = 4;
  ctx.strokeRect(margin, y, sigBoxW, sigBoxH);

  const sigImg = await loadImage(signatureDataUrl);
  const sigPad = 20;
  const maxW = sigBoxW - sigPad * 2;
  const maxH = sigBoxH - sigPad * 2;
  const sigScale = Math.min(maxW / sigImg.width, maxH / sigImg.height);
  const sw = sigImg.width * sigScale;
  const sh = sigImg.height * sigScale;
  ctx.drawImage(sigImg, margin + sigPad, y + (sigBoxH - sh) / 2, sw, sh);

  return canvas.toDataURL("image/png");
}

// ---------- Page init ----------
const payload = getCompressedPayload() || {};

const vName = document.getElementById("vName");
const vPhone = document.getElementById("vPhone");
const vAddress = document.getElementById("vAddress");
const vStatement = document.getElementById("vStatement");

vName.value = payload.n || "";
vPhone.value = payload.p || "";
vAddress.value = payload.a || "";
vStatement.value = payload.s || "";

const sigCanvas = document.getElementById("sig");
const sig = setupSignature(sigCanvas);

// Keep canvas fitted if phone rotates
window.addEventListener("resize", () => sig.refreshSize());

document.getElementById("clearBtn").addEventListener("click", () => sig.clear());

document.getElementById("submitBtn").addEventListener("click", async () => {
  const name = (vName.value || "").trim();
  const phone = (vPhone.value || "").trim();
  const address = (vAddress.value || "").trim();
  const statement = (vStatement.value || "").trim();

  if (!name || !address || !statement) {
    alert("Please make sure Client, Address and Statement are filled in.");
    return;
  }
  if (!sig.hasInk()) {
    alert("Please add your signature before submitting.");
    return;
  }

  const png = await buildSignedImage({
    name,
    address,
    phone,
    statement,
    signatureDataUrl: sig.toDataUrl()
  });

  const dl = document.getElementById("downloadLink");
  dl.href = png;

  document.getElementById("afterBox").classList.remove("hidden");
  document.getElementById("afterBox").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("openWaBtn").addEventListener("click", () => {
  const name = (vName.value || "").trim();
  const msg = [
    name ? `Hi, it's ${name}.` : "Hi,",
    "I've signed the statement.",
    "",
    "IMPORTANT: I am attaching the signed image in this message."
  ].join("\n");

  const waUrl = `https://wa.me/${BUSINESS_WHATSAPP_INTL}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank", "noopener");
});
