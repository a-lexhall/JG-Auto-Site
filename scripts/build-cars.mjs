#!/usr/bin/env node
/**
 * Builds cars.html and Assets/data/cars.json from an Airtable table.
 *
 * Airtable attachment URLs expire about two hours after they are issued, so every
 * photo is downloaded, resized and committed to the repository rather than linked.
 *
 * Environment:
 *   AIRTABLE_TOKEN    personal access token with data.records:read on the base
 *   AIRTABLE_BASE_ID  the base id, e.g. appXXXXXXXXXXXXXX
 *   AIRTABLE_TABLE    table name (default "Cars")
 *
 * Run with --offline to rebuild the page from the committed cars.json without
 * contacting Airtable. Useful for design changes.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_DIR = path.join(ROOT, "Assets", "images", "cars");
const DATA_FILE = path.join(ROOT, "Assets", "data", "cars.json");
const TEMPLATE_FILE = path.join(ROOT, "scripts", "cars.template.html");
const OUTPUT_FILE = path.join(ROOT, "cars.html");

const SITE = "https://www.jgauto.co.uk";
const PHONE = "+447471427127";
const PHONE_DISPLAY = "07471 427127";
const EMAIL = "JGAuto1972@gmail.com";

const WEBP_WIDTHS = [600, 1200];
const JPEG_WIDTH = 800;
const OFFLINE = process.argv.includes("--offline");

/* ---------------------------------------------------------------- helpers */

const esc = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Reads a field tolerantly, so "MOT Expiry", "MOT expiry" and "motexpiry" all match. */
function field(fields, ...names) {
    for (const name of names) {
        const key = Object.keys(fields).find((k) => slug(k) === slug(name));
        if (key !== undefined) {
            const value = fields[key];
            if (value !== undefined && value !== null && value !== "") return value;
        }
    }
    return undefined;
}

const number = (value) => {
    const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
};

const money = (value) =>
    new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
    }).format(value);

const ukDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(d);
};

/* --------------------------------------------------------------- airtable */

async function fetchRecords() {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE || "Cars";

    if (!token || !baseId) {
        throw new Error(
            "AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set. Run with --offline to rebuild from cars.json."
        );
    }

    const records = [];
    let offset;

    do {
        const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
        url.searchParams.set("pageSize", "100");
        if (offset) url.searchParams.set("offset", offset);

        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) {
            throw new Error(`Airtable returned ${response.status}: ${await response.text()}`);
        }

        const body = await response.json();
        records.push(...body.records);
        offset = body.offset;
    } while (offset);

    return records;
}

function normalise(record) {
    const f = record.fields ?? {};
    const status = String(field(f, "Status") ?? "Available").trim();
    const make = field(f, "Make");
    const model = field(f, "Model");
    const year = number(field(f, "Year"));

    return {
        id: record.id,
        status,
        sold: /sold/i.test(status),
        title: [year, make, model].filter(Boolean).join(" ") || "Car",
        make,
        model,
        year,
        price: number(field(f, "Price")),
        mileage: number(field(f, "Mileage", "Miles")),
        fuel: field(f, "Fuel", "Fuel Type"),
        transmission: field(f, "Transmission", "Gearbox"),
        engine: field(f, "Engine", "Engine Size"),
        colour: field(f, "Colour", "Color"),
        doors: number(field(f, "Doors")),
        mot: field(f, "MOT Expiry", "MOT"),
        description: field(f, "Description", "Notes"),
        attachments: (field(f, "Photos", "Images", "Pictures") ?? []).filter((a) =>
            String(a?.type ?? "").startsWith("image/")
        ),
    };
}

/* ----------------------------------------------------------------- images */

/**
 * Downloads one attachment and writes WebP and JPEG renditions.
 * Named by Airtable's stable attachment id, so unchanged photos are never
 * re-downloaded and the repository sees no churn between runs.
 */
async function processPhoto(attachment) {
    const base = attachment.id;
    const names = [...WEBP_WIDTHS.map((w) => `${base}-${w}.webp`), `${base}-${JPEG_WIDTH}.jpg`];

    if (!names.every((name) => existsSync(path.join(IMAGE_DIR, name)))) {
        const response = await fetch(attachment.url);
        if (!response.ok) {
            throw new Error(`Could not download ${attachment.filename}: ${response.status}`);
        }

        // .rotate() with no argument applies the EXIF orientation phones record.
        const source = sharp(Buffer.from(await response.arrayBuffer())).rotate();

        for (const width of WEBP_WIDTHS) {
            await source
                .clone()
                .resize({ width, withoutEnlargement: true })
                .webp({ quality: 78 })
                .toFile(path.join(IMAGE_DIR, `${base}-${width}.webp`));
        }

        await source
            .clone()
            .resize({ width: JPEG_WIDTH, withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(path.join(IMAGE_DIR, `${base}-${JPEG_WIDTH}.jpg`));

        console.log(`  photo ${attachment.filename} -> ${base}`);
    }

    const meta = await sharp(path.join(IMAGE_DIR, `${base}-${JPEG_WIDTH}.jpg`)).metadata();

    return {
        base,
        width: meta.width,
        height: meta.height,
        fallback: `/Assets/images/cars/${base}-${JPEG_WIDTH}.jpg`,
        srcset: WEBP_WIDTHS.map((w) => `/Assets/images/cars/${base}-${w}.webp ${w}w`).join(", "),
    };
}

/** Removes renditions for photos that are no longer in the table. */
async function pruneImages(cars) {
    const keep = new Set();
    for (const car of cars) {
        for (const photo of car.photos) {
            keep.add(`${photo.base}-${JPEG_WIDTH}.jpg`);
            for (const w of WEBP_WIDTHS) keep.add(`${photo.base}-${w}.webp`);
        }
    }

    for (const name of await readdir(IMAGE_DIR)) {
        if (name === ".gitkeep" || keep.has(name)) continue;
        await unlink(path.join(IMAGE_DIR, name));
        console.log(`  removed unused ${name}`);
    }
}

/* ------------------------------------------------------------------ render */

function renderSpecs(car) {
    const rows = [
        ["Mileage", car.mileage ? `${car.mileage.toLocaleString("en-GB")} miles` : undefined],
        ["Fuel", car.fuel],
        ["Gearbox", car.transmission],
        ["Engine", car.engine],
        ["Colour", car.colour],
        ["Doors", car.doors],
        ["MOT until", car.mot ? ukDate(car.mot) ?? car.mot : undefined],
    ].filter(([, value]) => value !== undefined && value !== "");

    if (!rows.length) return "";

    const items = rows
        .map(([label, value]) => `                        <div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
        .join("\n");

    return `                    <dl class="car-specs">\n${items}\n                    </dl>\n`;
}

function renderCar(car) {
    const [main, ...rest] = car.photos;
    const alt = `${car.title} for sale at JG Auto Service, Alloa`;

    const media = main
        ? `                <div class="car-media">
                    <picture>
                        <source type="image/webp" srcset="${main.srcset}"
                            sizes="(max-width: 768px) 100vw, 330px">
                        <img src="${main.fallback}" alt="${esc(alt)}" width="${main.width}" height="${main.height}"
                            loading="lazy" decoding="async" class="car-photo" data-car-main>
                    </picture>${car.sold ? '\n                    <span class="car-badge">Sold</span>' : ""}
                </div>\n`
        : "";

    const thumbs = rest.length
        ? `                <ul class="car-thumbs">
${[main, ...rest]
    .map(
        (photo, index) =>
            `                    <li><a href="${photo.fallback}" data-car-thumb data-srcset="${photo.srcset}"
                        data-width="${photo.width}" data-height="${photo.height}"><img src="${photo.fallback}"
                        alt="Photo ${index + 1} of ${esc(car.title)}" width="56" height="42" loading="lazy"
                        decoding="async"${index === 0 ? ' aria-current="true"' : ""}></a></li>`
    )
    .join("\n")}
                </ul>\n`
        : "";

    const subject = encodeURIComponent(`Enquiry: ${car.title}`);

    return `            <li class="car box" id="car-${esc(car.id)}">
${media}${thumbs}                <div class="car-body">
                    <h2 class="car-title">${esc(car.title)}</h2>
                    <p class="car-price">${car.price ? money(car.price) : "POA"}</p>
${renderSpecs(car)}${car.description ? `                    <p class="car-desc">${esc(car.description)}</p>\n` : ""}                    <p class="car-actions">
                        <a href="tel:${PHONE}" class="plain-link">Call ${PHONE_DISPLAY}</a>
                        <a href="mailto:${EMAIL}?subject=${subject}" class="plain-link">Email us</a>
                    </p>
                </div>
            </li>`;
}

function renderJsonLd(cars) {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Cars for sale at JG Auto Service",
        itemListElement: cars.map((car, index) => {
            const offer = {
                "@type": "Offer",
                priceCurrency: "GBP",
                availability: car.sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
                url: `${SITE}/cars.html#car-${car.id}`,
                seller: { "@id": `${SITE}/#business` },
            };
            if (car.price) offer.price = car.price;

            const item = {
                "@type": "Car",
                name: car.title,
                offers: offer,
            };
            if (car.make) item.brand = { "@type": "Brand", name: car.make };
            if (car.model) item.model = car.model;
            if (car.year) item.vehicleModelDate = String(car.year);
            if (car.colour) item.color = car.colour;
            if (car.doors) item.numberOfDoors = car.doors;
            if (car.fuel) item.fuelType = car.fuel;
            if (car.transmission) item.vehicleTransmission = car.transmission;
            if (car.mileage) {
                item.mileageFromOdometer = {
                    "@type": "QuantitativeValue",
                    value: car.mileage,
                    unitCode: "SMI",
                };
            }
            if (car.photos.length) item.image = car.photos.map((p) => `${SITE}${p.fallback}`);

            return { "@type": "ListItem", position: index + 1, item };
        }),
    };
}

async function render(cars, updatedAt) {
    let html = await readFile(TEMPLATE_FILE, "utf8");

    const body = cars.length
        ? `        <ul class="cars-grid">\n${cars.map(renderCar).join("\n")}\n        </ul>`
        : `        <div class="cars-empty">
            <p class="box">We have no cars listed at the moment. Give us a ring on
                <a href="tel:${PHONE}" class="plain-link">${PHONE_DISPLAY}</a> and we will let you know what is due in.
            </p>
        </div>`;

    const updated = updatedAt
        ? `        <p class="cars-updated">Last updated ${new Intl.DateTimeFormat("en-GB", {
              dateStyle: "long",
          }).format(new Date(updatedAt))}</p>`
        : "";

    const ogImage = cars.find((c) => c.photos.length)?.photos[0];

    html = html
        .replace("<!--JSONLD-->", JSON.stringify(renderJsonLd(cars), null, 8))
        .replace("<!--CARS-->", body)
        .replace("<!--UPDATED-->", updated)
        .replace(
            "<!--OGIMAGE-->",
            ogImage
                ? `${SITE}${ogImage.fallback}`
                : `${SITE}/Assets/images/logos/JGAuto_Logo_Desktop.webp`
        );

    await writeFile(OUTPUT_FILE, html);
}

/* -------------------------------------------------------------------- main */

async function main() {
    await mkdir(IMAGE_DIR, { recursive: true });
    await mkdir(path.dirname(DATA_FILE), { recursive: true });

    let cars;
    let updatedAt;

    if (OFFLINE) {
        const existing = JSON.parse(await readFile(DATA_FILE, "utf8"));
        cars = existing.cars;
        updatedAt = existing.updated;
        console.log(`Rebuilding page from cars.json (${cars.length} cars)`);
    } else {
        const records = await fetchRecords();
        console.log(`Fetched ${records.length} rows from Airtable`);

        const all = records.map(normalise);
        // "Draft" (or anything that is not Available/Sold) stays off the site.
        const visible = all.filter((car) => /available|sold/i.test(car.status));

        cars = [];
        for (const car of visible) {
            const photos = [];
            for (const attachment of car.attachments) {
                photos.push(await processPhoto(attachment));
            }
            const { attachments, ...rest } = car;
            cars.push({ ...rest, photos });
        }

        // Available first, then by price, so the cheapest sits at the top of each group.
        cars.sort((a, b) => Number(a.sold) - Number(b.sold) || (a.price ?? 0) - (b.price ?? 0));

        await pruneImages(cars);
        updatedAt = new Date().toISOString();
        await writeFile(DATA_FILE, `${JSON.stringify({ updated: updatedAt, cars }, null, 2)}\n`);
        console.log(`Wrote ${cars.length} cars (${all.length - visible.length} hidden)`);
    }

    await render(cars, updatedAt);
    console.log(`Wrote ${path.relative(ROOT, OUTPUT_FILE)}`);
}

main().catch((error) => {
    console.error(`\nBuild failed: ${error.message}`);
    process.exit(1);
});
