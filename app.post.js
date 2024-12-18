app.post('/create-checkout-session', async (req, res) => {
    console.log("Received checkout session request:", req.body);
    const { items } = req.body; // receive items from frontend
    const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:5173'; // dynamic domain for dev/prod
    console.log(req.body.items)
  
    const line_items = items.map(item => {
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100, // convert price to cents
        },
        quantity: item.quantity,
      };
    });
  
    const session = await stripe.checkout.sessions.create({
      submit_type: 'pay',
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      shipping_options: [
        { shipping_rate: 'shr_1Q1dMbK18qLqQSoU19BG0z0H' },
        { shipping_rate: 'shr_1Q1dOeK18qLqQSoUfKaeIPDK' },
      ],
      line_items,
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
    });
  
    res.json({ id: session.id }); // send session ID to frontend
  });