// 金额单位格式化：超亿显亿，超万显万，否则原值
const formatCurrency = (num) => {
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';
  if (num >= 10000) return (num / 10000).toFixed(2) + '万';
  return num.toFixed(2);
};

module.exports = { formatCurrency };
