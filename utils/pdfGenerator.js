const PDFDocument =
  require("pdfkit");
const fs = require("fs");
const path =
  require("path");
const axios =
  require("axios");

// ================= DOWNLOAD FILE BUFFER =================
const downloadFileBuffer =
  async (
    fileUrl
  ) => {
    try {
      const response =
        await axios.get(
          fileUrl,
          {
            responseType:
              "arraybuffer",
          }
        );

      return response.data;
    } catch (error) {
      console.log(
        "Error downloading file:",
        error.message
      );

      return null;
    }
  };

// ================= CHECK FILE TYPE =================
// ================= CHECK FILE TYPE =================
const getFileType = (
  url
) => {
  const lowerUrl =
    url.toLowerCase();

  // PDF detection
  if (
    lowerUrl.includes(
      "/raw/upload/"
    ) ||
    lowerUrl.includes(
      ".pdf"
    )
  ) {
    return "pdf";
  }

  // Image detection
  if (
    lowerUrl.includes(
      "/image/upload/"
    ) ||
    /\.(jpg|jpeg|png|webp)$/i.test(
      lowerUrl
    )
  ) {
    return "image";
  }

  return "unknown";
};

// ================= GENERATE PDF =================
exports.generateApplicationPDF =
  async (
    application,
    uploadsDir
  ) => {
    return new Promise(
      async (
        resolve,
        reject
      ) => {
        try {
          const fileName = `application_${application._id}_${Date.now()}.pdf`;

          const filePath =
            path.join(
              uploadsDir,
              fileName
            );

          // ================= CREATE PDF =================
          const doc =
            new PDFDocument(
              {
                size: "A4",
                margin: 50,
              }
            );

          const stream =
            fs.createWriteStream(
              filePath
            );

          doc.pipe(stream);

          // ================= TITLE =================
          doc
            .fontSize(
              20
            )
            .font(
              "Helvetica-Bold"
            )
            .text(
              "Insurance Application Document",
              {
                align:
                  "center",
              }
            );

          doc.moveDown();

          // ================= APPLICATION DETAILS =================
          doc
            .fontSize(
              12
            )
            .font(
              "Helvetica-Bold"
            )
            .text(
              "Application Details:"
            );

          doc
            .fontSize(
              10
            )
            .font(
              "Helvetica"
            )
            .text(
              `Application ID: ${
                application.applicationId ||
                application._id
              }`
            )
            .text(
              `Car Number: ${
                application.carNo ||
                "N/A"
              }`
            )
            .text(
              `Third Party Insurance: ${
                application.tp ||
                "N/A"
              }`
            )
            .text(
              `Mobile Number: ${
                application.mobileNo ||
                "N/A"
              }`
            )
            .text(
              `Status: ${
                application.status ||
                "pending"
              }`
            )
            .text(
              `Created At: ${new Date(
                application.createdAt
              ).toLocaleString()}`
            );

          doc.moveDown();

          // ================= ADD FILES =================
          const addFilesToPDF =
            async (
              fileUrls,
              title
            ) => {
              if (
                !fileUrls ||
                fileUrls.length ===
                  0
              ) {
                return;
              }

              if (
                doc.y >
                700
              ) {
                doc.addPage();
              }

              doc
                .fontSize(
                  12
                )
                .font(
                  "Helvetica-Bold"
                )
                .fillColor(
                  "black"
                )
                .text(
                  title
                );

              doc.moveDown(
                0.5
              );

              for (
                let i = 0;
                i <
                fileUrls.length;
                i++
              ) {
                const fileUrl =
                  fileUrls[
                    i
                  ];

                try {
                  const fileType =
                    getFileType(
                      fileUrl
                    );

                  // ================= IMAGE =================
                  if (
                    fileType ===
                    "image"
                  ) {
                    const imageBuffer =
                      await downloadFileBuffer(
                        fileUrl
                      );

                    if (
                      imageBuffer
                    ) {
                      if (
                        doc.y >
                        500
                      ) {
                        doc.addPage();
                      }

                      doc
                        .fontSize(
                          10
                        )
                        .font(
                          "Helvetica"
                        )
                        .fillColor(
                          "black"
                        )
                        .text(
                          `Image ${
                            i +
                            1
                          }:`,
                          {
                            underline:
                              true,
                          }
                        );

                      doc.moveDown(
                        0.5
                      );

                      doc.image(
                        imageBuffer,
                        {
                          fit:
                            [
                              500,
                              400,
                            ],
                          align:
                            "center",
                        }
                      );

                      doc.moveDown();
                    }
                  }

                  // ================= PDF =================
                  else if (
                    fileType ===
                    "pdf"
                  ) {
                    if (
                      doc.y >
                      700
                    ) {
                      doc.addPage();
                    }

                    doc
                      .fontSize(
                        10
                      )
                      .font(
                        "Helvetica-Bold"
                      )
                      .fillColor(
                        "red"
                      )
                      .text(
                        `PDF Document ${
                          i +
                          1
                        }`
                      );

                    doc
                      .fontSize(
                        9
                      )
                      .font(
                        "Helvetica"
                      )
                      .fillColor(
                        "blue"
                      )
                      .text(
                        "Open PDF File",
                        {
                          link:
                            fileUrl,
                          underline:
                            true,
                        }
                      );

                    doc.moveDown();

                    console.log(
                      `PDF file linked: ${fileUrl}`
                    );
                  }

                  // ================= UNKNOWN =================
                  else {
                    console.log(
                      `Unsupported file: ${fileUrl}`
                    );
                  }
                } catch (
                  error
                ) {
                  console.log(
                    `Error processing file ${
                      i + 1
                    }:`,
                    error.message
                  );
                }
              }

              doc.moveDown();
            };

          // ================= DOCUMENTS =================
          await addFilesToPDF(
            application.rcBookImages,
            "RC Book Documents:"
          );

          await addFilesToPDF(
            application.aadharCardImages,
            "Aadhar Card Documents:"
          );

          await addFilesToPDF(
            application.panCardImages,
            "PAN Card Documents:"
          );

          await addFilesToPDF(
            application.oldPolicyImages,
            "Old Policy Documents:"
          );

          await addFilesToPDF(
            application.otherImages,
            "Other Documents:"
          );

          // ================= ADMIN POLICY =================
          if (
            application.adminPolicyDocument
          ) {
            doc.addPage();

            await addFilesToPDF(
              [
                application.adminPolicyDocument,
              ],
              "Admin Policy Document:"
            );
          }

          // ================= FOOTER =================
          doc.moveDown();

          doc
            .fontSize(8)
            .fillColor(
              "black"
            )
            .font(
              "Helvetica"
            )
            .text(
              `Generated on: ${new Date().toLocaleString()}`,
              {
                align:
                  "center",
              }
            );

          // ================= END PDF =================
          doc.end();

          stream.on(
            "finish",
            () => {
              console.log(
                `✅ PDF generated: ${fileName}`
              );

              resolve({
                fileName,
                filePath,
                fileUrl: `/uploads/${fileName}`,
              });
            }
          );

          stream.on(
            "error",
            (
              error
            ) => {
              reject(
                error
              );
            }
          );

          doc.on(
            "error",
            (
              error
            ) => {
              reject(
                error
              );
            }
          );
        } catch (
          error
        ) {
          console.error(
            "PDF Generation Error:",
            error
          );

          reject(
            error
          );
        }
      }
    );
  };

// ================= DELETE PDF =================
exports.deletePDF = (
  filePath
) => {
  try {
    if (
      fs.existsSync(
        filePath
      )
    ) {
      fs.unlinkSync(
        filePath
      );

      console.log(
        `✅ PDF deleted: ${filePath}`
      );
    }
  } catch (error) {
    console.error(
      "Error deleting PDF:",
      error
    );
  }
};