/**
 * PayPal Button Renderer for L.G.P. LLC
 * Renders PayPal payment buttons with product options
 */

// Wait for PayPal SDK to load
function waitForPayPal(callback, timeout = 5000) {
  const startTime = Date.now();
  const checkInterval = setInterval(() => {
    if (window.paypal) {
      clearInterval(checkInterval);
      callback(true);
    } else if (Date.now() - startTime > timeout) {
      clearInterval(checkInterval);
      callback(false);
    }
  }, 100);
}

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
    const buttonContainerId = `${selector.replace('#', '')}-button`;
    const buttonContainer = document.getElementById(buttonContainerId);
    renderButton(buttonContainer, config, true);
    
    // Add change listener to update price
    document.getElementById('product-option').addEventListener('change', (e) => {
      const newPrice = e.target.value;
      const buttonContainerElement = document.getElementById(buttonContainerId);
      buttonContainerElement.innerHTML = ''; // Clear old button
      renderButton(buttonContainerElement, { ...config, price: newPrice }, true);
    });
  } else {
    // No options, render button directly
    renderButton(container, config, false);
  }
}

function renderButton(container, config, hasOptions) {
  if (!container) {
    console.error('Button container not found');
    return;
  }
  
  // Wait for PayPal SDK to load
  waitForPayPal((loaded) => {
    if (!loaded) {
      console.error('PayPal SDK failed to load - check Client ID');
      container.innerHTML = `
        <div style="padding:16px; background:#fff4f5; border:2px solid #800b12; border-radius:8px; color:#0b0b0b;">
          <p style="margin:0 0 8px 0; font-weight:bold; color:#800b12;">⚠️ PayPal Payment Temporarily Unavailable</p>
          <p style="margin:0; font-size:14px;">Please use Zelle (208-477-9204) or contact us directly at <a href="mailto:JRP001@lgparkin.org" style="color:#0b6ef6;">JRP001@lgparkin.org</a></p>
        </div>
      `;
      return;
    }
    
    // PayPal SDK loaded successfully
    renderPayPalButton(container, config, hasOptions);
  });
}

function renderPayPalButton(container, config, hasOptions) {
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
