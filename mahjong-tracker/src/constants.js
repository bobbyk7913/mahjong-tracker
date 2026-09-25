// Frontend-only constants.
// ⚠️ 注意：firestore.rules 無法 import 呢個檔案，invite code 喺 Rules 係獨立部署嘅副本。
// 呢度只集中前端 pre-check 用嘅值，唔代表安全驗證；真正權限由 Firestore Rules 執行。

export const MASTER_INVITE_CODE = 'MJ191919';

export const COLLECTIONS = {
  USERS: 'users',
  GAMES: 'games',
};

export const LOCAL_STORAGE_KEYS = {
  SHOW_APPROVED_WELCOME: 'show_approved_welcome',
};

export const ROUTES = {
  DASHBOARD: '/',
  ADD: '/add',
  ANALYTICS: '/analytics',
};
