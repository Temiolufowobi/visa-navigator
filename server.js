require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error: ' + err.message);
    } else {
      res.send(data);
    }
  });
});

app.post('/analyze', async (req, res) => {
  const { status, goal, situation, country } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: `You are a US immigration specialist. Return ONLY valid JSON, no extra text.
Format: {"pathways":[{"name":"","code":"","match":"Strong match","why_it_fits":"","key_requirements":["","",""],"main_barrier":"","uscis_url":""}],"next_steps":["","",""],"important_note":""}
Match values: "Strong match", "Possible match", or "Limited match".
Max 3 pathways. Keep descriptions under 100 words each.
Use only these USCIS URLs:
- K-1: https://www.uscis.gov/K-1
- Spouse green card: https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen
- Asylum: https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum
- H-1B: https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations
- EB-1: https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1
- EB-2: https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2
- EB-3: https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3
- Naturalization: https://www.uscis.gov/citizenship/apply-for-citizenship
- Green card: https://www.uscis.gov/green-card`,
      messages: [{ role: 'user', content: `Status: ${status}\nGoal: ${goal}\nCountry: ${country}\nSituation: ${situation}` }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, '').trim();
  res.json(JSON.parse(text));
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));