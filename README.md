# JG Auto Service website

Source for [www.jgauto.co.uk](https://www.jgauto.co.uk/), the website for JG Auto Service, a family-run car repair and servicing garage in Alloa (est. 1972).

It's a single static page hosted on GitHub Pages. The custom domain is set in `CNAME`.

## What's on the page

- About the business, with a photo of the workshop
- List of services
- Opening hours and contact details (tap-to-call and email links)
- Embedded Google Map (lazy-loaded)
- Links to Facebook and the accepted payment cards
- `AutoRepair` structured data (JSON-LD) for Google

## Structure

```
index.html            the page
Assets/css/style.css  styles
Assets/images/        logos, icons, payment card logos
Assets/premises.*     workshop photo
sitemap.xml, robots.txt
```

## Making changes

Edit `index.html` or `style.css`, then commit and push to `main`. GitHub Pages publishes the change within a minute or two.

© JG Auto Service. All rights reserved.
