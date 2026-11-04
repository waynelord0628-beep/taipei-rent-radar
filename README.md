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
