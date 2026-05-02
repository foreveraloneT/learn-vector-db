import type { TopicGroup } from './topics';
import type { Locale } from './i18n';

export const groupLabels: Record<TopicGroup, Record<Locale, string>> = {
  math: { th: 'พื้นฐานคณิตศาสตร์', en: 'Math foundations' },
  'vector-db': { th: 'ฐานข้อมูลเวกเตอร์', en: 'Vector databases' },
  'real-world': { th: 'ตัวอย่างจริง', en: 'Real-world examples' },
};
