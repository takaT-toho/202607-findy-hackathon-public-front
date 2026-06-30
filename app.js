// デフォルトのハッカソン環境URL (セキュリティ保護のため公開用リポジトリ上は空にします)
const DEFAULT_URLS = {
  mock: "",
  target: "",
  sre: ""
};

// 起動時の初期化処理
window.addEventListener('DOMContentLoaded', () => {
  initUrls();
  updateUrls();
});

// URL設定 of 初期読み込み
function initUrls() {
  const params = new URLSearchParams(window.location.search);
  
  // 各フィールドの値を決定（クエリパラメータ > LocalStorage > デフォルト値）
  const mockVal = params.get('mock') || localStorage.getItem('demo_url_mock') || DEFAULT_URLS.mock;
  const targetVal = params.get('target') || localStorage.getItem('demo_url_target') || DEFAULT_URLS.target;
  const sreVal = params.get('sre') || localStorage.getItem('demo_url_sre') || DEFAULT_URLS.sre;

  // インプット要素に設定
  document.getElementById('url-mockapi').value = mockVal;
  document.getElementById('url-targetapp').value = targetVal;
  document.getElementById('url-sreagent').value = sreVal;
}

// URL入力の変更検知とUI側リンク/コマンドの書き換え
function updateUrls() {
  const rawMock = document.getElementById('url-mockapi').value.trim();
  const rawTarget = document.getElementById('url-targetapp').value.trim();
  const rawSre = document.getElementById('url-sreagent').value.trim();

  const mockUrl = normalizeUrl(rawMock || DEFAULT_URLS.mock);
  const targetUrl = normalizeUrl(rawTarget || DEFAULT_URLS.target);
  const sreUrl = normalizeUrl(rawSre || DEFAULT_URLS.sre);

  // ローカルストレージへの永続化（入力がある場合のみ）
  if (rawMock) localStorage.setItem('demo_url_mock', mockUrl);
  if (rawTarget) localStorage.setItem('demo_url_target', targetUrl);
  if (rawSre) localStorage.setItem('demo_url_sre', sreUrl);

  // コマンド/表示用のフォールバックテキスト
  const dispMock = mockUrl || "https://[MockApi_URL]";
  const dispTarget = targetUrl || "https://[TargetApp_URL]";
  const dispSre = sreUrl || "https://[SreAgent_URL]";

  // 1. 各ボタンのリンク先（href）を書き換え
  setLinkHelper('link-targetapp', targetUrl, '上部の「デモ環境のURL設定」で TargetApp のURLを設定してください。');
  setLinkHelper('link-sreagent', sreUrl, '上部の「デモ環境のURL設定」で SreAgent のURLを設定してください。');
  setLinkHelper('link-trigger-drift', mockUrl ? `${mockUrl}/api/transit/status?useNewSchema=true` : '', '上部の「デモ環境のURL設定」で MockApi のURLを設定してください。');
  setLinkHelper('link-trigger-restore', mockUrl ? `${mockUrl}/api/transit/status?useNewSchema=false` : '', '上部の「デモ環境のURL設定」で MockApi のURLを設定してください。');

  // 2. 各コピー用curlコマンドのテキストを書き換え
  document.getElementById('cmd-drift').textContent = `curl -sS "${dispMock}/api/transit/status?useNewSchema=true"`;
  document.getElementById('cmd-fetch').textContent = `curl -sS -X POST "${dispTarget}/trigger-fetch" -d ''`;
  document.getElementById('cmd-restore').textContent = `curl -sS "${dispMock}/api/transit/status?useNewSchema=false"`;
}

// リンク有効化と警告制御のヘルパー
function setLinkHelper(elementId, url, alertMsg) {
  const el = document.getElementById(elementId);
  if (url && url.startsWith('http')) {
    el.href = url;
    el.onclick = null;
  } else {
    el.href = "javascript:void(0);";
    el.onclick = (e) => {
      e.preventDefault();
      alert(alertMsg);
      document.querySelector('.config-panel').scrollIntoView({ behavior: 'smooth' });
    };
  }
}

// URL末尾の不要なスラッシュを取り除くヘルパー
function normalizeUrl(url) {
  let u = url.trim();
  if (u.endsWith('/')) {
    u = u.slice(0, -1);
  }
  return u;
}

// 共有URLの生成とコピー
function copyShareUrl() {
  const mockUrl = document.getElementById('url-mockapi').value;
  const targetUrl = document.getElementById('url-targetapp').value;
  const sreUrl = document.getElementById('url-sreagent').value;

  // 現在のベースURL（パラメータなし）を取得
  const baseUrl = window.location.origin + window.location.pathname;
  
  // クエリパラメータを構築
  const params = new URLSearchParams();
  if (mockUrl) params.set('mock', normalizeUrl(mockUrl));
  if (targetUrl) params.set('target', normalizeUrl(targetUrl));
  if (sreUrl) params.set('sre', normalizeUrl(sreUrl));

  const shareUrl = `${baseUrl}?${params.toString()}`;

  // クリップボードにコピー
  copyTextToClipboard(shareUrl, "共有用URLをコピーしました！");
}

// コマンドテキストのコピー
function copyCommand(elementId) {
  const text = document.getElementById(elementId).textContent;
  copyTextToClipboard(text, "コマンドをコピーしました！");
}

// クリップボード書き込みとトースト表示の共通関数
function copyTextToClipboard(text, message) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(message);
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
      fallbackCopy(text, message);
    });
  } else {
    fallbackCopy(text, message);
  }
}

// レガシーブラウザ向けフォールバック
function fallbackCopy(text, message) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showToast(message);
  } catch (err) {
    console.error("Fallback copy failed: ", err);
  }
  document.body.removeChild(textarea);
}

// トースト通知の表示制御
function showToast(message) {
  const toast = document.getElementById('toast-message');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// タイムラインログのトグル（アコーディオン）
function toggleLog(element) {
  const isExpanded = element.classList.contains('expanded');
  
  // 全ログを閉じる
  document.querySelectorAll('.timeline-item').forEach(item => {
    item.classList.remove('expanded');
  });

  // 自身を開く
  if (!isExpanded) {
    element.classList.add('expanded');
  }
}
