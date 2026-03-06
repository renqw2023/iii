import { useCallback } from 'react';

const STORAGE_KEY = 'browsing_history';
const MAX_ITEMS = 50;

/**
 * 浏览历史 hook — 基于 localStorage，无需登录
 *
 * 记录结构: { id, type, title, image, url, visitedAt }
 * type: 'sref' | 'gallery' | 'seedance'
 */

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage quota exceeded — ignore
  }
}

export function useBrowsingHistory() {
  /**
   * 添加一条浏览记录
   * @param {{ id: string, type: string, title: string, image: string, url: string }} item
   */
  const addToHistory = useCallback((item) => {
    if (!item?.id || !item?.type) return;

    const history = readHistory();
    // 去重：移除已有相同 id+type 的旧记录
    const filtered = history.filter(h => !(h.id === item.id && h.type === item.type));
    const newEntry = { ...item, visitedAt: new Date().toISOString() };
    // 新记录插入头部，超出上限则截断
    const updated = [newEntry, ...filtered].slice(0, MAX_ITEMS);
    writeHistory(updated);
  }, []);

  /** 获取全部历史记录（最新在前）*/
  const getHistory = useCallback((type) => {
    const history = readHistory();
    return type ? history.filter(h => h.type === type) : history;
  }, []);

  /** 清空所有历史 */
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /** 移除单条 */
  const removeFromHistory = useCallback((id, type) => {
    const history = readHistory();
    writeHistory(history.filter(h => !(h.id === id && h.type === type)));
  }, []);

  return { addToHistory, getHistory, clearHistory, removeFromHistory };
}
