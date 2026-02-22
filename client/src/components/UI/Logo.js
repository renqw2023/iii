import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Logo组件 - III.PICS品牌标识
 * @param {Object} props - 组件属性
 * @param {string} props.size - 尺寸 ('sm', 'md', 'lg')
 * @param {boolean} props.showText - 是否显示文字
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.linkToHome - 是否链接到首页
 */
const Logo = ({ 
  size = 'md', 
  showText = true, 
  className = '', 
  linkToHome = true 
}) => {
  const sizeClasses = {
    sm: 'w-20 h-8',
    md: 'w-28 h-10',
    lg: 'w-36 h-12'
  };

  const LogoSVG = () => (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 120 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 背景渐变定义 */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#667eea', stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:'#764ba2', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#f093fb', stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:'#4f46e5', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#7c3aed', stopOpacity:1}} />
        </linearGradient>
      </defs>
      
      {/* Logo图标部分 - 三个创意圆点代表iii */}
      <g transform="translate(8, 8)">
        {/* 第一个圆点 - Inspire */}
        <circle cx="4" cy="12" r="3" fill="url(#logoGradient)" opacity="0.9">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="0s"/>
        </circle>
        
        {/* 第二个圆点 - Imagine */}
        <circle cx="12" cy="12" r="3" fill="url(#logoGradient)" opacity="0.8">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="0.7s"/>
        </circle>
        
        {/* 第三个圆点 - Innovate */}
        <circle cx="20" cy="12" r="3" fill="url(#logoGradient)" opacity="0.7">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="1.4s"/>
        </circle>
        
        {/* 连接线条，象征创意流动 */}
        <path d="M7 12 Q9.5 8 12 12 Q14.5 16 17 12" stroke="url(#logoGradient)" strokeWidth="1" fill="none" opacity="0.6"/>
      </g>
      
      {showText && (
        <g transform="translate(36, 8)">
          {/* III.PICS 文字 */}
          <text x="0" y="16" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="18" fontWeight="700" fill="url(#textGradient)">III</text>
          <text x="28" y="16" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="18" fontWeight="400" fill="#6b7280">.</text>
          <text x="34" y="16" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="18" fontWeight="600" fill="url(#textGradient)">PICS</text>
        </g>
      )}
      
      {/* 装饰性元素 - 小星星 */}
      <g opacity="0.4">
        <path d="M108 10 L109 12 L111 12 L109.5 13.5 L110 16 L108 14.5 L106 16 L106.5 13.5 L105 12 L107 12 Z" fill="url(#logoGradient)">
          <animateTransform attributeName="transform" type="rotate" values="0 108 13;360 108 13" dur="8s" repeatCount="indefinite"/>
        </path>
      </g>
    </svg>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-block hover:opacity-80 transition-opacity duration-200">
        <LogoSVG />
      </Link>
    );
  }

  return <LogoSVG />;
};

export default Logo;