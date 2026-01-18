import express from "express";
import puppeteer from "puppeteer";

const app = express();

// Accept BOTH JSON objects and raw string bodies from n8n
app.use(express.text({ limit: "20mb", type: "*/*" }));
app.use(express.json({ limit: "20mb" }));

app.post("/pdf", async (req, res) => {
  let payload;
  console.log("DEBUG content-type:", req.headers["content-type"]);
console.log("DEBUG typeof body:", typeof req.body);
console.log(
  "DEBUG body preview:",
  typeof req.body === "string"
    ? req.body.slice(0, 300)
    : JSON.stringify(req.body).slice(0, 300)
);

  // HARD FIX: n8n Raw JSON often arrives as string
  try {
    payload =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { bodyHtml, headerHtml, footerHtml } = payload || {};

  if (!bodyHtml || !headerHtml || !footerHtml) {
    return res
      .status(400)
      .json({ error: "bodyHtml, headerHtml, footerHtml required" });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.emulateMediaType("screen");

    // Body-only HTML
    await page.setContent(bodyHtml, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerHtml,
      footerTemplate: footerHtml,
      margin: {
        top: "200px",
        bottom: "120px",
        left: "40px",
        right: "40px",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

app.listen(process.env.PORT || 3000);
