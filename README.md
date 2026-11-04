# 住這裡 · RENT RADAR

Personal Taipei rental finder. Default requirements: 大同／中山、獨立套房、月租 18,000 元內、可申請租屋補助。民權西路站、台水台電優先。

```sh
npm ci
npm run dev
npm run build
```

GitHub Pages serves the generated `docs/` directory. The public JSON contains listing summaries and original links only. Scraping runs on the owner's computer and publishes sanitized snapshots; no Facebook login state, credentials, private messages, contact lists, or raw browser data belong in this repository.

Favorites are saved locally in each browser. Unknown subsidy, rent, or room type stays in 待確認. A listing summary is not a guarantee of availability, condition, subsidy eligibility, or utility billing.
