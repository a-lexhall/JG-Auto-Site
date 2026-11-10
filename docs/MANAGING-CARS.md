# Managing the cars for sale

The cars on <https://www.jgauto.co.uk/cars.html> come from an Airtable table.
Add a row in Airtable, and the car appears on the website by itself within about
half an hour. Nobody needs to touch the website code.

---

## Part 1 — Day to day (for whoever lists the cars)

1. Open the **Airtable** app on your phone, or <https://airtable.com> in a browser.
2. Open the **JG Auto** base, then the **Cars** table.
3. Tap **+** to add a row.
4. Fill in what you know. Only **Make**, **Model** and **Year** are really needed —
   leave anything else blank and it is simply left off the website.
5. Tap the **Photos** field and add pictures straight from your camera roll.
   The first photo is the one shown on the card; the rest appear as thumbnails.
6. Set **Status** to `Available`.

That's it. The car appears on the website within about 30 minutes.

### When a car sells

Change **Status** to `Sold`. The car stays on the page with a red **SOLD** badge,
which is good for showing what you shift. To take it off the page entirely,
delete the row.

### Working on a car that isn't ready yet

Set **Status** to `Draft`. It stays in Airtable but never reaches the website.

### Price

Fill in **Price** for a figure, or leave it blank and the website shows **POA**.

### Photos

Photograph the car in daylight, landscape (phone turned sideways), and keep the
whole car in frame. The website crops to a 4:3 box, so anything important at the
very top or bottom of a tall photo may be trimmed.

Photos are copied into the website and shrunk automatically — you do not need to
resize anything first.

---

## Part 2 — One-time setup (for whoever looks after the site)

### 1. Build the Airtable base

Create a base, and in it a table called **Cars** with these fields. The names must
match (capitalisation and spacing do not matter):

| Field         | Type              | Notes                                        |
| ------------- | ----------------- | -------------------------------------------- |
| `Make`        | Single line text  | e.g. Ford                                     |
| `Model`       | Single line text  | e.g. Focus                                    |
| `Year`        | Number (integer)  | e.g. 2018                                     |
| `Price`       | Currency (GBP)    | Blank shows "POA"                             |
| `Mileage`     | Number            |                                               |
| `Fuel`        | Single select     | Petrol, Diesel, Hybrid, Electric              |
| `Transmission`| Single select     | Manual, Automatic                             |
| `Engine`      | Single line text  | e.g. 1.0 EcoBoost                             |
| `Colour`      | Single line text  |                                               |
| `Doors`       | Number            |                                               |
| `MOT Expiry`  | Date              | Shown as month and year                       |
| `Description` | Long text         |                                               |
| `Photos`      | Attachment        | First photo is the main one                   |
| `Status`      | Single select     | **Available**, **Sold**, Draft                |

A few alternative names are accepted, so `Miles`, `Gearbox`, `Images` and `Notes`
also work if the table is already set up that way.

### 2. Create an Airtable access token

1. Go to <https://airtable.com/create/tokens>.
2. Create a token with the scope **`data.records:read`**, granted to this base only.
3. Copy the token — Airtable shows it once.

### 3. Add the two GitHub secrets

In the repository: **Settings → Secrets and variables → Actions → New repository secret**

| Name               | Value                                       |
| ------------------ | ------------------------------------------- |
| `AIRTABLE_TOKEN`   | the token from step 2                       |
| `AIRTABLE_BASE_ID` | the `app…` id from the base's API docs URL  |

If the table is not called `Cars`, add a repository **variable** (not a secret)
called `AIRTABLE_TABLE` with the real name.

Until both secrets exist the sync does nothing and logs a notice — it does not
fail, so there is no wall of red crosses before setup is finished.

### 4. Run it once by hand

**Actions → Sync cars from Airtable → Run workflow.** Check the log, then check
the page.

---

## How it works

`.github/workflows/sync-cars.yml` runs every 30 minutes. It calls
`scripts/build-cars.mjs`, which:

1. reads every row from the Airtable table;
2. downloads each photo, rotates it per its EXIF orientation, and writes WebP at
   600px and 1200px plus an 800px JPEG fallback into `Assets/images/cars/`;
3. writes the data to `Assets/data/cars.json`;
4. renders `cars.html` from `scripts/cars.template.html`;
5. commits, but only if something actually changed.

Photos are downloaded rather than linked because **Airtable attachment URLs expire
about two hours after they are issued** — a linked photo would disappear from the
site the same afternoon.

Photos are named after Airtable's own attachment id, so a photo that has not
changed is never downloaded twice, and runs where nothing changed produce no
commit at all.

### Changing the design

Edit `scripts/cars.template.html` (page furniture) or the `.car` rules in
`Assets/css/style.css`, then rebuild without touching Airtable:

```bash
npm install
npm run build:cars:offline
```

### Things worth knowing

- **Scheduled runs only happen on the default branch.** The sync starts working
  once this is merged into `main`.
- **GitHub pauses scheduled workflows after 60 days with no commits** to the
  repository. It emails first; re-enable from the Actions tab.
- **After the first sync, check the site actually updated.** The sync commits with
  the built-in `GITHUB_TOKEN`, which should trigger the Pages rebuild. If the
  commit lands but the live page is stale, re-run the `pages-build-deployment`
  workflow once and raise it — the fix is to commit with a personal access token
  instead.
- **Repository size.** Every photo is committed, and git keeps old versions
  forever. At roughly 250KB per photo, hundreds of cars a year will eventually
  need a history rewrite. Not a concern for years at a normal rate.
