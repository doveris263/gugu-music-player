// 浮窗界面：GM 看到控制台，玩家只看到「正在播放 + 自己的音量」。
import { initOBR, createBus, apiGet, apiPost, apiBase, uploadTrack, mediaDuration, lsGet, lsSet, lsDel, tokenKey, report } from "./lib.js";
import { Engine } from "./engine.js";

window.__appBuild = "build-folders-1";

const ICON = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l11.1-6.86a1.05 1.05 0 0 0 0-1.8L9.56 4.24A1.05 1.05 0 0 0 8 5.14Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1.4"/><rect x="14" y="4.5" width="4" height="15" rx="1.4"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.2a1.1 1.1 0 0 1 2.2 0v13.6a1.1 1.1 0 0 1-2.2 0z"/><path d="M19.4 6.1c.7-.44 1.6.06 1.6.9v10.1c0 .84-.9 1.34-1.6.9l-8.7-5.05a1.05 1.05 0 0 1 0-1.8z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 5.2a1.1 1.1 0 0 0-2.2 0v13.6a1.1 1.1 0 0 0 2.2 0z"/><path d="M4.6 6.1c-.7-.44-1.6.06-1.6.9v10.1c0 .84.9 1.34 1.6.9l8.7-5.05a1.05 1.05 0 0 0 0-1.8z"/></svg>',
  loop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.60 12.00A7.4 7.4 0 0 1 18.06 7.76"/><path d="M19.27 9.48L16.55 8.82L19.58 6.69Z" fill="currentColor" stroke="none"/><path d="M19.40 12.00A7.4 7.4 0 0 1 5.94 16.24"/><path d="M4.73 14.52L7.45 15.18L4.42 17.31Z" fill="currentColor" stroke="none"/></svg>',
  loop1: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.60 12.00A7.4 7.4 0 0 1 18.06 7.76"/><path d="M19.27 9.48L16.55 8.82L19.58 6.69Z" fill="currentColor" stroke="none"/><path d="M19.40 12.00A7.4 7.4 0 0 1 5.94 16.24"/><path d="M4.73 14.52L7.45 15.18L4.42 17.31Z" fill="currentColor" stroke="none"/><text x="12" y="14.9" text-anchor="middle" font-size="8.6" font-weight="700" fill="currentColor" stroke="none">1</text></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6.2c0-.5.3-.9.8-1L18 3.3c.7-.2 1.4.3 1.4 1v1.2c0 .5-.3.9-.8 1L11.5 8v10.2"/><circle cx="6.9" cy="18" r="2.6"/><circle cx="16.4" cy="18" r="2.6"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.1c.5 0 1 .2 1.4.6L11.5 7h7A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4.2l9.6-9.6a2.1 2.1 0 0 0 0-3l-1.2-1.2a2.1 2.1 0 0 0-3 0L4 15.8z"/><path d="M13.4 6.9l3.7 3.7"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6.5 7l.9 12a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7"/><path d="M9.5 7V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4.5"/><path d="M7.5 9 12 4.5 16.5 9"/><path d="M4 16.5v2A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-2"/></svg>',
  volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5.5 6.8 9H3.5v6h3.3l4.2 3.5z"/><path d="M15.5 8.7a4.7 4.7 0 0 1 0 6.6"/><path d="M18.2 6a8.4 8.4 0 0 1 0 12"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.8v5"/><path d="M12 16.2v.01"/></svg>',
};

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https?:\/\/[\w\-.:/@%?=&#+~]+$/i.test(String(u || "")) ? String(u) : "");
const fmt = (sec) => {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const icon = (n) => `<span aria-hidden="true">${ICON[n] || ""}</span>`;
const fmtSize = (n) => {
  const v = Number(n) || 0;
  if (v >= 1024 * 1024) return `${(v / 1024 / 1024).toFixed(1)}MB`;
  if (v >= 1024) return `${Math.round(v / 1024)}KB`;
  return `${v}B`;
};
const fmtTime = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const PHASE_TEXT = { prepare: "准备中", sending: "传输中", committing: "收尾中" };
/** 玩家侧播放出错只给这一句（F10）：不拼接服务端原话，那里可能带内部字段名与错误码。 */
const PLAY_ERROR_TEXT = "播放出了点问题，刷新页面再联系 GM 试试";
/** 诊断只留最近 20 条，放内存里：跳刷新保留不在需求里，写盘的代价换不来场景。 */
const DIAG_MAX = 20;
/** 前端构建标记：改了 public/ 下的前端代码就顺手改这里。
    浏览器把旧 app.js 留在内存里时，界面看上去一切正常但新功能就是不出现，
    这个字符串显示在「设置 → 诊断」里，一眼就能分清是代码没生效还是浏览器没刷新。 */
const APP_BUILD = "2026-11-18 21:05";

const S = {
  upd: { current: "", latest: "", hasUpdate: false, autoUpdate: true, ready: false, readyVersion: "" },
  updBusy: false,
  role: "PLAYER",
  roomId: "",
  now: null,
  state: null,
  status: { connected: true, volume: 0.85 },
  time: 0,
  skew: 0,
  tab: "list",
  busy: "",
  uploading: null, // 正在传的那一首：{ name, phase, pct, retry }
  uploadDone: "", // 一批结束后的汇总：已完成 N 个，失败 M 个
  failCard: null, // 最近一次失败，六行内容留到用户点 ×
  diag: [], // 诊断环形缓冲（最近 20 条）
  notice: null,
  playError: false, // 玩家侧那一句固定提示：播放出错时置 true，用户点 × 之后置回 false
  claimError: "",
  biliUrl: "",
  drag: null,
  folderTab: "__all",
  openFolderFor: null,
  ask: null, // 自定义确认框 {text, cmd, action}
  creatingFolder: false,
  renaming: null, // 正在改名的曲目 { id, title, artist }
  sliderActive: false,
  sliderTimer: null,
  loopPending: null, // 循环按钮的乐观值：点下去先改界面，服务端回话再对齐
  csv: null, // 导入进度 { total, done, added, skipped, failed, line, title }
  showBg: lsGet("bard:bg", "on") !== "off", // 背景图：每台设备各自记，默认开
};

let bus = null;
let engine = null;
let heardBg = false;
let lastSig = "";
let queued = false;
let sawConnected = false; // 见过「已连接」之后，断线才值得记一条诊断

// ---------- 上限 / 格式 / 诊断 ----------
/** 服务端的上限与格式：engine 读一次 `/api/health` 放进状态广播，这里读那份，不再自己请求。 */
function limitsInfo() {
  const lim = S.status?.limits;
  return lim && Array.isArray(lim.formats) && lim.formats.length ? lim : null;
}

/** 上传阶段文字：准备中 / 传输中 / 第 N 次重试 / 连接停滞，正在重试第 N 次 / 收尾中。 */
function uploadPhaseText(up) {
  const pct = `${Math.floor((up.pct || 0) * 100)}%`;
  if (up.phase === "prepare") return "准备中";
  if (up.phase === "committing") return `收尾中 ${pct}`;
  if (up.phase === "stalled") return `连接停滞，正在重试第 ${Math.max(1, up.retry)} 次（已传 ${pct}）`;
  if (up.retry > 0) return `第 ${up.retry} 次重试 ${pct}`;
  return `传输中 ${pct}`;
}

/** 记一条诊断：界面要看得到，服务端日志也留一份 —— 网络断了的时候只剩前者可用。 */
function diag(stage, reason) {
  S.diag.unshift({ at: Date.now(), stage: String(stage || ""), reason: String(reason || "") });
  if (S.diag.length > DIAG_MAX) S.diag.length = DIAG_MAX;
  report("diag", { stage, reason });
  render();
}

/** 复制到剪贴板：先走标准接口；被 iframe 的权限策略拒了再用老办法，两条都不成就如实说。 */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return Boolean(ok);
  } catch {
    return false;
  }
}

/** 卡片上的六项（F5）：复制出去的文本与卡片同源，不另编一套。 */
function failCardText(c) {
  return [
    `文件名：${c.name}`,
    `大小：${c.sizeText}`,
    `阶段：${c.phaseText}`,
    `已传：${c.pctText}`,
    `原因：${c.reason}`,
    `时间：${c.timeText}`,
  ].join("\n");
}

function failCardHtml() {
  const c = S.failCard;
  if (!c) return "";
  return `<div class="failcard">
    <div class="failcard-head">${icon("alert")}<span>上传失败</span><button class="x" data-act="fail-close" title="关闭">×</button></div>
    <div class="fc-row"><span>文件名</span><span>${esc(c.name)}</span></div>
    <div class="fc-row"><span>大小</span><span>${esc(c.sizeText)}</span></div>
    <div class="fc-row"><span>阶段</span><span>${esc(c.phaseText)}</span></div>
    <div class="fc-row"><span>已传</span><span>${esc(c.pctText)}</span></div>
    <div class="fc-row"><span>原因</span><span>${esc(c.reason)}</span></div>
    <div class="fc-row"><span>时间</span><span>${esc(c.timeText)}</span></div>
    <button class="btn block" data-act="fail-copy" style="margin-top:8px">复制</button>
  </div>`;
}

function diagText() {
  return S.diag.map((d) => `${fmtTime(new Date(d.at))} · ${d.stage} · ${d.reason}`).join("\n");
}

function diagHtml() {
  const rows = S.diag || [];
  const list = rows.length
    ? rows
        .map(
          (d) =>
            `<div class="diag-row"><span class="diag-at">${esc(fmtTime(new Date(d.at)))}</span>` +
            `<span class="diag-stage">${esc(d.stage)}</span><span class="diag-why">${esc(d.reason)}</span></div>`
        )
        .join("")
    : `<div class="diag-empty">还没有错误记录</div>`;
  return `<div class="section">诊断</div>
  <div class="diag">${list}</div>
  <div class="row2">
    <button class="btn block" data-act="diag-copy" ${rows.length ? "" : "disabled"}>复制全部</button>
    <button class="btn block" data-act="diag-clear" ${rows.length ? "" : "disabled"}>清空</button>
  </div>
  <div class="foot" style="text-align:left;padding-top:8px">前端版本 ${esc(APP_BUILD)}（对不上就是浏览器还在跑旧页面，Ctrl+F5 强制刷新）</div>`;
}

// ---------- 渲染 ----------
function render(force) {
  // 正在拖滑块时绝不重建 DOM：否则 <input> 会被销毁替换，浏览器直接丢掉拖拽，
  // 表现就是"拖不动/一跳一跳"。松手后由 markSlider 的定时器统一补一次渲染。
  if (S.sliderActive) return;
  // 改名输入框同理：广播把列表整个重建会丢焦点和已输入的字，等保存/取消再重绘
  if (S.renaming && !force) return;
  if (queued && !force) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    const sig = JSON.stringify({
      role: S.role,
      tab: S.tab,
      track: S.now?.playback?.trackId,
      playing: S.now?.playback?.playing,
      title: S.now?.track?.title,
      artist: S.now?.track?.artist,
      cover: S.now?.track?.cover,
      list: (S.state?.playlist || []).map((t) => t.id + t.title).join("|"),
      busy: S.busy,
      loop: S.loopPending ?? S.now?.playback?.loop ?? "",
      csv: S.csv ? `${S.csv.done}|${S.csv.added}|${S.csv.skipped}|${S.csv.failed}` : "",
      up: S.uploading ? `${S.uploading.phase}|${Math.round(S.uploading.pct * 100)}|${S.uploading.retry}` : "",
      updone: S.uploadDone,
      card: S.failCard ? `${S.failCard.name}|${S.failCard.timeText}` : "",
      diag: S.diag?.length ? `${S.diag.length}|${S.diag[0].at}` : "",
      // 上限与格式也是添加页的渲染输入：不跟踪它，拿到新值也不会重绘
      limits: S.status?.limits
        ? `${S.status.limits.maxUpload}|${(S.status.limits.formats || []).join(",")}`
        : "",
      notice: S.notice?.text || "",
      playErr: S.playError ? 1 : 0,
      claim: S.claimError,
      blocked: S.status.blocked,
      buffering: Boolean(S.status.buffering),
      buf: Math.round(Number(S.status.buffered ?? 0)),
      drf: Math.round(Number(S.status.drift ?? 0)),
      connected: S.status.connected,
      hasToken: S.status.hasToken,
      hide: S.state?.settings?.hideTitle,
      err: S.status.error,
      owner: Boolean(S.now?.owner),
      folderTab: S.folderTab,
      folders: (S.state?.folders || []).join("|"),
      fmap: (S.state?.playlist || []).map((t) => t.folder || "").join("|"),
    });
    if (!force && sig === lastSig) return updateLive();
    lastSig = sig;

    const badge = document.getElementById("role");
    badge.textContent = S.role === "GM" ? "DM" : "玩家";
    badge.className = `badge ${S.role === "GM" ? "gm" : ""}`;
    document.getElementById("dot").className =
      "dot" + (S.claimError ? " err" : S.status.connected === false ? " warn" : " on");
    document.getElementById("view").innerHTML = S.role === "GM" ? gmView() : playerView();
    updateLive();
  });
}

function noticeHtml() {
  if (S.notice) {
    return `<div class="notice ${S.notice.kind || ""}">${S.notice.kind === "err" ? icon("alert") : ""}<span>${esc(
      S.notice.text
    )}</span><button class="x" data-act="dismiss">×</button></div>`;
  }
  if (S.role === "GM" && S.claimError)
    return `<div class="notice err">${icon("alert")}<span>${esc(
      S.claimError
    )}</span><button class="x" data-act="reclaim" title="重新取得控制权">↻</button></div>`;
  if (S.status.error) return `<div class="notice err">${icon("alert")}<span>${esc(S.status.error)}</span></div>`;
  return "";
}

function nowCard(seekable) {
  const track = S.now?.track;
  if (!track) {
    return `<div class="now"><div class="empty">${
      S.role === "GM" ? "歌单是空的 —— 去「添加」放一首" : "GM 还没开始播放"
    }</div></div>`;
  }
  const dur = Number(track.duration || 0);
  const pct = dur > 0 ? Math.min(100, (S.time / dur) * 100) : 0;
  const cover = safeUrl(track.cover);
  // 隐藏曲目时服务端会把 title/artist 抹成 null。GM 自己有完整歌单，查回来显示真名；
  // 玩家查不到，就显示一个中性词，而不是"未命名"。
  const hidden = Boolean(S.now?.hidden);
  const own = hidden ? (S.state?.playlist || []).find((t) => t.id === track.id) : null;
  const title = own?.title || (hidden ? "背景音乐" : track.title || "未命名");
  const artist = own?.artist || (hidden ? "" : track.artist || "");
  return `<div class="now">
    ${cover ? `<div class="art" style="background-image:url('${cover}')"></div>` : ""}
    <div class="now-body">
      <div class="label">${
        S.status.buffering && S.now.playback.playing
          ? '<span class="pulse"></span>缓冲中…'
          : S.now.playback.playing
          ? '<span class="pulse"></span>正在播放'
          : "已暂停"
      }</div>
      <div class="title">${esc(title)}</div>
      <div class="artist">${esc(artist)}</div>
      <div class="progress ${seekable ? "seekable" : ""}" ${seekable ? 'data-act="seek"' : ""}>
        <span class="time" data-pos>${fmt(S.time)}</span>
        <div class="bar"><div class="fill" data-fill style="width:${pct}%"></div>${
          seekable ? `<div class="knob" data-knob style="left:${pct}%"></div>` : ""
        }</div>
        <span class="time" data-dur>${dur > 0 ? fmt(dur) : "--:--"}</span>
      </div>
    </div>
  </div>`;
}

function gmView() {
  const p = S.now?.playback;
  const list = S.state?.playlist || [];
  const loop = S.loopPending ?? p?.loop ?? "list";
  const transport = `<div class="transport">
    <button class="tbtn" data-act="prev" ${list.length ? "" : "disabled"}>${icon("prev")}</button>
    <button class="tbtn play" data-act="toggle" ${S.now?.track || list.length ? "" : "disabled"}>${icon(
    p?.playing ? "pause" : "play"
  )}</button>
    <button class="tbtn" data-act="next" ${list.length ? "" : "disabled"}>${icon("next")}</button>
    <button class="tbtn loop-btn ${loop === "track" ? "active" : ""}" data-act="loop" onclick="window.__bardLoop()" data-loop="${
    loop === "track" ? "track" : "list"
  }" title="${loop === "track" ? "单曲循环：开（一直重复这首）" : "单曲循环：关（按列表依次播放）"}">${icon(loop === "track" ? "loop1" : "loop")}</button>
  </div>`;

  const tabs = `<div class="tabs">${[
    ["list", "歌单"],
    ["add", "添加"],
    ["settings", "设置"],
  ]
    .map(([k, t]) => `<button class="tab ${S.tab === k ? "active" : ""}" data-act="tab" data-tab="${k}">${t}</button>`)
    .join("")}</div>`;

  const body = S.tab === "add" ? addView() : S.tab === "settings" ? settingsView() : listView(list);
  const blocked = S.status.blocked
    ? `<button class="unlock" data-act="unlock">${icon("volume")}浏览器拦截了声音，点这里开启</button>`
    : "";
  // 更新提示：先告诉用户检测到了，下载完再告诉他怎么生效
  const updTip = S.upd?.ready
    ? `<div class="upd-banner ready"><span>新版本 ${esc(S.upd.readyVersion)} 已下载</span><span class="upd-hint">关闭这个窗口，再双击「点这个启动程序」</span></div>`
    : S.upd?.hasUpdate
      ? `<div class="upd-banner"><span>发现新版本 ${esc(S.upd.latest)}</span><span class="upd-hint">${S.upd.autoUpdate ? "正在后台下载…" : "可在设置里手动更新"}</span></div>`
      : "";
  return noticeHtml() + failCardHtml() + updTip + nowCard(true) + transport + blocked + tabs + body;
}

/** 插件自带的确认框：OBR 的 iframe 里 window.confirm/prompt 会被静默屏蔽。 */
function askConfirm(text, cmd, action = "") {
  S.ask = { text, cmd, action };
  render(true);
}

function askHtml() {
  if (!S.ask) return "";
  return `<div class="ask"><div class="ask-text">${esc(S.ask.text)}</div>
    <div class="ask-btns"><button class="btn" data-act="ask-yes">确定</button><button class="btn ghost" data-act="ask-no">取消</button></div></div>`;
}

function newFolderHtml() {
  if (!S.creatingFolder) return "";
  return `<div class="chips"><input class="folder-input" maxlength="24" placeholder="新分类名字，比如 城镇 / 恐怖 / 休整" />
    <button class="chip active" data-act="folder-create-ok">确定</button>
    <button class="chip" data-act="folder-create-cancel">取消</button></div>`;
}
function folderBar() {
  const folders = S.state?.folders || [];
  const tab = S.folderTab || "__all";
  const chip = (key, label, extra = "") =>
    `<button class="chip ${tab === key ? "active" : ""}" data-act="folder-tab" data-folder="${esc(key)}">${esc(label)}${extra}</button>`;

  const uncategorized = (S.state?.playlist || []).filter((t) => !t.folder).length;
  const chips = [
    chip("__all", "全部"),
    ...folders.map((f) =>
      chip(f, f, tab === f ? `<span class="chip-x" data-act="folder-del" data-folder="${esc(f)}" title="删除这个分类">×</span>` : "")
    ),
  ];
  if (uncategorized || !folders.length) chips.push(chip("__none", "未分类"));
  chips.push(`<button class="chip chip-add" data-act="folder-new" title="新建分类">＋</button>`);

  return `<div class="chips">${chips.join("")}</div>` + newFolderHtml();
}

function listView(list) {
  const folders = S.state?.folders || [];
  const tab = S.folderTab || "__all";
  // __all = 全部，__none = 未分类（空字符串不能当标记用，会被 || 吞掉）
  const target = tab === "__none" ? "" : tab;
  const shown = tab === "__all" ? list : list.filter((t) => (t.folder || "") === target);

  const bar = folderBar();
  // 歌单表格：导出成 CSV（Excel 双击可开），改完再导入回来。只 GM 用。
  // 导入中直接把进度写进按钮文字：进度块再显眼也只是一条，按钮是一定在视线里的。
  const csvBusy = S.busy === "csv" ? " disabled" : "";
  const impLabel = S.busy === "csv" ? `导入中 ${S.csv?.done || 0}/${S.csv?.total || "…"}` : "导入表格";
  // 进度块放在歌单最上方（不是按钮下面），一滚到底也还能看到
  const prog = csvProgressHtml();
  const tools = `<div class="list-tools"><button class="chip" data-act="export-csv"${csvBusy}>导出表格</button><button class="chip" data-act="import-csv"${csvBusy}>${impLabel}</button></div>`;
  if (!list.length) {
    return `${prog}${bar}${tools}<div class="empty">${icon("music")}<div>还没有曲目</div><div>切到「添加」，放本地文件或粘贴 B 站链接</div></div>`;
  }
  if (!shown.length) {
    return `${prog}${bar}${tools}<div class="empty">${icon("music")}<div>这个分类还是空的</div><div>切到「添加」上传，曲目会进到当前分类</div></div>`;
  }

  const cur = S.now?.playback?.trackId;
  const rows = shown
    .map((t, i) => {
      const on = t.id === cur;
      const open = S.openFolderFor === t.id;

      // 展开的「移到分类」菜单：用按钮而不是原生下拉，点得准、触屏也能用
      const menu = open
        ? `<div class="folder-menu">${["", ...folders]
            .map(
              (f) =>
                `<button class="chip ${(t.folder || "") === f ? "active" : ""}" data-act="set-folder" data-id="${esc(t.id)}" data-folder="${esc(f)}" onclick="window.__bardSetFolder(this)">${esc(f || "未分类")}</button>`
            )
            .join("")}<button class="chip chip-add" data-act="folder-new">＋</button></div>`
        : "";

      // 改名中：把这一行换成两个输入框，保存后写回 track.update
      if (S.renaming && S.renaming.id === t.id) {
        return `<div class="row editing ${on ? "playing" : ""}">
      <span class="idx">${on ? "▶" : i + 1}</span>
      <div class="row-main">
        <input class="rename-input" data-rename="title" maxlength="40" placeholder="曲名"
          value="${esc(S.renaming.title || "")}" />
        <input class="rename-input sub" data-rename="artist" maxlength="24" placeholder="歌手（可留空）"
          value="${esc(S.renaming.artist || "")}" />
        <div class="rename-btns">
          <button class="chip active" data-act="rename-ok" data-id="${esc(t.id)}">保存</button>
          <button class="chip" data-act="rename-cancel">取消</button>
        </div>
      </div>
    </div>`;
      }

      return `<div class="row ${on ? "playing" : ""}">
      <span class="idx">${on ? "▶" : i + 1}</span>
      <div class="row-main" data-act="pick" data-id="${esc(t.id)}">
        <div class="row-title">${esc(t.title || "未命名")}</div>
        <div class="row-sub"><span class="tag ${t.kind}">${t.kind === "bilibili" ? "B站" : t.kind === "url" ? "URL" : "本地"}</span>
          <span>${esc(t.artist || "")}</span>${
            t.folder ? `<span class="tag folder-tag">${esc(t.folder)}</span>` : ""
          }${t.duration > 0 ? `<span>${fmt(t.duration)}</span>` : ""}</div>
      </div>
      <button class="icon-btn rename-btn" data-act="rename" data-id="${esc(t.id)}" title="重命名">${icon("edit")}</button>
      <button class="icon-btn folder-btn ${open ? "active" : ""}" data-act="row-folder" data-id="${esc(t.id)}" title="移到分类">${icon(
        "folder"
      )}</button>
      <button class="icon-btn" data-act="remove" data-id="${esc(t.id)}">${icon("trash")}</button>
    </div>${menu}`;
    })
    .join("");

  const where = tab === "__all" ? "" : ` · 当前分类：${esc(tab === "__none" ? "未分类" : tab)}`;
  return prog + askHtml() + bar + tools + rows + `<div class="foot">共 ${shown.length} 首${where} · 点标题立即切换</div>`;
}

function addView() {
  const up = S.uploading;
  const lim = limitsInfo();
  // 选择器的接受类型、下面那行文案、发送前校验，三处都出自同一份 formats
  const accept = lim ? ` accept="${esc(lim.formats.join(","))}"` : "";
  const formatsHint = lim ? lim.formats.map((f) => f.replace(/^\./, "")).join(" / ") : "";
  return `
  <div class="field">
    <div class="label">本地音乐</div>
    <label class="drop" for="file">${icon("upload")}<div>点击选择，或把音频拖进来</div>
      <small>上传后全房间都能听到</small></label>
    <input id="file" type="file"${accept} multiple style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none" />
    ${
      lim
        ? `<div class="foot" style="text-align:left;padding-top:6px">单个文件上限 ${Math.round(
            lim.maxUpload / 1024 / 1024
          )}MB · 支持 ${esc(formatsHint)}</div>`
        : ""
    }
    ${
      up
        ? `<div class="notice">${up.phase === "stalled" ? icon("alert") : '<span class="spin"></span>'}<span>${esc(
            up.name
          )} · ${esc(uploadPhaseText(up))}</span></div>`
        : ""
    }
    ${S.uploadDone ? `<div class="notice"><span>${esc(S.uploadDone)}</span></div>` : ""}
  </div>
  <div class="field">
    <div class="label">链接添加 <span class="hint">B 站视频 / 音频直链</span></div>
    <div class="row2">
      <input class="input" id="bili" placeholder="粘贴 B 站链接、BV 号，或任意音频直链" value="${esc(S.biliUrl)}" />
      <button class="btn primary" data-act="add-bili" ${S.busy === "bili" ? "disabled" : ""}>${
    S.busy === "bili" ? "处理中…" : "添加"
  }</button>
    </div>
    <div class="foot" style="text-align:left;padding-top:6px">B 站：bilibili.com/video/BV…、b23.tv 短链、av 号　·　直链：以 mp3 / m4a / flac / wav / ogg / opus / aac / webm 结尾的 http(s) 地址</div>
  </div>`;
}

function settingsView() {
  const ask = askHtml();
  const st = S.state?.settings || {};
  const master = Math.round((S.now?.playback?.volume ?? 1) * 100);
  const mine = Math.round((S.status.volume ?? 0.85) * 100);
  return ask + `
  <div class="section">播放</div>
  <div class="setting"><div class="setting-main"><div class="setting-title">我的音量</div>
    <div class="setting-desc">只影响你自己</div></div></div>
  <div class="vol"><input type="range" min="0" max="100" value="${mine}" data-act="vol" /><span class="vol-val">${mine}%</span></div>
  <div class="setting"><div class="setting-main"><div class="setting-title">全房间音量</div>
    <div class="setting-desc">广播给所有玩家，玩家还能各自再调</div></div></div>
  <div class="vol"><input type="range" min="0" max="100" value="${master}" data-act="master-vol" /><span class="vol-val" data-master>${master}%</span></div>

  <div class="section">可见性</div>
  <div class="setting"><div class="setting-main"><div class="setting-title">对玩家显示曲目</div>
    <div class="setting-desc">关掉后玩家只看到「正在播放」</div></div>
    <button class="switch ${st.hideTitle ? "" : "on"}" data-act="toggle-hide"></button></div>

  <div class="section">外观</div>
  <div class="setting"><div class="setting-main"><div class="setting-title">背景图</div>
    <div class="setting-desc">只影响你自己的界面，随时可关</div></div>
    <button class="switch ${S.showBg ? "on" : ""}" data-act="toggle-bg"></button></div>

  <div class="section">状态</div>
  <div class="kv"><span>同步服务</span><span>${S.status.connected === false ? "未连接" : "已连接"}</span></div>
  <div class="kv"><span>音频引擎</span><span>${S.status.kind === "background" ? "后台常驻" : "浮窗内"}</span></div>
  <div class="kv"><span>声音</span><span>${
    S.status.error ? esc(S.status.error) : S.status.blocked ? "被浏览器拦截（点上方按钮）" : "正常"
  }</span></div>
  <div class="kv"><span>缓冲余量</span><span>${Number(S.status.buffered ?? 0).toFixed(1)} 秒</span></div>
  <div class="kv"><span>同步偏差</span><span>${Number(S.status.drift ?? 0).toFixed(1)} 秒</span></div>
  <div class="kv"><span>播放速度</span><span>${Number(S.status.rate ?? 1).toFixed(2)}×</span></div>
  <div class="kv"><span>房间号</span><span>${esc(S.roomId.slice(0, 12))}…</span></div>
  <div class="kv"><span>控制权</span><span>${S.status.hasToken ? "已取得" : "未取得"}</span></div>
  <div class="kv"><span>曲目数</span><span>${S.state?.playlist?.length ?? 0}</span></div>
  <div class="row2" style="margin-top:14px">
    <button class="btn block" data-act="reclaim">重新取得控制权</button>
    <button class="btn block" data-act="release">让出控制权</button>
  </div>
  <div class="foot">控制权靠心跳保持，关掉浏览器 90 秒后别人可接管。</div>
  ${diagHtml()}`;
}

function playerView() {
  const hasTrack = Boolean(S.now?.track);
  const vol = Math.round((S.status.volume ?? 0.85) * 100);
  // 房间还没人控制：给主持一个入口（OBR 偶尔会把 GM 报成 PLAYER）
  const canClaim = !S.now?.owner;
  return `
  ${nowCard(false)}
  ${
    S.playError
      ? `<div class="notice err">${icon("alert")}<span>${PLAY_ERROR_TEXT}</span><button class="x" data-act="play-error-close" title="关闭">×</button></div>`
      : ""
  }
  ${S.status.blocked ? `<button class="unlock" data-act="unlock">${icon("volume")}开启声音</button>` : ""}
  ${
    canClaim
      ? `<button class="btn block" data-act="reclaim" style="margin-bottom:12px">我是主持，取得播放控制权</button>`
      : `<div class="player-note">音乐由 GM 统一播放，你只能调节自己的音量。关闭面板也不会中断。</div>`
  }
  <div class="field">
    <div class="label">我的音量 <span class="hint">${vol}%</span></div>
    <div class="vol"><input type="range" min="0" max="100" value="${vol}" data-act="vol" /></div>
  </div>
  ${hasTrack ? "" : '<div class="player-note">GM 一开始播放，你就会自动听到。</div>'}`;
}

// 把进度条画到指定位置（拖动时由指针驱动，不走轮询）
function paintProgress(time, dur) {
  const pct = dur > 0 ? Math.min(100, (Math.max(0, time) / dur) * 100) : 0;
  const fill = document.querySelector("[data-fill]");
  const knob = document.querySelector("[data-knob]");
  const pos = document.querySelector("[data-pos]");
  if (fill) fill.style.width = `${pct}%`;
  if (knob) knob.style.left = `${pct}%`;
  if (pos) pos.textContent = fmt(time);
}

function updateLive() {
  if (S.drag) return; // 拖动过程中不让轮询把条子拽回去
  const p = S.now?.playback;
  if (p) {
    S.time = p.playing ? p.position + (Date.now() + S.skew - p.anchor) / 1000 : p.position;
    // 小于 0 说明锚点在未来（刚 seek 过），夹到 0 免得出现负时间
    if (S.time < 0) S.time = 0;
  }
  const dur = Number(S.now?.track?.duration || 0);
  paintProgress(S.time, dur);
  const durEl = document.querySelector("[data-dur]");
  if (durEl && dur > 0) durEl.textContent = fmt(dur);
  const btn = document.querySelector('[data-act="toggle"]');
  if (btn) {
    const want = p?.playing ? "pause" : "play";
    if (btn.dataset.i !== want) {
      btn.dataset.i = want;
      btn.innerHTML = icon(want);
    }
  }
}
setInterval(updateLive, 200);

// ---------- 动作 ----------
function toast(text, kind = "info", ms = 4000) {
  S.notice = { text, kind };
  render(true);
  if (ms) {
    const mine = text;
    setTimeout(() => {
      if (S.notice?.text === mine) {
        S.notice = null;
        render(true);
      }
    }, ms);
  }
}

const token = () => lsGet(tokenKey(S.roomId), "") || "";

// ---------- 控制权自愈 ----------
// 房间同一时刻只认一个主持令牌。同一个房间可能在两个地方开着（本机地址和隧道地址、两个浏览器窗口），
// 两边的 localStorage 互不相通，后来的那边就拿着一个过期令牌，做什么都收到 403「不是本房间的主持」。
// 那种情况下用户什么错都没犯，所以这里不报错：先自己重新认领一次，真拿不到再把话说清楚。
const clientKey = (roomId) => `bard:client:${roomId}`;

function clientId() {
  let id = lsGet(clientKey(S.roomId), "");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    lsSet(clientKey(S.roomId), id);
  }
  return id;
}

/** 重新认领主持权。成功换新令牌；失败就把人话写进 claimError，界面顶部会显示。 */
async function renewOwner() {
  try {
    const res = await apiPost(`/api/rooms/${encodeURIComponent(S.roomId)}/claim`, {
      role: "GM",
      clientId: clientId(),
      token: token(),
    });
    if (res?.token) {
      lsSet(tokenKey(S.roomId), res.token);
      S.claimError = "";
      render(true);
      return true;
    }
  } catch (err) {
    S.claimError = describeOwnerBlock(err);
    // 顶部提示条会被引擎随后推来的状态清掉，所以再用 toast 说一遍：这条一定落到用户眼里
    toast(S.claimError, "err", 7000);
    render(true);
  }
  return false;
}

/** 房间被占时的提示：名字后面永远标上「DM」，免得把角色名（GM/DM）误认成某个人。 */
function describeOwnerBlock(err) {
  const o = err.body?.owner;
  if (!o) return err.message || "控制权失效，请重新取得控制权";
  const who = `「${o.name || "DM"}」（DM）`;
  // 占着房间的就是自己另开的窗口（本页、浮窗、OBR 背景引擎）：不说怪话，只说实情
  if (o.clientId && o.clientId === clientId())
    return `控制权在你自己的另一个窗口上（${who}）。点 ↻ 或等它释放就能在这里操作。`;
  return `这个房间正由 ${who} 控制；如果那是你自己刚刷新/关掉的窗口，最多 90 秒自动释放，也可以直接点 ↻ 重新取得控制权。`;
}

/** 关页/刷新时把主持权交出去：否则旧令牌要掛到 90 秒超时才释放，下次打开就是一顿「房间已被控制」。
    只有「确实是本页持有」才交：同一个房间的背景引擎可能拿着同一张令牌，本页一并交掉就会把正在放歌的那个踢下线。 */
function releaseOnLeave() {
  const t = token();
  if (!t) return;
  // owner 在 /state 和 now 里都有；哪个先到用哪个
  const owner = S.state?.owner || S.now?.owner;
  if (owner?.clientId && owner.clientId !== clientId()) return;
  try {
    fetch(`${apiBase()}/api/rooms/${encodeURIComponent(S.roomId)}/release`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/** 带令牌的读请求：和写请求一样，令牌过期先自愈一次再重试。 */
async function apiGetAuth(path) {
  try {
    return await apiGet(path, token());
  } catch (err) {
    if (err.status !== 401 && err.status !== 403) throw err;
    if (!(await renewOwner())) throw err;
    return await apiGet(path, token());
  }
}

/** 带令牌的写请求：令牌过期先自愈一次，再重试。 */
async function apiPostAuth(path, body) {
  try {
    return await apiPost(path, body, token());
  } catch (err) {
    if (err.status !== 401 && err.status !== 403) throw err;
    if (!(await renewOwner())) throw err;
    return await apiPost(path, body, token());
  }
}

async function command(body) {
  if (!token()) return toast("还没有控制权", "err");
  try {
    const res = await apiPostAuth(`/api/rooms/${encodeURIComponent(S.roomId)}/command`, body);
    if (res?.state) {
      S.state = res.state;
      render(true);
      scheduleProbeDurations();
      // 面板立刻更新了，但真正出声的是后台引擎。
      // 把响应里的 now 直接推给它，省掉引擎再问一次服务器的往返；
      // 少了这一趟，切歌才没有迟滞感。
      if (res.now) bus?.post({ t: "now", now: res.now });
      else bus?.post({ t: "refresh" });
    }
  } catch (err) {
    diag("服务器", err.message);
    // 403/401 不是用户做错了什么：这个房间正被另一个窗口控制。把话说明白，别把服务端原文丢给他。
    if (err.status === 401 || err.status === 403) {
      if (!S.claimError) S.claimError = describeOwnerBlock(err);
      render(true);
      return;
    }
    toast(err.message, "err");
  }
}

/** 把曲目移到某个分类。单独成函数是为了出错时能上报，便于排查。 */
async function moveTrackTo(trackId, folder) {
  const t = token();
  if (!t) {
    report("folder-move", { ok: false, error: "no-token", trackId, folder });
    return toast("还没有控制权", "err");
  }
  try {
    const res = await apiPost(
      `/api/rooms/${encodeURIComponent(S.roomId)}/command`,
      { type: "track.folder", trackId, folder },
      t
    );
    if (res?.state) {
      S.state = res.state;
      render(true);
    }
    report("folder-move", { ok: true, trackId, folder });
  } catch (err) {
    report("folder-move", { ok: false, error: err.message, trackId, folder });
    toast(err.message, "err");
  }
}
// 内联 onclick 直接调用，避免事件委托在某些环境下收不到（也更好调试）
// 单曲循环开关：走内联 onclick，和分类按钮同一套写法
// 点下去先改按钮自己，网络回来再对齐。以前是等服务器响应才重绘整个视图，
// 每次点击都有两三帧完全没反应的空白，连点起来就是「卡卡的」。
function paintLoop(value) {
  const btn = document.querySelector(".loop-btn");
  if (!btn) return;
  const on = value === "track";
  btn.classList.toggle("active", on);
  btn.dataset.loop = value;
  btn.title = on ? "单曲循环：开（一直重复这首）" : "单曲循环：关（按列表依次播放）";
  btn.innerHTML = icon(on ? "loop1" : "loop");
}

window.__bardLoop = async () => {
  const cur = S.loopPending ?? (S.now?.playback?.loop || "list");
  const next = cur === "track" ? "list" : "track";
  if (!token()) return toast("还没有控制权", "err");
  S.loopPending = next;
  paintLoop(next);
  try {
    const res = await apiPost(`/api/rooms/${encodeURIComponent(S.roomId)}/command`, {
      type: "settings",
      loop: next,
    }, token());
    if (res?.state) S.state = res.state;
    // 把响应里的 now 直接推给引擎，省掉引擎再问一次服务器的往返
    if (res?.now) bus?.post({ t: "now", now: res.now });
    else bus?.post({ t: "refresh" });
    report("loop-click", { cur, next });
    // 兜底：广播没送到也要把乐观值撤掉，不然按钮会永远停在本地那次点击上
    setTimeout(() => {
      if (S.loopPending === next) {
        S.loopPending = null;
        render();
      }
    }, 2000);
  } catch (err) {
    S.loopPending = null;
    paintLoop(cur);
    report("loop-error", { message: String((err && err.message) || err) });
    diag("单曲循环", err.message);
    toast(err.message, "err");
  }
};
window.__bardSetFolder = (el) => {
  // 先取值再重绘（重绘会替换掉这个按钮元素）
  const folder = el.dataset.folder || "";
  const trackId = el.dataset.id;
  S.openFolderFor = null;
  render(true);
  // 走和所有按钮相同的指令通道，并且不论成败都给出可见反馈
  const t = token();
  if (!t) return toast("还没有控制权，先点「取得播放控制权」", "err");
  apiPost(`/api/rooms/${encodeURIComponent(S.roomId)}/command`, { type: "track.folder", trackId, folder }, t)
    .then((res) => {
      if (res?.state) {
        S.state = res.state;
        render(true);
      }
      toast(folder ? `已归到「${folder}」` : "已移出分类");
    })
    .catch((err) => toast(`归类失败：${err.message}`, "err"));
};
async function refreshState() {
  if (!token()) return;
  try {
    S.state = await apiGetAuth(`/api/rooms/${encodeURIComponent(S.roomId)}/state`);
    render(true);
    scheduleProbeDurations();
  } catch (err) {
    // 读不到状态就是「控制权不在手上」，不能静默吞掉：否则界面停在旧数据上，
    // 看着一切正常，实际点什么都没反应
    if (err.status === 401 || err.status === 403) {
      if (!S.claimError) S.claimError = "控制权已失效：这个房间正被另一个窗口控制。点 ↻ 重新取得控制权。";
      render(true);
    }
  }
}

// ---------- 时长补齐 ----------
// 直链曲目入库时不知道有多长：表里那格是空的，服务端也不会去下载音频慢慢解码。
// 浏览器自己能解码（和播放用的是同一套解码器），所以这里把整张歌单里缺时长的都探一遍，
// 写回服务端，所有人立刻都有了。B 站曲目解析时接口就带了时长，不在此列。
// 探过的记下来不重复探，正在播的那首交给播放引擎回填，免得和播放抢带宽。
const probe = { busy: false, tried: new Set(), timer: 0 };

function needsDuration(t) {
  return Boolean(t?.id) && t.id !== S.now?.track?.id && !(Number(t.duration) > 0) && Boolean(t.src) && !probe.tried.has(t.id);
}

function scheduleProbeDurations() {
  if (S.role !== "GM" || !token()) return;
  if (!(S.state?.playlist || []).some(needsDuration)) return;
  clearTimeout(probe.timer);
  probe.timer = setTimeout(runProbeDurations, 1200);
}

/** 只读元数据，不下载整首：preload=metadata 只会拿开头一小段。 */
function probeDuration(t) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.muted = true;
    let done = false;
    const finish = (v) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        a.removeAttribute("src");
        a.load();
      } catch {}
      resolve(v);
    };
    const timer = setTimeout(() => finish(0), 15000);
    a.addEventListener("loadedmetadata", () => {
      const d = a.duration;
      finish(Number.isFinite(d) && d > 1 && d < 86400 ? Math.round(d) : 0);
    });
    a.addEventListener("error", () => finish(0));
    try {
      a.src = new URL(t.src, apiBase()).href;
    } catch {
      finish(0);
    }
  });
}

async function runProbeDurations() {
  if (probe.busy || S.role !== "GM" || !token()) return;
  const list = (S.state?.playlist || []).filter(needsDuration);
  if (!list.length) return;
  probe.busy = true;
  let changed = 0;
  try {
    // 一次补齐整张歌单，不是只挑几首：表里没写时长的曲目都该自己长出来
    for (const t of list) {
      if (!token()) break; // 控制权没了就别再发命令
      probe.tried.add(t.id);
      const d = await probeDuration(t);
      if (d > 0) {
        try {
          const res = await apiPostAuth(`/api/rooms/${encodeURIComponent(S.roomId)}/command`, {
            type: "track.update",
            trackId: t.id,
            patch: { duration: d },
          });
          if (res?.state) {
            S.state = res.state;
            changed++;
            render(true); // 数字一个一个出现，用户能看见在推进
          }
        } catch (err) {
          diag("时长", err.message);
        }
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  } finally {
    probe.busy = false;
    if (changed) {
      render(true);
      toast(`已补齐 ${changed} 首的时长`);
    }
    scheduleProbeDurations();
  }
}

// 控制权交给引擎处理：界面只发意图，否则引擎下一条状态会把角色覆盖回去
function claim() {
  bus?.post({ t: "claim" });
  toast("正在取得控制权…", "info", 2500);
}

function release() {
  bus?.post({ t: "release" });
  toast("已让出控制权");
}

async function addBilibili() {
  const url = (document.getElementById("bili")?.value || S.biliUrl || "").trim();
  if (!url) return toast("先粘贴一个链接", "warn");
  // B 站四种写法：BV 号、av 号、bilibili.com、b23.tv 短链；其余一律按音频直链处理
  const isBili = /^BV[0-9A-Za-z]+$/.test(url) || /^av\d+$/i.test(url) || /bilibili\.com|b23\.tv/i.test(url);
  const path = isBili ? "tracks/bilibili" : "tracks/url";
  S.busy = "bili";
  render(true);
  try {
    await apiPostAuth(`/api/rooms/${encodeURIComponent(S.roomId)}/${path}`, { url, folder: activeFolder() });
    S.biliUrl = "";
    toast("已加入歌单");
    await refreshState();
  } catch (err) {
    diag(isBili ? "B 站解析" : "链接添加", err.message);
    toast(err.message, "err");
  } finally {
    S.busy = "";
    render(true);
  }
}

// ---------- 歌单表格：导出 / 导入 ----------
// 导出的是元数据（曲名/歌手/分类/类型/链接/时长/文件标识）。
// 本地曲目按「文件标识」还原——那就是服务端自己存的音频文件名，文件还在就能直接挂回来，
// 不用重新上传。B 站曲目按链接重新解析。
async function exportPlaylistCsv() {
  const url = `${apiBase()}/api/rooms/${encodeURIComponent(S.roomId)}/export`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) throw new Error(`导出失败（${res.status}）`);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `歌单-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
    toast("已导出表格，用 Excel 打开即可");
  } catch (err) {
    // fetch 被拦（内嵌 iframe 的 CSP / 沙箱常常这样）时，退回「直接导航下载」：
    // 服务端这条路由认 ?token=，浏览器会按 Content-Disposition 存文件。
    diag("导出歌单", `${err.message} —— 改用直链下载`);
    try {
      const f = document.createElement("iframe");
      f.style.display = "none";
      f.src = `${url}?token=${encodeURIComponent(token() || "")}`;
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 20000);
      toast("已开始下载表格");
    } catch (err2) {
      toast(`导出失败：${err.message}`, "err");
    }
  }
}

/** 隐藏的文件选择框只建一次，挂在 body 上。
    以前它写在歌单视图的 HTML 里，而那个视图每次广播都会重绘：
    选文件的对话框还开着时视图已经重画，用户选中文件后 change 事件发在一个
    已经脱离文档的旧元素上，冒泡不到 document —— 界面表现就是「点了导入完全没反应」。
    另外 input.value 必须先清空：同一个文件连选两次不会触发 change。 */
function openCsvPicker() {
  let inp = document.getElementById("csv-file");
  if (!inp) {
    inp = document.createElement("input");
    inp.id = "csv-file";
    inp.type = "file";
    inp.accept = ".csv,text/csv";
    inp.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(inp);
  }
  inp.value = "";
  inp.click();
}

async function importPlaylistCsv(file) {
  if (!file) return;
  const mine = { total: 0, done: 0, added: 0, skipped: 0, failed: 0, line: 0, title: "" };
  S.busy = "csv";
  S.csv = mine;
  render(true);
  let result = null;
  try {
    // 传原始字节：Excel 在中文 Windows 下默认另存为 GBK 编码的「CSV（逗号分隔）」，
    // 用 file.text() 按 UTF-8 读会把表头读成乱码，服务端就认不出「曲名」「类型」两列。
    // 编码判断交给服务端（BOM → UTF-8 → GB18030）。
    const bytes = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    const csvBase64 = btoa(bin);
    const room = encodeURIComponent(S.roomId);
    const res = await fetch(`${apiBase()}/api/rooms/${room}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ csvBase64 }),
    });
    // 403 = 令牌过期（另一个窗口接手了）：换一张令牌再导一次，不让用户自己去想办法
    if (res.status === 401 || res.status === 403) {
      if (!(await renewOwner())) throw new Error(S.claimError || "控制权失效，请重新取得控制权");
      return importPlaylistCsv(file);
    }
    const head = await res.json().catch(() => ({}));
    if (!res.ok || !head.jobId) throw new Error(head.error || `导入失败（${res.status}）`);
    mine.total = Number(head.total) || 0;

    // 进度靠轮询，不用长连接：
    // 以前是 NDJSON 流，一面跑一面推；中间任何一层代理缓冲或断流，前端就直接 Failed to fetch。
    // 现在每 250ms 拉一次快照，请求都是短的，网络再差也不会挂在半路。
    const jobUrl = `${apiBase()}/api/rooms/${room}/import/${encodeURIComponent(head.jobId)}`;
    for (let i = 0; i < 2400 && !result; i++) {
      const r = await fetch(jobUrl, { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" });
      if (r.status === 404) throw new Error("导入任务已过期，请重新导一次");
      const s = await r.json().catch(() => null);
      if (s) {
        mine.total = Number(s.total) || mine.total;
        mine.done = Number(s.done) || 0;
        mine.added = Number(s.added) || 0;
        mine.skipped = Number(s.skipped) || 0;
        mine.failed = Number(s.failed) || 0;
        mine.line = Number(s.line) || 0;
        mine.title = s.title || "";
        paintCsvProgress();
        if (s.finished) {
          result = s;
          break;
        }
      }
      await new Promise((ok) => setTimeout(ok, 250));
    }
    if (!result) throw new Error("导入超时：歌单里已处理完的曲目会保留，刷新页面可以看");

    const r = result;
    const parts = [`新增 ${r.added} 首`];
    if (r.skipped) parts.push(`跳过重复 ${r.skipped} 首`);
    if (r.failed) parts.push(`没进来 ${r.failed} 首`);
    // 表格里写了房间里还没有的分类：导入时按表新建，这里把名字报出来，免得用户去目录里找
    const madeFolders = r.details?.createdFolders || [];
    if (madeFolders.length) parts.push(`新建分类 ${madeFolders.join("、")}`);
    toast(parts.join("，"), r.failed ? "warn" : "info", 6000);
    if (r.failed) {
      const lines = (r.details?.failed || []).slice(0, 5).map((f) => `第 ${f.line} 行「${f.title || "无标题"}」：${f.reason}`);
      S.notice = {
        text: `有 ${r.failed} 首没进来 —— ${lines.join("；")}${r.failed > 5 ? "；……" : ""}`,
        kind: "err",
      };
    }
    await refreshState();
  } catch (err) {
    diag("导入歌单", err.message);
    toast(err.message, "err");
  } finally {
    S.busy = "";
    render(true);
    // 进度条留在原处停一下再收：一完成就消失的话，用户看不到到底跑完了没有。
    // 6 秒：本地曲目为主的表格几百毫秒就跑完了，2 秒容易被眼睛错过。
    setTimeout(() => {
      if (S.csv === mine) {
        S.csv = null;
        render(true);
      }
    }, 6000);
  }
}

/** 只重画进度那一块：整个歌单重绘会让列表跟着闪。
    顺便把「导入中 n/总数」写进导入按钮 —— 进度块可能被滚出视野，按钮不会。 */
function paintCsvProgress() {
  const el = document.getElementById("csv-prog");
  if (el) el.outerHTML = csvProgressHtml();
  else {
    // 这块可能在上一轮渲染时还不存在（那时 S.csv 是 null），不能等下次重渲染：
    // 短歌单可能跑完了都没等到那一次，用户就什么都看不见。就地插到按钮行后面。
    const host = document.querySelector(".list-tools");
    if (host && !host.nextElementSibling?.classList?.contains("csvprog")) {
      host.insertAdjacentHTML("afterend", csvProgressHtml());
    }
  }
  const btn = document.querySelector('[data-act="import-csv"]');
  if (btn) {
    const c = S.csv;
    btn.textContent = c && c.total && c.done < c.total ? `导入中 ${c.done}/${c.total}` : "导入表格";
  }
}

function csvProgressHtml() {
  const c = S.csv;
  if (!c) return "";
  const total = Number(c.total) || 0;
  const pct = total ? Math.min(100, Math.round((c.done / total) * 100)) : 6;
  const finished = total > 0 && c.done >= total;
  const stat = [`新增 ${c.added}`];
  if (c.skipped) stat.push(`跳过 ${c.skipped}`);
  if (c.failed) stat.push(`失败 ${c.failed}`);
  const sub = finished
    ? "正在刷新歌单…"
    : c.title
      ? `第 ${c.line} 行：${c.title}`
      : "读取表格中…";
  return `<div class="csvprog${finished ? " done" : ""}" id="csv-prog">
    <div class="csvprog-head"><span>${finished ? "导入完成" : "正在导入"} ${c.done}/${total || "…"}　${pct}%</span><span>${stat.join(" · ")}</span></div>
    <div class="csvprog-bar"><i style="width:${pct}%"></i></div>
    <div class="csvprog-sub">${esc(sub)}</div>
  </div>`;
}

function activeFolder() {
  const tab = S.folderTab || "__all";
  return tab === "__all" || tab === "__none" ? "" : tab;
}

async function doUpload(files) {
  const list = [...files];
  if (!list.length) return toast("请选择音频文件", "warn");
  const lim = limitsInfo();
  let done = 0;
  let failed = 0;
  S.uploadDone = "";
  for (const file of list) {
    const state = { name: file.name, phase: "prepare", pct: 0, retry: 0 };
    S.uploading = state;
    render(true);
    try {
      // 时长只用于显示；读不到（0）也要能上传，不能因为元数据卡住整批
      const duration = await mediaDuration(file).catch(() => 0);
      await uploadTrack({
        roomId: S.roomId,
        folder: activeFolder(),
        token: token(),
        file,
        duration,
        // 取不到 /api/health 就不传：格式与上限交给服务端判，前端不自己写一份
        limits: lim || undefined,
        onState: (s) => {
          state.phase = s.phase;
          state.pct = s.pct;
          state.retry = s.retry;
          render();
        },
      });
      done++;
    } catch (err) {
      failed++;
      showFailCard(file, err);
    }
  }
  S.uploading = null;
  S.uploadDone = `已完成 ${done} 个，失败 ${failed} 个`;
  render(true);
  setTimeout(() => {
    S.uploadDone = "";
    render(true);
  }, 6000);
  await refreshState();
}

/** 失败卡片（F5）：六行内容留到用户点 ×，同时记一条诊断。 */
function showFailCard(file, err) {
  const phase = err?.phase || "sending";
  const phaseText = PHASE_TEXT[phase] || "传输中";
  S.failCard = {
    name: file.name || "音频",
    sizeText: fmtSize(file.size),
    phaseText,
    pctText: `${Math.round((err?.pct || 0) * 100)}%`,
    reason: String(err?.message || err),
    timeText: fmtTime(new Date()),
  };
  diag("上传", `${S.failCard.name}（${phaseText}）：${S.failCard.reason}`);
  render(true);
}

// ---------- 事件 ----------
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;

  if (act === "tab") S.tab = el.dataset.tab;
  else if (act === "dismiss") S.notice = null;
  else if (act === "play-error-close") S.playError = false;
  else if (act === "toggle") command({ type: S.now?.playback?.playing ? "pause" : "play" });
  else if (act === "prev") command({ type: "prev" });
  else if (act === "next") command({ type: "next" });
  else if (act === "pick") command({ type: "select", trackId: id });
  else if (act === "remove") {
    askConfirm("从歌单移除这首？", { type: "playlist", op: "remove", trackId: id });
  } else if (act === "pick-file") document.getElementById("file")?.click();
  else if (act === "export-csv") exportPlaylistCsv();
  else if (act === "import-csv") openCsvPicker();
  else if (act === "add-bili") addBilibili();
  else if (act === "toggle-hide") command({ type: "settings", hideTitle: !S.state?.settings?.hideTitle });
  else if (act === "toggle-bg") {
    S.showBg = !S.showBg;
    lsSet("bard:bg", S.showBg ? "on" : "off");
    applyBg();
    render(true);
  }
  else if (act === "unlock") bus?.post({ t: "unlock" });
  else if (act === "fail-copy") {
    copyText(failCardText(S.failCard || {})).then((ok) =>
      toast(ok ? "已复制，直接粘给开发者就行" : "复制失败，请手动选中卡片文字", ok ? "info" : "err")
    );
    return;
  } else if (act === "fail-close") S.failCard = null;
  else if (act === "diag-copy") {
    copyText(diagText()).then((ok) =>
      toast(ok ? "已复制全部诊断" : "复制失败，请手动选中诊断文字", ok ? "info" : "err")
    );
    return;
  } else if (act === "diag-clear") S.diag = [];
  else if (act === "reclaim") claim();
  else if (act === "release") {
    askConfirm("让出控制权？其他 GM 可以接管。", null, "release");
  } else if (act === "seek") {
    // 真正的手势在下面的 pointerdown/up 里处理，这里不做事
  } else if (act === "ask-yes") {
    const pending = S.ask;
    S.ask = null;
    render(true);
    if (pending?.action === "release") release();
    else if (pending?.cmd) command(pending.cmd);
    return;
  } else if (act === "ask-no") {
    S.ask = null;
    render(true);
    return;
  } else if (act === "folder-create-ok") {
    // 必须先读值再重绘：重绘会换掉输入框元素，值就丢了
    const input = document.querySelector(".folder-input");
    const name = (input?.value || "").trim().slice(0, 24);
    S.creatingFolder = false;
    if (!name) {
      render(true);
      return;
    }
    S.folderTab = name;
    render(true);
    command({ type: "folder", op: "create", name });
    return;
  } else if (act === "folder-create-cancel") {
    S.creatingFolder = false;
    render(true);
    return;
  } else if (act === "row-folder") {
    S.openFolderFor = S.openFolderFor === id ? null : id;
    render(true);
    return;

  } else if (act === "rename") {
    const t = (S.state?.playlist || []).find((x) => x.id === id);
    if (!t) return;
    S.renaming = { id, title: t.title || "", artist: t.artist || "" };
    S.openFolderFor = null;
    render(true);
    setTimeout(() => {
      const el = document.querySelector('.rename-input[data-rename="title"]');
      el?.focus();
      el?.select();
    }, 60);
    return;
  } else if (act === "rename-ok") {
    // 先取值再重绘（重绘会换掉输入框元素）
    const titleEl = document.querySelector('.rename-input[data-rename="title"]');
    const artistEl = document.querySelector('.rename-input[data-rename="artist"]');
    const title = (titleEl?.value ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    const artist = (artistEl?.value ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
    const targetId = S.renaming?.id || id;
    if (!title) {
      toast("曲名不能为空", "err");
      return;
    }
    S.renaming = null;
    render(true);
    command({ type: "track.update", trackId: targetId, patch: { title, artist } });
    return;
  } else if (act === "rename-cancel") {
    S.renaming = null;
    render(true);
    return;

  } else if (act === "folder-tab") {
    S.folderTab = el.dataset.folder ?? "__all";
    render(true);
    return;
  } else if (act === "folder-new") {
    S.creatingFolder = true;
    render(true);
    setTimeout(() => document.querySelector(".folder-input")?.focus(), 50);
    return;
  } else if (act === "folder-del") {
    const name = el.dataset.folder || "";
    if (name) askConfirm(`删除分类「${name}」？里面的曲目会移到「未分类」。`, { type: "folder", op: "remove", name });
    return;
  }
  render(true);
});

// 改名输入框：边打字边同步进 S.renaming，中途万一重绘也不会把字吞掉
document.addEventListener("input", (ev) => {
  const el = ev.target?.closest?.(".rename-input");
  if (!el || !S.renaming) return;
  if (el.dataset.rename === "title") S.renaming.title = el.value;
  else S.renaming.artist = el.value;
});
document.addEventListener("keydown", (ev) => {
  if (!S.renaming) return;
  if (ev.key === "Enter") {
    ev.preventDefault();
    document.querySelector('[data-act="rename-ok"]')?.click();
  } else if (ev.key === "Escape") {
    ev.preventDefault();
    S.renaming = null;
    render(true);
  }
});

// 全房间音量：拖动时会连续触发 input，节流成每 200ms 最多发一次，
// 松手（change）时立刻补发最终值，保证最后一个位置一定送达。
let volTimer = null;
let volPending = null;
function queueMasterVolume(v) {
  volPending = v;
  if (volTimer) return;
  volTimer = setTimeout(() => {
    volTimer = null;
    if (volPending === null) return;
    const val = volPending;
    volPending = null;
    command({ type: "settings", volume: val });
  }, 200);
}
function flushMasterVolume(v) {
  if (volTimer) {
    clearTimeout(volTimer);
    volTimer = null;
  }
  volPending = null;
  command({ type: "settings", volume: v });
}
// ---------- 进度条拖动 ----------
// 按下就跟手，松手才发一次命令：拖动过程完全不碰网络，所以是平滑的。
function dragTimeFrom(ev) {
  const d = S.drag;
  if (!d) return 0;
  const ratio = Math.min(1, Math.max(0, (ev.clientX - d.rect.left) / d.rect.width));
  return Math.max(0, Math.min(d.dur, ratio * d.dur));
}

function applyDrag(ev) {
  const t = dragTimeFrom(ev);
  S.drag.time = t;
  S.time = t;
  paintProgress(t, S.drag.dur);
}

// 分类菜单用捕获阶段处理：先于任何冒泡处理器执行，不会被别处的 stopPropagation 吞掉。
document.addEventListener(
  "click",
  (ev) => {
    try {
      const chip = ev.target.closest && ev.target.closest('[data-act="set-folder"]');
      if (!chip) return;
      ev.preventDefault();
      ev.stopPropagation();
      report("folder-move", { ok: "click", trackId: chip.dataset.id, folder: chip.dataset.folder });
      moveTrackTo(chip.dataset.id, chip.dataset.folder || "");
    } catch (e) {
      report("folder-move-error", { message: String((e && e.message) || e) });
    }
  },
  true
);
document.addEventListener("pointerdown", (ev) => {
  const host = ev.target.closest('[data-act="seek"]');
  if (!host) return;
  const dur = Number(S.now?.track?.duration || 0);
  if (!(dur > 0)) return;
  const bar = host.querySelector(".bar");
  if (!bar) return;
  S.drag = { rect: bar.getBoundingClientRect(), dur, time: 0 };
  try {
    host.setPointerCapture(ev.pointerId);
  } catch {}
  applyDrag(ev);
  ev.preventDefault();
});

document.addEventListener("pointermove", (ev) => {
  if (S.drag) applyDrag(ev);
});

document.addEventListener("pointerup", (ev) => {
  if (!S.drag) return;
  const target = dragTimeFrom(ev);
  S.drag = null;
  seekTo(target);
});

document.addEventListener("pointercancel", () => {
  S.drag = null;
});

/** 松手后：界面先跳到目标位置（不等服务器），再发命令并让引擎立刻刷新。 */
async function seekTo(seconds) {
  const dur = Number(S.now?.track?.duration || 0);
  const pos = Math.max(0, Math.min(dur || 1e9, seconds));
  const p = S.now?.playback;
  if (p) S.now = { ...S.now, playback: { ...p, position: pos, anchor: Date.now() + S.skew } };
  S.time = pos;
  paintProgress(pos, dur);
  await command({ type: "seek", position: pos });
  bus?.post({ t: "refresh" });
}

document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.id === "bili") S.biliUrl = el.value;
  else if (el.dataset.act === "vol") {
    markSlider();
    const v = Number(el.value) / 100;
    S.status.volume = v;
    bus?.post({ t: "volume", value: v });
    const label = el.closest(".field")?.querySelector(".hint") || el.parentElement?.querySelector(".vol-val");
    if (label) label.textContent = `${Math.round(v * 100)}%`;
  } else if (el.dataset.act === "master-vol") {
    markSlider();
    const v = Number(el.value) / 100;
    const label = document.querySelector("[data-master]");
    if (label) label.textContent = `${Math.round(v * 100)}%`;
    queueMasterVolume(v);
  }
});

/** 标记"正在拖滑块"：期间冻结重绘，停手 400ms 后补一次渲染。 */
function markSlider() {
  S.sliderActive = true;
  clearTimeout(S.sliderTimer);
  S.sliderTimer = setTimeout(() => {
    S.sliderActive = false;
    render(true);
  }, 400);
}

document.addEventListener("change", (ev) => {
  if (ev.target.id === "file") {
    doUpload(ev.target.files || []);
    ev.target.value = "";
  } else if (ev.target.id === "csv-file") {
    importPlaylistCsv(ev.target.files && ev.target.files[0]);
    ev.target.value = "";
  } else if (ev.target.dataset.act === "master-vol") {
    // 松手：立刻把最终音量发出去，不依赖节流定时器
    flushMasterVolume(Number(ev.target.value) / 100);
  }
});

// 拖拽：在面板任何位置松手都算，不再要求精确落在那个虚线框里。
// 这里不再预筛格式：能不能传只由 uploadTrack 的发送前校验判一次，判不过的文件给出错误卡片，
// 而不是被默默滤掉。
document.addEventListener("dragover", (ev) => {
  if (![...(ev.dataTransfer?.types || [])].includes("Files")) return;
  ev.preventDefault();
  ev.dataTransfer.dropEffect = "copy";
  ev.target.closest(".drop")?.classList.add("over");
});
document.addEventListener("dragleave", (ev) => ev.target.closest(".drop")?.classList.remove("over"));
document.addEventListener("drop", (ev) => {
  ev.preventDefault();
  document.querySelectorAll(".drop.over").forEach((el) => el.classList.remove("over"));
  const files = [...(ev.dataTransfer?.files || [])];
  if (!files.length) {
    // 从微信 / QQ / 部分网盘拖出来时，浏览器拿不到真实的文件流，
    // 以前是静默无反应，现在明确告诉用户改用按钮选择。
    toast("没有读取到文件，请用「添加」里的选择文件", "warn");
    return;
  }
  doUpload(files);
});

async function loadUpdateState() {
  try {
    const r = await apiGet("/api/update");
    S.upd = {
      current: r.current || "",
      latest: r.latest || "",
      hasUpdate: Boolean(r.hasUpdate),
      autoUpdate: r.autoUpdate !== false,
      ready: Boolean(r.ready),
      readyVersion: r.readyVersion || "",
    };
  } catch {}
}

// ---------- 启动 ----------
// 背景图：类名挂到 body 上，样式里只管 .has-bg 这一种形态；关掉就回到纯色底。
function applyBg() {
  document.body.classList.toggle("has-bg", Boolean(S.showBg));
}

async function boot() {
  applyBg();
  // 关页/刷新先把主持权交出去，别让旧令牌挂到 90 秒超时才放
  window.addEventListener("pagehide", releaseOnLeave);
  loadUpdateState().then(() => render(true)).catch(() => {});
  const { OBR, role, roomId, attempts, ready } = await initOBR();
  S.role = role;
  S.roomId = roomId;
  const tab = new URLSearchParams(location.search).get("tab");
  if (["list", "add", "settings"].includes(tab)) S.tab = tab;

  bus = createBus({ onMessage: onBus });
  bus.post({ t: "who" });
  render(true);

  setTimeout(() => {
    if (!heardBg && !engine) {
      engine = new Engine({ OBR, role, roomId, kind: "popover", attempts });
      engine.start();
    }
  }, 900);

  if (role === "GM") {
    setTimeout(refreshState, 700);
    setInterval(() => {
      if (!S.state) refreshState();
    }, 5000);
  }
  if (!ready) toast("OBR 没给就绪信号，部分功能可能不可用", "warn", 6000);
}

function onBus(msg) {
  switch (msg.t) {
    case "hello":
      if (msg.kind === "background") heardBg = true;
      break;
    case "engine-stopped":
      if (msg.kind === "popover") engine = null;
      break;
    case "now":
      S.now = msg.now;
      if (msg.now?.serverTime) S.skew = msg.now.serverTime - Date.now();
      // 广播回来的值已经跟服务端一致，乐观值该撤了（否则按钮会永远停在本地那次点击上）
      if (S.loopPending && msg.now?.playback?.loop === S.loopPending) S.loopPending = null;
      render();
      break;
    case "state":
      S.state = msg.state;
      render();
      scheduleProbeDurations();
      break;
    case "status": {
      // 上一次广播里有没有播放错误：下面要按「从没有变成有」触发，不能每帧都弹
      const hadError = Boolean(S.status?.error);
      S.status = msg.status || {};
      if (msg.status?.role && msg.status.role !== S.role) {
        const wasGM = S.role === "GM";
        S.role = msg.status.role;
        // 角色切成 GM 时把玩家那句提示一并清掉：GM 视图不渲染它，关闭键也只在玩家视图，
        // 标记会一直挂着；之后切回玩家，就会把一条早已过去的提示顶到眼前。
        if (!wasGM && S.role === "GM") S.playError = false;
      }
      if (msg.status?.hasToken) S.claimError = "";
      // 引擎拿不到控制权时必须说给 GM 听：以前只存在引擎里，界面一片安静，
      // 用户只看到「点了没反应」或者一句「不是本房间的主持」
      else if (msg.status?.claimError && S.role === "GM") S.claimError = msg.status.claimError;
      // 玩家自己那台播放器的错误（引擎把 `音频加载失败（code）` 放在 status.error 里）也必须到玩家眼前，
      // 而原文只给 GM 的设置页 —— 玩家侧只拿那句固定提示。边沿触发：错误一直挂着不重复弹，
      // 用户点 × 之后不会被下一帧广播顶回来，等下一次真出错再出现。
      if (S.role !== "GM" && S.status.error && !hadError) S.playError = true;
      // 连接断了也要在诊断里留一条：以前只把状态点变黄，界面上没有任何可读原因。
      // 引擎刚起来时首帧就是未连接，那不是「断了」，要真连上过才记。
      if (S.status.connected) sawConnected = true;
      else if (sawConnected) {
        sawConnected = false;
        diag("同步连接", "和服务端的连接断了");
      }
      render();
      break;
    }
    case "error":
      // 玩家视图不渲染 S.notice，toast 到不了玩家眼前；而 msg.error 是服务端原话，
      // 可能带内部字段名与错误码，F10 不许它出现在玩家侧 —— 玩家只拿那一句固定提示。
      if (S.role === "GM") toast(msg.error, "err");
      else {
        S.playError = true;
        render(true);
      }
      break;
  }
}

boot().catch((err) => {
  console.error(err);
  const view = document.getElementById("view");
  if (view) {
    view.innerHTML = `<div class="notice err">${icon("alert")}<span>扩展初始化失败：${esc(
      err.message || err
    )}</span></div><button class="btn primary block" onclick="location.reload()">重新加载</button>`;
  }
});
