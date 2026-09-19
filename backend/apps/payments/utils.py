import re


def normalize_phone_number(raw):
    """
    Normalizes common Kenyan phone number formats into Safaricom's
    required 2547XXXXXXXX / 2541XXXXXXXX format.

    Accepts: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX,
    with or without spaces/dashes.
    """
    digits = re.sub(r"\D", "", raw or "")

    if digits.startswith("254") and len(digits) == 12:
        return digits
    if digits.startswith("0") and len(digits) == 10:
        return "254" + digits[1:]
    if digits.startswith("7") and len(digits) == 9:
        return "254" + digits
    if digits.startswith("1") and len(digits) == 9:
        return "254" + digits

    raise ValueError(f"Unrecognized phone number format: {raw}")


# Mirrors the DURATION_OPTIONS mapping used in the frontend BookingPage.jsx
# so rent totals are calculated identically on both sides.
DURATION_TO_SEMESTERS = {
    3: 1,
    6: 2,
    12: 3,
}


def calculate_rent_total(monthly_rent, duration_months):
    semesters = DURATION_TO_SEMESTERS.get(duration_months, 1)
    return float(monthly_rent) * semesters