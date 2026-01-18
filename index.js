import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "20mb" }));

app.post("/pdf", async (req, res) => {
  const { bodyHtml, headerHtml, footerHtml } = req.body;

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

    // Ensure screen styles render correctly
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
