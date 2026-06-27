/**
 * Spam detection service
 * Checks messages for suspicious patterns
 */

const SPAM_KEYWORDS = [
  'free money', 'click here', 'winner', 'prize', 'lottery',
  'earn money fast', 'work from home', 'buy now', 'limited offer',
  'act now', 'no cost', 'risk free', 'congratulations you won',
  'make money online', 'bitcoin investment', 'crypto opportunity'
];

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const SUSPICIOUS_DOMAINS = ['bit.ly', 'tinyurl', 'shorturl', 'rebrand.ly'];

const checkSpam = (content) => {
  if (!content || typeof content !== 'string') {
    return { isSpam: false, reason: null };
  }

  const lowerContent = content.toLowerCase();

  // Check for spam keywords
  for (const keyword of SPAM_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      return { isSpam: true, reason: `Message contains spam keyword: "${keyword}"` };
    }
  }

  // Check for excessive URLs (more than 3)
  const urls = content.match(URL_REGEX) || [];
  if (urls.length > 3) {
    return { isSpam: true, reason: 'Message contains too many URLs' };
  }

  // Check for suspicious shortened URLs
  for (const url of urls) {
    for (const domain of SUSPICIOUS_DOMAINS) {
      if (url.toLowerCase().includes(domain)) {
        return { isSpam: true, reason: `Message contains suspicious shortened URL from ${domain}` };
      }
    }
  }

  // Check for repeated content (same phrase repeated 3+ times)
  const words = content.split(' ');
  if (words.length > 5) {
    const phrases = {};
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ').toLowerCase();
      phrases[phrase] = (phrases[phrase] || 0) + 1;
      if (phrases[phrase] >= 3) {
        return { isSpam: true, reason: 'Message contains excessively repeated content' };
      }
    }
  }

  // Check for all caps (more than 80% of message)
  const upperCount = content.replace(/[^A-Z]/g, '').length;
  const letterCount = content.replace(/[^a-zA-Z]/g, '').length;
  if (letterCount > 20 && (upperCount / letterCount) > 0.8) {
    return { isSpam: true, reason: 'Message is mostly in caps (shouting)' };
  }

  return { isSpam: false, reason: null };
};

module.exports = { checkSpam };
