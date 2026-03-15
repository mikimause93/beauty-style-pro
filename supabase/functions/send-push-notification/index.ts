import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Convert a base64url string to Uint8Array
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Convert a Uint8Array to base64url string
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { user_id, title, message, type, data, notification_id } = body;

    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: "user_id and title are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all push subscriptions for this user
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: subError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No push subscriptions found for user" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build notification payload
    const payload = JSON.stringify({
      title,
      body: message,
      message,
      type: type || "info",
      tag: `style-${type || "info"}-${notification_id || Date.now()}`,
      url: getNotificationUrl(type),
      ...data,
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendWebPush(sub, payload))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Remove expired/invalid subscriptions (410 Gone / 404 Not Found)
    const expiredEndpoints: string[] = [];
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const reason = (result as PromiseRejectedResult).reason as { status?: number };
        if (reason?.status === 410 || reason?.status === 404) {
          expiredEndpoints.push(subscriptions[index].endpoint);
        }
      }
    });

    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ sent, failed, total: subscriptions.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Push notification error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getNotificationUrl(type?: string): string {
  const urls: Record<string, string> = {
    like: "/",
    comment: "/",
    booking: "/my-bookings",
    tip: "/wallet",
    follow: "/profile",
    challenge: "/challenges",
    message: "/chat",
    system: "/notifications",
    info: "/notifications",
  };
  return urls[type ?? "info"] ?? "/notifications";
}

// Build a VAPID JWT for the given audience
async function buildVapidJwt(
  audience: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const headerObj = { typ: "JWT", alg: "ES256" };
  const claimsObj = { aud: audience, exp: now + 12 * 3600, sub: vapidSubject };

  const header = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(headerObj)));
  const claims = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(claimsObj)));

  const rawPrivKey = base64UrlToUint8Array(vapidPrivateKey);

  // Import private key as PKCS8 (standard for ES256)
  const pkcs8Key = buildEcPrivateKeyPkcs8(rawPrivKey);
  const signingKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Key,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const toSign = new TextEncoder().encode(`${header}.${claims}`);
  const sigBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    toSign
  );
  const sig = uint8ArrayToBase64Url(new Uint8Array(sigBytes));

  return `${header}.${claims}.${sig}`;
}

// Wrap a raw 32-byte EC private key in minimal PKCS8 DER encoding for P-256
function buildEcPrivateKeyPkcs8(rawKey: Uint8Array): ArrayBuffer {
  // Minimal PKCS8 structure for EC P-256 private key
  // OID for ecPublicKey: 1.2.840.10045.2.1
  // OID for P-256: 1.2.840.10045.3.1.7
  const oidEcPublicKey = new Uint8Array([0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01]);
  const oidP256 = new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]);

  // AlgorithmIdentifier SEQUENCE
  const algorithmId = buildDerSequence(new Uint8Array([...oidEcPublicKey, ...oidP256]));

  // ECPrivateKey SEQUENCE (version=1, privateKey, no publicKey)
  const version = new Uint8Array([0x02, 0x01, 0x01]); // INTEGER 1
  const keyOctet = new Uint8Array([0x04, rawKey.length, ...rawKey]); // OCTET STRING
  const ecPrivKey = buildDerSequence(new Uint8Array([...version, ...keyOctet]));
  const ecPrivKeyOctet = new Uint8Array([0x04, ecPrivKey.length, ...ecPrivKey]);

  // PrivateKeyInfo SEQUENCE
  const versionZero = new Uint8Array([0x02, 0x01, 0x00]); // INTEGER 0
  const pkcs8 = buildDerSequence(new Uint8Array([...versionZero, ...algorithmId, ...ecPrivKeyOctet]));

  return pkcs8.buffer;
}

function buildDerSequence(content: Uint8Array): Uint8Array {
  if (content.length < 0x80) {
    return new Uint8Array([0x30, content.length, ...content]);
  } else if (content.length < 0x100) {
    return new Uint8Array([0x30, 0x81, content.length, ...content]);
  } else {
    return new Uint8Array([0x30, 0x82, content.length >> 8, content.length & 0xff, ...content]);
  }
}

// Send a Web Push notification to a single subscription using VAPID
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<void> {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@style.app";

  if (!vapidPublicKey || !vapidPrivateKey) {
    // VAPID keys not configured — skip Web Push gracefully
    console.warn("VAPID keys not configured – skipping Web Push delivery");
    return;
  }

  const origin = new URL(subscription.endpoint).origin;

  const jwt = await buildVapidJwt(origin, vapidPublicKey, vapidPrivateKey, vapidSubject);
  const authHeader = `vapid t=${jwt},k=${vapidPublicKey}`;

  // Encrypt payload using recipient's p256dh and auth keys (RFC 8291 / aesgcm)
  const encryptedBody = await encryptPayload(
    payload,
    subscription.p256dh,
    subscription.auth
  );

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
    },
    body: encryptedBody,
  });

  if (response.status === 201 || response.status === 200) return;

  const err = new Error(`Web Push failed: ${response.status}`) as Error & { status: number };
  err.status = response.status;
  throw err;
}

// Encrypt push payload using RFC 8291 (Content Encoding: aes128gcm)
async function encryptPayload(
  plaintext: string,
  recipientPublicKeyBase64url: string,
  authSecretBase64url: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Decode recipient public key and auth secret
  const recipientPublicKey = base64UrlToUint8Array(recipientPublicKeyBase64url);
  const authSecret = base64UrlToUint8Array(authSecretBase64url);

  // Generate sender (ephemeral) EC key pair
  const senderKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Export sender public key (uncompressed, 65 bytes)
  const senderPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderKeyPair.publicKey)
  );

  // Import recipient public key
  const recipientKey = await crypto.subtle.importKey(
    "raw",
    recipientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: recipientKey },
    senderKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Generate salt (16 random bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive encryption key and nonce
  const { contentEncryptionKey, nonce } = await deriveKeys(
    sharedSecret,
    authSecret,
    senderPublicKeyRaw,
    recipientPublicKey,
    salt
  );

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Add padding (1 byte zero padding delimiter)
  const paddedPlaintext = new Uint8Array(plaintextBytes.length + 1);
  paddedPlaintext.set(plaintextBytes);
  // padding delimiter byte = 0x02 for aes128gcm
  paddedPlaintext[plaintextBytes.length] = 0x02;

  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, tagLength: 128 },
    aesKey,
    paddedPlaintext
  );
  const ciphertext = new Uint8Array(ciphertextBuf);

  // Build aes128gcm record:
  // salt (16) + rs (4, big-endian uint32) + idlen (1) + keyid (senderPublicKey, 65) + ciphertext
  const rs = ciphertext.length + 1; // one record
  const result = new Uint8Array(16 + 4 + 1 + senderPublicKeyRaw.length + ciphertext.length);
  let offset = 0;
  result.set(salt, offset); offset += 16;
  new DataView(result.buffer).setUint32(offset, rs, false); offset += 4;
  result[offset] = senderPublicKeyRaw.length; offset += 1;
  result.set(senderPublicKeyRaw, offset); offset += senderPublicKeyRaw.length;
  result.set(ciphertext, offset);

  return result;
}

async function deriveKeys(
  sharedSecret: Uint8Array,
  authSecret: Uint8Array,
  senderPublicKey: Uint8Array,
  recipientPublicKey: Uint8Array,
  salt: Uint8Array
): Promise<{ contentEncryptionKey: Uint8Array; nonce: Uint8Array }> {
  const encoder = new TextEncoder();

  // PRK_key = HKDF-Extract(auth_secret, ecdh_secret)
  const prkKeyMaterial = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveBits"]);
  const prkKey = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: authSecret,
      info: buildInfo("Content-Encoding: auth\0", new Uint8Array(0), new Uint8Array(0)),
    },
    prkKeyMaterial,
    256
  );

  // key_info = "Content-Encoding: aes128gcm\0" + 0x01
  const keyInfo = buildInfo("Content-Encoding: aes128gcm\0", recipientPublicKey, senderPublicKey);
  const nonceInfo = buildInfo("Content-Encoding: nonce\0", recipientPublicKey, senderPublicKey);

  const ikm = await crypto.subtle.importKey("raw", prkKey, "HKDF", false, ["deriveBits"]);

  const [cekBits, nonceBits] = await Promise.all([
    crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: keyInfo }, ikm, 128),
    crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, ikm, 96),
  ]);

  return {
    contentEncryptionKey: new Uint8Array(cekBits),
    nonce: new Uint8Array(nonceBits),
  };
}

function buildInfo(type: string, recipientPublicKey: Uint8Array, senderPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  // keyid_length (2) + recipientPublicKey + keyid_length (2) + senderPublicKey
  const result = new Uint8Array(
    typeBytes.length + 2 + recipientPublicKey.length + 2 + senderPublicKey.length + 1
  );
  let offset = 0;
  result.set(typeBytes, offset); offset += typeBytes.length;
  if (recipientPublicKey.length > 0) {
    new DataView(result.buffer).setUint16(offset, recipientPublicKey.length, false); offset += 2;
    result.set(recipientPublicKey, offset); offset += recipientPublicKey.length;
    new DataView(result.buffer).setUint16(offset, senderPublicKey.length, false); offset += 2;
    result.set(senderPublicKey, offset); offset += senderPublicKey.length;
  }
  result[offset] = 0x01; // version
  return result.slice(0, offset + 1);
}
