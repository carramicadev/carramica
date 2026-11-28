const axios = require("axios");

// Qiscus Omnichannel - WhatsApp template messages.
// Docs: https://documentation.qiscus.com/omnichannel-chat/whatsapp-business-api
//
// Config:
//   functions/.env       -> QISCUS_APP_ID, QISCUS_CHANNEL_ID, QISCUS_NAMESPACE
//   Secret Manager       -> QISCUS_SECRET_KEY
//                           (firebase functions:secrets:set QISCUS_SECRET_KEY)
// A function that sends WhatsApp must list QISCUS_SECRETS in runWith({ secrets }),
// otherwise process.env.QISCUS_SECRET_KEY is empty at runtime.

const QISCUS_BASE_URL = "https://omnichannel.qiscus.com/whatsapp/v1";
const QISCUS_SECRETS = ["QISCUS_SECRET_KEY"];
const LANGUAGE_CODE = "id";
const REQUEST_TIMEOUT_MS = 15000;

// Template names exactly as approved in Qiscus (Outbound > WhatsApp Message Templates)
const TEMPLATES = {
  linkPembayaran: "carramica_link_pembayaran", // {{1}} nama, {{2}} total, {{3}} link
  pembayaranDiterima: "carramica_pembayaran_diterima", // {{1}} nama, {{2}} jumlah (template sudah ada "Rp.")
  resiPengirim: "carramica_resi_pengirim", // {{1}} nama, {{2}} penerima, {{3}} resi, {{4}} kurir
  resiPenerima: "carramica_resi_penerima", // {{1}} nama, {{2}} pengirim, {{3}} no pesanan, {{4}} resi, {{5}} kurir
  reminderH1: "carramica_reminder_h1", // {{1}} link
  reminderH5: "carramica_reminder_h5", // {{1}} link
};

const toNumber = (value) => {
  if (typeof value === "number") return value;
  const text = String(value ?? "").trim();
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
};

// 9535000 -> "9.535.000". A value that isn't a plain number is sent unchanged.
const formatThousands = (value) => {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Math.round(number)
  );
};

// 9535000 -> "Rp9.535.000"
const formatRupiah = (value) => {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  return `Rp${formatThousands(number)}`;
};

// "+62 812-3456", "0812 3456" -> "628123456"
const toWhatsAppNumber = (phone) => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

// WhatsApp rejects template parameters that are empty or contain new lines,
// tabs or more than 4 consecutive spaces.
const toParameterText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {4,}/g, "   ")
    .trim();

const getConfig = () => {
  const config = {
    appId: process.env.QISCUS_APP_ID,
    channelId: process.env.QISCUS_CHANNEL_ID,
    namespace: process.env.QISCUS_NAMESPACE,
    secretKey: process.env.QISCUS_SECRET_KEY,
  };
  const missing = [
    ["QISCUS_APP_ID", config.appId],
    ["QISCUS_CHANNEL_ID", config.channelId],
    ["QISCUS_NAMESPACE", config.namespace],
    ["QISCUS_SECRET_KEY", config.secretKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(`Konfigurasi Qiscus belum lengkap: ${missing.join(", ")}`);
  }
  return config;
};

// Short, log-safe description of a failed request (never includes headers).
const describeError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const detail = data ? JSON.stringify(data).slice(0, 500) : error?.message;
  return status ? `Qiscus HTTP ${status}: ${detail}` : `Qiscus: ${detail}`;
};

/**
 * Send one approved WhatsApp template through Qiscus.
 * @param {object} args
 * @param {string} args.to       recipient phone (any common Indonesian format)
 * @param {string} args.template template name (see TEMPLATES)
 * @param {Array}  args.params   values for {{1}}, {{2}}, ... in order
 * @return {Promise<object>} Qiscus response body
 */
const sendQiscusTemplate = async ({ to, template, params = [] }) => {
  const { appId, channelId, namespace, secretKey } = getConfig();

  const toNumberWA = toWhatsAppNumber(to);
  if (!toNumberWA) throw new Error("Nomor WhatsApp tujuan kosong");

  const parameters = params.map(toParameterText);
  const emptyIndex = parameters.findIndex((text) => !text);
  if (emptyIndex !== -1) {
    throw new Error(
      `Parameter {{${emptyIndex + 1}}} template ${template} kosong`
    );
  }

  const body = {
    to: toNumberWA,
    type: "template",
    template: {
      namespace,
      name: template,
      language: { policy: "deterministic", code: LANGUAGE_CODE },
      components: [
        {
          type: "body",
          parameters: parameters.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };

  let response;
  try {
    response = await axios.post(
      `${QISCUS_BASE_URL}/${appId}/${channelId}/messages`,
      body,
      {
        headers: {
          "Qiscus-App-Id": appId,
          "Qiscus-Secret-Key": secretKey,
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );
  } catch (error) {
    const wrapped = new Error(describeError(error));
    wrapped.status = error?.response?.status;
    wrapped.response = { status: error?.response?.status, data: error?.response?.data };
    throw wrapped;
  }

  if (response?.data?.errors) {
    throw new Error(
      `Qiscus menolak pesan: ${JSON.stringify(response.data.errors).slice(0, 500)}`
    );
  }
  return response.data;
};

module.exports = {
  QISCUS_SECRETS,
  TEMPLATES,
  sendQiscusTemplate,
  formatRupiah,
  formatThousands,
  toWhatsAppNumber,
};
