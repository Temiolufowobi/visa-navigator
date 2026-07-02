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
      res.status(500).send('Error loading page: ' + err.message + ' | Path: ' + filePath);
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
      system: 'You are a US immigration information specialist. Analyze the situation and return ONLY valid JSON with visa pathways. For uscis_url ONLY use these exact verified URLs - K-1 visa: https://www.uscis.gov/K-1, IR/CR spouse green card: https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen, asylum: https://www.uscis.gov/humanitarian/refugees-and-asylum/asylum, H-1B: https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations, F-1 student: https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment, EB-1: https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1, EB-2: https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2, EB-3: https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3, naturalization: https://www.uscis.gov/citizenship/apply-for-citizenship, green card general: https://www.uscis.gov/green-card. Format: {"pathways":[{"name":"","code":"","match":"Strong match","why_it_fits":"","key_requirements":[],"main_barrier":"","uscis_url":""}],"next_steps":[],"important_note":""}',
      messages: [{ role: 'user', content: `Status: ${status}\nGoal: ${goal}\nCountry: ${country}\nSituation: ${situation}` }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, '').trim();
  res.json(JSON.parse(text));
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));