// app.js (UPDATED) — compresses data so the WhatsApp link is shorter and cleaner

const BUSINESS_NAME = "Pinnacle Landscaping & Groundworks";

function ukToIntl(n) {
  n = (n || "").replace(/\s+/g, "").replace(/-/g, "");
  if (!n) return "";
  if (n.startsWith("0")) return "44" + n.slice(1);
  if (n.startsWith("+")) return n.slice(1);
  return n;
}

function getBaseUrl() {
  const url = new URL(window.location.href);
  const parts = url.pathname.split("/").filter(Boolean);
  // base becomes https://username.github.io/repo/
  url.pathname = parts.length >= 1 ? `/${parts[0]}/` : "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function buildSignLink(payload) {
  // payload is JSON; compress it into one parameter "d"
  const base = getBaseUrl();
  const signUrl = new URL(base + "sign.html");
  const json = JSON.stringify(payload);
  const compressed = LZString.compressToEncodedURIComponent(json);
  signUrl.searchParams.set("d", compressed);
  return signUrl.toString();
}

function buildWhatsAppMessage(clientName, signLink) {
  const nameLine = clientName ? `Hi ${clientName},` : "Hi,";
  return [
    nameLine,
    "",
    "Please review and sign the statement using the link below.",
    "",
    "Tap here to sign:",
    signLink,
    "",
    "After signing:",
    "1) Press SUBMIT",
    "2) Save the signed image to your phone",
    "3) Return to WhatsApp and ATTACH the saved image before sending",
    "",
    "Thank you,",
    BUSINESS_NAME
  ].join("\n");
}

document.getElementById("sendBtn").addEventListener("click", () => {
  const statement = (document.getElementById("statement").value || "").trim();
  const clientName = (document.getElementById("clientName").value || "").trim();
  const clientPhone = (document.getElementById("clientPhone").value || "").trim();
  const clientAddress = (document.getElementById("clientAddress").value || "").trim();

  if (!statement || !clientName || !clientPhone || !clientAddress) {
    alert("Please fill in all fields.");
    return;
  }

  const intl = ukToIntl(clientPhone);
  if (!intl) {
    alert("Client phone number looks invalid. Please check it.");
    return;
  }

  const payload = {
    s: statement,
    n: clientName,
    p: clientPhone,
    a: clientAddress,
    t: Date.now()
  };

  const signLink = buildSignLink(payload);
  const msg = buildWhatsAppMessage(clientName, signLink);

  const waUrl = `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank", "noopener");
});
