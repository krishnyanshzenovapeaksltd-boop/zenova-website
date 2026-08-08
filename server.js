const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname))); // Serves your logo.png and ad images automatically

const indexPath = path.join(__dirname, 'index.html');

const updatedWebsiteCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Krishnyansh Zenova Peak Tech Hub | From Idea to Enterprise</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-dark: #070d1b;
            --card-bg: #0f172a;
            --gold: #d4af37;
            --gold-light: #f3e5ab;
            --text-light: #f8fafc;
            --text-muted: #94a3b8;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; scroll-behavior: smooth; }
        body { background-color: var(--bg-dark); color: var(--text-light); line-height: 1.6; }
        
        header { background: rgba(7, 13, 27, 0.95); border-bottom: 1px solid rgba(212, 175, 55, 0.2); position: fixed; width: 100%; top: 0; z-index: 1000; display: flex; justify-content: space-between; align-items: center; padding: 1rem 5%; }
        .logo-area { display: flex; align-items: center; gap: 12px; }
        .logo-area img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid var(--gold); }
        .logo-area h1 { font-size: 1.1rem; color: var(--gold); font-weight: 600; line-height: 1.2; }
        .logo-area p { font-size: 0.7rem; color: var(--text-muted); }
        
        nav a { color: var(--text-light); text-decoration: none; margin-left: 15px; font-size: 0.85rem; transition: color 0.3s; }
        nav a:hover { color: var(--gold); }

        .hero { padding: 160px 5% 60px 5%; text-align: center; background: radial-gradient(circle at center, #112240 0%, var(--bg-dark) 70%); border-bottom: 1px solid rgba(212, 175, 55, 0.1); }
        .badge { display: inline-block; background: rgba(212, 175, 55, 0.1); color: var(--gold); padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; border: 1px solid rgba(212, 175, 55, 0.3); margin-bottom: 20px; }
        .hero h2 { font-size: 2.3rem; color: var(--gold-light); margin-bottom: 10px; }
        .hero p { font-size: 1.1rem; color: var(--text-muted); font-style: italic; margin-bottom: 30px; }
        
        .cta-btn { background: linear-gradient(135deg, var(--gold) 0%, #aa771c 100%); color: #000; padding: 12px 30px; border-radius: 5px; font-weight: 600; text-decoration: none; display: inline-block; transition: transform 0.2s; border: none; cursor: pointer; text-align: center; }
        .cta-btn:hover { transform: translateY(-2px); }

        .section-container { padding: 80px 5%; max-width: 1200px; margin: 0 auto; }
        .section-title { text-align: center; font-size: 2rem; color: var(--gold); margin-bottom: 40px; }

        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .service-card { background: var(--card-bg); border: 1px solid rgba(212, 175, 55, 0.2); padding: 30px; border-radius: 10px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.3s; }
        .service-card:hover { transform: translateY(-5px); border-color: var(--gold); }
        .service-card i { font-size: 2.2rem; color: var(--gold); margin-bottom: 15px; }
        .service-card h3 { font-size: 1.2rem; margin-bottom: 8px; }
        .service-card p { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px; }
        .price-tag { color: var(--gold-light); font-weight: 700; font-size: 1.1rem; margin-bottom: 15px; }

        /* Advertising Gallery Section */
        .ad-section { background: #040810; padding: 60px 5%; text-align: center; border-top: 1px solid rgba(212,175,55,0.1); border-bottom: 1px solid rgba(212,175,55,0.1); }
        .ad-grid { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 30px; }
        .ad-card { background: var(--card-bg); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; overflow: hidden; max-width: 350px; width: 100%; }
        .ad-card img { width: 100%; height: 220px; object-fit: cover; }
        .ad-card p { padding: 15px; font-size: 0.9rem; color: var(--text-muted); }

        /* Public Form & Invoice Generator */
        .tools-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 40px; padding: 80px 5%; max-width: 1200px; margin: 0 auto; }
        .form-box, .invoice-box { background: var(--card-bg); border: 1px solid rgba(212,175,55,0.2); padding: 30px; border-radius: 10px; }
        .form-box h3, .invoice-box h3 { color: var(--gold); margin-bottom: 20px; font-size: 1.4rem; }
        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px; }
        .input-group input, .input-group select, .input-group textarea { width: 100%; padding: 10px; background: #070d1b; border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 5px; outline: none; }
        .input-group input:focus, .input-group select:focus { border-color: var(--gold); }
        
        #invoiceOutput { background: #070d1b; padding: 15px; border-radius: 5px; border: 1px dashed var(--gold); margin-top: 15px; font-size: 0.85rem; display: none; }

        /* Support Tech Section */
        .support-section { padding: 60px 5%; text-align: center; background: radial-gradient(circle at center, #0f172a 0%, var(--bg-dark) 80%); }
        .support-grid { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; margin-top: 30px; }
        .support-card { background: #070d1b; border: 1px solid rgba(212,175,55,0.2); padding: 25px; border-radius: 8px; width: 280px; }
        .support-card i { color: var(--gold); font-size: 2rem; margin-bottom: 10px; }

        /* Altra AI Assistant Chat Widget */
        .chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 3000; }
        .chat-btn { background: var(--gold); color: #000; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
        .chat-box { display: none; position: absolute; bottom: 75px; right: 0; width: 320px; background: var(--card-bg); border: 1px solid rgba(212,175,55,0.4); border-radius: 10px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.5); }
        .chat-header { background: #112240; padding: 12px 15px; color: var(--gold); font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
        .chat-body { height: 260px; padding: 15px; overflow-y: auto; font-size: 0.85rem; display: flex; flex-direction: column; gap: 10px; }
        .bot-msg { background: #1a2b4c; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-start; color: var(--text-light); }
        .user-msg { background: var(--gold); color: #000; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-end; font-weight: 500; }
        .chat-footer { display: flex; border-top: 1px solid rgba(255,255,255,0.1); }
        .chat-footer input { flex: 1; background: transparent; border: none; padding: 10px; color: #fff; outline: none; font-size: 0.85rem; }
        .chat-footer button { background: var(--gold); border: none; padding: 0 15px; font-weight: 600; cursor: pointer; }

        footer { text-align: center; padding: 25px; background: #020408; font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); }
    </style>
</head>
<body>

    <header>
        <div class="logo-area">
            <img src="logo.png" alt="Logo">
            <div>
                <h1>KRISHNYANSH</h1>
                <p>ZENOVA PEAK TECH HUB</p>
            </div>
        </div>
        <nav>
            <a href="#services">Services & Pricing</a>
            <a href="#ads">Ad Gallery</a>
            <a href="#register">Public Form</a>
            <a href="#invoice">Invoice</a>
            <a href="#support">Support</a>
        </nav>
    </header>

    <section class="hero">
        <div class="badge"><i class="fas fa-check-circle"></i> BN 9701468 Verified</div>
        <h2>Start Your Business Today - 100% Online Across Nigeria</h2>
        <p>"From Idea to Enterprise - We Make It Happen."</p>
        <a href="https://wa.me/2349067862223" class="cta-btn"><i class="fab fa-whatsapp"></i> Chat with CEO Ruby Garg</a>
    </section>

    <!-- Detailed Services & Exact Pricing Menu -->
    <section class="section-container" id="services">
        <h2 class="section-title">Our Services & Official Pricing</h2>
        <div class="services-grid">
            <div class="service-card">
                <div>
                    <i class="fas fa-file-alt"></i>
                    <h3>CAC Business Name (BN)</h3>
                    <p>Official registration for enterprise business names across Nigeria.</p>
                </div>
                <div>
                    <div class="price-tag">₦45,000</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Register Now</a>
                </div>
            </div>
            <div class="service-card">
                <div>
                    <i class="fas fa-building"></i>
                    <h3>CAC Limited Company (LTD)</h3>
                    <p>Incorporate your private limited liability company with complete corporate filing.</p>
                </div>
                <div>
                    <div class="price-tag">₦90,000</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Register Now</a>
                </div>
            </div>
            <div class="service-card">
                <div>
                    <i class="fas fa-hands-helping"></i>
                    <h3>NGO & Other Registrations</h3>
                    <p>Specialized incorporation for Non-Governmental Organizations, Churches, and Associations.</p>
                </div>
                <div>
                    <div class="price-tag">₦150,000</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Register Now</a>
                </div>
            </div>
            <div class="service-card">
                <div>
                    <i class="fas fa-award"></i>
                    <h3>SMEDAN Certificate</h3>
                    <p>Official SME registration to qualify for grants, loans, and federal benefits.</p>
                </div>
                <div>
                    <div class="price-tag">₦15,000</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Register Now</a>
                </div>
            </div>
            <div class="service-card">
                <div>
                    <i class="fas fa-robot"></i>
                    <h3>Altra AI Automation</h3>
                    <p>Custom AI workflows and automated assistant setups built for scaling your business.</p>
                </div>
                <div>
                    <div class="price-tag">₦85k setup + ₦15k/mo</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Request Setup</a>
                </div>
            </div>
            <div class="service-card">
                <div>
                    <i class="fas fa-chart-line"></i>
                    <h3>Business Plan</h3>
                    <p>Bank-ready financial models and comprehensive plans to secure funding.</p>
                </div>
                <div>
                    <div class="price-tag">₦35,000</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Order Plan</a>
                </div>
            </div>
            <div class="service-card">
                <div>
                    <i class="fas fa-handshake"></i>
                    <h3>Business Consultancy</h3>
                    <p>Expert 1-on-1 strategic scaling sessions with enterprise specialists.</p>
                </div>
                <div>
                    <div class="price-tag">₦30,000</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Book Session</a>
                </div>
            </div>
            <div class="service-card">
                <div>
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>GBP Setup with Map</h3>
                    <p>Google Business Profile setup and local map optimization to drive customers.</p>
                </div>
                <div>
                    <div class="price-tag">₦45,000</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Optimize Now</a>
                </div>
            </div>
            <div class="service-card" style="border-color: var(--gold);">
                <div>
                    <i class="fas fa-crown" style="color:var(--gold);"></i>
                    <h3>Complete Business Brand Package</h3>
                    <p>All-in-one branding, registration framework, and digital layout solution.</p>
                </div>
                <div>
                    <div class="price-tag">₦90,000</div>
                    <a href="#register" class="cta-btn" style="width:100%; padding:8px;">Get Complete Package</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Advertising Pictures & Gallery Section -->
    <section class="ad-section" id="ads">
        <h2 class="section-title">Featured Business Advertising & Flyers</h2>
        <p style="color: var(--text-muted);">Explore our verified corporate campaigns and promotional flyers across Nigeria.</p>
        <div class="ad-grid">
            <div class="ad-card">
                <img src="ad1.png" alt="Advertisement 1" onerror="this.src='https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=60'">
                <p><strong>Zenova Peak Hub Brand Flyer</strong><br>100% Online Business Setup Across Nigeria.</p>
            </div>
            <div class="ad-card">
                <img src="ad2.png" alt="Advertisement 2" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60'">
                <p><strong>Altra AI Automation Campaign</strong><br>Transforming Enterprise Workflows with Intelligent Tech.</p>
            </div>
        </div>
    </section>

    <!-- Public Registration Form & Invoice Generator -->
    <div class="tools-grid">
        <div class="form-box" id="register">
            <h3>Public Service Request Form</h3>
            <form onsubmit="submitForm(event)">
                <div class="input-group">
                    <label>Full Name</label>
                    <input type="text" id="clientName" required placeholder="Enter your name">
                </div>
                <div class="input-group">
                    <label>Phone Number / WhatsApp</label>
                    <input type="text" id="clientPhone" required placeholder="0906XXXXXXX">
                </div>
                <div class="input-group">
                    <label>Select Service</label>
                    <select id="clientService">
                        <option value="CAC Business Name (BN) - ₦45,000">CAC Business Name (BN) - ₦45,000</option>
                        <option value="CAC Limited Company (LTD) - ₦90,000">CAC Limited Company (LTD) - ₦90,000</option>
                        <option value="NGO & Other Registrations - ₦150,000">NGO & Other Registrations - ₦150,000</option>
                        <option value="SMEDAN Certificate - ₦15,000">SMEDAN Certificate - ₦15,000</option>
                        <option value="Altra AI Automation - ₦85k setup + ₦15k/mo">Altra AI Automation - ₦85k setup + ₦15k/mo</option>
                        <option value="Business Plan - ₦35,000">Business Plan - ₦35,000</option>
                        <option value="Business Consultancy - ₦30,000">Business Consultancy - ₦30,000</option>
                        <option value="GBP Setup with Map - ₦45,000">GBP Setup with Map - ₦45,000</option>
                        <option value="Complete Business Brand Package - ₦90,000">Complete Business Brand Package - ₦90,000</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Additional Details / Notes</label>
                    <textarea id="clientNotes" rows="3" placeholder="Tell us about your business requirement..."></textarea>
                </div>
                <button type="submit" class="cta-btn" style="width:100%;">Submit Request</button>
            </form>
        </div>

        <div class="invoice-box" id="invoice">
            <h3>Instant Invoice Generator</h3>
            <div class="input-group">
                <label>Client / Company Name</label>
                <input type="text" id="invClient" placeholder="Customer Name">
            </div>
            <div class="input-group">
                <label>Select Service</label>
                <select id="invService">
                    <option value="CAC Business Name (BN) - ₦45,000">CAC Business Name (BN) - ₦45,000</option>
                    <option value="CAC Limited Company (LTD) - ₦90,000">CAC Limited Company (LTD) - ₦90,000</option>
                    <option value="NGO & Other Registrations - ₦150,000">NGO & Other Registrations - ₦150,000</option>
                    <option value="SMEDAN Certificate - ₦15,000">SMEDAN Certificate - ₦15,000</option>
                    <option value="Altra AI Automation - ₦85,000 setup + ₦15,000/mo">Altra AI Automation - ₦85,000 setup + ₦15,000/mo</option>
                    <option value="Business Plan - ₦35,000">Business Plan - ₦35,000</option>
                    <option value="Business Consultancy - ₦30,000">Business Consultancy - ₦30,000</option>
                    <option value="GBP Setup with Map - ₦45,000">GBP Setup with Map - ₦45,000</option>
                    <option value="Complete Business Brand Package - ₦90,000">Complete Business Brand Package - ₦90,000</option>
                </select>
            </div>
            <button type="button" class="cta-btn" style="width:100%; margin-bottom:15px;" onclick="generateInvoice()">Generate Official Invoice</button>
            
            <div id="invoiceOutput"></div>
        </div>
    </div>

    <!-- Support Tech Section -->
    <section class="support-section" id="support">
        <h2 class="section-title">Support & Tech Assistance</h2>
        <p style="color: var(--text-muted);">Our expert engineering and support team ensures rapid turnaround across Nigeria.</p>
        <div class="support-grid">
            <div class="support-card">
                <i class="fas fa-headset"></i>
                <h3>24/7 Client Helpdesk</h3>
                <p style="font-size:0.85rem; color:var(--text-muted);">Direct escalation to CEO Ruby Garg via WhatsApp for active projects.</p>
            </div>
            <div class="support-card">
                <i class="fas fa-shield-alt"></i>
                <h3>Verified Compliance</h3>
                <p style="font-size:0.85rem; color:var(--text-muted);">Official registration filing under BN 9701468 regulations.</p>
            </div>
            <div class="support-card">
                <i class="fas fa-microchip"></i>
                <h3>Altra AI Integration</h3>
                <p style="font-size:0.85rem; color:var(--text-muted);">Custom AI solutions engineered for modern enterprise scale.</p>
            </div>
        </div>
    </section>

    <!-- Altra AI Assistant Chat Widget -->
    <div class="chat-widget">
        <div class="chat-btn" onclick="toggleChat()"><i class="fas fa-robot"></i></div>
        <div class="chat-box" id="chatBox">
            <div class="chat-header">
                <span>Altra AI Assistant</span>
                <span style="cursor:pointer;" onclick="toggleChat()">&times;</span>
            </div>
            <div class="chat-body" id="chatBody">
                <div class="bot-msg">Hello! I am Altra, your AI assistant at Krishnyansh Zenova Peak Tech Hub. Ask me about our prices for CAC, SMEDAN, AI automation, or brand packages!</div>
            </div>
            <div class="chat-footer">
                <input type="text" id="chatInput" placeholder="Ask Altra AI anything..." onkeypress="handleKeyPress(event)">
                <button onclick="sendAiMessage()">Ask</button>
            </div>
        </div>
    </div>
app.get('/admin-login', (req, res) => {
    res.sendFile(__dirname + '/admin-login.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});
    <footer>
        <p>&copy; 2026 Krishnyansh Zenova Peak Tech Hub (BN 9701468). Founder & CEO: Ruby Garg. All Rights Reserved.</p>
    </footer>

    <script>
        function submitForm(e) {
            e.preventDefault();
            const name = document.getElementById('clientName').value;
            const phone = document.getElementById('clientPhone').value;
            const service = document.getElementById('clientService').value;
            alert(\`Thank you \${name}! Your request for \${service} has been received successfully. We will reach out via WhatsApp (\${phone}) shortly.\`);
            e.target.reset();
        }

        function generateInvoice() {
            const client = document.getElementById('invClient').value || 'Valued Client';
            const service = document.getElementById('invService').value;
            const date = new Date().toLocaleDateString();
            const invNumber = 'ZPV-' + Math.floor(1000 + Math.random() * 9000);
            
            const output = document.getElementById('invoiceOutput');
            output.style.display = 'block';
            output.innerHTML = \`
                <strong>KRISHNYANSH ZENOVA PEAK TECH HUB</strong><br>
                <span style="color:var(--gold);">INVOICE: \${invNumber}</span> | Date: \${date}<br>
                ----------------------------------------<br>
                <strong>Billed To:</strong> \${client}<br>
                <strong>Service:</strong> \${service}<br>
                <strong>Status:</strong> <span style="color:#22c55e;">Pending Payment</span><br>
                ----------------------------------------<br>
                <em>RC/BN: 9701468 | CEO: Ruby Garg</em>
            \`;
        }

        function toggleChat() {
            const box = document.getElementById('chatBox');
            box.style.display = box.style.display === 'block' ? 'none' : 'block';
        }

        function sendAiMessage() {
            const input = document.getElementById('chatInput');
            const body = document.getElementById('chatBody');
            if(!input.value.trim()) return;
            
            const userText = input.value;
            body.innerHTML += \`<div class="user-msg">\${userText}</div>\`;
            input.value = '';
            body.scrollTop = body.scrollHeight;

            setTimeout(() => {
                let reply = "That is a great question! You can reach our CEO Ruby Garg directly on WhatsApp at 0906 786 2223 for instant processing.";
                const lower = userText.toLowerCase();
                
                if(lower.includes('bn') || lower.includes('business name')) {
                    reply = "CAC Business Name (BN) registration is ₦45,000.";
                } else if(lower.includes('ltd') || lower.includes('limited')) {
                    reply = "CAC Limited Company (LTD) registration is ₦90,000.";
                } else if(lower.includes('ngo') || lower.includes('church')) {
                    reply = "NGO and other specialized registrations cost ₦150,000.";
                } else if(lower.includes('smedan')) {
                    reply = "SMEDAN certificates cost ₦15,000.";
                } else if(lower.includes('ai') || lower.includes('automation')) {
                    reply = "Altra AI Automation costs ₦85,000 setup fee plus ₦15,000 monthly maintenance.";
                } else if(lower.includes('plan')) {
                    reply = "Comprehensive Business Plans cost ₦35,000.";
                } else if(lower.includes('consultancy') || lower.includes('consult')) {
                    reply = "Business Consultancy sessions cost ₦30,000.";
                } else if(lower.includes('gbp') || lower.includes('map') || lower.includes('google')) {
                    reply = "Google Business Profile setup with map optimization costs ₦45,000.";
                } else if(lower.includes('brand') || lower.includes('package')) {
                    reply = "The Complete Business Brand Package costs ₦90,000.";
                } else if(lower.includes('ruby') || lower.includes('ceo')) {
                    reply = "Our tech hub is led by Founder & CEO Ruby Garg, operating 100% online across Nigeria.";
                }
                
                body.innerHTML += \`<div class="bot-msg">\${reply}</div>\`;
                body.scrollTop = body.scrollHeight;
            }, 600);
        }

        function handleKeyPress(e) {
            if(e.key === 'Enter') sendAiMessage();
        }
    </script>
</body>
</html>`;

fs.writeFileSync(indexPath, updatedWebsiteCode);
app.get('/admin-login', (req, res) => {
    res.sendFile(__dirname + '/admin-login.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});
app.get('/', (req, res) => { 
res.sendFile(indexPath);
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === "admin@zenova.com" && password === "Niharika@86") {
        res.redirect('/admin');
    } else {
        res.send("<h3>Invalid Login!</h3><p>Please check your email and password.</p><a href='/admin-login'>Go Back</a>");
    }
});

app.listen(PORT, () => {
    console.log(`Zenova Peak Tech Hub server running smoothly on port ${PORT}`);
});
