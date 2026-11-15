// 公共服务层：本地存储、访问服务端、浮窗↔引擎总线、OBR SDK 加载与身份识别。

// ---------- 存储（沙箱里 localStorage 会抛错，包一层） ----------
const mem = new Map();

export function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch {}
  return mem.has(key) ? mem.get(key) : fallback;
}

export function lsSet(key, value) {
  mem.set(key, String(value));
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

export function lsDel(key) {
  mem.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ---------- 服务端 ----------
// 优先级：config.js 里写死的 > 链接参数 ?api= > 本地记住的 > 同源
const PARAM_API = new URLSearchParams(location.search).get("api");
const CONFIG_API = typeof window !== "undefined" && window.BARD_API ? String(window.BARD_API) : "";

/** OBR 解析相对路径时会拼出 "host./" 这种带结尾点的地址，这里规范化掉。 */
function normalizeOrigin(raw) {
  try {
    const u = new URL(raw);
    if (u.hostname.endsWith(".")) u.hostname = u.hostname.slice(0, -1);
    return u.origin;
  } catch {
    return String(raw);
  }
}

export function apiBase() {
  const raw = CONFIG_API || PARAM_API || lsGet("bard:api") || location.origin;
  return normalizeOrigin(raw).replace(/\/+$/, "");
}

// 每次加载生成一个客户端标识，上报时带上，方便区分是 GM 还是某个玩家
const CLIENT_TAG = (() => {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(16).slice(2, 10);
  }
})();

export const tokenKey = (roomId) => `bard:token:${roomId}`;

async function parse(res) {
  const raw = await res.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = { error: raw.slice(0, 200) };
  }
  if (!res.ok) {
    const err = new Error(body?.error || `请求失败 (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function apiGet(path, token) {
  return parse(
    await fetch(apiBase() + path, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" })
  );
}

export async function apiPost(path, body, token) {
  return parse(
    await fetch(apiBase() + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body || {}),
    })
  );
}

/** 上传音频：切成 4MB 的片子传，断一片只重传一片，别整首从头再来。 */
const UPLOAD_CHUNK = 4 * 1024 * 1024;
/** 单个请求的超时上限（规格 F2：30 秒）。 */
const REQ_TIMEOUT = 30000;
/** 连续这么久没有字节推进就判「连接停滞」，中止当前请求交给重试（规格 F2）。 */
const STALL_MS = 30000;
/** 每个步骤最多重试 4 次，含首次共 5 次尝试，分片与收尾同一口径（规格 F3）。 */
const RETRY_MAX = 4;
/** 进度上限：收尾请求返回之前不出现 100%（规格 F1）。 */
const PCT_CAP = 0.99;
/** 失败原因要写清卡在哪个阶段，所以每个阶段有个中文名。 */
const PHASE_TEXT = { prepare: "准备中", sending: "传输中", committing: "收尾中" };

const sizeMB = (n) => String(Math.round(((Number(n) || 0) / 1024 / 1024) * 10) / 10);

function uploadId() {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 上传一首音频：发送前校验 → 分片 → 收尾，每一步都通过 onState 报给界面。
 *
 * 用一台状态机而不是一串裸 XHR：四种结局（成功 / 网络错误 / 超时 / 被中止）里任何一种
 * 都必须让 Promise 落地。少一个出口，`doUpload` 的循环就停在这一首，界面永远停在最后一个百分比。
 *
 * @param {object} p
 * @param {string} p.roomId
 * @param {string} p.token
 * @param {File} p.file
 * @param {number} [p.duration]
 * @param {string} [p.folder]
 * @param {{ maxUpload:number, formats:string[] }} [p.limits] `/api/health` 带回来的上限与格式；取不到时不传
 * @param {(s:{phase:string,pct:number,retry:number,received:number,total:number})=>void} [p.onState]
 * @param {{ createXhr?:Function, now?:Function, setTimer?:Function, clearTimer?:Function }} [deps]
 *   测试缝：默认全部回落生产实现，不传时行为与线上完全一致
 */
export function uploadTrack(p, deps = {}) {
  const { roomId, token = "", file, duration = 0, folder = "", limits = null, onState } = p || {};
  const createXhr = deps.createXhr || (() => new XMLHttpRequest());
  const now = deps.now || (() => Date.now());
  const setTimer = deps.setTimer || ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer || ((t) => clearTimeout(t));

  const base = `${apiBase()}/api/rooms/${encodeURIComponent(roomId)}`;
  const qs = new URLSearchParams({
    id: uploadId(),
    name: file.name || "音频",
    duration: String(Math.round(Number(duration) || 0)),
    folder: folder || "",
  });
  const total = file.size || 0;
  const wait = (ms) => new Promise((r) => setTimer(r, ms));

  // 当前这一步重试了几次；分片与收尾各自从 0 起算
  let retry = 0;

  const emit = (state) => {
    try {
      onState?.(state);
    } catch {}
  };
  /** 已收字节换算成进度：传输与收尾共用 0.99 的上限，100% 只留给 done。 */
  const pctOf = (received) =>
    Math.min(PCT_CAP, (Math.max(0, Math.min(total, Number(received) || 0)) / (total || 1)) * PCT_CAP);
  const failWith = (err, phase, received) => Object.assign(err, { phase, pct: pctOf(received), retry });

  // 发一个请求。四个出口全挂上：成功 / 网络错误 / 超时 / 被中止。
  // 少了 onabort 这一个，浏览器中止请求时 Promise 永不落地 —— 那正是「停在 100% 不动」的样子。
  const post = (url, body) =>
    new Promise((resolve, reject) => {
      const xhr = createXhr();
      let settled = false;
      let stalled = false;
      let watch = null;
      let lastByte = now();

      const stopWatch = () => {
        if (watch) clearTimer(watch);
        watch = null;
      };
      const finish = (fn, val) => {
        if (settled) return;
        settled = true;
        stopWatch();
        fn(val);
      };
      // 看门狗从「最后一次字节推进」起算，不是从请求开始：慢但还在动的连接不该被掐断
      const armWatch = () => {
        stopWatch();
        watch = setTimer(() => {
          watch = null;
          if (settled) return;
          stalled = true;
          try {
            xhr.abort();
          } catch {}
        }, Math.max(0, STALL_MS - (now() - lastByte)));
      };

      xhr.open("POST", url);
      xhr.timeout = REQ_TIMEOUT;
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      if (body) {
        xhr.upload.onprogress = (e) => {
          lastByte = now();
          armWatch();
          if (e.lengthComputable) body.onBytes?.(e.loaded);
        };
      }
      xhr.onload = () => {
        let data = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {}
        if (xhr.status >= 200 && xhr.status < 300) return finish(resolve, data || {});
        finish(reject, Object.assign(new Error(data?.error || `上传失败 (${xhr.status})`), { status: xhr.status, body: data }));
      };
      xhr.onerror = () => finish(reject, Object.assign(new Error("网络错误"), { net: true }));
      // 30 秒一点回音都没有：对用户来说和「连接停滞」是同一件事
      xhr.ontimeout = () => finish(reject, Object.assign(new Error("网络超时"), { net: true, stall: true }));
      xhr.onabort = () =>
        stalled
          ? finish(reject, Object.assign(new Error("连接停滞"), { net: true, stall: true }))
          : finish(reject, Object.assign(new Error("上传已中止"), { aborted: true }));

      armWatch();
      xhr.send(body ? body.blob : undefined);
    });

  return (async () => {
    // ---------- 发送前校验：第一个请求之前判完，判不过就零请求、零状态帧 ----------
    const extMatch = /\.([^.\\/]+)$/.exec(String(file.name || ""));
    const ext = extMatch ? extMatch[0].toLowerCase() : "";
    if (!total) throw failWith(new Error("文件是空的（0 字节）"), "prepare", 0);
    if (limits) {
      const formats = limits.formats || [];
      if (!formats.includes(ext)) {
        const list = formats.map((f) => f.replace(/^\./, "")).join(" / ");
        throw failWith(new Error(`不支持的格式（${ext || "没有扩展名"}），只能上传 ${list}`), "prepare", 0);
      }
      if (total > limits.maxUpload) {
        throw failWith(
          new Error(`文件 ${sizeMB(total)}MB 超过上限 ${sizeMB(limits.maxUpload)}MB`),
          "prepare",
          0
        );
      }
    }

    emit({ phase: "prepare", pct: 0, retry: 0, received: 0, total });

    // ---------- 分片 ----------
    let offset = 0;
    let restarts = 0;
    retry = 0;

    while (offset < total) {
      const end = Math.min(offset + UPLOAD_CHUNK, total);
      const blob = file.slice(offset, end);
      try {
        const r = await post(`${base}/tracks/chunk?${qs}&offset=${offset}`, {
          blob,
          onBytes: (loaded) =>
            emit({
              phase: "sending",
              pct: pctOf(offset + loaded),
              retry,
              received: Math.min(total, offset + loaded),
              total,
            }),
        });
        const got = Number(r.received);
        offset = Number.isFinite(got) ? Math.min(got, total) : end;
        retry = 0;
        emit({ phase: "sending", pct: pctOf(offset), retry: 0, received: offset, total });
      } catch (err) {
        // 浏览器把请求中止了（面板被关、扩展被重挂）：这一首到此为止，但流程要继续走
        if (err.aborted) throw failWith(err, "sending", offset);
        // 服务端说「你已经传到这里了」：接着传
        if (err.status === 409 && Number.isFinite(err.body?.received)) {
          offset = Math.min(err.body.received, total);
          retry = 0;
          continue;
        }
        // 服务端重启过，半截文件没了：从头再来一次
        if (err.status === 410 && restarts++ < 1) {
          offset = 0;
          retry = 0;
          continue;
        }
        if (!err.net && !(err.status >= 500)) throw failWith(err, "sending", offset);
        // 这一步已经试过 retry+1 次：再失败就进终态（含首次共 5 次尝试）
        if (retry >= RETRY_MAX) {
          const pct = Math.round(pctOf(offset) * 100);
          throw failWith(
            new Error(`网络不稳定，重试多次仍未成功（${PHASE_TEXT.sending}，已传 ${pct}%，重试 ${RETRY_MAX} 次）`),
            "sending",
            offset
          );
        }
        retry++;
        // 停滞要单独说一声：界面上的「连接停滞，正在重试第 N 次」就是这一帧
        if (err.stall) emit({ phase: "stalled", pct: pctOf(offset), retry, received: offset, total });
        await wait(600 * retry);
      }
    }

    // ---------- 收尾：整首都传完了，这一步更不能因为一次抖动就前功尽弃 ----------
    retry = 0;
    emit({ phase: "committing", pct: PCT_CAP, retry: 0, received: total, total });
    for (;;) {
      try {
        const res = await post(`${base}/tracks/commit?${qs}`, null);
        emit({ phase: "done", pct: 1, retry: 0, received: total, total });
        return res;
      } catch (err) {
        if (err.aborted) throw failWith(err, "committing", total);
        if (!err.net && !(err.status >= 500)) throw failWith(err, "committing", total);
        if (retry >= RETRY_MAX) {
          throw failWith(
            new Error(
              `收尾阶段重试多次仍未成功（${PHASE_TEXT.committing}，已传 ${Math.round(pctOf(total) * 100)}%，重试 ${RETRY_MAX} 次）`
            ),
            "committing",
            total
          );
        }
        retry++;
        if (err.stall) emit({ phase: "stalled", pct: pctOf(total), retry, received: total, total });
        await wait(700 * retry);
      }
    }
  })();
}

/** 上传前读时长：进度条和自动切歌都靠它。 */
export function mediaDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (v) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(v) && v > 0 ? v : 0);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => done(audio.duration);
    audio.onerror = () => done(0);
    setTimeout(() => done(0), 6000);
    audio.src = url;
  });
}

/** 现场诊断：扩展在 OBR 里起不来时，服务端日志是唯一线索。 */
export function report(kind, detail) {
  try {
    fetch(`${apiBase()}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, detail, client: CLIENT_TAG, href: location.href, at: Date.now() }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

// ---------- 浮窗 ↔ 引擎 总线 ----------
// BroadcastChannel 同源广播，同浏览器多标签页会互相干扰，用 sessionStorage 做标签页隔离。
const CHANNEL = "bard-bus";
let tabCache = null;

export function tabId() {
  if (tabCache !== null) return tabCache;
  try {
    let id = sessionStorage.getItem("bard:tab");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem("bard:tab", id);
    }
    tabCache = id;
  } catch {
    tabCache = "";
  }
  return tabCache;
}

export function createBus({ onMessage }) {
  let bc = null;
  const me = tabId();
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (ev) => {
      const msg = ev.data;
      if (!msg || typeof msg !== "object") return;
      if (me && msg.__tab && msg.__tab !== me) return;
      onMessage(msg);
    };
  } catch {
    bc = null;
  }
  return {
    post(msg) {
      try {
        bc?.postMessage({ ...msg, __tab: me });
      } catch {}
    },
    close() {
      try {
        bc?.close();
      } catch {}
    },
  };
}

// ---------- OBR SDK ----------
let sdkPromise = null;

/**
 * 把页面早期缓存下来的父窗口消息回放给 SDK。
 * OBR 在 iframe 加载时就发一次 OBR_READY，而 SDK 要等模块（含依赖）加载完才挂监听，
 * 那条消息会丢 —— 表现就是 isReady 永远 false、getRole() 一直报 not ready。
 */
function replayParentMessages() {
  const buf = window.__bardMessages;
  if (!Array.isArray(buf) || !buf.length) return;
  window.__bardMessages = [];
  for (const m of buf) {
    try {
      window.dispatchEvent(new MessageEvent("message", { data: m.data, origin: m.origin }));
    } catch {}
  }
}

async function loadSdk() {
  const mod = await import("./sdk/obr.js");
  replayParentMessages();
  return mod.default;
}

/** 等 SDK 真正就绪（OBR 用 postMessage 握手，往往比脚本加载慢）。 */
async function waitReady(OBR, timeout = 12000) {
  if (OBR?.isReady) return true;
  const t0 = Date.now();
  await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    try {
      OBR.onReady(finish);
    } catch {
      finish();
    }
    const timer = setInterval(() => {
      if (OBR?.isReady || Date.now() - t0 > timeout) {
        clearInterval(timer);
        finish();
      }
    }, 150);
  });
  return Boolean(OBR?.isReady);
}

/**
 * 取角色。SDK 未就绪时 getRole() 会直接抛错，
 * 一次失败就当成玩家会把真 GM 判成玩家，所以必须重试。
 */
async function detectRole(OBR, tries = 8, gap = 500) {
  const attempts = [];
  for (let i = 0; i < tries; i++) {
    try {
      const role = await OBR.player.getRole();
      attempts.push({ ok: true, role });
      if (role === "GM" || role === "PLAYER") return { role, attempts };
    } catch (err) {
      attempts.push({ ok: false, err: String(err?.message || err) });
    }
    await new Promise((r) => setTimeout(r, gap));
  }
  return { role: "PLAYER", attempts };
}

/** 返回 { OBR, ready, role, attempts, roomId, name }。?dev=1 用假 SDK。 */
export async function initOBR() {
  if (!sdkPromise) {
    const dev = new URLSearchParams(location.search).get("dev");
    sdkPromise = dev ? import("./dev-sdk.js").then((m) => ({ dev: true, OBR: m.default })) : loadSdk().then((OBR) => ({ dev: false, OBR }));
  }
  const { OBR, dev } = await sdkPromise;
  const ready = await waitReady(OBR);
  const { role, attempts } = await detectRole(OBR);
  const roomId = OBR.room?.id || "";
  const name = await OBR.player.getName().catch(() => "");
  report("identity", { dev, ready, role, roomId, attempts });
  return { OBR, ready, role, attempts, roomId, name };
}
