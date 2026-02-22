import React from 'react';
import { motion } from 'framer-motion';

const DEFAULT_TAGS = [
    { key: 'all', label: 'All' },
    { key: 'product', label: 'Product' },
    { key: 'photography', label: 'Photography' },
    { key: 'food-drink', label: 'Food' },
    { key: '3d-render', label: '3D' },
    { key: 'portrait-selfie', label: 'Portrait' },
    { key: 'anime-manga', label: 'Anime' },
    { key: 'cinematic-film-still', label: 'Cinematic' },
    { key: 'illustration', label: 'Illustration' },
    { key: 'cyberpunk-sci-fi', label: 'Sci-Fi' },
];

const TagFilter = ({ activeTag, onChange, customTags }) => {
    const tags = customTags || DEFAULT_TAGS;

    return (
        <div className="tag-filter">
            <div className="tag-filter-scroll">
                {tags.map((tag) => (
                    <motion.button
                        key={tag.key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onChange(tag.key)}
                        className={`tag-filter-btn ${activeTag === tag.key ? 'active' : ''}`}
                    >
                        {tag.label}
                        {tag.count && <span className="tag-count">{tag.count}</span>}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default TagFilter;
