// Cars for sale: reads Assets/data/cars.json (edited through Pages CMS)
// and shows each car on cars.html. No libraries needed.

(function () {
    var DATA_URL = '/Assets/data/cars.json';
    var PHONE = '07471 427127';
    var PHONE_LINK = 'tel:+447471427127';
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    function clean(value) {
        if (value === undefined || value === null) return '';
        return String(value).trim();
    }

    // Accepts 4995, "4995", "£4,995" and so on. Returns null if there's no number.
    function toNumber(value) {
        var text = clean(value).replace(/[£,\s]/g, '').replace(/miles?$/i, '');
        if (text === '') return null;
        var number = Number(text);
        return isFinite(number) ? number : null;
    }

    function formatPrice(value) {
        var number = toNumber(value);
        if (number === null || number === 0) return 'POA';
        return '£' + Math.round(number).toLocaleString('en-GB');
    }

    function formatMileage(value) {
        var number = toNumber(value);
        if (number === null) return '';
        return Math.round(number).toLocaleString('en-GB') + ' miles';
    }

    // "2027-03-14" becomes "14 Mar 2027". Anything else is shown as typed.
    function formatDate(value) {
        var text = clean(value);
        var match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return text;
        var month = MONTHS[Number(match[2]) - 1];
        if (!month) return text;
        return Number(match[3]) + ' ' + month + ' ' + match[1];
    }

    function photoList(value) {
        if (!value) return [];
        if (!Array.isArray(value)) value = [value];
        return value.map(clean).filter(Boolean).map(function (src) {
            // Pages CMS saves paths starting with "/". Add one if it's missing.
            if (/^(https?:)?\/\//.test(src) || src.charAt(0) === '/') return src;
            return '/' + src;
        });
    }

    function statusOf(car) {
        var status = clean(car.status).toLowerCase();
        if (status === 'sold') return 'sold';
        if (status === 'hidden') return 'hidden';
        return 'for sale';
    }

    function buildGallery(photos, title) {
        var gallery = el('div', 'car-photos');

        if (photos.length === 0) {
            gallery.appendChild(el('div', 'car-no-photo', 'Photos coming soon'));
            return gallery;
        }

        var mainLink = el('a', 'car-main-photo');
        mainLink.href = photos[0];
        mainLink.target = '_blank';
        mainLink.rel = 'noopener';
        mainLink.title = 'Open the full-size photo';

        var main = el('img');
        main.src = photos[0];
        main.alt = title;
        main.loading = 'lazy';
        mainLink.appendChild(main);
        gallery.appendChild(mainLink);

        if (photos.length > 1) {
            var thumbs = el('div', 'car-thumbs');
            photos.forEach(function (src, index) {
                var button = el('button', 'car-thumb');
                button.type = 'button';
                button.setAttribute('aria-label', 'Show photo ' + (index + 1) + ' of ' + photos.length);
                if (index === 0) button.setAttribute('aria-current', 'true');

                var thumb = el('img');
                thumb.src = src;
                thumb.alt = '';
                thumb.loading = 'lazy';
                button.appendChild(thumb);

                button.addEventListener('click', function () {
                    main.src = src;
                    mainLink.href = src;
                    Array.prototype.forEach.call(thumbs.children, function (other) {
                        other.removeAttribute('aria-current');
                    });
                    button.setAttribute('aria-current', 'true');
                });
                thumbs.appendChild(button);
            });
            gallery.appendChild(thumbs);
        }

        return gallery;
    }

    function addDetail(list, label, value) {
        if (!value) return;
        list.appendChild(el('dt', null, label));
        list.appendChild(el('dd', null, value));
    }

    function buildCar(car) {
        var sold = statusOf(car) === 'sold';
        var year = clean(car.year);
        var title = [year, clean(car.make), clean(car.model)].filter(Boolean).join(' ') || 'Car for sale';

        var article = el('article', sold ? 'car car-sold' : 'car');
        article.appendChild(buildGallery(photoList(car.photos), title));

        var info = el('div', 'car-info');
        var heading = el('h2', 'car-title', title);
        if (sold) {
            heading.appendChild(document.createTextNode(' '));
            heading.appendChild(el('span', 'sold-label', 'SOLD'));
        }
        info.appendChild(heading);

        if (!sold) info.appendChild(el('p', 'car-price', formatPrice(car.price)));

        var details = el('dl', 'car-details');
        addDetail(details, 'Mileage', formatMileage(car.mileage));
        addDetail(details, 'Fuel', clean(car.fuel));
        addDetail(details, 'Gearbox', clean(car.gearbox));
        addDetail(details, 'MOT until', formatDate(car.mot_expiry));
        if (details.children.length) info.appendChild(details);

        var description = clean(car.description);
        if (description) info.appendChild(el('p', 'car-description', description));

        if (!sold) {
            var call = el('p', 'car-call');
            call.appendChild(document.createTextNode('Interested? Ring '));
            var link = el('a', null, PHONE);
            link.href = PHONE_LINK;
            call.appendChild(link);
            info.appendChild(call);
        }

        article.appendChild(info);
        return article;
    }

    function showMessage(box, text) {
        box.innerHTML = '';
        var message = el('p', 'cars-message', text + ' ');
        var link = el('a', null, PHONE);
        link.href = PHONE_LINK;
        message.appendChild(link);
        message.appendChild(document.createTextNode('.'));
        box.appendChild(message);
    }

    function render(box, cars) {
        if (!Array.isArray(cars)) cars = [];

        var visible = cars.filter(function (car) {
            return car && typeof car === 'object' && statusOf(car) !== 'hidden';
        });
        // Cars for sale first, then sold ones. Otherwise keep the order they were entered in.
        var forSale = visible.filter(function (car) { return statusOf(car) !== 'sold'; });
        var sold = visible.filter(function (car) { return statusOf(car) === 'sold'; });

        box.innerHTML = '';

        if (forSale.length === 0) {
            showMessage(box, "We don't have any cars for sale just now. Check back soon, or ring us on");
        }

        forSale.concat(sold).forEach(function (car) {
            box.appendChild(buildCar(car));
        });
    }

    function start() {
        var box = document.getElementById('cars');
        if (!box) return;

        // "no-cache" asks the server whether the list has changed, so updates show quickly.
        fetch(DATA_URL, { cache: 'no-cache' })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (cars) { render(box, cars); })
            .catch(function () {
                showMessage(box, "Sorry, we couldn't load the list of cars. Please ring us on");
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
