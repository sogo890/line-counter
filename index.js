const express = require("express");
const line = require("@line/bot-sdk");
const fs = require("fs");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const app = express();
const client = new line.Client(config);

let counts = {};
const FILE = "counts.json";

if (fs.existsSync(FILE)) {
  counts = JSON.parse(fs.readFileSync(FILE));
}

app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.json({ success: true }))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

function saveData() {
  fs.writeFileSync(FILE, JSON.stringify(counts, null, 2));
}

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return null;

  const userId = event.source.userId;
  const today = new Date().toISOString().slice(0, 10);

  if (!counts[today]) counts[today] = {};
  if (!counts[today][userId]) counts[today][userId] = 0;

  counts[today][userId]++;
  saveData();

  if (event.message.text === "!오늘마딧수") {
    let msg = "📊 오늘 마딧수\n";
    for (let id in counts[today]) {
      msg += `${id} : ${counts[today][id]}회\n`;
    }

    return client.replyMessage(event.replyToken, {
      type: "text",
      text: msg
    });
  }
}

app.listen(process.env.PORT || 3000);
