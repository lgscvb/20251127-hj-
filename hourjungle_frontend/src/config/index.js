/**
 * 全局配置文件
 * 集中管理所有环境变量和配置
 */

// API基础URL - 自動判斷環境
// localhost 用 :8000 (本地開發)，其他環境直接用 /api (生產環境)
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalDev
  ? `${window.location.protocol}//${window.location.hostname}:8000/api`
  : `${window.location.protocol}//${window.location.hostname}/api`;
// API相关配置
const API_CONFIG = {
  baseURL: API_URL,
  timeout: 55107,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

// 本地开发时可以使用绝对URL (仅在开发环境)
// process.env.NODE_ENV === 'development' 
//   ? 'http://localhost:8000/api'
//   : '/api';

// 版本信息
const APP_VERSION = '1.0.0';

// 分页默认设置
const DEFAULT_PAGE_SIZE = 10;

// 其他全局配置...
const CONFIG = {
  // 默认头像
  DEFAULT_AVATAR: '/assets/images/default-avatar.png',
  // 系统名称
  SYSTEM_NAME: '时刻丛林管理系统',
  // 上传文件大小限制(MB)
  MAX_UPLOAD_SIZE: 5,
  // 添加API配置
  api: API_CONFIG
};

export {
  API_URL,
  APP_VERSION,
  DEFAULT_PAGE_SIZE,
  CONFIG
}; 