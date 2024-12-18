const stripe = require("stripe")(process.env.STRIPE_PUBLIC_SECRET_KEY);

route.post("/create-checkout-session", async (req, res) => {
  const { products } = req.body;

  const lineItems = products.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
      },
      unit_amount: item.price * 100, // Price in cents
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/success`,
    cancel_url: `${process.env.CLIENT_URL}/canceled`,
  });

  res.status(200).json({ id: session.id });
});