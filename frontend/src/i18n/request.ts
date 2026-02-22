import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
 
  if (!locale || !['ru', 'zh'].includes(locale)) {
    locale = 'ru';
  }
 
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const defaultMessages = (await import(`../../messages/ru.json`)).default;

  return {
    locale,
    messages: deepMerge(defaultMessages, messages)
  };
});

function deepMerge(target: any, source: any) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}