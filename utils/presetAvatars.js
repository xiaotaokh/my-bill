// 内置预设头像和昵称数据，多处页面共用同一份数据
// 使用位置: index.js（新用户创建）、account.js（设置页随机选择）、user-stats.js（用户列表兜底头像）

const PRESET_AVATARS = [
  // 太阳 - 温暖阳光
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FFD93D"/><circle cx="50" cy="50" r="25" fill="%23FF6B6B"/><line x1="50" y1="10" x2="50" y2="25" stroke="%23FFD93D" stroke-width="4"/><line x1="50" y1="75" x2="50" y2="90" stroke="%23FFD93D" stroke-width="4"/><line x1="10" y1="50" x2="25" y2="50" stroke="%23FFD93D" stroke-width="4"/><line x1="75" y1="50" x2="90" y2="50" stroke="%23FFD93D" stroke-width="4"/><line x1="22" y1="22" x2="32" y2="32" stroke="%23FFD93D" stroke-width="4"/><line x1="68" y1="68" x2="78" y2="78" stroke="%23FFD93D" stroke-width="4"/><line x1="78" y1="22" x2="68" y2="32" stroke="%23FFD93D" stroke-width="4"/><line x1="32" y1="68" x2="22" y2="78" stroke="%23FFD93D" stroke-width="4"/></svg>',
  // 云朵 - 自由飘逸
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2387CEEB"/><ellipse cx="50" cy="55" rx="35" ry="25" fill="%23fff"/><circle cx="30" cy="50" r="20" fill="%23fff"/><circle cx="70" cy="50" r="20" fill="%23fff"/><circle cx="50" cy="40" r="22" fill="%23fff"/></svg>',
  // 月亮 - 宁静夜晚
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%232C3E50"/><circle cx="50" cy="50" r="35" fill="%23F5F5DC"/><circle cx="65" cy="50" r="25" fill="%232C3E50"/><circle cx="20" cy="25" r="3" fill="%23fff"/><circle cx="75" cy="30" r="2" fill="%23fff"/><circle cx="85" cy="60" r="2" fill="%23fff"/></svg>',
  // 花朵 - 绽放美好
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2396CEB4"/><circle cx="50" cy="50" r="12" fill="%23FFD93D"/><circle cx="50" cy="30" r="15" fill="%23FF69B4"/><circle cx="30" cy="45" r="15" fill="%23FF69B4"/><circle cx="70" cy="45" r="15" fill="%23FF69B4"/><circle cx="35" cy="65" r="15" fill="%23FF69B4"/><circle cx="65" cy="65" r="15" fill="%23FF69B4"/></svg>',
  // 彩虹 - 多彩缤纷
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23fff"/><path d="M20 70 Q50 20 80 70" stroke="%23E74C3C" stroke-width="6" fill="none"/><path d="M25 70 Q50 25 75 70" stroke="%23F39C12" stroke-width="6" fill="none"/><path d="M30 70 Q50 30 70 70" stroke="%23F1C40F" stroke-width="6" fill="none"/><path d="M35 70 Q50 35 65 70" stroke="%2327AE60" stroke-width="6" fill="none"/><path d="M40 70 Q50 40 60 70" stroke="%233498DB" stroke-width="6" fill="none"/><path d="M45 70 Q50 45 55 70" stroke="%239B59B6" stroke-width="6" fill="none"/></svg>',
  // 心形 - 温暖爱心
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FFC0CB"/><path d="M50 75 C25 55 20 35 35 30 C50 25 50 40 50 45 C50 40 50 25 65 30 C80 35 75 55 50 75" fill="%23E91E63"/></svg>',
  // 水滴 - 清澈纯净
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%234ECDC4"/><path d="M50 20 Q30 45 30 60 Q30 80 50 85 Q70 80 70 60 Q70 45 50 20" fill="%23fff"/><ellipse cx="50" cy="60" rx="15" ry="20" fill="%234ECDC4" opacity="0.5"/></svg>',
  // 山峰 - 坚毅稳重
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2385C1E9"/><polygon points="50,25 25,70 75,70" fill="%232C3E50"/><polygon points="50,35 35,70 65,70" fill="%23fff"/><polygon points="70,45 55,70 85,70" fill="%235D6D7E"/></svg>',
  // 闪电 - 充满活力
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%233498DB"/><polygon points="55,15 35,50 50,50 45,85 65,50 50,50" fill="%23F1C40F"/></svg>',
  // 音乐音符 - 艺术爱好
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23BB8FCE"/><circle cx="35" cy="70" r="10" fill="%23fff"/><circle cx="65" cy="60" r="10" fill="%23fff"/><rect x="43" y="25" width="4" height="45" fill="%23fff"/><rect x="73" y="20" width="4" height="40" fill="%23fff"/><path d="M47 25 L77 20" stroke="%23fff" stroke-width="4" fill="none"/></svg>',
  // 戴眼镜的学者
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%235D6D7E"/><circle cx="35" cy="42" r="8" fill="none" stroke="%23fff" stroke-width="2"/><circle cx="65" cy="42" r="8" fill="none" stroke="%23fff" stroke-width="2"/><line x1="43" y1="42" x2="57" y2="42" stroke="%23fff" stroke-width="2"/><circle cx="35" cy="42" r="3" fill="%23fff"/><circle cx="65" cy="42" r="3" fill="%23fff"/><path d="M35 65 Q50 72 65 65" stroke="%23fff" stroke-width="3" fill="none"/></svg>',
  // 戴帽子的旅行者
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23F39C12"/><ellipse cx="50" cy="18" rx="35" ry="12" fill="%238B4513"/><rect x="35" y="18" width="30" height="8" fill="%238B4513"/><circle cx="35" cy="45" r="5" fill="%23333"/><circle cx="65" cy="45" r="5" fill="%23333"/><path d="M35 60 Q50 68 65 60" stroke="%23333" stroke-width="3" fill="none"/></svg>',
  // 大笑表情
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FF9F43"/><path d="M25 35 L35 45" stroke="%23333" stroke-width="3"/><path d="M65 35 L75 45" stroke="%23333" stroke-width="3"/><path d="M25 45 L35 35" stroke="%23333" stroke-width="3"/><path d="M65 45 L75 35" stroke="%23333" stroke-width="3"/><path d="M25 58 Q50 80 75 58" stroke="%23333" stroke-width="3" fill="%23333"/></svg>',
  // 思考者
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%239B59B6"/><circle cx="35" cy="42" r="5" fill="%23fff"/><circle cx="65" cy="42" r="5" fill="%23fff"/><circle cx="37" cy="40" r="2" fill="%23333"/><circle cx="67" cy="40" r="2" fill="%23333"/><path d="M40 65 L50 60 L60 65" stroke="%23fff" stroke-width="3" fill="none"/></svg>',
  // 爱心头像
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23E91E63"/><path d="M50 70 C30 50 25 35 35 30 C45 25 50 35 50 40 C50 35 55 25 65 30 C75 35 70 50 50 70" fill="%23fff"/></svg>',
  // 星星头像
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%232C3E50"/><polygon points="50,20 56,38 75,38 60,50 66,68 50,58 34,68 40,50 25,38 44,38" fill="%23F1C40F"/></svg>',
  // 小猫咪
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FFE4C4"/><polygon points="20,25 30,45 25,45" fill="%23FFE4C4"/><polygon points="80,25 70,45 75,45" fill="%23FFE4C4"/><circle cx="35" cy="45" r="8" fill="%232C3E50"/><circle cx="65" cy="45" r="8" fill="%232C3E50"/><circle cx="37" cy="43" r="3" fill="%23fff"/><circle cx="67" cy="43" r="3" fill="%23fff"/><ellipse cx="50" cy="55" rx="6" ry="4" fill="%23FFE4C4"/><path d="M44 62 Q50 68 56 62" stroke="%232C3E50" stroke-width="2" fill="none"/></svg>',
  // 小熊猫
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23fff"/><circle cx="50" cy="50" r="35" fill="%232C3E50"/><circle cx="20" cy="25" r="12" fill="%232C3E50"/><circle cx="80" cy="25" r="12" fill="%232C3E50"/><circle cx="35" cy="45" r="10" fill="%23fff"/><circle cx="65" cy="45" r="10" fill="%23fff"/><circle cx="35" cy="45" r="5" fill="%232C3E50"/><circle cx="65" cy="45" r="5" fill="%232C3E50"/><ellipse cx="50" cy="60" rx="8" ry="5" fill="%232C3E50"/></svg>',
  // 机器人
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%233498DB"/><rect x="25" y="30" width="50" height="40" rx="5" fill="%232C3E50"/><rect x="30" y="38" width="15" height="10" rx="2" fill="%23E74C3C"/><rect x="55" y="38" width="15" height="10" rx="2" fill="%23E74C3C"/><rect x="40" y="58" width="20" height="8" rx="2" fill="%233498DB"/><rect x="45" y="15" width="10" height="15" fill="%232C3E50"/><circle cx="50" cy="15" r="5" fill="%23E74C3C"/></svg>',
  // 书虫
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2327AE60"/><rect x="25" y="55" width="50" height="25" rx="3" fill="%23fff"/><line x1="50" y1="55" x2="50" y2="80" stroke="%232C3E50" stroke-width="2"/><path d="M25 55 Q35 50 50 55" stroke="%2327AE60" stroke-width="2" fill="none"/><path d="M50 55 Q65 50 75 55" stroke="%2327AE60" stroke-width="2" fill="none"/><circle cx="35" cy="40" r="5" fill="%23fff"/><circle cx="65" cy="40" r="5" fill="%23fff"/><circle cx="37" cy="38" r="2" fill="%232C3E50"/><circle cx="67" cy="38" r="2" fill="%232C3E50"/></svg>',
  // 圣诞树 - 自然生机
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%232ECC71"/><polygon points="50,15 30,45 70,45" fill="%231E8449"/><polygon points="50,25 33,50 67,50" fill="%231E8449"/><polygon points="50,35 36,58 64,58" fill="%231E8449"/><rect x="46" y="58" width="8" height="12" fill="%238B4513"/><circle cx="50" cy="18" r="4" fill="%23F1C40F"/></svg>',
  // 小房子 - 温馨家园
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23E67E22"/><polygon points="50,18 22,42 78,42" fill="%238B4513"/><rect x="32" y="42" width="36" height="30" fill="%23FFF8DC"/><rect x="46" y="52" width="12" height="20" fill="%238B4513"/><rect x="36" y="48" width="10" height="10" fill="%2387CEEB"/></svg>',
  // 火箭 - 探索未来
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%238E44AD"/><path d="M50 15 L40 45 L50 40 L60 45 Z" fill="%23fff"/><rect x="44" y="45" width="12" height="25" rx="2" fill="%23ECF0F1"/><polygon points="42,68 58,68 54,78 46,78" fill="%23E74C3C"/><circle cx="50" cy="28" r="5" fill="%23E74C3C"/><circle cx="48" cy="27" r="2" fill="%23fff"/></svg>',
  // 调色板 - 艺术创作
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23F5DEB3"/><ellipse cx="50" cy="52" rx="35" ry="30" fill="%238B4513"/><circle cx="35" cy="38" r="7" fill="%23E74C3C"/><circle cx="65" cy="35" r="7" fill="%23F1C40F"/><circle cx="72" cy="55" r="7" fill="%2327AE60"/><circle cx="55" cy="65" r="7" fill="%233498DB"/><circle cx="32" cy="60" r="7" fill="%239B59B6"/><circle cx="50" cy="52" r="6" fill="%238B4513"/></svg>',
  // 海浪 - 自由奔放
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%233498DB"/><path d="M10 50 Q25 35 40 50 Q55 65 70 50 Q85 35 95 50" fill="none" stroke="%23fff" stroke-width="5"/><path d="M15 65 Q30 50 45 65 Q60 80 75 65 Q85 55 95 65" fill="none" stroke="%23ECF0F1" stroke-width="4"/><path d="M20 80 Q35 65 50 80 Q65 95 80 80" fill="none" stroke="%23fff" stroke-width="3" opacity="0.6"/></svg>',
  // 蝴蝶 - 美丽蜕变
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23FD79A8"/><ellipse cx="32" cy="40" rx="15" ry="10" fill="%23fff" transform="rotate(-30 32 40)"/><ellipse cx="68" cy="40" rx="15" ry="10" fill="%23fff" transform="rotate(30 68 40)"/><ellipse cx="30" cy="58" rx="10" ry="8" fill="%23fff" transform="rotate(-15 30 58)"/><ellipse cx="70" cy="58" rx="10" ry="8" fill="%23fff" transform="rotate(15 70 58)"/><rect x="48" y="35" width="4" height="30" rx="2" fill="%232C3E50"/><circle cx="50" cy="32" r="4" fill="%232C3E50"/></svg>',
  // 四叶草 - 幸运符号
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2327AE60"/><path d="M50 25 C42 20 35 28 40 35 L50 42 L60 35 C65 28 58 20 50 25" fill="%231E8449"/><path d="M50 75 C42 80 35 72 40 65 L50 58 L60 65 C65 72 58 80 50 75" fill="%231E8449"/><path d="M25 50 C20 42 28 35 35 40 L42 50 L35 60 C28 65 20 58 25 50" fill="%231E8449"/><path d="M75 50 C80 42 72 35 65 40 L58 50 L65 60 C72 65 80 58 75 50" fill="%231E8449"/><rect x="48" y="42" width="4" height="20" rx="1" fill="%231E8449"/></svg>',
  // 热气球 - 云端漫游
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%2387CEEB"/><ellipse cx="50" cy="35" rx="22" ry="25" fill="%23E74C3C"/><path d="M28 45 Q50 20 72 45" stroke="%23F1C40F" stroke-width="4" fill="none"/><line x1="35" y1="60" x2="30" y2="75" stroke="%238B4513" stroke-width="2"/><line x1="41" y1="60" x2="38" y2="75" stroke="%238B4513" stroke-width="2"/><line x1="59" y1="60" x2="62" y2="75" stroke="%238B4513" stroke-width="2"/><line x1="65" y1="60" x2="70" y2="75" stroke="%238B4513" stroke-width="2"/><rect x="32" y="72" width="36" height="10" rx="2" fill="%238B4513"/><circle cx="50" cy="35" r="5" fill="%23F1C40F"/></svg>',
  // 小鸟 - 和平自由
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%231ABC9C"/><ellipse cx="50" cy="45" rx="20" ry="15" fill="%23fff"/><circle cx="35" cy="42" r="5" fill="%23fff"/><circle cx="33" cy="41" r="2" fill="%232C3E50"/><polygon points="48,30 45,35 60,38" fill="%23F39C12"/><path d="M65 55 Q75 50 80 58" fill="none" stroke="%23fff" stroke-width="4" stroke-linecap="round"/><path d="M60 62 Q72 58 78 65" fill="none" stroke="%23fff" stroke-width="3" stroke-linecap="round"/><rect x="44" y="58" width="3" height="10" fill="%23F39C12"/></svg>',
  // 皇冠 - 自信闪耀
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="%23F1C40F"/><polygon points="20,45 30,25 40,35 50,20 60,35 70,25 80,45" fill="%23F39C12"/><rect x="22" y="45" width="56" height="12" rx="2" fill="%23F39C12"/><circle cx="30" cy="25" r="3" fill="%23E74C3C"/><circle cx="50" cy="20" r="4" fill="%233498DB"/><circle cx="70" cy="25" r="3" fill="%2327AE60"/><circle cx="45" cy="45" r="2" fill="%23E74C3C"/><circle cx="55" cy="45" r="2" fill="%233498DB"/></svg>'
];

const PRESET_NICKNAMES = [
  // 🌸 温暖治愈类
  '小确幸', '暖阳儿', '棉花糖', '奶油泡芙', '甜甜圈', '小太阳', '暖心窝', '小暖炉', '棉花云', '暖宝宝',
  // 🌙 星辰浪漫类
  '追星星', '月亮船', '星河漫步', '流星雨', '夜空中', '银河系', '小星星', '月光下', '星空梦', '摘月亮',
  // 🌿 自然清新类
  '小清新', '薄荷糖', '青草香', '小绿叶', '晨露珠', '清风徐', '白云朵', '小雨滴', '春暖花开', '微风起',
  // 🐱 萌宠可爱类
  '小奶猫', '小仓鼠', '小熊猫', '小企鹅', '小海豚', '小兔子', '小松鼠', '小考拉', '小刺猬', '小绵羊',
  // 🎵 音乐艺术类
  '小音符', '钢琴键', '吉他手', '小画笔', '调色板', '小诗人', '故事书', '小作家', '阅读者', '文艺范',
  // 🌈 活泼快乐类
  '开心果', '乐天派', '笑脸儿', '笑嘻嘻', '乐呵呵', '小快乐', '阳光派', '正能量', '活力满满', '元气满满',
  // 🏔️ 旅行探索类
  '小旅人', '背包客', '冒险家', '探索者', '山海间', '云游者', '小行者', '徒步者', '远方来', '在路上',
  // 🌸 花语美好类
  '小雏菊', '玫瑰花', '向日葵', '薰衣草', '樱花雨', '蒲公英', '茉莉花', '满天星', '小百合', '郁金香',
  // ☕ 生活态度类
  '慢生活', '小闲适', '简简单', '悠哉游', '小惬意', '自由派', '随性走', '小自在', '逍遥游', '小洒脱',
  // ✨ 梦想未来类
  '追梦人', '梦想家', '筑梦者', '小未来', '向前冲', '努力家', '小坚持', '奋斗派', '小目标', '向远方'
];

module.exports = { PRESET_AVATARS, PRESET_NICKNAMES };
