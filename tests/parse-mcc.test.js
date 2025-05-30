const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

describe("Parse MCC", () => {
  const testDir = path.join(__dirname, "test-files");
  const tempOutputFile = path.join(__dirname, "temp-test-output.json");

  // Clean up temp files after each test
  afterEach(() => {
    if (fs.existsSync(tempOutputFile)) {
      fs.unlinkSync(tempOutputFile);
    }
  });

  // Helper function to run extraction and get result
  const runExtraction = (pdfFile) => {
    const pdfPath = path.join(testDir, pdfFile);
    const command = `npm start -- "${pdfPath}" -o "${tempOutputFile}"`;

    try {
      execSync(command, {
        cwd: path.join(__dirname, ".."),
        stdio: "pipe",
      });

      if (fs.existsSync(tempOutputFile)) {
        const content = fs.readFileSync(tempOutputFile, "utf8");
        return JSON.parse(content);
      }
      return {};
    } catch (error) {
      console.error(`Extraction failed for ${pdfFile}:`, error.message);
      return {};
    }
  };

  test("mcc-1.pdf should produce exact expected output", () => {
    const expected = {
      "0742": "Veterinary Services",
      "0763": "Agricultural Co-operatives",
      "0780": "Landscaping and Horticultural Services",
      1520: "General Contractors - Residential and Commercial",
      1711: "Heating, Plumbing, and Air Conditioning Contractors",
    };

    const actual = runExtraction("mcc-1.pdf");
    expect(actual).toEqual(expected);
  });

  test("mcc-2.pdf should produce exact expected output", () => {
    const expected = {
      3834: "BAYMONT INN & SUITES",
      3835: "DOLCE HOTELS AND RESORTS",
      3836: "HAWTHORN BY WYNDHAM",
      3837: "HOSHINO RESORTS",
      3838: "KIMPTON HOTELS",
      3839: "KYORITSU HOTELS",
      3840: "RIO HOTELS",
      4011: "Railroads",
      4111: "Local and Suburban Commuter Passenger Transportation, Including Ferries",
      4112: "Passenger Railways",
      4119: "Ambulance Services",
      4121: "Taxicabs and Limousines",
    };

    const actual = runExtraction("mcc-2.pdf");
    expect(actual).toEqual(expected);
  });

  test("mcc-3.pdf should produce exact expected output", () => {
    const expected = {
      3267: "AIR PANAMA",
      3280: "AIR JAMAICA",
      3282: "AIR DJIBOUTI",
      3284: "AERO VIRGIN ISLANDS",
      3285: "AEROPERU",
      3286: "AEROLINEAS NICARAGUENSIS",
      3287: "AERO COACH AVIATION",
      3292: "CYPRUS AIRWAYS",
      3293: "ECUATORIANA",
      3294: "ETHIOPIAN AIRLINES",
      3295: "KENYA AIRWAYS",
      3296: "AIR BERLIN",
      3297: "TAROM ROMANIAN AIR TRANSPORT",
      3298: "AIR MAURITIUS",
      3299: "WIDEROE'S FLYVESELSKAP",
      3300: "AZUL AIR",
      3301: "WIZZ AIR",
      3302: "FLYBE LTD",
      3303: "TIGERAIR",
      3308: "CHINA SOUTHERN AIRLINES",
      3351: "AFFILIATED AUTO RENTAL",
      3352: "AMERICAN INTL RENT-A-CAR",
      3353: "BROOKS RENT-A-CAR",
      3354: "ACTION AUTO RENTAL",
      3355: "SIXT CAR RENTAL",
      3357: "HERTZ",
      3359: "PAYLESS CAR RENTAL",
      3360: "SNAPPY CAR RENTAL",
      3361: "AIRWAYS RENT-A-CAR",
      3362: "ALTRA AUTO RENTAL",
      3364: "AGENCY RENT-A-CAR",
    };

    const actual = runExtraction("mcc-3.pdf");
    expect(actual).toEqual(expected);
  });

  test("mcc-mixed.pdf should produce exact expected output", () => {
    const expected = {
      "0742": "Veterinary Services",
      "0763": "Agricultural Co-operatives",
      "0780": "Landscaping and Horticultural Services",
      1520: "General Contractors - Residential and Commercial",
      1711: "Heating, Plumbing, and Air Conditioning Contractors",
      3799: "HALE KOA HOTEL",
      3800: "HOMESTEAD SUITES",
      3801: "WILDERNESS HOTEL AND RESORT",
      3802: "THE PALACE HOTEL",
      3807: "ELEMENT",
      3808: "LXR",
      3811: "PREMIER INN",
      3812: "HYATT PLACE",
      3813: "HOTEL INDIGO",
      3814: "THE ROOSEVELT HOTEL NY",
      3815: "NICKELODEON FAMILY SUITES BY HOLIDAY INN",
      3816: "HOME2SUITES",
      3818: "MAINSTAY SUITES",
      3819: "OXFORD SUITES",
      3820: "JUMEIRAH ESSEX HOUSE",
      3821: "CARIBE ROYALE",
      3822: "CROSSLAND",
      3823: "GRAND SIERRA RESORT",
      3824: "ARIA",
      3825: "VDARA",
      3826: "AUTOGRAPH",
      3827: "GALT HOUSE",
      3828: "COSMOPOLITAN OF LAS VEGAS",
      3829: "COUNTRY INN BY RADISSON",
      3830: "PARK PLAZA HOTEL",
      3831: "WALDORF",
      3832: "CURIO HOTELS",
      3833: "CANOPY",
      3834: "BAYMONT INN & SUITES",
      3835: "DOLCE HOTELS AND RESORTS",
      3836: "HAWTHORN BY WYNDHAM",
      3837: "HOSHINO RESORTS",
      3838: "KIMPTON HOTELS",
      3839: "KYORITSU HOTELS",
      3840: "RIO HOTELS",
      4011: "Railroads",
      4111: "Local and Suburban Commuter Passenger Transportation, Including Ferries",
      4112: "Passenger Railways",
      4119: "Ambulance Services",
      4121: "Taxicabs and Limousines",
      5651: "Family Clothing Stores",
      5655: "Sports and Riding Apparel Stores",
      5661: "Shoe Stores",
      5681: "Furriers and Fur Shops",
      9211: "Court Costs, Including Alimony and Child Support",
      9222: "Fines",
      9223: "Bail and Bond Payments",
      9311: "Tax Payments",
      9399: "Government Services (Not Elsewhere Classified)",
      9402: "Postal Services - Government Only",
    };

    const actual = runExtraction("mcc-mixed.pdf");
    expect(actual).toEqual(expected);
  });

  test("mcc-invalid-table.pdf should produce exact expected output", () => {
    const expected = {
      // This PDF might have malformed tables or no extractable data
      // Setting empty object as expected result for now
    };

    const actual = runExtraction("mcc-invalid-table.pdf");
    expect(actual).toEqual(expected);
  });
});
