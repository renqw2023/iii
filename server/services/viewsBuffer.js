/**
 * viewsBuffer.js
 * 视图计数内存 buffer — 避免每次详情页访问触发 MongoDB 写操作
 * 每 30 秒批量 bulkWrite $inc，大幅减少写热点
 */
const GalleryPrompt  = require('../models/GalleryPrompt');
const SrefStyle      = require('../models/SrefStyle');
const SeedancePrompt = require('../models/SeedancePrompt');

const MODEL_MAP = {
  gallery:  GalleryPrompt,
  sref:     SrefStyle,
  seedance: SeedancePrompt,
};

// 三个独立 Map：key = ObjectId 字符串，value = 累计次数
const buffers = {
  gallery:  new Map(),
  seedance: new Map(),
  sref:     new Map(),
};

/**
 * 记录一次视图，只写内存，不走 DB
 * @param {'gallery'|'sref'|'seedance'} type
 * @param {string} id  MongoDB ObjectId 字符串
 */
function increment(type, id) {
  const buf = buffers[type];
  if (!buf) return;
  buf.set(id, (buf.get(id) || 0) + 1);
}

/**
 * 将 buffer 内容批量写入 MongoDB，然后清空 buffer
 */
async function flush() {
  for (const [type, buf] of Object.entries(buffers)) {
    if (!buf.size) continue;
    const entries = [...buf.entries()];
    buf.clear();
    const Model = MODEL_MAP[type];
    try {
      await Model.bulkWrite(
        entries.map(([id, count]) => ({
          updateOne: {
            filter: { _id: id },
            update: { $inc: { views: count } },
          },
        })),
        { ordered: false }
      );
    } catch (err) {
      console.error(`[viewsBuffer] flush ${type} 失败:`, err.message);
    }
  }
}

// 每 30 秒自动刷新一次
setInterval(flush, 30 * 1000);

module.exports = { increment };
