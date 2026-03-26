import React, { useState, useEffect, useCallback } from 'react';
import { useRegisterSEO } from '../hooks/useSEO';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Check, X, Loader2, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { enhancedAuthAPI } from '../services/enhancedApi';
import { galleryAPI } from '../services/galleryApi';
import LoadingSpinner from '../components/UI/LoadingSpinner';

/* ─────────────────────────────────────────────────────────
   Local image pool — 50 curated ImageFlow images
   ───────────────────────────────────────────────────────── */
const LOCAL_POOL = [
  '/ImageFlow/GwEJdZvXMAAPFwO.jpg',
  '/ImageFlow/GwEJemrXYAAUgJ_.jpg',
  '/ImageFlow/GwINamzW4AAwgd_.jpg',
  '/ImageFlow/Gwh-1-GXoAAJjki.jpg',
  '/ImageFlow/GvWoI6FXEAAEGz3.jpg',
  '/ImageFlow/GvWoI7AWsAApcLa.jpg',
  '/ImageFlow/GumzC2laYAAYF43.jpg',
  '/ImageFlow/GvWVgNOXAA0ytGq.jpg',
  '/ImageFlow/GwsszPNbgAEword.jpg',
  '/ImageFlow/GwsszbTbgAIYPzX.jpg',
  '/ImageFlow/GwsszwSbgAE8pcK.jpg',
  '/ImageFlow/GwIRGQiWwAAHCf1.jpg',
  '/ImageFlow/GwIRG_vWAAAq9G0.jpg',
  '/ImageFlow/GwIRH2aXIAAJPn9.jpg',
  '/ImageFlow/GwIRIisXsAAJTQu.jpg',
  '/ImageFlow/Gw4Kz1CXcAAls62.jpg',
  '/ImageFlow/Gw4K0CbXoAAb-Ar.jpg',
  '/ImageFlow/Gw4K0OCXUAAa8o9.jpg',
  '/ImageFlow/Gw4K0b4WAAAYPbH.jpg',
  '/ImageFlow/Gw7EOLoXUAAhilH.jpg',
  '/ImageFlow/Gw7EObaXAAAUhT9.jpg',
  '/ImageFlow/Gw7EOoHXQAABmXh.jpg',
  '/ImageFlow/Gw7EO3FXMAAAJd1.jpg',
  '/ImageFlow/GxBV_VPWsAE8uRV.jpg',
  '/ImageFlow/GxBWAUAXwAAyrCT.jpg',
  '/ImageFlow/GxBWBZsWsAAFAgk.jpg',
  '/ImageFlow/Gw-rO6hWQAAKnwS.jpg',
  '/ImageFlow/GvwBH3JXMAAZ1fw.jpg',
  '/ImageFlow/GvwBIIfWYAAvcXs.jpg',
  '/ImageFlow/GvwBIYbWcAA7ofr.jpg',
  '/ImageFlow/GvAjbNIaMAAlgPs.jpg',
  '/ImageFlow/Gv0Djd6aQAEH3S9.jpg',
  '/ImageFlow/GwDfjRAawAAdWAe.jpg',
  '/ImageFlow/GwDfjbEaIAAAM8Y.jpg',
  '/ImageFlow/Gv1KtYIWMAUsrLV.jpg',
  '/ImageFlow/Gv1Ktm9WMAApFiw.jpg',
  '/ImageFlow/Gu2QBi7bkAAuapw.jpg',
  '/ImageFlow/Gu2QB3la4AAf8N5.jpg',
  '/ImageFlow/Gu7aESnbAAAjJe1.jpg',
  '/ImageFlow/Gur7e_kaQAA4ck7.jpg',
  '/ImageFlow/Gur7fJ7aAAAYQue.jpg',
  '/ImageFlow/Gur7fTTaIAAmTHd.jpg',
  '/ImageFlow/Gur7fdka4AAiSbs.jpg',
  '/ImageFlow/Gv51s9BbQAAVo-D.jpg',
  '/ImageFlow/Gv51tIpbUAAbTcd.jpg',
  '/ImageFlow/Gq6_erGXsAAHFYP.jpg',
  '/ImageFlow/GZ8ptTwW0AAMUiC.jpg',
  '/ImageFlow/GZ8pBUFWMAAu4GE.jpg',
  '/ImageFlow/GqxXfJtXcAEX5u0.jpg',
  '/ImageFlow/GvjhLUwW4AAZ76p.jpg',
  '/ImageFlow/GwOAVyLWUAMoXD9.jpg',
  '/ImageFlow/GuhqGhyaoAUHMli.jpg',
  '/ImageFlow/GuhqG3yaoAIgFPi.jpg',
  '/ImageFlow/GvVJyFsbMAAFqO_.jpg',
  '/ImageFlow/GvVJyhuaYAMG94a.jpg',
  '/ImageFlow/GucgSkPbEAAe1sZ.jpg',
  '/ImageFlow/GucgS5kbgAAZNAn.jpg',
  '/ImageFlow/Gv2BpbkWoAAb3aE.jpg',
  '/ImageFlow/Gv4HlLXXkAAijLW.jpg',
  '/ImageFlow/Gv4HlczXkAA4Fad.jpg',
  '/ImageFlow/Gv4HlrFXoAAxwri.jpg',
  '/ImageFlow/Gv4Hl5NXsAAKySz.jpg',
  '/ImageFlow/GvjhLhxXcAEdBIg.jpg',
  '/ImageFlow/GvjhLvUWcAAS0oT.jpg',
  '/ImageFlow/GuH57E3bAAAqTa_.jpg',
  '/ImageFlow/GuH57RIbMAAUpw3.jpg',
  '/ImageFlow/GuH57djbYAAmctE.jpg',
  '/ImageFlow/GuH57oEb0AETQib.jpg',
  '/ImageFlow/GqxXwMLWIAAZ4Nz.jpg',
  '/ImageFlow/GqxX6iPXMAAVdpR.jpg',
  '/ImageFlow/GqxZBPQWYAAKNKB.jpg',
  '/ImageFlow/GxGcjHTa0AEWD5u.jpg',
  '/ImageFlow/Gv4p3s3XMAEemEi.jpg',
  '/ImageFlow/Gv4p4ITWEAAUA0m.jpg',
  '/ImageFlow/Gv4p4T7XQAAFFhv.jpg',
  '/ImageFlow/Gvy98oYWMAAh-Sl.jpg',
  '/ImageFlow/Gv7LO78WkAASVvN.jpg',
  '/ImageFlow/GvurY1BbEAAYMrZ.jpg',
  '/ImageFlow/GvmJZ7IWQAAkXyf.jpg',
  '/ImageFlow/GvmJaXRXcAA_tge.jpg',
  '/ImageFlow/GwNxqavbsAAPIWv.jpg',
  '/ImageFlow/GwNxqnQbcAAXPKU.jpg',
  '/ImageFlow/Gqcdbu2W0AAjH8a.jpg',
  '/ImageFlow/GqcdjxOXYAAF-6k.jpg',
  '/ImageFlow/GqceNngXgAAcY5h.jpg',
  '/ImageFlow/GqcfMbIWQAAwv0_.jpg',
  '/ImageFlow/GZ8pBUEWkAAn5Z0.jpg',
  '/ImageFlow/GZ8pBUHW4AA2gxN.jpg',
  '/ImageFlow/Gq6_erYW8AAIoqH.jpg',
  '/ImageFlow/GxGcjHTa0AEWD5u.jpg',
  '/ImageFlow/GvaSO7WbcAAqK1.jpg',
  '/ImageFlow/Gv4p3s3XMAEemEi.jpg',
];

/* ─────────────────────────────────────────────────────────
   Ring configuration
   Inner  (rIdx 0): 8  images × 128 px — low parallax
   Middle (rIdx 1): 12 images ×  98 px — medium parallax
   Outer  (rIdx 2): 8  images ×  70 px — high parallax + DB images
   ───────────────────────────────────────────────────────── */
/*
  5-ring layout — outer rings are LARGER (firework shrapnel grows as it expands):
  inner → nucleus guard (small, tight)
  mid rings → growing
  outer → largest (leading edge of the explosion)
*/
const RINGS = [
  { r: 270,  count: 12, size:  78, parallax: 0.007 },
  { r: 440,  count: 18, size: 100, parallax: 0.014 },
  { r: 620,  count: 24, size: 126, parallax: 0.021 },
  { r: 830,  count: 22, size: 154, parallax: 0.030 },
  { r: 1050, count: 16, size: 134, parallax: 0.040 },
];

/* ── Fisher-Yates shuffle ── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─────────────────────────────────────────────────────────
   buildSlots — compute polar positions for all 28 images.
   Called once on mount via useState initialiser.
   ───────────────────────────────────────────────────────── */
function buildSlots(pool) {
  const imgs = shuffle(pool);
  const slots = [];
  let idx = 0;

  RINGS.forEach((ring, rIdx) => {
    // Offset each ring's start angle so images don't stack at the same angle
    const angleOffset = rIdx * (Math.PI / 6);

    for (let i = 0; i < ring.count; i++) {
      const angle = angleOffset + (2 * Math.PI * i) / ring.count;
      // Small random jitter to break the mechanical grid look
      const jx = (Math.random() - 0.5) * 44;
      const jy = (Math.random() - 0.5) * 44;

      slots.push({
        id:          `r${rIdx}-${i}`,
        finalX:      ring.r * Math.cos(angle) + jx,
        finalY:      ring.r * Math.sin(angle) + jy,
        rotation:    (Math.random() - 0.5) * 30,
        size:        ring.size,
        parallax:    ring.parallax,
        src:         imgs[idx % imgs.length],
        driftAmp:    5 + Math.random() * 10,
        driftDur:    4.5 + Math.random() * 4.5,
        driftDelay:  Math.random() * 3.5,
        // Stagger: outer ring images get a slight extra delay so inner ones land first
        burstDelay:  0.5 + idx * 0.038 + rIdx * 0.05,
        isOuter:     rIdx === 2,
      });
      idx++;
    }
  });

  return slots;
}

/* ─────────────────────────────────────────────────────────
   ImageSlot — memoised component that owns its
   useTransform hooks (Rules of Hooks: must be a component,
   not called inside .map).
   ───────────────────────────────────────────────────────── */
const ImageSlot = React.memo(({ slot, springX, springY }) => {
  // Derive x / y purely from motion values — zero React re-renders on mouse move
  const x = useTransform(springX, (v) => slot.finalX + v * slot.parallax);
  const y = useTransform(springY, (v) => slot.finalY + v * slot.parallax);

  return (
    <motion.div
      style={{
        position:   'absolute',
        left:       '50%',
        top:        '50%',
        width:       slot.size,
        height:      slot.size,
        marginLeft: -slot.size / 2,
        marginTop:  -slot.size / 2,
        x,
        y,
        rotate:      slot.rotation,
        borderRadius: 18,
        overflow:    'hidden',
        boxShadow:   '0 6px 28px rgba(0,0,0,0.16)',
        border:      '2px solid rgba(255,255,255,0.58)',
        willChange:  'transform',
      }}
      // Burst: scale 0→1, fade in, spring physics
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.88 }}
      transition={{
        delay:      slot.burstDelay,
        type:       'spring',
        stiffness:  100,
        damping:    16,
        opacity:    { duration: 0.4, delay: slot.burstDelay },
      }}
    >
      {/* Continuous drift animation — inner wrapper */}
      <motion.div
        style={{ width: '100%', height: '100%' }}
        animate={{ y: [0, -slot.driftAmp, 0, slot.driftAmp * 0.55, 0] }}
        transition={{
          duration:   slot.driftDur,
          delay:      slot.burstDelay + slot.driftDelay + 0.6,
          repeat:     Infinity,
          repeatType: 'loop',
          ease:       'easeInOut',
        }}
      >
        <img
          src={slot.src}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </motion.div>
    </motion.div>
  );
});

/* ─────────────────────────────────────────────────────────
   FireworkCore — glowing nucleus rendered between images
   and form (z-index 5). Pulsing rings, ray beams, sparks.
   ───────────────────────────────────────────────────────── */
const RING_RADII = [148, 248, 358];

const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * 45 - 90) * (Math.PI / 180);
  return {
    x:     Math.round(192 * Math.cos(angle)),
    y:     Math.round(192 * Math.sin(angle)),
    color: i % 2 === 0 ? 'rgba(99,102,241,0.9)' : 'rgba(168,85,247,0.88)',
    dur:   1.4 + i * 0.22,
  };
});

const FireworkCore = () => (
  /* Zero-size absolute anchor at 50%/50% — children overflow freely */
  <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, zIndex: 5 }}>

    {/* ── Ambient radial glow ── */}
    <motion.div
      style={{
        position:     'absolute',
        width:         700, height: 700,
        marginLeft:   -350, marginTop: -350,
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(168,85,247,0.07) 38%, transparent 68%)',
        filter:       'blur(26px)',
      }}
      animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* ── Inner bright core ── */}
    <motion.div
      style={{
        position:     'absolute',
        width:         180, height: 180,
        marginLeft:   -90, marginTop: -90,
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(99,102,241,0.08) 50%, transparent 100%)',
        filter:       'blur(10px)',
      }}
      animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* ── Pulsing concentric rings ── */}
    {RING_RADII.map((r, i) => (
      <motion.div
        key={r}
        style={{
          position:     'absolute',
          width:         r * 2, height: r * 2,
          marginLeft:   -r, marginTop: -r,
          borderRadius: '50%',
          border:       `1px solid rgba(${i === 0 ? '255,255,255,0.20' : '99,102,241,' + (0.18 - i * 0.05)})`,
        }}
        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.75, 0.18, 0.75] }}
        transition={{ duration: 2.2 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.45 }}
      />
    ))}

    {/* ── 16 ray beams (alternating long / short) ── */}
    {Array.from({ length: 16 }, (_, i) => {
      const long = i % 2 === 0;
      const len  = long ? 238 : 176;
      return (
        <motion.div
          key={`ray-${i}`}
          style={{
            position:        'absolute',
            width:            1.5,
            height:           len,
            left:            -0.75,
            top:             -len,
            transformOrigin: 'bottom center',
            transform:       `rotate(${i * 22.5}deg)`,
            background:      i % 3 === 0
              ? 'linear-gradient(to top, rgba(255,255,255,0.24), rgba(99,102,241,0.14), transparent)'
              : 'linear-gradient(to top, rgba(99,102,241,0.30), rgba(168,85,247,0.12), transparent)',
          }}
          animate={{ opacity: [0.22, 0.72, 0.22] }}
          transition={{
            duration: 1.6 + (i % 4) * 0.45,
            repeat:   Infinity,
            ease:     'easeInOut',
            delay:    i * 0.07,
          }}
        />
      );
    })}

    {/* ── Sparkle dots at r≈192 ── */}
    {SPARKS.map((sp, i) => (
      <motion.div
        key={`sp-${i}`}
        style={{
          position:     'absolute',
          width:         5, height: 5,
          marginLeft:   sp.x - 2.5,
          marginTop:    sp.y - 2.5,
          borderRadius: '50%',
          background:    sp.color,
          boxShadow:    `0 0 8px ${sp.color}`,
        }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.9, 0.15, 0.9] }}
        transition={{ duration: sp.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
      />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Register — main component
   All form logic is preserved exactly as original.
   Only the JSX visual wrapper is changed.
═══════════════════════════════════════════════════════════ */
const Register = () => {
  useRegisterSEO();
  const { t, i18n } = useTranslation();

  /* ── Form state (unchanged) ── */
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [validationStatus, setValidationStatus] = useState({
    username:        { checking: false, valid: null, message: '' },
    email:           { checking: false, valid: null, message: '' },
    password:        { valid: null, message: '' },
    confirmPassword: { valid: null, message: '' },
  });
  const [debounceTimers, setDebounceTimers] = useState({});

  const { register, loginWithGoogle, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(
    searchParams.get('ref') || searchParams.get('invite') || ''
  );

  /* ── Fireworks state ── */
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 55, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 55, damping: 22 });
  const [slots, setSlots] = useState(() => buildSlots(LOCAL_POOL));

  /* ── Parallax: update motion values on mouse move (no setState) ── */
  const handleMouseMove = useCallback((e) => {
    mouseX.set(e.clientX - window.innerWidth  / 2);
    mouseY.set(e.clientY - window.innerHeight / 2);
  }, [mouseX, mouseY]);

  /* ── Async: replace outer ring with DB featured images ── */
  useEffect(() => {
    galleryAPI.getFeatured(18)
      .then((res) => {
        const dbImgs = (res.data?.prompts || [])
          .map((p) => p.previewImage)
          .filter(Boolean);
        if (!dbImgs.length) return;
        setSlots((prev) => {
          let outerCount = 0;
          return prev.map((slot) =>
            slot.isOuter && outerCount < dbImgs.length
              ? { ...slot, src: dbImgs[outerCount++] }
              : slot
          );
        });
      })
      .catch(() => {}); // silent fallback — local images remain
  }, []);

  /* ── Redirect if already logged in ── */
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  /* ── Cleanup timers ── */
  useEffect(() => {
    return () => Object.values(debounceTimers).forEach(clearTimeout);
  }, [debounceTimers]);

  /* ── Username check ── */
  const debouncedCheckUsername = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setValidationStatus(prev => ({
        ...prev,
        username: { checking: false, valid: false, message: t('validation.username.minLength') }
      }));
      return;
    }
    if (username.length > 20) {
      setValidationStatus(prev => ({
        ...prev,
        username: { checking: false, valid: false, message: t('validation.username.maxLength') }
      }));
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setValidationStatus(prev => ({
        ...prev,
        username: { checking: false, valid: false, message: t('validation.username.format') }
      }));
      return;
    }
    setValidationStatus(prev => ({
      ...prev,
      username: { checking: true, valid: null, message: t('validation.checking') }
    }));
    try {
      const response = await enhancedAuthAPI.checkUsername(username);
      setValidationStatus(prev => ({
        ...prev,
        username: { checking: false, valid: response.data.available, message: response.data.message }
      }));
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        username: {
          checking: false,
          valid: false,
          message: error.response?.data?.message || t('validation.username.checkFailed'),
        }
      }));
    }
  }, [t]);

  /* ── Email check ── */
  const debouncedCheckEmail = useCallback(async (email) => {
    if (!email) {
      setValidationStatus(prev => ({
        ...prev,
        email: { checking: false, valid: false, message: t('validation.email.required') }
      }));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationStatus(prev => ({
        ...prev,
        email: { checking: false, valid: false, message: t('validation.email.invalid') }
      }));
      return;
    }
    setValidationStatus(prev => ({
      ...prev,
      email: { checking: true, valid: null, message: t('validation.checking') }
    }));
    try {
      const response = await enhancedAuthAPI.checkEmail(email);
      setValidationStatus(prev => ({
        ...prev,
        email: { checking: false, valid: response.data.available, message: response.data.message }
      }));
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        email: {
          checking: false,
          valid: false,
          message: error.response?.data?.message || t('validation.email.checkFailed'),
        }
      }));
    }
  }, [t]);

  /* ── Password validation ── */
  const validatePassword = useCallback((password) => {
    if (!password) return { valid: false, message: t('validation.password.required') };
    if (password.length < 6) return { valid: false, message: t('validation.password.minLength') };
    return { valid: true, message: t('validation.password.valid') };
  }, [t]);

  const validateConfirmPassword = useCallback((password, confirmPassword) => {
    if (!confirmPassword) return { valid: false, message: t('validation.confirmPassword.required') };
    if (password !== confirmPassword) return { valid: false, message: t('validation.confirmPassword.mismatch') };
    return { valid: true, message: t('validation.confirmPassword.valid') };
  }, [t]);

  /* ── Field change handler ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'username') {
      if (debounceTimers.username) clearTimeout(debounceTimers.username);
      const timer = setTimeout(() => debouncedCheckUsername(value), 500);
      setDebounceTimers(prev => ({ ...prev, username: timer }));
    } else if (name === 'email') {
      if (debounceTimers.email) clearTimeout(debounceTimers.email);
      const timer = setTimeout(() => debouncedCheckEmail(value), 500);
      setDebounceTimers(prev => ({ ...prev, email: timer }));
    } else if (name === 'password') {
      const passwordValidation = validatePassword(value);
      setValidationStatus(prev => ({ ...prev, password: passwordValidation }));
      if (formData.confirmPassword) {
        setValidationStatus(prev => ({
          ...prev,
          confirmPassword: validateConfirmPassword(value, formData.confirmPassword),
        }));
      }
    } else if (name === 'confirmPassword') {
      setValidationStatus(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(formData.password, value),
      }));
    }
  };

  /* ── Validation indicator ── */
  const ValidationIndicator = ({ status, className = '' }) => {
    if (status.checking) {
      return (
        <div className={`flex items-center text-blue-600 ${className}`}>
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
          <span className="text-sm">{status.message}</span>
        </div>
      );
    }
    if (status.valid === true) {
      return (
        <div className={`flex items-center text-green-600 ${className}`}>
          <Check className="w-4 h-4 mr-1" />
          <span className="text-sm">{status.message}</span>
        </div>
      );
    }
    if (status.valid === false) {
      return (
        <div className={`flex items-center text-red-600 ${className}`}>
          <X className="w-4 h-4 mr-1" />
          <span className="text-sm">{status.message}</span>
        </div>
      );
    }
    return null;
  };

  /* ── Form validation ── */
  const validateForm = () => {
    const newErrors = {};
    if (!validationStatus.username.valid)
      newErrors.username = validationStatus.username.message || t('validation.username.invalid');
    if (!validationStatus.email.valid)
      newErrors.email = validationStatus.email.message || t('validation.email.invalid');
    if (!validationStatus.password.valid)
      newErrors.password = validationStatus.password.message || t('validation.password.invalid');
    if (!validationStatus.confirmPassword.valid)
      newErrors.confirmPassword = validationStatus.confirmPassword.message || t('validation.confirmPassword.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { confirmPassword, ...registerData } = formData;
    if (inviteCode.trim()) registerData.inviteCode = inviteCode.trim().toUpperCase();
    const result = await register(registerData);
    if (result.success) {
      if (result.data?.needVerification) {
        navigate('/verify-email', {
          state: {
            userId: result.data.userId,
            email: result.data.email,
            emailSendFailed: result.data.emailSendFailed || false,
          },
          replace: true,
        });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  /* ── Google OAuth ── */
  const handleGoogleSuccess = async (credentialResponse) => {
    const result = await loginWithGoogle(credentialResponse.credential, inviteCode);
    if (result.success) navigate('/', { replace: true });
  };

  /* ─────────────────────────────────────────────────────────
     Render
     ───────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        position:   'relative',
        minHeight:  '100vh',
        background: 'var(--page-bg)',
        overflow:   'hidden',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* ── Fireworks image layer + FireworkCore nucleus ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {slots.map((slot) => (
          <ImageSlot key={slot.id} slot={slot} springX={springX} springY={springY} />
        ))}
        {/* FireworkCore sits above images (z-index:5) but below form (z-index:10) */}
        <FireworkCore />
      </div>

      {/* ── Form layer ── */}
      <div
        style={{
          position:       'relative',
          zIndex:         10,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          minHeight:      '100vh',
          padding:        '80px 20px 48px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ position: 'relative' }}>
                <Sparkles
                  style={{ width: 40, height: 40, color: 'var(--accent-primary)' }}
                />
                <div
                  style={{
                    position:     'absolute',
                    inset:        0,
                    background:   'var(--accent-primary)',
                    opacity:      0.22,
                    borderRadius: '50%',
                    filter:       'blur(14px)',
                  }}
                />
              </div>
            </div>
            <h2
              style={{
                fontSize:   28,
                fontWeight: 700,
                color:      'var(--text-primary)',
                margin:     0,
              }}
            >
              {t('register.title')}
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)', margin: '8px 0 0' }}>
              {t('register.subtitle')}
            </p>
          </motion.div>

          {/* Form card — glass morphism */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            style={{
              background:           'var(--stage-bg)',
              backdropFilter:       'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border:               '1px solid var(--stage-border)',
              borderRadius:         28,
              padding:              32,
              boxShadow: [
                'var(--stage-shadow)',
                '0 0 0 1.5px rgba(99,102,241,0.22)',
                '0 0 36px rgba(99,102,241,0.11)',
                '0 0 72px rgba(168,85,247,0.07)',
              ].join(', '),
            }}
          >
            {/* Google Sign-in */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {}}
                theme="outline"
                size="large"
                text="signup_with"
                locale={i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US'}
                width="280"
              />
              <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                {t('register.googleNote')}
              </p>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('register.orEmail')}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('register.username')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`input pl-10 pr-10 ${
                      validationStatus.username.valid === false
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : validationStatus.username.valid === true
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                        : ''
                    }`}
                    placeholder={t('register.usernamePlaceholder')}
                  />
                  {validationStatus.username.checking && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
                  )}
                  {validationStatus.username.valid === true && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  )}
                  {validationStatus.username.valid === false && (
                    <X className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                  )}
                </div>
                {validationStatus.username.message && (
                  <ValidationIndicator status={validationStatus.username} className="mt-1" />
                )}
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('register.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input pl-10 pr-10 ${
                      validationStatus.email.valid === false
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : validationStatus.email.valid === true
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                        : ''
                    }`}
                    placeholder={t('register.emailPlaceholder')}
                  />
                  {validationStatus.email.checking && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
                  )}
                  {validationStatus.email.valid === true && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  )}
                  {validationStatus.email.valid === false && (
                    <X className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                  )}
                </div>
                {validationStatus.email.message && (
                  <ValidationIndicator status={validationStatus.email} className="mt-1" />
                )}
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('register.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input pl-10 pr-20 ${
                      validationStatus.password.valid === false
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : validationStatus.password.valid === true
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                        : ''
                    }`}
                    placeholder={t('register.passwordPlaceholder')}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {validationStatus.password.valid === true && <Check className="text-green-500 w-4 h-4" />}
                    {validationStatus.password.valid === false && <X className="text-red-500 w-4 h-4" />}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {validationStatus.password.message && (
                  <ValidationIndicator status={validationStatus.password} className="mt-1" />
                )}
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('register.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input pl-10 pr-20 ${
                      validationStatus.confirmPassword.valid === false
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : validationStatus.confirmPassword.valid === true
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                        : ''
                    }`}
                    placeholder={t('register.confirmPasswordPlaceholder')}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {validationStatus.confirmPassword.valid === true && <Check className="text-green-500 w-4 h-4" />}
                    {validationStatus.confirmPassword.valid === false && <X className="text-red-500 w-4 h-4" />}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {validationStatus.confirmPassword.message && (
                  <ValidationIndicator status={validationStatus.confirmPassword} className="mt-1" />
                )}
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {/* Invite code */}
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('register.inviteCode')}{' '}
                  <span className="text-slate-400 font-normal">
                    ({t('register.inviteCodeDesc')})
                  </span>
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="input pl-10 uppercase tracking-widest"
                    placeholder={t('register.inviteCodePlaceholder')}
                    maxLength={8}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-slate-700">
                  {t('register.agreeToTerms')}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500 mx-1">
                    {t('register.termsOfService')}
                  </Link>
                  {t('register.and')}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500 mx-1">
                    {t('register.privacyPolicy')}
                  </Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-base font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    {t('register.registering')}
                  </div>
                ) : (
                  t('register.createAccount')
                )}
              </button>

              {/* Login link */}
              <div className="text-center">
                <span className="text-slate-600">{t('register.login.text')}</span>
                <Link
                  to="/login"
                  className="ml-1 font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
                >
                  {t('register.login.link')}
                </Link>
              </div>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Register;
