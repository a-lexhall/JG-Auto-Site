# Setting up Pages CMS (for the site owner)

The Cars for sale page (`cars.html`) reads `Assets/data/cars.json` in the browser. Pages CMS (free, app.pagescms.org) gives a simple form for editing that file and uploading photos. Every save is a normal commit to `main`, so GitHub Pages republishes the site a minute or two later.

`.pages.yml` in the repo root tells Pages CMS what the form looks like and where photos go (`Assets/images/cars/`).

## 1. Connect the repo to Pages CMS (you, once)

1. Go to **app.pagescms.org** and sign in with your GitHub account.
2. When asked, install the **Pages CMS GitHub App**. Choose **Only select repositories** and pick **JG-Auto-Site**.
3. Open JG-Auto-Site. You should see **Cars for sale** in the left menu. (Before this branch is merged, `.pages.yml` only exists on the branch, so switch to that branch in Pages CMS if it offers a branch picker, or check after merging.)
4. Add a test car with a photo, save, and check it appears at www.jgauto.co.uk/cars.html. Then set it to Hidden or delete it.

## 2. Give your father-in-law access

**Option A: GitHub account (your original plan)**

1. He creates a free account at github.com/signup (you can do this with him). Note his username.
2. In the repo on GitHub: **Settings → Collaborators → Add people**, type his username, and send the invite.
3. He accepts the invite from the email GitHub sends him (or at github.com/notifications).
4. He signs in at app.pagescms.org with GitHub and opens JG-Auto-Site.

Note: a GitHub collaborator can technically change anything in the repo through github.com, not just the cars. In practice he'll only ever use Pages CMS.

**Option B: email invite, no GitHub account**

Pages CMS can also invite someone by email, and they can then edit content and photos without a GitHub account (they can't change `.pages.yml` or the code). Look for the Collaborators setting for the repo inside Pages CMS. This is simpler for him and safer for the repo, so it's worth trying first.

## 3. Send him the guide

Send him `docs/HOW-TO-LIST-A-CAR.md` (print it or paste it into an email). Button names in Pages CMS may differ slightly from the guide; walk through it once together.

## Good to know

- **Photos:** uploaded photos go into `Assets/images/cars/` in the repo. Phone photos are usually 2–5 MB each. That's fine for a handful of cars, but if the repo or page gets slow, resize them (e.g. to 1600 px wide) before uploading, or ask for an automatic resize step to be added.
- **Deleting a car doesn't delete its photos** from `Assets/images/cars/`. Tidy them up in Pages CMS's Media section now and then.
- **Order on the page:** cars for sale first, then sold cars, each in the order they're listed in Pages CMS.
- **Price:** empty or 0 shows POA. Sold cars don't show a price.
- **Hidden** cars are still in `cars.json` (which is public), so don't put anything private in them.
- **Updates showing:** GitHub Pages can cache files for up to 10 minutes. The page asks for a fresh copy of the list, so changes normally show within a couple of minutes of the site rebuilding.
