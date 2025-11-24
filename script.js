const defaultConfig = {
      site_title: "Nagar Nigam Lucknow",
      tagline: "Smart Waste Management System",
      contact_phone: "+91-522-2234567",
      contact_email: "waste@nagarnigamlko.in"
    };

    let isLoggedIn = false;
    let allRequests = [];

    const priceRates = {
      "Plastic": 12,
      "Paper/Newspaper": 8,
      "Metal/Steel": 25,
      "Glass": 5,
      "Coca Cola Cans": 40,
      "Mixed Recyclables": 10
    };

    const dataHandler = {
      onDataChanged(data) {
        allRequests = data;
        updateStats();
        renderUserRequests();
        if (isLoggedIn) {
          renderAdminRequests();
        }
      }
    };

    async function initializeApp() {
      const initResult = await window.dataSdk.init(dataHandler);
      if (!initResult.isOk) {
        console.error("Failed to initialize SDK");
      }
    }

    function showPage(pageId) {
      document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
      
      // Use the button that triggered the click event to find the matching nav button
      // In the context of the HTML, 'event.target' will be the button element
      const clickedButton = event.target;
      clickedButton.classList.add('active');

      document.getElementById(pageId).classList.add('active');
    }

    function updateStats() {
      const uniqueUsers = new Set(allRequests.map(r => r.phone)).size;
      const todayRequests = allRequests.filter(r => {
        const reqDate = new Date(r.created_at);
        const today = new Date();
        return reqDate.toDateString() === today.toDateString();
      }).length;
      
      const totalWeight = allRequests.reduce((sum, r) => sum + (r.weight || 0), 0);
      
      document.getElementById('total-users').textContent = uniqueUsers;
      document.getElementById('total-collections').textContent = todayRequests;
      document.getElementById('total-recycled').textContent = Math.round(totalWeight);
    }

    function updateEstimate() {
      const wasteType = document.getElementById('user-waste-type').value;
      const weight = parseFloat(document.getElementById('user-weight').value) || 0;
      
      if (wasteType && weight > 0) {
        const rate = priceRates[wasteType] || 0;
        const price = rate * weight;
        document.getElementById('estimated-price').value = `₹${price.toFixed(2)}`;
      } else {
        document.getElementById('estimated-price').value = '';
      }
    }

    async function submitUserRequest(event) {
      event.preventDefault();
      
      const submitBtn = document.getElementById('user-submit-btn');
      const messageDiv = document.getElementById('user-message');
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Submitting... <span class="spinner"></span>';
      
      const wasteType = document.getElementById('user-waste-type').value;
      const weight = parseFloat(document.getElementById('user-weight').value);
      const rate = priceRates[wasteType] || 0;
      const price = rate * weight;
      
      const requestData = {
        id: Date.now().toString(),
        user_type: "public",
        name: document.getElementById('user-name').value,
        phone: document.getElementById('user-phone').value,
        address: document.getElementById('user-address').value,
        area: document.getElementById('user-area').value,
        waste_type: wasteType,
        weight: weight,
        price: price,
        status: "pending",
        created_at: new Date().toISOString()
      };

      if (allRequests.length >= 999) {
        messageDiv.innerHTML = '<div class="alert alert-error">⚠️ Maximum limit of 999 requests reached. Please contact admin.</div>';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '📤 Submit Collection Request';
        return;
      }

      const result = await window.dataSdk.create(requestData);
      
      submitBtn.disabled = false;
      submitBtn.innerHTML = '📤 Submit Collection Request';
      
      if (result.isOk) {
        messageDiv.innerHTML = '<div class="alert alert-success">✅ Request submitted successfully! Our team will collect waste from your location soon.</div>';
        document.getElementById('user-form').reset();
        document.getElementById('estimated-price').value = '';
      } else {
        messageDiv.innerHTML = '<div class="alert alert-error">❌ Failed to submit request. Please try again.</div>';
      }

      setTimeout(() => {
        messageDiv.innerHTML = '';
      }, 5000);
    }

    function renderUserRequests() {
      const container = document.getElementById('user-requests');
      const userRequests = allRequests.filter(r => r.user_type === "public");
      
      if (userRequests.length === 0) {
        container.innerHTML = '<div class="form-section"><p style="text-align: center; color: #7f8c8d;">No requests yet. Submit your first collection request above!</p></div>';
        return;
      }

      container.innerHTML = '<div class="form-section"><h3>📋 Your Recent Requests</h3></div>';
      
      userRequests.slice().reverse().slice(0, 5).forEach(request => {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML = `
          <div class="request-header">
            <span class="request-id">Request #${request.id}</span>
            <span class="status-badge ${request.status === 'pending' ? 'status-pending' : 'status-collected'}">
              ${request.status === 'pending' ? '⏳ Pending' : '✅ Collected'}
            </span>
          </div>
          <div class="request-details">
            <div class="detail-item">
              <strong>Name</strong>
              ${request.name}
            </div>
            <div class="detail-item">
              <strong>Area</strong>
              ${request.area}
            </div>
            <div class="detail-item">
              <strong>Waste Type</strong>
              ${request.waste_type}
            </div>
            <div class="detail-item">
              <strong>Weight</strong>
              ${request.weight} kg
            </div>
            <div class="detail-item">
              <strong>Price</strong>
              ₹${request.price.toFixed(2)}
            </div>
            <div class="detail-item">
              <strong>Date</strong>
              ${new Date(request.created_at).toLocaleDateString('en-IN')}
            </div>
          </div>
          <div class="detail-item" style="margin-top: 10px;">
            <strong>Address</strong>
            ${request.address}
          </div>
        `;
        container.appendChild(card);
      });
    }

    function adminLogin(event) {
      event.preventDefault();
      const username = document.getElementById('admin-username').value;
      const password = document.getElementById('admin-password').value;
      
      if (username === 'admin' && password === 'admin123') {
        isLoggedIn = true;
        document.getElementById('admin-login-form').parentElement.style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        renderAdminRequests();
      } else {
        alert('Invalid credentials! Use admin/admin123');
      }
    }

    function renderAdminRequests() {
      const container = document.getElementById('admin-requests');
      
      if (allRequests.length === 0) {
        container.innerHTML = '<div class="form-section"><p style="text-align: center; color: #7f8c8d;">No collection requests yet.</p></div>';
        return;
      }

      container.innerHTML = '';
      
      allRequests.slice().reverse().forEach(request => {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML = `
          <div class="request-header">
            <span class="request-id">Request #${request.id}</span>
            <span class="status-badge ${request.status === 'pending' ? 'status-pending' : 'status-collected'}">
              ${request.status === 'pending' ? '⏳ Pending' : '✅ Collected'}
            </span>
          </div>
          <div class="request-details">
            <div class="detail-item">
              <strong>Name</strong>
              ${request.name}
            </div>
            <div class="detail-item">
              <strong>Phone</strong>
              ${request.phone}
            </div>
            <div class="detail-item">
              <strong>Area</strong>
              ${request.area}
            </div>
            <div class="detail-item">
              <strong>Waste Type</strong>
              ${request.waste_type}
            </div>
            <div class="detail-item">
              <strong>Weight</strong>
              ${request.weight} kg
            </div>
            <div class="detail-item">
              <strong>Price</strong>
              ₹${request.price.toFixed(2)}
            </div>
          </div>
          <div class="detail-item" style="margin-top: 10px;">
            <strong>Address</strong>
            ${request.address}
          </div>
          <div class="admin-actions">
            ${request.status === 'pending' ? `
              <button class="btn btn-success" onclick="updateRequestStatus('${request.__backendId}', 'collected')">
                ✅ Mark as Collected
              </button>
            ` : `
              <button class="btn btn-primary" onclick="updateRequestStatus('${request.__backendId}', 'pending')">
                ↩️ Mark as Pending
              </button>
            `}
            <button class="btn btn-danger" onclick="deleteRequest('${request.__backendId}')">
              🗑️ Delete Request
            </button>
          </div>
        `;
        container.appendChild(card);
      });
    }

    async function updateRequestStatus(backendId, newStatus) {
      const request = allRequests.find(r => r.__backendId === backendId);
      if (!request) return;
      
      request.status = newStatus;
      const result = await window.dataSdk.update(request);
      
      if (!result.isOk) {
        alert('Failed to update status. Please try again.');
      }
    }

    async function deleteRequest(backendId) {
      const request = allRequests.find(r => r.__backendId === backendId);
      if (!request) return;
      
      const result = await window.dataSdk.delete(request);
      
      if (!result.isOk) {
        alert('Failed to delete request. Please try again.');
      }
    }

    async function onConfigChange(config) {
      const siteTitle = config.site_title || defaultConfig.site_title;
      const tagline = config.tagline || defaultConfig.tagline;
      const contactPhone = config.contact_phone || defaultConfig.contact_phone;
      const contactEmail = config.contact_email || defaultConfig.contact_email;

      // Update Header
      const titleElement = document.getElementById('site-title');
      if (titleElement) titleElement.textContent = siteTitle;
      
      const taglineElement = document.getElementById('tagline');
      if (taglineElement) taglineElement.textContent = tagline;

      // Update Contact Page
      const phoneElement = document.getElementById('contact-phone');
      if (phoneElement) phoneElement.textContent = contactPhone;

      const emailElement = document.getElementById('contact-email');
      if (emailElement) emailElement.textContent = contactEmail;
    }

    window.addEventListener('load', () => {
        initializeApp();
        window.elementSdk.config.onChange(onConfigChange);
    });
