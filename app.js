const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const path = require("path");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  // Path to your HTML file
  const filePath = path.join(
    __dirname, "index.html"
  );
  res.sendFile(filePath);
});

app.post("/generate-invoice", async (req, res) => {
  try {
    // Retrieve form data
    const { item, price, email } = req.body;

    console.log("Submitted Data:");
    console.log("Name:", item);
    console.log("Email:", email);
    console.log("Message:", email);

    // Generate the invoice PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Construct the HTML content dynamically
    let htmlContent = `
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="styles.css">
        </head>
        <body>
          <h1>Invoice</h1>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
    `;

      htmlContent += `
        <tr>
          <td>${item}</td>
          <td>${price}</td>
        </tr>
      `;

    htmlContent += `
          </tbody>
        </table>
      </body>
    </html>
    `;

    await page.setContent(htmlContent);
    await page.pdf({ path: "invoice.pdf", format: "A4" });
    await browser.close();

    // Send the email with the PDF attachment
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "mathenge.joseph18@students.dkut.ac.ke",
        pass: "wakaHATOLI001#",
      },
    });

    const mailOptions = {
      from: "mathenge.joseph18@students.dkut.ac.ke",
      to: email,
      subject: "Invoice",
      text: "Please find attached the invoice PDF.",
      attachments: [
        {
          path: "invoice.pdf",
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.status(500).send("Error sending email");
      } else {
        console.log("Email sent:", info.response);
        res.send("Invoice generated and email sent successfully");
      }
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Error generating invoice");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
