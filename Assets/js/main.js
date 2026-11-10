/**
 * JG Auto Service — progressive enhancements.
 *
 * The page works fully without this file: the map is lazy-loaded natively by the
 * browser, and "Contact us for a quote" is a normal anchor to #contact.
 */

// Briefly highlight the contact details when the quote link is followed.
document.addEventListener("click", (event) => {
    if (!event.target.closest("#contact-quote-trigger")) {
        return;
    }

    const links = document.querySelectorAll("#contact .plain-link");
    links.forEach((link) => link.classList.add("lit-up"));

    window.setTimeout(() => {
        links.forEach((link) => link.classList.remove("lit-up"));
    }, 1500);
});

// Car listings: clicking a thumbnail swaps the main photo.
// Without JavaScript each thumbnail is still a link straight to the full photo.
document.addEventListener("click", (event) => {
    const thumb = event.target.closest("[data-car-thumb]");
    if (!thumb) return;

    const card = thumb.closest(".car");
    const main = card?.querySelector("[data-car-main]");
    if (!main) return;

    event.preventDefault();

    main.src = thumb.getAttribute("href");
    main.width = thumb.dataset.width;
    main.height = thumb.dataset.height;

    const source = main.parentElement.querySelector("source");
    if (source) source.srcset = thumb.dataset.srcset;

    card.querySelectorAll("[data-car-thumb] img").forEach((image) => {
        image.removeAttribute("aria-current");
    });
    thumb.querySelector("img")?.setAttribute("aria-current", "true");
});
