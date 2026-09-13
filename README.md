# Bisaya Bible API

A small, Render-ready REST API for **Biblica® Open Ang Pulong sa Dios™**, a Cebuano/Bisaya Bible translation. The API exposes books, chapters, verses, and full-text search.

## Run locally

```bash
npm install
npm run build-data
npm start
```

The server listens on `http://localhost:3000` (or `PORT` supplied by the environment).

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | API description and endpoint list |
| `GET /health` | Health check |
| `GET /api/books` | All books and chapter/verse counts |
| `GET /api/books/:book/chapters` | Chapters for a book |
| `GET /api/:book/:chapter` | All verses in a chapter |
| `GET /api/:book/:chapter/:verse` | One verse |
| `GET /api/search?q=gugma&limit=20` | Search verse text |

Example requests:

```text
GET /api/genesis/1
GET /api/juan/3/16
GET /api/search?q=gugma&limit=10
```

## Deploy to Render

1. Push this folder to a GitHub or GitLab repository.
2. In Render, create **New > Web Service** and connect the repository.
3. Use these settings:
   - **Environment:** Node
   - **Build command:** `npm install && npm run build-data`
   - **Start command:** `npm start`
   - **Instance type:** Free (or any paid instance)
4. Deploy. Render automatically provides the `PORT` environment variable.

The build command downloads the official Cebuano HTML source and generates `data/bible.json`, so the complete Bible does not need to be committed to Git.

## License and attribution

The source text is **Biblica® Open Ang Pulong sa Dios™** / **Biblica® Open Cebuano Contemporary Bible™**, made available under the **Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)**. The original work by Biblica, Inc. is available at [biblica.com](https://www.biblica.com/) and [open.bible](https://open.bible/). See the [official source details](https://ebible.org/find/details.php?id=cebocb) for the full license notice.

This API code is provided as an independent project. If you modify the generated Bible data or API, distribute your changes under CC BY-SA 4.0 where applicable and clearly indicate the changes.
