import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

/**
 * 让页面组件向全局 Sidebar 注入专属 Panel。
 * Panel 是一个 React 组件（函数），mount 时注册，unmount 时自动清除。
 *
 * 用法：
 *   import ExplorePanel from '../../components/Sidebar/ExplorePanel';
 *   const MyPage = () => { useSidebarPanel(ExplorePanel); ... }
 */
export const useSidebarPanel = (Panel) => {
  const { setSidebarPanel } = useSidebar();
  useEffect(() => {
    // 用函数形式传入，避免 React 把 Panel（组件函数）当作 setState updater 调用
    setSidebarPanel(() => Panel);
    return () => setSidebarPanel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );
  // 当前注入的 Panel 组件（函数）
  const [SidebarPanel, setSidebarPanel] = useState(null);

  const toggleCollapsed = () => {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed, SidebarPanel, setSidebarPanel }}>
      {children}
    </SidebarContext.Provider>
  );
};
