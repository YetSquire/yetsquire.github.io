const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const SCOPES = ["https://www.googleapis.com/auth/documents.readonly"];
const TOKEN_PATH = "token.json";

let authClient = null;
let oAuth2Client = null;

// ----------------------------------------
// 1. Create OAuth2 client
// ----------------------------------------
function createOAuthClient() {
  const credentials = JSON.parse(fs.readFileSync("credentials.json"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0] // redirect_uri = "http://localhost:3001/oauth2callback"
  );

  // Try to load existing token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    authClient = oAuth2Client;
    console.log("Using saved token.json");
  }
}

createOAuthClient();

// ----------------------------------------
// 2. OAuth redirect endpoint
// ----------------------------------------
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No code received from Google.");

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    authClient = oAuth2Client;
    res.send("Authorization complete! You can close this tab.");
    console.log("OAuth token saved.");
  } catch (err) {
    console.error("Error getting token:", err);
    res.status(500).send("Failed to retrieve token.");
  }
});

// ----------------------------------------
// 3. Your compile endpoint
// ----------------------------------------
app.post("/compile", async (req, res) => {
  try {
    if (!authClient) return res.status(500).json({ error: "Google OAuth not ready" });

    const { docId, tabId, tabTitle } = req.body;
    const docs = google.docs({ version: "v1", auth: authClient });
    const response = await docs.documents.get({ documentId: docId, includeTabsContent: true });

    const document = response.data;
    const tab = document.tabs.find(t => t.tabProperties.tabId === tabId);

    if (!tab) return res.json({ ok: false });

    // Print tab content
    tab.documentTab.body.content.forEach(block => {
      if (block.paragraph) {
        const text = block.paragraph.elements?.map(e => e.textRun?.content || "").join("");
        process.stdout.write(text);
      }
    });

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "compile failed" });
  }
});

// ----------------------------------------
// 4. Start server
// ----------------------------------------
app.listen(3001, () => {
  console.log("Compile server running on http://localhost:3001");
});