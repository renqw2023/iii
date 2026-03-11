import React from 'react';
import './MeshBackground.css';

/**
 * MeshBackground — 动态彩色 Mesh Gradient 背景
 * 参考 MeiGen.ai 的纯 CSS 实现方案：
 *   两个大型光球层以不同速度反向漂浮旋转，
 *   通过 blur 滤镜产生柔和融合的 mesh 效果。
 */
const MeshBackground = ({ enabled = false }) => (
    <div
        className={`mesh-bg-container${enabled ? ' mesh-bg-container--enabled' : ''}`}
        aria-hidden="true"
    >
        <div className="mesh-bg-veil" />
        <div className="mesh-bg-wave" />
        <div className="mesh-bg-orb mesh-bg-orb--primary" />
        <div className="mesh-bg-orb mesh-bg-orb--secondary" />
        <div className="mesh-bg-orb mesh-bg-orb--tertiary" />
    </div>
);

export default MeshBackground;
