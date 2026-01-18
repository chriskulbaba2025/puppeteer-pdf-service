import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "20mb" }));

app.post("/pdf", async (req, res) => {
  const { html, linkedinUrl = "" } = req.body;

  if (!html) {
    return res.status(400).json({ error: "html required" });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Ensure screen styles + SVGs render correctly
    await page.emulateMediaType("screen");

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const headerTemplate = `
      <div style="
        width:100%;
        padding:20px 40px;
        box-sizing:border-box;
        font-family:Arial,Helvetica,sans-serif;
        background:#0077B5;
        color:#fff;
        display:flex;
        align-items:center;
        gap:16px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M22.23 0H1.77C.79 0 0 .774 0 1.727v20.545C0 23.227.79 24 1.77 24h20.46c.98 0 1.77-.773 1.77-1.728V1.727C24 .774 23.21 0 22.23 0zM7.12 20.452H3.56V9h3.56v11.452zM5.34 7.433c-1.14 0-2.06-.93-2.06-2.074 0-1.145.92-2.074 2.06-2.074s2.06.93 2.06 2.074c0 1.145-.92 2.074-2.06 2.074zM20.452 20.452h-3.56v-5.569c0-1.328-.03-3.037-1.852-3.037-1.853 0-2.137 1.446-2.137 2.94v5.666h-3.56V9h3.417v1.561h.048c.476-.9 1.637-1.85 3.37-1.85 3.603 0 4.264 2.37 4.264 5.455v6.286z"/>
        </svg>
        <div style="font-size:20px;font-weight:600;">
          LinkedIn Profile Review
        </div>
      </div>
    `;

    const footerTemplate = `
      <div style="
        width:100%;
        font-size:10px;
        color:#666;
        padding:0 40px;
        box-sizing:border-box;
        display:flex;
        justify-content:space-between;
        font-family:Arial,Helvetica,sans-serif;
      ">
        <div>${linkedinUrl}</div>
        <div>
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      </div>
    `;

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: "120px",
        bottom: "90px",
        left: "50px",
        right: "50px",
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
