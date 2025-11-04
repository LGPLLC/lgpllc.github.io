/**
 * PayPal Button Renderer for L.G.P. LLC
 * Renders PayPal payment buttons with product options
 */

function renderPayPal(selector, options) {
  const container = document.querySelector(selector);
  
  if (!container) {
    console.error(`PayPal container not found: ${selector}`);
    return;
  }

  // Default options
  const config = {
    price: options.price || '100.00',
    description: options.description || 'L.G.P. LLC Product',
    productOptions: options.productOptions || null
  };

  // If product has options, create selection UI
  if (config.productOptions) {
    const optionsHTML = `
      <div style="margin-bottom:16px; padding:12px; background:var(--note); border-radius:8px;">
        <label for="product-option" style="display:block; margin-bottom:8px; font-weight:700;">
          Select ${config.productOptions.label}:
        </label>
        <select id="product-option" style="width:100%; padding:10px; border-radius:8px; border:2px solid var(--blue); font-size:16px;">
          ${config.productOptions.choices.map(choice => 
            `<option value="${choice.price}">${choice.name} - $${choice.price}</option>`
          ).join('')}
        </select>
      </div>
      <div id="${selector.replace('#', '')}-button"></div>
    `;
    container.innerHTML = optionsHTML;
    
    // Update button container reference
    const buttonContainer = document.querySelector(`${selector}-button`);
    renderButton(buttonContainer, config, true);
    
    // Add change listener to update price
    document.getElementById('product-option').addEventListener('change', (e) => {
      const newPrice = e.target.value;
      buttonContainer.innerHTML = ''; // Clear old button
      renderButton(buttonContainer, { ...config, price: newPrice }, true);
    });
  } else {
    // No options, render button directly
    renderButton(container, config, false);
  }
}

function renderButton(container, config, hasOptions) {
  if (!window.paypal) {
    console.error('PayPal SDK not loaded');
    container.innerHTML = '<p style="color:red;">Payment system unavailable. Please contact us directly.</p>';
    return;
  }

  paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'blue',
      shape: 'rect',
      label: 'pay'
    },
    
    createOrder: function(data, actions) {
      const selectedPrice = hasOptions 
        ? document.getElementById('product-option').value 
        : config.price;
      
      return actions.order.create({
        purchase_units: [{
          description: config.description,
          amount: {
            value: selectedPrice,
            currency_code: 'USD'
          }
        }]
      });
    },
    
    onApprove: function(data, actions) {
      return actions.order.capture().then(function(details) {
        alert('Transaction completed by ' + details.payer.name.given_name + '! Order ID: ' + data.orderID);
        // You can add custom success handling here
        window.location.href = '../index.html?payment=success';
      });
    },
    
    onError: function(err) {
      console.error('PayPal error:', err);
      alert('Payment error occurred. Please try again or contact us at JRP001@lgparkin.org');
    }
  }).render(container);
}

// Make function globally available
window.renderPayPal = renderPayPal;
