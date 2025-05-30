#!/usr/bin/env node

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const fs = require("fs-extra");
const { spawn } = require("child_process");
const path = require("path");

/**
 * Extract MCC data using Camelot Python script
 */
async function extractWithCamelot(inputFile, outputFile, startPage, endPage) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "parse-mcc-pdf.py");
    const pythonCmd = "python3";
    const args = [scriptPath, inputFile, startPage.toString()];

    if (endPage) {
      args.push(endPage.toString());
    }

    // Always use lattice method
    args.push("lattice");

    // Create log file path
    const logFile = outputFile.replace(/\.json$/, "") + "-logs.txt";
    let logContent = [];

    console.log(`Running: ${pythonCmd} ${args.join(" ")}`);
    logContent.push(`Running: ${pythonCmd} ${args.join(" ")}\n`);

    const pythonProcess = spawn(pythonCmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(output);
      logContent.push(output);
    });

    pythonProcess.stderr.on("data", (data) => {
      const output = data.toString();
      if (
        output.includes("warning") ||
        output.includes("Warning") ||
        output.includes("CropBox") ||
        output.includes("CryptographyDeprecationWarning")
      ) {
        // Suppress noisy warnings - we'll handle page feedback in Python script
        return;
      } else {
        console.error(`Python error: ${output}`);
        logContent.push(`Python error: ${output}`);
        errorData += output;
      }
    });

    pythonProcess.on("close", (code) => {
      // Write log file
      try {
        fs.writeFileSync(logFile, logContent.join(""));
        console.log(`📋 Logs saved to: ${logFile}`);
      } catch (error) {
        console.warn(`Warning: Could not save logs: ${error.message}`);
      }

      if (code === 0) {
        // Copy the Camelot results to the specified output file
        const camelotOutputFile = "mcc_data_output.json";
        try {
          if (fs.existsSync(camelotOutputFile)) {
            const data = fs.readFileSync(camelotOutputFile, "utf8");
            fs.writeFileSync(outputFile, data);

            // Parse and show summary
            const mccData = JSON.parse(data);
            const count = Object.keys(mccData).length;

            console.log(`\n📈 Summary:`);
            console.log(`Total MCC codes extracted: ${count}`);

            if (count > 0) {
              console.log(`\n🔍 Sample results:`);
              const samples = Object.entries(mccData).slice(0, 5);
              samples.forEach(([code, desc]) => {
                console.log(`  ${code}: ${desc}`);
              });

              if (count > 5) {
                console.log(`  ... and ${count - 5} more codes`);
              }
            }

            console.log(`\n🎉 Extraction completed successfully!`);
            resolve();
          } else {
            reject(new Error("Camelot extraction did not produce output file"));
          }
        } catch (error) {
          reject(
            new Error(`Failed to process Camelot results: ${error.message}`)
          );
        }
      } else {
        reject(
          new Error(
            `Camelot extraction failed with exit code ${code}: ${errorData}`
          )
        );
      }
    });

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Camelot extraction: ${error.message}`));
    });
  });
}

/**
 * Check if Python dependencies are installed
 */
async function checkPythonDependencies() {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(
      "python3",
      ["-c", 'import camelot; print("Camelot installed successfully")'],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Camelot dependency check passed");
        if (output && output.trim()) {
          console.log(`  ${output.trim()}`);
        }
        resolve();
      } else {
        reject(
          new Error(
            "Missing Python dependencies: Camelot is required for PDF table extraction\n" +
              "Install with: pip3 install camelot-py[cv] PyPDF2==2.12.1\n" +
              (errorOutput ? `Error: ${errorOutput.trim()}` : "")
          )
        );
      }
    });
  });
}

/**
 * Main CLI application
 */
async function main() {
  const argv = yargs(hideBin(process.argv))
    .command(
      "$0 [pdf]",
      "Extract MCC codes from PDF using Camelot",
      (yargs) => {
        return yargs
          .positional("pdf", {
            describe: "Path to PDF file",
            type: "string",
            default: "mcc.pdf",
          })
          .option("output", {
            alias: "o",
            describe: "Output JSON file path",
            type: "string",
            default: "mcc_data.json",
          })
          .option("start-page", {
            alias: "s",
            describe: "Start page number",
            type: "number",
            default: 1,
          })
          .option("end-page", {
            alias: "e",
            describe:
              "End page number (auto-detects PDF length if not specified)",
            type: "number",
          })
          .example("$0", "Extract MCC codes from mcc.pdf")
          .example(
            "$0 my-mcc.pdf -o output.json",
            "Extract from custom PDF to custom output"
          )
          .example(
            "$0 --start-page 30 --end-page 50",
            "Extract from specific page range"
          );
      }
    )
    .help()
    .alias("help", "h")
    .version()
    .alias("version", "V")
    .strict()
    .wrap(100).argv;

  try {
    const { pdf, output, startPage, endPage } = argv;

    console.log("🚀 MCC PDF Parser with Camelot");
    console.log("===============================");
    console.log(`📁 Input PDF: ${pdf}`);
    console.log(`📄 Output: ${output}`);
    console.log(
      ` Pages: ${startPage}${
        endPage ? `-${endPage}` : " (auto-detect full PDF)"
      }`
    );
    console.log();

    // Check if PDF exists
    if (!(await fs.pathExists(pdf))) {
      console.error(`❌ Error: PDF file '${pdf}' not found`);
      process.exit(1);
    }

    // Check Python dependencies
    try {
      await checkPythonDependencies();
    } catch (error) {
      console.error(`❌ ${error.message}`);
      console.log("\n🔧 To install Camelot:");
      console.log("pip3 install camelot-py[cv] PyPDF2==2.12.1");
      console.log("\nAdditional dependencies may be needed:");
      console.log("macOS:     brew install ghostscript");
      console.log("Ubuntu:    sudo apt-get install ghostscript");
      process.exit(1);
    }

    // Run Camelot extraction
    try {
      await extractWithCamelot(pdf, output, startPage, endPage);
    } catch (error) {
      console.error(`❌ Extraction failed: ${error.message}`);

      // Provide helpful suggestions
      console.log("\n🔧 Troubleshooting Tips:");
      console.log(
        "• Check if the PDF contains actual table data (not scanned images)"
      );
      console.log("• Verify the page range contains table data");
      console.log(
        "• Test with a smaller page range first: --start-page 2 --end-page 3"
      );

      process.exit(1);
    }

    console.log("\n🎉 Extraction completed successfully!");
    console.log(`💾 Results saved to: ${output}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { extractWithCamelot };
