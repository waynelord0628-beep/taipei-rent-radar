import { money } from './data.js';
import {stationProfile} from './metro.js';

// This is a disclosed subtotal, never an invented all-inclusive monthly bill.
export function monthlyCost(item) {
  if (!Number.isFinite(item.rent)) return null;
  return item.rent + (Number.isFinite(item.managementFee) ? item.managementFee : 0);
}

export function costBreakdown(item) {
  if (!Number.isFinite(item.rent)) return '租金待確認';
  const fee = item.managementFee;
  return `租金 ${money(item.rent)}${fee == null ? ' · 管理費待確認' : ` ＋ 管理費 ${money(fee)}`}`;
}

export function questions(item) {
  const values = [];
  if (item.conflicts?.length) values.push('不同來源條件不一致');
  if (item.subsidy !== '可租補') values.push('是否可租補');
  if (item.managementFee == null) values.push('管理費');
  if (!item.water || item.water === '待確認') values.push('水費');
  if (!item.electric || item.electric === '待確認') values.push('電費');
  if (item.extraFee) values.push('其他費用是否重複計列');
  const station=stationProfile(item);
  if(station.origin&&!new RegExp(`距${station.origin}\\s*\\d+\\s*公尺`).test(item.stationText || ''))values.push(`${station.origin}站實際距離`);
  if (item.ambiguousPrice) values.push('補助前實際租金');
  return values;
}

export function advantages(item) {
  const station=stationProfile(item);
  return [station.focus?.meters<=800?`${station.origin}站附近（直線參考）`:station.method==='text_only'&&station.origin?`原文提及${station.origin}站`:null, item.water === '台水' && item.electric === '台電' ? '台水台電' : item.electric === '台電' && '台電計費', item.subsidy === '可租補' && '可租補'].filter(Boolean);
}

export function inquiry(item) {
  const missing = questions(item);
  return `您好，想詢問「${item.title}」是否還能看房？我們想找大同／中山的獨立套房。請問月租 ${money(item.rent)} 元是否為補助前價格、含哪些費用？${missing.length ? `也想確認：${missing.join('、')}。` : ''}請問是否接受兩人入住，以及方便看房的時間？謝謝。\n${item.url}`;
}
