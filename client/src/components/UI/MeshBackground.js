import React from 'react';
import './MeshBackground.css';

/**
 * MeshBackground — MeiGen.ai 精确复刻
 * 白色底 + 2个浮动光球 + mix-blend-mode: normal + 低透明度颜色叠加
 * 光球颜色/尺寸/blur 均为 MeiGen 实测精确值。
 */
const MeshBackground = ({ enabled = false }) => (
    <div
        className={`mesh-bg-container${enabled ? ' mesh-bg-container--enabled' : ''}`}
        aria-hidden="true"
    >
        {/* 光球1：inset -60%，blur 60px，mesh-orbit 16s */}
        <div
            className="mesh-bg-orb mesh-bg-orb--primary"
            style={{
                inset: '-60%',
                background: [
                    'radial-gradient(80% 60% at 10% 20%, rgba(41,130,255,0.42) 0%, transparent 50%)',
                    'radial-gradient(60% 80% at 90% 30%, rgba(184,112,255,0.38) 0%, transparent 50%)',
                    'radial-gradient(50% 70% at 30% 60%, rgba(255,166,77,0.38) 0%, transparent 50%)',
                    'radial-gradient(60% 60% at 70% 70%, rgba(247,247,247,0.5) 0%, transparent 50%)',
                ].join(', '),
                filter: 'blur(60px)',
            }}
        />
        {/* 光球2：inset -40%，blur 80px，mesh-orbit-reverse 20s */}
        <div
            className="mesh-bg-orb mesh-bg-orb--secondary"
            style={{
                inset: '-40%',
                background: [
                    'radial-gradient(55% 45% at 80% 10%, rgba(61,158,255,0.42) 0%, transparent 45%)',
                    'radial-gradient(45% 55% at 20% 90%, rgba(210,126,252,0.38) 0%, transparent 45%)',
                    'radial-gradient(50% 50% at 60% 50%, rgba(255,160,92,0.38) 0%, transparent 45%)',
                ].join(', '),
                filter: 'blur(80px)',
            }}
        />
    </div>
);

export default MeshBackground;
