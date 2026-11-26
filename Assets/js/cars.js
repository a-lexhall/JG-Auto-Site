// Builds the "Cars for sale" list from Assets/data/cars.json.
// That file is edited through Pages CMS (see .pages.yml), not by hand.

(function () {
    "use strict";

    var DATA_URL = "/Assets/data/cars.json";
    var PHONE = "07471 427127";
    var PHONE_LINK = "tel:+447471427127";
    var EMAIL = "JGAuto1972@gmail.com";

    var list = document.getElementById("cars");
    if (!list) return;

    // Small helper: make an element with a class and optional text.
    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = String(text);
        return node;
    }

    function hasValue(v) {
        return v !== undefined && v !== null && String(v).trim() !== "";
    }

    function formatPrice(price) {
        var n = Number(price);
        if (!hasValue(price) || !isFinite(n) || n <= 0) return "POA";
        return "£" + n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
    }

    function formatMileage(miles) {
        var n = Number(miles);
        if (!hasValue(miles) || !isFinite(n)) return null;
        return n.toLocaleString("en-GB") + " miles";
    }

    // Shows a date like 2027-03-14 as "March 2027".
    function formatMonthYear(value) {
        if (!hasValue(value)) return null;
        var d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }

    // Pages CMS may save one photo as text, or several as a list.
    function photoList(photos) {
        if (!photos) return [];
        if (!Array.isArray(photos)) photos = [photos];
        return photos.filter(hasValue).map(function (p) {
            p = String(p).trim();
            return /^(https?:)?\//.test(p) ? p : "/" + p;
        });
    }

    function statusOf(car) {
        var s = String(car.status || "For sale").toLowerCase();
        if (s.indexOf("sold") === 0) return "sold";
        if (s.indexOf("hid") === 0 || s.indexOf("draft") === 0) return "hidden";
        return "for-sale";
    }

    function carTitle(car) {
        return [car.year, car.make, car.model].filter(hasValue).join(" ");
    }

    function buildPhotos(car, title) {
        var photos = photoList(car.photos);
        var box = el("div", "car-photos");

        if (!photos.length) {
            box.appendChild(el("div", "car-photo car-photo-none", "Photos coming soon"));
            return box;
        }

        var main = el("img", "car-photo");
        main.src = photos[0];
        main.alt = title + " – photo 1 of " + photos.length;
        main.loading = "lazy";
        main.decoding = "async";
        box.appendChild(main);

        if (photos.length > 1) {
            var thumbs = el("div", "car-thumbs");
            photos.forEach(function (src, i) {
                var btn = el("button", "car-thumb");
                btn.type = "button";
                btn.setAttribute("aria-label", "Show photo " + (i + 1) + " of " + photos.length);
                if (i === 0) btn.setAttribute("aria-pressed", "true");
                var img = el("img");
                img.src = src;
                img.alt = "";
                img.loading = "lazy";
                btn.appendChild(img);
                btn.addEventListener("click", function () {
                    main.src = src;
                    main.alt = title + " – photo " + (i + 1) + " of " + photos.length;
                    thumbs.querySelectorAll(".car-thumb").forEach(function (b) {
                        b.removeAttribute("aria-pressed");
                    });
                    btn.setAttribute("aria-pressed", "true");
                });
                thumbs.appendChild(btn);
            });
            box.appendChild(thumbs);
        }
        return box;
    }

    function buildCard(car) {
        var status = statusOf(car);
        var title = carTitle(car) || "Car for sale";

        var card = el("article", "car" + (status === "sold" ? " car-sold" : ""));
        card.appendChild(buildPhotos(car, title));

        var info = el("div", "car-info");

        var heading = el("h2", "car-title", title);
        if (status === "sold") heading.appendChild(el("span", "sold-badge", "Sold"));
        info.appendChild(heading);

        if (hasValue(car.engine)) info.appendChild(el("p", "car-engine", car.engine));

        if (status !== "sold") info.appendChild(el("p", "car-price", formatPrice(car.price)));

        var specs = [
            ["Mileage", formatMileage(car.mileage)],
            ["Fuel", car.fuel],
            ["Gearbox", car.gearbox],
            ["Colour", car.colour],
            ["MOT until", formatMonthYear(car.mot)]
        ].filter(function (row) { return hasValue(row[1]); });

        if (specs.length) {
            var dl = el("dl", "car-specs");
            specs.forEach(function (row) {
                var wrap = el("div");
                wrap.appendChild(el("dt", null, row[0]));
                wrap.appendChild(el("dd", null, row[1]));
                dl.appendChild(wrap);
            });
            info.appendChild(dl);
        }

        if (hasValue(car.description)) {
            info.appendChild(el("p", "car-description", car.description));
        }

        if (status !== "sold") {
            var ask = el("p", "car-ask");
            var call = el("a", "button button-call", "Call about this car");
            call.href = PHONE_LINK;
            var mail = el("a", "button button-plain", "Email us");
            mail.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Enquiry: " + title);
            ask.appendChild(call);
            ask.appendChild(mail);
            info.appendChild(ask);
        }

        card.appendChild(info);
        return card;
    }

    function showMessage(text) {
        list.textContent = "";
        var p = el("p", "cars-message", text);
        list.appendChild(p);
        return p;
    }

    function render(cars) {
        var visible = (Array.isArray(cars) ? cars : [])
            .filter(function (c) { return c && statusOf(c) !== "hidden"; });

        // Cars for sale first, sold ones after. Otherwise keep the CMS order.
        visible.sort(function (a, b) {
            return (statusOf(a) === "sold") - (statusOf(b) === "sold");
        });

        if (!visible.length) {
            var p = showMessage("No cars listed at the moment. Give us a ring on ");
            var a = el("a", null, PHONE);
            a.href = PHONE_LINK;
            p.appendChild(a);
            p.appendChild(document.createTextNode(" to hear what's coming in."));
            return;
        }

        list.textContent = "";
        visible.forEach(function (car) { list.appendChild(buildCard(car)); });
    }

    fetch(DATA_URL, { cache: "no-cache" })
        .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        })
        .then(render)
        .catch(function () {
            var p = showMessage("Sorry, the list of cars didn't load. Please try again, or call us on ");
            var a = el("a", null, PHONE);
            a.href = PHONE_LINK;
            p.appendChild(a);
            p.appendChild(document.createTextNode("."));
        });
})();
