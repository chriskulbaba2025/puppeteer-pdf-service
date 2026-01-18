import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/pdf", async (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).json({ error: "html required" });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    await browser.close();
  }
});

app.listen(process.env.PORT || 3000);
