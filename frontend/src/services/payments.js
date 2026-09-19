import api from "./api";

export const initiateSTKPush = ({ bookingId, phase, phoneNumber }) =>
  api
    .post("/payments/stk-push/", {
      booking_id: bookingId,
      phase,
      phone_number: phoneNumber,
    })
    .then((r) => r.data);

export const getPaymentStatus = (checkoutRequestId) =>
  api.get(`/payments/status/${checkoutRequestId}/`).then((r) => r.data);