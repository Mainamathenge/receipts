const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const path = require("path");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  // Path to your HTML file
  const filePath = path.join(__dirname, "index.html");
  res.sendFile(filePath);
});

const itemzSchema = new mongoose.Schema({
  item: String,
  price: Number,
});

const Itemz = mongoose.model("Itemz", itemzSchema);

app.post("/submit", (req, res) => {
  const { item, price } = req.body;

  // Create a new item object
  const newItem = new Itemz({
    item,
    price: parseFloat(price),
  });

  // Save the item to the database
  newItem
    .save()
    .then(() => {
      res.send("Item added successfully!");
    })
    .catch((error) => {
      res.status(500).send("Error saving item to database: " + error);
    });
});

app.post("/generate-invoice", async (req, res) => {
  try {
    // Retrieve form data
    const { email } = req.body;
    const items = await Itemz.find();
    console.log(items);
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

    for (let i = 0; i < items.length; i++) {
      htmlContent += `
        <tr>
          <td>${items[i].item}</td>
          <td>${items[i].price}</td>
        </tr>
      `;
    }

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
        // Download the PDF file
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=invoice.pdf"
        );
        res.download("invoice.pdf");
      }
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Error generating invoice");
  }
});

app.get("/invoice", (req, res) => {
  // Find all items in the database
  Itemz.find()
    .then((items) => {
      // Create a new PDF document
      const doc = new PDFDocument();

      // Set the response headers for PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="invoice.pdf"'
      );

      // Pipe the PDF document to the response
      doc.pipe(res);

      // Generate the invoice content
      doc.fontSize(20).text("Invoice", { underline: true, align: "center" });
      doc.moveDown();
      doc.fontSize(16).text("Items:", { underline: true });

      items.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.item} - $${item.price}`);
      });

      sendEmailWithAttachment(doc, (error) => {
      if (error) {
        res.status(500).send('Error sending email: ' + error);
      } else {
        res.send('Invoice sent successfully!');
      }
    });

  }).catch((error) => {
    res.status(500).send('Error generating invoice: ' + error);
  });


      //doc.end();

    // // Send the email with the PDF attachment
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: "mathenge.joseph18@students.dkut.ac.ke",
    //     pass: "wakaHATOLI001#",
    //   },
    // });

    // const mailOptions = {
    //   from: "mathenge.joseph18@students.dkut.ac.ke",
    //   to: email,
    //   subject: "Invoice",
    //   text: "Please find attached the invoice PDF.",
    //   attachments: [
    //     {
    //       filename: "invoice.pdf",
    //       content: doc,
    //     }
    //   ],
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.error("Error sending email:", error);
    //     res.status(500).send("Error sending email");
    //   } else {
    //     doc.end();
    //     console.log("Email sent:", info.response);
    //     res.send("Invoice generated and email sent successfully");
    //   }
    // });
    // })
    // .catch((error) => {
    //   res.status(500).send("Error generating invoice: " + error);
    // });
    
});

function sendEmailWithAttachment(attachment, callback) {
  console.log("senf");
  // Create a transporter for sending emails
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mathenge.joseph18@students.dkut.ac.ke",
      pass: "wakaHATOLI001#",
    },
  });

  // Prepare email details
  const mailOptions = {
    from: "mathenge.joseph18@students.dkut.ac.ke",
    to: "mainamathengej@gmail.com",
    subject: "Invoice",
    text: "Please find attached the invoice PDF.",
    attachments: [
      {
        filename: "invoice.pdf",
        content: attachment,
      },
    ],
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    console.log("sending mail");
    if (error) {
      console.log("Error sending email:", error);
      callback(error);
    } else {
      console.log("Email sent:", info.response);
      callback();
    }
  });
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

mongoose
  .connect(
    "mongodb+srv://mainamathengej:AF1BqdbgAVACmKwC@cluster0.z7bnuf2.mongodb.net/?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
  });
