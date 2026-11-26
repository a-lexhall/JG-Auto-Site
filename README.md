# JG Auto Service website

Source for [www.jgauto.co.uk](https://www.jgauto.co.uk/), the website for JG Auto Service, a family-run car repair and servicing garage in Alloa (est. 1972).

It's a small static site (no build step) hosted on GitHub Pages. The custom domain is set in `CNAME`.

## What's on the page

- About the business, with a photo of the workshop
- List of services
- Opening hours and contact details (tap-to-call and email links)
- Embedded Google Map (lazy-loaded)
- Links to Facebook and the accepted payment cards
- `AutoRepair` structured data (JSON-LD) for Google
- A **Cars for sale** page (`cars.html`), filled in from `Assets/data/cars.json`

## Structure

```
index.html            the homepage
cars.html             cars for sale page
Assets/css/style.css  styles
Assets/js/cars.js     shows the cars from the data file
Assets/data/cars.json the list of cars (edited through Pages CMS)
Assets/images/cars/   car photos (uploaded through Pages CMS)
.pages.yml            Pages CMS settings
docs/                 setup notes and the how-to-list-a-car guide
Assets/images/        logos, icons, payment card logos
Assets/premises.*     workshop photo
sitemap.xml, robots.txt
```

## Cars for sale

Cars are added and edited at [app.pagescms.org](https://app.pagescms.org), which saves to `Assets/data/cars.json` and `Assets/images/cars/`. See `docs/SETUP-PAGES-CMS.md` for setup and `docs/HOW-TO-LIST-A-CAR.md` for the plain-English guide.

## Making changes

Edit `index.html` or `style.css`, then commit and push to `main`. GitHub Pages publishes the change within a minute or two.

© JG Auto Service. All rights reserved.
