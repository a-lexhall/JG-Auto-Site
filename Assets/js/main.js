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
