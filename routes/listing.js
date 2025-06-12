const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// Escape function to handle regex safely
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// ========== SEARCH + LISTING INDEX ========== //
router.get("/", wrapAsync(async (req, res) => {
    const { search } = req.query;
    let allListings;

    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i'); // case-insensitive
        allListings = await Listing.find({
            $or: [
                { title: regex },
                { location: regex }
            ]
        });
    } else {
        allListings = await Listing.find({});
    }

    res.render("listings/index", { allListings, search });
}));

// ========== CREATE NEW LISTING ========== //
router.post(
    "/",
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
);

// ========== FORM TO ADD NEW LISTING ========== //
router.get("/new", isLoggedIn, listingController.renderNewForm);

// ========== SHOW, UPDATE, DELETE BY ID ========== //
router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.deleteListing)
    );

// ========== EDIT FORM ========== //
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListing));

module.exports = router;
