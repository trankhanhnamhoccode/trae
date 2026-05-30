const createCheckoutSession = async () => {
  // Placeholder only. Do not process real payments in this MVP.
  return {
    provider: 'placeholder',
    status: 'not_configured',
    message: 'Payment integration will be added in a future version.'
  };
};

module.exports = {
  createCheckoutSession
};
