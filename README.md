# 住這裡 · RENT RADAR

Personal Taipei rental finder. Default requirements: 大同／中山、獨立套房、月租 18,000 元內、可申請租屋補助。民權西路站、台水台電優先。

```sh
npm ci
npm run dev
npm run build
```

GitHub Pages serves the generated `docs/` directory. The public JSON contains listing summaries and original links only. Scraping runs sequentially on a dedicated VPS and publishes sanitized snapshots; no Facebook login state, credentials, private messages, contact lists, or raw browser data belong in this repository.

Favorites are saved locally in each browser. Unknown subsidy, rent, or room type stays in 待確認. A listing summary is not a guarantee of availability, condition, subsidy eligibility, or utility billing.

Personal decision tools: a three-home shortlist prioritizes 民權西路站, with explicit unknowns. Known monthly subtotal is rent plus disclosed management fee only; utility bills and ambiguous other fees are not guessed or double counted. Up to three homes can be compared side by side. Favorites and comparison choices remain in the current browser; previously saved homes stay visible even if their conditions no longer match. Inquiry text is copied locally and never sent automatically.

Validation: `node --test src/decision.test.js`, `npm run build`. Source collectors: 591 every10min, Facebook every2h; no local source scraping.

Duplicate advertisements are grouped with explicit evidence: a shared canonical 591 property link, the same complete detailed post, or the same full advertisement with only labelled rental/management prices changed. Street, floor and room numbers are not masked. Equal street names, equal rents and similar photographs alone do not merge listings. All source variants and links remain available; different known prices, fees, utilities or subsidy terms force review. Existing favorite/comparison IDs resolve through all member IDs.
Observed history starts with a labelled baseline for existing records, not invented past changes. Later snapshots retain rent, management fee, utility, subsidy and other important public-field changes in a private cloud SQLite archive. Public JSON includes the latest20 events per source and the total count. Missing posts are not marked rented. Parser-only changes with identical original text are identified separately; unknown-to-known prices are information completion, not price cuts. Activity filters cover the last7 days. No raw post bodies or credentials enter this archive or public history.
Additional checks: `node --test src/homes.test.js src/decision.test.js`.

### 近站與看房
民權西路／雙連優先，另含中山國小、行天宮、中山、松江南京、大橋頭。以來源座標至北捷公開出入口的直線距離排序；800公尺篩選可選，非實際步行距離。
房源明確出租／下架、頁面失效、久未確認分開標記，未出現在本輪列表不表示出租。看房進度與筆記只存目前瀏覽器，清除網站資料會遺失；日曆檔下載匯入後才會提醒，變更須另調整日曆。
接駁目的站為圓山、民權西路、中山國中、松山。官方捷運旅程時間不包含候車、到站步行及接駁班次。
