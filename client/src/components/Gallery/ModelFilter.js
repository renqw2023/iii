import React from 'react';
import { motion } from 'framer-motion';

const MODELS = [
    { key: 'all', label: 'All', icon: '🔥' },
    { key: 'nanobanana', label: 'NanoBanana Pro', icon: '🍌' },
    { key: 'midjourney', label: 'Midjourney', icon: '🎨' },
    { key: 'gptimage', label: 'GPT Image', icon: '🤖' },
];

const ModelFilter = ({ activeModel, onChange }) => {
    return (
        <div className="model-filter">
            {MODELS.map((model) => (
                <motion.button
                    key={model.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChange(model.key)}
                    className={`model-filter-btn ${activeModel === model.key ? 'active' : ''}`}
                >
                    <span className="model-filter-icon">{model.icon}</span>
                    <span>{model.label}</span>
                </motion.button>
            ))}
        </div>
    );
};

export default ModelFilter;
